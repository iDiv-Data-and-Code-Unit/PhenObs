const {
    test,
    expect
} = require('@playwright/test');
const {
    add_user
} = require('../helpers/login/userEnvironments.js');
const login = require('../helpers/login/login.js');

test.describe.parallel('Add collection', () => {
    // let page = null;
    // let context = null;
    let created = [];
    // let isMobileBrowser = null;

    const selectSubgarden = async (page, option) => {
        await page.locator('#subgarden').click();
        await page.waitForTimeout(100);
        await page.locator('#subgarden').selectOption(option);
        await page.waitForTimeout(100);
        await page.locator('#subgarden').evaluate(e => e.blur());
        await page.waitForTimeout(100);

        let collectionID = null;
        // await page.waitForTimeout(100);
        while (collectionID == null)
            collectionID = await page.locator(`#subgarden option[value="${option}"]`).getAttribute('id');
        return collectionID;
    }

    // test.beforeAll(async ({ browser, isMobile }) => {
    //     context = await browser.newContext();
    //     page = await context.newPage();
    //     await login(page, add_user);
    //     isMobileBrowser = isMobile;
    // });

    test.beforeEach(async ({
        page
    }) => {
        await login(page, add_user);
        await page.goto(process.env.E2E_INDEX + 'observations/');
        await page.waitForTimeout(100);
        await page.locator('#add-collection').click();
        await page.evaluate(() => window.onbeforeunload = null);
    });

    // Delete all the created collections in the end
    // test.beforeEach(async() => {
    //     await page.goto(process.env.E2E_INDEX + 'observations/');
    //     await page.waitForTimeout(100);
    //     await page.locator('#add-collection').click();
    // })

    // test.afterAll(async () => {
    //     for (const collectionID of created) {
    //         const response = await page.request.delete(`${process.env.E2E_INDEX}observations/delete/${collectionID}/`);
    //         // await page.waitForTimeout(500);
    //         const text = await response.json();
    //         await expect(text).toStrictEqual("OK");
    //     }
    // });

    test.afterEach(async ({
        page,
        storageState
    }) => {
        // Delete all the created collections
        console.log(created);

        let csrftoken = null;
        const contextStorage = await page.context().storageState();
        for (let cookie of contextStorage.cookies) {
            if (cookie.name === 'csrftoken') {
                csrftoken = cookie.value;
                break;
            }
        }

        for (let collectionID of created) {
            console.log(`${process.env.E2E_INDEX}observations/delete/${collectionID}/`);
            let response = await page.request.delete(
                `${process.env.E2E_INDEX}observations/delete/${collectionID}/`, {
                    headers: {
                        'X-CSRFToken': csrftoken,
                    }
                }
            );
            // await page.waitForTimeout(500);
            let text = await response.json();
            await expect(text).toStrictEqual("OK");
        }
        // Reset the created array
        created = [];
        // Reset the local storage for the window
        await page.evaluate(() => window.localStorage.setItem("collections", "{}"));
    });

    test.afterAll(async ({
        page
    }) => {
        await page.close();
    });

    test('Before choosing a subgarden', async ({
        page
    }) => {
        // Verify URL
        await expect(page).toHaveURL(process.env.E2E_INDEX + 'observations/add/');

        // Verify collection date
        await expect(page.locator('#collection-date')).toHaveValue('');

        // Verify available subgarden options
        const garden = page.locator('#subgarden');
        await expect(page.locator('#subgarden-button.online-feature')).toBeDefined();
        await expect(garden.locator('option')).toHaveCount(3);
        await expect(garden.locator('#empty')).toBeDefined();
        await expect(garden.locator('[name="5"]')).toHaveAttribute('value', 'AddSubgarden1');
        await expect(garden.locator('[name="5"]')).toContainText('+ AddSubgarden1');
        await expect(garden.locator('[name="6"]')).toHaveAttribute('value', 'AddSubgarden2');
        await expect(garden.locator('[name="6"]')).toContainText('+ AddSubgarden2');

        // Verify creator info
        await expect(page.locator('#creator')).toHaveText('');

        // Verify sorting type
        await expect(page.locator('#orderedList')).toHaveAttribute('name', 'alpha');
        await expect(page.locator('#orderedList')).toHaveClass('bi bi-sort-alpha-down text-offline');

        // Verify dropdown defaults
        await expect(page.locator('#plant option')).toHaveCount(0);
        await expect(page.locator('#initial-vegetative-growth')).toHaveValue('no');
        await expect(page.locator('#young-leaves-unfolding')).toHaveValue('no');
        await expect(page.locator('#flowers-opening')).toHaveValue('no');
        await expect(page.locator('#peak-flowering')).toHaveValue('no');
        await expect(page.locator('#peak-flowering')).toBeDisabled();
        await expect(page.locator('#flowering-intensity')).toHaveValue('');
        await expect(page.locator('#flowering-intensity')).toBeDisabled();
        await expect(page.locator('#ripe-fruits')).toHaveValue('no');
        await expect(page.locator('#senescence')).toHaveValue('no');
        await expect(page.locator('#senescence-intensity')).toHaveValue('');
        await expect(page.locator('#senescence-intensity')).toBeDisabled();

        // Maintenance options defaults
        await expect(page.locator('#cut-partly')).not.toBeChecked();
        await expect(page.locator('#cut-total')).not.toBeChecked();
        await expect(page.locator('#covered-natural')).not.toBeChecked();
        await expect(page.locator('#covered-artificial')).not.toBeChecked();
        await expect(page.locator('#transplanted')).not.toBeChecked();
        await expect(page.locator('#removed')).not.toBeChecked();

        // Remarks
        await expect(page.locator('#remarks')).toHaveValue('');

        // No observation
        await expect(page.locator('#no-observation')).not.toBeChecked();

        // Done button
        await expect(page.locator('#done-btn')).toBeDisabled();
        await expect(page.locator('#done-btn')).toHaveText('Done');
    });

    test('Choosing gardens', async ({
        page,
        context
    }) => {
        // Verify 3 garden options are being displayed with empty option being selected
        await expect(page.locator('#subgarden option')).toHaveCount(3);
        await expect(page.locator('#subgarden #empty')).toHaveCount(1);

        // Choose subgarden AddSubgarden1
        const collection1ID = await selectSubgarden(page, 'AddSubgarden1');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').selectOption('AddSubgarden1');
        // await page.locator('#subgarden').evaluate(e => e.blur());

        // Getting the collection ID for added AddSubgarden1 collection
        // const collection1ID = await page.locator('#subgarden option[value="AddSubgarden1"]').getAttribute('id');
        // await expect(collection1ID).not.toBeNull();
        created.push(collection1ID);

        const garden = await page.locator('#subgarden');

        // Verify empty subgarden option has been removed
        await expect(garden.locator('option')).toHaveCount(2);
        await expect(garden.locator('#empty')).toHaveCount(0);

        // Verify the strings for the subgardens
        await expect(garden.locator('option[name="5"]')).not.toContainText('+');
        await expect(garden.locator('option[name="6"]')).toContainText('+');

        // Check set date as default
        const today = new Date().toLocaleDateString('en-CA'); // Returns date for today in YYYY-MM-DD format
        await expect(page.locator('#collection-date')).toHaveValue(today);

        // Check creator info
        await expect(page.locator('#creator')).toHaveText(add_user.username);

        // Verify there is empty option selected by default for the plants
        await expect(page.locator('#emptyOption')).toBeDefined();

        // Verifying ordering works
        let plantOptions = page.locator('#plant option');
        await expect(await plantOptions.nth(1).textContent()).toStrictEqual('TestPlant9');
        await expect(await plantOptions.nth(1).getAttribute('id')).toStrictEqual('1');
        await expect(await plantOptions.nth(2).textContent()).toStrictEqual('TestPlant8');
        await expect(await plantOptions.nth(2).getAttribute('id')).toStrictEqual('2');

        // Changing order to alphabetical
        await page.locator('#orderedList').click();

        // Verifying the options have been reordered
        plantOptions = page.locator('#plant option');
        await expect(await plantOptions.nth(1).textContent()).toStrictEqual('TestPlant8');
        await expect(await plantOptions.nth(1).getAttribute('id')).toStrictEqual('2');
        await expect(await plantOptions.nth(2).textContent()).toStrictEqual('TestPlant9');
        await expect(await plantOptions.nth(2).getAttribute('id')).toStrictEqual('1');

        // Choose the other subgarden
        const collection2ID = await selectSubgarden(page, 'AddSubgarden2');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').selectOption('AddSubgarden2');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').evaluate(e => e.blur());

        // Verify the strings for the subgardens
        await expect(garden.locator('option[name="5"]')).not.toContainText('+');
        await expect(garden.locator('option[name="6"]')).not.toContainText('+');

        // Getting the collection ID for added AddSubgarden2 collection
        // const collection2ID = await page.locator('#subgarden option[value="AddSubgarden2"]').getAttribute('id');
        // await expect(collection2ID).not.toBeNull();
        created.push(collection2ID);

        // Verify the garden selection is now offline available
        await page.$eval("#subgarden", el => el.classList.contains("offline-feature"));

        // Check if changing subgardens and collections work in offline
        await context.setOffline(true);
        await expect(page.locator('#subgarden')).toHaveValue('AddSubgarden2');

        await selectSubgarden(page, 'AddSubgarden1');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').selectOption('AddSubgarden1');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').evaluate(e => e.blur());

        await expect(page.locator('#subgarden')).toHaveValue('AddSubgarden1');

        // Check if the plants are shown correctly
        plantOptions = page.locator('#plant option');
        await expect(await plantOptions.nth(1).textContent()).toStrictEqual('TestPlant9');
        await expect(await plantOptions.nth(1).getAttribute('id')).toStrictEqual('1');
        await expect(await plantOptions.nth(2).textContent()).toStrictEqual('TestPlant8');
        await expect(await plantOptions.nth(2).getAttribute('id')).toStrictEqual('2');

        // Changing order to alphabetical
        await page.locator('#orderedList').click();

        // Verifying the options have been reordered
        plantOptions = page.locator('#plant option');
        await expect(await plantOptions.nth(1).textContent()).toStrictEqual('TestPlant8');
        await expect(await plantOptions.nth(1).getAttribute('id')).toStrictEqual('2');
        await expect(await plantOptions.nth(2).textContent()).toStrictEqual('TestPlant9');
        await expect(await plantOptions.nth(2).getAttribute('id')).toStrictEqual('1');

        // Choose the other garden again to see if it works in offline too
        await selectSubgarden(page, 'AddSubgarden2');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').selectOption('AddSubgarden2');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').evaluate(e => e.blur());

        // Check if the plants are shown correctly
        plantOptions = page.locator('#plant option');
        await expect(await plantOptions.nth(1).textContent()).toStrictEqual('TestPlant10');
        await expect(await plantOptions.nth(1).getAttribute('id')).toStrictEqual('1');
        await expect(await plantOptions.nth(2).textContent()).toStrictEqual('TestPlant12');
        await expect(await plantOptions.nth(2).getAttribute('id')).toStrictEqual('2');
        await expect(await plantOptions.nth(3).textContent()).toStrictEqual('TestPlant11');
        await expect(await plantOptions.nth(3).getAttribute('id')).toStrictEqual('3');

        // Check if there is an empty option displayed in plants dropdown
        await expect(page.locator('#emptyOption')).toBeDefined();

        // Select the plant with order 2 from the list
        await page.locator('#plant').click();
        await page.locator('#plant').selectOption('TestPlant12');

        // Verify the empty option has been removed from the list
        await expect(page.locator('#emptyOption')).toHaveCount(0);

        // Set context back to online
        await context.setOffline(false);
        await page.goto(process.env.E2E_INDEX + 'observations/');
    });

    test('Form controls', async ({
        page,
        context
    }) => {
        // Choose subgarden AddSubgarden1
        const collectionID = await selectSubgarden(page, 'AddSubgarden1');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').selectOption('AddSubgarden1');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').evaluate(e => e.blur());

        // Get the collection ID
        // const collectionID = await page.locator('#subgarden option[value="AddSubgarden1"]').getAttribute('id');
        // await expect(collectionID).not.toBeNull();
        created.push(collectionID);

        // Choose the first plant
        await page.locator('#plant').click();
        await page.locator('#plant').selectOption('TestPlant9');

        // Check Done button
        await expect(page.locator('#done-btn')).toBeDisabled();
        await expect(page.locator('#done-btn')).toHaveText('0/2 Done');

        // Check if the flowers opening field is disabled
        await expect(page.locator('#peak-flowering')).toBeDisabled();
        await page.$eval("#peak-flowering", el => el.classList.contains("disabled-btn"));

        // Check if the flowering intensity is disabled
        await expect(page.locator('#flowering-intensity')).toBeDisabled();
        await page.$eval("#flowering-intensity", el => el.classList.contains("disabled-btn"));
        await expect(page.locator('#flowering-intensity')).toHaveValue('');

        // Change flowers opening field to 'yes'
        await page.locator('#flowers-opening').selectOption('y');

        // Check if the flowers opening is enabled
        await expect(page.locator('#peak-flowering')).toBeEnabled();
        await page.$eval("#peak-flowering", el => !el.classList.contains("disabled-btn"));

        // Check if the flowering intensity is enabled
        await expect(page.locator('#flowering-intensity')).toBeEnabled();
        await page.$eval("#flowering-intensity", el => !el.classList.contains("disabled-btn"));

        // Try changing the plant without setting an intensity
        await page.locator('#plant').click();

        // Expect a modal dialog for a confirm
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Confirm');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('You have not changed any default value. Are you sure you want to move on?');
        await page.locator('div.modal.fade.show .modal-dialog #confirm-yes').click();

        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Please fill all fields!');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Set the flowering intensity
        await page.locator('#flowering-intensity').selectOption('80');

        // Try again changing the plant without setting an intensity
        await page.locator('#plant').click();
        await page.waitForTimeout(100);

        // Check if the plant name has a check mark before it
        await expect(page.locator('#plant option[id="1"]')).toHaveText('✓ TestPlant9');

        // Choose the first plant
        await page.locator('#plant').selectOption('TestPlant8');

        // Check Done button
        await expect(page.locator('#done-btn')).toBeDisabled();
        await expect(page.locator('#done-btn')).toHaveText('1/2 Done');

        // Change flowers opening field to 'yes'
        await expect(page.locator('#senescence')).toHaveValue('no');

        // Check if the flowering intensity is disabled
        await expect(page.locator('#senescence-intensity')).toBeDisabled();
        await page.$eval("#senescence-intensity", el => el.classList.contains("disabled-btn"));
        await expect(page.locator('#senescence-intensity')).toHaveValue('');

        // Set senescence yes
        await page.locator('#senescence').selectOption('y');

        // Check if the senescence intensity is enabled
        await expect(page.locator('#senescence-intensity')).toBeEnabled();
        await page.$eval("#senescence-intensity", el => !el.classList.contains("disabled-btn"));

        // Check if the Finish button is visible
        await expect(page.locator('#finish-btn')).toBeVisible();

        // Click on Finish
        await page.locator('#finish-btn').click();

        // Expect a modal dialog for a confirm
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Confirm');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('You have not changed any default value. Are you sure you want to move on?');
        await page.locator('div.modal.fade.show .modal-dialog #confirm-yes').click();

        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Please fill all fields!');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Set the flowering intensity
        await page.locator('#senescence-intensity').selectOption('60');

        // Click on Finish
        await page.locator('#finish-btn').click();

        // Check if the plant name has a check mark before it
        await expect(page.locator('#plant option[id="2"]')).toHaveText('✓ TestPlant8');

        // Check Done button
        await expect(page.locator('#done-btn')).toBeEnabled();
        await page.$eval("#done-btn", el => el.classList.contains("done-btn-ready"));
        await expect(page.locator('#done-btn')).toHaveText('2/2 Done');

        // Check no-observation field
        await page.locator('#no-observation').check();

        // Click on Finish
        await page.locator('#finish-btn').click();

        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Please fill all fields!');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Try saving without filling in remarks
        await page.locator('#done-btn').click();

        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Please fill all fields!');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Fill in remarks field
        await page.locator('#remarks').fill('Testing');
        await page.waitForTimeout(300);
        await page.locator('#remarks').evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Check if all the fields are disabled
        await expect(page.locator('#initial-vegetative-growth')).toBeDisabled();
        await expect(page.locator('#young-leaves-unfolding')).toBeDisabled();
        await expect(page.locator('#flowers-opening')).toBeDisabled();
        await expect(page.locator('#peak-flowering')).toBeDisabled();
        await expect(page.locator('#flowering-intensity')).toBeDisabled();
        await expect(page.locator('#ripe-fruits')).toBeDisabled();
        await expect(page.locator('#senescence')).toBeDisabled();
        await expect(page.locator('#senescence-intensity')).toBeDisabled();

        await expect(page.locator('#cut-partly')).toBeDisabled();
        await expect(page.locator('#cut-total')).toBeDisabled();
        await expect(page.locator('#covered-natural')).toBeDisabled();
        await expect(page.locator('#covered-artificial')).toBeDisabled();
        await expect(page.locator('#transplanted')).toBeDisabled();
        await expect(page.locator('#removed')).toBeDisabled();

        // Click on Finish
        await page.locator('#finish-btn').click();

        // Check saving in offline mode
        await context.setOffline(true);
        await page.locator('#done-btn').click();

        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Saving is not available in offline mode');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Save in online
        await context.setOffline(false);
        await page.locator('#done-btn').click();

        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Collection successfully saved to database!');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Check the Cancel button
        await page.locator('#cancel-btn').click();

        // Expect a modal dialog for a confirm
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Confirm');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Are you sure you want to cancel and go back?');
        await page.locator('div.modal.fade.show .modal-dialog #confirm-yes').click();
    });

    test('Previous collection', async ({
        page,
        isMobile
    }) => {
        // Set the dates for the collections
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Choose subgarden AddSubgarden1
        const collection1ID = await selectSubgarden(page, 'AddSubgarden1');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden option[value="AddSubgarden1"]').waitFor();
        // await page.locator('#subgarden option[value="AddSubgarden1"]').click();
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').evaluate(e => e.blur());

        // Save the id for the Collection 1
        // const collection1ID = await page.locator('#subgarden option[value="AddSubgarden1"]').getAttribute('id');
        // await expect(collection1ID).not.toBeNull();
        created.push(collection1ID);

        // Choose subgarden AddSubgarden2
        const collection2ID = await selectSubgarden(page, 'AddSubgarden2');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').selectOption('AddSubgarden2');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').evaluate(e => e.blur());

        // Save the id for the Collection 2
        // const collection2ID = await page.locator('#subgarden option[value="AddSubgarden2"]').getAttribute('id');
        // await expect(collection2ID).not.toBeNull();
        created.push(collection2ID);

        // Choose the first plant
        await page.locator('#plant').click();
        await page.locator('#plant').selectOption('TestPlant10');

        // Check if there is a previous collection saved for the Collection 2
        // Get local storage
        await page.waitForLoadState('networkidle');
        let localStorage = await page.evaluate(() => JSON.stringify(localStorage));
        let entries = JSON.parse(localStorage);
        let collections = JSON.parse(entries["collections"]);
        let collection = collections[collection2ID];

        // Verify last-collection-id is null
        await expect(collection["last-collection-id"]).toBeNull();

        // Verify copy-older button is not shown
        await expect(page.locator('#copy-older')).toBeHidden();

        // Get the buttons for the previous collection
        let buttons = await page.locator('.old-data-btn');

        // Check if there are 12 buttons found
        await expect(await buttons.count()).toStrictEqual(12);

        // Check if the buttons for previous collection are hidden
        for (let i = 0; i < await buttons.count(); i++) {
            await expect(buttons.nth(i)).toBeHidden();
        }

        // Remarks
        await page.locator('#remarks').fill('yes');
        await page.waitForTimeout(300);
        await page.locator('#remarks').evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Select yes for all dropdowns
        await page.locator('#initial-vegetative-growth').selectOption('y');
        await page.locator('#young-leaves-unfolding').selectOption('y');
        await page.locator('#flowers-opening').selectOption('y');
        await page.locator('#peak-flowering').selectOption('y');
        await page.locator('#flowering-intensity').selectOption('100');
        await page.locator('#ripe-fruits').selectOption('y');
        await page.locator('#senescence').selectOption('y');
        await page.locator('#senescence-intensity').selectOption('100');

        // Maintenance options defaults
        await page.locator('#cut-partly').check();
        await page.locator('#cut-total').check();
        await page.locator('#covered-natural').check();
        await page.locator('#covered-artificial').check();
        await page.locator('#transplanted').check();
        await page.locator('#removed').check();

        // Choose TestPlant11
        await page.locator('#plant').click();
        await page.waitForTimeout(300);
        await page.locator('#plant').selectOption('TestPlant11');

        // Remarks
        await page.locator('#remarks').fill('missed');
        await page.waitForTimeout(300);
        await page.locator('#remarks').evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Select yes for all dropdowns
        await page.locator('#initial-vegetative-growth').selectOption('m');
        await page.locator('#young-leaves-unfolding').selectOption('m');
        await page.locator('#flowers-opening').selectOption('m');
        await page.locator('#ripe-fruits').selectOption('m');
        await page.locator('#senescence').selectOption('m');

        // Maintenance options defaults
        await page.locator('#cut-partly').check();
        await page.locator('#covered-natural').check();
        await page.locator('#transplanted').check();

        // Choose TestPlant11
        await page.locator('#plant').click();
        await page.waitForTimeout(300);
        await page.locator('#plant').selectOption('TestPlant12');

        await page.locator('#remarks').fill('unsure');
        await page.waitForTimeout(300);
        await page.locator('#remarks').evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Select yes for all dropdowns
        await page.locator('#initial-vegetative-growth').selectOption('u');
        await page.locator('#young-leaves-unfolding').selectOption('u');
        await page.locator('#flowers-opening').selectOption('u');
        await page.locator('#ripe-fruits').selectOption('u');
        await page.locator('#senescence').selectOption('u');

        // Maintenance options
        await page.locator('#cut-total').check();
        await page.locator('#covered-artificial').check();
        await page.locator('#removed').check();

        await page.locator('#finish-btn').click();

        // Save the collection
        await page.locator('#done-btn').click();

        // Close the modal
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Choose the other garden/collection
        await selectSubgarden(page, 'AddSubgarden1');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').selectOption('AddSubgarden1');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').evaluate(e => e.blur());

        // Choose TestPlant9
        await page.locator('#plant').click();
        await page.locator('#plant').selectOption('TestPlant9');

        // Remarks
        await page.locator('#remarks').fill('no');
        await page.waitForTimeout(300);
        await page.locator('#remarks').evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Choose TestPlant8
        await page.locator('#plant').click();
        await page.waitForTimeout(100);
        await expect(page.locator('#plant option[id="1"]')).toHaveText('✓ TestPlant9');
        await page.locator('#plant').selectOption('TestPlant8');

        // Check no-observation
        await page.locator('#no-observation').check();

        // Remarks
        await page.locator('#remarks').fill('no-observation');
        await page.waitForTimeout(300);
        await page.locator('#remarks').evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Save the collection
        await page.locator('#finish-btn').click();
        await page.locator('#done-btn').click();

        // Close the modal
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Create new collections
        await page.goto(process.env.E2E_INDEX + 'observations/');
        await page.waitForTimeout(100);
        await page.locator('#add-collection').click();

        // Choose the AddSubgarden1 subgarden
        const collection3ID = await selectSubgarden(page, 'AddSubgarden1');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').selectOption('AddSubgarden1');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').evaluate(e => e.blur());
        // await page.locator('#subgarden').waitFor();

        // Save the id for the Collection 3
        // const collection3ID = await page.locator('#subgarden option[value="AddSubgarden1"]').getAttribute('id');
        // await expect(collection3ID).not.toBeNull();
        created.push(collection3ID);

        // Change the date
        await page.locator('#collection-date').fill(tomorrow.toLocaleDateString('en-CA'));
        await page.waitForTimeout(100);
        await page.locator('#collection-date').evaluate(e => e.blur());

        // Choose the first plant
        await page.locator('#plant').selectOption('TestPlant9');

        // Check if the previous collection buttons are displayed
        // Verify copy-older button is shown
        await expect(page.locator('#copy-older')).toBeVisible();

        // Get the buttons for the previous collection
        buttons = await page.locator('.old-data-btn');

        // Check if the buttons for previous collection are shown
        for (let i = 0; i < await buttons.count(); i++) {
            const elementId = await buttons.nth(i).getAttribute('id');

            if (!elementId.includes('remarks'))
                await expect(buttons.nth(i)).toBeVisible();
            else if (elementId === 'remarks-small-button' && isMobile)
                await expect(buttons.nth(i)).toBeVisible();
            else if (elementId === 'remarks-small-button' && !isMobile)
                await expect(buttons.nth(i)).toBeHidden();
            else if (elementId === 'remarks-large-button' && !isMobile)
                await expect(buttons.nth(i)).toBeVisible();
            else if (elementId === 'remarks-large-button' && isMobile)
                await expect(buttons.nth(i)).toBeHidden();
        }

        // Check the date shown for the previous collection
        const dateString = today.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        await expect(page.locator('#last-obs-date')).toHaveText(dateString);

        // Check the displayed values for the previous collection
        await expect(page.locator('#initial-vegetative-growth-button')).toHaveText('no');
        await expect(page.locator('#young-leaves-unfolding-button')).toHaveText('no');
        await expect(page.locator('#flowers-opening-button')).toHaveText('no');
        await expect(page.locator('#peak-flowering-button')).toHaveText('no');
        await expect(page.locator('#peak-flowering-button')).toBeDisabled();
        await expect(page.locator('#flowering-intensity-button')).toHaveText('');
        await expect(page.locator('#flowering-intensity-button')).toBeDisabled();
        await expect(page.locator('#ripe-fruits-button')).toHaveText('no');
        await expect(page.locator('#senescence-button')).toHaveText('no');
        await expect(page.locator('#senescence-intensity-button')).toHaveText('');
        await expect(page.locator('#senescence-intensity-button')).toBeDisabled();
        await expect(page.locator('#remarks-large-button')).toHaveText('no');
        await expect(page.locator('#remarks-small-button')).toHaveText('no');

        // Verify the senescence intensity is not required
        await page.$eval("#senescence-intensity-button", el => !el.classList.contains("required-field"));

        // Fill in remarks field
        await page.locator('#remarks').fill('noo');
        await page.waitForTimeout(300);
        await page.locator('#remarks').evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Change senescence value to yes
        await page.locator('#senescence-button').click();
        await page.locator('#senescence-modal').waitFor();

        // Check the title
        await expect(page.locator('#senescence-modal .modal-header')).toContainText(`Senescence - ${dateString}, ${today.getFullYear()}`);

        // Change the value to yes
        await page.locator('#senescence-old').selectOption('y');

        // Save the value
        await page.locator('#senescence-save').click();

        // Verify the senescence intensity is required
        await page.$eval("#senescence-intensity-button", el => el.classList.contains("required-field"));

        // Try to change to plant TestPlant8
        await page.locator('#plant').click();

        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Please fill all fields!');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Change the senescence intensity for the older collection to 50%
        await page.locator('#senescence-intensity-button').click();
        await page.locator('#senescence-intensity-modal').waitFor();
        await page.locator('#senescence-intensity-old').selectOption('50');
        await page.locator('#senescence-intensity-save').click();

        // Try again to change to plant TestPlant8
        await page.locator('#plant').click();
        await page.waitForTimeout(100);

        // Verify the name has changed for the plant
        await expect(page.locator('#plant option[id="1"]')).toHaveText('✓ TestPlant9');

        // Choose the second plant
        await page.locator('#plant').selectOption('TestPlant8');

        // Fill in remarks
        await page.locator('#remarks').fill('nooo');
        await page.waitForTimeout(300);
        await page.locator('#remarks').evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Check if the all buttons are disabled
        // Verify copy-older button is disabled
        await expect(page.locator('#copy-older')).toBeDisabled();

        // Get the buttons for the previous collection
        buttons = await page.locator('.old-data-btn');

        // Check if the buttons for previous collection are disabled
        for (let i = 0; i < await buttons.count(); i++) {
            const elementId = await buttons.nth(i).getAttribute('id');

            if (!elementId.includes('remarks'))
                await expect(buttons.nth(i)).toBeDisabled();
        }

        // Check remarks button text
        await expect(page.locator('#remarks-large-button')).toHaveText('no-observation');
        await expect(page.locator('#remarks-small-button')).toHaveText('no-observation');

        // Finish
        await page.locator('#finish-btn').click();

        // Add a new collection for the other subgarden
        const collection4ID = await selectSubgarden(page, 'AddSubgarden2');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').selectOption('AddSubgarden2');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').evaluate(e => e.blur());

        // Save the id for the Collection 4
        // const collection4ID = await page.locator('#subgarden option[value="AddSubgarden2"]').getAttribute('id');
        // await expect(collection4ID).not.toBeNull();
        created.push(collection4ID);

        // Change the date
        await page.locator('#collection-date').fill(tomorrow.toLocaleDateString('en-CA'));
        await page.locator('#collection-date').evaluate(e => e.blur());
        await page.waitForTimeout(100);

        // Choose the first plant
        await page.locator('#plant').selectOption('TestPlant10');

        // Check the displayed values for the previous collection
        await expect(page.locator('#initial-vegetative-growth-button')).toHaveText('yes');
        await expect(page.locator('#young-leaves-unfolding-button')).toHaveText('yes');
        await expect(page.locator('#flowers-opening-button')).toHaveText('yes');
        await expect(page.locator('#peak-flowering-button')).toHaveText('yes');
        await expect(page.locator('#flowering-intensity-button')).toHaveText('100%');
        await expect(page.locator('#ripe-fruits-button')).toHaveText('yes');
        await expect(page.locator('#senescence-button')).toHaveText('yes');
        await expect(page.locator('#senescence-intensity-button')).toHaveText('100%');
        await expect(page.locator('#remarks-large-button')).toHaveText('yes');
        await expect(page.locator('#remarks-small-button')).toHaveText('yes');

        await expect(page.locator('#maintenance-button')).toHaveText('Cut partly, cut total, covered natural, covered artificial, transplanted, removed');

        await expect(page.locator('#cut-partly-old')).toBeChecked();
        await expect(page.locator('#cut-total-old')).toBeChecked();
        await expect(page.locator('#covered-natural-old')).toBeChecked();
        await expect(page.locator('#covered-artificial-old')).toBeChecked();
        await expect(page.locator('#transplanted-old')).toBeChecked();
        await expect(page.locator('#removed-old')).toBeChecked();

        // Copy the values from the older collection
        await page.locator('#copy-older').click();

        // Check if all the values have been copied
        await expect(page.locator('#initial-vegetative-growth')).toHaveValue('y');
        await expect(page.locator('#young-leaves-unfolding')).toHaveValue('y');
        await expect(page.locator('#flowers-opening')).toHaveValue('y');
        await expect(page.locator('#peak-flowering')).toHaveValue('y');
        await expect(page.locator('#flowering-intensity')).toHaveValue('100');
        await expect(page.locator('#ripe-fruits')).toHaveValue('y');
        await expect(page.locator('#senescence')).toHaveValue('y');
        await expect(page.locator('#senescence-intensity')).toHaveValue('100');

        // Change the remarks field for the older collection without saving
        await page.locator(isMobile ? '#remarks-small-button' : '#remarks-large-button').click();
        await page.locator('#remarks-modal').waitFor();
        await page.locator('#remarks-old').fill('test');
        await page.locator('#remarks-modal button:has-text("Close")').click();

        // Check if the text is still the same
        await expect(page.locator('#remarks-large-button')).toHaveText('yes');
        await expect(page.locator('#remarks-small-button')).toHaveText('yes');

        // Change to the plant TestPlant12
        await page.locator('#plant').click();
        await page.waitForTimeout(100);

        await expect(page.locator('#plant option[id="1"]')).toHaveText('✓ TestPlant10');
        await page.locator('#plant').selectOption('TestPlant12');

        // Add a text into remarks field
        await page.locator('#remarks').fill('test');
        await page.waitForTimeout(300);
        await page.locator('#remarks').evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Check all the values
        await expect(page.locator('#initial-vegetative-growth-button')).toHaveText('unsure');
        await expect(page.locator('#young-leaves-unfolding-button')).toHaveText('unsure');
        await expect(page.locator('#flowers-opening-button')).toHaveText('unsure');
        await expect(page.locator('#ripe-fruits-button')).toHaveText('unsure');
        await expect(page.locator('#senescence-button')).toHaveText('unsure');
        await expect(page.locator('#remarks-large-button')).toHaveText('unsure');
        await expect(page.locator('#remarks-small-button')).toHaveText('unsure');

        // Change to the plant TestPlant12
        await page.locator('#plant').click();
        await page.waitForTimeout(100);
        await expect(page.locator('#plant option[id="2"]')).toHaveText('✓ TestPlant12');
        await page.locator('#plant').selectOption('TestPlant11');

        // Add a text into remarks field
        await page.locator('#remarks').fill('test');
        await page.waitForTimeout(300);
        await page.locator('#remarks').evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Check all the values
        await expect(page.locator('#initial-vegetative-growth-button')).toHaveText('missed');
        await expect(page.locator('#young-leaves-unfolding-button')).toHaveText('missed');
        await expect(page.locator('#flowers-opening-button')).toHaveText('missed');
        await expect(page.locator('#ripe-fruits-button')).toHaveText('missed');
        await expect(page.locator('#senescence-button')).toHaveText('missed');
        await expect(page.locator('#remarks-large-button')).toHaveText('missed');
        await expect(page.locator('#remarks-small-button')).toHaveText('missed');

        // Change senescence value to yes
        await page.locator('#senescence-button').click();
        await page.locator('#senescence-modal').waitFor();

        // Change the value to unsure
        await page.locator('#senescence-old').selectOption('u');

        // Save the value
        await page.locator('#senescence-save').click();

        // Finish the collection
        await page.locator('#finish-btn').click();
        await expect(page.locator('#plant option[id="3"]')).toHaveText('✓ TestPlant11');

        // Save the collection
        await page.locator('#done-btn').click();

        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Go back to the other collection
        await selectSubgarden(page, 'AddSubgarden1');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').selectOption('AddSubgarden1');
        // await page.locator('#subgarden').click();
        // await page.locator('#subgarden').evaluate(e => e.blur());

        // Select a plant
        await page.locator('#plant').selectOption('TestPlant8');

        // Save the collection
        await page.locator('#done-btn').click();

        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Go back to the local observations page
        await page.goto(process.env.E2E_INDEX + 'observations/');

        // See if the older collections show up in the not saved table
        await expect(page.locator('#notsaved-collections-table tbody tr')).toHaveCount(2);
        // See if the collection saved also show up
        await expect(page.locator('#saved-collections-table tbody tr')).toHaveCount(2);

        // Verify the details of collections shown
        await expect(page.locator(`img[id="${collection1ID}-upload"]`)).toBeDefined();
        await expect(page.locator(`img[id="${collection2ID}-upload"]`)).toBeDefined();
        await expect(page.locator(`.d-table-row:has(td a img[id="${collection1ID}-upload"]) .date-table-cell`)).toHaveText(`${dateString}, ${today.getFullYear()}`);
        await expect(page.locator(`.d-table-row:has(td a img[id="${collection2ID}-upload"]) .date-table-cell`)).toHaveText(`${dateString}, ${today.getFullYear()}`);

        // Verify the details of collections shown
        await expect(page.locator(`img[id="${collection3ID}-online"]`)).toBeDefined();
        await expect(page.locator(`img[id="${collection4ID}-online"]`)).toBeDefined();
        await expect(page.locator(`.d-table-row:has(td img[id="${collection3ID}-online"])`).locator('.date-table-cell')).toHaveText(`${tomorrow.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}, ${tomorrow.getFullYear()}`);
        await expect(page.locator(`.d-table-row:has(td img[id="${collection4ID}-online"])`).locator('.date-table-cell')).toHaveText(`${tomorrow.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}, ${tomorrow.getFullYear()}`);

        // Check the edited collections if the edited fields show up correctly
    });
});
