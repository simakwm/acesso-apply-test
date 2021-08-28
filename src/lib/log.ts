import fs from 'fs'
import { Collection, Document, InsertOneResult, MongoClient } from 'mongodb'

export async function initializeDb (): Promise<Collection> {
  try {
    const dbClient = new MongoClient('mongodb://localhost:27017', { serverSelectionTimeoutMS: 5000 })
    await dbClient.connect()
    const db = dbClient.db('acesso')
    const collection = db.collection('test')
    return await Promise.resolve(collection)
  } catch (error) {
    return await Promise.reject(error)
  }
}

export async function fetchLog (transactionId: string): Promise<Document|null> {
  try {
    const collection = await initializeDb()
    const results = await collection.findOne({ transactionId })
    return await Promise.resolve(results)
  } catch (error) {
    console.error(error.message)
    return await Promise.reject(error)
  }
}

export async function storeLog (operationLog: IOperationLog): Promise<InsertOneResult> {
  try {
    const createdAt = new Date()
    // * Log to file as well
    const line = JSON.stringify({ createdAt, ...operationLog }) + '\n'
    fs.appendFileSync('./logs/transfers.log', line)
    // * Log to database
    const collection = await initializeDb()
    const insertResult = await collection.insertOne({ ...operationLog, createdAt })
    return await Promise.resolve(insertResult)
  } catch (error) {
    return await Promise.reject(error)
  }
}
