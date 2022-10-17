const { test, expect } = require('@playwright/test');
const { add_user } = require('../helpers/login/userEnvironments.js');
const login = require('../helpers/login/login.js');

test.describe('Edit collection', () => {
    let created = [];

    test.beforeEach(async ({ page }) => {
        await login(page, add_user);
        await page.goto(process.env.E2E_INDEX + 'observations/');
    });

    test.afterAll(async ({ page }) => {
        // Delete all the created collections
        for (let collectionID of created) {
            let response = await page.request.delete(`${process.env.E2E_INDEX}observations/delete/${collectionID}/`);
            // await page.waitForTimeout(500);
            let text = await response.json();
            await expect(text).toStrictEqual("OK");
        }
        // Reset the created array
        created = [];
        // Reset the local storage for the window
        await page.evaluate(() => window.localStorage.setItem("collections", "{}"));
        await page.close();
    });

    test('Editing current and previous collections', async ({ page, isMobile }) => {
        // Go to add a new collection page
        await page.locator('#add-collection').click();

        // Choose AddSubgarden1 to create the new collection
        await page.locator('#subgarden').click();
        await page.waitForTimeout(100);
        await page.locator('#subgarden').selectOption('AddSubgarden1');
        await page.waitForTimeout(100);
        await page.locator('#subgarden').evaluate(e => e.blur());
        await page.waitForTimeout(100);
        // Save the ID for the new created collection
        let collection1ID = null;
        while (collection1ID == null)
            collection1ID = await page.locator(`#subgarden option[value="AddSubgarden1"]`).getAttribute('id');
        created.push(collection1ID);

        // Verify date
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        await expect(page.locator('#collection-date')).toHaveValue(today.toLocaleDateString('en-CA'));

        // Select the first plant
        await page.locator('#plant').click();
        await page.locator('#plant').selectOption('TestPlant9');

        // Fill in remarks
        await page.locator('#remarks').fill('Previous collection TestPlant9');
        await page.waitForTimeout(300);
        await page.locator('#remarks').evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Set the values for the collection
        await page.locator('#initial-vegetative-growth').selectOption('y');
        await page.locator('#young-leaves-unfolding').selectOption('y');
        await page.locator('#flowers-opening').selectOption('y');
        await page.locator('#flowering-intensity').selectOption('50');

        // Check Maintenance options
        await page.locator('#cut-total').check();
        await page.locator('#covered-artificial').check();
        await page.locator('#transplanted').check();

        // Select the second plant
        await page.locator('#plant').click();
        await page.waitForTimeout(100);
        await page.locator('#plant').selectOption('TestPlant8');

        // Fill in remarks
        await page.locator('#remarks').fill('Previous collection TestPlant8');
        await page.waitForTimeout(300);
        await page.locator('#remarks').evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Set the values for the collection
        await page.locator('#ripe-fruits').selectOption('y');
        await page.locator('#senescence').selectOption('y');
        await page.locator('#senescence-intensity').selectOption('50');

        // Check Maintenance options
        await page.locator('#cut-partly').check();
        await page.locator('#covered-natural').check();
        await page.locator('#removed').check();

        // Finish the collection
        await page.locator('#finish-btn').click();

        // Save the collection
        await page.locator('#done-btn').click();

        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Collection successfully saved to database!');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Go back to local observations screen
        await page.goto(process.env.E2E_INDEX + 'observations/');

        // Go to add a new collection page
        await page.locator('#add-collection').click();

        // Create a new collection for tomorrow
        // Choose AddSubgarden1 to create the new collection
        await page.locator('#subgarden').click();
        await page.waitForTimeout(100);
        await page.locator('#subgarden').selectOption('AddSubgarden1');
        await page.waitForTimeout(100);
        await page.locator('#subgarden').evaluate(e => e.blur());
        await page.waitForTimeout(100);
        // Save the ID for the new created collection
        let collection2ID = await page.locator(`#subgarden option[value="AddSubgarden1"]`).getAttribute('id');
        while (collection2ID == null)
            collection2ID = await page.locator(`#subgarden option[value="AddSubgarden1"]`).getAttribute('id');
        created.push(collection2ID);
        // Set the date
        await page.locator('#collection-date').fill(tomorrow.toLocaleDateString('en-CA'));
        await page.waitForTimeout(100);
        await page.locator('#collection-date').evaluate(e => e.blur());
        // Select the first plant
        await page.locator('#plant').click();
        await page.locator('#plant').selectOption('TestPlant9');

        // Fill in remarks
        await page.locator('#remarks').fill('New collection TestPlant9');
        await page.waitForTimeout(300);
        await page.locator('#remarks').evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Change values
        await page.locator('#initial-vegetative-growth-button').click();
        await page.locator('#initial-vegetative-growth-modal').waitFor();
        await page.locator('#initial-vegetative-growth-old').selectOption('m');
        await page.locator('#initial-vegetative-growth-save').click();

        await page.locator('#young-leaves-unfolding-button').click();
        await page.locator('#young-leaves-unfolding-modal').waitFor();
        await page.locator('#young-leaves-unfolding-old').selectOption('u');
        await page.locator('#young-leaves-unfolding-save').click();

        await page.locator('#flowers-opening-button').click();
        await page.locator('#flowers-opening-modal').waitFor();
        await page.locator('#flowers-opening-old').selectOption('no');
        await page.locator('#flowers-opening-save').click();

        await page.locator('#maintenance-button').click();
        await page.locator('#maintenance-modal').waitFor();
        await page.locator('#covered-natural-old').check();
        await page.locator('#cut-total-old').uncheck();
        await page.locator('#maintenance-save').click();

        await page.locator(isMobile ? '#remarks-small-button' : '#remarks-large-button').click();
        await page.waitForTimeout(300);
        await page.locator('#remarks-modal').waitFor();
        await page.waitForTimeout(300);
        await page.locator('#remarks-old').fill('Edited TestPlant9');
        await page.waitForTimeout(300);
        await page.locator('#remarks-save').click();
        await page.waitForTimeout(300);

        // Select the second plant
        await page.locator('#plant').click();
        await page.waitForTimeout(100);
        await page.locator('#plant').selectOption('TestPlant8');

        // Fill in remarks
        await page.locator('#remarks').fill('New collection TestPlant8');
        await page.waitForTimeout(300);
        await page.locator('#remarks').evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Change values
        await page.locator('#ripe-fruits-button').click();
        await page.locator('#ripe-fruits-modal').waitFor();
        await page.locator('#ripe-fruits-old').selectOption('u');
        await page.locator('#ripe-fruits-save').click();

        await page.locator('#senescence-button').click();
        await page.locator('#senescence-modal').waitFor();
        await page.locator('#senescence-old').selectOption('m');
        await page.locator('#senescence-save').click();

        await page.locator('#initial-vegetative-growth-button').click();
        await page.locator('#initial-vegetative-growth-modal').waitFor();
        await page.locator('#initial-vegetative-growth-old').selectOption('y');
        await page.locator('#initial-vegetative-growth-save').click();

        await page.locator('#maintenance-button').click();
        await page.locator('#maintenance-modal').waitFor();
        await page.locator('#covered-natural-old').uncheck();
        await page.locator('#cut-partly-old').uncheck();
        await page.locator('#maintenance-save').click();

        await page.locator(isMobile ? '#remarks-small-button' : '#remarks-large-button').click();
        await page.waitForTimeout(300);
        await page.locator('#remarks-modal').waitFor();
        await page.waitForTimeout(300);
        await page.locator('#remarks-old').fill('Edited TestPlant8');
        await page.waitForTimeout(300);
        await page.locator('#remarks-save').click();
        await page.waitForTimeout(300);

        // Finish the collection but don't save
        await page.locator('#finish-btn').click();
        await page.goto(process.env.E2E_INDEX + 'observations/');

        // Check if the collections both show up in not-saved table
        await expect(page.locator('#notsaved-collections-table tbody tr')).toHaveCount(2);
        await expect(page.locator(`img[id="${collection1ID}-upload"]`)).toBeDefined();
        await expect(page.locator(`img[id="${collection2ID}-upload"]`)).toBeDefined();

        // Open the previous collection
        await page.locator(`td i[id="${collection1ID}-edit"]`).click();
        // Select the first plant
        await page.locator('#plant').click();
        await page.locator('#plant').selectOption('TestPlant9');

        await expect(page.locator('#initial-vegetative-growth')).toHaveValue('m');
        await expect(page.locator('#young-leaves-unfolding')).toHaveValue('u');
        await expect(page.locator('#flowers-opening')).toHaveValue('no');
        await expect(page.locator('#peak-flowering')).toHaveValue('no');
        await expect(page.locator('#peak-flowering')).toBeDisabled();
        await expect(page.locator('#flowering-intensity')).toHaveValue('50');
        await expect(page.locator('#flowering-intensity')).toBeDisabled();
        await expect(page.locator('#ripe-fruits')).toHaveValue('no');
        await expect(page.locator('#senescence')).toHaveValue('no');
        await expect(page.locator('#senescence-intensity')).toHaveValue('');
        await expect(page.locator('#senescence-intensity')).toBeDisabled();

        // Maintenance options
        await expect(page.locator('#cut-partly')).not.toBeChecked();
        await expect(page.locator('#cut-total')).not.toBeChecked();
        await expect(page.locator('#covered-natural')).toBeChecked();
        await expect(page.locator('#covered-artificial')).toBeChecked();
        await expect(page.locator('#transplanted')).toBeChecked();
        await expect(page.locator('#removed')).not.toBeChecked();

        // Remarks
        await expect(page.locator('#remarks')).toHaveValue('Edited TestPlant9');

        // Select the second plant
        await page.locator('#plant').click();
        await page.waitForTimeout(100);
        await page.locator('#plant').selectOption('TestPlant8');

        // Check the values
        await expect(page.locator('#initial-vegetative-growth')).toHaveValue('y');
        await expect(page.locator('#young-leaves-unfolding')).toHaveValue('no');
        await expect(page.locator('#flowers-opening')).toHaveValue('no');
        await expect(page.locator('#peak-flowering')).toHaveValue('no');
        await expect(page.locator('#peak-flowering')).toBeDisabled();
        await expect(page.locator('#flowering-intensity')).toHaveValue('');
        await expect(page.locator('#flowering-intensity')).toBeDisabled();
        await expect(page.locator('#ripe-fruits')).toHaveValue('u');
        await expect(page.locator('#senescence')).toHaveValue('m');
        await expect(page.locator('#senescence-intensity')).toHaveValue('50');
        await expect(page.locator('#senescence-intensity')).toBeDisabled();

        // Maintenance options defaults
        await expect(page.locator('#cut-partly')).not.toBeChecked();
        await expect(page.locator('#cut-total')).not.toBeChecked();
        await expect(page.locator('#covered-natural')).not.toBeChecked();
        await expect(page.locator('#covered-artificial')).not.toBeChecked();
        await expect(page.locator('#transplanted')).not.toBeChecked();
        await expect(page.locator('#removed')).toBeChecked();

        // Remarks
        await expect(page.locator('#remarks')).toHaveValue('Edited TestPlant8');

        // Go back to Local Obs
        await page.goto(process.env.E2E_INDEX + 'observations/');

        // Open the local copy of previous collection
        await page.locator(`td i[id="${collection2ID}-edit"]`).click();

        // Edit a value in the first plant
        await page.locator('#plant').click();
        await page.waitForTimeout(100);
        await page.locator('#plant').selectOption('TestPlant9');
        await page.locator('#initial-vegetative-growth').selectOption('y');

        // Change the second plant
        await page.locator('#plant').click();
        await page.waitForTimeout(100);
        await page.locator('#plant').selectOption('TestPlant8');
        await page.locator('#young-leaves-unfolding').selectOption('u');
        await page.locator('#plant').click();
        await page.waitForTimeout(100);

        // Save the collection
        await page.locator('#done-btn').click();

        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Collection successfully saved to database!');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Go back to Local Obs
        await page.goto(process.env.E2E_INDEX + 'observations/');

        // Save the previous collection
        await page.locator(`td a img[id="${collection1ID}-upload"]`).click();

        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Collection successfully saved to database!');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Check if the collections both show up in not-saved table
        await expect(page.locator('#saved-collections-table tbody tr')).toHaveCount(2);
        await expect(page.locator(`img[id="${collection1ID}-online"]`)).toBeDefined();
        await expect(page.locator(`img[id="${collection2ID}-online"]`)).toBeDefined();

        // Delete the collections
        await page.locator(`i[id="${collection1ID}-cancel"]`).click();
        await page.locator('button[id="confirm-yes"]').click();
        await page.locator(`i[id="${collection2ID}-cancel"]`).click();
        await page.locator('button[id="confirm-yes"]').click();

        // Verify no collections are saved on the device
        await expect(page.locator('#saved-collections-table tbody tr')).toHaveCount(0);
        await expect(page.locator('#notsaved-collections-table tbody tr')).toHaveCount(0);

        // Get collections
        await page.locator('#get-collections').click();
        await expect(page.locator('#saved-collections-table tbody tr')).toHaveCount(2);
        await expect(page.locator('#notsaved-collections-table tbody tr')).toHaveCount(0);

        // Check the values for collection 1
        await page.locator(`td i[id="${collection2ID}-edit"]`).click();
        // Select the first plant
        await page.locator('#plant').click();
        await page.locator('#plant').selectOption('TestPlant9');

        await expect(page.locator('#initial-vegetative-growth')).toHaveValue('y');
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

        // Maintenance options
        await expect(page.locator('#cut-partly')).not.toBeChecked();
        await expect(page.locator('#cut-total')).not.toBeChecked();
        await expect(page.locator('#covered-natural')).not.toBeChecked();
        await expect(page.locator('#covered-artificial')).not.toBeChecked();
        await expect(page.locator('#transplanted')).not.toBeChecked();
        await expect(page.locator('#removed')).not.toBeChecked();

        // Remarks
        await expect(page.locator('#remarks')).toHaveValue('New collection TestPlant9');

        // Select the second plant
        await page.locator('#plant').click();
        await page.waitForTimeout(100);
        await page.locator('#plant').selectOption('TestPlant8');

        // Check the values
        await expect(page.locator('#initial-vegetative-growth')).toHaveValue('no');
        await expect(page.locator('#young-leaves-unfolding')).toHaveValue('u');
        await expect(page.locator('#flowers-opening')).toHaveValue('no');
        await expect(page.locator('#peak-flowering')).toHaveValue('no');
        await expect(page.locator('#peak-flowering')).toBeDisabled();
        await expect(page.locator('#flowering-intensity')).toHaveValue('');
        await expect(page.locator('#flowering-intensity')).toBeDisabled();
        await expect(page.locator('#ripe-fruits')).toHaveValue('no');
        await expect(page.locator('#senescence')).toHaveValue('no');
        await expect(page.locator('#senescence-intensity')).toHaveValue('');
        await expect(page.locator('#senescence-intensity')).toBeDisabled();

        // Maintenance options
        await expect(page.locator('#cut-partly')).not.toBeChecked();
        await expect(page.locator('#cut-total')).not.toBeChecked();
        await expect(page.locator('#covered-natural')).not.toBeChecked();
        await expect(page.locator('#covered-artificial')).not.toBeChecked();
        await expect(page.locator('#transplanted')).not.toBeChecked();
        await expect(page.locator('#removed')).not.toBeChecked();

        // Remarks
        await expect(page.locator('#remarks')).toHaveValue('New collection TestPlant8');

        // Go back to Local Obs
        await page.goto(process.env.E2E_INDEX + 'observations/');

        // Open the local copy of previous collection
        await page.locator(`td i[id="${collection1ID}-edit"]`).click();
        // Select the first plant
        await page.locator('#plant').click();
        await page.locator('#plant').selectOption('TestPlant9');

        await expect(page.locator('#initial-vegetative-growth')).toHaveValue('m');
        await expect(page.locator('#young-leaves-unfolding')).toHaveValue('u');
        await expect(page.locator('#flowers-opening')).toHaveValue('no');
        await expect(page.locator('#peak-flowering')).toHaveValue('no');
        await expect(page.locator('#peak-flowering')).toBeDisabled();
        await expect(page.locator('#flowering-intensity')).toHaveValue('');
        await expect(page.locator('#flowering-intensity')).toBeDisabled();
        await expect(page.locator('#ripe-fruits')).toHaveValue('no');
        await expect(page.locator('#senescence')).toHaveValue('no');
        await expect(page.locator('#senescence-intensity')).toHaveValue('');
        await expect(page.locator('#senescence-intensity')).toBeDisabled();

        // Maintenance options
        await expect(page.locator('#cut-partly')).not.toBeChecked();
        await expect(page.locator('#cut-total')).not.toBeChecked();
        await expect(page.locator('#covered-natural')).toBeChecked();
        await expect(page.locator('#covered-artificial')).toBeChecked();
        await expect(page.locator('#transplanted')).toBeChecked();
        await expect(page.locator('#removed')).not.toBeChecked();

        // Remarks
        await expect(page.locator('#remarks')).toHaveValue('Edited TestPlant9');

        // Select the second plant
        await page.locator('#plant').click();
        await page.waitForTimeout(100);
        await page.locator('#plant').selectOption('TestPlant8');

        // Check the values
        await expect(page.locator('#initial-vegetative-growth')).toHaveValue('y');
        await expect(page.locator('#young-leaves-unfolding')).toHaveValue('no');
        await expect(page.locator('#flowers-opening')).toHaveValue('no');
        await expect(page.locator('#peak-flowering')).toHaveValue('no');
        await expect(page.locator('#peak-flowering')).toBeDisabled();
        await expect(page.locator('#flowering-intensity')).toHaveValue('');
        await expect(page.locator('#flowering-intensity')).toBeDisabled();
        await expect(page.locator('#ripe-fruits')).toHaveValue('u');
        await expect(page.locator('#senescence')).toHaveValue('m');
        await expect(page.locator('#senescence-intensity')).toHaveValue('');
        await expect(page.locator('#senescence-intensity')).toBeDisabled();

        // Maintenance options
        await expect(page.locator('#cut-partly')).not.toBeChecked();
        await expect(page.locator('#cut-total')).not.toBeChecked();
        await expect(page.locator('#covered-natural')).not.toBeChecked();
        await expect(page.locator('#covered-artificial')).not.toBeChecked();
        await expect(page.locator('#transplanted')).not.toBeChecked();
        await expect(page.locator('#removed')).toBeChecked();

        // Remarks
        await expect(page.locator('#remarks')).toHaveValue('Edited TestPlant8');
    });
});
