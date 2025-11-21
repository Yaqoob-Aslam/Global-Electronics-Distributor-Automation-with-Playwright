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
    page.setDefaultTimeout(80000);
    page.setDefaultNavigationTimeout(120000);
  });

  test('Dashboard Page Load Test', async () => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Check if popup is visible and close it
    const closeButton = page.getByText('Close');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(1000); // Wait for popup to close
    }

    await expect(page.getByRole('link', { name: 'Enrgtech', exact: true })).toBeVisible();
    await expect(page.getByText('Deliver to')).toBeVisible();
    await expect(page.getByText('United Kingdom')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Search By Keyword |' })).toBeVisible();

    // Direct selection without clicking first
    await page.getByRole('combobox').selectOption('AED');
  });

  test('Verify Header Elements', async () => {
    await page.getByRole('button', { name: 'Products' }).click();
    await page.waitForTimeout(1000); // Wait for dropdown to appear
    await page.getByRole('button', { name: 'Manufacturers' }).click();
    await page.waitForTimeout(1000); // Wait for dropdown to appear

    await Promise.all([
      page.waitForLoadState('domcontentloaded'),
      page.getByRole('link', { name: 'Marketplace' }).click()
    ]);

    await page.waitForTimeout(800); // small wait
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // NEXT LINK
    await Promise.all([
      page.waitForLoadState('domcontentloaded'),
      page.getByRole('link', { name: 'New Products' }).click()
    ]);

    await page.waitForTimeout(800);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
  });

  test.afterAll(async () => {
    await page.pause();
    // await page.close();
  });
});