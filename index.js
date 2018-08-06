const puppeteer = require('puppeteer');

async function run() {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 500
    });
    const page = await browser.newPage();
    page.on('response', response => {
        if(response.url() === 'https://www.baidu.com/'){
            response.text()
                .then(function (textBody) {
                    console.log(textBody);
                })
                .catch(
                    ()=>{ console.log("目标请求出错："+response.url()) }
                )
        }
    });

    await page.goto('https://www.baidu.com/');
    // await page.screenshot({ path: 'screenshots/r18.png' });

    // browser.close();
}

run();
