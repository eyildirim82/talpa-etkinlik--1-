# Supabase Edge Functions Deployment

This project uses Supabase Edge Functions for secure backend operations like Batch User Import and Email Sending.

## Prerequisites

1.  **Supabase CLI**: Ensure you have the Supabase CLI installed.
    -   `npm install -g supabase`
2.  **Login**: Login to your Supabase account.
    -   `supabase login`
3.  **Link Project**: Link this local project to your remote Supabase project.
    -   `supabase link --project-ref <your-project-id>`
    -   (You can find your Project ID in the Supabase Dashboard URL: `https://supabase.com/dashboard/project/<project-id>`)

## Deploying Functions

Run the following command to deploy the functions:

```bash
supabase functions deploy import-users --no-verify-jwt
supabase functions deploy send-email --no-verify-jwt
```

*Note: `--no-verify-jwt` is used if you want to allow calling these functions without a user session, but usually `import-users` should be protected. If you remove this flag, ensure your client sends the Authorization header (Supabase client does this automatically).*

## Environment Variables

For `import-users` to work, it needs the `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS and create Auth users.
For `send-email`, it needs `RESEND_API_KEY`.

Set them in your remote project:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=ey... --debug
supabase secrets set RESEND_API_KEY=re_... --debug
```

*(You can get the Service Role Key from Project Settings > API)*

## Local Development

To run functions locally:

```bash
supabase start
supabase functions serve
```

## New Functions (Added)

### 3. process-zip
For handling bulk ticket creation via ZIP upload.

```bash
supabase functions deploy process-zip --no-verify-jwt
```

## Storage Setup (New)

Before using file uploads, run the storage setup SQL:

1. Go to Supabase Dashboard > SQL Editor.
2. Open or Copy content from `supabase/storage_setup.sql`.
3. Run the script to create buckets (`tickets`, `event-banners`, `temp-uploads`) and policies.

