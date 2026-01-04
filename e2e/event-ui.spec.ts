import { test, expect } from '@playwright/test';

test.describe('Event UI Scenarios', () => {

    test('UI-01: Active Event Display', async ({ page }) => {
        // Mock active_event_view
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

        await page.route('**/rest/v1/bookings*', async route => {
            await route.fulfill({ status: 200, headers: { 'content-range': '0-0/0' }, body: JSON.stringify([]) });
        });

        await page.goto('/');

        // Verify Title in Hero (h1)
        await expect(page.locator('h1')).toContainText('Test Event');

        // Verify Sticky Footer
        await expect(page.getByText('Bilet Al')).toBeVisible();
        await expect(page.getByText('150 / 150 Kalan')).toBeVisible(); // Sticky Footer text
    });

    test('UI-02: No Active Event (Empty State)', async ({ page }) => {
        await page.route('**/rest/v1/active_event_view*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: 'null'
            });
        });

        await page.goto('/');
        await expect(page.getByText(/aktif bir etkinlik bulunmamaktadır/i)).toBeVisible();
    });

    test('UI-03: Quota Available', async ({ page }) => {
        await page.route('**/rest/v1/active_event_view*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 2,
                    title: 'Open Event',
                    event_date: '2025-12-31T20:00:00',
                    quota_asil: 100,
                    quota_yedek: 50,
                    remaining_stock: 100,
                    total_quota: 150,
                    status: 'ACTIVE',
                    price: 100,
                    currency: 'TL',
                    banner_image: 'https://placehold.co/600x400'
                })
            });
        });

        await page.route('**/rest/v1/bookings?*queue_status=eq.ASIL*', async route => {
            await route.fulfill({ status: 200, headers: { 'content-range': '0-0/0' }, body: JSON.stringify([]) });
        });
        await page.route('**/rest/v1/bookings?*queue_status=eq.YEDEK*', async route => {
            await route.fulfill({ status: 200, headers: { 'content-range': '0-0/0' }, body: JSON.stringify([]) });
        });

        await page.goto('/');
        // Expect Sticky Footer "Bilet Al" enabled
        const button = page.getByRole('button', { name: 'Bilet Al' });
        await expect(button).toBeEnabled();
        await expect(page.getByText('100 / 150 Kalan')).toBeVisible();
    });

    test('UI-05: Sold Out', async ({ page }) => {
        await page.route('**/rest/v1/active_event_view*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 3,
                    title: 'Sold Out Event',
                    event_date: '2025-12-31T20:00:00',
                    quota_asil: 100,
                    quota_yedek: 50,
                    remaining_stock: 0,
                    total_quota: 150,
                    status: 'ACTIVE',
                    price: 100,
                    currency: 'TL',
                    banner_image: 'https://placehold.co/600x400'
                })
            });
        });

        await page.goto('/');

        // Sticky Footer: Should say "TÜKENDİ" and be disabled
        const button = page.getByRole('button', { name: 'TÜKENDİ' });
        await expect(button).toBeVisible();
        await expect(button).toBeDisabled();
    });
});
