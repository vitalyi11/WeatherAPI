import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    const newTheme = !darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <nav className="navbar">
      <h1 className="navbar-title">ESP32 Czujnik BMP280
      <span className="navbar-subtitle"> - Miejscowość pomiaru Lechów, Świętokrzyskie</span>
      </h1>
      <div className="navbar-links">
        <button className="theme-toggle-navbar" onClick={toggleDarkMode}>
          {darkMode ? "☀️" : "🌙"}
        </button>
        <Link to="/" className="nav-link">Live Odczyt</Link>
        <Link to="/charts" className="nav-link">Wykresy</Link>
      </div>
    </nav>
  );
};

export default Navbar;