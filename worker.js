const puppeteer = require('puppeteer');


downloadFiles((i) => `http://localhost:4500/getAllData`, 1);

async function downloadFiles(url, count) {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    for (let i = 0; i < count; i++) {
        const pageUrl = await url(i);
        try {
            await page.goto(pageUrl);
            await page.pdf({
                path: `pdf-${i}.pdf`,
                format: 'A4',
                printBackground: true
            });
        } catch (e) {
            console.log(`Error loading ${pageUrl}`);
        }
    }
    await browser.close();
}
