"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Helper_1 = __importDefault(require("../helper/Helper"));
const whatsapp_1 = require("../whatsapp");
const WLRedis_1 = __importDefault(require("./WLRedis"));
class Session extends Helper_1.default {
    constructor() {
        super();
        this.statues = ['connecting', 'connected', 'disconnecting', 'disconnected'];
        this.WLRedis = new WLRedis_1.default();
    }
    find(req, res) {
        ((0, whatsapp_1.getSession)(req.params.id)) ? this.response(res, 200, true, 'Session found.') : this.response(res, 200, true, 'Session Not found.');
    }
    status(req, res) {
        let state = ((0, whatsapp_1.getSession)(req.params.id)) ? 'connected' : 'disconnected';
        this.response(res, 200, true, '', { status: state });
    }
    add(req, res) {
        // TODO: security session created without auth 
        (this.isSessionExists(req.body.id) == 1) ?
            this.response(res, 409, false, 'Session already exists, please use another id.') : (0, whatsapp_1.createSession)(req.body.id, res);
    }
    del(req, res) {
        ((0, whatsapp_1.getSession)(req.params.id)) ? (0, whatsapp_1.getSession)(req.params.id).logout() : "";
        (0, whatsapp_1.deleteSession)(req.params.id, true);
        (0, whatsapp_1.createSession)(req.params.id, res);
        this.response(res, 200, true, 'The session has been successfully deleted.');
    }
    clearInstance(req, res) {
        ((0, whatsapp_1.getSession)(req.body.id)) ? (0, whatsapp_1.getSession)(req.body.id).logout() : "";
        this.WLRedis.deleteSession(req.body.id);
        (0, whatsapp_1.deleteSession)(req.body.id, true);
        (0, whatsapp_1.createSession)(req.body.id, res);
        this.response(res, 200, true, 'The session has been successfully deleted.');
    }
    clearData(req, res) {
        this.WLRedis.deleteSession(req.body.id);
        this.response(res, 200, true, 'The session data has been successfully deleted.');
    }
}
exports.default = Session;
