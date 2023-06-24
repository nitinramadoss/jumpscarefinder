import { useEffect, useState } from 'react'
import { Box } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Fade from '@mui/material/Fade';
import { yellow } from '@mui/material/colors';

const FADE_INTERVAL_MS = 3000;
const WORD_CHANGE_INTERVAL_MS = FADE_INTERVAL_MS * 2;
const notes =
    [
        "Nobody's perfect. Sometimes, boring moments are captured",
        "Horror videos like FNAF work pretty well here!",
        "Click the timestamp button on a moment to view it in a new tab!",
        "Originally designed for Markiplier videos",
        "Sorry for the wait ;-;",
        "Manifesting that this works...",
        "Running magic moment detection engine...",
        "When will it finish??",
        "Our detection magic has a tendency to catch when a door opens...",
        "Abracadabra! The moments will be found in 3-5 business days",
        "Our detection magic often struggles with voiced-over videos...",
        "Long video = long wait time",
        "Extremely slow processing speeds are due to Youtube rate limits..please be patient"
    ];

export const NoteText = () => {
    const [noteFade, setNoteFade] = useState(true);
    const [notePos, setNotePos] = useState(Math.floor(Math.random() * notes.length));

    useEffect(() => {
        const fadeTimeout = setInterval(() => {
            setNoteFade(!noteFade);
        }, FADE_INTERVAL_MS)

        return () => clearInterval(fadeTimeout)
    }, [noteFade])

    useEffect(() => {
        const wordTimeout = setInterval(() => {
            setNotePos((prev) =>  (prev + 1) % notes.length)
        }, WORD_CHANGE_INTERVAL_MS)

        return () => clearInterval(wordTimeout)
    }, [])

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                position: 'absolute',
                marginTop: 10,
                paddingTop: 2,
                bottom: 20,
            }}>
            <Fade timeout={FADE_INTERVAL_MS} in={noteFade}>{<AutoAwesomeIcon size="small" sx={{ color: yellow[500] }} />}</Fade>

            <Fade timeout={FADE_INTERVAL_MS} in={noteFade}>
                {<span style={{
                    fontSize: "0.8vmax",
                    marginLeft: 10,
                    color: yellow[100]
                }}>{notes[notePos]}</span>}</Fade>

        </Box>
    )
}