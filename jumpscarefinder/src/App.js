import React, { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { blue } from '@mui/material/colors';
import { NoteText } from './components/NoteText.js';
import { ErrorDialog } from './components/ErrorDialog.js';
import { MomentGrid } from './components/MomentGrid.js';
import { socket } from './socket';
import './App.css';
import { BasicInfo } from './components/BasicInfo.js';

const App = () => {
  const [moments, setMoments] = useState([]);
  const [url, setUrl] = useState('');
  const [tempUrl, setTempUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [error, setError] = useState({ show: false });

  useEffect(() => {
    socket.on("status", message => {
      setProgressText(message);
    });

    socket.on("moments", data => {
      setMoments(data.keyMoments);
      setLoading(false);
    });

    socket.on("connect_error", data => {
      setLoading(false);
      setMoments([]);
      console.log(data);
    });

    socket.on("serverError", data => {
      setLoading(false);
      setMoments([]);
      setError({ show: true, title: data.title, desc: data.desc });
    });
  }, []);

  const handleChange = (event) => {
    setTempUrl(event.target.value);
  };

  const handleSubmit = (event) => {
    if (!socket.connected) {
      setError({ show: true, title: "Maintenence in progress", desc: "Please try again later" });
    } else {
      setProgressText("");
      socket.emit('sendUrl', tempUrl);
      setUrl(tempUrl);
      setLoading(true);
      setMoments([]);
    }
  };

  const handleError = () => {
    setError({ show: false });
  };

  return (
    <div className="App">
      <div style={{
        flex: "1 0 70%",
        flexDirection: 'column',
        display: 'flex',
        fontSize: "calc(10px + 2vmin)",
        color: "#ffffff",
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
        zIndex: 0,
        background: "radial-gradient(#00182C, #000000)",
      }}>
        <div style={{
          width: "100%",
        }}>
          <h1 style={{
            marginBottom: 0
          }}>
            Find The Moment
          </h1>


          <p style={{
            fontSize: 20,
            color: "#72B8F6",
            paddingRight: 0,
            marginTop: 5,
            marginBottom: 50
          }}> Discover jumpscares, peak moments, and more! </p>

          <Box
            sx={{
              width: "100%",
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Enter Youtube URL..."
              style={{
                width: '50%',
                border: "1px solid #ccc",
                padding: 10,
              }}
              onChange={handleChange}
            />
            <Button variant="contained" size="large" onClick={handleSubmit} disabled={loading}
              sx={{
                "&.Mui-disabled": {
                  background: "#ACB0B2",
                  color: "#c0c0c0"
                }
              }}
              style={{
                margin: 10,
                padding: 10,
              }}>Submit</Button>

          </Box>
        </div>
      </div>

      <div style={{
        flex: "1 0 30%",
        ///background: "radial-gradient(#282c34, #0D0E0F)",
        background: "#000000",
        display: 'flex',
        color: "#ffffff",
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1
      }}>

        {(moments.length == 0 && !loading) &&
          <BasicInfo />}

        {error.show &&
          <ErrorDialog title={error.title} desc={error.desc} onClose={handleError} />}

        {(moments.length > 0 && !loading) &&
          <MomentGrid url={url} moments={moments} />}

        {loading &&
          <Box
            sx={{
              width: "50%",
              display: 'flex',
              flexDirection: 'row',
              alignSelf: 'center',
              alignContent: 'center',
              justifyContent: 'center'
            }}
          >
            <p style={{ fontSize: 20, paddingRight: 30, marginTop: 5 }}>{progressText}</p>
            <CircularProgress />
          </Box>}

        {loading &&
          <NoteText />}

      </div>


      {/* <Box
        sx={{
          height: "50vh",
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignContent: 'center',
          alignItems: 'center',
          fontSize: "calc(10px + 2vmin)",
          color: "#ffffff"
        }}
      >
        <div style={{
          width: "100%"
        }}>
          <h1 style={{
            marginBottom: 0,
            marginRight: 10,
          }}>
            Find The Moment
          </h1>


          <p style={{
            fontSize: 20,
            color: blue[100],
            paddingRight: 5,
            marginTop: 5,
            marginBottom: 50
          }}> Discover jumpscares, peak moments, and more! </p>

          <Box
            sx={{
              width: "100%",
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Enter Youtube URL..."
              style={{
                width: '50%',
                border: "1px solid #ccc",
                padding: 10,
              }}
              onChange={handleChange}
            />
            <Button variant="contained" size="large" onClick={handleSubmit} disabled={loading}
              sx={{
                "&.Mui-disabled": {
                  background: "#ACB0B2",
                  color: "#c0c0c0"
                }
              }}
              style={{
                margin: 10,
                padding: 10,
              }}>Submit</Button>

          </Box>
        </div>
      </Box>

      <Box
        sx={{
          width: "100%",
          height: "50vh",
          flex: "1 1 auto",
          backgroundColor: "#282c34",
          display: 'flex',
          flexDirection: 'column',
          color: "#ffffff",
          paddingTop: 10,
        }}
      >
        <BasicInfo/>

        {error.show ?
          <ErrorDialog title={error.title} desc={error.desc} onClose={handleError} /> : <div />}

        {moments.length && !loading ?
          <MomentGrid url={url} moments={moments} /> : <div />}

        {loading ?
          <Box
            sx={{
              width: "50%",
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <p style={{ fontSize: 20, paddingRight: 30, marginTop: 5 }}>{progressText}</p>
            <CircularProgress />
          </Box> : <div />}

        {loading ?
          <NoteText /> : <div />}
      </Box> */}
    </div >
  );
};

export default App;