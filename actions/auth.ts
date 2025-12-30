// Client-side auth actions for Vite

import { createClient } from '../utils/supabase/browser'

export async function login(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, message: 'Giriş başarısız. Bilgilerinizi kontrol ediniz.' }
  }

  // Note: revalidatePath not needed in client-side code
  return { success: true, message: 'Giriş başarılı.' }
}

export async function signup(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const sicilNo = formData.get('sicilNo') as string

  // Sign Up User with metadata
  // Profile will be created automatically by database trigger
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

  // Note: Profile is created automatically via database trigger (handle_new_user)
  // No manual insert needed, which solves the RLS timing issue

  return { success: true, message: 'Kayıt başarılı. Giriş yapabilirsiniz.' }
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  // Client-side: redirect handled by caller
  return { success: true, message: 'Çıkış başarılı.' }
}