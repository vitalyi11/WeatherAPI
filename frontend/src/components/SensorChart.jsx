import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import DatePicker, {registerLocale} from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {pl} from 'date-fns/locale/pl';
registerLocale('pl', pl);
import zoomPlugin from 'chartjs-plugin-zoom';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Title,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip, Title, zoomPlugin);

const SensorCharts = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("1");
  const [selectedDate, setSelectedDate] = useState(null);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [chartRefTemp, setChartRefTemp] = useState(null);
  const [chartRefPres, setChartRefPres] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  const API_BASE = "http://51.38.137.192:5000";

  const calculateStats = (data) => {
    if (!data || data.length === 0) return null;

    let maxTemp = data[0];
    let minTemp = data[0];
    let maxPres = data[0];
    let minPres = data[0];

    data.forEach(record => {
      if (record.temp > maxTemp.temp) maxTemp = record;
      if (record.temp < minTemp.temp) minTemp = record;
      if (record.pres > maxPres.pres) maxPres = record;
      if (record.pres < minPres.pres) minPres = record;
    });

    return { maxTemp, minTemp, maxPres, minPres };
  };

  const fetchAllTimeStats = async () => {
    setStatsLoading(true);
    try {
      // Pobierz wszystkie dane z bazy (np. ostatnie 365 dni lub większy limit)
      const res = await fetch(`${API_BASE}/history/timerange?hours=8760`); // 365 dni
      const json = await res.json();
      setStats(calculateStats(json));
      setStatsLoading(false);
    } catch (err) {
      console.error("❌ Błąd pobierania statystyk:", err);
      setStatsLoading(false);
    }
  };

  const fetchDataByTimeRange = async (hours) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/history/timerange?hours=${hours}`);
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString("pl-PL"));
      setLoading(false);
    } catch (err) {
      console.error("❌ Błąd pobierania danych:", err);
      setLoading(false);
    }
  };

  const fetchDataByDate = async (date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      console.log(`📅 Pobieranie danych dla daty: ${dateStr}`);
      const res = await fetch(`${API_BASE}/history/date?date=${dateStr}`);
      const json = await res.json();
      console.log(`✅ Otrzymano ${json.length} rekordów`);
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString("pl-PL"));
      setLoading(false);
    } catch (err) {
      console.error("❌ Błąd pobierania danych:", err);
      setLoading(false);
    }
  };

  // Pobierz statystyki RAZ przy montowaniu komponentu
  useEffect(() => {
    fetchAllTimeStats();
  }, []);

  useEffect(() => {
    if (useCustomDate && selectedDate) {
      fetchDataByDate(selectedDate);
    } else {
      fetchDataByTimeRange(timeRange);
    }
    
    const interval = setInterval(() => {
      if (useCustomDate && selectedDate) {
        fetchDataByDate(selectedDate);
      } else {
        fetchDataByTimeRange(timeRange);
      }
      // Odśwież też statystyki co minutę
      fetchAllTimeStats();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [timeRange, selectedDate, useCustomDate]);

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
    setUseCustomDate(false);
    setSelectedDate(null);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setUseCustomDate(true);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setUseCustomDate(false);
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("pl-PL", {
        timeZone: "Europe/Warsaw",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return timestamp;
    }
  };

  const formatFullTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("pl-PL", {
        timeZone: "Europe/Warsaw",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return timestamp;
    }
  };

  if (loading) return <p className="loading">⏳ Wczytywanie danych...</p>;

  const timestamps = data.map((d) => formatTimestamp(d.timestamp));
  const temps = data.map((d) => d.temp);
  const pres = data.map((d) => d.pres);

  const getYAxisRange = (values, padding = 2) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return {
      min: Math.floor(min - padding),
      max: Math.ceil(max + padding)
    };
  };

  const useFixedRange = (timeRange === "0.5" || timeRange === "1") && !useCustomDate;

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top", onClick: () => false },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1,
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
          onZoom: ({chart}) => {
            const xScale = chart.scales.x;
            const visibleRange = xScale.max - xScale.min;
            const totalRange = chart.data.labels.length - 1;
            const zoomLevel = visibleRange / totalRange;
            
            chart.data.datasets.forEach((dataset) => {
              if (zoomLevel < 0.5) {
                dataset.pointRadius = 3;
                dataset.pointHoverRadius = 5;
              } else {
                dataset.pointRadius = 0;
                dataset.pointHoverRadius = 3;
              }
            });
            chart.update('none');
          }
        },
        pan: {
          enabled: true,
          mode: 'x',
          onPan: ({chart}) => {
            const xScale = chart.scales.x;
            const visibleRange = xScale.max - xScale.min;
            const totalRange = chart.data.labels.length - 1;
            const zoomLevel = visibleRange / totalRange;
            
            chart.data.datasets.forEach((dataset) => {
              if (zoomLevel < 0.5) {
                dataset.pointRadius = 3;
                dataset.pointHoverRadius = 5;
              } else {
                dataset.pointRadius = 0;
                dataset.pointHoverRadius = 3;
              }
            });
          }
        },
        limits: {
          x: {min: 'original', max: 'original'},
        }
      }
    },
    scales: {
      x: { ticks: { maxTicksLimit: 10 } },
    },
  };

  const tempRange = useFixedRange ? getYAxisRange(temps, 0.25) : {};
  const tempOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: useFixedRange ? {
        min: tempRange.min,
        max: tempRange.max,
        ticks: {
          stepSize: 0.5
        }
      } : {}
    }
  };

  const presRange = useFixedRange ? getYAxisRange(pres, 2.5) : {};
  const presOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: useFixedRange ? {
        min: presRange.min,
        max: presRange.max,
        ticks: {
          stepSize: 2
        }
      } : {}
    }
  };

  return (
    <section className="charts">
      <div className="charts-header">
        <div className="time-range-selector">
          <label htmlFor="timeRange">📅 Zakres czasowy: </label>
          <select 
            id="timeRange" 
            value={timeRange} 
            onChange={handleTimeRangeChange}
            className="time-select"
            disabled={useCustomDate}
          >
            <option value="0.5">Ostatnie 30 minut</option>
            <option value="1">Ostatnia godzina</option>
            <option value="12">Ostatnie 12 godzin</option>
            <option value="24">Ostatnie 24 godziny</option>
          </select>
        </div>

        <div className="date-picker-selector">
          <label>🗓️ Lub wybierz datę: </label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="dd/MM/yyyy"
            maxDate={new Date()}
            placeholderText="Wybierz datę"
            className="date-picker-input"
            locale="pl"
          />
          {selectedDate && (
            <button onClick={handleClearDate} className="clear-date-btn">
              ✕
            </button>
          )}
        </div>

        {lastUpdate && (
          <p className="last-update">
            Ostatnia aktualizacja: <strong>{lastUpdate}</strong>
          </p>
        )}
        <p className="data-count">
          Liczba pomiarów: <strong>{data.length}</strong>
        </p>
      </div>

      {loading ? (
        <p className="loading">⏳ Wczytywanie danych...</p>
      ) : data.length === 0 ? (
        <p className="no-data">⚠️ Brak danych dla wybranego zakresu czasowego</p>
      ) : (
        <>
          <div className="chart-container">
           <h2>Wykres temperatury</h2>
            <Line
              ref={(reference) => setChartRefTemp(reference)}
              data={{
                labels: timestamps,
                datasets: [
                  {
                    label: "Temperatura (°C)",
                    data: temps,
                    borderColor: "#e63946",
                    backgroundColor: "rgba(230,57,70,0.2)",
                    tension: 0.2,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                  },
                ],
              }}
              options={tempOptions}
            />
          </div>

          {statsLoading ? (
            <p className="loading">⏳ Wczytywanie statystyk...</p>
          ) : stats && (
            <div className="stats-container">
              <div className="stats-section">
                <h3>📊 Statystyki temperatury</h3>
                <div className="stats-grid">
                  <div className="stat-item stat-temp">
                    <span className="stat-label">Maksymalna temperatura</span>
                    <span className="stat-value">{stats.maxTemp.temp.toFixed(1)} °C</span>
                    <span className="stat-date">{formatFullTimestamp(stats.maxTemp.timestamp)}</span>
                  </div>
                  <div className="stat-item stat-temp">
                    <span className="stat-label">Minimalna temperatura</span>
                    <span className="stat-value">{stats.minTemp.temp.toFixed(1)} °C</span>
                    <span className="stat-date">{formatFullTimestamp(stats.minTemp.timestamp)}</span>
                  </div>
                </div>
              </div>

              <div className="stats-section">
                <h3>📊 Statystyki ciśnienia</h3>
                <div className="stats-grid">
                  <div className="stat-item stat-pres">
                    <span className="stat-label">Maksymalne ciśnienie</span>
                    <span className="stat-value">{stats.maxPres.pres.toFixed(1)} hPa</span>
                    <span className="stat-date">{formatFullTimestamp(stats.maxPres.timestamp)}</span>
                  </div>
                  <div className="stat-item stat-pres">
                    <span className="stat-label">Minimalne ciśnienie</span>
                    <span className="stat-value">{stats.minPres.pres.toFixed(1)} hPa</span>
                    <span className="stat-date">{formatFullTimestamp(stats.minPres.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="chart-container">
            <h2>Wykres ciśnienia</h2>
            <Line
              ref={(reference) => setChartRefPres(reference)}
              data={{
                labels: timestamps,
                datasets: [
                  {
                    label: "Ciśnienie (hPa)",
                    data: pres,
                    borderColor: "#457b9d",
                    backgroundColor: "rgba(69,123,157,0.2)",
                    tension: 0.2,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                  },
                ],
              }}
              options={presOptions}
            />
          </div>
        </>
      )}
    </section>
  );
};

export default SensorCharts;