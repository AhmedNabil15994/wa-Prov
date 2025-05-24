"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const Helper_1 = __importDefault(require("../helper/Helper"));
const whatsapp_1 = require("../whatsapp");
const axios_1 = __importDefault(require("axios"));
const WLRedis_1 = __importDefault(require("./WLRedis"));
class Instance extends Helper_1.default {
    constructor(req, res) {
        var _a;
        super();
        // Connect to Redis
        this.WLredis = new WLRedis_1.default();
        // set Session & target
        this.session = (res.locals.sessionId) ? (0, whatsapp_1.getSession)(res.locals.sessionId) : '';
        this.session_id = res.locals.sessionId ? res.locals.sessionId : ((_a = req.query.id) !== null && _a !== void 0 ? _a : req.params.id);
        if (req.body.phone || req.body.chat) {
            this.target = req.body.phone ? this.formatPhone(req.body.phone) : this.formatGroup(req.body.chat);
        }
    }
    async me(req, res) {
        try {
            let dataObj = {};
            let phone, image, presence, status, profile;
            if (this.session) {
                dataObj['me'] = this.session.user;
                phone = this.session.user.id.replace('@s.whatsapp.net', '').split(':')[0];
                try {
                    presence = await this.session.presenceSubscribe(this.formatPhone(phone));
                    status = await this.session.fetchStatus(this.formatPhone(phone));
                    profile = await this.session.getBusinessProfile(this.formatPhone(phone));
                }
                catch (_a) { }
                try {
                    image = await this.session.profilePictureUrl(this.formatPhone(phone), 'image');
                }
                catch (_b) { }
            }
            else {
                if ((0, fs_1.existsSync)('./sessions/md_' + this.session_id + '/creds.json')) {
                    let dataStore = await JSON.parse((0, fs_1.readFileSync)('./sessions/md_' + this.session_id + '/creds.json', 'utf8'));
                    if (dataStore.me) {
                        dataObj['me'] = dataStore.me;
                        phone = dataStore.me.id.replace('@s.whatsapp.net', '').split(':')[0];
                    }
                }
            }
            if (dataObj.hasOwnProperty('me')) {
                dataObj['me'] = {
                    phone: phone,
                    name: dataObj['me']['name']
                };
                dataObj['image'] = image;
                dataObj['presence'] = presence;
                dataObj['status'] = status;
                dataObj['isBussines'] = profile ? 1 : 0;
                dataObj['businessProfile'] = profile ? profile : null;
                if (profile) {
                    delete dataObj['businessProfile']['wid'];
                }
            }
            return this.response(res, 200, true, 'User data has been generated Successfully', dataObj);
        }
        catch (_c) {
            return this.response(res, 500, false, 'Failed to get user Data.');
        }
    }
    async updateProfilePicture(req, res) {
        const imageURL = req.body.imageURL;
        try {
            const exists = await this.onWhatsApp(this.session, this.target);
            if (!exists) {
                return this.response(res, 400, false, 'This chat does not exist.');
            }
            let responseFile = await axios_1.default.get(imageURL, { responseType: 'arraybuffer' });
            const updated = await this.session.updateProfilePicture(this.target, responseFile.data);
            return this.response(res, 200, true, 'User profile picture updated Successfully', {
                updated: true,
                url: imageURL
            });
        }
        catch (_a) {
            return this.response(res, 500, false, 'Failed to set user profile picture.');
        }
    }
    async updatePresence(req, res) {
        const presenceText = req.body.presence;
        try {
            const exists = await this.onWhatsApp(this.session, this.target);
            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.');
            }
            const presence = await this.session.sendPresenceUpdate(presenceText, this.target);
            return this.response(res, 200, true, 'User presence updated Successfully', {
                updated: true,
                presence: presenceText == 'composing' ? 'typing' : presenceText
            });
        }
        catch (_a) {
            return this.response(res, 500, false, 'Failed to update user presence.');
        }
    }
    async updateProfileName(req, res) {
        const name = req.body.name;
        try {
            const presence = await this.session.updateProfileName(name);
            return this.response(res, 200, true, 'User profile name updated Successfully', {
                updated: true,
                pushName: name
            });
        }
        catch (_a) {
            return this.response(res, 500, false, 'Failed to update user profile name.');
        }
    }
    async updateProfileStatus(req, res) {
        const status = req.body.status;
        try {
            const presence = await this.session.updateProfileStatus(status);
            return this.response(res, 200, true, 'User profile status updated Successfully', {
                updated: true,
                status: status
            });
        }
        catch (_a) {
            return this.response(res, 500, false, 'Failed to update user profile status.');
        }
    }
    async fetchContacts(req, res) {
        var _a, _b;
        try {
            let contacts = await this.WLredis.getData(this.session_id, 'contacts');
            let contactsArr = [];
            await Promise.all(Object.values(contacts).map(async (contact) => {
                try {
                    contact.image = await this.session.profilePictureUrl(contact.id);
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('fetching contact image error', contact.id) : '';
                }
                contactsArr.push(contact);
            }));
            let page = (_a = req.query.page) !== null && _a !== void 0 ? _a : 1;
            let page_size = (_b = req.query.page_size) !== null && _b !== void 0 ? _b : 100;
            let paginatedData = await this.paginateData(contactsArr, page, page_size);
            this.response(res, 200, true, 'User Contacts Found !!!', paginatedData);
        }
        catch (_c) {
            this.response(res, 500, false, 'Failed to load user contacts.');
        }
    }
    async getContactByID(req, res) {
        try {
            let selected = await this.WLredis.getOne(this.session_id, this.target, 'contacts');
            let image = '';
            let chatObj;
            if (selected.hasOwnProperty('id')) {
                try {
                    image = await this.session.profilePictureUrl(selected['id']);
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('fetching contact image error', selected['id']) : '';
                }
                chatObj = selected;
                chatObj['image'] = image;
            }
            this.response(res, 200, true, 'Contact Found !!!', chatObj);
        }
        catch (error) {
            this.response(res, 500, false, 'Failed to load Contact : ' + error);
        }
    }
}
exports.default = Instance;
