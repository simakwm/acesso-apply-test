"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const Account_1 = __importDefault(require("./Account"));
const log_1 = require("./log");
const MSG_MISSING_ARGS = 'Something is missing. Check accoutOrigin, accountDestination and value';
/* Handles POST /api/fund-transfer */
async function performTransfer(request, response) {
    const { accountOrigin, accountDestination, value } = request.body;
    // Check parameters that came from body
    if (accountOrigin === undefined || accountDestination === undefined || value === undefined) {
        response.status(400).send(MSG_MISSING_ARGS);
    }
    // We need to test if our database is up before we do anything
    try {
        await (0, log_1.initializeDb)();
    }
    catch (error) {
        response.status(500).send({ status: 'Error', message: 'Database error' });
        return;
    }
    // Define a transaction id and put into current operation log object
    const transactionId = (0, uuid_1.v4)();
    const operationLog = { transactionId, status: 'In Queue' };
    await (0, log_1.storeLog)(operationLog);
    const origin = new Account_1.default(accountOrigin);
    const destination = new Account_1.default(accountDestination);
    // * answer request early
    response.json(operationLog);
    // ^ informs processing status
    operationLog.status = 'Processing';
    await (0, log_1.storeLog)(operationLog);
    origin.debt(value).then(async () => {
        // credit value into destination account
        destination.credit(value).then(async () => {
            // * everything went well. Change status to confirmed
            operationLog.status = 'Confirmed';
            await (0, log_1.storeLog)(operationLog);
        }).catch(async (error) => {
            // ! an error occurred during credit operation. Change status
            operationLog.status = 'Error';
            operationLog.message = error.message;
            await (0, log_1.storeLog)(operationLog);
            // ! tries to performs a rollback
            try {
                await origin.credit(value);
            }
            catch (error) {
                console.error(error.message);
            }
        });
    }).catch(async (error) => {
        // ! debt operation error
        operationLog.status = 'Error';
        operationLog.message = error.message;
        await (0, log_1.storeLog)(operationLog);
    });
}
exports.default = performTransfer;
