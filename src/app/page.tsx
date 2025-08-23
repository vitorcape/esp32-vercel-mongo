// src/app/page.tsx
import { getDb } from "@/lib/mongodb";
import { getSunInfo } from "@/lib/sun";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Reading = {
  _id?: string;
  deviceId: string;
  temperature: number;
  humidity: number;
  ts: Date;
};

function startOfTodaySP(): Date {
  const tz = "America/Sao_Paulo";
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  now.setHours(0, 0, 0, 0);
  return new Date(now.toLocaleString("en-US", { timeZone: tz }));
}

export default async function Home() {
  const db = await getDb();

  const [last] = await db
    .collection<Reading>("readings")
    .find({})
    .sort({ ts: -1 })
    .limit(1)
    .toArray();

  const since = startOfTodaySP();
  const statsAgg = await db
    .collection<Reading>("readings")
    .aggregate([
      { $match: { ts: { $gte: since } } },
      {
        $group: {
          _id: null,
          tMin: { $min: "$temperature" },
          tMax: { $max: "$temperature" },
          hMin: { $min: "$humidity" },
          hMax: { $max: "$humidity" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const stats = statsAgg[0] || { tMin: null, tMax: null, hMin: null, hMax: null, count: 0 };

  // sunrise/sunset
  // sunrise/sunset vindos do Open‑Meteo (strings locais SP: "YYYY-MM-DDTHH:MM")
  const sun = await getSunInfo();
  const TZ = "America/Sao_Paulo";

  // helper: "YYYY-MM-DDTHH:MM" -> {h, m}
  function parseHM(isoLocal: string) {
    const [h, m] = isoLocal.slice(11, 16).split(":").map(Number);
    return { h, m };
  }
  function toMinutes(h: number, m: number) {
    return h * 60 + m;
  }

  // agora (em SP) em minutos desde 00:00
  const nowSP = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  const nowMin = toMinutes(nowSP.getHours(), nowSP.getMinutes());

  // sunrise / sunset em minutos
  const { h: sh, m: sm } = parseHM(sun.sunrise);
  const { h: eh, m: em } = parseHM(sun.sunset);
  const sunriseMin = toMinutes(sh, sm);
  const sunsetMin = toMinutes(eh, em);

  // dia/noite
  const isDay = nowMin >= sunriseMin && nowMin < sunsetMin;

  // rótulos para exibir
  const sunriseLabel = sun.sunrise.slice(11, 16); // "HH:MM"
  const sunsetLabel = sun.sunset.slice(11, 16);  // "HH:MM"

  const fmt = (d?: Date | string) =>
    d
      ? new Date(d).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })
      : "--:--";

  return (
    <div className="container py-4">
      {/* hero */}
      <section className="hero card-glass mb-4 text-center">
        <div className="display-1">{isDay ? "☀️" : "🌙"}</div>
        <div className="display-4 fw-bold">
          {last ? `${last.temperature.toFixed(1)}°C` : "--°C"} / {last ? `${last.humidity.toFixed(0)}%` : "--%"}
        </div>
        <div className="label-muted mt-2">Última atualização: {last ? fmt(last.ts) : "--:--"}</div>
      </section>

      {/* cartões */}
      <section className="row g-3">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card-glass p-3 h-100">
            <i className="fa-solid fa-temperature-arrow-up me-2"></i>Máxima de hoje
            <div className="fs-3 fw-bold">{stats.tMax != null ? `${stats.tMax.toFixed(1)}°C` : "—"}</div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card-glass p-3 h-100">
            <i className="fa-solid fa-temperature-arrow-down me-2"></i>Mínima de hoje
            <div className="fs-3 fw-bold">{stats.tMin != null ? `${stats.tMin.toFixed(1)}°C` : "—"}</div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card-glass p-3 h-100">
            <i className="fa-solid fa-sun me-2"></i>Nascer do sol
            <div className="fs-3 fw-bold">{fmt(sunriseLabel)}</div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card-glass p-3 h-100">
            <i className="fa-solid fa-moon me-2"></i>Pôr do sol
            <div className="fs-3 fw-bold">{fmt(sunsetLabel)}</div>
          </div>
        </div>
      </section>

      {/* rodapé */}
      <footer className="mt-5 small text-white-50 text-center">
        Dados do sensor DHT22 via ESP32 • Fuso: America/Sao_Paulo
      </footer>
    </div>
  );
}