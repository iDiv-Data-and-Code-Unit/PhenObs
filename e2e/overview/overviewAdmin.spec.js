const { test, expect } = require('@playwright/test');
const { admin } = require('../helpers/login/userEnvironments.js');
const login = require('../helpers/login/login.js');

test.describe('Overview => Admin', () => {
    let created = [];

    test.beforeEach(async ({ page }) => {
        await login(page, admin);
        await page.goto(process.env.E2E_INDEX + 'observations/overview/');
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

    test('Add a new collection', async ({ page }) => {
        // Choose All
        await page.locator('#gardens').click();
        await page.waitForTimeout(100);
        await page.locator('#gardens').selectOption('All');
        await page.waitForTimeout(100);
        await page.locator('#gardens').evaluate(e => e.blur());
        await page.waitForTimeout(100);

        // Open edit tab
        await page.locator('#edit-tab').click();

        // Create a new collection for EditMainGarden:EditSubgarden
        await page.locator('#heading-new').click();
        await page.waitForTimeout(300);

        // Verify garden options
        await expect(page.locator('#new-subgarden option')).toHaveCount(5);
        await expect(page.locator('#new-subgarden option[id="2"]')).toHaveText("Garden: Subgarden 1");
        await expect(page.locator('#new-subgarden option[id="3"]')).toHaveText("Garden: Subgarden 2");
        await expect(page.locator('#new-subgarden option[id="5"]')).toHaveText("AddMainGarden: AddSubgarden1");
        await expect(page.locator('#new-subgarden option[id="6"]')).toHaveText("AddMainGarden: AddSubgarden2");
        await expect(page.locator('#new-subgarden option[id="8"]')).toHaveText("EditMainGarden: EditSubgarden");

        await page.locator('#new-subgarden').selectOption("EditMainGarden: EditSubgarden");
        await page.locator('#create-new').click();
        await page.waitForTimeout(300);

        // Get the collection ID
        const elementID = await page.locator('div[aria-labelledby="heading-new"]').getAttribute('id');
        const collectionID = elementID.split('-')[1];
        // Push the ID into the created array
        created.push(collectionID);

        // Check collection-date
        const today = new Date().toLocaleDateString('en-CA');
        await expect(page.locator(`#date-${collectionID}`)).toHaveValue(today);

        // Change the date
        const collectionDate = new Date(2022, 9, 1); // Oct 1, 2022
        await page.locator(`#date-${collectionID}`).fill(collectionDate.toLocaleDateString('en-CA'));
        await page.waitForTimeout(300);
        await page.locator(`#date-${collectionID}`).evaluate(e => e.blur());
        await page.waitForTimeout(300);

        // Try saving
        await page.locator(`[id="${collectionID}-save"]`).click();
        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Fields cannot be left empty.');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Get the collection elements
        let collectionTable = await page.locator(`#edit-records-${collectionID}`);
        let record1 = await collectionTable.locator('[id^="record-"]').nth(0);
        let record2 = await collectionTable.locator('[id^="record-"]').nth(1);

        // Check number of invalid fields for the record
        await expect(record1.locator('.invalidField')).toHaveCount(7);
        // Check which fields are highlighted
        await expect(record1.locator('[name="initial-vegetative-growth"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record1.locator('[name="young-leaves-unfolding"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record1.locator('[name="flowers-opening"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record1.locator('[name="peak-flowering"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record1.locator('[name="peak-flowering-estimation"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record1.locator('[name="ripe-fruits"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record1.locator('[name="senescence"]')).toHaveClass('spreadsheet-cell invalidField');

        // Check number of invalid fields for the record
        await expect(record2.locator('.invalidField')).toHaveCount(7);
        // Check which fields are highlighted
        await expect(record2.locator('[name="initial-vegetative-growth"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record2.locator('[name="young-leaves-unfolding"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record2.locator('[name="flowers-opening"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record2.locator('[name="peak-flowering"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record2.locator('[name="peak-flowering-estimation"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record2.locator('[name="ripe-fruits"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record2.locator('[name="senescence"]')).toHaveClass('spreadsheet-cell invalidField');

        // Set 1 field no and see if the invalidField class is removed
        await record1.locator('[name="initial-vegetative-growth"]').selectOption('no');
        await page.locator(`[id="${collectionID}-save"]`).click();
        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Fields cannot be left empty.');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        await expect(record1.locator('.invalidField')).toHaveCount(6);
        await expect(record1.locator('[name="initial-vegetative-growth"]')).toHaveClass('spreadsheet-cell');

        // Change it back to null and see if the class is added
        await record1.locator('[name="initial-vegetative-growth"]').selectOption('');
        await page.locator(`[id="${collectionID}-save"]`).click();
        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Fields cannot be left empty.');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        await expect(record1.locator('.invalidField')).toHaveCount(7);
        await expect(record1.locator('[name="initial-vegetative-growth"]')).toHaveClass('spreadsheet-cell invalidField');

        // Set all the fields to yes and leave intensities empty for record 1
        await record1.locator('[name="initial-vegetative-growth"]').selectOption('y');
        await record1.locator('[name="young-leaves-unfolding"]').selectOption('y');
        await record1.locator('[name="flowers-opening"]').selectOption('y');
        await record1.locator('[name="peak-flowering"]').selectOption('y');
        await record1.locator('[name="peak-flowering-estimation"]').selectOption('y');
        await record1.locator('[name="ripe-fruits"]').selectOption('y');
        await record1.locator('[name="senescence"]').selectOption('y');

        // Check some maintenance options
        await record1.locator('[name="cut-partly"]').check();
        await record1.locator('[name="cut-total"]').check();
        await record1.locator('[name="covered-natural"]').check();

        // Fill remarks field
        await record1.locator('[name="remarks"]').fill("Testing 1");

        // Set no for all the fields and fill in intensities for record 2
        await record2.locator('[name="initial-vegetative-growth"]').selectOption('no');
        await record2.locator('[name="young-leaves-unfolding"]').selectOption('no');
        await record2.locator('[name="flowers-opening"]').selectOption('no');
        await record2.locator('[name="peak-flowering"]').selectOption('no');
        await record2.locator('[name="peak-flowering-estimation"]').selectOption('no');
        await record2.locator('[name="ripe-fruits"]').selectOption('no');
        await record2.locator('[name="senescence"]').selectOption('no');

        // Setting intensities
        await record2.locator('[name="flowering-intensity"]').selectOption('100');
        await record2.locator('[name="senescence-intensity"]').selectOption('100');

        // Check some maintenance options
        await record2.locator('[name="transplanted"]').check();
        await record2.locator('[name="removed"]').check();
        await record2.locator('[name="covered-artificial"]').check();

        // Fill remarks field
        await record2.locator('[name="remarks"]').fill("Testing 2");

        // Try saving
        await page.locator(`[id="${collectionID}-save"]`).click();

        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Fill in all the required fields.');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Check which fields are highlighted
        await expect(record1.locator('.invalidField')).toHaveCount(2);
        await expect(record1.locator('[name="flowering-intensity"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record1.locator('[name="senescence-intensity"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record2.locator('.invalidField')).toHaveCount(2);
        await expect(record2.locator('[name="flowers-opening"]')).toHaveClass('spreadsheet-cell invalidField');
        await expect(record2.locator('[name="senescence"]')).toHaveClass('spreadsheet-cell invalidField');

        // Fix the mistakes and save
        await record1.locator('[name="flowering-intensity"]').selectOption('100');
        await record1.locator('[name="senescence-intensity"]').selectOption('100');
        await record2.locator('[name="flowering-intensity"]').selectOption('');
        await record2.locator('[name="senescence-intensity"]').selectOption('');
        await page.locator(`[id="${collectionID}-save"]`).click();
        await page.waitForTimeout(300);

        // Check if the collection shows up in the view
        await page.locator('#view-tab').click();
        await page.waitForTimeout(300);
        // Verify details
        const collection = {
            'title': [
                'Oct. 1, 2022',
                'EditMainGarden: EditSubgarden',
                'admin',
            ], 'records': [
                [
                    'TestPlant13', 'yes', 'yes', 'yes', 'yes', 'yes', '100%', 'yes', 'yes', '100%', 'cut partly, cut total, covered natural', 'Testing 1'
                ], [
                    'TestPlant14', 'no', 'no', 'no', 'no', 'no', '', 'no', 'no', '', 'covered artificial, transplanted, removed', 'Testing 2'
                ]
            ]
        };
        // Get collection title data
        const collectionTitleData = await page.locator(`#view-heading-${collectionID} span.d-flex span`);
        // Verify collection title data
        for (let i = 0; i < await collectionTitleData.count(); i++) {
            await expect(collectionTitleData.nth(i)).toHaveText(collection['title'][i]);
        }
        // Click on title to fetch collection 1 records data
        await page.locator(`#view-heading-${collectionID}`).click();
        await page.waitForTimeout(300);
        // Get collection records data
        let collectionRecordsData = await page.locator(`#view-collection-${collectionID} [id*="view-record-"]`);
        // Verify collection records data
        for (let i = 0; i < await collectionRecordsData.count(); i++) {
            const recordData = await collectionRecordsData.nth(i).locator('p.m-0');
            for (let j = 0; j < await recordData.count(); j++) {
                await expect(recordData.nth(j)).toHaveText(collection['records'][i][j]);
            }
        }
        // Check edit tab
        await page.locator('#edit-tab').click();
        await page.waitForTimeout(300);
        // Check if the collection shows up
        await expect(page.locator(`#heading-${collectionID}`)).toHaveCount(1);

        // Check the details
        // Click on title to fetch collection 1 records data
        await page.locator(`#heading-${collectionID}`).click();
        await page.waitForTimeout(300);

        // Locate records' data
        collectionTable = await page.locator(`#edit-records-${collectionID}`);
        record1 = await collectionTable.locator('[id^="record-"]').nth(0);
        record2 = await collectionTable.locator('[id^="record-"]').nth(1);

        // Verify details for record 2
        await expect(record1.locator('[name="initial-vegetative-growth"]')).toHaveValue('y');
        await expect(record1.locator('[name="young-leaves-unfolding"]')).toHaveValue('y');
        await expect(record1.locator('[name="flowers-opening"]')).toHaveValue('y');
        await expect(record1.locator('[name="peak-flowering"]')).toHaveValue('y');
        await expect(record1.locator('[name="peak-flowering-estimation"]')).toHaveValue('y');
        await expect(record1.locator('[name="ripe-fruits"]')).toHaveValue('y');
        await expect(record1.locator('[name="senescence"]')).toHaveValue('y');
        await expect(record1.locator('[name="flowering-intensity"]')).toHaveValue('100');
        await expect(record1.locator('[name="senescence-intensity"]')).toHaveValue('100');
        await expect(record1.locator('[name="cut-partly"]')).toBeChecked();
        await expect(record1.locator('[name="cut-total"]')).toBeChecked();
        await expect(record1.locator('[name="covered-natural"]')).toBeChecked();
        await expect(record1.locator('[name="transplanted"]')).not.toBeChecked();
        await expect(record1.locator('[name="removed"]')).not.toBeChecked();
        await expect(record1.locator('[name="covered-artificial"]')).not.toBeChecked();
        await expect(record1.locator('[name="remarks"]')).toHaveValue("Testing 1");

        // Verify details for record 2
        await expect(record2.locator('[name="initial-vegetative-growth"]')).toHaveValue('no');
        await expect(record2.locator('[name="young-leaves-unfolding"]')).toHaveValue('no');
        await expect(record2.locator('[name="flowers-opening"]')).toHaveValue('no');
        await expect(record2.locator('[name="peak-flowering"]')).toHaveValue('no');
        await expect(record2.locator('[name="peak-flowering-estimation"]')).toHaveValue('no');
        await expect(record2.locator('[name="ripe-fruits"]')).toHaveValue('no');
        await expect(record2.locator('[name="senescence"]')).toHaveValue('no');
        await expect(record2.locator('[name="flowering-intensity"]')).toHaveValue('');
        await expect(record2.locator('[name="senescence-intensity"]')).toHaveValue('');
        await expect(record2.locator('[name="cut-partly"]')).not.toBeChecked();
        await expect(record2.locator('[name="cut-total"]')).not.toBeChecked();
        await expect(record2.locator('[name="covered-natural"]')).not.toBeChecked();
        await expect(record2.locator('[name="transplanted"]')).toBeChecked();
        await expect(record2.locator('[name="removed"]')).toBeChecked();
        await expect(record2.locator('[name="covered-artificial"]')).toBeChecked();
        await expect(record2.locator('[name="remarks"]')).toHaveValue("Testing 2");

        // Check if the collection shows up in its own garden
        await page.locator('#gardens').click();
        await page.waitForTimeout(100);
        await page.locator('#gardens').selectOption('EditMainGarden');
        await page.waitForTimeout(100);
        await page.locator('#gardens').evaluate(e => e.blur());
        await page.waitForTimeout(100);

        // Check view tab
        await page.locator('#view-tab').click();
        await page.waitForTimeout(300);
        // Check if the collection shows up
        await expect(page.locator(`#view-heading-${collectionID}`)).toHaveCount(1);

        // Check edit tab
        await page.locator('#edit-tab').click();
        await page.waitForTimeout(300);
        // Check if the collection shows up
        await expect(page.locator(`#heading-${collectionID}`)).toHaveCount(1);
    });

    test('Choose "all" option and verify collections shown', async ({ page }) => {
        // Choose All
        await page.locator('#gardens').click();
        await page.waitForTimeout(100);
        await page.locator('#gardens').selectOption('All');
        await page.waitForTimeout(100);
        await page.locator('#gardens').evaluate(e => e.blur());
        await page.waitForTimeout(100);

        // Click on View tab
        await page.locator('#view-tab').click();
        await page.waitForTimeout(100);

        // Check if the created collection is still available
        let viewCount = 2;
        let editCount = 4;
        if (created.length) {
            viewCount++;
            editCount++;
            await expect(page.locator(`div[id="view-heading-${created[0]}"]`)).toHaveCount(1);
        }

        // Verify number of collection displayed
        await expect(page.locator('div[id^="view-heading-"]')).toHaveCount(viewCount);
        await expect(page.locator('div[id="view-heading-1"]')).toHaveCount(1);
        await expect(page.locator('div[id="view-heading-3"]')).toHaveCount(1);

        // Click on Edit tab
        await page.locator('#edit-tab').click();
        await page.waitForTimeout(100);

        // Verify the displayed collections
        await expect(page.locator('div[id^="heading-"]')).toHaveCount(editCount);
        await expect(page.locator('div[id="heading-new"]')).toHaveCount(1);
        await expect(page.locator('div[id="heading-1"]')).toHaveCount(1);
        await expect(page.locator('div[id="heading-2"]')).toHaveCount(1);
        await expect(page.locator('div[id="heading-3"]')).toHaveCount(1);
        if (created.length)
            await expect(page.locator(`div[id="heading-${created[0]}"]`)).toHaveCount(1);
    });

    test('Edit multiple collections from different gardens', async ({ page }) => {
        // Choose All
        await page.locator('#gardens').click();
        await page.waitForTimeout(100);
        await page.locator('#gardens').selectOption('All');
        await page.waitForTimeout(100);
        await page.locator('#gardens').evaluate(e => e.blur());
        await page.waitForTimeout(100);

        // Click on Edit tab
        await page.locator('#edit-tab').click();
        await page.waitForTimeout(100);

        // Edit collection 1
        await page.locator('div[id="heading-1"]').click();
        await page.waitForTimeout(300);
        await page.locator('[id="1-remarks"]').fill('Test 1');

        let remarks = null;
        if (created.length) {
            // Edit the collection from EditSubgarden
            await page.locator(`div[id="heading-${created[0]}"]`).click();
            await page.waitForTimeout(300);
            remarks = await page.locator(`div[id="edit-records-${created[0]}"] [name="remarks"]`).nth(0);
            await remarks.fill('Test 2');
            // Check the checkbox
            await page.waitForTimeout(300);
            await page.locator(`[id="selected-${created[0]}"]`).check();
        }

        // Save both by manually checking checkboxes
        await page.locator('[id="selected-1"]').check();
        await page.locator('#uploadSelected').click();
        await page.waitForTimeout(300);

        // Click on Edit tab
        await page.locator('#edit-tab').click();
        await page.waitForTimeout(100);
        // Check edited details for collection 1
        await page.locator('[id="heading-1"]').click();
        await page.waitForTimeout(300);
        await expect(page.locator('[id="1-remarks"]')).toHaveValue('Test 1');
        // Redo the changes
        await page.locator('[id="1-remarks"]').fill('');

        if (created.length) {
            // Check edited collection from EditSubgarden
            await page.locator(`[id="heading-${created[0]}"]`).click();
            await page.waitForTimeout(300);
            await expect(remarks).toHaveValue('Test 2');
            // Redo the changes
            await remarks.fill('Testing 1');
        }

        // Save all
        await page.locator('#selectAll').click();
        await page.locator('#uploadSelected').click();
        await page.waitForTimeout(300);
    });

    test('Download as XLSX', async({ page }) => {
        // Choose All
        await page.locator('#gardens').click();
        await page.waitForTimeout(100);
        await page.locator('#gardens').selectOption('All');
        await page.waitForTimeout(100);
        await page.locator('#gardens').evaluate(e => e.blur());
        await page.waitForTimeout(100);

        // Click on View tab
        await page.locator('#view-tab').click();

        // Try download as XLSX
        await page.locator('#downloadXLSX').click();
        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('You have not selected any collection.');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();
        // Select all
        await page.locator('#viewSelectAll').click();

        const [ download ] = await Promise.all([
            // Start waiting for the download
            page.waitForEvent('download'),
            // Download as CSV
            page.locator('#downloadXLSX').click(),
        ]);
        // Save downloaded file somewhere
        await download.saveAs('testDownload.xlsx');

        // Get expected output
        let expectedContent = require("../helpers/testCSVcontentUserAll.json");
        if (created.length) {
            expectedContent = require("../helpers/testXLSXcontentAdminAll.json");
        }
        let jsonRow = 0;
        // Parse the XLSX
        const fs = require('fs');
        const xlsx = require('node-xlsx');
        const file = xlsx.parse('testDownload.xlsx', {defval:""});
        const data = file[0]["data"];
        for (let i = 0; i < data.length; i++) {
            // Compare read row to expected row
            await expect(data[i]).toStrictEqual(expectedContent[jsonRow++]);
        };
        // Delete the downloaded file
        await download.delete();
        fs.unlink("testDownload.xlsx", function(err) {
            if (err) {
                throw err
            }
        });
    });
});
