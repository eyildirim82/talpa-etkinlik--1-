import { test, expect } from '@playwright/test';

test.describe('Authentication Scenarios', () => {

    test('AUTH-02: Successful Login', async ({ page }) => {
        // Mock token response
        await page.route('**/auth/v1/token?grant_type=password', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: 'fake-access-token',
                    token_type: 'bearer',
                    expires_in: 3600,
                    refresh_token: 'fake-refresh-token',
                    user: {
                        id: 'user-123',
                        aud: 'authenticated',
                        role: 'authenticated',
                        email: 'test@example.com',
                        user_metadata: { full_name: 'Test User' },
                    }
                })
            });
        });

        // Mock user endpoint for session check (used on load/reload)
        await page.route('**/auth/v1/user', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'user-123',
                    email: 'test@example.com',
                    user_metadata: { full_name: 'Test User' },
                    app_metadata: {},
                    aud: 'authenticated',
                    role: 'authenticated',
                    created_at: new Date().toISOString()
                })
            });
        });

        await page.goto('/');

        // Click "Giriş Yap" to open dropdown
        await page.getByRole('button', { name: 'Giriş Yap' }).first().click();

        // Fill credentials
        await page.getByPlaceholder('E-posta').fill('test@example.com');
        await page.getByPlaceholder('Şifre').fill('password123');

        // Handle reload: we expect the page to reload upon successful login
        const reloadPromise = page.waitForEvent('load');

        await page.getByRole('button', { name: 'Giriş Yap', exact: true }).click();

        // Wait for reload
        await reloadPromise;

        // Verify "Hesabım" is visible
        // We might need to hover or click if it's hidden, but usually "Hesabım" replaces "Giriş Yap" in the navbar
        await expect(page.getByRole('button', { name: 'Hesabım' })).toBeVisible({ timeout: 10000 });

        // Open dropdown to see name
        await page.getByRole('button', { name: 'Hesabım' }).click();
        await expect(page.getByText('Test User')).toBeVisible();
    });

    test('AUTH-03: Failed Login', async ({ page }) => {
        await page.route('**/auth/v1/token?grant_type=password', async route => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: 'invalid_grant',
                    error_description: 'Invalid login credentials'
                })
            });
        });

        await page.goto('/');
        await page.getByRole('button', { name: 'Giriş Yap' }).first().click();

        await page.getByPlaceholder('E-posta').fill('wrong@example.com');
        await page.getByPlaceholder('Şifre').fill('wrongpass');
        await page.getByRole('button', { name: 'Giriş Yap', exact: true }).click();

        await expect(page.getByText(/Invalid login credentials|hata oluştu/i)).toBeVisible();
    });

    test('AUTH-04: Secure Logout', async ({ page }) => {
        // Mock authenticated state initially
        await page.route('**/auth/v1/user', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'user-123',
                    email: 'test@example.com',
                    user_metadata: { full_name: 'Test User' }
                })
            });
        });

        await page.route('**/auth/v1/logout', async route => {
            await route.fulfill({ status: 204 });
        });

        await page.goto('/');

        // Verify logged in
        await expect(page.getByRole('button', { name: 'Hesabım' })).toBeVisible();

        // Click logout
        await page.getByRole('button', { name: 'Hesabım' }).click();

        // Wait for logout call and reload
        const reloadPromise = page.waitForEvent('load');

        // Change mock to unauthenticated for the reload
        // Note: This is tricky if the request flies before we change the handler.
        // We can just expect the next request to return 401.

        await page.getByText('Çıkış Yap').click();

        // Update mock for next requests
        await page.unroute('**/auth/v1/user');
        await page.route('**/auth/v1/user', async route => {
            await route.fulfill({
                status: 401,
                body: JSON.stringify({})
            });
        });

        await reloadPromise;

        await expect(page.getByRole('button', { name: 'Giriş Yap' }).first()).toBeVisible();
    });
});
