'use strict';
import express from 'express';
import sharp from 'sharp';
import helmet from 'helmet';
import morgan from 'morgan';
import fetch from 'node-fetch';

const router = express.Router();
const app = express()
const port = process.env.PORT || 9090

router.get('/proxy', async function (req, res, next) {
    const url = decodeURI(req.query.url);
    if (!url) {
        return res.sendStatus(500)
    }
    if (!url.startsWith("http")) {
        return res.sendStatus(500)
    }
    let fetchResponse = await fetch(url, {
        timeout: 5000,
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
            "Accept-Language": "en-us",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            'Referer': 'https://www.google.com/',
            'DNT': '1',
            'upgrade-insecure-requests': '1',
        },
        compress: true,
    });
    if (!fetchResponse.ok) {
        res.status(500).send("Failed to do fetch" + fetchResponse.body)
        return
    }
    for (const header_keys of fetchResponse.headers.keys()) {
        res.header(header_keys, fetchResponse.headers.get(header_keys))
    }
    res.removeHeader('content-encoding')

    fetchResponse.body.on('error', (e) => {
        res.status(500).send("Failed to do fetch")
        console.log(e)
        return
    }).pipe(res);

});


router.get('/img', async function (req, res, next) {
    const url = decodeURI(req.query.url);
    if (!url) {
        return res.sendStatus(500)
    }
    if (!url.startsWith("http")) {
        return res.sendStatus(500)
    }

    try {
        let width = parseFloat(req.query.w, 10);
        let height = parseFloat(req.query.h, 10);
        height = isNaN(height) ? null : height;
        width = isNaN(width) ? null : width;
        if (width === null && height === null) {
            width = 320
        }
        if (width && width > 1600) {
            width = 320
        }
        if (height && height > 1600) {
            height = 320
        }
        let eurl = encodeURI(url)
        let fetchResponse = await fetch(eurl, {
            timeout: 5000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15",
                "Accept-Language": "en-us",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
            compress: true,
        });
        if (!fetchResponse.ok) {
            let imgProxyurl = "https://images.weserv.nl/?url=" + encodeURI(url)
            fetchResponse = await fetch(imgProxyurl, {
                timeout: 5000,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15",
                },
                compress: false
            });
            if (!fetchResponse.ok) {
                res.status(500).send("Failed to do fetch" + fetchResponse.body)
                return
            }
        }
        const transform = sharp().resize(width, height, {
            withoutEnlargement: false,
            kernel: sharp.kernel.lanczos3
        }).jpeg()
        res.type('image/jpeg');
        res.header('Cache-Control', 'public, max-age=604800, immutable')
        fetchResponse.body.pipe(transform).on('error', (e) => {
            console.log(e)
        }).pipe(res);
    } catch (err) {
        console.log(err)
        res.status(500).send("Failed to do transform")
        return
    }
});

router.get('/favicon', async function (req, res, next) {
    if (!req.query.domain) {
        return res.sendStatus(404)
    }
    const domain = decodeURI(req.query.domain);
    if (!domain) {
        console.log("failed no domain")
        return res.sendStatus(500)
    }
    let fetchURL = "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&size=12&fallback_opts=TYPE,SIZE,URL&url=http://" + domain
    let response = await fetch(fetchURL);
    if (response.ok) {
        res.setHeader('content-type', response.headers.get('content-type'))
        res.header('Cache-Control', 'public, max-age=604800, immutable')
        res.header('Cross-Origin-Resource-Policy', 'same-site')
        res.header('Access-Control-Allow-Origin', '*')
        let buffer = await response.buffer()
        res.send(buffer)
        return
    }
    res.header('Cache-Control', 'public, max-age=604800, immutable')
    res.header('Cross-Origin-Resource-Policy', 'same-site')
    res.header('Access-Control-Allow-Origin', '*')
    return res.sendStatus(500)
});

app.use(helmet())
app.use(morgan('combined'))
app.use(router)

app.listen(port, () => console.log(`app listening on port ${port}!`))
