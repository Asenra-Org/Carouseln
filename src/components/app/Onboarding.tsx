import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { toast } from "sonner";
import { auth, db } from "../../lib/firebase/client";
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";

const VIBES = ["Luxury", "Minimal", "Bold", "Editorial", "Playful", "Raw"];
const TONES = ["Professional", "Casual", "Witty", "Inspirational", "Authoritative", "Minimalist"];

const PRESET_PRIMARIES = ["#FFB800", "#000000", "#E63946", "#3B82F6", "#10B981", "#8B5CF6"];
const PRESET_BACKGROUNDS = ["#FFFFFF", "#000000", "#0A0A0A", "#F8F9FA", "#1A1A2E", "#0D1117"];

export const OnboardingWizard = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const isSubmitting = useRef(false); // prevent double-submit

  const [formData, setFormData] = useState({
    name: "",
    website: "",
    industry: "",
    vibe: "Luxury",
    tone: "Professional",
    colorPrimary: "#FFB800",
    colorBg: "#000000",
    brandContext: "",
  });

  // Check if user already has a brand — redirect to dashboard if yes
  // Use a flag to avoid loop when we ourselves write onboardingCompleted
  const redirected = useRef(false);

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

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }
      if (redirected.current) return; // ignore re-fires after our own write
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const isNew = urlParams.get("new") === "true";
        if (!isNew) {
          const userDoc = await withTimeout(getDoc(doc(db, "users", user.uid)), 8000);
          if (
            userDoc.exists() &&
            userDoc.data().activeProjectId &&
            userDoc.data().onboardingCompleted === true
          ) {
            redirected.current = true;
            window.location.href = "/dashboard";
            return;
          }
        }
      } catch (_) {}
      setChecking(false);
    });
    return () => unsub();
  }, []);

  const handleNext = () => {
    if (step === 1 && !formData.name.trim()) {
      toast.error("Please enter your brand name");
      return;
    }
    setStep((s) => s + 1);
  };

  const handleComplete = async () => {
    if (isSubmitting.current) return; // block double clicks
    isSubmitting.current = true;
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in. Please refresh and try again.");

      // Create project document
      const projectRef = await withTimeout(
        addDoc(collection(db, "projects"), {
          userId: user.uid,
          name: formData.name.trim(),
          website: formData.website.trim(),
          industry: formData.industry.trim(),
          vibe: formData.vibe,
          tone: formData.tone,
          colorPrimary: formData.colorPrimary,
          colorBg: formData.colorBg,
          logoUrl: "",
          brandContext: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        10000
      );

      // Use setDoc (not updateDoc) with merge — works even if user doc doesn't exist yet
      await withTimeout(
        setDoc(
          doc(db, "users", user.uid),
          {
            activeProjectId: projectRef.id,
            onboardingCompleted: true,
            name: user.displayName || "",
            email: user.email || "",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
        10000
      );

      // Set flag so the onAuthStateChanged listener doesn't re-fire redirect
      redirected.current = true;

      toast.success("Brand created! Taking you to dashboard…");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch (err: any) {
      console.error("Onboarding error:", err);
      let errMsg = err.message || "Something went wrong. Please try again.";
      if (
        err.code === "not-found" || 
        errMsg.toLowerCase().includes("not_found") || 
        errMsg.toLowerCase().includes("not found")
      ) {
        errMsg = "Firestore Database (default) was not found. Please click 'Create Database' under Firestore in your Firebase Console for project 'asenra-carousel-studio'.";
      }
      toast.error(errMsg, { duration: 8000 });
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  // ── Color picker helper ───────────────────────────────
  const ColorPicker = ({
    label,
    description,
    value,
    presets,
    onChange,
  }: {
    label: string;
    description: string;
    value: string;
    presets: string[];
    onChange: (v: string) => void;
  }) => (
    <div className="flex-1 flex flex-col gap-3">
      <div>
        <p className="text-[13px] font-black text-black uppercase tracking-wider">{label}</p>
        <p className="text-[11px] font-bold text-gray-500 mt-0.5">{description}</p>
      </div>
      {/* Preview */}
      <div
        className="w-full h-16 border-4 border-black shadow-[4px_4px_0px_0px_#000] transition-colors duration-200"
        style={{ backgroundColor: value }}
      />
      {/* Presets */}
      <div className="flex gap-2 flex-wrap">
        {presets.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            aria-label={`Select color ${c}`}
            aria-pressed={value === c}
            className={`w-9 h-9 border-4 transition-all ${
              value === c
                ? "border-[#FFB800] shadow-[3px_3px_0px_0px_#000] scale-110"
                : "border-black hover:scale-105"
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
      {/* Custom hex input */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 border-4 border-black cursor-pointer p-0.5 shrink-0"
        />
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono font-bold text-[13px]">
            #
          </span>
          <input
            className="w-full border-2 border-black bg-white pl-7 pr-3 py-2 text-[13px] font-mono font-bold text-black uppercase focus:outline-none focus:border-[#FFB800] transition-colors"
            value={value.replace("#", "")}
            maxLength={6}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
              if (val.length === 6) onChange(`#${val}`);
            }}
          />
        </div>
      </div>
    </div>
  );

  // ── Loading check ─────────────────────────────────────
  if (checking) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-black border-t-[#FFB800] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────
  const stepTitles = [
    "Welcome to Carouseln",
    "Define Your Aesthetic",
    "Set Brand Colors",
  ];
  const stepDescs = [
    "Set up your Brand DNA so AI generates content that sounds exactly like you.",
    "Select the vibe and tone that best represent your brand's personality.",
    "Every premium brand has two signature colors — accent and background.",
  ];

  return (
    <div className="w-full max-w-[640px] mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-5">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 border-4 border-black flex items-center justify-center text-[12px] font-black transition-all ${
                  s === step
                    ? "bg-[#FFB800] shadow-[3px_3px_0px_0px_#000]"
                    : s < step
                    ? "bg-black text-white"
                    : "bg-white text-gray-400"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-1 w-12 transition-all ${s < step ? "bg-black" : "bg-gray-200"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <h1 className="text-[30px] md:text-[36px] font-black text-black text-center leading-tight mb-2 uppercase">
          {stepTitles[step - 1]}
        </h1>
        <p className="text-[14px] font-bold text-gray-500 text-center max-w-[420px]">
          {stepDescs[step - 1]}
        </p>
      </div>

      <Card className="p-6 md:p-8 border-4 border-black rounded-none shadow-[8px_8px_0px_0px_#000] bg-white">
        {/* ── Step 1: Brand Info ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="brand-name" className="text-[12px] font-black text-black uppercase tracking-wider">
                Brand Name *
              </label>
              <Input
                id="brand-name"
                name="brandName"
                autoComplete="organization"
                placeholder="e.g. Asenra Digital…"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="brand-industry" className="text-[12px] font-black text-black uppercase tracking-wider">
                Industry
              </label>
              <Input
                id="brand-industry"
                name="industry"
                autoComplete="off"
                placeholder="e.g. SaaS, Fashion, Agency, Finance…"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="brand-website" className="text-[12px] font-black text-black uppercase tracking-wider">
                Website <span className="text-gray-400 normal-case font-bold">(optional)</span>
              </label>
              <Input
                id="brand-website"
                name="website"
                type="url"
                autoComplete="url"
                placeholder="e.g. asenra.in…"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
            <Button onClick={handleNext} className="w-full mt-2">
              Continue →
            </Button>
          </div>
        )}

        {/* ── Step 2: Vibe & Tone ── */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <label className="text-[12px] font-black text-black uppercase tracking-wider">
                Visual Vibe
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {VIBES.map((v) => (
                  <button
                    key={v}
                    onClick={() => setFormData({ ...formData, vibe: v })}
                    className={`py-2.5 px-3 border-4 text-[13px] font-black uppercase transition-all ${
                      formData.vibe === v
                        ? "border-black bg-[#FFB800] shadow-[3px_3px_0px_0px_#000] -translate-y-0.5"
                        : "border-black bg-white hover:bg-gray-50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[12px] font-black text-black uppercase tracking-wider">
                Voice Tone
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFormData({ ...formData, tone: t })}
                    className={`py-2.5 px-3 border-4 text-[13px] font-black uppercase transition-all ${
                      formData.tone === t
                        ? "border-black bg-black text-white shadow-[3px_3px_0px_0px_#FFB800] -translate-y-0.5"
                        : "border-black bg-white hover:bg-gray-50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                ← Back
              </Button>
              <Button onClick={handleNext} className="flex-[2]">
                Continue →
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Brand Colors ── */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            {/* Live preview */}
            <div
              className="w-full h-20 border-4 border-black flex items-center justify-center gap-4 shadow-[4px_4px_0px_0px_#000] transition-all duration-300"
              style={{ backgroundColor: formData.colorBg }}
            >
              <div
                className="w-8 h-8 border-4 border-black"
                style={{ backgroundColor: formData.colorPrimary }}
              />
              <span
                className="text-[16px] font-black uppercase tracking-widest"
                style={{ color: formData.colorPrimary }}
              >
                {formData.name || "Brand Name"}
              </span>
            </div>
            <p className="text-[11px] font-bold text-gray-500 text-center -mt-3">
              Live preview of your brand palette
            </p>

            {/* Two color pickers side by side */}
            <div className="flex gap-5">
              <ColorPicker
                label="Accent Color"
                description="Logo, buttons, highlights"
                value={formData.colorPrimary}
                presets={PRESET_PRIMARIES}
                onChange={(v) => setFormData({ ...formData, colorPrimary: v })}
              />
              <div className="w-px bg-black opacity-10" />
              <ColorPicker
                label="Background"
                description="Slide background color"
                value={formData.colorBg}
                presets={PRESET_BACKGROUNDS}
                onChange={(v) => setFormData({ ...formData, colorBg: v })}
              />
            </div>

            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={loading}>
                ← Back
              </Button>
              <Button onClick={handleComplete} isLoading={loading} className="flex-[2]">
                {loading ? "Creating Brand…" : "Complete Setup"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
