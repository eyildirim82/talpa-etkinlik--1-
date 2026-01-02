
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
    to: string[]
    subject?: string
    html?: string
    type?: 'TICKET_ASSIGNED' | 'REGISTRATION_RECEIVED'
    payload?: any
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not set')
        }

        const { to, subject: reqSubject, html: reqHtml, type, payload }: EmailRequest = await req.json()

        let subject = reqSubject
        let html = reqHtml

        // Basic Template Logic
        if (type === 'TICKET_ASSIGNED') {
            subject = 'Biletiniz Onaylandı! - Talpa Etkinlik'
            const { eventTitle, pdfUrl, userName } = payload
            html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Merhaba ${userName},</h2>
                    <p><strong>${eventTitle}</strong> etkinliği için başvurunuz onaylanmış ve biletiniz oluşturulmuştur.</p>
                    <p>Biletinizi aşağıdaki linkten indirebilirsiniz:</p>
                    <a href="${pdfUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
                        Biletini İndir (PDF)
                    </a>
                    <p>Etkinlikte görüşmek üzere!</p>
                </div>
            `
        } else if (type === 'REGISTRATION_RECEIVED') {
            subject = 'Başvurunuz Alındı - Talpa Etkinlik'
            const { eventTitle, userName, queueStatus } = payload
            html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Merhaba ${userName},</h2>
                    <p><strong>${eventTitle}</strong> etkinliği için başvurunuz başarıyla alınmıştır.</p>
                    <p>Durum: <strong>${queueStatus === 'ASIL' ? 'ASİL LİSTE' : 'YEDEK LİSTE'}</strong></p>
                    ${queueStatus === 'ASIL'
                    ? '<p>Lütfen ödeme işleminizi tamamlayınız. Ödeme onayından sonra biletiniz gönderilecektir.</p>'
                    : '<p>Sıra size geldiğinde bilgilendirileceksiniz.</p>'
                }
                    <p>Teşekkürler!</p>
                </div>
            `
        }

        if (!subject || !html) {
            throw new Error('Subject and HTML content are required (or valid type/payload)')
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'Talpa Etkinlik <noreply@talpa.org>',
                to,
                subject,
                html
            })
        })

        const data = await res.json()

        return new Response(
            JSON.stringify(data),
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
