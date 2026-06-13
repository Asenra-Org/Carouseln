import React, { useState, useEffect } from "react";
import { Sparkles, LayoutGrid, Settings2, LogOut, ChevronDown, Plus, X } from "lucide-react";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";
import { auth, db } from "../../lib/firebase/client";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Generate", href: "/generator", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

export const Sidebar = ({
  currentPath = "/dashboard",
  isOpen = false,
  onClose,
}: {
  currentPath?: string;
  isOpen?: boolean;
  onClose?: () => void;
}) => {
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [user, setUser] = useState({ name: "", email: "", initials: "?", plan: "Free" });
  const [brand, setBrand] = useState<{ name: string; color: string } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;
      setUser({
        name: currentUser.displayName || "User",
        email: currentUser.email || "",
        initials: (currentUser.displayName || currentUser.email || "U").substring(0, 2).toUpperCase(),
        plan: "Free",
      });
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data().activeProjectId) {
          const projectDoc = await getDoc(doc(db, "projects", userDoc.data().activeProjectId));
          if (projectDoc.exists()) {
            setBrand({
              name: projectDoc.data().name || "My Brand",
              color: projectDoc.data().colorPrimary || "#FFB800",
            });
          }
        }
      } catch (e) {
        // silently fail — sidebar brand is non-critical
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  return (
    <aside className={cn(
      "w-[240px] h-screen fixed top-0 left-0 border-r-4 border-black bg-white flex flex-col z-40 transition-transform duration-300 lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-5 border-b-4 border-black flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 text-[20px] font-black text-black tracking-tight uppercase no-underline">
          <img src="/logo.png" alt="Carouseln Logo" className="w-8 h-8 border-2 border-black object-contain bg-white shrink-0" />
          Carouseln
        </a>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden border-2 border-black bg-[#FFB800] p-1.5 shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] cursor-pointer flex items-center justify-center"
          >
            <X size={16} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Brand Switcher */}
      <div className="p-3 border-b-4 border-black">
        <div className="relative">
          <button
            onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 bg-[#FFB800] border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 border-2 border-black shrink-0"
                style={{ backgroundColor: brand?.color || "#FFB800" }}
              />
              <span className="text-[13px] font-black text-black truncate max-w-[110px] uppercase">
                {brand ? brand.name : "No Brand"}
              </span>
            </div>
            <ChevronDown size={16} className="text-black shrink-0" strokeWidth={3} />
          </button>

          {brandDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] z-50">
              {brand && (
                <div className="flex items-center gap-2 p-2.5 bg-[#FFB800] border-b-2 border-black">
                  <div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: brand.color }} />
                  <span className="text-[12px] font-black text-black uppercase">{brand.name}</span>
                </div>
              )}
              <a
                href="/onboarding"
                className="w-full flex items-center gap-2 p-2.5 hover:bg-black hover:text-white text-black transition-colors"
                onClick={() => setBrandDropdownOpen(false)}
              >
                <Plus size={16} strokeWidth={3} />
                <span className="text-[12px] font-black uppercase">New Brand</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 border-2 text-[13px] font-black uppercase transition-all duration-100",
                isActive
                  ? "border-black bg-[#FFB800] text-black shadow-[3px_3px_0px_0px_#000]"
                  : "border-transparent text-black hover:border-black hover:bg-gray-50 hover:shadow-[3px_3px_0px_0px_#000]"
              )}
            >
              <item.icon size={17} strokeWidth={3} />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t-4 border-black p-3 flex flex-col gap-3">

        <div className="flex items-center gap-2.5 bg-gray-50 border-2 border-black p-2">
          <div className="w-8 h-8 bg-black flex items-center justify-center shrink-0">
            <span className="text-[12px] font-black text-[#FFB800] uppercase">{user.initials}</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[12px] font-black text-black truncate uppercase">{user.name || "..."}</span>
            <span className="text-[11px] font-bold text-gray-500 truncate">{user.email}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 justify-center text-black hover:bg-red-500 hover:text-white border-2 border-black p-2 text-[12px] font-black uppercase transition-colors w-full"
        >
          <LogOut size={14} strokeWidth={3} />
          Log Out
        </button>
      </div>
    </aside>
  );
};
