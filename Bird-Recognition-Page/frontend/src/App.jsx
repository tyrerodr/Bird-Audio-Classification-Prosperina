import React, { Component } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AudioUpload } from "./components/audioUpload.js";
import "./App.css";
import { ToastContainer } from "react-toastify";

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={<Navigate to="/bird_recognition" />} />
          <Route exact path="/bird_recognition" element={<AudioUpload />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    );
  }
}
export default App;
