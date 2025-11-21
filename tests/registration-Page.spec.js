import { test, expect, chromium } from '@playwright/test';

test.describe.serial('Enrgtech - Global Electronics Distributor', () => {

  let browser, context, page;
  const BASE_URL = 'https://www.enrgtech.co.uk/register/';

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
    page.setDefaultNavigationTimeout(120000);
  });

test('Registration via Personel Panel', async () => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.locator('#first-name').fill('John');
  await page.locator('#last-name').fill('Doe');
  await page.locator('#email').fill('test@gmail.com');
  await page.locator('#password').fill('Test@1234');
  
  // Scroll the page to bottom first, then to specific element
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  
  await page.getByRole('textbox', { name: 'Confirm Password *' }).fill('Test@1234');
  await page.getByRole('button', { name: 'Continue to Step 2' }).click();
});

test('Registration via Business Panel', async () => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.getByText('BUSINESS', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Company name *' }).fill('Test Company Ltd');
  await page.getByRole('textbox', { name: 'Company email *' }).fill('test@gmail.com');
  await page.getByRole('textbox', { name: 'Company phone *' }).fill('+92 3023738608');
  await page.getByRole('textbox', { name: 'First name *' }).fill('John');
  await page.getByRole('textbox', { name: 'Last name *' }).fill('Doe');

    // Scroll the page to bottom first, then to specific element
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  await page.locator('#email').fill('test@gmail.com');
  await page.locator('#password').fill('Test@1234');
  await page.locator('#password-confirm').fill('Test@1234');
  await page.getByRole('button', { name: 'Continue to Step 2' }).click();

});

test.afterAll(async () => {
    await page.pause();
    // await page.close();
  });
});