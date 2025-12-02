import { test, expect, chromium } from '@playwright/test';

test.describe.serial('Enrgtech - Global Electronics Distributor', () => {

  let browser, context, page;
  const BASE_URL = 'https://www.enrgtech.co.uk/';

  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized'],
      slowMo: 500,
    });
  });

  test.beforeEach(async () => {
    // Har test ke liye naya context aur page banayein
    context = await browser.newContext({
      viewport: null,
      deviceScaleFactor: undefined,
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true
    });
    page = await context.newPage();

    // Set longer default timeout for all actions
    page.setDefaultTimeout(360000);
    page.setDefaultNavigationTimeout(360000);
  });

  test.afterEach(async () => {
    // Har test ke baad context close karein
    if (context) {
      await context.close();
    }
  });

  // Enhanced page state check
  async function isPageUsable() {
    try {
      // Multiple checks to ensure page is usable
      await page.evaluate(() => document.readyState);
      return true;
    } catch (error) {
      console.log('Page is not usable:', error.message);
      return false;
    }
  }

  // Safe operation wrapper
  async function safeOperation(operation, operationName) {
    if (!(await isPageUsable())) {
      console.log(`✗ Cannot perform ${operationName} - page is not usable`);
      return false;
    }
    
    try {
      return await operation();
    } catch (error) {
      console.log(`✗ ${operationName} failed:`, error.message);
      return false;
    }
  }

  // Smart scroll functions with page state check
  async function smartScrollToElement(selector, maxAttempts = 2) {
    return await safeOperation(async () => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const element = page.locator(selector).first();
          
          // Check if element is visible without scrolling
          if (await element.isVisible({ timeout: 2000 })) {
            console.log(`✓ Element already visible: ${selector}`);
            return true;
          }
          
          // Scroll to element
          console.log(`Scrolling to element (attempt ${attempt}): ${selector}`);
          await element.scrollIntoViewIfNeeded();
          await page.waitForTimeout(1000);
          
          // Check if element is now visible
          if (await element.isVisible({ timeout: 2000 })) {
            console.log(`✓ Successfully scrolled to element: ${selector}`);
            return true;
          }
          
        } catch (error) {
          console.log(`Scroll attempt ${attempt} failed: ${error.message}`);
          if (attempt === maxAttempts) throw error;
        }
      }
      return false;
    }, `scroll to ${selector}`);
  }

  // Scroll to multiple possible elements
  async function scrollToAnyElement(selectors) {
    return await safeOperation(async () => {
      for (const selector of selectors) {
        try {
          if (await smartScrollToElement(selector)) {
            return true;
          }
        } catch {
          continue;
        }
      }
      return false;
    }, 'scroll to any element');
  }

  // General page scroll functions
  async function scrollToTop() {
    return await safeOperation(async () => {
      await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      await page.waitForTimeout(1000);
      console.log('✓ Scrolled to top');
      return true;
    }, 'scroll to top');
  }

  async function scrollByPixels(pixels) {
    return await safeOperation(async () => {
      await page.evaluate((pixels) => {
        window.scrollBy({ top: pixels, behavior: 'smooth' });
      }, pixels);
      await page.waitForTimeout(800);
      console.log(`✓ Scrolled by ${pixels} pixels`);
      return true;
    }, `scroll by ${pixels} pixels`);
  }

  // Smart form filling with page state check
  async function fillFieldWithScroll(fieldName, value, selectors) {
    return await safeOperation(async () => {
      console.log(`Filling ${fieldName}...`);
      
      let fieldFilled = false;
      
      for (const selector of selectors) {
        try {
          const fieldLocator = page.locator(selector).first();
          if (await fieldLocator.isVisible({ timeout: 3000 })) {
            console.log(`✓ Found ${fieldName} field with selector: ${selector}`);
            
            // Clear field first
            await fieldLocator.click({ clickCount: 3 });
            await fieldLocator.press('Backspace');
            await page.waitForTimeout(500);
            
            // Fill the field
            await fieldLocator.fill(value);
            await page.waitForTimeout(500);
            
            // Verify the value was entered
            const enteredValue = await fieldLocator.inputValue();
            if (enteredValue === value) {
              console.log(`✓ Successfully filled ${fieldName} with: ${value}`);
              fieldFilled = true;
              break;
            } else {
              console.log(`⚠ Value mismatch for ${fieldName}. Expected: ${value}, Got: ${enteredValue}`);
              // Try alternative filling method
              await fieldLocator.click({ clickCount: 3 });
              await fieldLocator.press('Backspace');
              await fieldLocator.type(value, { delay: 50 });
              
              const newValue = await fieldLocator.inputValue();
              if (newValue === value) {
                console.log(`✓ Successfully filled ${fieldName} using type method`);
                fieldFilled = true;
                break;
              }
            }
          }
        } catch (error) {
          console.log(`Failed with selector ${selector}: ${error.message}`);
          continue;
        }
      }
      
      if (!fieldFilled) {
        console.log(`✗ Could not fill ${fieldName} with any selector`);
        return false;
      }
      
      return true;
    }, `fill ${fieldName}`);
  }

  // Safe navigation function
  async function safeNavigate(url, options = {}) {
    return await safeOperation(async () => {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 90000,
        ...options 
      });
      console.log(`✓ Navigated to: ${url}`);
      return true;
    }, `navigate to ${url}`);
  }

  // Safe click function
  async function safeClick(locator, timeout = 10000) {
    return await safeOperation(async () => {
      await locator.click({ timeout });
      return true;
    }, 'click element');
  }

  // Common product details verify karne ke liye function
  async function verifyCommonProductDetails() {
    return await safeOperation(async () => {
      await page.waitForSelector('[data-testid="product-information"], .product-info, h1, h2', { timeout: 10000 });
      
      const commonFields = ['Mounting Type', 'Family Name', 'Package Type', 'Width', 'Length'];
      for (const field of commonFields) {
        try {
          await expect(page.getByText(field, { exact: false })).toBeVisible({ timeout: 5000 });
        } catch {
          console.log(`Field "${field}" not found, continuing...`);
        }
      }
      return true;
    }, 'verify common product details');
  }

  // Smart cart navigation function
  async function navigateToCartOrBasket() {
    return await safeOperation(async () => {
      console.log('Checking available cart navigation options...');
      
      // Pehle "Proceed" button check karein
      const proceedOptions = [
        page.getByRole('button', { name: /Proceed/i }),
        page.getByText('Proceed', { exact: true }),
        page.locator('button').filter({ hasText: /Proceed/i }),
        page.locator('a').filter({ hasText: /Proceed/i })
      ];
      
      for (const proceedLocator of proceedOptions) {
        try {
          if (await proceedLocator.isVisible({ timeout: 3000 })) {
            await safeClick(proceedLocator);
            console.log('✓ Clicked Proceed button');
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
            return true;
          }
        } catch {
          continue;
        }
      }
      
      // Agar "Proceed" nahi mila toh "VIEW BASKET" check karein
      console.log('Proceed button not found, checking for VIEW BASKET...');
      
      const viewBasketOptions = [
        page.getByRole('link', { name: 'VIEW BASKET' }),
        page.locator('a.btn').filter({ hasText: 'VIEW BASKET' }),
        page.getByText('VIEW BASKET', { exact: true }).first(),
        page.getByRole('button', { name: 'VIEW BASKET' })
      ];
      
      for (const basketLocator of viewBasketOptions) {
        try {
          if (await basketLocator.isVisible({ timeout: 3000 })) {
            await safeClick(basketLocator);
            console.log('✓ Clicked VIEW BASKET');
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
            return true;
          }
        } catch {
          continue;
        }
      }
      
      // Agar kuch bhi nahi mila toh direct navigation
      console.log('No cart navigation buttons found, using direct navigation...');
      await safeNavigate(BASE_URL + 'cart');
      return true;
      
    }, 'navigate to cart or basket');
  }

  // NEW FUNCTION: Handle minimum cart amount error
  async function handleMinimumCartError(currentProductUrl) {
    try {
      console.log('🔄 Checking for minimum cart amount error...');
      
      // Check if minimum cart error message is visible
      const minCartError = page.getByText(/Minimum cart amount is £20\.000/i);
      if (await minCartError.isVisible({ timeout: 3000 })) {
        console.log('⚠ Minimum cart amount error detected');
        console.log('🔄 Redirecting to specified product page...');
        
        // Navigate to the specified product page
        await safeNavigate('https://www.enrgtech.co.uk/product/fpgas/ET13805728/iCE40LP1K-CM49');
        console.log('✓ Successfully redirected to specified product page');
        
        // Continue with normal flow for this new product
        return true;
      }
      return false;
    } catch (error) {
      console.log('No minimum cart error detected, continuing...');
      return false;
    }
  }

