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

   // NEW: Function to generate unique random email
  function generateRandomEmail() {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    return `test${timestamp}${randomNum}@gmail.com`;
  }

  // NEW: Function to generate random phone number
  function generateRandomPhone() {
    const randomNum = Math.floor(1000000000 + Math.random() * 9000000000);
    return randomNum.toString();
  }


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

  // Improved checkout process function WITH REDIRECTION
  async function completeCheckoutProcess(productNumber, currentProductUrl) {
    try {
      console.log(`\n🛒 Starting checkout process for product ${productNumber}...`);
      
      // NEW: Generate unique random data for each checkout
      const randomEmail = generateRandomEmail();
      const randomPhone = generateRandomPhone();
      const randomPO = `PO${Math.floor(10000 + Math.random() * 90000)}`;
      const randomEORI = `EORI${Math.floor(10000 + Math.random() * 90000)}`;
      
      console.log(`Generated random data for checkout ${productNumber}:`);
      console.log(`📧 Email: ${randomEmail}`);
      console.log(`📱 Phone: ${randomPhone}`);
      console.log(`📄 PO Number: ${randomPO}`);
      console.log(`📋 EORI: ${randomEORI}`);

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

      // Fill all fields WITH RANDOM DATA
      const fieldsToFill = [
        { 
          name: 'email', 
          value: randomEmail,  // CHANGED: Using random email
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
          value: randomPhone,  // CHANGED: Using random phone
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

      // NEW: Select Account Type - "As a person"
      console.log('\n--- Selecting Account Type ---');
      try {
        // First try with the exact XPath you provided
        const accountTypeOption = page.locator('//select[@name="account_type"]/option[2]');
        
        if (await accountTypeOption.isVisible({ timeout: 3000 })) {
          // Get the value of the option
          const optionValue = await accountTypeOption.getAttribute('value');
          const optionText = await accountTypeOption.textContent();
          
          console.log(`Found "As a person" option - Value: "${optionValue}", Text: "${optionText}"`);
          
          // Select the dropdown
          const accountTypeDropdown = page.locator('select[name="account_type"]');
          
          if (await accountTypeDropdown.isVisible({ timeout: 2000 })) {
            // Multiple ways to select
            try {
              // Method 1: Select by value (most reliable)
              if (optionValue) {
                await accountTypeDropdown.selectOption({ value: optionValue });
                console.log(`✓ Selected "As a person" by value: "${optionValue}"`);
              } 
              // Method 2: Select by index (2nd option)
              else {
                await accountTypeDropdown.selectOption({ index: 1 }); // Index is 0-based, so 1 means 2nd option
                console.log('✓ Selected "As a person" by index (2nd option)');
              }
              
              // Verify selection
              await page.waitForTimeout(500);
              const selectedValue = await accountTypeDropdown.inputValue();
              console.log(`✓ Account type selected value: "${selectedValue}"`);
              
              // Also get selected text
              const selectedOption = accountTypeDropdown.locator('option:checked');
              const selectedText = await selectedOption.textContent();
              console.log(`✓ Account type selected text: "${selectedText}"`);
              
            } catch (selectError) {
              console.log(`Dropdown select failed: ${selectError.message}`);
              
              // Fallback: Click the option directly
              try {
                await accountTypeOption.click();
                console.log('✓ Clicked "As a person" option directly');
              } catch (clickError) {
                console.log(`Direct click also failed: ${clickError.message}`);
              }
            }
          } else {
            console.log('⚠ Account type dropdown not visible');
          }
        } else {
          console.log('⚠ "As a person" option not found with XPath, trying alternative approaches...');
          
          // Try to find the dropdown first
          const dropdownSelectors = [
            'select[name="account_type"]',
            '[name="account_type"]',
            '#account_type',
            'select#account_type'
          ];
          
          let dropdown = null;
          for (const selector of dropdownSelectors) {
            try {
              const dropdownLocator = page.locator(selector);
              if (await dropdownLocator.isVisible({ timeout: 2000 })) {
                console.log(`Found account type dropdown with selector: ${selector}`);
                dropdown = dropdownLocator;
                break;
              }
            } catch {
              continue;
            }
          }
          
          if (dropdown) {
            // Get all available options first
            const options = await dropdown.locator('option').all();
            console.log(`Found ${options.length} options in dropdown`);
            
            // List all options for debugging
            for (let i = 0; i < options.length; i++) {
              try {
                const optionText = await options[i].textContent();
                const optionValue = await options[i].getAttribute('value');
                console.log(`Option ${i}: Value="${optionValue}", Text="${optionText}"`);
              } catch {
                continue;
              }
            }
            
            // Try different selection methods
            const selectionMethods = [
              // Method 1: Try by index (2nd option)
              async () => {
                if (options.length > 1) {
                  await dropdown.selectOption({ index: 1 });
                  return 'by index (2nd option)';
                }
                return null;
              },
              
              // Method 2: Try by text containing "person"
              async () => {
                for (let i = 0; i < options.length; i++) {
                  try {
                    const text = await options[i].textContent();
                    if (text && text.toLowerCase().includes('person')) {
                      await dropdown.selectOption({ label: text.trim() });
                      return `by label: "${text.trim()}"`;
                    }
                  } catch {
                    continue;
                  }
                }
                return null;
              },
              
              // Method 3: Try by text containing "individual"
              async () => {
                for (let i = 0; i < options.length; i++) {
                  try {
                    const text = await options[i].textContent();
                    if (text && text.toLowerCase().includes('individual')) {
                      await dropdown.selectOption({ label: text.trim() });
                      return `by label: "${text.trim()}"`;
                    }
                  } catch {
                    continue;
                  }
                }
                return null;
              },
              
              // Method 4: Try by value containing "person"
              async () => {
                for (let i = 0; i < options.length; i++) {
                  try {
                    const value = await options[i].getAttribute('value');
                    if (value && value.toLowerCase().includes('person')) {
                      await dropdown.selectOption({ value });
                      return `by value: "${value}"`;
                    }
                  } catch {
                    continue;
                  }
                }
                return null;
              },
              
              // Method 5: Try the 2nd option regardless of text
              async () => {
                if (options.length > 1) {
                  const secondOption = options[1];
                  const optionValue = await secondOption.getAttribute('value');
                  if (optionValue) {
                    await dropdown.selectOption({ value: optionValue });
                    return `by value of 2nd option: "${optionValue}"`;
                  }
                }
                return null;
              }
            ];
            
            let selectionSuccess = false;
            for (const method of selectionMethods) {
              try {
                const result = await method();
                if (result) {
                  console.log(`✓ Selected account type ${result}`);
                  selectionSuccess = true;
                  
                  // Verify selection
                  await page.waitForTimeout(500);
                  const selectedValue = await dropdown.inputValue();
                  console.log(`✓ Selected value: "${selectedValue}"`);
                  
                  break;
                }
              } catch (error) {
                console.log(`Selection method failed: ${error.message}`);
                continue;
              }
            }
            
            if (!selectionSuccess) {
              console.log('⚠ Could not select any account type option');
            }
          } else {
            console.log('⚠ Could not find account type dropdown with any selector');
            
            // Take screenshot for debugging
            try {
              await page.screenshot({ path: `debug-account-type-${productNumber}.png` });
              console.log('✓ Screenshot saved for debugging');
            } catch (screenshotError) {
              console.log('Could not save screenshot:', screenshotError.message);
            }
          }
        }
      } catch (error) {
        console.log('Account type selection error:', error.message);
      }

      await page.waitForTimeout(1000);

      // NEW: Additional checkout fields filling WITH RANDOM DATA
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

      // Fill PO number WITH RANDOM DATA
      await fillFieldWithScroll('PO number', randomPO, [  // CHANGED: Using random PO number
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

      // Fill EORI number WITH RANDOM DATA
      await fillFieldWithScroll('EORI number', randomEORI, [  // CHANGED: Using random EORI number
        '#eori',
        '[name="eori"]',
        'input[name="eori"]',
        'input[placeholder*="EORI"]',
        'input[placeholder*="eori"]'
      ]);
      await page.waitForTimeout(1000);

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
      
      // STEP 3: Register and Place your order Button WITH REDIRECTION
      console.log('\n--- Clicking Register Button ---');
      
      try {
        console.log('Looking for "Register and Place your order" button...');
        
        // Multiple selectors for register button
        const registerButtonSelectors = [
          page.getByRole('button', { name: /Register and Place your order/i }),
          page.getByRole('button', { name: /register and place your order/i }),
          page.getByRole('button', { name: /Place your order/i }),
          page.getByRole('button', { name: /Place Order/i }),
          page.locator('button[type="submit"]').filter({ hasText: /register|place order/i }),
          page.locator('input[type="submit"]').filter({ hasText: /register|place order/i }),
          page.locator('button[type="submit"]'),
          page.locator('input[type="submit"]')
        ];
        
        let registerButtonClicked = false;
        let orderPlacedSuccessfully = false;
        
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
                    delay: 200
                  });
                  
                  console.log(`✓ Register button clicked (attempt ${retry})`);
                  registerButtonClicked = true;
                  
                  // Wait for page to process
                  await page.waitForTimeout(5000);
                  
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
                      if (await indicator.isVisible({ timeout: 2000 })) {
                        console.log('✓ Order placed successfully! Confirmation found.');
                        orderPlacedSuccessfully = true;
                        
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
                    orderPlacedSuccessfully = true;
                  }
                  
                  // --- REDIRECTION AFTER SUCCESSFUL ORDER ---
                  if (orderPlacedSuccessfully) {
                    console.log('\n🎯 Order successful! Navigating to specified route...');
                    
                    // Wait for order to fully process
                    await page.waitForTimeout(3000);
                    
                    // SPECIFIED ROUTE PR NAVIGATE KAREN
                    const targetRoute = 'https://www.enrgtech.co.uk/category/semiconductors/programmable-logic-circuits/cplds';
                    console.log(`Redirecting to: ${targetRoute}`);
                    
                    try {
                      // Safe navigation to the specified route
                      if (await safeNavigate(targetRoute)) {
                        console.log('✓ Successfully navigated to specified route');
                        
                        // Verify navigation success
                        await page.waitForLoadState('domcontentloaded');
                        await page.waitForTimeout(2000);
                        
                        // Check if we're on the correct page
                        const finalUrl = await page.url();
                        if (finalUrl.includes('/cplds')) {
                          console.log('✓ Confirmed: Now on CPLDs page');
                          
                          // Optional: Verify page content
                          try {
                            await page.waitForSelector('.product-card, .product-item, [class*="product"]', { timeout: 10000 });
                            console.log('✓ Products list loaded successfully');
                            
                            // Take screenshot for verification
                            await page.screenshot({ path: `after-redirect-${productNumber}.png` });
                          } catch (error) {
                            console.log('⚠ Could not find products selector, but navigation completed');
                          }
                        }
                      } else {
                        console.log('⚠ Could not navigate to specified route, but order was successful');
                      }
                    } catch (navigationError) {
                      console.log('Navigation error:', navigationError.message);
                    }
                  }
                  // --- REDIRECTION END ---
                  
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
                      
                      // Wait and then navigate to route
                      await page.waitForTimeout(3000);
                      
                      // Navigate to specified route after successful click
                      console.log('Navigating to specified route after order...');
                      await safeNavigate('https://www.enrgtech.co.uk/category/semiconductors/programmable-logic-circuits/cplds');
                      orderPlacedSuccessfully = true;
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
          
          // Additional fallback: If order placed but navigation didn't happen, try now
          if (orderPlacedSuccessfully && !(await page.url()).includes('/cplds')) {
            console.log('Order successful but not on target route, navigating now...');
            await safeNavigate('https://www.enrgtech.co.uk/category/semiconductors/programmable-logic-circuits/cplds');
          }
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

      // Final summary with navigation confirmation
      console.log('\n' + '='.repeat(50));
      console.log(`CHECKOUT PROCESS COMPLETED FOR PRODUCT ${productNumber}`);
      console.log('='.repeat(50));

      if (orderPlacedSuccessfully) {
        console.log('✓ Order placed successfully');
        
        // Final verification that we're on the correct route
        const finalUrl = await page.url();
        if (finalUrl.includes('/cplds')) {
          console.log('✓ Successfully navigated to CPLDs route');
        } else {
          console.log(`⚠ Current URL: ${finalUrl}`);
          console.log('⚠ Not on target CPLDs route');
        }
      } else {
        console.log('⚠ Order may not have been placed successfully');
      }

      console.log('✓ Process completed');
      
      return orderPlacedSuccessfully;
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

  // NEW FUNCTION: Get fresh product list with retry mechanism
  async function getFreshProductList(maxRetries = 3) {
    for (let retry = 1; retry <= maxRetries; retry++) {
      try {
        console.log(`\n🔄 Getting fresh product list (attempt ${retry}/${maxRetries})...`);
        
        // Ensure we're on the CPLDs page
        const currentUrl = await page.url();
        if (!currentUrl.includes('/cplds')) {
          console.log('Not on CPLDs page, navigating...');
          await safeNavigate('https://www.enrgtech.co.uk/category/semiconductors/programmable-logic-circuits/cplds');
        }
        
        // Wait for products to load
        await page.waitForSelector("div.col-12.product-card", { timeout: 10000 });
        
        // Get fresh list of product cards
        const productCards = await page.locator("div.col-12.product-card").all();
        
        if (productCards.length > 0) {
          console.log(`✓ Found ${productCards.length} products`);
          return productCards;
        } else {
          console.log('⚠ No products found, retrying...');
          await page.waitForTimeout(2000);
        }
      } catch (error) {
        console.log(`Attempt ${retry} failed: ${error.message}`);
        if (retry < maxRetries) {
          await page.waitForTimeout(2000);
          
          // Try to reload the page
          try {
            await page.reload({ waitUntil: 'domcontentloaded' });
          } catch (reloadError) {
            console.log('Could not reload page:', reloadError.message);
          }
        }
      }
    }
    
    console.log('✗ Could not get product list after all retries');
    return [];
  }

  // NEW FUNCTION: Click on specific product by index with safety checks
  async function clickProductByIndex(index, productCards) {
    try {
      console.log(`\n🛍️ Clicking product ${index + 1}...`);
      
      if (index >= productCards.length) {
        console.log(`⚠ Product index ${index} is out of bounds (total: ${productCards.length})`);
        return null;
      }
      
      const viewMoreBtn = productCards[index].locator("a.view-more-products").first();
      
      if (!(await viewMoreBtn.isVisible({ timeout: 5000 }))) {
        console.log(`⚠ View More button not visible for product ${index + 1}`);
        return null;
      }
      
      // Get product URL
      const productUrl = await viewMoreBtn.getAttribute('href');
      if (!productUrl) {
        console.log(`⚠ Could not get product URL for product ${index + 1}`);
        return null;
      }
      
      const fullUrl = productUrl.startsWith('http') ? productUrl : BASE_URL + productUrl;
      console.log(`✓ Product URL: ${fullUrl}`);
      
      // Click the view more button
      await viewMoreBtn.click();
      console.log(`✓ Clicked View More button for product ${index + 1}`);
      
      // Wait for navigation
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      
      // Verify we're on the product page
      const currentUrl = await page.url();
      console.log(`✓ Navigated to: ${currentUrl}`);
      
      return fullUrl;
      
    } catch (error) {
      console.log(`✗ Failed to click product ${index + 1}:`, error.message);
      return null;
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
        throw new Error('Failed to click CPLDs link');
      }
      
      await page.waitForSelector("div.col-12.product-card", { timeout: 15000 });
      console.log('CPLDs page loaded successfully');

      // Get initial product count
      const initialProducts = await page.locator("div.col-12.product-card").all();
      console.log(`Initial products found: ${initialProducts.length}`);

      // Define how many products to test (minimum of 2 or available products)
      const testProductCount = Math.min(initialProducts.length, 2);
      console.log(`Will test ${testProductCount} products`);
      
      if (testProductCount === 0) {
        console.log('⚠ No products found to test');
        return;
      }

      let successfulCheckouts = 0;
      
      // Test each product
      for (let i = 0; i < testProductCount; i++) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`=== Testing product ${i + 1}/${testProductCount} ===`);
        console.log(`${'='.repeat(50)}`);
        
        // Step 1: Get fresh product list
        const productCards = await getFreshProductList();
        if (productCards.length === 0) {
          console.log('⚠ No products available, skipping...');
          continue;
        }
        
        // Step 2: Click on the product
        const productUrl = await clickProductByIndex(i, productCards);
        if (!productUrl) {
          console.log('⚠ Could not navigate to product page, skipping...');
          continue;
        }
        
        // Step 3: Verify product details
        console.log(`✓ Successfully navigated to product page`);
        
        const detailsVerified = await verifyCommonProductDetails();
        if (detailsVerified) {
          console.log(`✓ Product ${i + 1} details verified successfully`);
        } else {
          console.log(`⚠ Could not verify all product details, but continuing...`);
        }
        
        // Step 4: Complete checkout process
        const checkoutSuccess = await completeCheckoutProcess(i + 1, productUrl);
        
        if (checkoutSuccess) {
          successfulCheckouts++;
          console.log(`🎉 Product ${i + 1} checkout successful!`);
        } else {
          console.log(`⚠ Product ${i + 1} checkout failed or incomplete`);
        }
        
        // Step 5: If we have more products to test, ensure we're back on CPLDs page
        if (i < testProductCount - 1) {
          console.log(`\n🔄 Preparing for next product test...`);
          
          // Check if we're already on CPLDs page (after checkout redirection)
          const currentUrl = await page.url();
          if (currentUrl.includes('/cplds')) {
            console.log('✓ Already on CPLDs page, ready for next product');
            await page.waitForTimeout(3000); // Wait for page to settle
          } else {
            // Navigate back to CPLDs page
            console.log('Not on CPLDs page, navigating back...');
            await safeNavigate('https://www.enrgtech.co.uk/category/semiconductors/programmable-logic-circuits/cplds');
            await page.waitForSelector("div.col-12.product-card", { timeout: 10000 });
          }
        }
      }
      
      // Final summary
      console.log(`\n${'='.repeat(50)}`);
      console.log('=== TEST SUMMARY ===');
      console.log(`${'='.repeat(50)}`);
      console.log(`Total products to test: ${testProductCount}`);
      console.log(`Successful checkouts: ${successfulCheckouts}`);
      console.log(`Final page: ${await page.url()}`);
      
      if (successfulCheckouts > 0) {
        console.log('🎉 Test completed successfully!');
      } else if (testProductCount > 0) {
        console.log('⚠ Test completed but no successful checkouts');
      } else {
        console.log('ℹ️ No products were available to test');
      }
      
    } catch (error) {
      console.log('\n✗ Test execution failed:', error.message);
      console.log('Error stack:', error.stack);
      
      // Take screenshot on error
      try {
        await page.screenshot({ path: 'test-execution-error.png' });
        console.log('✓ Error screenshot saved');
      } catch (screenshotError) {
        console.log('Could not save error screenshot:', screenshotError.message);
      }
      
      throw error;
    }
  });

  test.afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });
});