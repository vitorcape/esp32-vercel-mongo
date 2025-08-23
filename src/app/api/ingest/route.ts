// src/app/api/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// Garanta runtime Node.js (necessário pro driver do Mongo)
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.DEVICE_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // ESP32 deve enviar esse header x-api-key com o mesmo valor da sua .env
  }

  let data: any;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { deviceId, temperature, humidity, ts } = data;

  if (typeof temperature !== "number" || typeof humidity !== "number") {
    return NextResponse.json({ error: "temperature/humidity devem ser números" }, { status: 422 });
  }

  const doc = {
    deviceId: deviceId || "esp32-001",
    temperature,
    humidity,
    ts: ts ? new Date(ts) : new Date(),
  };

  const db = await getDb();
  await db.collection("readings").insertOne(doc);

  return NextResponse.json({ ok: true });
}