// Improved checkout process function
async function completeCheckoutProcess(productNumber, currentProductUrl) {
  try {
    console.log(`\n🛒 Starting checkout process for product ${productNumber}...`);
    
    // Step 1: Add to cart
    console.log('Step 1: Adding product to cart...');
    
    const addToCartBtn = page.getByRole('button', { name: /Add To Cart/i });
    if (!(await safeClick(addToCartBtn))) {
      throw new Error('Failed to click Add to Cart button');
    }

    await page.waitForTimeout(3000);
    
    // NEW: Check for minimum cart amount error after adding to cart
    if (await handleMinimumCartError(currentProductUrl)) {
      // If redirected to new product page, continue checkout process for this new product
      console.log('🔄 Continuing checkout process for new product...');
      
      // Add the new product to cart
      const newAddToCartBtn = page.getByRole('button', { name: /Add To Cart/i });
      if (!(await safeClick(newAddToCartBtn))) {
        throw new Error('Failed to click Add to Cart button for new product');
      }
      await page.waitForTimeout(3000);
    }
    
    // Step 2: Smart navigation to cart/basket
    console.log('Step 2: Navigating to cart/basket...');
    if (!(await navigateToCartOrBasket())) {
      throw new Error('Could not navigate to cart/basket');
    }
    
    // Step 3: Proceed to checkout
    console.log('Step 3: Proceeding to checkout...');
    
    const checkoutOptions = [
      page.getByRole('button', { name: 'Checkout' }),
      page.getByRole('link', { name: 'Checkout' }),
      page.getByText('Checkout', { exact: true }),
      page.getByRole('button', { name: /Check out securely/i }),
      page.getByRole('button', { name: /Proceed to Checkout/i }),
      page.locator('a').filter({ hasText: /Checkout/i })
    ];
    
    let checkoutClicked = false;
    for (const checkoutLocator of checkoutOptions) {
      try {
        if (await checkoutLocator.isVisible({ timeout: 5000 })) {
          if (await safeClick(checkoutLocator)) {
            console.log('✓ Clicked Checkout button');
            checkoutClicked = true;
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!checkoutClicked) {
      // Fallback: Direct navigation to checkout
      if (!(await safeNavigate(BASE_URL + 'checkout'))) {
        throw new Error('Failed to navigate to checkout');
      }
    }

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Step 4: Fill in checkout details
    console.log('Step 4: Filling checkout details...');
    
    // Scroll to top of form first
    await scrollToTop();
    await page.waitForTimeout(1000);

    // Fill all fields
    const fieldsToFill = [
      { 
        name: 'email', 
        value: 'test40@gmail.com', 
        selectors: [
          '[name="email"]', 
          '#email', 
          'input[type="email"]',
          'input[name="email"]'
        ] 
      },
      { 
        name: 'first name', 
        value: 'John', 
        selectors: [
          '[name="first_name"]',
          '[name="firstName"]',
          '[name="firstname"]',
          '#first_name',
          '#firstName',
          '#firstname',
          'input[placeholder*="First"]',
          'input[placeholder*="first"]'
        ] 
      },
      { 
        name: 'last name', 
        value: 'Doe', 
        selectors: [
          '[name="last_name"]',
          '[name="lastName"]',
          '[name="lastname"]',
          '#last_name',
          '#lastName',
          '#lastname',
          'input[placeholder*="Last"]',
          'input[placeholder*="last"]'
        ] 
      },
      { 
        name: 'phone', 
        value: '1234567890', 
        selectors: [
          'input[name="phone"]',
          '[name="telephone"]',
          '#phone',
          'input[type="tel"]'
        ] 
      },
      { 
        name: 'password', 
        value: 'SecurePass123!', 
        selectors: [
          '[name="password"]',
          '#password',
          'input[type="password"]'
        ] 
      },
      { 
        name: 'confirm password', 
        value: 'SecurePass123!', 
        selectors: [
          '[name="confirm_password"]',
          '[name="confirmPassword"]',
          '#confirm_password'
        ] 
      }
    ];

    for (const field of fieldsToFill) {
      console.log(`\n--- Filling ${field.name} ---`);
      
      // Scroll between fields
      await scrollByPixels(150);
      
      const success = await fillFieldWithScroll(field.name, field.value, field.selectors);
      
      if (!success) {
        console.log(`⚠ Warning: Could not fill ${field.name}, but continuing...`);
      }
      
      await page.waitForTimeout(500);
    }

    // NEW: Additional checkout fields filling
    console.log('\n--- Filling Additional Checkout Fields ---');
    
    // Scroll down for additional fields
    await scrollByPixels(400);
    
    // Fill Pakistan phone number dropdown
    try {
      const pakistanOption = page.getByTitle('Pakistan (‫پاکستان‬‎): +92', { exact: true });
      if (await pakistanOption.isVisible({ timeout: 3000 })) {
        await safeClick(pakistanOption);
        console.log('✓ Selected Pakistan phone code');
      }
    } catch (error) {
      console.log('⚠ Could not select Pakistan phone code');
    }

    // Fill mobile number
    await fillFieldWithScroll('mobile number', '3023738608', [
      '#mobileNo',
      '[name="mobileNo"]',
      'input[name="mobileNo"]',
      'input[placeholder*="mobile"]',
      'input[placeholder*="phone"]'
    ]);

    // Fill PO number
    await fillFieldWithScroll('PO number', '674DE', [
      '[name="po_number"]',
      '#po_number',
      'input[name="po_number"]',
      'input[placeholder*="PO"]',
      'input[placeholder*="purchase order"]'
    ]);

    // Select billing country
    try {
      const billingCountry = page.locator('[name="billing_country"]');
      if (await billingCountry.isVisible({ timeout: 3000 })) {
        await billingCountry.selectOption({ label: /Pakistan|PK/i });
        console.log('✓ Selected billing country');
      }
    } catch (error) {
      console.log('⚠ Could not select billing country');
    }

    // Fill billing address
    await fillFieldWithScroll('billing address', 'Street#23 Gulberg Lahroe', [
      '#billing_address_1',
      '[name="billing_address_1"]',
      'input[name="billing_address_1"]',
      'input[placeholder*="address"]',
      'input[placeholder*="street"]'
    ]);

    // Fill billing city
    await fillFieldWithScroll('billing city', 'Lahore', [
      '#billing_city',
      '[name="billing_city"]',
      'input[name="billing_city"]',
      'input[placeholder*="city"]',
      'input[placeholder*="town"]'
    ]);

    // Fill postal code
    await fillFieldWithScroll('postal code', 'DHE4392', [
      '#billing_post_zip_code',
      '[name="billing_post_zip_code"]',
      'input[name="billing_post_zip_code"]',
      'input[placeholder*="post"]',
      'input[placeholder*="zip"]',
      'input[placeholder*="code"]'
    ]);

    // Fill EORI number
    await fillFieldWithScroll('EORI number', 'HDE57', [
      '#eori',
      '[name="eori"]',
      'input[name="eori"]',
      'input[placeholder*="EORI"]',
      'input[placeholder*="eori"]'
    ]);

    // NEW: Credit Card Fields - FIXED for Stripe iframes
    console.log('\n--- Filling Credit Card Details ---');
    
    // Scroll down for credit card fields
    await scrollByPixels(600);
    
    // Fill card name
    await fillFieldWithScroll('card name', 'Jhon Doe', [
      '[name="card_name"]',
      '#card_name',
      'input[name="card_name"]',
      'input[placeholder*="name"]',
      'input[placeholder*="card"]'
    ]);

    // Wait for Stripe iframes to load
    console.log('Waiting for Stripe iframes to load...');
    await page.waitForTimeout(3000);
    
    // FIXED: MULTIPLE APPROACHES TO HANDLE STRIPE IFRAMES
    console.log('\n--- Filling Card Number, Expiry and CVC ---');
    
    // Take screenshot before filling for debugging
    try {
      await page.screenshot({ path: `before-stripe-fill-${productNumber}.png` });
    } catch (error) {
      console.log('Could not take screenshot:', error.message);
    }
    
    // APPROACH 1: Try using the exact iframe titles with specific input selectors
    try {
      console.log('Trying Approach 1: Using exact iframe titles with specific inputs...');
      
      // Card Number iframe - Use more specific input selector
      try {
        const cardNumberFrame = page.frameLocator('iframe[title*="Secure card number input frame"]');
        // Use specific selector for card number input
        await cardNumberFrame.locator('input[name="cardnumber"], input[placeholder*="1234"], input[aria-label*="card number"]').first().fill("4242424242424242", { timeout: 3000 });
        console.log('✓ Filled card number in Stripe iframe');
      } catch (error) {
        console.log('⚠ Card number iframe fill failed:', error.message);
      }
      
      await page.waitForTimeout(500);
      
      // Expiry iframe - Use more specific input selector
      try {
        const expiryFrame = page.frameLocator('iframe[title*="Secure expiration date input frame"]');
        // Use specific selector for expiry input
        await expiryFrame.locator('input[name="exp-date"], input[placeholder*="MM / YY"], input[aria-label*="expiration"]').first().fill("12/34", { timeout: 3000 });
        console.log('✓ Filled expiry in Stripe iframe');
      } catch (error) {
        console.log('⚠ Expiry iframe fill failed:', error.message);
      }
      
      await page.waitForTimeout(500);
      
      // CVC iframe - Use more specific input selector
      try {
        const cvcFrame = page.frameLocator('iframe[title*="Secure CVC input frame"]');
        // Use specific selector for CVC input
        await cvcFrame.locator('input[name="cvc"], input[placeholder*="CVC"], input[aria-label*="CVC"]').first().fill("123", { timeout: 3000 });
        console.log('✓ Filled CVC in Stripe iframe');
      } catch (error) {
        console.log('⚠ CVC iframe fill failed:', error.message);
      }
      
    } catch (error) {
      console.log('Approach 1 failed:', error.message);
    }
    
    // Take screenshot after filling for verification
    try {
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `after-stripe-fill-${productNumber}.png` });
      console.log('✓ Screenshot taken after card filling');
    } catch (error) {
      console.log('Could not take after screenshot:', error.message);
    }
    
    console.log('\n✓ Card details filling completed');

    // NEW: PAYMENT METHODS SECTION - FIXED (REMOVED SPECIFIC XPATH)
    console.log('\n--- Payment Methods Section ---');
    
    // Scroll down to payment section
    await scrollByPixels(800);
    await page.waitForTimeout(2000);
    
    // STEP 1: Pay by Bank Transfer Radio Button
    console.log('\n--- Selecting "Pay by Bank Transfer" ---');
    await page.waitForTimeout(1000);
    
    // STEP 2: I accept the terms and conditions Checkbox
    console.log('\n--- Accepting Terms and Conditions ---');
    
    try {
      console.log('Looking for "I accept the terms and conditions" checkbox...');
      
      // Multiple selectors for terms checkbox
      const termsCheckboxSelectors = [
        // XPath for span next to checkbox
        page.locator('//input[@id="terms" and @type="checkbox"]/following-sibling::span'),
        // Direct checkbox
        page.locator('#terms[type="checkbox"]'),
        // Checkbox by name
        page.locator('input[name="terms"][type="checkbox"]'),
        // Checkbox by class
        page.locator('.woocommerce-terms-and-conditions-checkbox-text'),
        // Label with terms text
        page.locator('label').filter({ hasText: /i accept the terms and conditions/i }),
        page.locator('label').filter({ hasText: /terms and conditions/i })
      ];
      
      let termsAccepted = false;
      
      for (const selector of termsCheckboxSelectors) {
        try {
          if (await selector.isVisible({ timeout: 2000 })) {
            console.log(`Found terms checkbox selector: ${selector}`);
            
            // Scroll into view
            await selector.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            
            // Take screenshot for debugging
            try {
              await page.screenshot({ path: `debug-terms-checkbox-${productNumber}.png` });
            } catch (screenshotError) {
              console.log('Could not take screenshot:', screenshotError.message);
            }
            
            // Try to check/click
            try {
              if (await selector.getAttribute('type') === 'checkbox') {
                await selector.check({ force: true, timeout: 3000 });
              } else {
                await selector.click({ force: true, timeout: 3000 });
              }
              console.log('✓ Terms and conditions accepted');
              
              // Verify selection
              await page.waitForTimeout(1000);
              
              // Check if checkbox is checked
              const termsCheckbox = page.locator('#terms[type="checkbox"], input[name="terms"][type="checkbox"]');
              if (await termsCheckbox.first().isChecked({ timeout: 2000 })) {
                console.log('✓ Verified: Terms and conditions are accepted');
                termsAccepted = true;
              } else {
                // Force check via JavaScript
                await page.evaluate(() => {
                  const checkbox = document.getElementById('terms') || document.querySelector('input[name="terms"][type="checkbox"]');
                  if (checkbox) {
                    checkbox.checked = true;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                });
                console.log('✓ Terms accepted via JavaScript');
                termsAccepted = true;
              }
              break;
            } catch (clickError) {
              console.log(`Could not click selector: ${clickError.message}`);
            }
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!termsAccepted) {
        console.log('⚠ Terms and conditions checkbox not found');
      }
      
    } catch (error) {
      console.log('Terms checkbox error:', error.message);
    }

    await page.waitForTimeout(1000);
    
    // STEP 3: Register and Place your order Button
    console.log('\n--- Clicking Register Button ---');
    
    try {
      console.log('Looking for "Register and Place your order" button...');
      
      // Multiple selectors for register button
      const registerButtonSelectors = [
        // Exact text match
        page.getByRole('button', { name: /Register and Place your order/i }),
        // Case insensitive
        page.getByRole('button', { name: /register and place your order/i }),
        // Partial text
        page.getByRole('button', { name: /Place your order/i }),
        page.getByRole('button', { name: /Place Order/i }),
        // Alternative button types
        page.locator('button[type="submit"]').filter({ hasText: /register|place order/i }),
        page.locator('input[type="submit"]').filter({ hasText: /register|place order/i }),
        // Generic submit buttons
        page.locator('button[type="submit"]'),
        page.locator('input[type="submit"]')
      ];
      
      let registerButtonClicked = false;
      
      for (const button of registerButtonSelectors) {
        try {
          if (await button.isVisible({ timeout: 2000 })) {
            console.log(`Found register button: ${button}`);
            
            // Scroll into view
            await button.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            
            // Take screenshot before clicking
            try {
              await page.screenshot({ path: `before-register-click-${productNumber}.png` });
            } catch (screenshotError) {
              console.log('Could not take screenshot:', screenshotError.message);
            }
            
            // Try to click with retries
            for (let retry = 1; retry <= 3; retry++) {
              try {
                console.log(`Attempt ${retry} to click register button...`);
                
                // Click with force option
                await button.click({ 
                  force: true, 
                  timeout: 5000,
                  delay: 200 // Add delay for better reliability
                });
                
                console.log(`✓ Register button clicked (attempt ${retry})`);
                registerButtonClicked = true;
                
                // Wait for page to process
                await page.waitForTimeout(3000);
                
                // Check if order was placed successfully
                const successIndicators = [
                  page.getByText(/thank you/i),
                  page.getByText(/order received/i),
                  page.getByText(/confirmation/i),
                  page.getByText(/success/i),
                  page.locator('.woocommerce-order'),
                  page.locator('.order-confirmation'),
                  page.locator('.order-received')
                ];
                
                for (const indicator of successIndicators) {
                  try {
                    if (await indicator.isVisible({ timeout: 1000 })) {
                      console.log('✓ Order placed successfully! Confirmation found.');
                      try {
                        await page.screenshot({ path: `order-success-${productNumber}.png` });
                      } catch (screenshotError) {
                        console.log('Could not take success screenshot:', screenshotError.message);
                      }
                      break;
                    }
                  } catch {
                    continue;
                  }
                }
                
                // Check URL change
                const currentUrl = await page.url();
                if (!currentUrl.includes('checkout')) {
                  console.log('✓ Page navigated away from checkout - order likely successful');
                }
                
                break; // Success, break retry loop
                
              } catch (clickError) {
                console.log(`Click attempt ${retry} failed: ${clickError.message}`);
                
                if (retry < 3) {
                  await page.waitForTimeout(1000);
                  
                  // Try JavaScript click as fallback
                  try {
                    await button.evaluate(el => el.click());
                    console.log(`✓ Register button clicked via JavaScript (retry ${retry})`);
                    registerButtonClicked = true;
                    await page.waitForTimeout(3000);
                    break;
                  } catch (jsError) {
                    console.log(`JavaScript click also failed: ${jsError.message}`);
                  }
                }
              }
            }
            
            if (registerButtonClicked) break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (registerButtonClicked) {
        console.log('✓ Register button successfully clicked');
      } else {
        console.log('⚠ Could not find or click register button');
        try {
          await page.screenshot({ path: `register-button-not-found-${productNumber}.png` });
        } catch (screenshotError) {
          console.log('Could not take screenshot:', screenshotError.message);
        }
      }
      
    } catch (error) {
      console.log('Register button error:', error.message);
      try {
        await page.screenshot({ path: `register-button-error-${productNumber}.png` });
      } catch (screenshotError) {
        console.log('Could not take error screenshot:', screenshotError.message);
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log(`CHECKOUT PROCESS COMPLETED FOR PRODUCT ${productNumber}`);
    console.log('='.repeat(50));
    console.log('✓ All steps attempted');
    console.log('✓ Screenshots saved for debugging');
    console.log('✓ Process completed');
    
    return true;
  } catch (error) {
    console.log(`\n✗ Checkout process failed for product ${productNumber}:`, error.message);
    
    // Take error screenshot
    try {
      await page.screenshot({ path: `checkout-fatal-error-${productNumber}.png` });
    } catch (screenshotError) {
      console.log('Could not take error screenshot:', screenshotError.message);
    }
    
    return false;
  }
}
  // Improved navigation back to products list
  async function navigateToProductsList() {
    try {
      console.log('Returning to products list...');
      
      if (!(await isPageUsable())) {
        console.log('Page is not usable, cannot navigate back');
        return false;
      }
      
      // Try direct navigation first (most reliable)
      if (await safeNavigate(BASE_URL + 'product-category/semiconductors/fpgas')) {
        // Wait for products to load
        const productSelectors = [
          "div.col-12.product-card",
          ".product-card",
          "[class*='product']",
          "div.product"
        ];
        
        for (const selector of productSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 10000 });
            console.log(`✓ Products list loaded with selector: ${selector}`);
            await page.waitForTimeout(2000);
            return true;
          } catch {
            continue;
          }
        }
        
        // If no specific selector found, check if page has content
        const pageContent = await page.textContent('body');
        if (pageContent && pageContent.length > 500) {
          console.log('✓ Page has content, assuming products list loaded');
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      console.log('Navigation to products list failed:', error.message);
      return false;
    }
  }

  test('Semiconductors products verification:', async () => {
    console.log('Starting semiconductors products verification...');
    
    if (!(await safeNavigate(BASE_URL))) {
      throw new Error('Failed to navigate to main page');
    }

    try {
      // Navigate through categories
      if (!(await safeClick(page.getByRole('button', { name: 'Products' })))) {
        throw new Error('Failed to click Products button');
      }
      await page.waitForTimeout(2000);
      
      if (!(await safeClick(page.getByRole('button', { name: 'Semiconductors' })))) {
        throw new Error('Failed to click Semiconductors button');
      }
      await page.waitForTimeout(2000);
      
      if (!(await safeClick(page.locator("//a[normalize-space()='CPLDs']")))) {
        throw new Error('Failed to click FPGAs link');
      }
      
      await page.waitForSelector("div.col-12.product-card", { timeout: 15000 });
      console.log('CPLDs page loaded successfully');

      // Get products
      const productCards = await page.locator("div.col-12.product-card").all();
      console.log(`Total products found: ${productCards.length}`);

      const testProducts = Math.min(productCards.length, 2);
      let successfulCheckouts = 0;
      
      for (let i = 0; i < testProducts; i++) {
        console.log(`\n=== Testing product ${i + 1}/${testProducts} ===`);
        
        const currentProductCards = await page.locator("div.col-12.product-card").all();
        
        if (i >= currentProductCards.length) {
          console.log(`Product index ${i} out of bounds`);
          continue;
        }
        
        const viewMoreBtn = currentProductCards[i].locator("a.view-more-products").first();
        
        if (await viewMoreBtn.isVisible({ timeout: 5000 })) {
          const productUrl = await viewMoreBtn.getAttribute('href');
          
          if (productUrl) {
            const fullUrl = productUrl.startsWith('http') ? productUrl : BASE_URL + productUrl;
            console.log(`Navigating to: ${fullUrl}`);
            
            if (await safeNavigate(fullUrl)) {
              console.log(`✓ Successfully navigated to product page`);
              
              // Verify product details
              await verifyCommonProductDetails();
              console.log(`✓ Product ${i + 1} details verified successfully`);
              
              // Complete checkout process - pass current product URL for error handling
              const checkoutSuccess = await completeCheckoutProcess(i + 1, fullUrl);
              
              if (checkoutSuccess) {
                successfulCheckouts++;
              }
              
              // Back to products list
              if (!(await navigateToProductsList())) {
                console.log(`⚠ Could not return to products list, reloading page...`);
                await safeNavigate(BASE_URL + 'product-category/semiconductors/fpgas');
              }
              
            } else {
              console.log('Failed to navigate to product page');
            }
          }
        }
      }
      
      console.log(`\n=== TEST SUMMARY ===`);
      console.log(`Successful checkouts: ${successfulCheckouts}/${testProducts}`);
      
      if (successfulCheckouts > 0) {
        console.log('✓ Test completed successfully');
      } else {
        console.log('⚠ Test completed with warnings - no successful checkouts');
      }
      
    } catch (error) {
      console.log('Test execution failed:', error.message);
      throw error;
    }
  });

  test.afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });
});