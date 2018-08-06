// We'll use Puppeteer is our browser automation framework.

const puppeteer = require('puppeteer');
const fs= require("fs");

const TARGET_WEBSITE = 'https://www.1688.com/';
const KEY_WORD = '连体泳衣';
const TOTAL_PAGE = 5;

const SEARCH_SELECTOR = '#alisearch-keywords';
const BUTTON_SELECTOR = '#alisearch-submit';
const POPUP_SELECTOR = '#j-identity > div > div.identity-action > div.identity-cancel';
const LIST_POPUP_SELECTOR = '#s-module-overlay > div.s-overlay-layer > div > div.s-overlay-widget > div > div.s-overlay-widget-foot > div';
const LAST_ITEM_SELECTOR = '#offer60';
const FIFTH_ITEM_SELECTOR = '#offer5';
const PAGE_JUMP_INPUT_SELECTOR = '#fui_widget_4 > div > span.fui-number > input';
const PAGE_JUMP_BUTTON_SELECTOR = '#fui_widget_4 > div > span.fui-forward > button';
const NEXT_PAGE_SELECTOR = '#fui_widget_4 > span > a.fui-next';

const LIST_AJAX_URL = 'https://s.1688.com/selloffer/rpc_async_render.jsonp?';
const LIST_SEARCH_URL = 'https://s.1688.com/selloffer/offer_search.htm?keywords=';


const TIMEOUT = 5000;
const WAIT_MIN = 3000;
const WAIT_MAX = 5000;


// This is where we'll put the code to get around the tests.
const preparePageForTests = async (page) => {
    // Pass the Webdriver Test.
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });
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
};

(async () => {
    // Launch the browser in headless mode and set up a page.
    const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: false,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768});

    // Prepare for the tests (not yet implemented).
    await preparePageForTests(page);

    page.on('response', response => {
        if((response.url().indexOf(LIST_AJAX_URL) !== -1) ||
            (response.url().indexOf(LIST_SEARCH_URL) !== -1)
        ){
            console.log(response.url());
            response.text()
                .then(function (textBody) {
                    let stream = fs.createWriteStream("./log.txt", {flags:'a'});
                    stream.write(textBody + "\n");
                    console.log("写入成功")
                })
                .catch(
                    ()=>{ console.log("目标请求出错："+response.url()) }
                )
        }
    });

    // Navigate to the page that will perform the tests.
    await page.goto(TARGET_WEBSITE);

    await page.waitForSelector(POPUP_SELECTOR, { timeout: TIMEOUT, visible: true })
        .then(
            async ()=>{
                await page.click(POPUP_SELECTOR);
                console.log('关闭了首页弹窗');
            }
        )
        .catch(
            ()=>console.log('没有弹窗')
        );

    await page.waitForSelector(SEARCH_SELECTOR, { timeout: TIMEOUT, visible: true })
        .then(
            async ()=>{
                await page.click(SEARCH_SELECTOR);
                await page.keyboard.type(KEY_WORD, {delay: 100});
                await page.click(BUTTON_SELECTOR);
                await page.waitForNavigation();
            }
        )
        .catch(
            ()=>console.log('没有搜索框')
        );

    await page.waitForSelector(LIST_POPUP_SELECTOR, { timeout: TIMEOUT, visible: true })
        .then(
            async ()=>{
                await page.click(LIST_POPUP_SELECTOR);
                console.log('关闭了列表页弹窗');
            }
        )
        .catch(
            ()=>console.log('没有列表页弹窗')
        );

    function rnd(n, m){
        var random = Math.floor(Math.random()*(m-n+1)+n);
        return random;
    }

    function delay(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time)
        });
    }

    async function scroll_to_bottom(page) {
        await page.waitForSelector(FIFTH_ITEM_SELECTOR, { timeout: TIMEOUT, visible: true })
            .then(
                ()=>{ console.log('前20个商品加载完毕') }
            )
            .catch(
                ()=>{
                    console.log('前20个商品没有加载完毕');
                }
            );
        await page.evaluate(async () => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForSelector(LAST_ITEM_SELECTOR, { timeout: rnd(WAIT_MIN, WAIT_MAX), visible: true })
            .then(
                ()=>{ console.log('得到最后一个商品') }
            )
            .catch(
                async ()=>{
                    console.log('没有得到最后一个商品');
                    await scroll_to_bottom(page);
                }
            )
    }

    await scroll_to_bottom(page);

    async function next_page(page, page_number){
        await page.waitForSelector(PAGE_JUMP_INPUT_SELECTOR, { timeout: TIMEOUT, visible: true })
            .then(
                async ()=>{
                    await page.click(PAGE_JUMP_INPUT_SELECTOR);
                    await page.keyboard.press('Delete');
                    await page.keyboard.press('Delete');
                    await page.keyboard.press('Delete');
                    await page.keyboard.type(String(page_number), {delay: 100});
                    await page.waitFor(200);
                    await page.click(PAGE_JUMP_BUTTON_SELECTOR);
                    await delay(rnd(WAIT_MIN, WAIT_MAX));   //等待新页面刷新，否则还有上次的残留
                    console.log('跳转到页面：' + page_number +"成功")
                }
            )
            .catch(
                async ()=>{
                    console.log('跳转到页面：' + page_number +"失败")
                }
            )
    }

    for (let i=2; i<=TOTAL_PAGE; i++)
    {
        // await page.waitFor(rnd(WAIT_MIN, WAIT_MAX));
        await delay(rnd(WAIT_MIN, WAIT_MAX));
        await next_page(page, i);
        await scroll_to_bottom(page);
    }

    // await page.click(SEARCH_SELECTOR);
    // await page.keyboard.type(KEY_WORD);
    // await page.click(BUTTON_SELECTOR);
    // await page.waitForNavigation();

    // Clean up.
    // await browser.close()
})();