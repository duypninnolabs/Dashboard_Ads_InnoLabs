import type { DepositTransaction } from '../types/deposit'

export const depositTransactions: DepositTransaction[] = [
  { id: 'DEP-8924', brand: 'PMP English', time: '18/08/2026, 10:23', method: 'bank', amount: 10_000_000, status: 'success' },
  { id: 'DEP-8910', brand: 'HSA VNES', time: '17/08/2026, 14:45', method: 'card', amount: 5_000_000, status: 'success' },
  { id: 'DEP-8895', brand: 'Đăng Hậu Store', time: '16/08/2026, 09:12', method: 'bank', amount: 20_000_000, status: 'processing' },
]
