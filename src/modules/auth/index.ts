// Auth Module Public API

// API Functions
export * from './api/auth.api'

// Hooks
export * from './hooks/useAuth'
export * from './hooks/useSession'
export { useAdminCheck } from './hooks/useAdminCheck'
export type { UseAdminCheckResult } from './hooks/useAdminCheck'

// Services
export { checkAdmin } from './services/authorization.service'

// Types
export * from './types/auth.types'

// Components
export { AuthModal } from './components/AuthModal'
