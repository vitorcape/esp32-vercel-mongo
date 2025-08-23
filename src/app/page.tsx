import { getDb } from "@/lib/mongodb";
import TempChart from "@/components/TempChart";
import HumidityChart from "@/components/HumidityChart";
import ForecastCompareChart from "@/components/ForecastCompareChart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Reading = {
  _id?: string;
  deviceId: string;
  temperature: number;
  humidity: number;
  ts: Date;
};

export default async function Home() {
  const db = await getDb();

  // último registro para mostrar em destaque
  const latest = await db
    .collection<Reading>("readings")
    .find({})
    .sort({ ts: -1 })
    .limit(1)
    .toArray();

  const last = latest[0];

  // últimas 10 leituras para a tabela
  const readings = await db
    .collection<Reading>("readings")
    .find({})
    .sort({ ts: -1 })
    .limit(10)
    .toArray();

  return (
    <main className="container py-4">
      <h1 className="text-center mb-4">Monitoramento ESP32 (DHT22)</h1>

      {/* Destaque grande com a leitura mais recente */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row text-center">
            <div className="col-12 col-lg-4 mb-3 mb-lg-0">
              <div className="display-5 fw-bold">
                {last ? `${last.temperature.toFixed(1)}°C` : "--"}
              </div>
              <div className="text-muted">Temperatura</div>
            </div>
            <div className="col-12 col-lg-4 mb-3 mb-lg-0">
              <div className="display-5 fw-bold">
                {last ? `${last.humidity.toFixed(0)}%` : "--"}
              </div>
              <div className="text-muted">Umidade</div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="display-6">
                {last ? new Date(last.ts).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) : "--"}
              </div>
              <div className="text-muted">Última atualização</div>
            </div>
          </div>
        </div>
      </div>

      {/* grid com dois gráficos separados */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white">Temperatura — últimas 24h</div>
            <div className="card-body">
              <TempChart deviceId="esp32-lab" intervalMs={15000} />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-info text-white">Umidade — últimas 24h</div>
            <div className="card-body">
              <HumidityChart deviceId="esp32-lab" intervalMs={15000} />
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm h-100 mb-4">
        <div className="card-header bg-warning">
          Comparativo (Hoje) — Previsão × Medido — Catanduva, SP
        </div>
        <div className="card-body">
          <ForecastCompareChart deviceId="esp32-lab" refreshMs={60000} />
        </div>
      </div>

      {/* tabela responsiva com últimas leituras */}
      <div className="card shadow-sm">
        <div className="card-header bg-secondary text-white">Últimas Leituras</div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Data/Hora</th>
                  <th>Dispositivo</th>
                  <th>Temperatura (°C)</th>
                  <th>Umidade (%)</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r, i) => (
                  <tr key={r._id ?? i}>
                    <td>{new Date(r.ts).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}</td>
                    <td>{r.deviceId}</td>
                    <td>{r.temperature.toFixed(1)}</td>
                    <td>{r.humidity.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}