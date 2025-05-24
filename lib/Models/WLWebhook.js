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
const needle_1 = __importDefault(require("needle"));
const dotenv = __importStar(require("dotenv"));
const Helper_1 = __importDefault(require("../helper/Helper"));
const WLRedis_1 = __importDefault(require("./WLRedis"));
class WLWebhook extends Helper_1.default {
    constructor() {
        super();
        dotenv.config();
        this.needle = needle_1.default;
        this.base_url = process.env.WEBHOOK_URL;
        this.Redis = new WLRedis_1.default();
    }
    async appLogOut(sessionId) {
        try {
            var requestOptions = {
                headers: {
                    SESSION: sessionId,
                },
            };
            await (0, needle_1.default)('GET', process.env.BACKEND_URL + "/instances/status?status=disconnected", requestOptions)
                .then(function (response) { })
                .catch(function (err) {
                console.log('WLWebhook connectionConnected error: ' + err);
            });
        }
        catch (error) {
            console.log('WLWebhook Logout : ' + error);
        }
    }
    async connectionConnected(sessionId) {
        try {
            var requestOptions = {
                headers: {
                    SESSION: sessionId,
                },
            };
            await (0, needle_1.default)('GET', process.env.BACKEND_URL + "/instances/status?status=connected", requestOptions)
                .then(function (response) { })
                .catch(function (err) {
                console.log('WLWebhook connectionConnected error: ' + err);
            });
        }
        catch (error) {
            console.log('WLWebhook connectionConnected : ' + error);
        }
    }
    async MessageUpsert(sessionId, message) {
        try {
            await (0, needle_1.default)('post', process.env.WEBHOOK_URL, {
                conversation: {
                    chat_id: message.remoteJid,
                    lastTime: message.time,
                    lastMessage: message,
                },
                sessionId,
            })
                .then(function (response) { })
                .catch(function (err) {
                (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook MessageUpsert') : '';
            });
        }
        catch (error) {
            console.log('WLWebhook MessageUpsert : ' + error);
        }
    }
}
exports.default = WLWebhook;
