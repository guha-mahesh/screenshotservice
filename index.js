import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 8080;
let persistentBrowser = null;
let isBrowserReady = false;

async function initializeBrowser() {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--no-zygote'
            ]
        });
        persistentBrowser = browser;
        isBrowserReady = true;
        console.log('Persistent browser ready.');
    } catch (error) {
        console.error('Failed to launch browser:', error);

        throw error;
    }
}

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});


app.get('/health', (req, res) => {

    if (isBrowserReady) {
        res.status(200).send('OK - Browser Ready');
    } else {

        res.status(503).send('Not Ready - Browser Initializing');
    }
});

app.get('/screenshot', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL parameter required' });

    if (!isBrowserReady || !persistentBrowser) {

        return res.status(503).json({ error: 'Browser service initializing. Try again shortly.' });
    }

    let page;
    try {
        page = await persistentBrowser.newPage();

        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 2
        });

        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        await page.waitForSelector('.ArborCard', { timeout: 10000 });

        await page.evaluate(() => {
            return Promise.all(
                Array.from(document.images)
                    .filter(img => !img.complete)
                    .map(img => new Promise(resolve => {
                        img.onload = img.onerror = resolve;
                    }))
            );
        });

        await page.waitForFunction(() => {
            const iframes = document.querySelectorAll('iframe');
            return Array.from(iframes).every(iframe => {
                try {
                    return iframe.contentDocument?.readyState === 'complete';
                } catch {
                    return true;
                }
            });
        }, { timeout: 20000 }).catch(() => console.log('Iframe timeout, continuing...'));

        await new Promise(resolve => setTimeout(resolve, 2000));

        const element = await page.$('.ArborCard');
        const screenshot = await element.screenshot({
            type: 'png',
            omitBackground: true
        });

        res.set('Content-Type', 'image/png');
        res.send(screenshot);

    } catch (error) {
        console.error('Screenshot error:', error);
        res.status(500).json({ error: 'Failed to generate screenshot' });
    } finally {
        if (page) await page.close();
    }
});


app.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT}`);

    initializeBrowser();
});
