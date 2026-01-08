import { createBrowserClient } from '@/shared/infrastructure/supabase'
import type { AuthResponse, LoginCredentials, SignupData } from '../types/auth.types'

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const supabase = createBrowserClient()
  const { email, password } = credentials

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, message: 'Giriş başarılı.' }
}

export async function signup(data: SignupData): Promise<AuthResponse> {
  const supabase = createBrowserClient()
  const { email, password, fullName, sicilNo } = data

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        talpa_sicil_no: sicilNo,
      }
    }
  })

  if (authError || !authData.user) {
    return { success: false, message: authError?.message || 'Kayıt oluşturulamadı.' }
  }

  return { success: true, message: 'Kayıt başarılı. Giriş yapabilirsiniz.' }
}

export async function logout(): Promise<AuthResponse> {
  const supabase = createBrowserClient()
  await supabase.auth.signOut()
  return { success: true, message: 'Çıkış başarılı.' }
}

// Helpers for FormData (used in AuthModal)
export async function loginWithFormData(formData: FormData): Promise<AuthResponse> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, message: 'E-posta ve şifre zorunludur.' }
  }

  return login({ email, password })
}

export async function signupWithFormData(formData: FormData): Promise<AuthResponse> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const sicilNo = formData.get('sicilNo') as string

  if (!email || !password || !fullName || !sicilNo) {
    return { success: false, message: 'Tüm alanlar zorunludur.' }
  }

  return signup({ email, password, fullName, sicilNo })
}
