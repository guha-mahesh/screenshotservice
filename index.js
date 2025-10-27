import express from 'express';
import puppeteer from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';

const app = express();
const PORT = process.env.PORT || 8080;
let browserPromise = null;

async function getBrowser() {
    if (browserPromise) return browserPromise;

    console.log('Launching Chrome...');
    browserPromise = (async () => {
        try {
            const executablePath = await chromium.executablePath;
            const browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
                executablePath,
                headless: chromium.headless
            });
            console.log('✓ Chrome ready');
            return browser;
        } catch (err) {
            console.error('Chrome launch failed:', err.message);
            browserPromise = null;
            return null;
        }
    })();

    return browserPromise;
}

app.use((_, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (_.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.get('/health', async (_, res) => {
    const browser = await getBrowser();
    res.status(browser ? 200 : 503).send(browser ? 'Ready' : 'Starting');
});

app.get('/screenshot', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const browser = await getBrowser();
    if (!browser) return res.status(503).json({ error: 'Browser unavailable' });

    let page;
    try {
        page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

        const element = await page.$('.ArborCard');
        if (!element) return res.status(404).json({ error: 'Element not found' });

        const png = await element.screenshot({ type: 'png', omitBackground: true });
        res.type('png').send(png);
    } catch (err) {
        console.error('Screenshot failed:', err.message);
        res.status(500).json({ error: 'Screenshot failed' });
    } finally {
        if (page) await page.close().catch(() => { });
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await getBrowser();
});
