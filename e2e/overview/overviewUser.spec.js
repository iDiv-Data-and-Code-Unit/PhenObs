const { test, expect } = require('@playwright/test');
const { user } = require('../helpers/login/userEnvironments.js');
const login = require('../helpers/login/login.js');

const checkDateRange = async (page, edit=false) => {
    const prefix = (edit) ? "#edit" : "#view";
    const otherTab = (edit) ?  "#view-tab" : '#edit-tab';
    // Choose Garden
    await page.locator('#gardens').click();
    await page.waitForTimeout(100);
    await page.locator('#gardens').selectOption('Garden');
    await page.waitForTimeout(100);
    await page.locator('#gardens').evaluate(e => e.blur());
    await page.waitForTimeout(100);
    // Date range: October 1, 2022 - October 3, 2022
    const startDate = new Date(2022, 9, 1);
    const endDate = new Date(2022, 9, 3);

    // Click on the tab
    await page.locator(prefix + '-tab').click();
    await page.waitForTimeout(100);

    // Try loading without setting dates
    await page.locator(prefix + '-in-range').click();
    // Expect a modal dialog for an alert
    await page.waitForSelector('div.modal.fade.show .modal-dialog');
    await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
    await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Please select start and end dates.');
    await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

    // Set start date
    await page.locator(prefix + '-start-date').fill(startDate.toLocaleDateString('en-CA'));
    await page.locator(prefix + '-in-range').click();
    // Expect a modal dialog for an alert
    await page.waitForSelector('div.modal.fade.show .modal-dialog');
    await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
    await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Please select start and end dates.');
    await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

    // Delete start date
    await page.locator(prefix + '-start-date').fill('');

    // Set end date
    await page.locator(prefix + '-end-date').fill(endDate.toLocaleDateString('en-CA'));
    await page.locator(prefix + '-in-range').click();
    // Expect a modal dialog for an alert
    await page.waitForSelector('div.modal.fade.show .modal-dialog');
    await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
    await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Please select start and end dates.');
    await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

    // Try setting an invalid range
    await page.locator(prefix + '-end-date').fill(startDate.toLocaleDateString('en-CA'));
    await page.locator(prefix + '-start-date').fill(endDate.toLocaleDateString('en-CA'));
    await page.locator(prefix + '-in-range').click();
    // Expect a modal dialog for an alert
    await page.waitForSelector('div.modal.fade.show .modal-dialog');
    await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
    await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('The end date should be later than the start date.');
    await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

    // Set valid a date range
    await page.locator(prefix + '-start-date').fill(startDate.toLocaleDateString('en-CA'));
    await page.locator(prefix + '-end-date').fill(endDate.toLocaleDateString('en-CA'));
    // Load
    await page.locator(prefix + '-in-range').click();
    await page.waitForTimeout(100);

    // Click on the tab
    await page.locator(prefix + '-tab').click();
    await page.waitForTimeout(100);

    // Verify the displayed collections
    if (edit) {
        await expect(page.locator('div[id^="heading-"]')).toHaveCount(3);
        await expect(page.locator('div[id="heading-new"]')).toHaveCount(1);
        await expect(page.locator('div[id="heading-2"]')).toHaveCount(1);
        await expect(page.locator('div[id="heading-3"]')).toHaveCount(1);
    } else {
        await expect(page.locator('div[id^="view-heading-"]')).toHaveCount(1);
        await expect(page.locator('div[id="view-heading-3"]')).toHaveCount(1);
    }
    // Click on other tab
    await page.locator(otherTab).click();
    await page.waitForTimeout(100);

    // Verify the displayed collections
    if (!edit) {
        await expect(page.locator('div[id^="heading-"]')).toHaveCount(3);
        await expect(page.locator('div[id="heading-new"]')).toHaveCount(1);
        await expect(page.locator('div[id="heading-2"]')).toHaveCount(1);
        await expect(page.locator('div[id="heading-3"]')).toHaveCount(1);
    } else {
        await expect(page.locator('div[id^="view-heading-"]')).toHaveCount(1);
        await expect(page.locator('div[id="view-heading-3"]')).toHaveCount(1);
    }
}

