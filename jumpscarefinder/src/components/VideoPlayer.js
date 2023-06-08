import React, { useState } from "react";
import ReactPlayer from "react-player";

const VideoPlayer = ({ url }) => {
    return (
        <ReactPlayer
            height="80%"
            width="100%"
            playing={false}
            pip
            controls="false"
            config={{ file: { forceHLS: true } }}
            url={url}
        />
    );
};

export default VideoPlayer;