const { test, expect } = require('@playwright/test');
const { multiple_gardens } = require('../helpers/login/userEnvironments.js');
const login = require('../helpers/login/login.js');

test.describe('Home page', () => {
    let page = null;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await login(page, multiple_gardens);
    });

    test('Navbar | Brand', async () => {
        // Expect to have "PhenObs | " in the brand
        await expect(page.locator('#brand')).toContainText('PhenObs | ');
        // Expect brand to have home page URL
        await expect(page.locator('#brand')).toHaveAttribute('href', '/');

        // Expect to be online
        await expect(page.locator('#online')).toBeVisible();
        await expect(page.locator('#offline')).toBeHidden();
    });

    test('Navbar | Items', async () => {
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

    test('Home | Error', async () => {
        // Expect to have 'Error' in title
        await expect(page).toHaveTitle('Error');
    });

    test('Home | Jumbotron details', async () => {
        // Expect to get an error about no subgarden assignment
        await expect(page.locator('div.jumbotron-fluid.custom-jumbotron h1')).toHaveText('Error');
        await expect(page.locator('div.jumbotron-fluid.custom-jumbotron p')).toHaveText(`Multiple gardens are assigned to the user. Please assign only one subgarden per user. Assigned gardens are: 'Subgarden 1', 'Subgarden 2'`);
    });

    test("Imprint", async () => {
        // Expect to have Imprint link displayed
        await expect(page.locator('.imprint')).toHaveText('Imprint');
        // Expect to have /imprint/ URL on the link
        await expect(page.locator('.imprint')).toHaveAttribute('href', '/imprint/');
    });
});
