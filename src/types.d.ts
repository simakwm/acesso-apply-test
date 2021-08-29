type TTransactionType = 'Credit' | 'Debit'
type TOperationStatus = 'Error' | 'Confirmed' | 'In Queue' | 'Processing'

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
