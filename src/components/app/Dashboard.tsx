import React, { useEffect, useState, useCallback } from "react";
import { Plus, LayoutGrid, FileText, BarChart2, RefreshCw, AlertCircle, Trash2 } from "lucide-react";
import { auth, db } from "../../lib/firebase/client";
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";

type Project = { name: string; colorPrimary: string; [key: string]: any };
type Carousel = { id: string; title: string; slides?: any[]; status: string; createdAt?: { seconds: number } };

export const Dashboard = () => {
  const [status, setStatus] = useState<"loading" | "no-brand" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [userName, setUserName] = useState("");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [carousels, setCarousels] = useState<Carousel[]>([]);

  const withTimeout = <T,>(promise: Promise<T>, ms: number = 10000): Promise<T> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Database connection timed out. Please check your internet connection or firewalls."));
      }, ms);
      promise.then(
        (res) => {
          clearTimeout(timer);
          resolve(res);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        }
      );
    });
  };

  const fetchData = useCallback(async (uid: string) => {
    setStatus("loading");
    try {
      const userDoc = await withTimeout(getDoc(doc(db, "users", uid)), 8000);
      if (!userDoc.exists()) {
        setStatus("no-brand");
        return;
      }
      const userData = userDoc.data();
      setUserName(userData.name || auth.currentUser?.displayName || "Creator");

      if (!userData.activeProjectId) {
        setStatus("no-brand");
        return;
      }

      const [projectDoc, carouselsSnap] = await withTimeout(
        Promise.all([
          getDoc(doc(db, "projects", userData.activeProjectId)),
          getDocs(query(collection(db, "carousels"), where("userId", "==", uid))),
        ]),
        10000
      );

      if (!projectDoc.exists()) {
        setStatus("no-brand");
        return;
      }

      setActiveProject({ id: projectDoc.id, ...projectDoc.data() } as Project);
      setCarousels(carouselsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Carousel)));
      setStatus("ready");
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      let errMsg = err.message || "Unknown error";
      if (
        err.code === "not-found" || 
        errMsg.toLowerCase().includes("not_found") || 
        errMsg.toLowerCase().includes("not found")
      ) {
        errMsg = "Firestore Database was not found. Please click 'Create Database' under Firestore Database in your Firebase Console for project 'asenra-carousel-studio'.";
      }
      setErrorMsg(errMsg);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchData(user.uid);
      } else {
        window.location.href = "/login";
      }
    });
    return () => unsub();
  }, [fetchData]);

  // ── Loading ─────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#FAFAF8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-black border-t-[#FFB800] rounded-full animate-spin" />
          <p className="text-[14px] font-black text-black uppercase tracking-wider">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#FAFAF8]">
        <div className="max-w-md w-full border-4 border-black bg-white shadow-[8px_8px_0px_0px_#000] p-8 text-center">
          <div className="w-14 h-14 bg-red-500 border-4 border-black flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-white" />
          </div>
          <h2 className="text-[22px] font-black text-black mb-2 uppercase">Failed to Load</h2>
          <p className="text-[13px] font-bold text-gray-600 mb-6 break-all">{errorMsg}</p>
          <button
            onClick={() => auth.currentUser && fetchData(auth.currentUser.uid)}
            className="flex items-center gap-2 mx-auto bg-[#FFB800] border-4 border-black px-6 py-3 text-[14px] font-black uppercase shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] transition-all"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── No Brand ─────────────────────────────────────────────
  if (status === "no-brand") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#FAFAF8]">
        <div className="max-w-lg w-full border-4 border-black bg-white shadow-[8px_8px_0px_0px_#000] p-10 text-center">
          <div className="w-16 h-16 bg-[#FFB800] border-4 border-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_#000]">
            <span className="text-[28px]">🚀</span>
          </div>
          <h2 className="text-[28px] font-black text-black mb-3 uppercase leading-tight">
            Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}!
          </h2>
          <p className="text-[15px] font-bold text-gray-600 mb-8">
            You don't have a brand set up yet. Create your first brand to start generating premium carousels.
          </p>
          <a
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-[#FFB800] border-4 border-black px-8 py-4 text-[16px] font-black uppercase shadow-[6px_6px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] transition-all"
          >
            <Plus size={20} strokeWidth={3} />
            Create Your First Brand
          </a>
        </div>
      </div>
    );
  }

  // ── Ready ─────────────────────────────────────────────
  const firstName = userName.split(" ")[0];
  const totalSlides = carousels.reduce((acc, c) => acc + (c.slides?.length || 0), 0);

  return (
    <div className="p-4 lg:p-8 w-full max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-4 pt-4 lg:pt-8">
        <div>
          <p className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-1">
            {activeProject?.name}
          </p>
          <h1 className="text-[28px] lg:text-[36px] font-black text-black uppercase leading-none">
            Welcome back, {firstName}
          </h1>
        </div>
        <a
          href="/generator"
          className="inline-flex items-center gap-2 bg-[#FFB800] border-4 border-black px-6 py-3 text-[14px] font-black uppercase shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] transition-all"
        >
          <Plus size={16} strokeWidth={3} />
          Create Carousel
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {[
          { icon: LayoutGrid, label: "Total Carousels", value: carousels.length, bg: "bg-white" },
          { icon: BarChart2, label: "Est. Impressions", value: (carousels.length * 1250).toLocaleString(), bg: "bg-[#FFB800]" },
          { icon: FileText, label: "Generated Slides", value: totalSlides, bg: "bg-[#FF6B6B]" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} border-4 border-black p-6 shadow-[5px_5px_0px_0px_#000]`}>
            <div className="flex items-center gap-2 mb-3">
              <stat.icon size={16} strokeWidth={3} className="text-black" />
              <span className="text-[12px] font-black text-black uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-[44px] font-black text-black leading-none">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Carousels */}
      <div>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[20px] font-black text-black uppercase">Recent Carousels</h2>
        </div>

        {carousels.length === 0 ? (
          <div className="border-4 border-dashed border-black bg-white p-12 text-center">
            <p className="text-[16px] font-black text-gray-400 uppercase mb-4">No carousels yet</p>
            <a
              href="/generator"
              className="inline-flex items-center gap-2 bg-black text-white border-4 border-black px-6 py-3 text-[13px] font-black uppercase hover:bg-[#FFB800] hover:text-black transition-colors"
            >
              <Plus size={14} strokeWidth={3} />
              Generate First Carousel
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {carousels.slice(0, 9).map((carousel) => (
              <div
                key={carousel.id}
                onClick={() => window.location.href = `/generator?id=${carousel.id}`}
                className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all cursor-pointer overflow-hidden"
              >
                <div
                  className="h-28 border-b-4 border-black flex items-end p-4 relative"
                  style={{ backgroundColor: (activeProject?.colorPrimary || "#FFB800") + "30" }}
                >
                  <span
                    className="text-[11px] font-black uppercase px-2 py-0.5 border-2 border-black"
                    style={{ backgroundColor: carousel.status === "complete" ? "#51CF66" : "#E9ECEF" }}
                  >
                    {carousel.status === "complete" ? "Ready" : "Draft"}
                  </span>

                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm("Are you sure you want to delete this carousel?")) {
                        try {
                          await deleteDoc(doc(db, "carousels", carousel.id));
                          setCarousels(prev => prev.filter(c => c.id !== carousel.id));
                          toast.success("Carousel deleted successfully!");
                        } catch (err: any) {
                          toast.error("Failed to delete: " + err.message);
                        }
                      }
                    }}
                    className="absolute top-3 right-3 z-10 p-1.5 bg-red-500 border-2 border-black hover:bg-black hover:text-red-500 transition-colors shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#000] cursor-pointer flex items-center justify-center"
                    title="Delete Carousel"
                  >
                    <Trash2 size={12} className="text-white hover:text-red-500" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-[15px] font-black text-black uppercase leading-tight mb-2 line-clamp-2">
                    {carousel.title || "Untitled"}
                  </p>
                  <p className="text-[12px] font-bold text-gray-500">
                    {carousel.slides?.length || 0} slides ·{" "}
                    {carousel.createdAt
                      ? new Date(carousel.createdAt.seconds * 1000).toLocaleDateString()
                      : "Just now"}
                  </p>
                </div>
              </div>
            ))}

            {/* New carousel CTA */}
            <a
              href="/generator"
              className="border-4 border-dashed border-black bg-white flex flex-col items-center justify-center p-8 gap-3 hover:bg-[#FFB800] hover:border-solid transition-all group min-h-[180px]"
            >
              <div className="w-10 h-10 border-4 border-black bg-white flex items-center justify-center group-hover:bg-black group-hover:text-[#FFB800] transition-colors">
                <Plus size={20} strokeWidth={3} />
              </div>
              <span className="text-[13px] font-black text-black uppercase">New Carousel</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
