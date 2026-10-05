import React, { useEffect, useState } from "react";

const LiveData = () => {
  const [data, setData] = useState({ temp: null, pres: null, timestamp: null });
  const [comfort, setComfort] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = "http://127.0.0.1:5000/data";
  const COMFORT_URL = "http://127.0.0.1:5000/comfort";

  const fetchData = async () => {
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      console.error("Błąd pobierania danych:", err);
    }
  };

  const fetchComfort = async () => {
    try {
      const res = await fetch(COMFORT_URL);
      const json = await res.json();
      setComfort(json.comfort);
    } catch (err) {
      console.error("Błąd pobierania warunków komfortowych:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchComfort();
    const interval = setInterval(() => {
      fetchData();
      fetchComfort();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p className="loading">⏳ Ładowanie danych...</p>;

  const getComfortClass = () => {
    if (!comfort) return "";
    if (comfort.includes("komfortowe")) return "comfort-good";
    if (comfort.includes("umiarkowane")) return "comfort-medium";
    return "comfort-bad";
  };

  return (
    <section className="live">
      <div className="cards">
        <div className="card card-temp">
          <h2>Temperatura</h2>
          <p className="value">{data.temp?.toFixed(1)}°C</p>
        </div>
        <div className="card card-pres">
          <h2>Ciśnienie</h2>
          <p className="value">{data.pres?.toFixed(1)} hPa</p>
        </div>
      </div>
      
      {comfort && (
        <div className={`comfort-status ${getComfortClass()}`}>
          <h3>Warunki:</h3>
          <p className="comfort-text">{comfort}</p>
        </div>
      )}

      <div className="comfort-info-table">
        <h3>📊 Wskaźnik komfortu biometeorologicznego</h3>
        <table>
          <thead>
            <tr>
              <th>Temperatura</th>
              <th>Ciśnienie</th>
              <th>Ocena warunków</th>
              <th>Opis</th>
            </tr>
          </thead>
          <tbody>
            <tr className="row-good">
              <td>18–22°C</td>
              <td>1000–1020 hPa</td>
              <td>✅ Komfortowe</td>
              <td>Warunki optymalne, sprzyjające samopoczuciu</td>
            </tr>
            <tr className="row-medium">
              <td>10–18°C lub 22–26°C</td>
              <td>985–1000 hPa lub 1020–1030 hPa</td>
              <td>⚠️ Umiarkowane</td>
              <td>Część osób może odczuwać dyskomfort</td>
            </tr>
            <tr className="row-bad">
              <td>&gt;26°C lub &lt;10°C</td>
              <td>&lt;985 hPa lub &gt;1030 hPa</td>
              <td>❌ Niekorzystne</td>
              <td>Obciążenie organizmu, możliwe złe samopoczucie</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <p className="timestamp">
        Ostatnia aktualizacja: <strong>{data.timestamp}</strong>
      </p>
    </section>
  );
};

export default LiveData;