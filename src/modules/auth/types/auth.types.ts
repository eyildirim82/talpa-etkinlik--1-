/**
 * Auth Module Types
 */

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  fullName: string
  sicilNo: string
}

export interface AuthResponse {
  success: boolean
  message: string
}

export interface AuthSession {
  user: {
    id: string
    email?: string
  } | null
  session: {
    access_token: string
    refresh_token: string
  } | null
}

