import React from 'react';
import { createServerClient } from '@/shared/infrastructure/supabase';
import App from '../App';
import { EmptyState } from '../components/EmptyState';
import { EventData, User } from '../types';

// Fetch Active Event
async function getActiveEvent(supabase: any): Promise<EventData | null> {
  // 1. Get the single active event (using status = 'ACTIVE')
  const { data: eventData, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (error || !eventData) {
    // Fallback: try active_event_view for backward compatibility
    const { data: viewData } = await supabase
      .from('active_event_view')
      .select('*')
      .maybeSingle();
    
    if (viewData) {
      return viewData;
    }
    
    return null;
  }

  // 2. Calculate remaining stock from bookings
  const { count: asilCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventData.id)
    .eq('queue_status', 'ASIL');

  const { count: yedekCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventData.id)
    .eq('queue_status', 'YEDEK');

  const totalBookings = (asilCount || 0) + (yedekCount || 0);
  const totalQuota = (eventData.quota_asil || 0) + (eventData.quota_yedek || 0);
  const remainingStock = totalQuota - totalBookings;

  // Return in backward compatible format
  return {
    ...eventData,
    id: eventData.id.toString(), // Convert BIGINT to string
    image_url: eventData.banner_image,
    location: eventData.location_url || '',
    currency: 'TL',
    total_quota: totalQuota,
    is_active: true,
    remaining_stock: Math.max(remainingStock, 0),
    // Include new fields for ActionZone
    quota_asil: eventData.quota_asil,
    quota_yedek: eventData.quota_yedek,
    cut_off_date: eventData.cut_off_date,
    status: eventData.status,
    asil_count: asilCount || 0,
    yedek_count: yedekCount || 0
  } as any;
}

// Fetch Current User with Profile
async function getUser(supabase: any): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    full_name: profile.full_name,
    talpa_sicil_no: profile.talpa_sicil_no,
    sicil_no: profile.sicil_no,
    tckn: profile.tckn,
    email: profile.email,
    is_admin: profile.is_admin,
    role: profile.role,
    phone: profile.phone
  };
}

export default async function Page() {
  const supabase = await createServerClient();
  
  // Execute in parallel for performance
  const [activeEvent, currentUser] = await Promise.all([
    getActiveEvent(supabase),
    getUser(supabase)
  ]);

  if (!activeEvent) {
    return <EmptyState />;
  }

  return <App initialEvent={activeEvent} initialUser={currentUser} />;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;