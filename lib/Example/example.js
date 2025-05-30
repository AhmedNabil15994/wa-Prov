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
const node_cache_1 = __importDefault(require("node-cache"));
const readline_1 = __importDefault(require("readline"));
const src_1 = __importStar(require("../src"));
const logger_1 = __importDefault(require("../src/Utils/logger"));
const open_1 = __importDefault(require("open"));
const fs_1 = __importDefault(require("fs"));
const logger = logger_1.default.child({});
logger.level = 'trace';
const useStore = !process.argv.includes('--no-store');
const doReplies = !process.argv.includes('--no-reply');
const usePairingCode = process.argv.includes('--use-pairing-code');
const useMobile = process.argv.includes('--mobile');
// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterCache = new node_cache_1.default();
// Read line interface
const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = useStore ? (0, src_1.makeInMemoryStore)({ logger }) : undefined;
store === null || store === void 0 ? void 0 : store.readFromFile('./baileys_store_multi.json');
// save every 10s
setInterval(() => {
    store === null || store === void 0 ? void 0 : store.writeToFile('./baileys_store_multi.json');
}, 10000);
// start a connection
const startSock = async () => {
    const { state, saveCreds } = await (0, src_1.useMultiFileAuthState)('baileys_auth_info');
    // fetch latest version of WA Web
    const { version, isLatest } = await (0, src_1.fetchLatestBaileysVersion)();
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);
    const sock = (0, src_1.default)({
        version,
        logger,
        printQRInTerminal: !usePairingCode,
        mobile: useMobile,
        auth: {
            creds: state.creds,
            /** caching makes the store faster to send/recv messages */
            keys: (0, src_1.makeCacheableSignalKeyStore)(state.keys, logger),
        },
        msgRetryCounterCache,
        generateHighQualityLinkPreview: true,
        // ignore all broadcast messages -- to receive the same
        // comment the line below out
        // shouldIgnoreJid: jid => isJidBroadcast(jid),
        // implement to handle retries & poll updates
        getMessage,
    });
    store === null || store === void 0 ? void 0 : store.bind(sock.ev);
    // Pairing code for Web clients
    if (usePairingCode && !sock.authState.creds.registered) {
        if (useMobile) {
            throw new Error('Cannot use pairing code with mobile api');
        }
        const phoneNumber = await question('Please enter your mobile phone number:\n');
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(`Pairing code: ${code}`);
    }
    // If mobile was chosen, ask for the code
    if (useMobile && !sock.authState.creds.registered) {
        const { registration } = sock.authState.creds || { registration: {} };
        if (!registration.phoneNumber) {
            registration.phoneNumber = await question('Please enter your mobile phone number:\n');
        }
        const libPhonenumber = await Promise.resolve().then(() => __importStar(require("libphonenumber-js")));
        const phoneNumber = libPhonenumber.parsePhoneNumber(registration.phoneNumber);
        if (!(phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.isValid())) {
            throw new Error('Invalid phone number: ' + registration.phoneNumber);
        }
        registration.phoneNumber = phoneNumber.format('E.164');
        registration.phoneNumberCountryCode = phoneNumber.countryCallingCode;
        registration.phoneNumberNationalNumber = phoneNumber.nationalNumber;
        const mcc = src_1.PHONENUMBER_MCC[phoneNumber.countryCallingCode];
        if (!mcc) {
            throw new Error('Could not find MCC for phone number: ' + registration.phoneNumber + '\nPlease specify the MCC manually.');
        }
        registration.phoneNumberMobileCountryCode = mcc;
        async function enterCode() {
            try {
                const code = await question('Please enter the one time code:\n');
                const response = await sock.register(code.replace(/["']/g, '').trim().toLowerCase());
                console.log('Successfully registered your phone number.');
                console.log(response);
                rl.close();
            }
            catch (error) {
                console.error('Failed to register your phone number. Please try again.\n', error);
                await askForOTP();
            }
        }
        async function enterCaptcha() {
            const response = await sock.requestRegistrationCode({ ...registration, method: 'captcha' });
            const path = __dirname + '/captcha.png';
            fs_1.default.writeFileSync(path, Buffer.from(response.image_blob, 'base64'));
            (0, open_1.default)(path);
            const code = await question('Please enter the captcha code:\n');
            fs_1.default.unlinkSync(path);
            registration.captcha = code.replace(/["']/g, '').trim().toLowerCase();
        }
        async function askForOTP() {
            if (!registration.method) {
                let code = await question('How would you like to receive the one time code for registration? "sms" or "voice"\n');
                code = code.replace(/["']/g, '').trim().toLowerCase();
                if (code !== 'sms' && code !== 'voice') {
                    return await askForOTP();
                }
                registration.method = code;
            }
            try {
                await sock.requestRegistrationCode(registration);
                await enterCode();
            }
            catch (error) {
                console.error('Failed to request registration code. Please try again.\n', error);
                if ((error === null || error === void 0 ? void 0 : error.reason) === 'code_checkpoint') {
                    await enterCaptcha();
                }
                await askForOTP();
            }
        }
        askForOTP();
    }
    const sendMessageWTyping = async (msg, jid) => {
        await sock.presenceSubscribe(jid);
        await (0, src_1.delay)(500);
        await sock.sendPresenceUpdate('composing', jid);
        await (0, src_1.delay)(2000);
        await sock.sendPresenceUpdate('paused', jid);
        await sock.sendMessage(jid, msg);
    };
    // the process function lets you process all events that just occurred
    // efficiently in a batch
    sock.ev.process(
    // events is a map for event name => event data
    async (events) => {
        var _a, _b;
        // something about the connection changed
        // maybe it closed, or we received all offline message or connection opened
        if (events['connection.update']) {
            const update = events['connection.update'];
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                // reconnect if not logged out
                if (((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== src_1.DisconnectReason.loggedOut) {
                    startSock();
                }
                else {
                    console.log('Connection closed. You are logged out.');
                }
            }
            console.log('connection update', update);
        }
        // credentials updated -- save them
        if (events['creds.update']) {
            await saveCreds();
        }
        if (events['labels.association']) {
            console.log(events['labels.association']);
        }
        if (events['labels.edit']) {
            console.log(events['labels.edit']);
        }
        if (events.call) {
            console.log('recv call event', events.call);
        }
        // history received
        if (events['messaging-history.set']) {
            const { chats, contacts, messages, isLatest } = events['messaging-history.set'];
            console.log(`recv ${chats.length} chats, ${contacts.length} contacts, ${messages.length} msgs (is latest: ${isLatest})`);
        }
        // received a new message
        if (events['messages.upsert']) {
            const upsert = events['messages.upsert'];
            console.log('recv messages ', JSON.stringify(upsert, undefined, 2));
            if (upsert.type === 'notify') {
                for (const msg of upsert.messages) {
                    if (!msg.key.fromMe && doReplies) {
                        console.log('replying to', msg.key.remoteJid);
                        await sock.readMessages([msg.key]);
                        await sendMessageWTyping({ text: 'Hello there!' }, msg.key.remoteJid);
                    }
                }
            }
        }
        // messages updated like status delivered, message deleted etc.
        if (events['messages.update']) {
            console.log(JSON.stringify(events['messages.update'], undefined, 2));
            for (const { key, update } of events['messages.update']) {
                if (update.pollUpdates) {
                    const pollCreation = await getMessage(key);
                    if (pollCreation) {
                        console.log('got poll update, aggregation: ', (0, src_1.getAggregateVotesInPollMessage)({
                            message: pollCreation,
                            pollUpdates: update.pollUpdates,
                        }));
                    }
                }
            }
        }
        if (events['message-receipt.update']) {
            console.log(events['message-receipt.update']);
        }
        if (events['messages.reaction']) {
            console.log(events['messages.reaction']);
        }
        if (events['presence.update']) {
            console.log(events['presence.update']);
        }
        if (events['chats.update']) {
            console.log(events['chats.update']);
        }
        if (events['contacts.update']) {
            for (const contact of events['contacts.update']) {
                if (typeof contact.imgUrl !== 'undefined') {
                    const newUrl = contact.imgUrl === null
                        ? null
                        : await sock.profilePictureUrl(contact.id).catch(() => null);
                    console.log(`contact ${contact.id} has a new profile pic: ${newUrl}`);
                }
            }
        }
        if (events['chats.delete']) {
            console.log('chats deleted ', events['chats.delete']);
        }
    });
    return sock;
    async function getMessage(key) {
        if (store) {
            const msg = await store.loadMessage(key.remoteJid, key.id);
            return (msg === null || msg === void 0 ? void 0 : msg.message) || undefined;
        }
        // only if store is present
        return src_1.proto.Message.fromObject({});
    }
};
startSock();
