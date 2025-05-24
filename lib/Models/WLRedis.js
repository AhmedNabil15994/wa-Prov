"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const redis_json_1 = __importDefault(require("redis-json"));
const Helper_1 = __importDefault(require("../helper/Helper"));
class WLRedis extends Helper_1.default {
    constructor() {
        super();
        if (!this.hasOwnProperty('redis')) {
            this.redis = new ioredis_1.default({
                port: 6379,
                host: "127.0.0.1", // Redis host
                // username: "default", // needs Redis >= 6
                // password: "my-top-secret",
                // db: 0, // Defaults to 0
            });
        }
    }
    // instance = [
    //          contact,product,label,reply,chat,message
    //          (contacts,products,labels,replies,chats,messages)  => DB instances
    //]
    //
    //wlInterface = [WLContactInterface,WLProductInterface,WLLabelInterface,WLReplyInterface,WLConversationInterface,WLMessageInterface]
    // Determine Instance From DB
    getInstanceName(dbInstance, single = 1) {
        if (dbInstance == 'contacts') {
            return single ? 'contact' : dbInstance;
        }
        else if (dbInstance == 'products') {
            return single ? 'product' : dbInstance;
        }
        else if (dbInstance == 'labels') {
            return single ? 'label' : dbInstance;
        }
        else if (dbInstance == 'replies') {
            return single ? 'reply' : dbInstance;
        }
        else if (dbInstance == 'chats') {
            return single ? 'chat' : dbInstance;
        }
        else if (dbInstance == 'messages') {
            return single ? 'message' : dbInstance;
        }
    }
    // Set One
    async setOne(session_id, data, dbInstance) {
        var _a;
        try {
            let instance = this.getInstanceName(dbInstance, 1);
            const jsonCache = new redis_json_1.default(this.redis, { prefix: `${session_id}:${dbInstance}:` });
            return (_a = jsonCache.set(data.id, data)) !== null && _a !== void 0 ? _a : null;
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis Set" + this.getInstanceName(dbInstance, 1) + " " + error) : '';
        }
    }
    // Get One
    async getOne(session_id, id, dbInstance) {
        try {
            let dataObj = await this.redis.hgetall(`${session_id}:${dbInstance}:${id}`);
            return dataObj !== null && dataObj !== void 0 ? dataObj : null;
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getOne of " + dbInstance + " " + error) : '';
        }
    }
    // Update One
    async updateOne(session_id, instanceData, dbInstance) {
        try {
            let dataObj;
            if (dbInstance == 'contacts' || dbInstance == 'contact') {
                dataObj = await this.getOne(session_id, instanceData.id, dbInstance);
                if (instanceData.hasOwnProperty('notify')) {
                    dataObj['notify'] = instanceData.notify;
                }
                if (instanceData.hasOwnProperty('image')) {
                    dataObj['image'] = instanceData.image;
                }
                if (instanceData.hasOwnProperty('name')) {
                    dataObj['name'] = instanceData.name;
                }
            }
            else if (dbInstance == 'chats' || dbInstance == 'chat') {
                dataObj = await this.getOne(session_id, instanceData.id, dbInstance);
                if (instanceData.hasOwnProperty('conversationTimestamp')) {
                    dataObj['last_time'] = instanceData.conversationTimestamp;
                }
                if (instanceData.hasOwnProperty('image')) {
                    dataObj['image'] = instanceData.image;
                }
                if (instanceData.hasOwnProperty('archive')) {
                    dataObj['archived'] = instanceData.archive == true || instanceData.archive == "true";
                }
                if (instanceData.hasOwnProperty('pin')) {
                    dataObj['pinned'] = instanceData.pin == null ? false : instanceData.pin;
                }
                if (instanceData.hasOwnProperty('unreadCount')) {
                    dataObj['unreadCount'] = instanceData.unreadCount;
                }
                if (instanceData.hasOwnProperty('mute')) {
                    if (instanceData.mute == null) {
                        dataObj['muted'] = false;
                    }
                    else {
                        dataObj['muted'] = true;
                        dataObj['mutedUntil'] = new Date(instanceData.mute).toUTCString();
                    }
                }
                if (instanceData.hasOwnProperty('labeled')) {
                    dataObj['labels.' + instanceData.label_id] = instanceData.labeled;
                }
            }
            else if (dbInstance == 'messages' || dbInstance == 'message') {
                let messageObj, message_id;
                if (instanceData.hasOwnProperty('labeled')) {
                    message_id = instanceData.id;
                    messageObj = await this.getOne(session_id, message_id, 'messages');
                    messageObj['labeled'] = instanceData.labeled ? instanceData.label_id : 0;
                    messageObj['labels.' + instanceData.label_id] = instanceData.labeled;
                }
                else if (instanceData.update.hasOwnProperty('starred')) {
                    message_id = instanceData.hasOwnProperty('key') ? instanceData.key.id : instanceData.id;
                    messageObj = await this.getOne(session_id, message_id, 'messages');
                    messageObj['starred'] = instanceData.update.starred;
                }
                else {
                    message_id = instanceData.hasOwnProperty('key') ? instanceData.key.id : instanceData.id;
                    messageObj = await this.getOne(session_id, message_id, 'messages');
                    let statusInt = instanceData.update.hasOwnProperty('message') ? 6 : instanceData.update.status;
                    let statusText = this.formatStatusText(statusInt);
                    messageObj['status'] = statusInt;
                    messageObj['statusText'] = statusText;
                }
                dataObj = messageObj;
            }
            await this.setOne(session_id, dataObj, dbInstance);
            return dataObj !== null && dataObj !== void 0 ? dataObj : null;
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis Update" + this.getInstanceName(dbInstance, 1) + " " + error) : '';
        }
    }
    // Delete One
    async deleteOne(session_id, id, dbInstance) {
        var _a;
        try {
            let instance = this.getInstanceName(dbInstance, 1);
            const jsonCache = new redis_json_1.default(this.redis, { prefix: `${session_id}:${dbInstance}:${id}` });
            return (_a = jsonCache.clearAll()) !== null && _a !== void 0 ? _a : null;
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis Delete" + this.getInstanceName(dbInstance, 1) + " " + error) : '';
        }
    }
    // Set Data
    async setData(session_id, data, dbInstance, sock = null) {
        try {
            let instance = this.getInstanceName(dbInstance, 0);
            const jsonCache = new redis_json_1.default(this.redis, { prefix: `${session_id}:${dbInstance}:` });
            if (dbInstance == 'messages') {
                if (data && data !== "undefined" && data !== null) {
                    data.forEach(async (element) => {
                        if (element.hasOwnProperty('message')) {
                            const messageType = Object.keys(element.message)[0];
                            if (messageType != 'protocolMessage') {
                                element = await this.reformatMessageObj(session_id, element, messageType, sock);
                                await jsonCache.set(element.id, element);
                            }
                        }
                        else {
                            await jsonCache.set(element.id, element);
                        }
                    });
                }
            }
            else {
                data.forEach(element => {
                    jsonCache.set(element.id, element);
                });
            }
            return jsonCache ? true : null;
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis Set" + this.getInstanceName(dbInstance, 0) + " " + error) : '';
        }
    }
    // Get Data
    async getData(session_id, dbInstance) {
        try {
            let dataArr = [];
            const keys = await this.getKeys(session_id, dbInstance);
            await Promise.all(Object.values(keys).map(async (element) => {
                dataArr.push(await this.redis.hgetall(element));
            }));
            return dataArr;
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis Get" + dbInstance + " " + error) : '';
        }
    }
    // Delete Data
    async deleteData(session_id, dbInstance) {
        var _a;
        try {
            const jsonCache = new redis_json_1.default(this.redis, { prefix: `${session_id}:messages:` });
            return (_a = jsonCache.clearAll()) !== null && _a !== void 0 ? _a : null;
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis Delete" + dbInstance + " " + error) : '';
        }
    }
    // get all  
    async getKeys(session_id, key) {
        let returned_keys = [];
        try {
            let keys = await this.redis.keys(`${session_id}:${key}:*`);
            keys.forEach((element) => {
                if (!element.endsWith("_t")) {
                    returned_keys.push(element);
                }
            });
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getKeys" + error) : '';
        }
        return returned_keys;
    }
    async getLastMessageInChat(session_id, chatId, type = 1) {
        let all_messages = await this.getData(session_id, 'messages');
        let messages = [];
        if (all_messages) {
            await Promise.all(Object.values(all_messages).map(async (element) => {
                if (element.remoteJid == chatId) {
                    messages.push(element);
                }
            }));
            await messages.sort(function (a, b) {
                return Number(b.time) > Number(a.time) ? -1 : 1;
            });
            messages.reverse();
            let message = messages[0];
            if (type == 2) {
                return message;
            }
            return {
                key: {
                    remoteJid: message.remoteJid,
                    fromMe: message.fromMe == 'true' ? true : false,
                    id: message.id,
                },
                messageTimestamp: Number(message.time),
            };
        }
    }
    async getLastMessagesInChat(session_id, chatId) {
        let all_messages = await this.getData(session_id, 'messages');
        let messages = [];
        let time = 0;
        if (all_messages) {
            await Promise.all(Object.values(all_messages).map(async (element) => {
                if (element.remoteJid == chatId) {
                    time = parseInt(element.time);
                    // message = element;
                    messages.push({
                        key: {
                            remoteJid: element.remoteJid,
                            fromMe: element.fromMe == 'true' ? true : false,
                            id: element.id,
                            participant: null,
                        },
                        messageTimestamp: time,
                    });
                }
            }));
            return messages;
        }
    }
    async deleteSession(session_id) {
        const jsonCache = new redis_json_1.default(this.redis, { prefix: `${session_id}:` });
        jsonCache.clearAll();
        (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis deleteSession') : '';
    }
    async empty(session_id, instance) {
        const jsonCache = new redis_json_1.default(this.redis, { prefix: `${session_id}:${instance}:` });
        jsonCache.clearAll();
        (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis delete Instance Data') : '';
    }
}
exports.default = WLRedis;
