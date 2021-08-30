"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("./log");
const MSG_MISSING_ARGS = 'You need to specify a transactionId';
async function fundTransferStatus(request, response) {
    const { transactionId } = request.params;
    if (transactionId === undefined) {
        response.status(400).end(MSG_MISSING_ARGS);
        return;
    }
    try {
        const operationLog = await (0, log_1.fetchLog)(transactionId);
        if (operationLog?._id !== undefined) {
            delete operationLog._id;
        }
        response.json(operationLog);
    }
    catch (error) {
        response.send({ status: 'Error', message: `Error fetching logs from ${transactionId}` });
    }
}
exports.default = fundTransferStatus;
