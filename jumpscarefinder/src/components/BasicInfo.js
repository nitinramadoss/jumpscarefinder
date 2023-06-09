import React from 'react';
import { Box, Card } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import SlideshowIcon from '@mui/icons-material/Slideshow';

export const BasicInfo = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                width: "100vw"
            }}
        >
            <div
                style={{
                    flexDirection: 'column',
                    color: "#ffffff",
                    display: 'flex',
                    margin: "auto"
                }}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                    <h1 style={{ marginRight: 10, color: "#bbdefb" }}>Step 1</h1>
                    <CloudUploadIcon style={{ paddingTop: 5, color: "#bbdefb" }}/>

                </div>
                <p style={{ marginTop: 5, fontSize: "1.1vmax" }}>Enter the Youtube URL for a <br />horror video</p>
            </div>

            <div
                style={{
                    flexDirection: 'column',
                    color: "#ffffff",
                    display: 'flex',
                    margin: "auto"
                }}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                    <h1 style={{ marginRight: 10, color: "#bbdefb"}}>Step 2</h1>
                    <HourglassTopIcon style={{ paddingTop: 5, color: "#bbdefb" }}/>

                </div>
                <p style={{ marginTop: 5, fontSize: "1.1vmax" }}>Wait until the process <br />is complete</p>
            </div>

            <div
                style={{
                    flexDirection: 'column',
                    color: "#ffffff",
                    display: 'flex',
                    margin: "auto"
                }}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                    <h1 style={{ marginRight: 10, color: "#bbdefb" }}>Step 3</h1>
                    <SlideshowIcon style={{ paddingTop: 5, color: "#bbdefb" }}/>

                </div>
                <p style={{ marginTop: 5, fontSize: "1.1vmax" }}>View captured moments <br />here or on Youtube</p>
            </div>

        </Box>
    );
}