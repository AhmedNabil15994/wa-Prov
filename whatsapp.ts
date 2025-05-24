import makeWASocket, {
    Browsers,
    delay,
    DisconnectReason,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
} from '@whiskeysockets/baileys'
import getPollUpdateMessages from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import crypto from 'crypto';
import {
    readdir,
    rmSync,
} from 'fs'
import { join } from 'path'
import pino from 'pino'
import { toDataURL } from 'qrcode'
import response from './response'
import WLRedis from './Models/WLRedis'
import WLWebhook from './Models/WLWebhook'
import Helper from './helper/Helper'
// import { PollUpdateDecrypt } from './PollUpdateDecrypt'
import PollUpdateDecrypt from './PollUpdateDecrypt'
// External map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const sessions = new Map()
const fs = require('fs');

const sessionsDir = (sessionId = '') => {
    return join('sessions', sessionId ? (sessionId.startsWith('md_') ? sessionId : sessionId + '.json') : '')
}

let Redis = new WLRedis();
let Webhook = new WLWebhook();
let WLHelper = new Helper();

const getSession = (sessionId) => {
    return sessions.get(sessionId) &&  fs.readdirSync(sessionsDir('md_' +sessionId)).length !== 0 ? sessions.get(sessionId) : null
}

const init = () => {
    readdir(sessionsDir(), (err, files) => {
        for (const file of files) {
            if (file.startsWith('md_')) {
                let sessionId = file.replace('md_', '');
                createSession(sessionId)
            }
        }
    })
}


const deleteSession = (sessionId, clearInstance = false) => {
    const sessionFile = 'md_' + sessionId;
    const rmOptions = { recursive: true }
    fs.rm(sessionsDir(sessionFile), rmOptions, ()=>{
        sessions.delete(sessionId)
    });
}


