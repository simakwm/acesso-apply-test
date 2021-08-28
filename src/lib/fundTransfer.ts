import { Request, Response } from '@tinyhttp/app'
import axios from 'axios'
import { v4 as newTransactionId } from 'uuid'

const MSG_MISSING_ARGS = 'Something is missing. Check accoutOrigin, accountDestination and value'
const MSG_ABORTED = 'Operation aborted because an unknown server error occurred'
const ACCOUNT_API_URL = 'http://localhost:5000/api/Account'

export default async function performTransfer (request: Request, response: Response): Promise<void> {
  const { accountOrigin, accountDestination, value }: ITransfer = request.body
  if (accountOrigin === undefined || accountDestination === undefined || value === undefined) {
    // ! log this
    console.error(MSG_MISSING_ARGS)
    response.status(400).end(MSG_MISSING_ARGS)
  }

  const transactionId = newTransactionId()
  const operationLog: IOperationLog = { transactionId, status: 'error', message: '' }

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

  try {
    let checkFailed = false
    const checksResults: IBasicCheck = await doBasicChecks({ accountOrigin, accountDestination, value })
    const { originExists, destinationExists, enoughBalance } = checksResults
    if (!originExists) {
      operationLog.message = `Origin account ${accountOrigin} not found`
      checkFailed = true
    } else if (!destinationExists) {
      operationLog.message = `Destination account ${accountDestination} not found`
      checkFailed = true
    } else if (!enoughBalance) {
      operationLog.message = `Not enough balance in origin account ${accountOrigin}`
      checkFailed = true
    }

    if (checkFailed) {
      response.status(500).send(operationLog)
      return
    }
  } catch (error) {
    console.log(error.response.data)
    operationLog.message = 'Could not run basic checks'
    response.status(500).send(operationLog)
    return
  }

  try {
    const debitResponse = await axios.post(ACCOUNT_API_URL, debitData)
    if (debitResponse.status !== 200) {
      operationLog.message = MSG_ABORTED
      response.status(500).send(operationLog)
      return
    }
  } catch (error) {
    const errorMessage = error.response.data !== undefined ? error.response.data : error.message
    operationLog.message = errorMessage
    response.status(500).send(operationLog)
    return
  }

  try {
    await axios.post(ACCOUNT_API_URL, creditData)
    response.json({ transactionId, status: 'success' })
  } catch (error) {
    const errorMessage = error.response.data !== undefined ? error.response.data : error.message
    operationLog.message = errorMessage
    response.status(500).send(operationLog)
  }
}

async function doBasicChecks (data: ITransfer): Promise<IBasicCheck> {
  const results: IBasicCheck = {
    originExists: false,
    destinationExists: false,
    enoughBalance: false
  }

  try {
    const originResponse = await axios.get(`${ACCOUNT_API_URL}/${data.accountOrigin}`)
    results.originExists = true
    if (originResponse.data.balance >= data.value) {
      results.enoughBalance = true
    }
  } catch (error) {
    if (error.response.status !== 404) {
      return await Promise.reject(error)
    }
  }

  try {
    await axios.get(`${ACCOUNT_API_URL}/${data.accountDestination}`)
    results.destinationExists = true
  } catch (error) {
    if (error.response.status !== 404) {
      return await Promise.reject(error)
    }
  }

  return await Promise.resolve(results)
}
