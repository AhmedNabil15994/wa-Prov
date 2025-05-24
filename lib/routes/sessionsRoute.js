"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const requestValidator_1 = __importDefault(require("../Middleware/requestValidator"));
const nodeValidator_1 = __importDefault(require("../Middleware/nodeValidator"));
const Session_1 = __importDefault(require("../Models/Session"));
let router = (0, express_1.Router)();
let WLSession = new Session_1.default();
router.get('/find/:id', nodeValidator_1.default, (req, res) => WLSession.find(req, res));
router.get('/status/:id', (req, res) => WLSession.status(req, res));
router.post('/add', (0, express_validator_1.body)('id').notEmpty(), (0, express_validator_1.body)('isLegacy').notEmpty(), requestValidator_1.default, (req, res) => WLSession.add(req, res));
router.delete('/delete/:id', (req, res) => WLSession.del(req, res));
router.post('/clearInstance', (0, express_validator_1.body)('id').notEmpty(), requestValidator_1.default, (req, res) => WLSession.clearInstance(req, res));
router.post('/clearData', (0, express_validator_1.body)('id').notEmpty(), requestValidator_1.default, (req, res) => WLSession.clearData(req, res));
exports.default = router;
