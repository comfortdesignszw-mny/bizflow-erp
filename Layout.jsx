import React from "react";
import Sidebar from "./components/layout/Sidebar";

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
        }
        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
        }
      `}</style>
      <Sidebar currentPageName={currentPageName} />
      <main className="lg:pl-[260px] min-h-screen transition-all duration-300 flex flex-col">
        <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-6 flex-1">
          {children}
        </div>
        <footer className="lg:pl-0 border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-500">
          © 2026 BizOps ERP. Designed with love 🩵 by Comfort Designs, +263772824132
        </footer>
      </main>
    </div>
  );
}