import { Request, Response } from '@tinyhttp/app'
import axios from 'axios'

const MSG_MISSING_ARGS = 'Something is missing. Check accoutOrigin, accountDestination and value'
const MSG_ABORTED = 'Aborted'
const ACCOUNT_API_URL = 'http://localhost:5000/api/Account'

export default async function performTransfer (request: Request, response: Response): Promise<void> {
  const { accountOrigin, accountDestination, value } = request.body
  if (accountOrigin === undefined || accountDestination === undefined || value === undefined) {
    // ! log this
    console.error(MSG_MISSING_ARGS)
    response.status(400).end(MSG_MISSING_ARGS)
  }

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
    const debitResponse = await axios.post(ACCOUNT_API_URL, data)
    if (debitResponse.status !== 200) {
      response.status(500).end(MSG_ABORTED)
      return
    }
    const creditResponse = await axios.post()
  } catch (error) {
    console.error(error)
  }
  response.send({ result: 'success' })
}
