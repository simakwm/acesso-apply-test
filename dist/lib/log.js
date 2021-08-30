"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeLog = exports.fetchLog = exports.initializeDb = void 0;
const fs_1 = __importDefault(require("fs"));
const mongodb_1 = require("mongodb");
async function initializeDb() {
    try {
        const dbClient = new mongodb_1.MongoClient('mongodb://mongodb:27017', { serverSelectionTimeoutMS: 3000 });
        await dbClient.connect();
        const db = dbClient.db('acesso');
        const collection = db.collection('test');
        return await Promise.resolve(collection);
    }
    catch (error) {
        return await Promise.reject(error);
    }
}
exports.initializeDb = initializeDb;
async function fetchLog(transactionId) {
    try {
        const collection = await initializeDb();
        const result = await collection
            .find({ transactionId })
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray();
        return await Promise.resolve(result);
    }
    catch (error) {
        return await Promise.reject(error);
    }
}
exports.fetchLog = fetchLog;
async function storeLog(operationLog) {
    try {
        const createdAt = new Date();
        const { transactionId, status, message } = operationLog;
        const logMessage = message === undefined ? '' : message;
        const line = `${createdAt.toLocaleString()} - ${transactionId} - ${status} - "${logMessage}"`;
        console.log(line);
        fs_1.default.appendFileSync('./logs/transfers.log', line + '\n'); // * Log to file as well
        const collection = await initializeDb(); // * Log to database
        const insertResult = await collection.insertOne({ ...operationLog, createdAt });
        return await Promise.resolve(insertResult);
    }
    catch (error) {
        return await Promise.reject(error);
    }
}
exports.storeLog = storeLog;
