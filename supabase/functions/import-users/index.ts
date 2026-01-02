
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client with Admin (Service Role) rights
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        const { users } = await req.json()

        if (!users || !Array.isArray(users)) {
            throw new Error('Invalid users data')
        }

        const results = []

        // Process users in batches (to avoid timeouts)
        for (const user of users) {
            try {
                const { email, tckn, sicil_no, full_name, password } = user

                // 1. Create User in Auth
                const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email: email,
                    password: password || 'Talpa123!', // Default password if not provided
                    email_confirm: true,
                    user_metadata: {
                        full_name: full_name
                    }
                })

                if (authError) throw authError

                // 2. Create/Update Profile
                // Profile might be created by trigger, but we update it with specific fields
                if (authUser.user) {
                    const { error: profileError } = await supabaseAdmin
                        .from('profiles')
                        .update({
                            tckn: tckn,
                            sicil_no: sicil_no,
                            full_name: full_name,
                            is_admin: false
                        })
                        .eq('id', authUser.user.id)

                    if (profileError) {
                        // If update fails (maybe trigger lagging), try insert or notify
                        console.error('Profile update error:', profileError)
                    }
                }

                results.push({ email, status: 'success', id: authUser.user?.id })

            } catch (err: any) {
                // If user already exists, try to update profile
                if (err.message && err.message.includes('already registered')) {
                    // Logic to update existing user's profile could go here
                    results.push({ email: user.email, status: 'exists', message: 'User already exists' })
                } else {
                    results.push({ email: user.email, status: 'error', message: err.message })
                }
            }
        }

        return new Response(
            JSON.stringify(results),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
