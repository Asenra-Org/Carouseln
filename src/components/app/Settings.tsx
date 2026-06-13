import React, { useState, useCallback } from "react";
import { Save, AlertTriangle, RefreshCw, AlertCircle, Globe, Trash2, UserX, Download } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "../../lib/firebase/client";
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { onAuthStateChanged, deleteUser } from "firebase/auth";

type FormData = {
  name: string; website: string; industry: string;
  vibe: string; tone: string; colorPrimary: string; colorBg: string;
  logoUrl: string; brandContext: string;
};

type Status = "loading" | "no-brand" | "ready" | "error";

export const Settings = () => {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleteEmail, setDeleteEmail] = useState("");

  const [formData, setFormData] = useState<FormData>({
    name: "", website: "", industry: "",
    vibe: "Luxury", tone: "Professional", colorPrimary: "#FFB800", colorBg: "#000000",
    logoUrl: "", brandContext: "",
  });
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

  const fetchSettings = useCallback(async (uid: string) => {
    setStatus("loading");
    try {
      const userDoc = await withTimeout(getDoc(doc(db, "users", uid)), 8000);
      if (!userDoc.exists() || !userDoc.data().activeProjectId) {
        setStatus("no-brand");
        return;
      }
      const pId = userDoc.data().activeProjectId;
      setProjectId(pId);
      const projectDoc = await withTimeout(getDoc(doc(db, "projects", pId)), 8000);
      if (!projectDoc.exists()) {
        setStatus("no-brand");
        return;
      }
      const d = projectDoc.data();
      setFormData({
        name: d.name || "",
        website: d.website || "",
        industry: d.industry || "",
        vibe: d.vibe || "Luxury",
        tone: d.tone || "Professional",
        colorPrimary: d.colorPrimary || "#FFB800",
        logoUrl: d.logoUrl || "",
        brandContext: d.brandContext || "",
        colorBg: d.colorBg || "#000000",
      });
      setStatus("ready");
    } catch (err: any) {
      console.error("Settings fetch error:", err);
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

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchSettings(user.uid);
      } else {
        window.location.href = "/login";
      }
    });
    return () => unsub();
  }, [fetchSettings]);

  // ── Handlers ─────────────────────────────────────────
  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      await withTimeout(
        updateDoc(doc(db, "projects", projectId), {
          ...formData,
          updatedAt: serverTimestamp(),
        }),
        10000
      );
      toast.success("Brand settings saved!");
    } catch (e: any) {
      toast.error("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };


  const handleAnalyzeWebsite = async () => {
    if (!formData.website) { toast.error("Enter a website URL first"); return; }
    setAnalyzing(true);
    try {
      const url = formData.website.startsWith("http") ? formData.website : `https://${formData.website}`;
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze");
      setFormData((prev) => ({ ...prev, brandContext: data.context }));
      toast.success("Website analyzed!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (deleteName !== formData.name || !projectId || !auth.currentUser) return;
    setDeleting(true);
    try {
      await withTimeout(deleteDoc(doc(db, "projects", projectId)), 10000);
      await withTimeout(
        updateDoc(doc(db, "users", auth.currentUser.uid), {
          activeProjectId: null,
          onboardingCompleted: false,
        }),
        10000
      );
      toast.success("Brand deleted");
      window.location.href = "/onboarding";
    } catch (e: any) {
      toast.error("Delete failed: " + e.message);
      setDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user || deleteEmail !== user.email) {
      toast.error("Email doesn't match your account email");
      return;
    }
    setDeletingAccount(true);
    try {
      // ── GDPR Art. 17: Erase ALL user carousels first (batch delete) ──
      const carouselsQuery = query(collection(db, "carousels"), where("userId", "==", user.uid));
      const carouselsSnap = await getDocs(carouselsQuery);
      if (!carouselsSnap.empty) {
        const batch = writeBatch(db);
        carouselsSnap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      // ── Delete project and user profile ──
      if (projectId) await withTimeout(deleteDoc(doc(db, "projects", projectId)), 10000);
      await withTimeout(deleteDoc(doc(db, "users", user.uid)), 10000);
      // ── Delete Firebase Auth account ──
      await deleteUser(user);
      toast.success("Account and all associated data permanently deleted");
      window.location.href = "/";
    } catch (e: any) {
      if (e.code === "auth/requires-recent-login") {
        toast.error("For security, please log out and log back in, then try again.");
      } else {
        toast.error("Failed: " + (e as any).message);
      }
      setDeletingAccount(false);
    }
  };

  // ── GDPR Art. 20: Right to Portability ───────────────────────
  const handleExportData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setExporting(true);
    try {
      // Collect user profile
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      // Collect brand project
      let projectData = {};
      if (projectId) {
        const projectDoc = await getDoc(doc(db, "projects", projectId));
        projectData = projectDoc.exists() ? projectDoc.data() : {};
      }

      // Collect all saved carousels
      const carouselsQuery = query(collection(db, "carousels"), where("userId", "==", user.uid));
      const carouselsSnap = await getDocs(carouselsQuery);
      const carouselsData = carouselsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Build export payload (strip server timestamps for JSON serialisation)
      const payload = {
        exportedAt: new Date().toISOString(),
        exportVersion: "1.0",
        user: { uid: user.uid, email: user.email, ...userData },
        project: projectData,
        carousels: carouselsData,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `carouseln_data_export_${user.uid.slice(0, 8)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Data export downloaded!");
    } catch (e: any) {
      toast.error("Export failed: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  // ── States ────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#FAFAF8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-black border-t-[#FFB800] rounded-full animate-spin" />
          <p className="text-[14px] font-black text-black uppercase tracking-wider">Loading Settings...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#FAFAF8]">
        <div className="max-w-md w-full border-4 border-black bg-white shadow-[8px_8px_0px_0px_#000] p-8 text-center">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-[20px] font-black text-black mb-2 uppercase">Failed to Load Settings</h2>
          <p className="text-[13px] font-bold text-gray-600 mb-6 break-all">{errorMsg || "An error occurred. Please retry."}</p>
          <button
            onClick={() => auth.currentUser && fetchSettings(auth.currentUser.uid)}
            className="flex items-center gap-2 mx-auto bg-[#FFB800] border-4 border-black px-6 py-3 text-[14px] font-black uppercase shadow-[4px_4px_0px_0px_#000]"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (status === "no-brand") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#FAFAF8]">
        <div className="max-w-lg w-full border-4 border-black bg-white shadow-[8px_8px_0px_0px_#000] p-10 text-center">
          <div className="w-16 h-16 bg-[#FFB800] border-4 border-black flex items-center justify-center mx-auto mb-6">
            <span className="text-[28px]">🏗️</span>
          </div>
          <h2 className="text-[26px] font-black text-black mb-3 uppercase">No Brand Yet</h2>
          <p className="text-[15px] font-bold text-gray-600 mb-8">
            Create your first brand to access settings.
          </p>
          <a
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-[#FFB800] border-4 border-black px-8 py-4 text-[15px] font-black uppercase shadow-[6px_6px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] transition-all"
          >
            Create Brand
          </a>
        </div>
      </div>
    );
  }

  // ── Main Settings UI ──────────────────────────────────
  const field = (label: string, el: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-black text-black uppercase tracking-wider">{label}</label>
      {el}
    </div>
  );

  const inputClass = "w-full border-2 border-black bg-white px-3 py-2.5 text-[14px] font-bold text-black focus:outline-none focus:border-[#FFB800] transition-colors";
  const sectionClass = "border-4 border-black bg-white shadow-[5px_5px_0px_0px_#000] p-6";

  return (
    <div className="p-4 lg:p-8 w-full max-w-[760px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-4 lg:pt-8">
        <div>
          <h1 className="text-[30px] font-black text-black uppercase leading-none">Brand Settings</h1>
          <p className="text-[13px] font-bold text-gray-500 mt-1">Manage your brand DNA</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#FFB800] border-4 border-black px-6 py-3 text-[14px] font-black uppercase shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={16} strokeWidth={3} />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* General */}
        <div className={sectionClass}>
          <h2 className="text-[16px] font-black text-black uppercase mb-5 pb-3 border-b-2 border-black">General Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Brand Name", <input className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />)}
            {field("Industry", <input className={inputClass} placeholder="e.g. SaaS, Fashion" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} />)}
            <div className="sm:col-span-2">
              {field("Website", (
                <div className="flex gap-2">
                  <input className={`${inputClass} flex-1`} placeholder="https://yoursite.com" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                  <button
                    onClick={handleAnalyzeWebsite}
                    disabled={analyzing || !formData.website}
                    className="flex items-center gap-2 bg-black text-white border-2 border-black px-4 py-2.5 text-[12px] font-black uppercase hover:bg-[#FFB800] hover:text-black disabled:opacity-50 transition-colors shrink-0"
                  >
                    {analyzing ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Globe size={14} />}
                    {analyzing ? "Analyzing..." : "Analyze"}
                  </button>
                </div>
              ))}
              {formData.brandContext && (
                <p className="text-[12px] font-black text-green-700 mt-1">✓ Website context saved — AI will use this</p>
              )}
            </div>
          </div>
        </div>


        {/* Style */}
        <div className={sectionClass}>
          <h2 className="text-[16px] font-black text-black uppercase mb-5 pb-3 border-b-2 border-black">Style & Voice</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Visual Vibe", (
              <select className={inputClass} value={formData.vibe} onChange={(e) => setFormData({ ...formData, vibe: e.target.value })}>
                {["Luxury", "Minimal", "Bold", "Editorial", "Playful", "Raw"].map((v) => <option key={v}>{v}</option>)}
              </select>
            ))}
            {field("Voice Tone", (
              <select className={inputClass} value={formData.tone} onChange={(e) => setFormData({ ...formData, tone: e.target.value })}>
                {["Professional", "Casual", "Witty", "Inspirational", "Authoritative", "Minimalist"].map((v) => <option key={v}>{v}</option>)}
              </select>
            ))}
            {field("Accent Color", (
              <div className="flex items-center gap-3">
                <input type="color" className="w-12 h-12 border-4 border-black cursor-pointer p-0.5" value={formData.colorPrimary} onChange={(e) => setFormData({ ...formData, colorPrimary: e.target.value })} />
                <input className={`${inputClass} flex-1 font-mono uppercase`} value={formData.colorPrimary} onChange={(e) => setFormData({ ...formData, colorPrimary: e.target.value })} />
              </div>
            ))}
            {field("Background Color", (
              <div className="flex items-center gap-3">
                <input type="color" className="w-12 h-12 border-4 border-black cursor-pointer p-0.5" value={formData.colorBg} onChange={(e) => setFormData({ ...formData, colorBg: e.target.value })} />
                <input className={`${inputClass} flex-1 font-mono uppercase`} value={formData.colorBg} onChange={(e) => setFormData({ ...formData, colorBg: e.target.value })} />
              </div>
            ))}
          </div>
        </div>

        {/* GDPR — Data Portability */}
        <div className="border-4 border-black bg-white shadow-[5px_5px_0px_0px_#000] p-6">
          <h2 className="text-[16px] font-black text-black uppercase mb-2 pb-3 border-b-2 border-black">Privacy &amp; Data</h2>
          <p className="text-[13px] font-bold text-gray-600 mb-4">
            Download a copy of all your personal data — profile, brand settings, and saved carousels — in machine-readable JSON format.
          </p>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="inline-flex items-center gap-2 bg-black text-white border-2 border-black px-5 py-2.5 text-[13px] font-black uppercase hover:bg-[#FFB800] hover:text-black disabled:opacity-50 transition-colors"
          >
            {exporting
              ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Download size={14} />}
            {exporting ? "Preparing export…" : "Export My Data (JSON)"}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="border-4 border-red-500 bg-red-50 p-6">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b-2 border-red-300">
            <AlertTriangle size={18} className="text-red-600" strokeWidth={3} />
            <h2 className="text-[16px] font-black text-red-600 uppercase">Danger Zone</h2>
          </div>

          {/* Delete Brand */}
          <div className="mb-6 pb-6 border-b-2 border-red-200">
            <p className="text-[14px] font-black text-red-700 mb-1 flex items-center gap-2"><Trash2 size={14} /> Delete Brand</p>
            <p className="text-[12px] font-bold text-red-600 mb-3">This will permanently delete all carousels for this brand. Type <strong>{formData.name}</strong> to confirm.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="border-2 border-red-400 bg-white px-3 py-2.5 text-[13px] font-bold text-black focus:outline-none flex-1"
                placeholder={formData.name}
                value={deleteName}
                onChange={(e) => setDeleteName(e.target.value)}
              />
              <button
                onClick={handleDeleteBrand}
                disabled={deleting || deleteName !== formData.name || !formData.name}
                className="flex items-center gap-2 bg-red-600 text-white border-2 border-red-800 px-5 py-2.5 text-[13px] font-black uppercase disabled:opacity-50 hover:bg-red-700 transition-colors shrink-0"
              >
                {deleting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                {deleting ? "Deleting..." : "Delete Brand"}
              </button>
            </div>
          </div>

          {/* Delete Account */}
          <div>
            <p className="text-[14px] font-black text-red-700 mb-1 flex items-center gap-2"><UserX size={14} /> Delete Account</p>
            <p className="text-[12px] font-bold text-red-600 mb-3">Permanently deletes your account and ALL data. This cannot be undone. Type your email to confirm.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                className="border-2 border-red-400 bg-white px-3 py-2.5 text-[13px] font-bold text-black focus:outline-none flex-1"
                placeholder={auth.currentUser?.email || "your@email.com"}
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
              />
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteEmail !== auth.currentUser?.email}
                className="flex items-center gap-2 bg-red-800 text-white border-2 border-red-900 px-5 py-2.5 text-[13px] font-black uppercase disabled:opacity-50 hover:bg-red-900 transition-colors shrink-0"
              >
                {deletingAccount ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserX size={14} />}
                {deletingAccount ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
