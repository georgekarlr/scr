import React, { useState, useEffect } from 'react';
import pptxgen from "pptxgenjs";
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Milestone, 
  Mail,
  Gamepad2,
  BookOpen,
  CheckSquare,
  PenTool,
  GitMerge,
  ListOrdered,
  FileText,
  Layout as LayoutIcon,
  Globe,
  Flame,
  Trophy,
  Cloud,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  QrCode,
  Target,
  Layers,
  Download
} from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "Ceintelly",
    subtitle: "Stop Studying Alone. Start Studying Smarter.",
    presenter: "George Karl M. Real",
    website: "ceintelly.org",
    type: "title",
    icon: <img src="/icon.svg" alt="Ceintelly" className="w-32 h-32 sm:w-48 sm:h-48 mb-8 animate-bounce drop-shadow-2xl" />
  },
  {
    id: 2,
    title: "The Problem",
    headline: "The Struggle of Self-Study",
    points: [
      { icon: <Users className="text-red-500" />, label: "Isolation", desc: "80% of students lose motivation when studying in a vacuum without peer support." },
      { icon: <Layers className="text-orange-500" />, label: "Fragmentation", desc: "Students juggle multiple apps—one for notes, one for flashcards, another for quizzes." },
      { icon: <Zap className="text-yellow-500" />, label: "Passive Learning", desc: "Traditional reading and highlighting leads to low retention rates compared to active recall." }
    ],
    type: "problem"
  },
  {
    id: 3,
    title: "The Solution",
    headline: "A Social Learning Ecosystem",
    core: "Ceintelly bridges the gap between powerful study tools and social networking. Think \"Education meets Community.\"",
    values: [
      { label: "Centralized", desc: "All your study materials in one place." },
      { label: "Collaborative", desc: "Learn from peers, mentors, and friends." },
      { label: "Engaging", desc: "Gamified systems turn studying into a daily habit." }
    ],
    type: "solution"
  },
  {
    id: 4,
    title: "The Toolkit (7 Study Modes)",
    headline: "Master Any Subject",
    body: "Our dynamic content engine supports 7 interactive learning styles within a single deck:",
    modes: [
      { icon: <BookOpen />, label: "Flashcards", desc: "Active recall with images." },
      { icon: <CheckCircle2 />, label: "Quizzes", desc: "Multiple-choice testing." },
      { icon: <CheckSquare />, label: "Checkboxes", desc: "Multi-select concepts." },
      { icon: <PenTool />, label: "Written Answers", desc: "Type-in responses for deep learning." },
      { icon: <GitMerge />, label: "Matching Pairs", desc: "Drag-and-drop associations." },
      { icon: <ListOrdered />, label: "Ordering", desc: "Sequence logic and timelines." },
      { icon: <FileText />, label: "Rich Notes", desc: "Markdown summaries and attachments." }
    ],
    type: "toolkit"
  },
  {
    id: 5,
    title: "Collaborative Intelligence",
    headline: "Learning is Better Together",
    features: [
      { label: "The Feed", desc: "Discover new decks and see real-time activity from people you follow." },
      { label: "Library Cloning", desc: "Instantly copy and customize expert decks for your own use." },
      { label: "Interaction", desc: "Like, comment, and bookmark content to curate your personal library." },
      { label: "Messaging", desc: "Built-in chat to share resources and form study groups." }
    ],
    type: "social"
  },
  {
    id: 6,
    title: "Gamification & Retention",
    headline: "Addictive by Design",
    points: [
      { icon: <Flame className="text-orange-500" />, label: "Daily Streaks", desc: "Visual motivators to encourage consistency." },
      { icon: <Zap className="text-yellow-500" />, label: "Smart Review", desc: "Automated Spaced Repetition algorithms schedule reviews so you never forget." },
      { icon: <Trophy className="text-blue-500" />, label: "Leaderboards", desc: "Compete globally or amongst friends for XP and glory." },
      { icon: <Milestone className="text-purple-500" />, label: "Achievements", desc: "Unlock badges for milestones (e.g., \"Night Owl\", \"Quiz Master\")." }
    ],
    type: "gamification"
  },
  {
    id: 7,
    title: "Technical Architecture",
    headline: "Built for Scale & Security",
    points: [
      { label: "Cloud-Native", desc: "Enterprise-grade backend infrastructure ensuring high availability." },
      { label: "Real-Time Sync", desc: "Data updates instantly across all devices." },
      { label: "Data Privacy", desc: "Advanced Row-Level Security ensures private content remains strictly confidential." },
      { label: "High Performance", desc: "Optimized database queries and full-text search engines for instant results." }
    ],
    type: "technical"
  },
  {
    id: 8,
    title: "Business Model",
    headline: "Sustainable Growth Strategy",
    streams: [
      { label: "Freemium", desc: "Free access to create and study public content to drive user acquisition.", status: "Available" },
      { label: "Premium Subscription", desc: "Monthly fee for offline mode, ad-free experience, and unlimited private decks.", status: "Future" },
      { label: "Creator Marketplace", desc: "Verified educators sell premium courses and study guides (Revenue Share model).", status: "Future" }
    ],
    type: "business"
  },
  {
    id: 9,
    title: "The Roadmap",
    headline: "What's Next?",
    phases: [
      { phase: "Phase 1 (Now)", desc: "Launch web platform with 7 Study Modes & Social Feed." },
      { phase: "Phase 2", desc: "Native Mobile Apps (iOS & Android)." },
      { phase: "Phase 3", desc: "\"Classrooms\" feature for teachers and study groups." },
      { phase: "Phase 4", desc: "Launch the Premium Marketplace." }
    ],
    type: "roadmap"
  },
  {
    id: 10,
    title: "Join the Learning Revolution",
    subheadline: "Help us reshape how the world studies.",
    contact: {
      name: "George Karl M. Real",
      email: "ceintelly@gmail.com",
      website: "ceintelly.org"
    },
    type: "contact"
  }
];

const PresentationPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) nextSlide();
    if (isRightSwipe) prevSlide();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const slide = slides[currentSlide];

  const downloadPPTX = () => {
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';
    pres.title = "Ceintelly Presentation";

    slides.forEach((s) => {
      const pptSlide = pres.addSlide();
      
      // Background and branding
      pptSlide.background = { color: "FFFFFF" };
      pptSlide.addText("Ceintelly", { 
        x: 0.5, y: 0.2, w: 2, h: 0.5, 
        fontSize: 12, bold: true, color: "2563EB" 
      });
      pptSlide.addImage({ path: "/icon.svg", x: 0.2, y: 0.2, w: 0.3, h: 0.3 });

      if (s.type === 'title') {
        pptSlide.addText(s.title || "", {
          x: 0, y: 2, w: "100%", h: 1,
          align: "center", fontSize: 48, bold: true, color: "111827"
        });
        pptSlide.addText(s.subtitle || "", {
          x: 0, y: 3.2, w: "100%", h: 0.5,
          align: "center", fontSize: 24, color: "6B7280"
        });
        pptSlide.addText(`${s.presenter} | ${s.website}`, {
          x: 0, y: 4.5, w: "100%", h: 0.5,
          align: "center", fontSize: 14, color: "2563EB", bold: true
        });
      }

      if (s.type === 'problem') {
        pptSlide.addText(s.headline || "", {
          x: 0.5, y: 0.8, w: 9, h: 0.8,
          fontSize: 32, bold: true, color: "111827"
        });
        s.points?.forEach((p, idx) => {
          pptSlide.addText(p.label, {
            x: 0.5 + (idx * 3), y: 2.2, w: 2.8, h: 0.5,
            fontSize: 18, bold: true, color: "EF4444"
          });
          pptSlide.addText(p.desc, {
            x: 0.5 + (idx * 3), y: 2.8, w: 2.8, h: 1.5,
            fontSize: 12, color: "4B5563"
          });
        });
      }

      if (s.type === 'solution') {
        pptSlide.addText(s.headline || "", {
          x: 0.5, y: 0.8, w: 9, h: 0.8,
          fontSize: 32, bold: true, color: "111827"
        });
        pptSlide.addShape(pres.ShapeType.rect, {
          x: 0.5, y: 1.8, w: 9, h: 1.2, fill: { color: "2563EB" }
        });
        pptSlide.addText(s.core || "", {
          x: 0.7, y: 1.9, w: 8.6, h: 1,
          fontSize: 20, color: "FFFFFF", italic: true, align: "center"
        });
        s.values?.forEach((v, idx) => {
          pptSlide.addText(v.label, {
            x: 0.5 + (idx * 3.1), y: 3.5, w: 2.8, h: 0.4,
            fontSize: 16, bold: true, color: "2563EB"
          });
          pptSlide.addText(v.desc, {
            x: 0.5 + (idx * 3.1), y: 4, w: 2.8, h: 1,
            fontSize: 12, color: "4B5563"
          });
        });
      }

      if (s.type === 'toolkit') {
        pptSlide.addText(s.headline || "", {
          x: 0.5, y: 0.8, w: 9, h: 0.8,
          fontSize: 32, bold: true, color: "111827"
        });
        pptSlide.addText(s.body || "", {
          x: 0.5, y: 1.6, w: 9, h: 0.4,
          fontSize: 14, color: "6B7280"
        });
        s.modes?.forEach((m, idx) => {
          const row = Math.floor(idx / 4);
          const col = idx % 4;
          pptSlide.addText(m.label, {
            x: 0.5 + (col * 2.3), y: 2.5 + (row * 1.5), w: 2.2, h: 0.3,
            fontSize: 14, bold: true, color: "111827", align: "center"
          });
          pptSlide.addText(m.desc, {
            x: 0.5 + (col * 2.3), y: 2.9 + (row * 1.5), w: 2.2, h: 0.5,
            fontSize: 10, color: "6B7280", align: "center"
          });
        });
      }

      if (s.type === 'social') {
        pptSlide.addText(s.headline || "", {
          x: 0.5, y: 0.8, w: 9, h: 0.8,
          fontSize: 32, bold: true, color: "111827"
        });
        s.features?.forEach((f, idx) => {
          const row = Math.floor(idx / 2);
          const col = idx % 2;
          pptSlide.addText(f.label, {
            x: 0.5 + (col * 4.6), y: 2.2 + (row * 1.5), w: 4.4, h: 0.4,
            fontSize: 18, bold: true, color: "111827"
          });
          pptSlide.addText(f.desc, {
            x: 0.5 + (col * 4.6), y: 2.7 + (row * 1.5), w: 4.4, h: 1,
            fontSize: 12, color: "4B5563"
          });
        });
      }

      if (s.type === 'gamification') {
        pptSlide.addText(s.headline || "", {
          x: 0.5, y: 0.8, w: 9, h: 0.8,
          fontSize: 32, bold: true, color: "111827"
        });
        s.points?.forEach((p, idx) => {
          pptSlide.addText(p.label, {
            x: 0.5 + (idx * 2.3), y: 2.5, w: 2.2, h: 0.4,
            fontSize: 16, bold: true, color: "111827", align: "center"
          });
          pptSlide.addText(p.desc, {
            x: 0.5 + (idx * 2.3), y: 3, w: 2.2, h: 1,
            fontSize: 11, color: "6B7280", align: "center"
          });
        });
      }

      if (s.type === 'technical') {
        pptSlide.addText(s.headline || "", {
          x: 0.5, y: 0.8, w: 9, h: 0.8,
          fontSize: 32, bold: true, color: "111827"
        });
        s.points?.forEach((p, idx) => {
          pptSlide.addText(`• ${p.label}`, {
            x: 0.7, y: 2.2 + (idx * 0.8), w: 8.6, h: 0.3,
            fontSize: 16, bold: true, color: "111827"
          });
          pptSlide.addText(p.desc, {
            x: 0.9, y: 2.5 + (idx * 0.8), w: 8.4, h: 0.3,
            fontSize: 12, color: "6B7280"
          });
        });
      }

      if (s.type === 'business') {
        pptSlide.addText(s.headline || "", {
          x: 0.5, y: 0.8, w: 9, h: 0.8,
          fontSize: 32, bold: true, color: "111827"
        });
        s.streams?.forEach((st: any, idx: number) => {
          pptSlide.addShape(pres.ShapeType.rect, {
            x: 0.5 + (idx * 3.1), y: 2, w: 2.8, h: 3, 
            fill: { color: idx === 1 ? "2563EB" : "F9FAFB" },
            line: { color: "E5E7EB", width: 1 }
          });
          pptSlide.addText(st.label, {
            x: 0.6 + (idx * 3.1), y: 2.2, w: 2.6, h: 0.5,
            fontSize: 16, bold: true, color: idx === 1 ? "FFFFFF" : "2563EB"
          });
          pptSlide.addText(st.desc, {
            x: 0.6 + (idx * 3.1), y: 2.8, w: 2.6, h: 1.5,
            fontSize: 11, color: idx === 1 ? "DBEAFE" : "4B5563"
          });
          if (st.status === 'Future') {
            pptSlide.addText("Coming Soon", {
              x: 0.6 + (idx * 3.1), y: 4.5, w: 2.6, h: 0.3,
              fontSize: 10, bold: true, color: idx === 1 ? "FFFFFF" : "2563EB", align: "right"
            });
          }
        });
      }

      if (s.type === 'roadmap') {
        pptSlide.addText(s.headline || "", {
          x: 0.5, y: 0.8, w: 9, h: 0.8,
          fontSize: 32, bold: true, color: "111827"
        });
        pptSlide.addShape(pres.ShapeType.line, {
          x: 0.5, y: 3.5, w: 9, h: 0, line: { color: "E5E7EB", width: 2 }
        });
        s.phases?.forEach((p, idx) => {
          pptSlide.addShape(pres.ShapeType.ellipse, {
            x: 0.4 + (idx * 2.3), y: 3.3, w: 0.4, h: 0.4, fill: { color: "2563EB" }
          });
          pptSlide.addText(p.phase, {
            x: 0.4 + (idx * 2.3), y: 2.5, w: 2.2, h: 0.4,
            fontSize: 14, bold: true, color: "111827"
          });
          pptSlide.addText(p.desc, {
            x: 0.4 + (idx * 2.3), y: 3.8, w: 2.2, h: 1,
            fontSize: 11, color: "6B7280"
          });
        });
      }

      if (s.type === 'contact') {
        pptSlide.addText(s.title || "", {
          x: 0, y: 1.5, w: "100%", h: 1,
          align: "center", fontSize: 42, bold: true, color: "111827"
        });
        pptSlide.addText(s.subheadline || "", {
          x: 0, y: 2.5, w: "100%", h: 0.5,
          align: "center", fontSize: 20, color: "2563EB", bold: true
        });
        pptSlide.addText(`Name: ${s.contact?.name}`, {
          x: 3.5, y: 3.5, w: 3, h: 0.4, fontSize: 14, color: "111827"
        });
        pptSlide.addText(`Email: ${s.contact?.email}`, {
          x: 3.5, y: 3.9, w: 3, h: 0.4, fontSize: 14, color: "111827"
        });
        pptSlide.addText(`Website: ${s.contact?.website}`, {
          x: 3.5, y: 4.3, w: 3, h: 0.4, fontSize: 14, color: "111827"
        });
      }
    });

    pres.writeFile({ fileName: "Ceintelly_Presentation.pptx" });
  };

  return (
    <div 
      className="flex flex-col items-center justify-center p-2 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)] lg:min-h-0"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="w-full max-w-5xl overflow-hidden flex flex-col relative transition-all duration-300">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100/20 z-20 rounded-full">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 sm:p-16 overflow-y-auto">
          {slide.type === 'title' && (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              {slide.icon}
              <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-gray-900 mb-4 tracking-tighter">
                {slide.title}
              </h1>
              <p className="text-lg sm:text-2xl lg:text-3xl text-gray-500 font-medium mb-8 sm:mb-12">
                {slide.subtitle}
              </p>
              <div className="space-y-2">
                <p className="text-blue-600 font-bold text-base sm:text-lg">{slide.presenter}</p>
                <p className="text-gray-400 font-semibold text-sm sm:text-base">{slide.website}</p>
              </div>
            </div>
          )}

          {slide.type === 'problem' && (
            <div className="h-full flex flex-col">
              <span className="text-blue-600 font-bold uppercase tracking-widest mb-2 text-xs sm:text-sm">Slide {slide.id}</span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6 sm:mb-12">{slide.headline}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                {slide.points?.map((p, i) => (
                  <div key={i} className="bg-red-50 p-6 sm:p-8 rounded-3xl border border-red-100">
                    <div className="p-2 sm:p-3 bg-white rounded-2xl w-fit shadow-sm mb-4 sm:mb-6">
                      {React.cloneElement(p.icon as React.ReactElement, { className: 'h-6 w-6 sm:h-8 sm:h-8' })}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{p.label}</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.type === 'solution' && (
            <div className="h-full flex flex-col">
              <span className="text-blue-600 font-bold uppercase tracking-widest mb-2 text-xs sm:text-sm">Slide {slide.id}</span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6 sm:mb-8">{slide.headline}</h2>
              <div className="bg-blue-600 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] text-white mb-6 sm:mb-12 shadow-xl shadow-blue-100">
                <p className="text-lg sm:text-2xl font-medium leading-relaxed italic">
                  "{slide.core}"
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {slide.values?.map((v, i) => (
                  <div key={i} className="p-4 sm:p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <h3 className="text-base sm:text-lg font-black text-blue-600 mb-2 uppercase tracking-tight">{v.label}</h3>
                    <p className="text-sm sm:text-base text-gray-600">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.type === 'toolkit' && (
            <div className="h-full flex flex-col">
              <span className="text-blue-600 font-bold uppercase tracking-widest mb-2 text-xs sm:text-sm">Slide {slide.id}</span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-3 sm:mb-4">{slide.headline}</h2>
              <p className="text-gray-500 text-base sm:text-lg mb-6 sm:mb-10 font-medium">{slide.body}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {slide.modes?.map((m, i) => (
                  <div key={i} className="flex flex-col items-center text-center group cursor-default p-2">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-600 mb-3 sm:mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm border border-gray-100">
                      {React.cloneElement(m.icon as React.ReactElement, { className: 'h-6 w-6 sm:h-8 sm:h-8' })}
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-1">{m.label}</h3>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium leading-tight">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.type === 'social' && (
            <div className="h-full flex flex-col">
              <span className="text-blue-600 font-bold uppercase tracking-widest mb-2 text-xs sm:text-sm">Slide {slide.id}</span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6 sm:mb-10">{slide.headline}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                {slide.features?.map((f, i) => (
                  <div key={i} className="flex gap-4 sm:gap-6 p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-3xl border border-gray-100 hover:border-blue-200 transition-colors">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-center text-blue-600 flex-shrink-0">
                      <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{f.label}</h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.type === 'gamification' && (
            <div className="h-full flex flex-col">
              <span className="text-blue-600 font-bold uppercase tracking-widest mb-2 text-xs sm:text-sm">Slide {slide.id}</span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6 sm:mb-12">{slide.headline}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {slide.points?.map((p, i) => (
                  <div key={i} className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 shadow-lg shadow-gray-100/50 flex flex-col items-center text-center">
                    <div className="mb-4 sm:mb-6">
                      {React.cloneElement(p.icon as React.ReactElement, { className: 'h-10 w-10 sm:h-12 sm:h-12' })}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{p.label}</h3>
                    <p className="text-gray-500 leading-relaxed text-xs sm:text-sm font-medium">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.type === 'technical' && (
            <div className="h-full flex flex-col justify-center">
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
                <div className="flex-1 w-full">
                  <span className="text-blue-600 font-bold uppercase tracking-widest mb-2 block text-xs sm:text-sm">Slide {slide.id}</span>
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6 sm:mb-8">{slide.headline}</h2>
                  <div className="space-y-4 sm:space-y-6">
                    {slide.points?.map((p, i) => (
                      <div key={i} className="flex gap-3 sm:gap-4 items-start">
                        <div className="mt-1 sm:mt-1.5 h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-none mb-1">{p.label}</h3>
                          <p className="text-sm sm:text-base text-gray-500">{p.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-1 justify-center lg:flex hidden">
                   <div className="relative">
                      <Cloud className="h-32 w-32 sm:h-48 sm:w-48 text-blue-50 opacity-50" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Smartphone className="h-16 w-16 sm:h-24 sm:w-24 text-blue-600" />
                      </div>
                      <Globe className="absolute -top-4 -right-4 h-12 w-12 sm:h-16 sm:w-16 text-indigo-200 animate-pulse" />
                   </div>
                </div>
              </div>
            </div>
          )}

          {slide.type === 'business' && (
            <div className="h-full flex flex-col">
              <span className="text-blue-600 font-bold uppercase tracking-widest mb-2 text-xs sm:text-sm">Slide {slide.id}</span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6 sm:mb-12">{slide.headline}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {slide.streams?.map((s: any, i: number) => (
                  <div key={i} className={`p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border relative ${i === 1 ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100' : 'bg-white border-gray-100'}`}>
                    {s.status === 'Future' && (
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${i === 1 ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                        Coming Soon
                      </div>
                    )}
                    <h3 className={`text-xl sm:text-2xl font-black mb-3 sm:mb-4 ${i === 1 ? 'text-white' : 'text-blue-600'}`}>{s.label}</h3>
                    <p className={`text-sm sm:text-base leading-relaxed ${i === 1 ? 'text-blue-50' : 'text-gray-600'}`}>{s.desc}</p>
                    <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-current opacity-20">
                      <div className="h-2 w-full bg-current rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.type === 'roadmap' && (
            <div className="h-full flex flex-col">
              <span className="text-blue-600 font-bold uppercase tracking-widest mb-2 text-xs sm:text-sm">Slide {slide.id}</span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-8 sm:mb-16">{slide.headline}</h2>
              <div className="relative flex-1">
                <div className="absolute top-0 md:top-1/2 left-4 md:left-0 w-1 md:w-full h-full md:h-1 bg-gray-100 md:-translate-y-1/2" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8 h-full">
                  {slide.phases?.map((p, i) => (
                    <div key={i} className="relative flex flex-row md:flex-col items-start md:items-start pl-10 md:pl-0">
                      <div className="absolute left-0 md:relative w-8 h-8 md:w-12 md:h-12 bg-white border-4 border-blue-600 rounded-full mb-0 md:mb-6 z-10 flex items-center justify-center font-bold text-blue-600 text-xs md:text-base shadow-lg">
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-1 sm:mb-2 uppercase tracking-tighter">{p.phase}</h3>
                        <p className="text-sm sm:text-base text-gray-500 font-medium">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {slide.type === 'contact' && (
            <div className="h-full flex flex-col items-center justify-center text-center py-4">
              <img src="/icon.svg" alt="Ceintelly" className="h-20 w-20 sm:h-32 sm:w-32 mb-8 drop-shadow-xl" />
              <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-2 sm:mb-4 tracking-tighter">{slide.title}</h2>
              <p className="text-lg sm:text-2xl text-blue-600 font-bold mb-8 sm:mb-16">{slide.subheadline}</p>
              
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center mb-8 sm:mb-16 w-full max-w-3xl">
                <div className="bg-gray-50 p-6 sm:p-8 rounded-3xl border border-gray-100 flex items-center justify-center w-full lg:w-fit">
                  <QrCode className="h-32 w-32 sm:h-48 sm:w-48 text-gray-900" />
                </div>
                <div className="text-left space-y-4 sm:space-y-6 flex-1 w-full">
                  <div className="flex items-center gap-4 group">
                    <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Presenter</p>
                      <p className="text-base sm:text-xl font-bold text-gray-900">{slide.contact?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                      <p className="text-base sm:text-xl font-bold text-gray-900 break-all sm:break-normal">{slide.contact?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Website</p>
                      <p className="text-base sm:text-xl font-bold text-gray-900">{slide.contact?.website}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="w-full max-w-5xl flex items-center justify-between px-4 sm:px-8 mt-4 sm:mt-8">
        <button 
          onClick={prevSlide}
          className="p-3 sm:p-5 rounded-full bg-white/50 backdrop-blur-sm border border-gray-100 text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>
        
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2 sm:gap-3">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${
                  i === currentSlide 
                    ? 'w-8 sm:w-12 bg-blue-600 shadow-lg shadow-blue-200' 
                    : 'w-2 sm:w-3 bg-gray-200 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentSlide === 0 && (
            <button
              onClick={downloadPPTX}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <Download className="h-4 w-4" />
              Download PowerPoint
            </button>
          )}
        </div>

        <button 
          onClick={nextSlide}
          className="p-3 sm:p-5 rounded-full bg-white/50 backdrop-blur-sm border border-gray-100 text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>
      </div>

      <p className="mt-6 sm:mt-8 text-[10px] sm:text-sm text-gray-400 font-bold uppercase tracking-[0.2em] text-center px-4">
        Use Arrow Keys or Swipe to Navigate
      </p>
    </div>
  );
};

export default PresentationPage;
