// src/app/page.tsx
import { getDb } from "@/lib/mongodb";
import TempChart from "@/components/TempChart";
import HumidityChart from "@/components/HumidityChart";

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
  const readings = await db
    .collection<Reading>("readings")
    .find({})
    .sort({ ts: -1 })
    .limit(10)
    .toArray();

  return (
    <main className="container py-4">
      <h1 className="text-center mb-4">
        <i className="fa-solid fa-temperature-high me-2"></i>
        Monitoramento ESP32 (DHT22)
      </h1>

      {/* grid responsivo: 1 coluna no celular, 2 no desktop */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white">
              <i className="fa-solid fa-fire me-2"></i>Temperatura
            </div>
            <div className="card-body">
              <TempChart deviceId="esp32-lab" intervalMs={15000} points={60} />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-info text-white">
              <i className="fa-solid fa-droplet me-2"></i>Umidade
            </div>
            <div className="card-body">
              <HumidityChart deviceId="esp32-lab" intervalMs={15000} points={60} />
            </div>
          </div>
        </div>
      </div>

      {/* tabela responsiva */}
      <div className="card shadow-sm">
        <div className="card-header bg-secondary text-white">
          <i className="fa-solid fa-list me-2"></i>Últimas Leituras
        </div>
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
                    <td>{new Date(r.ts).toLocaleString()}</td>
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