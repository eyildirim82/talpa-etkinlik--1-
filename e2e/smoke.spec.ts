import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Talpa/i);
});

test('navigation bar is present', async ({ page }) => {
    // Capture logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

    // Capture network errors
    page.on('response', response => {
        if (response.status() >= 400) {
            console.log(`NETWORK ERROR: ${response.url()} returned ${response.status()}`);
        }
    });

    await page.goto('/');

    // Check if stuck in loading
    const loading = page.getByText('Loading...');
    try {
        if (await loading.isVisible({ timeout: 2000 })) {
            console.log('App is initially showing loading state...');
        }
    } catch (e) {
        // ignore
    }

    // Verify the header/nav exists
    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 20000 });
});
