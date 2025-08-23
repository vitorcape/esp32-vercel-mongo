// src/app/layout.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Casa do Vitor Capelli",
  description: "Monitoramento ESP32 (DHT22)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className="bg-white text-dark">
        <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom sticky-top">
          <div className="container">
            <Link className="navbar-brand d-flex align-items-center gap-2" href="/">
              <i className="fa-solid fa-house-chimney"></i>
              <span>Casa do Vitor Capelli</span>
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navMain"
              aria-controls="navMain"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navMain">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <a className="nav-link" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">
                    <i className="fa-brands fa-vercel me-1"></i> Vercel
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="https://cloud.mongodb.com" target="_blank" rel="noreferrer">
                    <i className="fa-solid fa-database me-1"></i> Atlas
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}