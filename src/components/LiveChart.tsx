"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

type Reading = {
  deviceId: string;
  temperature: number;
  humidity: number;
  ts: string; // vem como string no JSON
};

export default function LiveChart({
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
    // ordenar do mais antigo para o mais recente (e formatar eixo X)
    const ordered = json.reverse().map((r) => ({
      ...r,
      ts: new Date(r.ts).toLocaleTimeString("pt-BR", {timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }),
    }));
    setData(ordered);
  }

  useEffect(() => {
    fetchData(); // primeira carga
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [deviceId, intervalMs, points]);

  return (
    <div style={{ width: "100%", height: 360 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" />
          <YAxis yAxisId="left" domain={["auto", "auto"]} />
          <YAxis yAxisId="right" orientation="right" domain={["auto", "auto"]} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="temperature" name="°C" dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="humidity" name="Umidade %" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}