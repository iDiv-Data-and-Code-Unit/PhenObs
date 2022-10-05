const { expect } = require('@playwright/test');

module.exports = async function (page, user) {
    // Go to http://localhost:8000/
    await page.goto(process.env.E2E_INDEX);
    // Expect redirect to Login screen
    await expect(page).toHaveURL(process.env.E2E_INDEX + 'accounts/login/?next=/');

    // Fill in credentials
    await page.locator('#id_login').fill(user.username);
    await page.locator('#id_password').fill(user.password);
    await page.locator('[type=submit]').click()

    // Expect being redirected to Homescreen
    await expect(page).toHaveURL(process.env.E2E_INDEX)

    // Check Session Storage variables
    let sessionStorage = null;
    while (true) {
        sessionStorage = await page.evaluate(() => JSON.stringify(sessionStorage));
        const entries = JSON.parse(sessionStorage);
        if (entries['loggedIn'] != undefined)
            break;
    }
    const entries = JSON.parse(sessionStorage);
    await expect(entries['loggedIn']).toStrictEqual(user.username);
    await expect(entries['mainGardenName']).toStrictEqual(user.main_garden_name);
    await expect(entries['subgardenName']).toStrictEqual(user.subgarden_name);
    await expect(entries['mainGardenId']).toStrictEqual(user.main_garden_id);
    await expect(entries['subgardenId']).toStrictEqual(user.subgarden_id);
};
