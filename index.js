import express from 'express';
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';

const app = express();
const PORT = process.env.PORT || 8080;
let browser = null;
let isLaunching = false;

async function launchBrowser() {
    if (isLaunching) return;
    if (browser) return;

    isLaunching = true;

    try {
        console.log('Launching Chrome...');

        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: '/usr/bin/google-chrome-stable',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-dbus'
            ],
            timeout: 60000
        });

        console.log('✓ Chrome ready');

    } catch (error) {
        console.error('Chrome launch failed:', error.message);
        browser = null;
    } finally {
        isLaunching = false;
    }
}


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});


app.get('/health', (req, res) => {
    res.status(browser ? 200 : 503).send(browser ? 'Ready' : 'Starting');
});


app.get('/screenshot', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });


    if (!browser) {
        await launchBrowser();
        if (!browser) {
            return res.status(503).json({ error: 'Browser unavailable' });
        }
    }

    let page;
    try {
        page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        await page.waitForSelector('.ArborCard', { timeout: 10000 });


        await page.evaluate(() =>
            Promise.all(
                Array.from(document.images)
                    .filter(img => !img.complete)
                    .map(img => new Promise(r => { img.onload = img.onerror = r; }))
            )
        );

        await new Promise(r => setTimeout(r, 2000));

        const element = await page.$('.ArborCard');
        const screenshot = await element.screenshot({ type: 'png', omitBackground: true });

        res.set('Content-Type', 'image/png');
        res.send(screenshot);

    } catch (error) {
        console.error('Screenshot failed:', error.message);
        res.status(500).json({ error: 'Screenshot failed' });
    } finally {
        if (page) await page.close().catch(() => { });
    }
});


app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await launchBrowser();
});