const yt = require("yt-converter");
const ytdl = require('ytdl-core');
const fs = require("fs");
const os = require('os');
const path = require('path');

const port = process.env.PORT || 8080;
const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const {
    Worker,
    isMainThread,
} = require("worker_threads");

const maxParallelUploads = 3;

const tmpDir = path.join(os.tmpdir(), "ftmaudio/");

const makeAudioDir = () => {
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
    }
};

app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

makeAudioDir();
console.log(__filename)

app.get("/", (req, res) => {
    res.send("Welcome to FTM");
});

io.on('connection', (socket) => {
    console.log(`Client ${socket.id} connected`);
    socket.on("disconnect", async () => {
        var clients = await io.fetchSockets();
        if (clients.length == 0) {
            const files = fs.readdirSync(tmpDir);
            if (files.length != 0) {
                for (let i = 0; i < files.length; i++) {
                    try {
                        fs.unlinkSync(path.join(tmpDir, files[i]));
                    } catch (error) {
                        console.log(error)
                    }
                }
            }
        }
        console.log(`Client ${socket.id} disconnected`)
    });

    socket.on("sendUrl", async (url) => {
        var isValid = ytdl.validateURL(url);

        if (!url || !isValid) {
            setTimeout(() => {
                socket.emit('serverError', {
                    title: 'Invalid url',
                    desc: "Pleae try again with a different Youtube URL"
                });
            }, 1000);
        } else {
            const info = await yt.getInfo(url);
            const files = fs.readdirSync(tmpDir);

            if (info.lengthSeconds >= 3600) {
                socket.emit('serverError', {
                    title: 'Video duration is too long',
                    desc: "Since this is a free service, video limits are enforced. The video must be less than 1 hour long"
                });
            } else if (files.length > maxParallelUploads) {
                socket.emit('serverError', {
                    title: 'Server busy',
                    desc: "Please try again in a few moments"
                });
            } else {
                getAudio(url, info, socket);
            }
        }
    });
});

io.engine.on("connection_error", (err) => {
    console.log(err.req);      // the request object
    console.log(err.code);     // the error code, for example 1
    console.log(err.message);  // the error message, for example "Session ID unknown"
    console.log(err.context);  // some additional error context
});

const getAudio = async (url, info, socket) => {
    const options = {
        url: url,
        itag: 140,
        directoryDownload: tmpDir
    };

    const onClose = () => {
        const files = fs.readdirSync(tmpDir);
        var modTitle = info.title.replace(/[^\w]/gi, '');
        var audioFilePath;

        try {
            for (let i = 0; i < files.length; i++) {
                var modFileName = files[i].replace(".mp3", '');
                modFileName = modFileName.replace(/[^\w]/gi, '');

                if (modFileName == modTitle) {
                    audioFilePath = path.join(tmpDir, files[i]);
                }
            }

            const audioData = fs.readFileSync(audioFilePath);
            fs.unlinkSync(audioFilePath);

            if (socket.connected) {
                socket.emit('status', "Finding moments...");

                if (isMainThread) {
                    const worker = new Worker(path.resolve(__dirname, 'worker.js'), {workerData: audioData});
                    worker.on("message", keyMoments => {
                        socket.emit('status', `Found ${keyMoments.length} moment${(keyMoments.length == 1) ? "" : "s"}...`);
                        setTimeout(() => {
                            socket.emit('moments', {
                                keyMoments: keyMoments
                            })
                        }, 3000);
                    });
                    worker.on("error", err => {
                        console.log(err)
                        socket.emit('serverError', {
                            title: 'Processing failed',
                            desc: "Try again with a different Youtube URL"
                        });
                    });
                }      
            }
        } catch (error) {
            console.log(error)
            socket.emit('serverError', {
                title: 'Server busy',
                desc: "Please try again in a few moments"
            });
        }
    };

    socket.emit('status', "Processing video...");

    yt.convertAudio(options, (percentage) => {
        if (Math.floor(percentage) % 2 == 0) {
            socket.emit('status', `Processing video ${Math.floor(percentage)}%...`);
        }
    }, onClose);
};

server.listen(port, () => console.log(`Server is running on port ${port}`));