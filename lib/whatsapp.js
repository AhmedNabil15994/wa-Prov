"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionsDir = exports.init = exports.deleteSession = exports.getSession = exports.createSession = void 0;
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const fs_1 = require("fs");
const path_1 = require("path");
const pino_1 = __importDefault(require("pino"));
const qrcode_1 = require("qrcode");
const response_1 = __importDefault(require("./response"));
const WLRedis_1 = __importDefault(require("./Models/WLRedis"));
const WLWebhook_1 = __importDefault(require("./Models/WLWebhook"));
const Helper_1 = __importDefault(require("./helper/Helper"));
// External map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const sessions = new Map();
const fs = require('fs');
const sessionsDir = (sessionId = '') => {
    return (0, path_1.join)('sessions', sessionId ? (sessionId.startsWith('md_') ? sessionId : sessionId + '.json') : '');
};
exports.sessionsDir = sessionsDir;
let Redis = new WLRedis_1.default();
let Webhook = new WLWebhook_1.default();
let WLHelper = new Helper_1.default();
const getSession = (sessionId) => {
    return sessions.get(sessionId) && fs.readdirSync(sessionsDir('md_' + sessionId)).length !== 0 ? sessions.get(sessionId) : null;
};
exports.getSession = getSession;
const init = () => {
    (0, fs_1.readdir)(sessionsDir(), (err, files) => {
        for (const file of files) {
            if (file.startsWith('md_')) {
                let sessionId = file.replace('md_', '');
                createSession(sessionId);
            }
        }
    });
};
exports.init = init;
const deleteSession = (sessionId, clearInstance = false) => {
    const sessionFile = 'md_' + sessionId;
    const rmOptions = { recursive: true };
    fs.rm(sessionsDir(sessionFile), rmOptions, () => {
        sessions.delete(sessionId);
    });
};
exports.deleteSession = deleteSession;
const createSession = async (sessionId, res = null) => {
    try {
        const sessionFile = 'md_' + sessionId;
        const logger = (0, pino_1.default)({ level: 'error' });
        // Save every 10s
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(sessionsDir(sessionFile));
        // Fetch latest version of WA Web
        const { version } = await (0, baileys_1.fetchLatestBaileysVersion)();
        const sock = (0, baileys_1.default)({
            version,
            logger,
            printQRInTerminal: false,
            markOnlineOnConnect: true,
            auth: state,
            browser: baileys_1.Browsers.macOS('Desktop'),
            syncFullHistory: true,
            getMessage: async (key) => {
                (process.env.DEBUG_MODE == 'true') ? console.log('getMessage Problem :', key) : '';
                const msg = await Redis.getOne(sessionId, key.id, 'messages');
                if (msg) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('getMessage Problem Fixed  Message is :', msg.body) : '';
                    return {
                        conversation: msg.body
                    };
                }
                // only if store is present
                return {
                    conversation: '  '
                };
            }
        });
        sessions.set(sessionId, { ...sock });
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
            var _a, _b, _c, _d;
            if (events['connection.update']) {
                const update = events['connection.update'];
                const { connection, lastDisconnect } = update;
                try {
                    if (connection === 'close') {
                        const reason = (_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode;
                        if (reason == 401) {
                            await Webhook.appLogOut(sessionId);
                            deleteSession(sessionId, true);
                        }
                        else {
                            if (((_d = (_c = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _c === void 0 ? void 0 : _c.output) === null || _d === void 0 ? void 0 : _d.statusCode) !== baileys_1.DisconnectReason.loggedOut) {
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
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('update data : ', update) : '';
                    (process.env.DEBUG_MODE == 'true') ? console.log('connection.update error', e) : '';
                }
                try {
                    if (update.qr && update.qr !== 'undefined' && res && res !== null) {
                        if (res !== null) {
                            const qr = await (0, qrcode_1.toDataURL)(update.qr);
                            (0, response_1.default)(res, 200, true, 'QR code received, please scan the QR code.', { qr });
                        }
                    }
                }
                catch (e) {
                    // (process.env.DEBUG_MODE == 'true') ? console.log('Get QR Error : ', e) : '';
                }
            }
            // credentials updated -- save them
            if (events['creds.update']) {
                try {
                    await saveCreds();
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('creds.update error', e) : '';
                }
            }
            // message history received
            if (events['messaging-history.set']) {
            }
            // received a new message
            if (events['messages.upsert']) {
                const m = events['messages.upsert'];
                try {
                    const msg = m.messages[0];
                    if (!msg.message) {
                        return;
                    } // If there is no text or media message
                    const messageType = Object.keys(msg.message)[0]; // Get what type of message it is -- text, image, video
                    if (msg.key.remoteJid !== 'status@broadcast' && messageType != 'protocolMessage') {
                        const messageObj = await WLHelper.reformatMessageObj(sessionId, msg, messageType, sock);
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
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('error on upsert Message: ', m.messages[0]) : '';
                    (process.env.DEBUG_MODE == 'true') ? console.log('error on upsert', e.message) : '';
                }
            }
            // messages updated like status delivered, message deleted etc.
            if (events['messages.update']) {
                const m = events['messages.update'];
                m.forEach(async function (item) {
                    try {
                    }
                    catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('messages.update error', e) : '';
                    }
                });
            }
            // Dialog Last updates
            if (events['chats.update']) {
                const m = events['chats.update'];
                m.forEach(async function (item) {
                    try {
                    }
                    catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('chats.update error', e) : '';
                    }
                });
            }
            if (events['chats.delete']) {
                const m = events['chats.delete'];
                m.forEach(async function (item) {
                    try {
                    }
                    catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('chats.delete error', e) : '';
                    }
                });
            }
            if (events['contacts.upsert']) {
                try {
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('contacts.upsert error', e) : '';
                }
            }
            if (events['contacts.update']) {
                try {
                }
                catch (e) {
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
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('contacts.update error', e) : '';
                }
            }
            if (events['groups.upsert']) {
                const m = events['groups.upsert'];
                try {
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('groups.upsert error', e) : '';
                }
            }
            if (events['group.update']) {
                const m = events['group.update'];
                try {
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('groups.update error', e) : '';
                }
            }
            if (events['group-participants.update']) {
                const m = events['group-participants.update'];
                try {
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('group-participants.update error', e) : '';
                }
            }
            if (events['call']) {
                const m = events['call'];
                try {
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('group-participants.update error', e) : '';
                }
            }
            //labels.edit
            //labels.association
            if (events['labels.set']) {
                const m = events['labels.set'];
                try {
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('labels.set error', e) : '';
                }
            }
            if (events['labels.delete']) {
                const m = events['labels.delete'];
                try {
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('labels.delete error', e) : '';
                }
            }
            if (events['quick_reply.set']) {
                const m = events['quick_reply.set'];
                try {
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('quick_reply.set error', e) : '';
                }
            }
            if (events['quick_reply.delete']) {
                const m = events['quick_reply.delete'];
                try {
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('quick_reply.delete error', e) : '';
                }
            }
        });
        // TODO: Send when any message or any action doing in whatsapp
        sock.ws.on('CB:iq,,pair-success', async (stanza) => {
            try {
                await Webhook.connectionConnected(sessionId);
            }
            catch (e) {
                (process.env.DEBUG_MODE == 'true') ? console.log('CB:iq,,pair-success error', e) : '';
            }
        });
    }
    catch (error) {
        console.log("createSession : " + error);
    }
};
exports.createSession = createSession;
