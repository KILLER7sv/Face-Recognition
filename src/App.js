import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WebcamFaceDetection from './components/WebcamFaceDetection';

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<WebcamFaceDetection />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
