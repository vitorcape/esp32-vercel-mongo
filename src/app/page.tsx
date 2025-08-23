import { getDb } from "@/lib/mongodb";
import LiveChart from "@/components/LiveChart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // já está; mantém assim

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
    <main className="p-6 space-y-6">
      <h1>Leituras do ESP32 (DHT22)</h1>

      {/* Gráfico atualizando sozinho */}
      <LiveChart deviceId="esp32-lab" intervalMs={15000} points={60} />

      <h2>Últimas leituras</h2>
      <ul>
        {readings.map((r, i) => (
          <li key={r._id ?? i}>
            {new Date(r.ts).toLocaleString()} — {r.deviceId} —{" "}
            {r.temperature.toFixed(1)}°C / {r.humidity.toFixed(0)}%
          </li>
        ))}
      </ul>
    </main>
  );
}