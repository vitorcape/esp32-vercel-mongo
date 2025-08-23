// src/components/TempChart.tsx
"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

type Reading = {
  temperature: number;
  humidity: number;
  ts: string; // string no JSON
  deviceId: string;
};

export default function TempChart({
  deviceId = "esp32-lab",
  intervalMs = 15000,
  points = 60,
}: {
  deviceId?: string;
  intervalMs?: number;
  points?: number;
}) {
  const [data, setData] = useState<Reading[]>([]);

  async function fetchData() {
    const res = await fetch(`/api/readings?deviceId=${deviceId}&limit=${points}`);
    const json: Reading[] = await res.json();
    const ordered = json.reverse().map((r) => ({
      ...r,
      ts: new Date(r.ts).toLocaleTimeString(),
    }));
    setData(ordered);
  }

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [deviceId, intervalMs, points]);

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" />
          <YAxis domain={["auto", "auto"]} label={{ value: "°C", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="temperature" name="Temperatura (°C)" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}