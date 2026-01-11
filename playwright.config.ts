import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    timeout: 30000, // Test başına maksimum 30 saniye
    expect: {
        timeout: 5000, // Assertion'lar için 5 saniye
    },
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        actionTimeout: 10000, // Action'lar için 10 saniye
        navigationTimeout: 10000, // Navigation için 10 saniye
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000, // 2 dakika bekle
        stdout: 'pipe',
        stderr: 'pipe',
    },
});
