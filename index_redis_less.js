'use strict';
const express = require('express');
const router = express.Router();
const app = express()
const port = process.env.PORT || 8080
const helmet = require('helmet');
const fetch = require('node-fetch');
const sharp = require('sharp');

const {
    Pool
} = require('pg');
const morgan = require('morgan')
const fs = require('fs')

const pg = {
    user: 'news',
    host: 'colo.iavian.net',
    database: 'news',
    name: 'news',
    password: '@xwDf!2d9Jy_bEN'
}

const pool = new Pool({
    user: pg.user,
    host: pg.host,
    database: pg.database,
    password: pg.password,
    port: 5432,
    connectionTimeoutMillis: 10000,
    application_name: pg.name
})

router.get('/img', async function (req, res, next) {
    const url = decodeURI(req.query.url);
    if (!url) {
        return res.sendStatus(500)
    }
    if (!url.startsWith("http")) {
        return res.sendStatus(500)
    }

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
    try {
        let eurl = encodeURI(url)
        let fetchResponse = await fetch(eurl, {
            timeout: 5000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15",
                compress: true,
            }
        });
        if (!fetchResponse.ok) {
            let imgProxyurl = "https://images.weserv.nl/?url=" + encodeURI(url)
            fetchResponse = await fetch(imgProxyurl, {
                timeout: 5000,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15",
                    compress: false,
                }
            });
            if (!fetchResponse.ok) {
                res.status(500).send("Failed to do fetch" + fetchResponse.status)
                return
            }
        }
        
        const transform = sharp().resize(width, height, {
            withoutEnlargement: true,
            kernel: sharp.kernel.lanczos3
        }).jpeg()
        await fetchResponse.body.pipe(transform).on('error', (e) => {
            console.log(e)
        }).pipe(res);
        res.type('image/jpeg');
        res.header('Cache-Control', 'public, max-age=604800, immutable')
        return
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
    let fetchURL = "https://www.google.com/s2/favicons?sz=8&domain=" + domain
    let response = await fetch(fetchURL);
    if (response.ok) {
        res.set('content-type', response.headers.get('content-type'))
        res.header('Cache-Control', 'public, max-age=604800, immutable')
        let buffer = await response.buffer()
        res.send(buffer)
        return
    } else {
        let response = await fetch('https://favicongrabber.com/api/grab/' + domain)
        if (response.ok) {
            let json = await response.json();
            if (json.icons) {
                let icon = json.icons.shift();
                let responseIcon = await fetch(icon.src);
                try {
                    if (responseIcon.ok) {
                        const transform = sharp().resize(16, 16, {
                            withoutEnlargement: true,
                            kernel: sharp.kernel.lanczos3
                        }).jpeg()
                        await responseIcon.body.pipe(transform).on('error', (e) => {
                            console.log(e)
                        }).pipe(res);
                        res.type('image/jpeg');
                        res.header('Cache-Control', 'public, max-age=604800, immutable')
                        return
                    }
                } catch (err) {
                    console.log(domain)
                    console.log(err)
                }
            }
        }
    }
    return res.sendStatus(500)
});

router.get('/feed', async function (req, res, next) {
    let filterIds = [20545835, 10774652, 457984599, 28614262, 19211550, 1367531, 14669951, 8007074, 1917731, 18856867, 39308549]
    const client = await pool.connect()
    let feeds = []
    try {
        let result = await client.query("SELECT row_number() OVER (PARTITION BY true) as id, url, img, title, date_part('epoch', ts)::int as ts, COALESCE(imgdimension, 1) as dim, source FROM feedview WHERE source = ANY($1::INT[]) ORDER BY ts DESC", [filterIds])
        feeds = result.rows
    } catch (err) {
        console.log(err)
    } finally {
        client.release();
    }
    let uniqueUrls = []
    let uniqueFeeds = feeds.reduce(function (acc, feed) {
        if (uniqueUrls.includes(feed.url)) {
            return acc;
        }
        if (!feed.img) {
            return acc;
        }
        uniqueUrls.push(feed.url)
        acc.push(feed)
        return acc;
    }, []);
    let result = {
        feed: uniqueFeeds,
        h: 'https://drudgenow.com/article/'
    }
    res.charset = "utf-8";
    res.header('Cache-Control', 'public, max-age=300, immutable')
    return res.status(200).json(result);
});

app.use(helmet())
app.use(morgan('combined'))
app.use(router)

app.listen(port, () => console.log(`app listening on port ${port}!`))
