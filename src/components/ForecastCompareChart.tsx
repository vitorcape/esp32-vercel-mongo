// src/components/ForecastCompareChart.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

type ForecastItem = { iso: string; hourLabel: string; temperature: number | null; humidity?: number | null };
type Reading = { ts: string; temperature: number; deviceId: string };

type ApiForecastResponse = {
  day: string;
  items: ForecastItem[];
};

const TZ = "America/Sao_Paulo";

/** Converte ISO -> {hour, minute} no fuso de SP (24h) */
function getHourMinuteInSP(iso: string): { hour: number; minute: number } {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const hh = Number(parts.find(p => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find(p => p.type === "minute")?.value ?? "0");
  return { hour: hh, minute: mm };
}

/** Arredonda para a hora mais próxima (0–23) no fuso de SP */
function roundedHourIndexSP(iso: string): number {
  const { hour, minute } = getHourMinuteInSP(iso);
  return (hour + (minute >= 30 ? 1 : 0)) % 24;
}

/** Label "HH:00" de um índice 0–23 */
function hourLabel(index: number): string {
  return `${String(index).padStart(2, "0")}:00`;
}

/** Início do dia (00:00) no fuso de SP em ISO UTC */
function sinceMidnightISO(): string {
  const nowSP = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  const start = new Date(nowSP);
  start.setHours(0, 0, 0, 0);
  return new Date(start.toLocaleString("en-US", { timeZone: TZ })).toISOString();
}

export default function ForecastCompareChart({
  deviceId = "esp32-lab",
  refreshMs = 60_000,
}: {
  deviceId?: string;
  refreshMs?: number;
}) {
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const sinceISO = useMemo(() => sinceMidnightISO(), []);

  const fetchAll = useCallback(async () => {
    // 1) previsão (00..23) — já no fuso de SP
    const fResp = await fetch("/api/forecast", { cache: "no-store" });
    const fJson = (await fResp.json()) as ApiForecastResponse;
    const fItems = Array.isArray(fJson.items) ? fJson.items : [];

    // 2) leituras desde 00:00 (pede até 500 pontos)
    const rResp = await fetch(
      `/api/readings?deviceId=${encodeURIComponent(deviceId)}&since=${sinceISO}&limit=500`,
      { cache: "no-store" }
    );
    const rJson = (await rResp.json()) as Reading[];

    if ((window as unknown as { __debug?: boolean }).__debug) {
      console.log("[compare] sinceISO:", sinceISO);
      console.log("[compare] forecast items (#):", fItems.length, fItems.slice(0, 3));
      console.log("[compare] readings (#):", rJson.length, rJson.slice(0, 3));
    }

    setForecast(fItems);
    setReadings(rJson);
  }, [deviceId, sinceISO]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, refreshMs);
    return () => clearInterval(id);
  }, [fetchAll, refreshMs]);

  // Monta 24 buckets (0..23) para previsão e medido
  const data = useMemo(() => {
    const forecastByHour = new Array<number | null>(24).fill(null);
    forecast.forEach((it) => {
      // Open‑Meteo retorna "YYYY-MM-DDTHH:00" já local → HH direto
      const hhStr = it.iso.slice(11, 13);
      const hh = Number(hhStr);
      if (Number.isFinite(hh)) {
        forecastByHour[hh % 24] = typeof it.temperature === "number" ? it.temperature : null;
      }
    });

    const measuredByHour = new Array<number | null>(24).fill(null);
    readings.forEach((r) => {
      const idx = roundedHourIndexSP(r.ts);
      measuredByHour[idx] = r.temperature; // guarda o último valor da hora
    });

    if ((window as unknown as { __debug?: boolean }).__debug) {
      const filledMeasured = measuredByHour
        .map((v, i) => (v == null ? null : { h: i, v }))
        .filter(Boolean);
      console.log("[compare] measuredByHour filled:", filledMeasured);
    }

    const rows: Array<{ hour: string; forecastTemp: number | null; measuredTemp: number | null }> = [];
    for (let h = 0; h < 24; h++) {
      rows.push({
        hour: hourLabel(h),
        forecastTemp: forecastByHour[h],
        measuredTemp: measuredByHour[h],
      });
    }
    return rows;
  }, [forecast, readings]);

  return (
    <div style={{ width: "100%", height: 360 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis
            domain={([min, max]) => [
              Number.isFinite(min as number) ? (min as number) - 2 : 0,
              Number.isFinite(max as number) ? (max as number) + 2 : 0,
            ]}
            label={{ value: "°C", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="forecastTemp"
            name="Previsão (°C)"
            stroke="#0d6efd"    // azul
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="measuredTemp"
            name="Medido (°C)"
            stroke="#dc3545"    // vermelho
            dot={{ r: 3 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}