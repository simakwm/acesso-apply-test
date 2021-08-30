"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
/* A class that represents an account and its operations */
class Account {
    apiUrl = 'http://accounts:80/api/Account';
    accountNumber = '';
    constructor(accountNumber) {
        this.accountNumber = accountNumber;
    }
    /* Handles requests for the test accounts api */
    async doRequest(data) {
        try {
            const response = await axios_1.default.post(this.apiUrl, data);
            return await Promise.resolve(response.data);
        }
        catch (error) {
            let errorMessage = error.message; // generic error
            if (typeof error.response?.data === 'object' && error.response?.data?.title !== undefined) {
                // errors with title
                errorMessage = `Account ${this.accountNumber} ${String(error.response.data.title)}`;
            }
            else if (error.response.data !== undefined) {
                errorMessage = error.response.data; // balance error
            }
            return await Promise.reject(new Error(errorMessage));
        }
    }
    async credit(value) {
        const creditData = {
            accountNumber: this.accountNumber,
            value,
            type: 'Credit'
        };
        try {
            return await this.doRequest(creditData);
        }
        catch (error) {
            return await Promise.reject(error);
        }
    }
    async debt(value) {
        const debitData = {
            accountNumber: this.accountNumber,
            value,
            type: 'Debit'
        };
        try {
            return await this.doRequest(debitData);
        }
        catch (error) {
            return await Promise.reject(error);
        }
    }
}
exports.default = Account;
