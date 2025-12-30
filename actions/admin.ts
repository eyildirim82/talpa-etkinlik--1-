'use server'

import { createClient } from '../utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Helper to check admin role
async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')
}

export async function createEvent(formData: FormData) {
  await checkAdmin()
  const supabase = await createClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const dateStr = formData.get('date') as string
  const timeStr = formData.get('time') as string
  const location = formData.get('location') as string
  const price = parseFloat(formData.get('price') as string)
  const quota = parseInt(formData.get('quota') as string)
  const imageUrl = formData.get('imageUrl') as string

  // Combine Date and Time into ISO string
  const eventDate = new Date(`${dateStr}T${timeStr}:00`).toISOString()

  const { error } = await supabase
    .from('events')
    .insert({
      title,
      description,
      event_date: eventDate,
      location,
      price,
      currency: 'TRY', // Default currency
      total_quota: quota,
      image_url: imageUrl,
      is_active: false // Created as inactive by default
    })

  if (error) {
    console.error('Create Event Error:', error)
    return { success: false, message: 'Etkinlik oluşturulamadı.' }
  }

  revalidatePath('/admin/events')
  return { success: true, message: 'Etkinlik başarıyla oluşturuldu.' }
}

export async function setActiveEvent(eventId: string) {
  await checkAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('set_active_event', {
    p_event_id: eventId
  })

  if (error) {
    console.error('Set Active RPC Error:', error)
    return { success: false, message: 'Bağlantı hatası.' }
  }

  if (!data.success) {
    return { success: false, message: data.error || 'Etkinlik aktif edilemedi.' }
  }

  revalidatePath('/admin/events')
  revalidatePath('/') // Revalidate home page too
  return { success: true, message: data.message }
}

export async function getEventStats(eventId: string) {
  await checkAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_event_stats', {
    p_event_id: eventId
  })

  if (error) {
    console.error('Get Stats RPC Error:', error)
    return { success: false, message: 'İstatistikler alınamadı.' }
  }

  if (!data.success) {
    return { success: false, message: data.error || 'İstatistikler alınamadı.' }
  }

  return { success: true, stats: data.stats }
}