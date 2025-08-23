"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

type Reading = {
  temperature: number;
  humidity: number;
  ts: string;      // ISO string vinda da API
  deviceId: string;
};

export default function TempChart({
  deviceId = "esp32-lab",
  intervalMs = 15000,   // frequência de atualização da UI (não do ESP32)
}: {
  deviceId?: string;
  intervalMs?: number;
}) {
  const [data, setData] = useState<Reading[]>([]);

  const fetchData = useCallback(async () => {
    const sinceISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24h
    const res = await fetch(`/api/readings?deviceId=${encodeURIComponent(deviceId)}&since=${sinceISO}`, { cache: "no-store" });
    const json: Reading[] = await res.json();
    const ordered = json
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
      .map((r) => ({ ...r, ts: new Date(r.ts).toLocaleTimeString("pt-BR", {timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }) }));
    setData(ordered);
  }, [deviceId]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [fetchData, intervalMs]);

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" />
          <YAxis domain={([min, max]) => [min - 0.5, max + 0.5]} label={{ value: "°C", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="temperature" name="Temperatura (°C)" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}