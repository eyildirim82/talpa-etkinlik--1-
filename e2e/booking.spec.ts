import { test, expect } from '@playwright/test';

test.describe('Booking Scenarios', () => {

    test('BOOK-01: Asil Booking Success', async ({ page }) => {
        // Mock Active Event (REST) - Object
        await page.route('**/rest/v1/active_event_view*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 1,
                    title: 'Test Event',
                    event_date: '2025-12-31T20:00:00',
                    location: 'Test Venue',
                    price: 100,
                    currency: 'TRY',
                    quota_asil: 100,
                    quota_yedek: 50,
                    total_quota: 150,
                    remaining_stock: 150,
                    banner_image: 'https://placehold.co/600x400',
                    status: 'ACTIVE'
                })
            });
        });

        // Mock bookings count
        await page.route('**/rest/v1/bookings?*count=exact*', async route => {
            await route.fulfill({
                status: 200,
                headers: { 'content-range': '0-0/0' },
                body: JSON.stringify([])
            });
        });

        // Mock User
        await page.route('**/auth/v1/user', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'user-123',
                    email: 'test@example.com',
                    user_metadata: { full_name: 'Test User' },
                    aud: 'authenticated', role: 'authenticated'
                })
            });
        });

        // Mock Profile
        await page.route('**/rest/v1/profiles*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'user-123',
                    full_name: 'Test User'
                })
            });
        });

        // Mock join_event RPC
        await page.route('**/rpc/join_event', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    queue: 'ASIL',
                    message: 'Success'
                })
            });
        });

        await page.goto('/');

        // Click "Bilet Al" (Join)
        await page.getByRole('button', { name: 'Bilet Al' }).click();

        // Expect Booking Modal
        await expect(page.getByText('Başvuru Onayı')).toBeVisible();

        // Fill form - click on labels containing checkboxes
        await page.locator('label').filter({ hasText: 'KVKK Aydınlatma Metni' }).click();
        await page.locator('label').filter({ hasText: 'Mesafeli Satış Sözleşmesi' }).click();

        // Submit
        await page.getByRole('button', { name: /Onaylıyorum/i }).click();

        // Modal should close or reload
        // Since we are not actually reloading in a true browser sense (mocked), 
        // we might just check for absence of modal or specific success behavior designed in App.tsx
        // App.tsx does window.location.reload() on success.
        // We can mock that or wait for it.
        // But since tests run in browser context, reload happens. 
        // Wait for reload with timeout
        try {
            await page.waitForEvent('load', { timeout: 3000 });
        } catch {
            // If reload doesn't happen, modal should be gone
            await expect(page.getByText('Başvuru Onayı')).not.toBeVisible({ timeout: 2000 });
        }
    });

    test('BOOK-02: Yedek Booking', async ({ page }) => {
        // Mock Event
        await page.route('**/rest/v1/active_event_view*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 1,
                    title: 'Test Event',
                    status: 'ACTIVE',
                    price: 100, currency: 'TL',
                    quota_asil: 1, quota_yedek: 1,
                    total_quota: 2,
                    remaining_stock: 1,
                    banner_image: 'https://placehold.co/600x400'
                })
            });
        });

        await page.route('**/rest/v1/bookings?*count=exact*', async route => {
            await route.fulfill({ status: 200, headers: { 'content-range': '0-0/0' }, body: JSON.stringify([]) });
        });

        // Mock User
        await page.route('**/auth/v1/user', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    id: 'user-123',
                    user_metadata: { full_name: 'Test User' },
                    aud: 'authenticated', role: 'authenticated'
                })
            });
        });
        await page.route('**/rest/v1/profiles*', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({ id: 'user-123', full_name: 'Test User' }) });
        });

        // Mock join_event RPC yielding YEDEK
        await page.route('**/rpc/join_event', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    queue: 'YEDEK',
                    message: 'Yedek listeye alındınız'
                })
            });
        });

        await page.goto('/');
        await page.getByRole('button', { name: 'Bilet Al' }).click();
        await page.locator('label').filter({ hasText: 'KVKK Aydınlatma Metni' }).click();
        await page.locator('label').filter({ hasText: 'Mesafeli Satış Sözleşmesi' }).click();
        await page.getByRole('button', { name: /Onaylıyorum/i }).click();

        // Wait for reload with timeout
        try {
            await page.waitForEvent('load', { timeout: 3000 });
        } catch {
            // If reload doesn't happen, modal should be gone
            await expect(page.getByText('Başvuru Onayı')).not.toBeVisible({ timeout: 2000 });
        }
    });

    test('BOOK-03: Duplicate Booking', async ({ page }) => {
        // Mock Event
        await page.route('**/rest/v1/active_event_view*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 1,
                    title: 'Test Event',
                    status: 'ACTIVE',
                    price: 100,
                    currency: 'TL',
                    total_quota: 150,
                    remaining_stock: 150,
                    banner_image: 'https://placehold.co/600x400'
                })
            });
        });

        await page.route('**/rest/v1/bookings?*count=exact*', async route => {
            await route.fulfill({ status: 200, headers: { 'content-range': '0-0/0' }, body: JSON.stringify([]) });
        });

        // Mock User
        await page.route('**/auth/v1/user', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({ id: 'user-123', user_metadata: { full_name: 'Test User' }, aud: 'authenticated', role: 'authenticated' })
            });
        });
        await page.route('**/rest/v1/profiles*', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({ id: 'user-123', full_name: 'Test User' }) });
        });

        // Mock join_event RPC error
        await page.route('**/rpc/join_event', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    message: 'Zaten kaydınız var'
                })
            });
        });

        await page.goto('/');
        await page.getByRole('button', { name: 'Bilet Al' }).click();
        await page.locator('label').filter({ hasText: 'KVKK Aydınlatma Metni' }).click();
        await page.locator('label').filter({ hasText: 'Mesafeli Satış Sözleşmesi' }).click();
        await page.getByRole('button', { name: /Onaylıyorum/i }).click();

        // Should see error
        await expect(page.getByText('Zaten kaydınız var')).toBeVisible();
    });
});
