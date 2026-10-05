# 🌡️ IoT Weather Monitoring System

System monitorowania warunków atmosferycznych oparty na ESP32 i czujniku BMP280 z wizualizacją danych w czasie rzeczywistym.

## 📋 Opis projektu

Aplikacja zbiera dane o temperaturze i ciśnieniu atmosferycznym za pomocą mikrokontrolera ESP32 wyposażonego w czujnik BMP280. Dane są wysyłane do serwera Flask i wizualizowane w przeglądarce w czasie rzeczywistym. System automatycznie redukuje ciśnienie do poziomu morza i ocenia warunki biometeorologiczne.

## 🛠️ Technologie

### Hardware
- **ESP32** - mikrokontroler z Wi-Fi
- **BMP280** - czujnik temperatury i ciśnienia atmosferycznego
- Adres I2C: `0x76`

### Backend
- **Python**
- **Flask** - serwer REST API
- **SQLAlchemy** - ORM do zarządzania bazą danych
- **SQLite** - baza danych

### Frontend
- **React** - framework UI
- **Chart.js** - wykresy interaktywne
- **react-datepicker** - wybór dat
- **chartjs-plugin-zoom** - zoom i pan na wykresach

## 📦 Wymagania

### Backend (Python)
```txt
Flask==3.0.0
Flask-SQLAlchemy==3.1.1
Flask-CORS==4.0.0
```

### Frontend (Node.js)
```json
{
  "react": "^18.2.0",
  "react-chartjs-2": "^5.2.0",
  "chart.js": "^4.4.0",
  "chartjs-plugin-zoom": "^2.0.1",
  "react-datepicker": "^4.21.0",
  "date-fns": "^2.30.0"
}
```

### ESP32 (Arduino IDE)
```cpp
WiFi.h
HTTPClient.h
Adafruit_Sensor.h
Adafruit_BMP280.h
```


## 📡 API Endpoints

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/update` | POST | Przyjmuje dane z ESP32 (temp, pres, date_time) |
| `/data` | GET | Zwraca najnowsze dane live |
| `/history` | GET | Zwraca ostatnie N pomiarów (param: `limit`) |
| `/history/timerange` | GET | Zwraca dane z ostatnich X godzin (param: `hours`) |
| `/history/date` | GET | Zwraca dane z konkretnej daty (param: `date` YYYY-MM-DD) |
| `/comfort` | GET | Ocena warunków biometeorologicznych |

## 📊 Funkcje

### Czujnik (ESP32)
- ✅ Automatyczne łączenie z Wi-Fi + reconnect
- ✅ Synchronizacja czasu przez NTP
- ✅ Redukcja ciśnienia do poziomu morza
- ✅ Wysyłanie danych co 1 sekundę

### Serwer (Flask)
- ✅ Buforowanie danych live w pamięci
- ✅ Zapis do bazy co 2 minuty (optymalizacja)
- ✅ Filtrowanie danych po czasie i dacie
- ✅ Obsługa stref czasowych (Europe/Warsaw)

### Frontend (React)
- ✅ Wyświetlanie danych live (odświeżanie co 3s)
- ✅ Interaktywne wykresy z zoom/pan
- ✅ Wybór zakresów czasowych (30 min, 1h, 12h, 24h)
- ✅ Kalendarz - przeglądanie danych historycznych
- ✅ Ocena warunków biometeorologicznych
- ✅ Statystyki min/max (temp + ciśnienie)


## 👨‍💻 Autor

Projekt w ramach pracy inżynierskiej - 2025
Kacper Kwiatek