test.describe('Overview => User', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, user);
        await page.goto(process.env.E2E_INDEX + 'observations/overview/');
    });

    test.afterAll(async ({ page }) => {
        await page.close();
    });

    test('Check garden options', async ({ page }) => {
        // There are 5 options including 1 empty and following 4
        await expect(page.locator('#gardens option')).toHaveCount(5);
        await expect(page.locator('#gardens option[id="1"]')).toHaveCount(1);
        await expect(page.locator('#gardens option[id="2"]')).toHaveCount(1);
        await expect(page.locator('#gardens option[id="3"]')).toHaveCount(1);
        await expect(page.locator('#gardens option[id="all"]')).toHaveCount(1);
    });

    test('Check "all" option', async ({ page }) => {
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

        // Verify number of collection displayed
        await expect(page.locator('div[id^="view-heading-"]')).toHaveCount(2);
        await expect(page.locator('div[id="view-heading-1"]')).toHaveCount(1);
        await expect(page.locator('div[id="view-heading-3"]')).toHaveCount(1);

        // Click on Edit tab
        await page.locator('#edit-tab').click();
        await page.waitForTimeout(100);

        // Verify the displayed collections
        await expect(page.locator('div[id^="heading-"]')).toHaveCount(4);
        await expect(page.locator('div[id="heading-new"]')).toHaveCount(1);
        await expect(page.locator('div[id="heading-1"]')).toHaveCount(1);
        await expect(page.locator('div[id="heading-2"]')).toHaveCount(1);
        await expect(page.locator('div[id="heading-3"]')).toHaveCount(1);
    });

    test('Check date-range in view screen', async ({ page }) => {
        await checkDateRange(page);
    });

    test('Check date-range in edit screen', async ({ page }) => {
        await checkDateRange(page, true);
    });

    test('Check view screen and view a saved collection', async ({ page }) => {
        // Choose Garden
        await page.locator('#gardens').click();
        await page.waitForTimeout(100);
        await page.locator('#gardens').selectOption('Garden');
        await page.waitForTimeout(100);
        await page.locator('#gardens').evaluate(e => e.blur());
        await page.waitForTimeout(100);

        // Click on View tab
        await page.locator('#view-tab').click();

        // Verify number of collection displayed
        await expect(page.locator('div[id*="view-heading-"]')).toHaveCount(2);

        // Verify collection 1 details
        const collection1 = {
            'title': [
                'Sept. 29, 2022',
                'Garden: Subgarden 1',
                'admin',
            ], 'records': [
                [
                    'TestPlant1', 'unsure', 'yes', 'missed', 'no', 'no', '', 'yes', 'unsure', '', '', ''
                ], [
                    'TestPlant2', 'missed', 'no', 'yes', 'no', 'no', '10%', 'no', 'no', '', '', ''
                ], [
                    'TestPlant3', 'no', 'no', 'no', 'no', 'no', '', 'no', 'no', '', '', ''
                ], [
                    'TestPlant4', 'unsure', 'missed', 'yes', 'no', 'no', '90%', 'no', 'no', '', '', ''
                ], [
                    'TestPlant5', 'no', 'no', 'no', 'no', 'no', '', 'no', 'no', '', '', ''
                ], [
                    'TestPlant6', 'yes', 'no', 'no', 'no', 'no', '', 'no', 'no', '', '', ''
                ]
            ]
        };
        // Get collection 1 title data
        const collection1TitleData = await page.locator('#view-heading-1 span.d-flex span');
        // Verify collection 1 title data
        for (let i = 0; i < await collection1TitleData.count(); i++) {
            await expect(collection1TitleData.nth(i)).toHaveText(collection1['title'][i]);
        }
        // Click on title to fetch collection 1 records data
        await page.locator('#view-heading-1').click();
        await page.waitForTimeout(100);
        // Get collection 1 records data
        const collection1RecordsData = await page.locator('#view-collection-1 [id*="view-record-"]');
        // Verify collection 1 records data
        for (let i = 0; i < await collection1RecordsData.count(); i++) {
            const recordData = await collection1RecordsData.nth(i).locator('p.m-0');
            for (let j = 0; j < await recordData.count(); j++) {
                await expect(recordData.nth(j)).toHaveText(collection1['records'][i][j]);
            }
        }
    });

    test('Download as CSV | no collections & all collections', async ({ page }) => {
        // Choose All
        await page.locator('#gardens').click();
        await page.waitForTimeout(100);
        await page.locator('#gardens').selectOption('All');
        await page.waitForTimeout(100);
        await page.locator('#gardens').evaluate(e => e.blur());
        await page.waitForTimeout(100);

        // Click on View tab
        await page.locator('#view-tab').click();

        // Try download as CSV
        await page.locator('#downloadCSV').click();
        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('You have not selected any collection.');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();
        // Select all
        await page.locator('#viewSelectAll').click();
        // Check all the checkboxes are selected
        let allCheckboxes = await page.locator('[id^="selectedview-"]');
        for (let i = 0; i < await allCheckboxes.count(); i++) {
            await expect(allCheckboxes.nth(i)).toBeChecked();
        }

        const [ download ] = await Promise.all([
            // Start waiting for the download
            page.waitForEvent('download'),
            // Download as CSV
            page.locator('#downloadCSV').click(),
        ]);
        // Save downloaded file somewhere
        await download.saveAs('testDownload.csv');

        // Get expected output
        const expectedContent = require("../helpers/testCSVcontentUserAll.json");
        let jsonRow = 0;
        // Parse the CSV
        const fs = require("fs");
        const { parse } = require("csv-parse");
        fs.createReadStream("testDownload.csv")
        .pipe(parse({ delimiter: "," }))
        .on("data", async function (row) {
            // Compare read row to expected row
            await expect(row).toStrictEqual(expectedContent[jsonRow++]);
        })
        // Delete the downloaded file
        await download.delete();
        fs.unlink("testDownload.csv", function(err) {
            if (err) {
                throw err
            }
        });
        // Deselect all
        await page.locator('#viewDeselectAll').click();
        // Check all the checkboxes are selected
        allCheckboxes = await page.locator('[id^="selectedview-"]');
        for (let i = 0; i < await allCheckboxes.count(); i++) {
            await expect(allCheckboxes.nth(i)).not.toBeChecked();
        }
    });

    test('Download as CSV | some collections', async ({ page }) => {
        // Choose All
        await page.locator('#gardens').click();
        await page.waitForTimeout(100);
        await page.locator('#gardens').selectOption('All');
        await page.waitForTimeout(100);
        await page.locator('#gardens').evaluate(e => e.blur());
        await page.waitForTimeout(100);

        // Click on View tab
        await page.locator('#view-tab').click();

        // Select only collection with ID 1
        await page.locator('#selectedview-1').check();

        const [ download ] = await Promise.all([
            // Start waiting for the download
            page.waitForEvent('download'),
            // Download as CSV
            page.locator('#downloadCSV').click(),
        ]);
        // Save downloaded file somewhere
        await download.saveAs('testDownload.csv');

        // Get expected output
        const expectedContent = require("../helpers/testCSVcontentUserSome.json");
        let jsonRow = 0;
        // Parse the CSV
        const fs = require("fs");
        const { parse } = require("csv-parse");
        fs.createReadStream("testDownload.csv")
        .pipe(parse({ delimiter: "," }))
        .on("data", async function (row) {
            // Compare read row to expected row
            await expect(row).toStrictEqual(expectedContent[jsonRow++]);
        })
        // Delete the downloaded file
        await download.delete();
        fs.unlink("testDownload.csv", function(err) {
            if (err) {
                throw err
            }
        });
    });

    test('Check edit screen and edit a saved collection', async ({ page }) => {
        // Choose Garden
        await page.locator('#gardens').click();
        await page.waitForTimeout(100);
        await page.locator('#gardens').selectOption('Garden');
        await page.waitForTimeout(100);
        await page.locator('#gardens').evaluate(e => e.blur());
        await page.waitForTimeout(100);

        // Click on Edit tab
        await page.locator('#edit-tab').click();
        await page.waitForTimeout(100);

        // Verify the displayed collections
        await expect(page.locator('div[id^="heading-"]')).toHaveCount(4);
        await expect(page.locator('div[id="heading-new"]')).toHaveCount(1);
        await expect(page.locator('div[id="heading-1"]')).toHaveCount(1);
        await expect(page.locator('div[id="heading-2"]')).toHaveCount(1);
        await expect(page.locator('div[id="heading-3"]')).toHaveCount(1);

        // Check if an exclamation mark is visible next to the unfinished collection 2
        await expect(page.locator('div[id="heading-2"] i.bi.bi-exclamation-circle-fill')).toHaveCount(1);
        // Check if the collection is highlighted in red
        await expect(page.locator('div[id="heading-2"] div.text-danger')).toHaveCount(1);

        // Check if the checkbox is hiddem
        await expect(page.locator('#heading-2 #selected-2')).toBeHidden();

        // Check if card expanded
        await page.locator('#heading-2').click();
        await page.waitForTimeout(300);
        await expect(page.locator('#heading-2 div[aria-controls="collection-2"]')).toHaveAttribute('aria-expanded', 'true');
        // Check if the checkbox is visible
        await expect(page.locator('#heading-2 #selected-2')).toBeVisible();

        // Verify displayed data for the unfinished collection
        let row = await page.locator('#edit-records-2 tr[id^="record-"]');
        await expect(row.locator('[name="initial-vegetative-growth"]')).toHaveValue('no');
        await expect(row.locator('[name="young-leaves-unfolding"]')).toHaveValue('no');
        await expect(row.locator('[name="flowers-opening"]')).toHaveValue('no');
        await expect(row.locator('[name="peak-flowering"]')).toHaveValue('no');
        await expect(row.locator('[name="ripe-fruits"]')).toHaveValue('no');
        await expect(row.locator('[name="senescence"]')).toHaveValue('no');

        await expect(row.locator('[name="peak-flowering-estimation"]')).toHaveValue('');
        await expect(row.locator('[name="flowering-intensity"]')).toHaveValue('');
        await expect(row.locator('[name="senescence-intensity"]')).toHaveValue('');
        await expect(row.locator('[name="remarks"]')).toHaveValue('');

        await expect(row.locator('[name="cut-partly"]')).not.toBeChecked();
        await expect(row.locator('[name="cut-total"]')).not.toBeChecked();
        await expect(row.locator('[name="covered-natural"]')).not.toBeChecked();
        await expect(row.locator('[name="covered-artificial"]')).not.toBeChecked();
        await expect(row.locator('[name="transplanted"]')).not.toBeChecked();
        await expect(row.locator('[name="removed"]')).not.toBeChecked();

        // Try saving the unfinished collection
        await page.locator('[id="2-save"]').click();
        await page.waitForTimeout(300);
        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Fields cannot be left empty.');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Change values and then cancel
        await row.locator('[name="initial-vegetative-growth"]').selectOption('y');
        await row.locator('[name="young-leaves-unfolding"]').selectOption('y');
        await row.locator('[name="flowers-opening"]').selectOption('y');
        await row.locator('[name="peak-flowering"]').selectOption('y');
        await row.locator('[name="ripe-fruits"]').selectOption('y');
        await row.locator('[name="senescence"]').selectOption('y');

        await row.locator('[name="peak-flowering-estimation"]').selectOption('y');
        await row.locator('[name="flowering-intensity"]').selectOption('100');
        await row.locator('[name="senescence-intensity"]').selectOption('100');
        await row.locator('[name="remarks"]').fill('Test');

        await row.locator('[name="cut-partly"]').check();
        await row.locator('[name="cut-total"]').check();
        await row.locator('[name="covered-natural"]').check();
        await row.locator('[name="covered-artificial"]').check();
        await row.locator('[name="transplanted"]').check();
        await row.locator('[name="removed"]').check();

        // Cancel
        await page.locator('[id="2-cancel"]').click();
        await page.waitForTimeout(300);
        // Verify again
        row = await page.locator('#edit-records-2 tr[id^="record-"]');
        await expect(row.locator('[name="initial-vegetative-growth"]')).toHaveValue('no');
        await expect(row.locator('[name="young-leaves-unfolding"]')).toHaveValue('no');
        await expect(row.locator('[name="flowers-opening"]')).toHaveValue('no');
        await expect(row.locator('[name="peak-flowering"]')).toHaveValue('no');
        await expect(row.locator('[name="ripe-fruits"]')).toHaveValue('no');
        await expect(row.locator('[name="senescence"]')).toHaveValue('no');

        await expect(row.locator('[name="peak-flowering-estimation"]')).toHaveValue('');
        await expect(row.locator('[name="flowering-intensity"]')).toHaveValue('');
        await expect(row.locator('[name="senescence-intensity"]')).toHaveValue('');
        await expect(row.locator('[name="remarks"]')).toHaveValue('');

        await expect(row.locator('[name="cut-partly"]')).not.toBeChecked();
        await expect(row.locator('[name="cut-total"]')).not.toBeChecked();
        await expect(row.locator('[name="covered-natural"]')).not.toBeChecked();
        await expect(row.locator('[name="covered-artificial"]')).not.toBeChecked();
        await expect(row.locator('[name="transplanted"]')).not.toBeChecked();
        await expect(row.locator('[name="removed"]')).not.toBeChecked();

        // Check if the card collapsed
        await expect(page.locator('#heading-2 div[aria-controls="collection-2"]')).toHaveAttribute('aria-expanded', 'false');

        // Edit a saved collection and change remarks on it
        await page.locator('#heading-3').click();
        await page.waitForTimeout(300);
        await page.locator('[id="7-remarks"]').fill("Test");
        // Try save all
        await page.locator('#uploadSelected').click();
        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('You have not selected any collection.');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();
        // Check all
        await page.locator('#selectAll').click();
        // Check if the checkboxes are all checked
        let allCheckboxes = await page.locator('[id^="selected-"]');
        for (let i = 0; i < await allCheckboxes.count(); i++) {
            const isVisible = await allCheckboxes.nth(i).isVisible();
            if (isVisible)
                await expect(allCheckboxes.nth(i)).toBeChecked();
        }

        // Try saving all again
        await page.locator('#uploadSelected').click();
        // Expect a modal dialog for an alert
        await page.waitForSelector('div.modal.fade.show .modal-dialog');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-title')).toHaveText('Alert');
        await expect(page.locator('div.modal.fade.show .modal-dialog .modal-body')).toHaveText('Fields cannot be left empty.');
        await page.locator('div.modal.fade.show .modal-dialog #alert-okay').click();

        // Select none
        await page.locator('#deselectAll').click();
        // Check if all the checkboxes are deselected
        allCheckboxes = await page.locator('[id^="selected-"]');
        for (let i = 0; i < await allCheckboxes.count(); i++) {
            const isVisible = await allCheckboxes.nth(i).isVisible();
            if (isVisible)
                await expect(allCheckboxes.nth(i)).not.toBeChecked();
        }

        // Check only the edited collection and save all
        await page.locator('[id="selected-3"]').check();
        await page.locator('#uploadSelected').click();
        await page.waitForTimeout(300);

        // Check the edited collection and verify edited field
        await page.locator('#heading-3').click();
        await page.waitForTimeout(300);
        await expect(page.locator('[id="7-remarks"]')).toHaveValue('Test');
        // Edit it back to original and save
        await page.locator('[id="7-remarks"]').fill("");
        await page.locator('[id="3-save"]').click();
        await page.waitForTimeout(300);
        // Expect the edited field to be empty again
        await page.locator('#heading-3').click();
        await page.waitForTimeout(300);
        await expect(page.locator('[id="7-remarks"]')).toHaveValue('');
    });

    test('Check garden options in add collection', async ({ page }) => {
        // Choose Garden
        await page.locator('#gardens').click();
        await page.waitForTimeout(100);
        await page.locator('#gardens').selectOption('Garden');
        await page.waitForTimeout(100);
        await page.locator('#gardens').evaluate(e => e.blur());
        await page.waitForTimeout(100);

        // Open edit tab
        await page.locator('#edit-tab').click();

        // Click on Add new collection button
        await page.locator('#heading-new').click();
        await page.waitForTimeout(300);

        // Verify garden options
        await expect(page.locator('#new-subgarden option')).toHaveCount(2);
        await expect(page.locator('#new-subgarden option[id="2"]')).toHaveText("Garden: Subgarden 1");
        await expect(page.locator('#new-subgarden option[id="3"]')).toHaveText("Garden: Subgarden 2");
    });
});
