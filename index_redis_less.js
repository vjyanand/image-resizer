'use strict';
const express = require('express');
const router = express.Router();
const app = express()
const port = process.env.PORT || 8080
const helmet = require('helmet');
const fetch = require('node-fetch');
const sharp = require('sharp');
router.get('/img', async function (req, res, next) {
    if (!req.query.url) {
        return res.sendStatus(500)
    }
    const url = decodeURI(req.query.url);
    let width = parseInt(req.query.w, 10);
    let height = parseInt(req.query.h, 10);
    height = isNaN(height) ? null : height;
    width = isNaN(width) ? null : width;
    if (width === null && height === null) {
        width = 320
    }
    if (width && width > 600) {
        width = 320
    }
    if (height && height > 600) {
        height = 320
    }
    fetch(url).then(ires => ires.buffer())
        .then(buffer => {
            sharp(buffer).resize(width, height, {
                withoutEnlargement: true,
                kernel: sharp.kernel.lanczos3
            }).toBuffer(function (err, data, info) {
                if (err) {
                    return res.status(500);
                }
                res.type('image/jpeg');
                res.header('Cache-Control', 'public, max-age=604800, immutable')
                return res.send(data)
            });
        }).catch(err => {
            return res.status(500);
        })
});

app.use(helmet())
app.use(router)

app.listen(port, () => console.log(`app listening on port ${port}!`))
