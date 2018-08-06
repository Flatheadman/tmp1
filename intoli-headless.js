// We'll use Puppeteer is our browser automation framework.
const puppeteer = require('puppeteer');

// This is where we'll put the code to get around the tests.
const preparePageForTests = async (page) => {
    // Pass the User-Agent Test.
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36';
    await page.setUserAgent(userAgent);

    // Pass the Webdriver Test.
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });
    });

    // Pass the Chrome Test.
    await page.evaluateOnNewDocument(() => {
        // We can mock this in as much depth as we need for the test.
        window.chrome = {
            runtime: {},
            // etc.
        };
    });

    // Pass the Permissions Test.
    await page.evaluateOnNewDocument(() => {
        const originalQuery = window.navigator.permissions.query;
        return window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
    });

    // Pass the Plugins Length Test.
    await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'plugins', {
            // This just needs to have `length > 0` for the current test,
            // but we could mock the plugins too if necessary.
            get: () => [1, 2, 3, 4, 5],
        });
    });

    // Pass the Languages Test.
    await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en', 'zh-CN', 'zh'],
        });
    });
}

(async () => {
    // Launch the browser in headless mode and set up a page.
    const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768});

    // Prepare for the tests (not yet implemented).
    await preparePageForTests(page);

    // Navigate to the page that will perform the tests.
    const testUrl = 'https://github.com/'
    // const testUrl = 'https://intoli.com/blog/' +
    //     'not-possible-to-block-chrome-headless/chrome-headless-test.html';
    await page.goto(testUrl);

    // Save a screenshot of the results.
    await page.screenshot({path: 'github.png'});

    // Clean up.
    await browser.close()
})();