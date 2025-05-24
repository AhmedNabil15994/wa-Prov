"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const requestValidator_1 = __importDefault(require("../Middleware/requestValidator"));
const sessionValidator_1 = __importDefault(require("../Middleware/sessionValidator"));
const Instance_1 = __importDefault(require("../Models/Instance"));
const router = (0, express_1.Router)();
router.get('/me', (0, express_validator_1.query)('id').notEmpty(), requestValidator_1.default, sessionValidator_1.default, (req, res) => new Instance_1.default(req, res).me(req, res));
router.post('/updateProfilePicture', (0, express_validator_1.query)('id').notEmpty(), (0, express_validator_1.body)('phone').notEmpty(), (0, express_validator_1.body)('chat').if((0, express_validator_1.body)('phone').not().exists()).notEmpty(), (0, express_validator_1.body)('imageURL').notEmpty(), requestValidator_1.default, sessionValidator_1.default, (req, res) => new Instance_1.default(req, res).updateProfilePicture(req, res));
router.post('/updatePresence', (0, express_validator_1.query)('id').notEmpty(), (0, express_validator_1.body)('phone').notEmpty(), (0, express_validator_1.body)('presence').isIn(['unavailable', 'available', 'composing', 'recording', 'paused']).notEmpty(), requestValidator_1.default, sessionValidator_1.default, (req, res) => new Instance_1.default(req, res).updatePresence(req, res));
router.post('/updateProfileName', (0, express_validator_1.query)('id').notEmpty(), (0, express_validator_1.body)('name').notEmpty(), requestValidator_1.default, sessionValidator_1.default, (req, res) => new Instance_1.default(req, res).updateProfileName(req, res));
router.post('/updateProfileStatus', (0, express_validator_1.query)('id').notEmpty(), (0, express_validator_1.body)('status').notEmpty(), requestValidator_1.default, sessionValidator_1.default, (req, res) => new Instance_1.default(req, res).updateProfileStatus(req, res));
router.get('/contacts', (0, express_validator_1.query)('id').notEmpty(), requestValidator_1.default, (req, res) => new Instance_1.default(req, res).fetchContacts(req, res));
router.post('/contacts/getContactByID', (0, express_validator_1.query)('id').notEmpty(), (0, express_validator_1.body)('phone').notEmpty(), (0, express_validator_1.body)('chat').if((0, express_validator_1.body)('phone').not().exists()).notEmpty(), requestValidator_1.default, (req, res) => new Instance_1.default(req, res).getContactByID(req, res));
exports.default = router;
