export interface SyncTarget {
  id: string
  name: string
  kind: 'business' | 'account'
  enabled: boolean
}

export interface SyncLog {
  id: string
  time: string
  status: 'success' | 'error'
  message: string
}
