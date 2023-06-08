import React, { lazy, Suspense } from "react";
import Grid from '@mui/material/Grid';
import { Box, Button, Card } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const VideoPlayer = lazy(() => import('./VideoPlayer.js'))

export const MomentGrid = ({ url, moments }) => {
    return (
        <Box sx={{ display: 'flex', width: "65%" }}>
            <Grid
                container
                spacing={{ xs: 2, md: 3 }}
                columns={{ xs: 3, sm: 8, md: 12 }}
                alignItems="center"
                alignSelf={"center"}
                justifyContent="center"
                paddingTop={5}
                marginTop={10}
                marginBottom={10}>
                {moments.map((time, index) => {
                    const modifiedUrl = modifyUrl(url, time);

                    return <Grid item xs={3} key={index}>
                        <Card variant="outlined"
                            sx={{
                                "&:hover": {
                                    background: "#bbdefb"
                                }
                            }}
                            styles={{ card: { backgroundColor: "#ffffff" } }}>
                            <div style={{
                                padding: 5,
                            }}>
                                <Suspense fallback={<span>Loading...</span>}>
                                    <VideoPlayer url={modifiedUrl} />
                                </Suspense>

                            </div>
                            <a
                                href={modifiedUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Button variant="contained" size="small" startIcon={<AccessTimeIcon size="small" />} style={{
                                    margin: 10,
                                    padding: 5,
                                    width: "50%",

                                }}>{getTime(time)}</Button>
                            </a>
                        </Card>
                    </Grid>
                })}
            </Grid>
        </Box>
    );
}

const modifyUrl = (url, time) => {
    var modifiedUrl;

    if (url.includes("t=")) {
        modifiedUrl = url.replace(/t=[0-9]{1,}/, "t=" + time);
    } else if (url.includes("?")) {
        modifiedUrl = url + "&t=" + time;
    } else {
        modifiedUrl = url + "?t=" + time;
    }

    return modifiedUrl;
}

const getTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    const minutesStr = (minutes < 10) ? "0" + `${minutes}` : `${minutes}`;
    const secondsStr = (seconds < 10) ? "0" + `${seconds}` : `${seconds}`;

    return minutesStr + ":" + secondsStr;
}