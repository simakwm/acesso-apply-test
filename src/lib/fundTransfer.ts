import { Request, Response } from '@tinyhttp/app'
import axios from 'axios'
import { v4 as newTransactionId } from 'uuid'
import { initializeDb, storeLog } from './log'

const MSG_MISSING_ARGS = 'Something is missing. Check accoutOrigin, accountDestination and value'

class Account {
  apiUrl = 'http://localhost:5000/api/Account'
  accountNumber: string = ''

  constructor (accountNumber: string) {
    this.accountNumber = accountNumber
  }

  private async doRequest (data: IAccountTransaction): Promise<any> {
    try {
      const response = await axios.post(this.apiUrl, data)
      return await Promise.resolve(response.data)
    } catch (error: any) {
      let errorMessage: string = error.message // generic error
      if (typeof error.response?.data === 'object' && error.response?.data?.title !== undefined) {
        // errors with title
        errorMessage = `Account ${this.accountNumber} ${String(error.response.data.title)}`
      } else if (error.response.data !== undefined) {
        errorMessage = error.response.data // balance error
      }
      return await Promise.reject(new Error(errorMessage))
    }
  }

  async credit (value: number): Promise<any> {
    const creditData: IAccountTransaction = {
      accountNumber: this.accountNumber,
      value,
      type: 'Credit'
    }
    try {
      return await this.doRequest(creditData)
    } catch (error) {
      return await Promise.reject(error)
    }
  }

  async debt (value: number): Promise<any> {
    const debitData: IAccountTransaction = {
      accountNumber: this.accountNumber,
      value,
      type: 'Debit'
    }
    try {
      return await this.doRequest(debitData)
    } catch (error) {
      return await Promise.reject(error)
    }
  }
}

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
  const operationLog: IOperationLog = { transactionId, status: 'In Queue' }
  await storeLog(operationLog)

  const origin = new Account(accountOrigin)
  const destination = new Account(accountDestination)

  // * answer request early
  response.json(operationLog)

  // ^ informs processing status
  operationLog.status = 'Processing'
  await storeLog(operationLog)

  origin.debt(value).then(async () => {
    // credit value into destination account
    destination.credit(value).then(async () => {
      // * everything went well. Change status to confirmed
      operationLog.status = 'Confirmed'
      await storeLog(operationLog)
    }).catch(async (error) => {
      // ! an error occurred during credit operation. Change status
      operationLog.status = 'Error'
      operationLog.message = error.message
      await storeLog(operationLog)
      // ! tries to performs a rollback
      try {
        await origin.credit(value)
      } catch (error: any) {
        console.error(error.message)
      }
    })
  }).catch(async (error) => {
    // ! debt operation error
    operationLog.status = 'Error'
    operationLog.message = error.message
    await storeLog(operationLog)
  })
}
