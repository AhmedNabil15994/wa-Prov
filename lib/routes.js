"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const instanceRoute_1 = __importDefault(require("./routes/instanceRoute"));
const sessionsRoute_1 = __importDefault(require("./routes/sessionsRoute"));
const messagesRoute_1 = __importDefault(require("./routes/messagesRoute"));
const response_1 = __importDefault(require("./response"));
let router = (0, express_1.Router)();
router.use('/instances', instanceRoute_1.default);
router.use('/sessions', sessionsRoute_1.default);
router.use('/messages', messagesRoute_1.default);
router.all('*', (req, res) => {
    (0, response_1.default)(res, 404, false, 'The requested url cannot be found.');
});
exports.default = router;
