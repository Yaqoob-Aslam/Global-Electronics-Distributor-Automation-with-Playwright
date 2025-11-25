import { test, expect, chromium } from '@playwright/test';

test.describe.serial('Enrgtech - Global Electronics Distributor', () => {

  let browser, context, page;
  const BASE_URL = 'https://www.enrgtech.co.uk/';

  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized'],
      slowMo: 200, // slows down actions for stability
    });
    context = await browser.newContext({
      viewport: null,
      deviceScaleFactor: undefined,
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true
    });
    page = await context.newPage();

    // Set longer default timeout for all actions
    page.setDefaultTimeout(180000);
    page.setDefaultNavigationTimeout(200000);
  });

test('Semiconductors products verification:', async () => {

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Navigate through categories
    await page.getByRole('button', { name: 'Products' }).click();
    await page.getByRole('button', { name: 'Semiconductors' }).click();
    await page.getByText('Programmable Logic Circuits').click();

    // Click "Show more" - first one
    await page.getByRole('link', { name: 'Show more' }).first().click();
    await expect(page).toHaveURL(/category\/semiconductors\/programmable-logic-circuits/);
    await page.waitForTimeout(5000);
    await page.goBack();    

    // Click "Show more" - second one
    await page.getByRole('link', { name: 'Show more' }).nth(1).click();
    await expect(page).toHaveURL(/category\/semiconductors\/programmable-logic-circuits\/cplds/);
    await page.waitForTimeout(5000);
    await page.goBack();
  
    // Click "Show more" - third one
    await page.getByRole('link', { name: 'Show more' }).nth(2).click();
    await expect(page).toHaveURL(/category\/semiconductors\/programmable-logic-circuits\/programmable-array-logic-circuits/);
    await page.waitForTimeout(5000);
    await page.goBack(); 

    // Click "Show more" - fourth one
    await page.getByRole('link', { name: 'Show more' }).nth(3).click();
    await expect(page).toHaveURL(/category\/semiconductors\/programmable-logic-circuits\/splds/);
    await page.waitForTimeout(5000);
    await page.goBack();
});

test('FPGAs semiconductors products filters verification:', async () => {

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Navigate through categories
    await page.getByRole('button', { name: 'Products' }).click();
    await page.getByRole('button', { name: 'Semiconductors' }).click();
    await page.getByText('Programmable Logic Circuits').click();

    await page.getByRole('link', { name: 'Show more' }).first().click();
    await expect(page).toHaveURL(/category\/semiconductors\/programmable-logic-circuits/);
    await page.waitForTimeout(5000);
    
    // Xilinx filter  
    await page.locator("//option[@value='xilinx']")  .click(); 
    await page.waitForTimeout(3000);
        
    // Clear filter
    await page.getByRole('link', { name: 'Clear All' }).click();
    await page.waitForTimeout(3000);

    // Altera filter  
    await page.locator("//option[@value='lattice-semiconductor']").click();
    await page.waitForTimeout(3000);
    
    // Clear filter
    await page.getByRole('link', { name: 'Clear All' }).click();
    await page.waitForTimeout(3000);

    // Lattice Semiconductor filter  
    await page.locator("//option[@value='altera']").click();
    await page.waitForTimeout(3000);

    // Final clear
    await page.getByRole('link', { name: 'Clear All' }).click();
    await page.waitForTimeout(3000);
});

test('Cplds semiconductors products filters verification:', async () => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    // Navigate through categories
    await page.getByRole('button', { name: 'Products' }).click();
    await page.getByRole('button', { name: 'Semiconductors' }).click();
    await page.getByText('Programmable Logic Circuits').click();

    await page.getByRole('link', { name: 'Show more' }).nth(1).click();
    await expect(page).toHaveURL(/category\/semiconductors\/programmable-logic-circuits\/cplds/);
    await page.waitForTimeout(5000);
    
    await page.locator("option[value='altera']").click();
    await page.waitForTimeout(3000);
    
    // Clear filter
    await page.getByRole('link', { name: 'Clear All' }).click();
    await page.waitForTimeout(3000);

    await page.locator("option[value='xilinx']").click();
    await page.waitForTimeout(3000);
    
    // Clear filter
    await page.getByRole('link', { name: 'Clear All' }).click();
    await page.waitForTimeout(3000);

    await page.locator("option[value='atmel']").click();
    await page.waitForTimeout(3000);

    // Clear filter
    await page.getByRole('link', { name: 'Clear All' }).click();
    await page.waitForTimeout(3000);

    page.locator("option[value='lattice-semiconductor']").click();
    await page.waitForTimeout(3000);

    // Clear filter
    await page.getByRole('link', { name: 'Clear All' }).click();
    await page.waitForTimeout(3000);

    await page.locator("option[value='microchip']").click();
    await page.waitForTimeout(3000);

    // Clear clear
    await page.getByRole('link', { name: 'Clear All' }).click();
    await page.waitForTimeout(3000);
});

test('Programmable Array Logic Circuits semiconductors products filters verification:', async () => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    // Navigate through categories
    await page.getByRole('button', { name: 'Products' }).click();
    await page.getByRole('button', { name: 'Semiconductors' }).click();
    await page.getByText('Programmable Logic Circuits').click();

    await page.getByRole('link', { name: 'Show more' }).nth(2).click();
    await expect(page).toHaveURL(/category\/semiconductors\/programmable-logic-circuits\/programmable-array-logic-circuits/);
    await page.waitForTimeout(5000);
   
    await page.locator("option[value='altera']").click();
    await page.waitForTimeout(3000);

    // Clear clear
    await page.getByRole('link', { name: 'Clear All' }).click();
    await page.waitForTimeout(3000);
});

test('SPLDs semiconductors products filters verification:', async () => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    // Navigate through categories
    await page.getByRole('button', { name: 'Products' }).click();
    await page.getByRole('button', { name: 'Semiconductors' }).click();
    await page.getByText('Programmable Logic Circuits').click();

    await page.getByRole('link', { name: 'Show more' }).nth(3).click();
    await expect(page).toHaveURL(/category\/semiconductors\/programmable-logic-circuits\/splds/);
    await page.waitForTimeout(5000);
   
    await page.locator("option[value='atmel']").click();
    await page.waitForTimeout(3000);

    // Clear clear
    await page.getByRole('link', { name: 'Clear All' }).click();
    await page.waitForTimeout(3000);

    await page.locator("option[value='microchip']").click();
    await page.waitForTimeout(3000);

    // Clear clear
    await page.getByRole('link', { name: 'Clear All' }).click();
    await page.waitForTimeout(3000);
});

test.afterAll(async () => {
    await page.close();
  });
});