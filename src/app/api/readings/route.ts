// src/app/api/readings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { Filter } from "mongodb";

export const runtime = "nodejs";

type ReadingDoc = {
  deviceId: string;
  temperature: number;
  humidity: number;
  ts: Date;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId") ?? undefined;
  const limitParam = Number(searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 50;
  const since = searchParams.get("since"); // ISO opcional

  const q: Filter<ReadingDoc> = {};
  if (deviceId) q.deviceId = deviceId;
  if (since) q.ts = { $gte: new Date(since) };

  const db = await getDb();
  const docs = await db
    .collection<ReadingDoc>("readings")
    .find(q)
    .sort({ ts: -1 })
    .limit(limit)
    .toArray();

  return NextResponse.json(docs);
}