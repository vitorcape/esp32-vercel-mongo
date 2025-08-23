// src/app/layout.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Casa do Vitor Capelli",
  description: "Monitoramento residencial — ESP32 + DHT22",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-sky text-white">
        <nav className="navbar navbar-expand-lg navbar-translucent border-0">
          <div className="container">
            <Link className="navbar-brand text-white fw-semibold d-flex align-items-center gap-2" href="/">
              <i className="fa-solid fa-house-chimney"></i>
              <span>Casa do Vitor Capelli</span>
            </Link>
            <div className="ms-auto d-flex align-items-center gap-3">
              {/* botões de navegação futuros */}
              <Link className="btn btn-sm btn-outline-light rounded-pill px-3" href="/charts">
                <i className="fa-solid fa-chart-line me-2"></i>Gráficos
              </Link>
              <a
                className="btn btn-sm btn-outline-light rounded-pill px-3"
                href="https://cloud.mongodb.com"
                target="_blank"
                rel="noreferrer"
                title="MongoDB Atlas"
              >
                <i className="fa-solid fa-database me-2"></i>Atlas
              </a>
            </div>
          </div>
        </nav>
        <main className="content-wrapper">{children}</main>
      </body>
    </html>
  );
}