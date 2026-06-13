import React, { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Sparkles, Save, Download, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { auth, db } from "../../lib/firebase/client";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';

export const Generator = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [topic, setTopic] = useState("");
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeProject, setActiveProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

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
        const userDoc = await withTimeout(getDoc(doc(db, "users", user.uid)), 8000);
        if (userDoc.exists() && userDoc.data().activeProjectId) {
          const projectDoc = await withTimeout(getDoc(doc(db, "projects", userDoc.data().activeProjectId)), 8000);
          if (projectDoc.exists()) {
            setActiveProject({ id: projectDoc.id, ...projectDoc.data() });
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
              setCurrentSlideIndex(0);
              toast.success("Loaded saved carousel!");
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
      let generationsToday = userData.generationsToday || 0;

      if (lastGenDate !== todayStr) {
        generationsToday = 0; // reset for a new day
      }

      const isTester = currentUser.email === "karanpatil82005@gmail.com";

      if (generationsToday >= 1 && !isTester) {
        throw new Error("Free limit reached: You can generate 1 carousel per day. Please try again tomorrow!");
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      if (!data.slides || data.slides.length === 0) {
        throw new Error("No slides returned from the server.");
      }

      // Increment limit and save in Firestore
      await withTimeout(
        setDoc(userRef, {
          generationsToday: generationsToday + 1,
          lastGenDate: todayStr,
          updatedAt: serverTimestamp()
        }, { merge: true }),
        8000
      );

      setSlides(data.slides);
      setCurrentSlideIndex(0);
      toast.success(isTester ? "Carousel generated! (Unlimited Dev Mode)" : "Carousel generated! (1/1 today)");
    } catch (err: any) {
      console.error("Client generation error:", err);
      toast.error(err.message || "Generation failed", { duration: 6000 });
    } finally {
      setLoading(false);
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
            updatedAt: serverTimestamp()
          }),
          10000
        );
        toast.success("Carousel updated successfully!");
      } else {
        // Create new document
        await withTimeout(
          addDoc(collection(db, "carousels"), {
            userId: auth.currentUser.uid,
            projectId: activeProject ? activeProject.id : null,
            title: topic,
            slides,
            status: "complete",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }),
          10000
        );
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
        
        const node = document.getElementById('carousel-preview-node');
        if (!node) continue;
        
        const dataUrl = await htmlToImage.toPng(node, {
          quality: 1,
          pixelRatio: 1080 / node.offsetWidth, // scale up to 1080px width
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
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-screen bg-white">
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
        <div className={`w-full lg:w-[450px] bg-white lg:border-r-4 border-black flex flex-col z-10 overflow-y-auto shrink-0 shadow-[8px_0px_0px_0px_rgba(0,0,0,0.1)] ${
          activeTab === "editor" ? "flex" : "hidden lg:flex"
        }`}>
          <div className="p-6 flex flex-col gap-8">
            
            {/* AI Generation Form */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[16px] font-bold text-black uppercase flex items-center gap-2">
                  <Sparkles size={18} className="text-black" /> AI Studio
                </h2>
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
            <div className="flex-1 flex flex-col items-center justify-center p-3 md:p-8 relative z-10 overflow-y-auto min-h-0 w-full">
              
              {/* Carousel Rendering Frame */}
              <div className="w-full max-w-[450px] flex justify-center items-center transition-all duration-300 h-full py-2 md:py-4">
                {platformFrame === 'instagram' ? (
                  <div className="w-full bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden flex flex-col my-auto max-h-full">
                    <div className="flex items-center p-3 border-b border-gray-200 gap-3 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center font-bold text-gray-500 text-xs">{activeProject?.name ? activeProject.name.charAt(0).toUpperCase() : 'B'}</div>
                      <div className="font-bold text-sm leading-none flex-1">{activeProject?.name || 'brand_name'}</div>
                      <div className="flex gap-1"><div className="w-1 h-1 bg-black rounded-full"/><div className="w-1 h-1 bg-black rounded-full"/><div className="w-1 h-1 bg-black rounded-full"/></div>
                    </div>
                    <div className="relative w-full flex justify-center bg-gray-100 flex-1 overflow-hidden">
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
                          dangerouslySetInnerHTML={{ __html: slides[currentSlideIndex]?.html || '' }}
                        />

                        {/* Pagination indicator overlay (if desired) */}
                        <div 
                          className="absolute bottom-6 right-6 text-[14px] font-bold uppercase tracking-widest px-2 py-1 pointer-events-none z-50 shadow-md"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            color: 'black',
                            borderRadius: '4px'
                          }}
                        >
                          {currentSlideIndex + 1} / {slides.length}
                        </div>
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
                    <div className="relative w-full flex justify-center bg-gray-100 flex-1 overflow-hidden">
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
                          dangerouslySetInnerHTML={{ __html: slides[currentSlideIndex]?.html || '' }}
                        />

                        {/* Pagination indicator overlay (if desired) */}
                        <div 
                          className="absolute bottom-6 right-6 text-[14px] font-bold uppercase tracking-widest px-2 py-1 pointer-events-none z-50 shadow-md"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            color: 'black',
                            borderRadius: '4px'
                          }}
                        >
                          {currentSlideIndex + 1} / {slides.length}
                        </div>
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
                      dangerouslySetInnerHTML={{ __html: slides[currentSlideIndex]?.html || '' }}
                    />

                    {/* Pagination indicator overlay (if desired) */}
                    <div 
                      className="absolute bottom-6 right-6 text-[14px] font-bold uppercase tracking-widest px-2 py-1 pointer-events-none z-50 shadow-md"
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        color: 'black',
                        borderRadius: '4px'
                      }}
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
    </div>
  );
};
