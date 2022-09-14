const { test, expect } = require('@playwright/test');

test.describe('Home page', () => {
    test.beforeEach(async ({ page }) => {
        // Go to http://localhost:8000/
        await page.goto('http://localhost:8000/');
        // Expect redirect to Login screen
        await expect(page).toHaveURL('http://localhost:8000/accounts/login/?next=/');

        // Fill in credentials
        await page.locator('#id_login').fill(process.env.E2E_USERNAME);
        await page.locator('#id_password').fill(process.env.E2E_PASSWORD);
        await page.locator('[type=submit]').click()

        // Expect being redirected to Homescreen
        await expect(page).toHaveURL('http://localhost:8000/')
    });

    test.describe('Navbar', () => {
        test('Brand', async ({ page }) => {
            // Expect to have "PhenObs | " in the brand
            await expect(page.locator('#brand')).toContainText('PhenObs | ');
            // Expect brand to have home page URL
            await expect(page.locator('#brand')).toHaveAttribute('href', '/');

            // Expect to be online
            await expect(page.locator('#online')).not.toHaveClass('d-none');
            await expect(page.locator('#offline')).toHaveClass('text-offline d-none');
        });

        test('Items', async ({ page }) => {
            // Expect to have Home
            await expect(page.locator('#navbarSupportedContent')).toContainText('Home');
            // Expect to have Observations
            await expect(page.locator('#navbarSupportedContent')).toContainText('Observations');
            // Expect to have Administration
            await expect(page.locator('#navbarSupportedContent')).toContainText('Administration');
            // Expect to have Help
            await expect(page.locator('#navbarSupportedContent')).toContainText('Help');
            // Expect to have Sign Out
            await expect(page.locator('#navbarSupportedContent')).toContainText('Sign Out');

            // Expect to have Local and Overview in Observations dropdown
            await expect(page.locator('#navbarSupportedContent')).toContainText('Local');
            await expect(page.locator('#navbarSupportedContent')).toContainText('Overview');
        });

        test('Home | Active', async ({ page }) => {
            // Expect to have active class in class list
            await expect(page.locator('#home')).toHaveClass('nav-link active');
        });

        test("Buttons", async ({ page }) => {
            // Expect to have Local observations button displayed
            await expect(page.locator('.wide-button.offline-feature')).toContainText('Local observations');
            // Expect to have Add collection button displayed
            await expect(page.locator('.wide-button.online-feature')).toContainText('Add collection');
        });

        test("Imprint", async ({ page }) => {
            // Expect to have Imprint link displayed
            await expect(page.locator('.imprint')).toContainText('Imprint');
            // Expect to have /imprint/ URL on the link
            await expect(page.locator('.imprint')).toHaveAttribute('href', '/imprint/');
        });
    });

    test('Jumbotron details', async ({ page }) => {
        // Expect to have Halle garden name displayed
        await expect(page.locator('div h1.display-3 strong')).toContainText('Halle: Halle-1');

        // Today's date string
        const todayString = new Date().toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        // Expect date string to be equal to today's date string
        await expect(page.locator('#home-date')).toHaveText(todayString);

        // Expect having login name to be displayed in the corner
        await expect(page.locator('div h1.display-4.text-right strong')).toContainText('zxyctn');
    });
});
