const { expect } = require('@playwright/test');

module.exports = async ({ page }) => {
    // Go to http://localhost:8000/
    await page.goto('http://localhost:8000/');
    // Expect redirect to Login screen
    await expect(page).toHaveURL('http://localhost:8000/accounts/login/?next=/');

    // Fill in credentials
    await page.locator('#id_login').fill(process.env.E2E_MULTIPLE_GARDENS_USERNAME);
    await page.locator('#id_password').fill(process.env.E2E_MULTIPLE_GARDENS_PASSWORD);
    await page.locator('[type=submit]').click()

    // Expect being redirected to Homescreen
    await expect(page).toHaveURL('http://localhost:8000/')

    // Check Session Storage variables
    const sessionStorage = await page.evaluate(() => JSON.stringify(sessionStorage));
    const entries = JSON.parse(sessionStorage);
    await expect(entries['loggedIn']).toStrictEqual('multiple_gardens');
    await expect(entries['mainGardenName']).toEqual('');
    await expect(entries['subgardenName']).toEqual('');
    await expect(entries['mainGardenId']).toEqual('');
    await expect(entries['subgardenId']).toEqual('');
};
