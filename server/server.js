const AudioContext = require('web-audio-api').AudioContext
const yt = require("yt-converter");
const ytdl = require('ytdl-core');
const fs = require("fs");
const context = new AudioContext

const port = 4001;
const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const maxParallelUploads = 3;
const maxMoments = 60;

app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    console.log(`Client ${socket.id} connected`);
    socket.on("disconnect", async () => {
        var clients = await io.fetchSockets();
        if (clients.length == 0) {
            const files = fs.readdirSync("audio/");
            if (files.length != 0) {
                for (let i = 0; i < files.length; i++) {
                    try {
                        fs.unlinkSync(`audio/${files[i]}`);
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
            const files = fs.readdirSync("audio/");

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

const getAudio = async (url, info, socket) => {
    const options = {
        url: url,
        itag: 140,
        directoryDownload: "audio/"
    };

    const onClose = () => {
        const files = fs.readdirSync("audio/");
        var modTitle = info.title.replace(/[^\w]/gi, '');
        var path = `audio/`;

        try {
            for (let i = 0; i < files.length; i++) {
                var modFileName = files[i].replace(".mp3", '');
                modFileName = modFileName.replace(/[^\w]/gi, '');

                if (modFileName == modTitle) {
                    path += files[i];
                }
            }

            const audioData = fs.readFileSync(path);
            fs.unlinkSync(path);

            if (socket.connected) {
                socket.emit('status', "Finding moments...");
                decodeAudio(audioData, info, socket);
            }
        } catch (error) {
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

const decodeAudio = (buffer, info, socket) => {
    context.decodeAudioData(buffer, function (audioBuffer) {
        let pcmdata = (audioBuffer.getChannelData(0));
        let samplerate = audioBuffer.sampleRate;
        let length = audioBuffer.length;

        let topKeyMoments = [];
        let keyMoments = [];

        const upperThreshold = 0.78;
        const lowerThreshold = -0.78;
        const upperThresholdTwo = 0.58;
        const lowerThresholdTwo = -0.58;

        const windowTime = 3;
        const windowSize = Math.floor(samplerate * windowTime);

        let minPos = 0;
        let minPosTwo = 0;
        for (let i = 1; i < length; i++) {
            const currTime = Math.floor(i / samplerate);

            const minPosValid = i - windowSize < minPos;
            const passWindow = topKeyMoments.length == 0 || currTime > topKeyMoments[topKeyMoments.length - 1] + windowTime;

            const minPosValidTwo = i - windowSize < minPosTwo;
            const passWindowTwo = keyMoments.length == 0 || currTime > keyMoments[keyMoments.length - 1] + windowTime;

            if (minPosValid && passWindow && pcmdata[i] > upperThreshold) {
                topKeyMoments.push(currTime);
            }
        
            if (minPosValidTwo && passWindowTwo && pcmdata[i] > upperThresholdTwo) {
                keyMoments.push(currTime);
            }

            minPos = (pcmdata[i] < lowerThreshold) ? i : minPos;
            minPosTwo = (pcmdata[i] < lowerThresholdTwo) ? i : minPosTwo;
        }

        const mins = Math.floor(info.lengthSeconds / 60);
        if (topKeyMoments.length / mins >= 0.4) {
            keyMoments = topKeyMoments;
        }

        if (keyMoments.length > maxMoments) {
            var numElemsRemove = keyMoments.length - maxMoments;
            var copy = [...keyMoments];
            var baseline = copy[0];
            var offset = 0;
            for (let i = 1; i < copy.length; i++) {
                if (copy[i] < baseline + (windowTime * 3)) {
                    keyMoments.splice(i - offset, 1);
                    numElemsRemove--;
                    offset++;
                } else {
                    baseline = copy[i];
                } 
            }

            for (let i = 0; i < numElemsRemove; i++) {
                keyMoments.splice(Math.floor(Math.random() * keyMoments.length), 1);
            }
        }

        socket.emit('status', `Found ${keyMoments.length} moment${(keyMoments.length == 1) ? "" : "s"}...`);

        setTimeout(() => {
            socket.emit('moments', {
                keyMoments: Array.from(keyMoments)
            })
        }, 3000);
    }, function (err) {
        socket.emit('serverError', {
            title: 'Processing failed',
            desc: "Try again with a different Youtube URL"
        });
    })
}

server.listen(port, () => `Server is running on port ${port}`);