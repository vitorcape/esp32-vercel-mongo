// src/app/graficos/page.tsx
import TempChart from "@/components/TempChart";
import HumidityChart from "@/components/HumidityChart";
import ForecastCompareChart from "@/components/ForecastCompareChart";
import ChartCard from "@/components/ChartCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ChartsPage() {
  return (
    <div className="container py-4">
      <section className="chart-card mb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <h2 className="m-0"><i className="fa-solid fa-chart-simple"></i> Gráficos</h2>
          <span className="chart-legend"><i className="fa-solid fa-circle-info me-2"></i>Atualiza automaticamente</span>
        </div>
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <span className="chart-legend fw-normal mt-2">Catanduva, SP</span>
        </div>
      </section>

      <section className="row g-3">
        <div className="col-12 col-lg-6">
          <ChartCard title="Temperatura — últimas 2h" icon={<i className="fa-solid fa-fire"></i>} badge="5 min">
            <TempChart deviceId="esp32-lab" intervalMs={15000} />
          </ChartCard>
        </div>
        <div className="col-12 col-lg-6">
          <ChartCard title="Umidade — últimas 2h" icon={<i className="fa-solid fa-droplet"></i>} badge="5 min">
            <HumidityChart deviceId="esp32-lab" intervalMs={15000} />
          </ChartCard>
        </div>

        <div className="col-12">
          <ChartCard
            title="Comparativo (Hoje) — Previsão × Medido"
            icon={<i className="fa-solid fa-arrows-left-right-to-line"></i>}
            badge="1 hora"
          >
            <ForecastCompareChart deviceId="esp32-lab" refreshMs={60_000} />
          </ChartCard>
        </div>
      </section>
    </div>
  );
}