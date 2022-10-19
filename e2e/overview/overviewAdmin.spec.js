const { test, expect } = require('@playwright/test');
const { admin } = require('../helpers/login/userEnvironments.js');
const login = require('../helpers/login/login.js');

test.describe('Overview => Admin', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, admin);
        await page.goto(process.env.E2E_INDEX + 'observations/overview/');
    });

    test.afterAll(async ({ page }) => {
        await page.close();
    });

    test('Check garden options', async ({ page }) => {
        // There are 10 options including 1 empty and following 9
        await expect(page.locator('#gardens option')).toHaveCount(10);
        await expect(page.locator('#gardens option[id="all"]')).toHaveCount(1);
        await expect(page.locator('#gardens option[id="1"]')).toHaveCount(1);
        await expect(page.locator('#gardens option[id="2"]')).toHaveCount(1);
        await expect(page.locator('#gardens option[id="3"]')).toHaveCount(1);
        await expect(page.locator('#gardens option[id="4"]')).toHaveCount(1);
        await expect(page.locator('#gardens option[id="5"]')).toHaveCount(1);
        await expect(page.locator('#gardens option[id="6"]')).toHaveCount(1);
        await expect(page.locator('#gardens option[id="7"]')).toHaveCount(1);
        await expect(page.locator('#gardens option[id="8"]')).toHaveCount(1);
    });
    // TODO: check all after adding a new collection to a different garden
    test('Choose "all" option and verify collections shown', async ({ page }) => {
    });

    test('Add a new collection', async ({ page }) => {
    });

    test('Edit a single collection', async ({ page }) => {
    });

    test('Edit multiple collections', async ({ page }) => {
    });
});
