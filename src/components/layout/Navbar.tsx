import React, { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { auth } from "../../lib/firebase/client";
import { onAuthStateChanged, signOut } from "firebase/auth";

export const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface border-b-4 border-border shadow-[0px_4px_0px_0px_var(--color-border)]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group no-underline">
          <img src="/logo.png" alt="Carouseln Logo" className="w-10 h-10 border-2 border-border object-contain bg-white shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-text-primary uppercase leading-tight mb-0.5">
              An{" "}
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); window.open("https://asenra.in", "_blank", "noopener,noreferrer"); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); window.open("https://asenra.in", "_blank", "noopener,noreferrer"); } }}
                className="hover:text-[var(--color-gold)] transition-colors cursor-pointer underline focus:outline-none focus:ring-2 focus:ring-border"
                aria-label="Visit Asenra website (opens in new tab)"
              >
                Asenra
              </span>{" "}Product
            </span>
            <span className="text-[24px] font-bold text-text-primary leading-none uppercase">
              Carouseln
            </span>
          </div>
        </a>

        <div className="hidden lg:flex items-center gap-6">
          <a href="/#features" className="text-[14px] font-bold text-text-primary uppercase hover:underline">
            Features
          </a>
          <a href="/#pricing" className="text-[14px] font-bold text-text-primary uppercase hover:underline">
            Pricing
          </a>
          <a href="/#how-it-works" className="text-[14px] font-bold text-text-primary uppercase hover:underline">
            How it Works
          </a>
          <a href="/privacy" className="text-[14px] font-bold text-text-primary uppercase hover:underline">
            Privacy
          </a>
          <a href="/terms" className="text-[14px] font-bold text-text-primary uppercase hover:underline">
            Terms
          </a>
          <a href="/about" className="text-[14px] font-bold text-text-primary uppercase hover:underline">
            About Us
          </a>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-24 h-10 animate-pulse bg-surface-2 border-2 border-border" />
          ) : user ? (
            <>
              <a href="/dashboard">
                <Button variant="primary" className="h-10 py-0 text-[14px]">Dashboard</Button>
              </a>
              <Button variant="outline" className="h-10 py-0 text-[14px] hidden sm:block" onClick={handleLogout}>Log Out</Button>
            </>
          ) : (
            <>
              <a href="/login" className="hidden sm:block">
                <Button variant="outline" className="h-10 py-0 text-[14px] bg-surface text-text-primary">Sign In</Button>
              </a>
              <a href="/signup">
                <Button variant="primary" className="h-10 py-0 text-[14px] bg-[var(--color-gold)] text-text-primary">Get Started</Button>
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
