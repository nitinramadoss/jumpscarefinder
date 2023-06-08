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
                    fs.unlinkSync(`audio/${files[i]}`);
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
                decodeAudio(audioData, socket);
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

const decodeAudio = (buffer, socket) => {
    context.decodeAudioData(buffer, function (audioBuffer) {
        let pcmdata = (audioBuffer.getChannelData(0));
        let samplerate = audioBuffer.sampleRate;
        let length = audioBuffer.length;

        let keyMoments = [];

        const upperThreshold = 0.78;
        const lowerThreshold = -0.78;
        const windowTime = 3;
        const windowSize = Math.floor(samplerate * windowTime);

        let minPos = 0;
        for (let i = 1; i < length; i++) {
            const currTime = Math.floor(i / samplerate);
            const minPosValid = i - windowSize < minPos;
            const passWindow = keyMoments.length == 0 || currTime > keyMoments[keyMoments.length - 1] + windowTime;

            if (minPosValid && passWindow && pcmdata[i] > upperThreshold) {
                keyMoments.push(currTime);
            }

            minPos = (pcmdata[i] < lowerThreshold) ? i : minPos;
        }

        socket.emit('status', `Found ${keyMoments.length} moment${(keyMoments.length == 1) ? "" : "s"}...`);

        console.log(keyMoments.length);

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

/*
        let keyMoments = [];

        const upperThreshold = 0.7;
        const lowerThreshold = -0.7;
        const windowTime = 3;
        const windowSize = Math.floor(samplerate * windowTime);

        let minPos = 0;
        for (let i = 1; i < length; i++) {
            const currTime = Math.floor(i / samplerate);
            const minPosValid = i - windowSize < minPos;
            const passWindow = keyMoments.length == 0 || currTime > keyMoments[keyMoments.length - 1] + windowTime;

            if (minPosValid && passWindow && pcmdata[i] > upperThreshold) {
                keyMoments.push(currTime);
            }

            minPos = (pcmdata[i] < lowerThreshold) ? i : minPos;
        }

*/

/*
        let keyMoments = [];

        const upperThreshold = 0;
        const windowTime = 3;
        const windowSize = Math.floor(samplerate * windowTime);

        let counter = 0;
        let startPos = -1;
        for (let i = 0; i < length; i++) {
            if (pcmdata[i] > upperThreshold) {
                if (startPos == -1) {
                    startPos = i;
                }
                counter++;
            }

            if (startPos != -1 && startPos + windowSize < i) {
                if (counter/windowSize > 0.51) {
                    keyMoments.push(Math.floor(startPos / samplerate));    
                }
                counter = 0;
                startPos = -1;
            }

        }

*/


/*
        const diffThreshold = 1.5;
        const loudnessThreshold = 0.9;
        const windowSize = Math.floor(samplerate * 2);

        let minPos = 0;
        let found = false;
        let counter = 0;
        for (let i = 1; i < length; i++) {
            if (!found && pcmdata[i] > loudnessThreshold && pcmdata[i] - pcmdata[minPos] > diffThreshold) {
                keyMoments.push(Math.floor(i / samplerate));
                found = true;
            }

            if (found && pcmdata[i] > 0.5) {
                counter++;
            }

            if (minPos < i - windowSize) {
                if (found && counter/windowSize < 0.5) {
                    console.log("failed condition")
                    console.log(counter/windowSize)
                    keyMoments.pop();
                }

                minPos = i;
                found = false;
                counter = 0;
            }

            minPos = (pcmdata[i] < pcmdata[minPos])? i : minPos;
        }

*/


/*

https://www.youtube.com/watch?v=C7__2tjWQTU

*/