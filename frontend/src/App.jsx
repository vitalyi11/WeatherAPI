import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LiveData from "./components/LiveData";
import SensorCharts from "./components/SensorChart";
import Footer from "./components/Footer";
import "./styles/App.css";

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      const theme = savedTheme || "light";
      setDarkMode(theme === "dark");
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      const newTheme = next ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      return next;
    });
  };

  return (
    <Router>
      <div className="app">
        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main className="main">
          <Routes>
            <Route path="/" element={<LiveData />} />
            <Route path="/charts" element={<SensorCharts />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;