import { Collection, InsertOneResult, MongoClient } from 'mongodb'

const dbClient = new MongoClient('mongodb://localhost:27017')

async function initializeDb (): Promise<Collection> {
  try {
    await dbClient.connect()
    const db = dbClient.db('acesso_teste')
    const collection = db.collection('transactions')
    return await Promise.resolve(collection)
  } catch (error) {
    return await Promise.reject(error)
  }
}

export async function fetchStatus (transactionId: string): Promise<any> {
  try {
    const collection = await initializeDb()
    const results = await collection.findOne({ transactionId })
    return await Promise.resolve(results)
  } catch (error) {
    return await Promise.reject(error)
  }
}

// ! colocar tipo no documento
export async function storeStatus (data: any): Promise<InsertOneResult> {
  try {
    const insertResult = await collection
      .insertOne({ ...data, createdAt: new Date() })
    return await Promise.resolve(insertResult)
  } catch (error) {
    return await Promise.reject(error)
  }
}