const createSession = async (sessionId, res = null) => {
    try {
        const sessionFile = 'md_' + sessionId
        const logger = pino({ level: 'error' });
        // Save every 10s
        const { state, saveCreds } = await useMultiFileAuthState(sessionsDir(sessionFile))
        // Fetch latest version of WA Web
        const { version } = await fetchLatestBaileysVersion()

        const sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: false,
            markOnlineOnConnect: true,
            auth: state,
            browser: Browsers.macOS('Desktop'),
            syncFullHistory: true,
            getMessage: async key => {
                (process.env.DEBUG_MODE == 'true') ? console.log('getMessage Problem :', key) : '';
                const msg = await Redis.getOne(sessionId, key.id,'messages');
                if (msg) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('getMessage Problem Fixed  Message is :', msg.body) : '';
                    return {
                        conversation: msg.body
                    }
                }
                // only if store is present
                return {
                    conversation: '  '
                }
            }
        })

        sessions.set(sessionId, { ...sock })
        sock.ev.process(
            // events is a map for event name => event data
            async (events) => {
                // something about the connection changed
                // maybe it closed, or we received all offline message or connection opened
                // '401': 'loggedOut',
                // '408': 'timedOut',
                // '411': 'multideviceMismatch',
                // '428': 'connectionClosed',
                // '440': 'connectionReplaced',
                // '500': 'badSession',
                // '515': 'restartRequired',

                if (events['connection.update']) {
                    const update = events['connection.update'];
                    const { connection, lastDisconnect } = update;
                    try {
                        if (connection === 'close') {
                            const reason = (lastDisconnect?.error as Boom)?.output?.statusCode ;
                            if(reason == 401){
                                await Webhook.appLogOut(sessionId);
                                deleteSession(sessionId, true)
                            }else{
                                if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
                                    createSession(sessionId, res);
                                }
                            }
                        }
                        // if (connection === 'close') {
                        // 	const reason = (lastDisconnect?.error as Boom)?.output?.statusCode ;
                        // 	if (reason === 515 || reason === 408  /*|| reason === 440 || reason == 500 */) {
                        // 		createSession(sessionId, res);
                        // 	} else if(reason == 401 || reason == 411 || reason === 428) {
                        // 		await Webhook.appLogOut(sessionId);
                        // 		deleteSession(sessionId, true)
                        // 	}
                        // }
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('update data : ', update) : '';
                        (process.env.DEBUG_MODE == 'true') ? console.log('connection.update error', e) : '';
                    }
                    try {
                        if (update.qr && update.qr !== 'undefined' && res && res !== null) {
                            if (res !== null) {
                                const qr = await toDataURL(update.qr)
                                response(res, 200, true, 'QR code received, please scan the QR code.', { qr })
                            }
                        }
                    } catch (e) {
                        // (process.env.DEBUG_MODE == 'true') ? console.log('Get QR Error : ', e) : '';
                    }
                }

                // credentials updated -- save them
                if (events['creds.update']) {
                    try {
                        await saveCreds()
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('creds.update error', e) : '';
                    }
                }

                // message history received
                if(events['messaging-history.set']){
                   
                }

                // received a new message
                if (events['messages.upsert']) {
                    const m = events['messages.upsert']
                    try {
                        const msg = m.messages[0]

                        if (!msg.message) {
                            return
                        } // If there is no text or media message


                        const messageType = Object.keys(msg.message)[0] // Get what type of message it is -- text, image, video
                        if (msg.key.remoteJid !== 'status@broadcast' && messageType != 'protocolMessage') {
                            const messageObj = await WLHelper.reformatMessageObj(sessionId, msg, messageType, sock)
                            if (messageObj) {
                                await Webhook.MessageUpsert(sessionId, messageObj);
                                // const dialogObj = await Redis.getOne(sessionId, msg.key.remoteJid,'chats');
                                // if(!dialogObj.hasOwnProperty('id')){
                                //     await Redis.setOne(sessionId,{
                                //         id: msg.key.remoteJid,
                                //         unreadCount: 1,
                                //         readOnly: false,
                                //         conversationTimestamp: new Date().getTime(),
                                //         last_time: new Date().getTime(),
                                //         notSpam: true,
                                //         archived: false,
                                //         pinned: false,
                                //     },'chats')
                                // }
                            }
                        }
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('error on upsert Message: ', m.messages[0]) : '';
                        (process.env.DEBUG_MODE == 'true') ? console.log('error on upsert', e.message) : '';
                    }
                }

                // messages updated like status delivered, message deleted etc.
                if (events['messages.update']) {
                    const m = events['messages.update'];
                    m.forEach(async function(item){
                        try {
                        } catch (e) {
                            (process.env.DEBUG_MODE == 'true') ? console.log('messages.update error', e) : '';
                        }
                    });
                }


                // Dialog Last updates
                if (events['chats.update']) {
                    const m = events['chats.update'];
                    m.forEach(async function(item){
                        try {
                        } catch (e) {
                            (process.env.DEBUG_MODE == 'true') ? console.log('chats.update error', e) : '';
                        }
                    });
                }

                if (events['chats.delete']) {
                    const m = events['chats.delete']
                    m.forEach(async function(item){
                        try {
                        } catch (e) {
                            (process.env.DEBUG_MODE == 'true') ? console.log('chats.delete error', e) : '';
                        }
                    });
                }

                if (events['contacts.upsert']) {
                    try {
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('contacts.upsert error', e) : '';
                    }
                }

                if (events['contacts.update']) {
                    try {
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('contacts.update error', e) : '';
                    }
                }

                if (events['message-receipt.update']) {
                    // console.log(events['message-receipt.update'])
                }

                if (events['messages.media-update']) {
                    // console.log(events['messages.media-update'])
                }

                if (events['messages.reaction']) {
                    // console.log(events['messages.reaction'])
                }

                if (events['messages.delete']) {
                    // console.log(events['messages.delete'])
                }

                if (events['blocklist.set']) {
                    // console.log(events['blocklist.set'])
                }

                if (events['blocklist.update']) {
                    // console.log(events['blocklist.update'])
                }

                if (events['presence.update']) {
                    try {
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('contacts.update error', e) : '';
                    }
                }

                if (events['groups.upsert']) {
                    const m = events['groups.upsert'];
                    try {
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('groups.upsert error', e) : '';
                    }
                }

                if (events['group.update']) {
                    const m = events['group.update'];
                    try {
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('groups.update error', e) : '';
                    }
                }

                if (events['group-participants.update']) {
                    const m = events['group-participants.update'];
                    try {
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('group-participants.update error', e) : '';
                    }
                }

                if (events['call']) {
                    const m = events['call'];
                    try {
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('group-participants.update error', e) : '';
                    }
                }

                //labels.edit
                //labels.association
                if(events['labels.set']){
                    const m = events['labels.set']
                    try {
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('labels.set error', e) : '';
                    }
                }

                if(events['labels.delete']){
                    const m = events['labels.delete']
                    try {
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('labels.delete error', e) : '';
                    }
                }

                if(events['quick_reply.set']){
                    const m = events['quick_reply.set']
                    try {
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('quick_reply.set error', e) : '';
                    }
                }

                if(events['quick_reply.delete']){
                    const m = events['quick_reply.delete']
                    try {
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('quick_reply.delete error', e) : '';
                    }
                }
            }
        )
        // TODO: Send when any message or any action doing in whatsapp
        sock.ws.on('CB:iq,,pair-success', async (stanza) => {
            try {
                await Webhook.connectionConnected(sessionId);
            } catch (e) {
                (process.env.DEBUG_MODE == 'true') ? console.log('CB:iq,,pair-success error', e) : '';
            }
        })
    } catch (error) {
        console.log("createSession : " + error);
    }
}

export {
    createSession,
    getSession,
    deleteSession,
    init,
    sessionsDir
}