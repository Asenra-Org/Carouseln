import React, { useState, useEffect } from "react";
import { Cookie, X, Check, Shield } from "lucide-react";
import { db, auth } from "../../lib/firebase/client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

const setCookie = (name: string, value: string, days: number) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax${secure}`;
};

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsAccepted, setAnalyticsAccepted] = useState(true);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check if user already consented (check cookie first, fall back to localStorage)
    const cookieConsent = getCookie("carouseln-cookie-consent");
    const localConsent = localStorage.getItem("carouseln-cookie-consent");
    
    if (cookieConsent || localConsent) {
      // If only localStorage has it, set the cookie as well so it is persistent
      if (localConsent && !cookieConsent) {
        setCookie("carouseln-cookie-consent", localConsent, 365);
      }
      return;
    }

    // Delay slightly for a smoother entry
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });
    return () => unsub();
  }, []);

  const saveConsent = async (choices: { necessary: boolean; analytics: boolean; marketing: boolean }) => {
    const value = JSON.stringify({
      choices,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("carouseln-cookie-consent", value);
    setCookie("carouseln-cookie-consent", value, 365);
    setVisible(false);

    try {
      // Capture browser details & authenticated user details
      const consentData = {
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent || "Unknown",
        language: navigator.language || "Unknown",
        screenResolution: `${window.screen.width || 0}x${window.screen.height || 0}`,
        referrer: document.referrer || "Direct",
        preferences: choices,
        consentPolicyVersion: "1.0",
        userId: currentUser ? currentUser.uid : null,
        userEmail: currentUser ? currentUser.email : null,
      };

      await addDoc(collection(db, "cookie_consents"), consentData);
    } catch (err) {
      console.error("Failed to log cookie consent in Firestore", err);
    }
  };

  const handleAcceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  };

  const handleRejectAll = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  };

  const handleSaveChoices = () => {
    saveConsent({ necessary: true, analytics: analyticsAccepted, marketing: marketingAccepted });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-md z-50 p-5 bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000] font-ui transition-all duration-300">
      <div className="flex items-start gap-3.5 mb-4">
        <div className="bg-[#FFB800] border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000] shrink-0">
          <Cookie size={22} className="text-black" strokeWidth={3} />
        </div>
        <div className="flex-1">
          <h4 className="text-[16px] font-black text-black uppercase tracking-tight mb-1">
            Cookie Preferences
          </h4>
          <p className="text-[12px] font-bold text-gray-600 leading-relaxed">
            We use cookies to personalize content, analyze site traffic, and optimize your design studio experience.
          </p>
        </div>
        <button 
          onClick={handleRejectAll}
          className="text-gray-400 hover:text-black transition-colors cursor-pointer"
          title="Reject optional cookies"
        >
          <X size={18} strokeWidth={3} />
        </button>
      </div>

      {showPreferences && (
        <div className="border-t-4 border-black pt-4 mt-4 flex flex-col gap-3.5 animate-in fade-in duration-200">
          {/* Necessary Cookies (Always On) */}
          <div className="flex items-start justify-between gap-3 p-2 bg-gray-50 border-2 border-black">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[12px] font-black text-black uppercase">Necessary</span>
                <span className="text-[9px] font-black text-[#51CF66] border border-[#51CF66] px-1 bg-white">Required</span>
              </div>
              <p className="text-[11px] font-bold text-gray-500">
                Essential for logins, brand context security, and basic operations.
              </p>
            </div>
            <div className="w-5 h-5 bg-[#E9ECEF] border-2 border-black flex items-center justify-center shrink-0">
              <Check size={14} className="text-gray-600" strokeWidth={3} />
            </div>
          </div>

          {/* Analytics Cookies */}
          <button 
            type="button"
            onClick={() => setAnalyticsAccepted(!analyticsAccepted)}
            className="flex items-start text-left justify-between gap-3 p-2 bg-white hover:bg-gray-50 border-2 border-black cursor-pointer transition-colors w-full"
          >
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[12px] font-black text-black uppercase">Analytics</span>
              </div>
              <p className="text-[11px] font-bold text-gray-500">
                Helps us monitor generation performance and debug errors.
              </p>
            </div>
            <div className={`w-5 h-5 border-2 border-black flex items-center justify-center shrink-0 transition-colors ${analyticsAccepted ? 'bg-[#FFB800]' : 'bg-white'}`}>
              {analyticsAccepted && <Check size={14} className="text-black" strokeWidth={3} />}
            </div>
          </button>

          {/* Marketing Cookies */}
          <button 
            type="button"
            onClick={() => setMarketingAccepted(!marketingAccepted)}
            className="flex items-start text-left justify-between gap-3 p-2 bg-white hover:bg-gray-50 border-2 border-black cursor-pointer transition-colors w-full"
          >
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[12px] font-black text-black uppercase">Marketing</span>
              </div>
              <p className="text-[11px] font-bold text-gray-500">
                Used to personalize dashboard help resources and feature highlights.
              </p>
            </div>
            <div className={`w-5 h-5 border-2 border-black flex items-center justify-center shrink-0 transition-colors ${marketingAccepted ? 'bg-[#FFB800]' : 'bg-white'}`}>
              {marketingAccepted && <Check size={14} className="text-black" strokeWidth={3} />}
            </div>
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-5 border-t-2 border-dashed border-gray-300 pt-4">
        {showPreferences ? (
          <>
            <button
              onClick={handleSaveChoices}
              className="flex-1 min-w-[120px] bg-black text-white hover:bg-gray-900 border-2 border-black py-2 px-3 text-[12px] font-black uppercase shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] cursor-pointer transition-colors text-center"
            >
              Save Choices
            </button>
            <button
              onClick={() => setShowPreferences(false)}
              className="bg-white text-black hover:bg-gray-50 border-2 border-black py-2 px-3 text-[12px] font-black uppercase cursor-pointer transition-colors text-center"
            >
              Back
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleAcceptAll}
              className="flex-1 min-w-[120px] bg-[#FFB800] text-black hover:bg-[#FFA800] border-2 border-black py-2 px-3 text-[12px] font-black uppercase shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] cursor-pointer transition-colors text-center"
            >
              Accept All
            </button>
            <button
              onClick={() => setShowPreferences(true)}
              className="bg-white text-black hover:bg-gray-50 border-2 border-black py-2 px-3 text-[12px] font-black uppercase cursor-pointer transition-colors text-center"
            >
              Customize
            </button>
            <button
              onClick={handleRejectAll}
              className="text-[11px] font-black uppercase text-gray-500 hover:text-black py-2 cursor-pointer ml-auto"
            >
              Reject All
            </button>
          </>
        )}
      </div>
    </div>
  );
};
