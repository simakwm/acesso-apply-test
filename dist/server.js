"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("@tinyhttp/app");
const logger_1 = require("@tinyhttp/logger");
const milliparsec_1 = require("milliparsec");
const fundTransfer_1 = __importDefault(require("./lib/fundTransfer"));
const fundTransferStatus_1 = __importDefault(require("./lib/fundTransferStatus"));
// setup tinyhttp
const app = new app_1.App();
app.use((0, logger_1.logger)());
app.use((0, milliparsec_1.json)());
app.post('/api/fund-transfer', fundTransfer_1.default);
app.get('/api/fund-transfer/:transactionId', fundTransferStatus_1.default);
app.listen(3000);
