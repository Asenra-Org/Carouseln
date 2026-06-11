import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Toaster } from "sonner";
import { auth } from "../../lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";

interface AppShellProps {
  children: React.ReactNode;
  currentPath?: string;
  noSidebar?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentPath, noSidebar = false }) => {
  const [loading, setLoading] = useState(true);

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
      {!noSidebar && <Sidebar currentPath={currentPath} />}
      
      <main className={`flex-1 flex flex-col ${!noSidebar ? "ml-[240px]" : ""}`}>
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
