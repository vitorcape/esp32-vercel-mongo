// src/components/NowBadge.tsx
import { getDb } from "@/lib/mongodb";
import { getSunInfo } from "@/lib/sun";

type Reading = {
  temperature: number;
  ts: Date;
};

const TZ = "America/Sao_Paulo";

export default async function NowBadge() {
  // última leitura
  const db = await getDb();
  const [last] = await db
    .collection<Reading>("readings")
    .find({})
    .sort({ ts: -1 })
    .limit(1)
    .toArray();

  // dia/noite (Catanduva/SP)
  const sun = await getSunInfo();
  const nowSP = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  const isDay = nowSP >= new Date(sun.sunrise) && nowSP < new Date(sun.sunset);

  const icon = isDay ? "fa-sun" : "fa-moon";
  const temp = last ? `${last.temperature.toFixed(1)}°C` : "--°C";

  return (
    <span className="badge bg-light text-dark rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2">
      <i className={`fa-solid ${icon}`}></i>
      <span className="fw-semibold">{temp}</span>
    </span>
  );
}