#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "DHT.h"

// ----------------- CONFIGURAR AQUI -----------------
#define DHTPIN   16            // pino do DHT22
#define DHTTYPE  DHT22

const char* WIFI_SSID = "AP204";
const char* WIFI_PASS = "espereta";

// URL completa da rota /api/ingest do seu projeto Vercel
// Ex.: "https://esp32-vercel-mongo.vercel.app/api/ingest"
const char* API_URL = "https://esp32-vercel-mongo.vercel.app/api/ingest";

// Deve ser IGUAL ao DEVICE_API_KEY que você definiu no .env/Vercel
const char* API_KEY = "um_token_forte_para_o_esp32";

// Envio a cada X milissegundos (>= 2000ms por causa do DHT)
const unsigned long SEND_INTERVAL_MS = 300000; // 5 min
// ---------------------------------------------------

DHT dht(DHTPIN, DHTTYPE);
unsigned long lastSend = 0;

// Função robusta de conexão WiFi
void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Conectando ao WiFi");
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (millis() - t0 > 20000) { // 20s timeout
      Serial.println("\nFalha no WiFi, reiniciando módulo...");
      WiFi.disconnect(true, true);
      delay(2000);
      t0 = millis();
      WiFi.begin(WIFI_SSID, WIFI_PASS);
    }
  }
  Serial.printf("\nWiFi OK! IP: %s\n", WiFi.localIP().toString().c_str());
}

// Lê o DHT com 2 tentativas (respeitando intervalo mínimo)
bool readDHT(float& temp, float& hum) {
  temp = dht.readTemperature();
  hum  = dht.readHumidity();
  if (isnan(temp) || isnan(hum)) {
    delay(2000);
    temp = dht.readTemperature();
    hum  = dht.readHumidity();
  }
  return !(isnan(temp) || isnan(hum));
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\nInicializando DHT22 + HTTPS → Vercel");
  dht.begin();
  ensureWiFi();
}

void loop() {
  if (millis() - lastSend < SEND_INTERVAL_MS) {
    delay(10);
    return;
  }
  lastSend = millis();

  ensureWiFi();

  float t, h;
  if (!readDHT(t, h)) {
    Serial.println("Falha na leitura do DHT22 (NaN).");
    return;
  }

  // Cliente HTTPS (desabilitando validação só para teste)
  WiFiClientSecure client;
  client.setInsecure(); // ⚠️ Em produção, prefira usar certificado/CA (pinning)

  HTTPClient https;
  if (!https.begin(client, API_URL)) {
    Serial.println("HTTPS: begin() falhou");
    return;
  }

  https.addHeader("Content-Type", "application/json");
  https.addHeader("x-api-key", API_KEY);

  // Monte o JSON
  String body = String("{\"deviceId\":\"esp32-lab\",\"temperature\":") +
                String(t, 2) + ",\"humidity\":" + String(h, 2) + "}";

  int code = https.POST(body);
  Serial.printf("POST %s => HTTP %d | payload: %s\n", API_URL, code, body.c_str());

  if (code > 0) {
    String resp = https.getString();
    Serial.println("Resposta: " + resp);
  } else {
    Serial.printf("Erro HTTPClient: %s\n", https.errorToString(code).c_str());
  }

  https.end();
}