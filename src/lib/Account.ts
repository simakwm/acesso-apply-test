import axios from 'axios'

/* A class that represents an account and its operations */
export default class Account {
  apiUrl = 'http://accounts:80/api/Account'
  accountNumber: string = ''

  constructor (accountNumber: string) {
    this.accountNumber = accountNumber
  }

  /* Handles requests for the test accounts api */
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
