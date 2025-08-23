import { getDb } from "@/lib/mongodb";
import LiveChart from "@/components/LiveChart";

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
      <h1 className="text-center mb-4">📊 Monitoramento ESP32 (DHT22)</h1>

      {/* card com gráfico */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          Temperatura e Umidade
        </div>
        <div className="card-body">
          <LiveChart deviceId="esp32-lab" intervalMs={15000} points={60} />
        </div>
      </div>

      {/* tabela responsiva */}
      <div className="card shadow-sm">
        <div className="card-header bg-secondary text-white">
          Últimas Leituras
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