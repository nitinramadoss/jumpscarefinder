const AudioContext = require('web-audio-api').AudioContext
const context = new AudioContext

const {
    isMainThread,
    parentPort,
    workerData
} = require("worker_threads");

const maxMoments = 60;

const decodeAudio = (buffer) => {
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
        parentPort.postMessage(keyMoments);
    }, function (err) {
        parentPort.postMessage(err);
    })
}

if (!isMainThread) {
    const audioData = workerData;
    decodeAudio(audioData);
}