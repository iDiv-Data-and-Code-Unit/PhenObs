const { test, expect } = require('@playwright/test');
const mainGardenUserLogin = require('./login/mainGardenAssignedUser.js');

test.describe('Home page', () => {
    test.beforeEach(mainGardenUserLogin);

    test.describe('Navbar', () => {
        test('Brand', async ({ page }) => {
            // Expect to have "PhenObs | " in the brand
            await expect(page.locator('#brand')).toContainText('PhenObs | ');
            // Expect brand to have home page URL
            await expect(page.locator('#brand')).toHaveAttribute('href', '/');

            // Expect to be online
            await expect(page.locator('#online')).toBeVisible();
            await expect(page.locator('#offline')).toBeHidden();
        });

        test('Items', async ({ page }) => {
            // Select Navbar links
            const navLinks = page.locator('.navbar-nav .nav-item .nav-link');
            // Expected options in Navbar
            const navLinkTexts = ['Home', 'Observations', 'Observations', 'Help', 'Sign Out'];

            // Select Observation links
            const observationLinks = page.locator('.dropdown-item');
            // Expected options under Observations
            const observationLinkTexts = ['Local', 'Overview'];

            // Check if all the expected navbar items are found
            for (let i = 0; i < navLinks.length; ++i)
                expect(navLinks.nth(i).textContent()).toHaveText(navLinkTexts[i]);
            // Check if all the expected observation options are found
            for (let i = 0; i < observationLinks.length; ++i)
                expect(observationLinks.nth(i).textContent()).toHaveText(observationLinkTexts[i]);
        });

        test('Home | Active', async ({ page }) => {
            // Expect to have active class in class list
            await expect(page.locator('#home')).toHaveClass('nav-link active');
        });

        test("Imprint", async ({ page }) => {
            // Expect to have Imprint link displayed
            await expect(page.locator('.imprint')).toHaveText('Imprint');
            // Expect to have /imprint/ URL on the link
            await expect(page.locator('.imprint')).toHaveAttribute('href', '/imprint/');
        });
    });

    test('Jumbotron details', async ({ page }) => {
        // Expect to have Halle garden name displayed
        await expect(page.locator('div h1.display-3 strong')).toHaveText('Garden');

        // Today's date string
        const todayString = new Date().toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        // Expect date string to be equal to today's date string
        await expect(page.locator('#home-date')).toHaveText(todayString);

        // Expect having login name to be displayed in the corner
        await expect(page.locator('div h1.display-4.text-right strong')).toHaveText('main_garden');
    });
});
