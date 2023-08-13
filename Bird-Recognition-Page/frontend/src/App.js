import React, { Component } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AudioUpload } from "./components/AudioUpload.js";
import "./App.css";
import Preview from "./components/preview.js";

class App extends Component {
  render() {
    return (
      <Router>
        <Routes>
          <Route exact path="/bird_recognition" element={<AudioUpload />} />
          <Route exact path="/bird_recognition" element={<Preview />} />
        </Routes>
      </Router>
    );
  }
}
export default App;
