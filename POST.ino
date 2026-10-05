#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include <time.h>
#include <math.h>

Adafruit_BMP280 bmp;

const char* ssid = "SSID";
const char* password = "Password";

String serverURL = "http://51.38.137.192:5000/update";

const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 3600; 
const int daylightOffset_sec = 0;

const float ALTITUDE_M = 327.0;

String getTimeString() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "0000-00-00 00:00:00";
  }
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buf);
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Łączenie z WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nPołączono z WiFi!");
  Serial.print("Adres IP ESP32: ");
  Serial.println(WiFi.localIP());

  if (!bmp.begin(0x76)) {
    Serial.println("Nie wykryto BMP280!");
    while (1) delay(10);
  }
  Serial.println("BMP280 gotowy!");

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Synchronizacja czasu NTP...");
  delay(2000);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    float temp = bmp.readTemperature();

    float pres_abs = bmp.readPressure() / 100.0F;

    float pres_sea = pres_abs * pow(1.0 - (ALTITUDE_M / 44330.0), -5.255); 

    String timestamp = getTimeString();

    WiFiClient client;
    HTTPClient http;

    if (http.begin(client, serverURL)) {
      http.addHeader("Content-Type", "application/json");

      String payload = "{\"date_time\":\"" + timestamp +
                       "\",\"temp\":" + String(temp, 1) +
                       ",\"pres\":" + String(pres_sea, 1) + "}";

      int code = http.POST(payload);

      if (code > 0) {
        Serial.println("Wysłano dane:");
        Serial.println(payload);
        Serial.print("Kod odpowiedzi: ");
        Serial.println(code);

        Serial.print("   Surowe ciśnienie: ");
        Serial.print(pres_abs, 1);
        Serial.println(" hPa");

        Serial.print("   Zredukowane do poziomu morza: ");
        Serial.print(pres_sea, 1);
        Serial.println(" hPa");

      } else {
        Serial.println("Błąd: nie wysłano danych (serwer niedostępny).");
      }

      http.end();
    } else {
      Serial.println("Nie udało się nawiązać połączenia HTTP!");
    }
  } else {
    Serial.println("Brak połączenia WiFi! Próba ponownego połączenia...");
    WiFi.reconnect();
  }

  delay(1000);
}
