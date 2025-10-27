import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 8080;
let browser = null;
let isLaunching = false;

async function launchBrowser() {
    if (browser || isLaunching) return;
    isLaunching = true;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ],
            timeout: 120000
        });
        console.log('✓ Chrome launched');
    } catch (e) {
        console.error('Chrome launch failed:', e.message);
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

app.get('/health', async (req, res) => {
    if (!browser) await launchBrowser();
    res.status(browser ? 200 : 503).send(browser ? 'Ready' : 'Starting');
});

app.get('/screenshot', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    if (!browser) return res.status(503).json({ error: 'Browser unavailable' });

    let page;
    try {
        page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

        const element = await page.$('.ArborCard');
        if (!element) return res.status(404).json({ error: 'Element not found' });

        const screenshot = await element.screenshot({ type: 'png', omitBackground: true });
        res.set('Content-Type', 'image/png');
        res.send(screenshot);

    } catch (err) {
        console.error('Screenshot failed:', err.message);
        res.status(500).json({ error: 'Screenshot failed' });
    } finally {
        if (page) await page.close().catch(() => { });
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await launchBrowser();
});
