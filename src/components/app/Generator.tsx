import React, { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Sparkles, Save, Download, ArrowLeft, ArrowRight, Trash2, AlertCircle } from "lucide-react";
import { auth, db } from "../../lib/firebase/client";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';

function injectBgIntoHtml(html: string | undefined, imageUrl: string | null | undefined, opacity: number): string {
  if (!html) return "";
  let processed = html;
  const imgReplacement = imageUrl ? `url('${imageUrl}')` : "none";
  processed = processed.replaceAll("var(--bg-image)", imgReplacement);
  processed = processed.replaceAll("var(--bg-opacity, 0.08)", opacity.toString());
  processed = processed.replaceAll("var(--bg-opacity)", opacity.toString());
  return processed;
}

function scaleStyleValue(val: string, scale: number = 3): string {
  if (!val) return "0px";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  const unit = val.replace(num.toString(), "");
  return `${num * scale}${unit}`;
}

export const Generator = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [topic, setTopic] = useState("");
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeProject, setActiveProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [isDirty, setIsDirty] = useState(false);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState<number>(0.08);
  const [imageQuery, setImageQuery] = useState<string>("");
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  const performImageSearch = async (query: string) => {
    if (!query) return;
    setSearchLoading(true);
    try {
      const res = await fetch("/api/search-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        setSearchResults(data.results);
      } else {
        toast.error(data.error || "Failed to search images");
      }
    } catch (err: any) {
      console.error("Image search failed:", err);
      toast.error("Failed to load search results");
    } finally {
      setSearchLoading(false);
    }
  };

  // Share to Unlock States
  const [generationsToday, setGenerationsToday] = useState<number>(0);
  const [bonusCreditsToday, setBonusCreditsToday] = useState<number>(0);
  const [lastGenDate, setLastGenDate] = useState<string>("");
  const [lastShareDate, setLastShareDate] = useState<string>("");
  const [usedShareLinks, setUsedShareLinks] = useState<string[]>([]);
  const [shareUrlInput, setShareUrlInput] = useState<string>("");
  const [verifyingShare, setVerifyingShare] = useState<boolean>(false);


  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "Exit without saving?";
        return "Exit without saving?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    (window as any).isDirty = isDirty;
    return () => {
      (window as any).isDirty = false;
    };
  }, [isDirty]);

  // Customization States
  const [fontFamily, setFontFamily] = useState("font-space");
  const [borderRadius, setBorderRadius] = useState("0px");
  const [borderWidth, setBorderWidth] = useState("4px");
  const [shadowType, setShadowType] = useState("neo");
  const [aspectRatio, setAspectRatio] = useState("4/5");
  const [platformFrame, setPlatformFrame] = useState("none");
  const [loadedCarouselId, setLoadedCarouselId] = useState<string | null>(null);

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
      try {
        let activeProjData: any = null;
        const userDoc = await withTimeout(getDoc(doc(db, "users", user.uid)), 8000);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const todayStr = new Date().toISOString().split('T')[0];
          
          const genDate = userData.lastGenDate || "";
          const genToday = genDate === todayStr ? (userData.generationsToday || 0) : 0;
          setGenerationsToday(genToday);
          setLastGenDate(genDate);

          const shareDate = userData.lastShareDate || "";
          const bonusToday = shareDate === todayStr ? (userData.bonusCreditsToday || 0) : 0;
          setBonusCreditsToday(bonusToday);
          setLastShareDate(shareDate);

          setUsedShareLinks(userData.usedShareLinks || []);

          if (userData.activeProjectId) {
            const projectDoc = await withTimeout(getDoc(doc(db, "projects", userData.activeProjectId)), 8000);
            if (projectDoc.exists()) {
              activeProjData = { id: projectDoc.id, ...projectDoc.data() };
              setActiveProject(activeProjData);
            }
          }
        }

        // Fetch saved carousel if ID is present in URL
        const params = new URLSearchParams(window.location.search);
        const carouselId = params.get("id");
        if (carouselId) {
          setLoading(true);
          const carouselDoc = await withTimeout(getDoc(doc(db, "carousels", carouselId)), 8000);
          if (carouselDoc.exists()) {
            const data = carouselDoc.data();
            if (data.userId === user.uid) {
              setLoadedCarouselId(carouselDoc.id);
              setTopic(data.title || "");
              setSlides(data.slides || []);
              setBgImageUrl(data.bgImageUrl || null);
              setBgOpacity(data.bgOpacity !== undefined ? data.bgOpacity : 0.05);
              const initialQuery = data.imageQuery || `${activeProjData?.industry || ""} ${data.title || ""}`.trim();
              setImageQuery(initialQuery);
              setCurrentSlideIndex(0);
              toast.success("Loaded saved carousel!");
              performImageSearch(initialQuery);
            } else {
              toast.error("Unauthorized access to carousel");
            }
          } else {
            toast.error("Carousel not found");
          }
        }
      } catch (err: any) {
        console.error("Error fetching project / carousel", err);
        toast.error(err.message || "Failed to load project details");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!imageQuery && activeProject) {
      setImageQuery(`${activeProject.industry || ""} ${topic}`.trim());
    }
  }, [activeProject, topic]);

  const handleGenerate = async () => {
    if (!topic) {
      toast.error("Please enter a topic");
      return;
    }
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not logged in. Please refresh and log in again.");

      // Check daily rate limit from user's Firestore document
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await withTimeout(getDoc(userRef), 8000);
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      const todayStr = new Date().toISOString().split('T')[0];
      const lastGenDate = userData.lastGenDate || "";
      let genCount = userData.generationsToday || 0;

      if (lastGenDate !== todayStr) {
        genCount = 0; // reset for a new day
      }

      const shareDate = userData.lastShareDate || "";
      const bonusCredits = shareDate === todayStr ? (userData.bonusCreditsToday || 0) : 0;
      const totalAllowed = 1 + bonusCredits;

      const isTester = currentUser.email === "karanpatil82005@gmail.com";

      if (genCount >= totalAllowed && !isTester) {
        throw new Error(`Free limit reached: You can generate ${totalAllowed} carousel(s) per day. Please try again tomorrow!`);
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          brandName: activeProject?.name || "Brand",
          vibe: activeProject?.vibe || "Luxury",
          tone: activeProject?.tone || "Professional",
          colorPrimary: activeProject?.colorPrimary || "#FFB800",
          colorBg: activeProject?.colorBg || "#000000",
          logoUrl: activeProject?.logoUrl || "",
          brandContext: activeProject?.brandContext || "",
          website: activeProject?.website || "",
          aspectRatio: aspectRatio,
          industry: activeProject?.industry || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      if (!data.slides || data.slides.length === 0) {
        throw new Error("No slides returned from the server.");
      }

      // Increment limit and save in Firestore
      const newGenCount = genCount + 1;
      await withTimeout(
        setDoc(userRef, {
          generationsToday: newGenCount,
          lastGenDate: todayStr,
          updatedAt: serverTimestamp()
        }, { merge: true }),
        8000
      );

      setGenerationsToday(newGenCount);
      setLastGenDate(todayStr);

      setSlides(data.slides);
      setBgImageUrl(data.bgImageUrl || null);
      if (data.imageQuery) {
        setImageQuery(data.imageQuery);
        performImageSearch(data.imageQuery);
      }
      setCurrentSlideIndex(0);
      setIsDirty(true);
      toast.success(isTester ? "Carousel generated! (Unlimited Dev Mode)" : `Carousel generated! (${newGenCount}/${totalAllowed} today)`);
    } catch (err: any) {
      console.error("Client generation error:", err);
      toast.error(err.message || "Generation failed", { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyShare = async () => {
    if (!shareUrlInput || !shareUrlInput.trim()) {
      toast.error("Please paste your shared post link first.");
      return;
    }
    const url = shareUrlInput.trim();
    
    // Regular Expression validation for X/Twitter and LinkedIn domains
    const twitterRegex = /^https?:\/\/(www\.)?(twitter|x)\.com\/\S+/i;
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/\S+/i;
    
    const isTwitter = twitterRegex.test(url);
    const isLinkedin = linkedinRegex.test(url);
    
    if (!isTwitter && !isLinkedin) {
      toast.error("Invalid URL: Please paste a valid X (Twitter) or LinkedIn post link.");
      return;
    }

    setVerifyingShare(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not logged in");

      // Check if this link has already been used by this user
      if (usedShareLinks.includes(url)) {
        throw new Error("This link has already been used to unlock credits.");
      }

      const userRef = doc(db, "users", currentUser.uid);
      const todayStr = new Date().toISOString().split('T')[0];

      // Update Firestore: unlock +3 credits, set last share date, and add to used links
      const newUsedLinks = [...usedShareLinks, url];
      await withTimeout(
        setDoc(userRef, {
          bonusCreditsToday: 3,
          lastShareDate: todayStr,
          usedShareLinks: newUsedLinks,
          updatedAt: serverTimestamp()
        }, { merge: true }),
        8000
      );

      // Update local states
      setBonusCreditsToday(3);
      setLastShareDate(todayStr);
      setUsedShareLinks(newUsedLinks);
      setShareUrlInput("");
      
      toast.success("Congratulations! +3 extra generations unlocked for today!");
    } catch (err: any) {
      console.error("Share verification error:", err);
      toast.error(err.message || "Failed to verify share link");
    } finally {
      setVerifyingShare(false);
    }
  };

  const handleSave = async () => {
    if (slides.length === 0) return;
    setSaving(true);
    try {
      if (!auth.currentUser) throw new Error("Not authenticated");
      
      if (loadedCarouselId) {
        // Update existing document
        await withTimeout(
          updateDoc(doc(db, "carousels", loadedCarouselId), {
            title: topic,
            slides,
            bgImageUrl,
            bgOpacity,
            imageQuery,
            updatedAt: serverTimestamp()
          }),
          10000
        );
        setIsDirty(false);
        toast.success("Carousel updated successfully!");
      } else {
        // Create new document
        await withTimeout(
          addDoc(collection(db, "carousels"), {
            userId: auth.currentUser.uid,
            projectId: activeProject ? activeProject.id : null,
            title: topic,
            slides,
            bgImageUrl,
            bgOpacity,
            imageQuery,
            status: "complete",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }),
          10000
        );
        setIsDirty(false);
        toast.success("Carousel saved successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save carousel");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!loadedCarouselId) return;
    if (confirm("Are you sure you want to delete this saved carousel? This action cannot be undone.")) {
      setSaving(true);
      try {
        await withTimeout(deleteDoc(doc(db, "carousels", loadedCarouselId)), 10000);
        setIsDirty(false);
        toast.success("Carousel deleted successfully!");
        window.location.href = "/dashboard";
      } catch (err: any) {
        toast.error("Failed to delete: " + err.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const exportImages = async () => {
    if (slides.length === 0) return;
    setSaving(true);
    toast.info("Preparing images for download...");
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < slides.length; i++) {
        setCurrentSlideIndex(i);
        // Wait a tick for react to render the slide
        await new Promise(resolve => setTimeout(resolve, 200)); 
        
        const node = document.getElementById('carousel-export-node');
        if (!node) continue;
        
        const dataUrl = await htmlToImage.toPng(node, {
          quality: 1,
          pixelRatio: 1,
        });
        
        const base64Data = dataUrl.split(',')[1];
        zip.file(`slide_${i + 1}.png`, base64Data, { base64: true });
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${topic.slice(0, 20).replace(/[^a-z0-9]/gi, '_') || 'carousel'}_slides.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Images downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export images");
    } finally {
      setSaving(false);
    }
  };

  const primaryColor = activeProject?.colorPrimary || "#C9A84C";

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] lg:h-screen bg-white">
      {/* Header */}
      <header className="h-[70px] border-b-4 border-black flex items-center justify-between px-3 lg:px-6 bg-[var(--color-bg)] z-10 shrink-0 gap-2">
        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
          <h1 className="text-[16px] lg:text-[20px] font-bold text-black uppercase tracking-tight">
            {loadedCarouselId ? "Edit" : "New"} <span className="hidden sm:inline">Carousel</span>
          </h1>
          {slides.length > 0 && <Badge variant="default" className="bg-black text-white rounded-none border-none text-[10px] md:text-xs">Draft</Badge>}
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          {loadedCarouselId && (
            <Button 
              variant="destructive" 
              className="h-10 border-2 py-0 px-2 sm:px-4 text-[12px] sm:text-[14px]" 
              onClick={handleDelete} 
              isLoading={saving}
            >
              <Trash2 size={16} className="sm:mr-1.5" /> <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
          <Button 
            variant="outline" 
            className="h-10 border-2 py-0 px-2 sm:px-4 text-[12px] sm:text-[14px]" 
            onClick={handleSave} 
            isLoading={saving} 
            disabled={slides.length === 0}
          >
            <Save size={16} className="sm:mr-1.5" /> 
            <span className="hidden sm:inline">Save</span>
            <span className="hidden lg:inline"> to Dashboard</span>
          </Button>
          <Button 
            className="h-10 py-0 px-2 sm:px-4 text-[12px] sm:text-[14px]" 
            disabled={slides.length === 0 || saving} 
            onClick={exportImages} 
            isLoading={saving}
          >
            <Download size={16} className="sm:mr-1.5" /> 
            <span className="hidden sm:inline">Export</span>
            <span className="hidden lg:inline"> Images (ZIP)</span>
          </Button>
        </div>
      </header>

      {/* Tab Switcher (Mobile Only) */}
      <div className="lg:hidden flex border-b-4 border-black bg-white shrink-0 z-10">
        <button
          onClick={() => setActiveTab("editor")}
          className={`flex-1 py-3 text-center text-[13px] font-black uppercase border-r-2 border-black tracking-wider transition-colors ${
            activeTab === "editor" ? "bg-[#FFB800] text-black" : "bg-white text-gray-500"
          }`}
        >
          AI & Style
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-3 text-center text-[13px] font-black uppercase border-l-2 border-black tracking-wider transition-colors ${
            activeTab === "preview" ? "bg-[#FFB800] text-black" : "bg-white text-gray-500"
          }`}
        >
          Preview ({slides.length} slides)
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row bg-gray-100">
        
        {/* Left: Editor Panel */}
        <div className={`w-full lg:w-[450px] bg-white lg:border-r-4 border-black flex flex-col z-10 overflow-y-auto flex-1 min-h-0 lg:flex-none lg:shrink-0 shadow-[8px_0px_0px_0px_rgba(0,0,0,0.1)] ${
          activeTab === "editor" ? "flex" : "hidden lg:flex"
        }`}>
          <div className="p-6 flex flex-col gap-8">
            
            {/* AI Generation Form or Limit Reached Widget */}
            {(() => {
              const isTester = auth.currentUser?.email === "karanpatil82005@gmail.com";
              const isLimitReached = generationsToday >= (1 + bonusCreditsToday) && !isTester;
              
              if (isLimitReached) {
                return (
                  <div className="flex flex-col gap-4 p-4 border-4 border-black bg-gray-50 shadow-[4px_4px_0px_0px_#000] animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertCircle size={24} strokeWidth={2.5} />
                      <h2 className="text-[14px] lg:text-[16px] font-black uppercase tracking-tight">Daily Limit Reached (1/1)</h2>
                    </div>
                    <p className="text-[12px] lg:text-[13px] font-bold text-gray-700 leading-snug">
                      Aapne aaj ki free carousel generation limit reach kar li hai. 
                      Carouseln ko social media par share karke instantly **+3 generations** aur unlock karein!
                    </p>

                    <div className="flex flex-col gap-2 mt-1">
                      <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Step 1: Share on Social Media</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const text = encodeURIComponent("Create stunning social media carousels in 30 seconds with @Carouseln! Try it for free at https://carouseln.com 🚀 #SaaS #Marketing #IndieHackers");
                            window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
                          }}
                          className="flex-1 bg-[#1DA1F2] text-white border-2 border-black font-black uppercase text-[11px] lg:text-[12px] h-10 shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Share on X
                        </button>
                        <button
                          onClick={() => {
                            const url = encodeURIComponent("https://carouseln.com");
                            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
                          }}
                          className="flex-1 bg-[#0A66C2] text-white border-2 border-black font-black uppercase text-[11px] lg:text-[12px] h-10 shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Share on LinkedIn
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-1">
                      <label htmlFor="share-verify-url" className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Step 2: Paste Shared Post Link</label>
                      <div className="flex flex-col gap-2">
                        <input
                          id="share-verify-url"
                          type="text"
                          className="w-full bg-white border-2 border-black rounded-none px-3 h-10 text-[13px] font-bold text-black focus:outline-none placeholder:text-gray-400"
                          placeholder="https://x.com/.../status/... or LinkedIn link"
                          value={shareUrlInput}
                          onChange={(e) => setShareUrlInput(e.target.value)}
                        />
                        <Button
                          onClick={handleVerifyShare}
                          isLoading={verifyingShare}
                          className="w-full h-10 text-[12px] uppercase"
                        >
                          Verify & Claim +3 Credits
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-[16px] font-bold text-black uppercase flex items-center gap-2">
                      <Sparkles size={18} className="text-black" /> AI Studio
                    </h2>
                    {generationsToday > 0 && (
                      <Badge variant="outline" className="border-2 border-black font-bold uppercase text-[10px] text-black">
                        Used: {generationsToday} / {1 + bonusCreditsToday}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="generator-topic" className="text-[14px] font-bold text-gray-600 uppercase">Topic or Idea</label>
                    <textarea
                      id="generator-topic"
                      name="topic"
                      className="w-full bg-white border-4 border-black rounded-none px-3 py-2 text-[16px] font-bold text-black placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_#000] transition-shadow resize-none min-h-[100px]"
                      placeholder="e.g. 5 ways to optimize React performance in large codebases…"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label htmlFor="generator-slide-count" className="text-[14px] font-bold text-gray-600 uppercase">Slide Count</label>
                      <select
                        id="generator-slide-count"
                        name="slideCount"
                        className="w-full bg-white border-4 border-black rounded-none px-3 h-12 text-[16px] font-bold text-black focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_#000] transition-shadow"
                      >
                        <option value="5-7">5–7 slides (Ideal)</option>
                        <option value="8-10">8–10 slides (Deep dive)</option>
                        <option value="3-4">3–4 slides (Bite-sized)</option>
                      </select>
                    </div>
                  </div>

                  <Button onClick={handleGenerate} isLoading={loading} className="w-full mt-2 h-12 text-[16px]">
                    Generate Draft
                  </Button>
                </div>
              );
            })()}

            <hr className="border-t-4 border-black" />

            {/* Customization Settings */}
            <div className="flex flex-col gap-4 animate-in fade-in">
              <h2 className="text-[16px] font-bold text-black uppercase">
                Layout & Frame
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gray-600 uppercase">Aspect Ratio</label>
                  <select 
                    className="w-full bg-white border-2 border-black rounded-none px-2 h-10 text-[14px] font-bold text-black"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                  >
                    <option value="1/1">1:1 (Square)</option>
                    <option value="4/5">4:5 (Portrait)</option>
                    <option value="16/9">16:9 (Landscape)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gray-600 uppercase">Platform Preview</label>
                  <select 
                    className="w-full bg-white border-2 border-black rounded-none px-2 h-10 text-[14px] font-bold text-black"
                    value={platformFrame}
                    onChange={(e) => setPlatformFrame(e.target.value)}
                  >
                    <option value="none">None (Raw)</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>
              </div>

              <h2 className="text-[16px] font-bold text-black uppercase mt-2">
                Styling Controls
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gray-600 uppercase">Border</label>
                  <select 
                    className="w-full bg-white border-2 border-black rounded-none px-2 h-10 text-[14px] font-bold text-black"
                    value={borderWidth}
                    onChange={(e) => setBorderWidth(e.target.value)}
                  >
                    <option value="0px">None</option>
                    <option value="1px">Thin</option>
                    <option value="2px">Medium</option>
                    <option value="4px">Thick (Neo)</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gray-600 uppercase">Shadow</label>
                  <select 
                    className="w-full bg-white border-2 border-black rounded-none px-2 h-10 text-[14px] font-bold text-black"
                    value={shadowType}
                    onChange={(e) => setShadowType(e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="soft">Soft Drop</option>
                    <option value="neo">Hard (Neo)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gray-600 uppercase">Corners</label>
                  <select 
                    className="w-full bg-white border-2 border-black rounded-none px-2 h-10 text-[14px] font-bold text-black"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(e.target.value)}
                  >
                    <option value="0px">Square</option>
                    <option value="8px">Rounded</option>
                    <option value="24px">Pill</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gray-600 uppercase">Font</label>
                  <select 
                    className="w-full bg-white border-2 border-black rounded-none px-2 h-10 text-[14px] font-bold text-black"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                  >
                    <option value="font-space">Space Grotesk (Tech/Neo)</option>
                    <option value="font-outfit">Outfit (Luxury Sans)</option>
                    <option value="font-bricolage">Bricolage (Bold/Trendy)</option>
                    <option value="font-syne">Syne (Expressive/Wide)</option>
                    <option value="font-cormorant">Cormorant (Premium Serif)</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-t-4 border-black" />

            {/* Background Photo Section */}
            <div className="flex flex-col gap-4 animate-in fade-in">
              <h2 className="text-[16px] font-bold text-black uppercase">
                Background Photo
              </h2>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="bg-image-query" className="text-[12px] font-bold text-gray-600 uppercase">Search Keywords</label>
                  <div className="flex gap-2">
                    <input
                      id="bg-image-query"
                      type="text"
                      className="flex-1 bg-white border-4 border-black rounded-none px-3 py-1 text-[14px] font-bold text-black focus:outline-none"
                      placeholder="e.g. tech, minimal office..."
                      value={imageQuery}
                      onChange={(e) => setImageQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          performImageSearch(imageQuery);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      className="h-10 border-2 py-0 px-3 text-[13px]"
                      onClick={() => performImageSearch(imageQuery)}
                      isLoading={searchLoading}
                      disabled={slides.length === 0}
                    >
                      Search
                    </Button>
                  </div>
                </div>

                {/* Thumbnails Grid */}
                {slides.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Select background image</span>
                    
                    {searchLoading ? (
                      <div className="h-[120px] border-4 border-dashed border-black flex items-center justify-center bg-gray-50">
                        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto p-1 bg-gray-50 border-4 border-black">
                        {searchResults.map((img) => {
                          const isSelected = bgImageUrl === img.full;
                          return (
                            <button
                              key={img.id}
                              onClick={() => {
                                setBgImageUrl(img.full);
                                setIsDirty(true);
                                toast.success("Background image updated!");
                              }}
                              className={`relative aspect-[4/3] border-2 overflow-hidden transition-all group ${
                                isSelected ? "border-[#FFB800] ring-4 ring-[#FFB800]" : "border-black hover:border-[#FFB800]"
                              }`}
                              title={`Photo by ${img.author}`}
                            >
                              <img
                                src={img.thumb}
                                alt={`By ${img.author}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                loading="lazy"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-[#FFB800]/20 flex items-center justify-center">
                                  <span className="bg-black text-[#FFB800] font-black text-[10px] uppercase px-1.5 py-0.5 border border-black shadow-[2px_2px_0px_0px_#000]">Selected</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-[80px] border-4 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-[12px] font-bold text-gray-400 uppercase">
                        No search results yet
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-gray-600 uppercase">Image Status</span>
                    {bgImageUrl ? (
                      <button
                        onClick={() => {
                          setBgImageUrl(null);
                          setIsDirty(true);
                          toast.success("Background image removed");
                        }}
                        className="text-[12px] font-bold text-red-500 hover:underline uppercase"
                      >
                        Remove Image
                      </button>
                    ) : (
                      <span className="text-[12px] font-bold text-gray-400 uppercase">No Image Set</span>
                    )}
                  </div>
                  
                  {bgImageUrl && (
                    <div className="flex flex-col gap-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <label htmlFor="bg-image-opacity" className="text-[12px] font-bold text-gray-600 uppercase">Opacity ({Math.round(bgOpacity * 100)}%)</label>
                      </div>
                      <input
                        id="bg-image-opacity"
                        type="range"
                        min="0"
                        max="0.40"
                        step="0.01"
                        className="w-full accent-black cursor-pointer"
                        value={bgOpacity}
                        onChange={(e) => {
                          setBgOpacity(parseFloat(e.target.value));
                          setIsDirty(true);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <hr className="border-t-4 border-black" />

            {/* Slide Editor (visible if slides exist) */}
            {slides.length > 0 && (
              <div className="flex flex-col gap-6 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-bold text-black uppercase">
                    Edit Slide {currentSlideIndex + 1}
                  </h2>
                  <Badge variant="outline" className="text-[12px] uppercase border-2 border-black font-bold text-black">
                    {slides[currentSlideIndex].type}
                  </Badge>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-bold text-gray-600 uppercase">Slide HTML Code</label>
                    <textarea 
                      className="w-full bg-white border-4 border-black rounded-none px-3 py-2 text-[14px] font-mono text-black focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_#000] transition-shadow resize-none h-[250px]"
                      value={slides[currentSlideIndex].html}
                      onChange={(e) => {
                        const newSlides = [...slides];
                        newSlides[currentSlideIndex].html = e.target.value;
                        setSlides(newSlides);
                        setIsDirty(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview Canvas */}
        <div className={`flex-1 overflow-hidden relative flex flex-col ${
          activeTab === "preview" ? "flex" : "hidden lg:flex"
        }`}>
          {/* Grid pattern background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-20 pointer-events-none" />

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 animate-in fade-in duration-500">
              <div className="w-24 h-24 bg-white border-4 border-black flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_#000] relative">
                <div className="absolute inset-0 bg-[var(--color-gold)] opacity-20 animate-ping"></div>
                <Sparkles size={40} className="text-black animate-pulse" />
              </div>
              <h3 className="text-[28px] font-bold text-black mb-3 uppercase tracking-tight">
                Generating Carousel…
              </h3>
              <p className="text-[16px] font-bold text-gray-600 max-w-[400px]">
                Our AI is currently analyzing your brand context, applying gradients, placing the logo, and crafting the perfect copy. Please wait a moment.
              </p>
            </div>
          ) : slides.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10">
              <div className="w-20 h-20 bg-white border-4 border-black flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_#000]">
                <Sparkles size={32} className="text-black" />
              </div>
              <h3 className="text-[24px] font-bold text-black mb-2 uppercase">
                Canvas is empty
              </h3>
              <p className="text-[16px] font-bold text-gray-600 max-w-[300px]">
                Enter a topic on the left and hit generate to create your first carousel draft.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-start lg:justify-center p-3 md:p-8 relative z-10 overflow-y-auto min-h-0 w-full">
              
              {/* Carousel Rendering Frame */}
              <div className="w-full max-w-[450px] flex justify-center items-center transition-all duration-300 h-auto lg:h-full py-2 md:py-4 shrink-0">
                {platformFrame === 'instagram' ? (
                  <div className="w-full bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden flex flex-col my-auto max-h-full">
                    <div className="flex items-center p-3 border-b border-gray-200 gap-3 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center font-bold text-gray-500 text-xs">{activeProject?.name ? activeProject.name.charAt(0).toUpperCase() : 'B'}</div>
                      <div className="font-bold text-sm leading-none flex-1">{activeProject?.name || 'brand_name'}</div>
                      <div className="flex gap-1"><div className="w-1 h-1 bg-black rounded-full"/><div className="w-1 h-1 bg-black rounded-full"/><div className="w-1 h-1 bg-black rounded-full"/></div>
                    </div>
                    <div className="relative w-full flex justify-center bg-gray-100 flex-1 overflow-hidden p-4">
                      <div 
                        id="carousel-preview-node"
                        className={`relative w-full overflow-hidden border-black transition-all duration-300 ${fontFamily} shrink-0`}
                        style={{ 
                           aspectRatio: aspectRatio,
                           borderWidth: '0px',
                           borderRadius: '0px',
                           boxShadow: 'none',
                           backgroundColor: 'white'
                        }}
                      >
                        <div 
                          className="absolute inset-0 w-full h-full"
                          dangerouslySetInnerHTML={{ 
                            __html: injectBgIntoHtml(slides[currentSlideIndex]?.html, bgImageUrl, bgOpacity) 
                          }}
                        />
                        {/* Anti-screenshot watermark overlay */}
                        <div className="absolute inset-0 z-40 pointer-events-none select-none flex flex-col justify-around overflow-hidden opacity-[0.15] mix-blend-difference text-white">
                          <div className="flex justify-around -rotate-12 scale-110 font-black text-[22px] tracking-widest uppercase">
                            <span>carouseln.com</span>
                            <span>carouseln.com</span>
                          </div>
                          <div className="flex justify-around -rotate-12 scale-110 font-black text-[22px] tracking-widest uppercase">
                            <span>carouseln.com</span>
                            <span>carouseln.com</span>
                          </div>
                          <div className="flex justify-around -rotate-12 scale-110 font-black text-[22px] tracking-widest uppercase">
                            <span>carouseln.com</span>
                            <span>carouseln.com</span>
                          </div>
                        </div>
                      </div>

                      {/* Pagination indicator overlay (placed outside preview node to avoid capturing during export) */}
                      <div 
                        className="absolute bottom-6 right-6 text-[14px] font-bold uppercase tracking-widest px-2 py-1 pointer-events-none z-50 shadow-md bg-white/80 text-black rounded"
                      >
                        {currentSlideIndex + 1} / {slides.length}
                      </div>
                    </div>
                    <div className="p-3 shrink-0">
                      <div className="flex gap-4 mb-3">
                        <div className="w-6 h-6 rounded-full border-2 border-black" />
                        <div className="w-6 h-6 rounded-full border-2 border-black" />
                        <div className="w-6 h-6 rounded-full border-2 border-black ml-auto" />
                      </div>
                      <div className="text-sm font-bold mb-1">1,234 likes</div>
                      <div className="text-sm"><span className="font-bold">{activeProject?.name || 'brand_name'}</span> 🚀</div>
                    </div>
                  </div>
                ) : platformFrame === 'linkedin' ? (
                  <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden flex flex-col my-auto max-h-full">
                    <div className="flex items-center p-4 gap-3 shrink-0">
                      <div className="w-12 h-12 rounded-none bg-gray-200 shrink-0 flex items-center justify-center font-bold text-gray-500 text-lg">{activeProject?.name ? activeProject.name.charAt(0).toUpperCase() : 'B'}</div>
                      <div className="flex flex-col flex-1">
                        <div className="font-bold text-sm leading-none">{activeProject?.name || 'Brand Company'}</div>
                        <div className="text-xs text-gray-500 mt-1">100,000 followers</div>
                        <div className="text-xs text-gray-500">1h • 🌐</div>
                      </div>
                      <div className="flex gap-1"><div className="w-1 h-1 bg-gray-500 rounded-full"/><div className="w-1 h-1 bg-gray-500 rounded-full"/><div className="w-1 h-1 bg-gray-500 rounded-full"/></div>
                    </div>
                    <div className="px-4 pb-3 text-sm shrink-0">Check out our latest insights on this topic. 👇</div>
                    <div className="relative w-full flex justify-center bg-gray-100 flex-1 overflow-hidden p-4">
                      <div 
                        id="carousel-preview-node"
                        className={`relative w-full overflow-hidden border-black transition-all duration-300 ${fontFamily} shrink-0`}
                        style={{ 
                          aspectRatio: aspectRatio,
                          borderWidth: '0px',
                          borderRadius: '0px',
                          boxShadow: 'none',
                          backgroundColor: 'white'
                        }}
                      >
                        <div 
                          className="absolute inset-0 w-full h-full"
                          dangerouslySetInnerHTML={{ 
                            __html: injectBgIntoHtml(slides[currentSlideIndex]?.html, bgImageUrl, bgOpacity) 
                          }}
                        />
                        {/* Anti-screenshot watermark overlay */}
                        <div className="absolute inset-0 z-40 pointer-events-none select-none flex flex-col justify-around overflow-hidden opacity-[0.15] mix-blend-difference text-white">
                          <div className="flex justify-around -rotate-12 scale-110 font-black text-[22px] tracking-widest uppercase">
                            <span>carouseln.com</span>
                            <span>carouseln.com</span>
                          </div>
                          <div className="flex justify-around -rotate-12 scale-110 font-black text-[22px] tracking-widest uppercase">
                            <span>carouseln.com</span>
                            <span>carouseln.com</span>
                          </div>
                          <div className="flex justify-around -rotate-12 scale-110 font-black text-[22px] tracking-widest uppercase">
                            <span>carouseln.com</span>
                            <span>carouseln.com</span>
                          </div>
                        </div>
                      </div>

                      {/* Pagination indicator overlay (placed outside preview node to avoid capturing during export) */}
                      <div 
                        className="absolute bottom-6 right-6 text-[14px] font-bold uppercase tracking-widest px-2 py-1 pointer-events-none z-50 shadow-md bg-white/80 text-black rounded"
                      >
                        {currentSlideIndex + 1} / {slides.length}
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-200 shrink-0">
                      <div className="flex justify-between items-center text-gray-500 text-xs px-2 mb-2">
                        <span>👍 ❤️ 💡 1,234</span>
                        <span>56 comments • 12 reposts</span>
                      </div>
                      <div className="flex border-t border-gray-200 pt-2 px-2">
                        <div className="flex-1 text-center font-bold text-gray-500 text-sm py-2">Like</div>
                        <div className="flex-1 text-center font-bold text-gray-500 text-sm py-2">Comment</div>
                        <div className="flex-1 text-center font-bold text-gray-500 text-sm py-2">Repost</div>
                        <div className="flex-1 text-center font-bold text-gray-500 text-sm py-2">Send</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full flex justify-center bg-gray-100 flex-1 overflow-hidden p-4">
                    <div 
                      id="carousel-preview-node"
                      className={`relative w-full overflow-hidden border-black transition-all duration-300 ${fontFamily} shrink-0`}
                      style={{ 
                        aspectRatio: aspectRatio,
                        borderWidth: borderWidth,
                        borderRadius: borderRadius,
                        boxShadow: shadowType === 'neo' ? `12px 12px 0px 0px ${primaryColor}` : 
                                   shadowType === 'soft' ? '0px 10px 30px rgba(0,0,0,0.1)' : 'none',
                        backgroundColor: 'white'
                      }}
                    >
                      <div 
                        className="absolute inset-0 w-full h-full"
                        dangerouslySetInnerHTML={{ 
                          __html: injectBgIntoHtml(slides[currentSlideIndex]?.html, bgImageUrl, bgOpacity) 
                        }}
                      />
                      {/* Anti-screenshot watermark overlay */}
                      <div className="absolute inset-0 z-40 pointer-events-none select-none flex flex-col justify-around overflow-hidden opacity-[0.15] mix-blend-difference text-white">
                        <div className="flex justify-around -rotate-12 scale-110 font-black text-[22px] tracking-widest uppercase">
                          <span>carouseln.com</span>
                          <span>carouseln.com</span>
                        </div>
                        <div className="flex justify-around -rotate-12 scale-110 font-black text-[22px] tracking-widest uppercase">
                          <span>carouseln.com</span>
                          <span>carouseln.com</span>
                        </div>
                        <div className="flex justify-around -rotate-12 scale-110 font-black text-[22px] tracking-widest uppercase">
                          <span>carouseln.com</span>
                          <span>carouseln.com</span>
                        </div>
                      </div>
                    </div>

                    {/* Pagination indicator overlay (placed outside preview node to avoid capturing during export) */}
                    <div 
                      className="absolute bottom-6 right-6 text-[14px] font-bold uppercase tracking-widest px-2 py-1 pointer-events-none z-50 shadow-md bg-white/80 text-black rounded"
                    >
                      {currentSlideIndex + 1} / {slides.length}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-3 md:gap-6 mt-6 md:mt-12 shrink-0">
                <Button
                  variant="outline"
                  className="w-10 h-10 md:w-14 md:h-14 rounded-none p-0 border-2 md:border-4"
                  onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                  disabled={currentSlideIndex === 0}
                  aria-label="Previous slide"
                >
                  <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                </Button>
                
                <div className="flex gap-1.5 md:gap-3 bg-white border-2 md:border-4 border-black p-2 md:p-3 shadow-[2px_2px_0px_0px_#000] md:shadow-[4px_4px_0px_0px_#000] max-w-[200px] sm:max-w-none overflow-x-auto">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      aria-label={`Go to slide ${idx + 1}${idx === currentSlideIndex ? " (current)" : ""}`}
                      aria-current={idx === currentSlideIndex ? "true" : undefined}
                      className={`w-3 h-3 md:w-4 md:h-4 border border-black md:border-2 transition-all ${idx === currentSlideIndex ? 'scale-115' : 'bg-white hover:bg-gray-200'} shrink-0`}
                      style={{ backgroundColor: idx === currentSlideIndex ? primaryColor : undefined }}
                    />
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-10 h-10 md:w-14 md:h-14 rounded-none p-0 border-2 md:border-4"
                  onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                  disabled={currentSlideIndex === slides.length - 1}
                  aria-label="Next slide"
                >
                  <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden high-resolution export node (Fixed at 1080px width) */}
      <div 
        style={{ 
          position: 'fixed', 
          left: '-9999px', 
          top: '-9999px', 
          width: '1080px', 
          height: aspectRatio === '1:1' ? '1080px' : '1350px',
          zIndex: -9999,
          pointerEvents: 'none'
        }}
      >
        <div 
          id="carousel-export-node"
          className={`${fontFamily} shrink-0 relative overflow-hidden`}
          style={{ 
            width: '1080px',
            height: aspectRatio === '1:1' ? '1080px' : '1350px',
            borderWidth: scaleStyleValue(borderWidth, 3),
            borderRadius: scaleStyleValue(borderRadius, 3),
            borderColor: 'black',
            borderStyle: borderWidth !== '0px' ? 'solid' : 'none',
            boxShadow: shadowType === 'neo' 
              ? `36px 36px 0px 0px ${primaryColor}` 
              : shadowType === 'soft' 
                ? '0px 30px 90px rgba(0,0,0,0.1)' 
                : 'none',
            backgroundColor: 'white'
          }}
        >
          <div 
            className="absolute inset-0 w-full h-full"
            style={{
              transform: 'scale(3)',
              transformOrigin: 'top left',
              width: '360px',
              height: aspectRatio === '1:1' ? '360px' : '450px'
            }}
            dangerouslySetInnerHTML={{ 
              __html: injectBgIntoHtml(slides[currentSlideIndex]?.html, bgImageUrl, bgOpacity) 
            }}
          />
        </div>
      </div>
    </div>
  );
};
