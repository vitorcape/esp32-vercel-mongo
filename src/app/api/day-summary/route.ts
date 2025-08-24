// src/app/api/day-summary/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSunInfoFor } from "@/lib/sun";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";

function startOfDaySP(d: Date) {
  const x = new Date(new Date(d).toLocaleString("en-US", { timeZone: TZ }));
  x.setHours(0, 0, 0, 0);
  return new Date(x.toLocaleString("en-US", { timeZone: TZ }));
}
function endOfDaySP(d: Date) {
  const x = startOfDaySP(d);
  x.setHours(23, 59, 59, 999);
  return new Date(x.toLocaleString("en-US", { timeZone: TZ }));
}
function fmtYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function weekdayPT(d: Date) {
  return d.toLocaleDateString("pt-BR", { weekday: "long", timeZone: TZ });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // "YYYY-MM-DD" no fuso de SP
    const base = dateStr ? new Date(`${dateStr}T12:00:00-03:00`) : new Date();
    const dayStart = startOfDaySP(base);
    const dayEnd = endOfDaySP(base);

    const db = await getDb();

    // agregação do dia
    const agg = await db.collection("readings").aggregate([
      { $match: { ts: { $gte: dayStart, $lte: dayEnd } } },
      {
        $group: {
          _id: null,
          tMin: { $min: "$temperature" },
          tMax: { $max: "$temperature" },
          hAvg: { $avg: "$humidity" },
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    const stats = agg[0] ?? { tMin: null, tMax: null, hAvg: null, count: 0 };

    // nascer/pôr do sol para o dia
    const sun = await getSunInfoFor(fmtYMD(dayStart));
    const sunriseLabel = sun.sunrise.slice(11, 16);
    const sunsetLabel  = sun.sunset.slice(11, 16);

    return NextResponse.json({
      day: fmtYMD(dayStart),
      weekday: weekdayPT(dayStart), // "segunda-feira" etc.
      sunriseLabel,
      sunsetLabel,
      stats, // {tMin,tMax,hAvg,count}
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[day-summary]", e);
    return NextResponse.json({ error: "day-summary failed" }, { status: 500 });
  }
}