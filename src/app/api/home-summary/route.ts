// src/app/api/home-summary/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSunInfo } from "@/lib/sun";

const TZ = "America/Sao_Paulo";

function startOfTodaySP(): Date {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  now.setHours(0, 0, 0, 0);
  return new Date(now.toLocaleString("en-US", { timeZone: TZ }));
}

function parseHM(isoLocal: string) {
  const [h, m] = isoLocal.slice(11, 16).split(":").map(Number);
  return { h, m };
}
function toMinutes(h: number, m: number) {
  return h * 60 + m;
}

export async function GET() {
  const db = await getDb();

  // último registro
  const [last] = await db
    .collection("readings")
    .find({})
    .sort({ ts: -1 })
    .limit(1)
    .toArray();

  // stats do dia
  const since = startOfTodaySP();
  const statsAgg = await db
    .collection("readings")
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

  const stats = statsAgg[0] ?? { tMin: null, tMax: null, hMin: null, hMax: null, count: 0 };

  // sol (strings locais "YYYY-MM-DDTHH:MM")
  const sun = await getSunInfo();
  const sunriseLabel = sun.sunrise.slice(11, 16);
  const sunsetLabel  = sun.sunset.slice(11, 16);

  const nowSP = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  const nowMin = toMinutes(nowSP.getHours(), nowSP.getMinutes());
  const { h: sh, m: sm } = parseHM(sun.sunrise);
  const { h: eh, m: em } = parseHM(sun.sunset);
  const isDay = nowMin >= toMinutes(sh, sm) && nowMin < toMinutes(eh, em);

  return NextResponse.json({
    last,                   // {_id, deviceId, temperature, humidity, ts}
    stats,                  // {tMin,tMax,hMin,hMax,count}
    sunriseLabel,
    sunsetLabel,
    isDay,
    nowISO: nowSP.toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}