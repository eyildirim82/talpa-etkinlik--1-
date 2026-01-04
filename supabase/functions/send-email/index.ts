import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Production'da domain kısıtlaması yapılmalı
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Typed payload interface
interface EmailPayload {
    userName: string
    eventTitle: string
    pdfUrl?: string
    queueStatus?: 'ASIL' | 'YEDEK'
    eventDate?: string
    location?: string
}

interface EmailRequest {
    to: string[]
    type: 'TICKET_ASSIGNED' | 'REGISTRATION_RECEIVED'
    payload: EmailPayload
}

serve(async (req) => {
    // 1. CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Auth Kontrolü (KRİTİK GÜVENLİK)
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing Authorization header' }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Supabase Client ile JWT token doğrulama
        const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
            global: { headers: { Authorization: authHeader } },
        })

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // 3. API Key kontrolü
        if (!RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not configured')
            return new Response(
                JSON.stringify({ error: 'Server configuration error' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // 4. Payload doğrulama
        const { to, type, payload }: EmailRequest = await req.json()

        if (!to || !Array.isArray(to) || to.length === 0) {
            throw new Error('Invalid recipients')
        }

        if (!type || !payload) {
            throw new Error('Type and payload are required')
        }

        // 5. Şablon seçimi
        let subject = ''
        let html = ''

        switch (type) {
            case 'TICKET_ASSIGNED':
                subject = `🎫 Biletiniz Hazır: ${payload.eventTitle}`
                html = getTicketTemplate(payload)
                break
            case 'REGISTRATION_RECEIVED':
                subject = `✅ Başvurunuz Alındı: ${payload.eventTitle}`
                html = getRegistrationTemplate(payload)
                break
            default:
                throw new Error('Invalid email type')
        }

        // 6. Resend API çağrısı
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'TALPA Etkinlik <bilet@talpa.org>',
                to,
                subject,
                html
            })
        })

        const data = await res.json()

        if (!res.ok) {
            console.error('Resend API Error:', data)
            return new Response(
                JSON.stringify({ error: 'Email sending failed' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        return new Response(
            JSON.stringify(data),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Function Error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})

// --- HTML TEMPLATES ---

function getTicketTemplate(data: EmailPayload): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #D4AF37 0%, #C9A227 100%); padding: 24px; text-align: center;">
                <h1 style="color: #000000; margin: 0; font-size: 24px; font-weight: 700;">TALPA Biletiniz</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 16px 0;">
                    Sayın <strong>${data.userName}</strong>,
                </p>
                <p style="color: #4b5563; margin: 0 0 24px 0;">
                    <strong>${data.eventTitle}</strong> etkinliği için biletiniz oluşturulmuştur.
                </p>
                
                <!-- Event Details -->
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px 0; color: #374151;">
                        📅 <strong>Tarih:</strong> ${data.eventDate || 'Belirtilmedi'}
                    </p>
                    <p style="margin: 0; color: #374151;">
                        📍 <strong>Konum:</strong> ${data.location || 'Belirtilmedi'}
                    </p>
                </div>

                <!-- CTA Button -->
                ${data.pdfUrl ? `
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${data.pdfUrl}" style="background-color: #000000; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                        📥 Biletinizi İndirin (PDF)
                    </a>
                </div>
                ` : ''}
                
                <!-- Footer Note -->
                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                    Bu bilet kişiye özeldir. Girişte QR kod kontrolü yapılacaktır.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim()
}

function getRegistrationTemplate(data: EmailPayload): string {
    const isAsil = data.queueStatus === 'ASIL'
    const statusColor = isAsil ? '#10B981' : '#F59E0B'
    const statusText = isAsil ? 'ASİL LİSTE' : 'YEDEK LİSTE'
    const statusMessage = isAsil
        ? 'Lütfen ödeme işleminizi tamamlayınız. Ödeme onayından sonra biletiniz e-posta adresinize gönderilecektir.'
        : 'Sıra size geldiğinde e-posta ile bilgilendirileceksiniz.'

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0A1929 0%, #0D2137 100%); padding: 24px; text-align: center;">
                <h1 style="color: #D4AF37; margin: 0; font-size: 24px; font-weight: 700;">Başvurunuz Alındı</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 16px 0;">
                    Sayın <strong>${data.userName}</strong>,
                </p>
                <p style="color: #4b5563; margin: 0 0 24px 0;">
                    <strong>${data.eventTitle}</strong> etkinliği için ön kayıt işleminiz tamamlanmıştır.
                </p>
                
                <!-- Status Box -->
                <div style="border-left: 4px solid ${statusColor}; background-color: #f9fafb; padding: 16px 20px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 8px 0; font-weight: 700; color: ${statusColor}; font-size: 14px;">
                        DURUM: ${statusText}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #4b5563;">
                        ${statusMessage}
                    </p>
                </div>
                
                <!-- Footer -->
                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 24px 0 0 0;">
                    Sorularınız için bize ulaşabilirsiniz.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim()
}
