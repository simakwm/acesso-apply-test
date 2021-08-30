import fs from 'fs'
import { Collection, Document, InsertOneResult, MongoClient } from 'mongodb'

/* Initializes database and returns a Promise that resolves to a collection */
export async function initializeDb (): Promise<Collection> {
  try {
    const dbClient = new MongoClient('mongodb://mongodb:27017', { serverSelectionTimeoutMS: 3000 })
    await dbClient.connect()
    const db = dbClient.db('acesso')
    const collection = db.collection('test')
    return await Promise.resolve(collection)
  } catch (error) {
    return await Promise.reject(error)
  }
}

/* Retrieves the latest transaction log from a collection */
export async function fetchLog (transactionId: string): Promise<Document|null> {
  try {
    const collection = await initializeDb()
    const result = await collection
      .find({ transactionId })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray()
    return await Promise.resolve(result[0])
  } catch (error) {
    return await Promise.reject(error)
  }
}

/* Stores transaction log */
export async function storeLog (operationLog: IOperationLog): Promise<InsertOneResult> {
  try {
    const createdAt = new Date()
    const { transactionId, status, message } = operationLog
    const logMessage: string = message === undefined ? '' : message
    const line = `${createdAt.toLocaleString()} - ${transactionId} - ${status} - "${logMessage}"`
    // * Log to console
    console.log(line)
    // * Log to file as well
    fs.appendFileSync('./logs/transfers.log', line + '\n')
    // * Log to database
    const collection = await initializeDb()
    const insertResult = await collection.insertOne({ ...operationLog, createdAt })
    return await Promise.resolve(insertResult)
  } catch (error) {
    return await Promise.reject(error)
  }
}
