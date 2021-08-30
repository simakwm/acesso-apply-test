import { Request, Response } from '@tinyhttp/app'
import { v4 as newTransactionId } from 'uuid'
import Account from './Account'
import { initializeDb, storeLog } from './log'

const MSG_MISSING_ARGS = 'Something is missing. Check accoutOrigin, accountDestination and value'

/* Handles POST /api/fund-transfer */
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
