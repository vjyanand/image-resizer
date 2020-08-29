'use strict';
const express = require('express');
const router = express.Router();
const app = express()
const port = process.env.PORT || 8080
const helmet = require('helmet')

const redis = require("redis");
const rclient = redis.createClient({
    host: 'localhost',
    password: 'tdfSr4sjd12@#12',
    port: 6379,
    return_buffers: true
});

rclient.on('error', function (err) {
    console.log('Something went wrong ' + err);
});

rclient.on('connect', function () {
    console.log('Redis client connected');
});

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
    rclient.get(`${width}${height}${url}`, function (err, data) {
        if (!err && data) {
            res.type('image/png');
            res.set({
                'Cache-Control': 'public, max-age=31536000'
            })
            return res.send(data)
        }
        request.get(url, {
            encoding: null
        }, function (err, response, buffer) {
            if (err) {
                return res.status(500);
            }
            res.type('image/jpeg');
            try {
                sharp(buffer).resize(width, height, {
                    withoutEnlargement: true,
                    kernel: sharp.kernel.lanczos3
                }).toBuffer(function (err, data, info) {
                    rclient.set(`${width}${height}${url}`, data, 'EX', 259200, function (err) {
                        console.log(`${width}${height}${url}`)
                        if (err) {
                            console.log(err)
                            return res.status(500);
                        }
                        console.log(url)
                        return res.send(data)
                    })
                });
            } catch (e) {
                res.sendStatus(500)
                console.warn(e)
            }
        });
    });
});

app.use(helmet())
app.use(router)

app.listen(port, () => console.log(`app listening on port ${port}!`))