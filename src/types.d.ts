type TTransactionType = 'Credit' | 'Debit'

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
