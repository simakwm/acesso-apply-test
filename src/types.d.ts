type TTransactionType = 'Credit' | 'Debit'
type TOperationStatus = 'error' | 'success'

interface ITransfer {
  accountOrigin: string
  accountDestination: string
  value: number
}

interface IAccountTransaction {
  accountNumber: string
  value: number
  type: TTransactionType
}

interface IOperationLog {
  transactionId: string
  status: TOperationStatus
  message?: string
}

interface IBasicCheck {
  originExists: boolean
  destinationExists: boolean
  enoughBalance: boolean
}
