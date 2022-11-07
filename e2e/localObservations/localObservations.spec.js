const { test, expect } = require('@playwright/test');
const { admin } = require('../helpers/login/userEnvironments.js');
const login = require('../helpers/login/login.js');

// Month starts at 0 for January
const dateToString = (year, month, day) => {
    return new Date(year, month, day).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

test.describe.parallel('Local observations', () => {
    let page = null;
    let context = null;

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();
        await login(page, admin);
        await page.goto(process.env.E2E_INDEX + 'observations/');
    });

    // test.beforeEach(async ({ page }) => {
    //     await login(page, admin);
    //     await page.goto(process.env.E2E_INDEX + 'observations/');
    // });

    test('Jumbotron details', async () => {
        // Expect to have main garden name displayed in the header of the jumbotron
        await expect(page.locator('.jumbotron-fluid.custom-jumbotron .row h1')).toHaveText(`${admin.main_garden_name} collections`);

        // Expect to not have any collections displayed yet
        await expect(page.locator('#notsaved-collections-table tbody tr')).toHaveCount(0);
        await expect(page.locator('#saved-collections-table tbody tr')).toHaveCount(0);
    });

    test('Get collections', async () => {
        // Get online collections for the garden
        await page.locator('#get-collections').click();

        // Expect to find 3 collections available on DB
        await expect(page.locator('#notsaved-collections-table tbody tr')).toHaveCount(0);
        await expect(page.locator('#saved-collections-table tbody tr')).toHaveCount(3);

        // Locate 3 collections
        const collection1 = page.locator('#saved-collections-table tbody tr:has(td i[id="1-edit"])');
        const collection2 = page.locator('#saved-collections-table tbody tr:has(td i[id="2-edit"])');
        const collection3 = page.locator('#saved-collections-table tbody tr:has(td i[id="3-edit"])');

        // Convert collection dates to locale strings
        const collection1Date = dateToString(2022, 8, 29);
        const collection2Date = dateToString(2022, 9, 3);
        const collection3Date = dateToString(2022, 9, 3);

        // Validate collection 1 details
        await expect(collection1.locator('th.date-table-cell')).toHaveText(collection1Date);
        await expect(collection1.locator('td.creator-table-cell')).toHaveText(admin.username);
        await expect(collection1.locator('td.garden-table-cell')).toHaveText(admin.subgarden_name);
        await expect(collection1.locator('td img')).toHaveId('1-online');
        await expect(collection1.locator('td img')).toHaveAttribute('src', '/static/images/db_check_success.png');
        await expect(collection1.locator('td.icon-table-cell i.bi-pencil-fill')).toHaveId('1-edit');
        // Validate collection 2 details
        await expect(collection2.locator('th.date-table-cell')).toHaveText(collection2Date);
        await expect(collection2.locator('td.creator-table-cell')).toHaveText(admin.username);
        await expect(collection2.locator('td.garden-table-cell')).toHaveText('Subgarden 2');
        await expect(collection2.locator('td.d-flex img')).toHaveId('2-online');
        await expect(collection2.locator('td.d-flex img')).toHaveAttribute('src', '/static/images/db_gray.png');
        await expect(collection2.locator('td.d-flex i.bi-exclamation-circle-fill')).toHaveId('2-unfinished');
        await expect(collection2.locator('td.icon-table-cell i.bi-pencil-fill')).toHaveId('2-edit');
        // Validate collection 3 details
        await expect(collection3.locator('th.date-table-cell')).toHaveText(collection3Date);
        await expect(collection3.locator('td.creator-table-cell')).toHaveText(admin.username);
        await expect(collection3.locator('td.garden-table-cell')).toHaveText(admin.subgarden_name);
        await expect(collection3.locator('td img')).toHaveId('3-online');
        await expect(collection3.locator('td img')).toHaveAttribute('src', '/static/images/db_check_success.png');
        await expect(collection3.locator('td.icon-table-cell i.bi-pencil-fill')).toHaveId('3-edit');
    });

    test('Edit unfinished collection and delete', async () => {
        // Get online collections for the garden
        await page.locator('#get-collections').click();

        // Locate the unfinished collection 2
        let collection2 = page.locator('#saved-collections-table tbody tr:has(td i[id="2-edit"])');

        // Edit the collection
        await collection2.locator('td i[id="2-edit"]').click();
        await expect(page).toHaveURL(process.env.E2E_INDEX + 'observations/edit/2');

        // Get local storage
        let localStorage = "";
        while (!(localStorage.includes("collections"))) {
            localStorage = await page.evaluate(() => JSON.stringify(localStorage));
            if (localStorage.includes("collections"))
                while (!(localStorage.includes(admin.username))) {
                    localStorage = await page.evaluate(() => JSON.stringify(localStorage));
                }
        }
        let entries = JSON.parse(localStorage);
        let collections = JSON.parse(entries["collections"]);
        let collection = collections[2];

        // Verify locally stored collection 2 details
        await expect(collection).toBeDefined();
        await expect(collection["creator"]).toStrictEqual(admin.username)
        await expect(collection["date"]).toStrictEqual("2022-10-03");
        await expect(collection["edited"]).toStrictEqual(false);
        await expect(collection["finished"]).toStrictEqual(false);
        await expect(collection["uploaded"]).toStrictEqual(true);
        await expect(collection["last-collection-id"]).toBeNull();
        await expect(collection["id"]).toStrictEqual(2);
        await expect(collection["garden"]).toStrictEqual(3);
        await expect(collection["garden-name"]).toStrictEqual("Subgarden 2");
        await expect(collection["remaining"]).toStrictEqual([1]);
        await expect(collection["records"]).toBeDefined();
        await expect(collection["records"][1]).toBeDefined();
        await expect(collection["records"][1]["covered-artificial"]).toStrictEqual(false);
        await expect(collection["records"][1]["covered-natural"]).toStrictEqual(false);
        await expect(collection["records"][1]["cut-partly"]).toStrictEqual(false);
        await expect(collection["records"][1]["cut-total"]).toStrictEqual(false);
        await expect(collection["records"][1]["removed"]).toStrictEqual(false);
        await expect(collection["records"][1]["transplanted"]).toStrictEqual(false);
        await expect(collection["records"][1]["no-observation"]).toStrictEqual(false);
        await expect(collection["records"][1]["done"]).toStrictEqual(false);
        await expect(collection["records"][1]["flowering-intensity"]).toBeNull();
        await expect(collection["records"][1]["flowers-opening"]).toStrictEqual("no");
        await expect(collection["records"][1]["peak-flowering"]).toStrictEqual("no");
        await expect(collection["records"][1]["peak-flowering-estimation"]).toStrictEqual("no");
        await expect(collection["records"][1]["senescence"]).toStrictEqual("no");
        await expect(collection["records"][1]["senescence-intensity"]).toBeNull();
        await expect(collection["records"][1]["young-leaves-unfolding"]).toStrictEqual("no");
        await expect(collection["records"][1]["initial-vegetative-growth"]).toStrictEqual("no");
        await expect(collection["records"][1]["plant"]).toStrictEqual("TestPlant7-1");
        await expect(collection["records"][1]["id"]).toBe(13);
        await expect(collection["records"][1]["order"]).toStrictEqual(1);

        // Go back to the local observations screen
        await page.goto(process.env.E2E_INDEX + 'observations/');
        await expect(page).toHaveURL(process.env.E2E_INDEX + 'observations/');
        // Expect to have the collection 2 displayed in not saved table
        await expect(page.locator('#notsaved-collections-table tbody tr')).toHaveCount(1);
        await expect(page.locator('#saved-collections-table tbody tr')).toHaveCount(0);
        // Check the details
        collection2 = page.locator('#notsaved-collections-table tbody tr:has(td i[id="2-edit"])');
        await expect(collection2.locator('td.icon-table-cell a i.bi-trash-fill')).toHaveId('2-cancel');
        await expect(collection2.locator('td.icon-table-cell i.bi-hdd-fill')).toHaveId('2-local');
        // Delete collection
        await page.locator('td.icon-table-cell a:has(i.bi-trash-fill)').click();
        await page.locator('button[id="confirm-yes"]').click();
        // Verify no collection is saved
        await expect(page.locator('#notsaved-collections-table tbody tr')).toHaveCount(0);
        await expect(page.locator('#saved-collections-table tbody tr')).toHaveCount(0);
        // Verify localStorage to be empty
        localStorage = await page.evaluate(() => JSON.stringify(localStorage));
        entries = JSON.parse(localStorage);
        collections = JSON.parse(entries["collections"]);
        await expect(collections).toStrictEqual({});
    });

    test('Edit finished collection and save', async () => {
        // Get online collections
        await page.locator('#get-collections').click();

        // Expect to have no collections saved
        await expect(page.locator('#notsaved-collections-table tbody tr')).toHaveCount(0);
        await expect(page.locator('#saved-collections-table tbody tr')).toHaveCount(3);
        // Locate the finished collection 3
        let collection3 = page.locator('#saved-collections-table tbody tr:has(td i[id="3-edit"])');

        // Edit the collection
        await collection3.locator('td i[id="3-edit"]').click();
        await expect(page).toHaveURL(process.env.E2E_INDEX + 'observations/edit/3');
        // Edit a value
        await page.locator('#plant').selectOption('TestPlant1');
        await page.locator('#initial-vegetative-growth').selectOption('m');

        // Get local storage
        let localStorage = "";
        while (!(localStorage.includes("collections"))) {
            localStorage = await page.evaluate(() => JSON.stringify(localStorage));
            if (localStorage.includes("collections"))
                while (!(localStorage.includes(admin.username))) {
                    localStorage = await page.evaluate(() => JSON.stringify(localStorage));
                }
        }
        let entries = JSON.parse(localStorage);
        let collections = JSON.parse(entries["collections"]);
        let collection = collections[3];

        // Verify locally stored collection 3 details
        await expect(collection).toBeDefined();
        await expect(collection["creator"]).toStrictEqual(admin.username)
        await expect(collection["date"]).toStrictEqual("2022-10-03");
        await expect(collection["edited"]).toStrictEqual(true);
        await expect(collection["finished"]).toStrictEqual(true);
        await expect(collection["uploaded"]).toStrictEqual(false);
        await expect(collection["last-collection-id"]).toStrictEqual(1);
        await expect(collection["id"]).toStrictEqual(3);
        await expect(collection["garden"]).toStrictEqual(2);
        await expect(collection["garden-name"]).toStrictEqual("Subgarden 1");
        await expect(collection["remaining"]).toStrictEqual([]);
        await expect(collection["records"]).toBeDefined();
        await expect(collection["records"][1]).toBeDefined();
        await expect(collection["records"][1]["covered-artificial"]).toStrictEqual(false);
        await expect(collection["records"][1]["covered-natural"]).toStrictEqual(false);
        await expect(collection["records"][1]["cut-partly"]).toStrictEqual(false);
        await expect(collection["records"][1]["cut-total"]).toStrictEqual(false);
        await expect(collection["records"][1]["removed"]).toStrictEqual(false);
        await expect(collection["records"][1]["transplanted"]).toStrictEqual(false);
        await expect(collection["records"][1]["no-observation"]).toStrictEqual(false);
        await expect(collection["records"][1]["done"]).toStrictEqual(true);
        await expect(collection["records"][1]["flowering-intensity"]).toStrictEqual("");
        await expect(collection["records"][1]["flowers-opening"]).toStrictEqual("no");
        await expect(collection["records"][1]["peak-flowering"]).toStrictEqual("no");
        await expect(collection["records"][1]["peak-flowering-estimation"]).toStrictEqual("no");
        await expect(collection["records"][1]["senescence"]).toStrictEqual("no");
        await expect(collection["records"][1]["senescence-intensity"]).toStrictEqual("");
        await expect(collection["records"][1]["young-leaves-unfolding"]).toStrictEqual("no");
        await expect(collection["records"][1]["initial-vegetative-growth"]).toStrictEqual("m");
        await expect(collection["records"][1]["plant"]).toStrictEqual("TestPlant1-1");
        await expect(collection["records"][1]["id"]).toBe(7);
        await expect(collection["records"][1]["order"]).toStrictEqual(1);

        // Edit the value back to its older state
        await page.locator('#initial-vegetative-growth').selectOption('no');
        // Check local storage again
        localStorage = await page.evaluate(() => JSON.stringify(localStorage));
        entries = JSON.parse(localStorage);
        collections = JSON.parse(entries["collections"]);
        collection = collections[3];
        await expect(collection["records"][1]["initial-vegetative-growth"]).toStrictEqual("no");

        // Go back to local observations screen
        await page.goto(process.env.E2E_INDEX + 'observations/');
        await expect(page).toHaveURL(process.env.E2E_INDEX + 'observations/');
        // Expect to have the collection 2 displayed in not saved table
        await expect(page.locator('#notsaved-collections-table tbody tr')).toHaveCount(1);
        await expect(page.locator('#saved-collections-table tbody tr')).toHaveCount(1);
        // Check the details
        collection3 = page.locator('#notsaved-collections-table tbody tr:has(td i[id="3-edit"])');
        await expect(collection3.locator('td.icon-table-cell a i.bi-trash-fill')).toHaveId('3-cancel');
        await expect(collection3.locator('td.icon-table-cell i.bi-hdd-fill')).toHaveId('3-local');
        await expect(collection3.locator('td.icon-table-cell a img')).toHaveId('3-upload');
        // Save the collection
        await page.locator('td.icon-table-cell a:has(img[id="3-upload"])').click();
        await expect(page.locator('p[id="alert-body"]')).toHaveText("Collection successfully saved to database!");
        await page.locator('button[id="alert-okay"]').click();
        // Verify now 2 collections are saved on device
        await expect(page.locator('#notsaved-collections-table tbody tr')).toHaveCount(0);
        await expect(page.locator('#saved-collections-table tbody tr')).toHaveCount(2);
        let collection1 = page.locator('#saved-collections-table tbody tr:has(td i[id="1-edit"])');
        // Delete the collection 3
        await page.locator('td.icon-table-cell a:has(i.bi-trash-fill[id="3-cancel"])').click();
        await page.locator('button[id="confirm-yes"]').click();
        // Delete the collection 1
        await page.locator('td.icon-table-cell a:has(i.bi-trash-fill[id="1-cancel"])').click();
        await page.locator('button[id="confirm-yes"]').click();
        // Verify now no colletions are saved on device
        await expect(page.locator('#notsaved-collections-table tbody tr')).toHaveCount(0);
        await expect(page.locator('#saved-collections-table tbody tr')).toHaveCount(0);
        // Verify localStorage to be empty
        localStorage = await page.evaluate(() => JSON.stringify(localStorage));
        entries = JSON.parse(localStorage);
        collections = JSON.parse(entries["collections"]);
        await expect(collections).toStrictEqual({});
    });

    test('Offline', async () => {
        // Get online collections
        await page.locator('#get-collections').click();

        // Edit a collection first
        await page.locator('td i[id="3-edit"]').click();
        await expect(page).toHaveURL(process.env.E2E_INDEX + 'observations/edit/3');
        await page.locator('#plant').selectOption('TestPlant1');
        await page.locator('#initial-vegetative-growth').selectOption('m');
        await page.goto(process.env.E2E_INDEX + 'observations/');
        await expect(page).toHaveURL(process.env.E2E_INDEX + 'observations/');

        // Set connection status offline
        await page.context().setOffline(true);
        // Try getting online collections while offline
        await page.locator('#get-collections').click();
        // Expect to get an alert about unavailability
        const alert = page.locator('#alert');
        await expect(alert).toBeVisible();
        await expect(alert.locator('div.modal-body p[id="alert-body"]')).toHaveText("Get collections functionality is not available offline.");
        await page.locator('button[id="alert-okay"]').click();
        await expect(alert).not.toBeVisible();

        // Try editing a collection while offline
        await page.locator('i[id="3-edit"]').click();
        await expect(alert).toBeVisible();
        await expect(alert.locator('div.modal-body p[id="alert-body"]')).toHaveText("Edit functionality is not available in offline mode");
        await page.locator('button[id="alert-okay"]').click();
        await expect(alert).not.toBeVisible();

        // Try adding a colleciton while offline
        await page.locator('#add-collection').click();
        await expect(alert).toBeVisible();
        await expect(alert.locator('div.modal-body p[id="alert-body"]')).toHaveText("Add functionality is not available in offline mode");
        await page.locator('button[id="alert-okay"]').click();
        await expect(alert).not.toBeVisible();

        // Try saving a colleciton while offline
        await page.locator('a:has(img[id="3-upload"])').click();
        await expect(alert).toBeVisible();
        await expect(alert.locator('div.modal-body p[id="alert-body"]')).toHaveText("Saving is not available in offline mode");
        await page.locator('button[id="alert-okay"]').click();
        await expect(alert).not.toBeVisible();

        // Try deleting in offline mode
        await page.locator('td.icon-table-cell a:has(i.bi-trash-fill[id="3-cancel"])').click();
        await page.locator('button[id="confirm-yes"]').click();
        await page.locator('td.icon-table-cell a:has(i.bi-trash-fill[id="1-cancel"])').click();
        await page.locator('button[id="confirm-yes"]').click();
    });
});
