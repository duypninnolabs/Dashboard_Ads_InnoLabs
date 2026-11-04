export type PaymentMethod = 'bank' | 'card' | 'wallet'
export type DepositStatus = 'success' | 'processing'

export interface DepositTransaction {
  id: string
  brand: string
  time: string
  method: PaymentMethod
  amount: number
  status: DepositStatus
}
