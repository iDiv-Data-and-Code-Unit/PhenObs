const { test, expect } = require('@playwright/test');
const { add_admin } = require('../helpers/login/userEnvironments.js');
const login = require('../helpers/login/login.js');

test.describe('Add collection', () => {
    let page = null;
    let context = null;

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();
        await login(page, add_admin);
        await page.goto(process.env.E2E_INDEX + 'observations/');

        // Click on add collection
        await page.locator('#add-collection').click();
    });

    test('Before choosing a subgarden', async () => {
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

    test('Choosing gardens', async () => {
        // Choose subgarden AddSubgarden1
        await page.locator('#subgarden').click();
        await page.locator('#subgarden').selectOption('AddSubgarden1');
        await page.locator('#subgarden').click();

        const garden = page.locator('#subgarden');

        // Verify empty subgarden option has been removed
        await expect(garden.locator('option')).toHaveCount(2);
        await expect(garden.locator('#empty')).toHaveCount(0);

        // Select the strinsg for the subgardens
        await expect(garden.locator('option[name="5"]')).not.toContainText('+');
        await expect(garden.locator('option[name="6"]')).toContainText('+');

        // Check set date as default
        const today = new Date().toLocaleDateString('en-CA'); // Returns date for today in YYYY-MM-DD format
        await expect(page.locator('#collection-date')).toHaveValue(today);

        // Check creator info
        await expect(page.locator('#creator')).toHaveText(add_admin.username);

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

        // Checking the local storage

    });
});
