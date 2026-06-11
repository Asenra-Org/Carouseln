export interface User {
  id: string;
  email: string;
  name?: string;
  plan: "Free" | "Pro" | "Agency";
  createdAt: string;
}

export interface BrandProject {
  id: string;
  userId: string;
  name: string;
  industry: string;
  description?: string;
  logoUrl?: string;
  
  // Colors
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorBg: string;
  colorText: string;
  
  // Typography
  fontHeading: string;
  fontBody: string;
  
  // Personality
  vibe: "Luxury" | "Minimal" | "Bold" | "Editorial" | "Playful" | "Raw";
  tone: "Professional" | "Casual" | "Witty" | "Inspirational" | "Authoritative" | "Minimalist";
  
  createdAt: string;
  updatedAt: string;
}

export interface CarouselSlide {
  slideNumber: number;
  type: "hook" | "content" | "tip" | "stat" | "quote" | "cta";
  heading: string;
  subtext: string;
  layoutTemplate: "bold-center" | "editorial-split" | "minimal-dark" | "typographic";
  emphasis: "heading" | "subtext" | "both";
}

export interface Carousel {
  id: string;
  userId: string;
  brandProjectId: string;
  title: string;
  topic: string;
  platform: "Instagram" | "LinkedIn" | "Facebook";
  slideCount: number;
  slidesJson: CarouselSlide[];
  suggestedCaption?: string;
  suggestedHashtags?: string[];
  status: "draft" | "complete";
  createdAt: string;
}
