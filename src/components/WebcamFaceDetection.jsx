import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import './App.css';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = (webcamRef) => {
  const imageSrc = webcamRef.current.getScreenshot();
  try {
    axios.post('https://mpd3lilunk.execute-api.ap-south-1.amazonaws.com/prod/register', { imageBase64: imageSrc }).then(res => { 
      console.log(res);
      if (res.status === 200) {
        toast.success("Registered Successfully");
      }
    }).catch(err =>{
      if (err.response.status === 400) {
        toast.error("Face not detected!");
      }
      else {
        toast.error("Something went wrong!");
      }
    });
    
  } catch (error) {
    console.error(error);
  }
};

const Login = (webcamRef) => {
  const imageSrc = webcamRef.current.getScreenshot();
  try {
    axios.post('https://mpd3lilunk.execute-api.ap-south-1.amazonaws.com/prod/login', { imageBase64: imageSrc }).then(res => { 
      console.log(res);
      if (res.status === 200) {
        toast.success("Logged-in Successfully");
      }
    }).catch(err =>{
      if (err.response.status === 400) {
        toast.error("Face not detected!");
      }
      if(err.response.status === 401){
        toast.error("Unauthorized user!")
      }
      else {
        toast.error("Something went wrong!");
      }
    });
  } catch (error) {
    console.error(error); 
  }
};

const WebcamFaceDetection = () => {
  const webcamRef = useRef(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  useEffect(() => {
    const loadModelsAndStartDetection = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      startDetection();
    };

    const startDetection = async () => {
      function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
      while (true) {
        if (webcamRef.current) {
          const video = webcamRef.current.video;
          faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).then(e => {
            if (e) {
              setIsFaceDetected(true);
            } else {
              setIsFaceDetected(false);
            }
          })
        } 
        await sleep(300);
      }
    };

    loadModelsAndStartDetection();

    return () => {
      // Clean up
    };
  }, []);

  return (
    <div className="container">
      <ToastContainer />
      <div className="webcam-container">
        <Webcam
          audio={false}
          height={480}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={480}
        />
        {isFaceDetected && <div className="face-detected">Face Detected</div>}
      </div>
      <div className="buttons">
        <button className="action-button" onClick={() => Register(webcamRef)}>Register</button>
        <button className="action-button" onClick={() => Login(webcamRef)}>Login</button>
      </div>
    </div>
  );
};

export default WebcamFaceDetection;
