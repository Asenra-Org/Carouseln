import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Toaster } from "sonner";
import { auth } from "../../lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { Menu } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  currentPath?: string;
  noSidebar?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentPath, noSidebar = false }) => {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && window.location.pathname !== "/login" && window.location.pathname !== "/signup" && window.location.pathname !== "/forgot-password") {
        window.location.href = "/login";
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-gold)]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      {!noSidebar && (
        <>
          <Sidebar currentPath={currentPath} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity" 
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Mobile top header bar */}
          <header className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b-4 border-black bg-white flex items-center justify-between px-6 z-30">
            <span className="text-[18px] font-black text-black uppercase tracking-tight">Carouseln</span>
            <button 
              onClick={() => setSidebarOpen(true)}
              className="border-2 border-black bg-[#FFB800] p-1.5 shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] cursor-pointer"
            >
              <Menu size={20} strokeWidth={3} />
            </button>
          </header>
        </>
      )}
      
      <main className={`flex-1 flex flex-col ${!noSidebar ? "lg:ml-[240px] pt-16 lg:pt-0" : ""}`}>
        {children}
      </main>
      
      <Toaster 
        theme="light" 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'white',
            border: '4px solid black',
            borderRadius: '0px',
            color: 'black',
            fontFamily: 'var(--font-ui)',
            fontWeight: 'bold',
            boxShadow: '4px 4px 0px 0px #000',
          },
          classNames: {
            success: 'border-black text-black bg-[var(--color-green)]',
            error: 'border-black text-black bg-[var(--color-pink)]',
            warning: 'border-black text-black bg-[var(--color-gold)]',
            info: 'border-black text-black bg-white',
          }
        }}
      />
    </div>
  );
};
