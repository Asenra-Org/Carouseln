import React from "react";

export const Footer = () => {
  return (
    <footer className="border-t-4 border-black bg-[var(--color-bg)] py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-3 text-center md:text-left">
          <a href="https://asenra.in" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center md:justify-start gap-2 border-2 border-black bg-[var(--color-surface)] px-3 py-2 shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[0px_0px_0px_0px_#000] transition-all w-fit mx-auto md:mx-0 no-underline text-black">
            <span className="text-[12px] uppercase tracking-widest font-bold">BY</span>
            <span className="text-[18px] font-bold uppercase tracking-wider">Asenra</span>
          </a>
          <div className="flex items-center gap-2.5 mt-2">
            <p className="text-[14px] font-bold text-black uppercase m-0">
              © 2026 Carouseln by Asenra. All rights reserved.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <a href="/privacy" className="text-[14px] font-bold uppercase text-black border-2 border-transparent hover:border-black hover:bg-[var(--color-surface)] px-2 py-1 transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" className="text-[14px] font-bold uppercase text-black border-2 border-transparent hover:border-black hover:bg-[var(--color-surface)] px-2 py-1 transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
};
