const { expect } = require('@playwright/test');

module.exports = async ({ page }) => {
    // Go to http://localhost:8000/
    await page.goto('http://localhost:8000/');
    // Expect redirect to Login screen
    await expect(page).toHaveURL('http://localhost:8000/accounts/login/?next=/');

    // Fill in credentials
    await page.locator('#id_login').fill(process.env.E2E_USER_USERNAME);
    await page.locator('#id_password').fill(process.env.E2E_USER_PASSWORD);
    await page.locator('[type=submit]').click()

    // Expect being redirected to Homescreen
    await expect(page).toHaveURL('http://localhost:8000/')

    // Check Session Storage variables
    const sessionStorage = await page.evaluate(() => JSON.stringify(sessionStorage));
    const entries = JSON.parse(sessionStorage);
    await expect(entries['loggedIn']).toStrictEqual('user');
    await expect(entries['mainGardenName']).toStrictEqual('Garden');
    await expect(entries['subgardenName']).toStrictEqual('Subgarden');
    await expect(entries['mainGardenId']).toStrictEqual('21');
    await expect(entries['subgardenId']).toStrictEqual('22');
};
