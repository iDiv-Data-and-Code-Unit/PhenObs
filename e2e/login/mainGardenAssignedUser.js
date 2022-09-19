const { expect } = require('@playwright/test');

module.exports = async ({ page }) => {
    // Go to http://localhost:8000/
    await page.goto('http://localhost:8000/');
    // Expect redirect to Login screen
    await expect(page).toHaveURL('http://localhost:8000/accounts/login/?next=/');

    // Fill in credentials
    await page.locator('#id_login').fill(process.env.E2E_MAIN_GARDEN_USERNAME);
    await page.locator('#id_password').fill(process.env.E2E_MAIN_GARDEN_PASSWORD);
    await page.locator('[type=submit]').click()

    // Expect being redirected to Homescreen
    await expect(page).toHaveURL('http://localhost:8000/')

    // Check Session Storage variables
    const sessionStorage = await page.evaluate(() => JSON.stringify(sessionStorage));
    const entries = JSON.parse(sessionStorage);
    await expect(entries['loggedIn']).toStrictEqual('main_garden');
    await expect(entries['mainGardenName']).toEqual('None');
    await expect(entries['subgardenName']).toStrictEqual('Garden');
    await expect(entries['mainGardenId']).toEqual('');
    await expect(entries['subgardenId']).toStrictEqual('21');
};
