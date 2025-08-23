// src/app/api/readings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 500);
  const since = searchParams.get("since"); // ISO date opcional

  const q: any = {};
  if (deviceId) q.deviceId = deviceId;
  if (since) q.ts = { $gte: new Date(since) };

  const db = await getDb();
  const docs = await db
    .collection("readings")
    .find(q)
    .sort({ ts: -1 })
    .limit(limit)
    .toArray();

  return NextResponse.json(docs);
}