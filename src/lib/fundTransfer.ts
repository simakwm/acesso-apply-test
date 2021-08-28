import { Request, Response } from '@tinyhttp/app'
import axios from 'axios'
import { v4 as newTransactionId } from 'uuid'
import { initializeDb, storeLog } from './log'

const MSG_MISSING_ARGS = 'Something is missing. Check accoutOrigin, accountDestination and value'
const ACCOUNT_API_URL = 'http://localhost:5000/api/Account'

export default async function performTransfer (request: Request, response: Response): Promise<void> {
  const { accountOrigin, accountDestination, value }: ITransfer = request.body

  // Check parameters that came from body
  if (accountOrigin === undefined || accountDestination === undefined || value === undefined) {
    response.status(400).send(MSG_MISSING_ARGS)
  }

  // We need to test if our database is up before we do anything
  try {
    await initializeDb()
  } catch (error) {
    response.status(500).send({ status: 'Error', message: 'Database error' })
    return
  }

  // Define a transaction id and put into current operation log object
  const transactionId = newTransactionId()
  const operationLog: IOperationLog = { transactionId, status: 'Error' }

  const debitData: IAccountTransaction = {
    accountNumber: accountOrigin,
    value,
    type: 'Debit'
  }
  const creditData: IAccountTransaction = {
    accountNumber: accountDestination,
    value,
    type: 'Credit'
  }

  // ^ First step: Perform a debit operation on accountOrigin
  try {
    await axios.post(ACCOUNT_API_URL, debitData)
    await storeLog(operationLog)
  } catch (error: any) {
    console.log(error)
    let errorMessage: string = error.message // generic error
    if (typeof error.response?.data === 'object' && error.response?.data?.title !== undefined) {
      // errors with title
      errorMessage = `Source account ${accountOrigin} ${String(error.response.data.title)}`
    } else if (error.response.data !== undefined) {
      errorMessage = error.response.data // balance error
    }
    operationLog.message = errorMessage
    response.status(500).send(operationLog)
    await storeLog(operationLog)
    return
  }

  // ^ Final step: Credit operation o accountDestination
  try {
    await axios.post(ACCOUNT_API_URL, creditData)
    // * Everything went well so far, respond and update log
    operationLog.status = 'Confirmed'
    await storeLog(operationLog)
    response.json(operationLog)
  } catch (error: any) {
    // ! Something didn't work
    let errorMessage: string = error.message
    const title = error.response?.data?.title as string
    if (typeof error.response?.data === 'object' && title !== undefined) {
      errorMessage = `Destination account ${accountDestination} ${title}`
    }
    operationLog.message = errorMessage
    await storeLog(operationLog)
    response.status(500).send(operationLog)
    // ^ Rollback previous step
    rollback(debitData).then(() => {
      console.info(transactionId, 'rolled back because an error occurred')
    }).catch(async (rollbackError) => {
      console.error(rollbackError)
      const { accountNumber, value, type } = creditData
      operationLog.message = `Could not rollback: ${accountNumber}, ${value}, ${type}`
      await storeLog(operationLog)
    })
  }
}

async function rollback (data: IAccountTransaction): Promise<void> {
  try {
    data.type = 'Credit'
    await axios.post(`${ACCOUNT_API_URL}`, data)
    return await Promise.resolve()
  } catch (error) {
    return await Promise.reject(error)
  }
}
