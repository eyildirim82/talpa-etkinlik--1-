import React from 'react';
import { createClient } from '../utils/supabase/server';
import App from '../App';
import { EmptyState } from '../components/EmptyState';
import { EventData, User } from '../types';

// Fetch Active Event
async function getActiveEvent(supabase: any): Promise<EventData | null> {
  // 1. Get the single active event
  const { data: eventData, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error || !eventData) {
    return null;
  }

  // 2. Calculate remaining stock
  const { count, error: countError } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventData.id)
    .neq('status', 'cancelled');

  const soldCount = count || 0;
  const remainingStock = (eventData.total_quota || 0) - soldCount;

  return {
    ...eventData,
    remaining_stock: remainingStock < 0 ? 0 : remainingStock,
  };
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
    role: profile.role,
    phone: profile.phone
  };
}

export default async function Page() {
  const supabase = createClient();
  
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