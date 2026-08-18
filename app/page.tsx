"use client";

import World from "@/components/world";
import { useEffect, useState } from "react";

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight -
        window.innerHeight;
      
      if (maxScroll > 0) {
        setScrollProgress(window.scrollY / maxScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToScene = (sceneIndex: number) => {
    const maxScroll =
      document.documentElement.scrollHeight -
      window.innerHeight;
    
    // Map scene indices to scroll progress percentages
    const sceneProgress = [0, 0.25, 0.5, 0.75, 1];
    
    window.scrollTo({
      top: maxScroll * sceneProgress[sceneIndex],
      behavior: "smooth",
    });
  };

  return (
    <main className="relative h-[900vh] bg-black">
      <World />

      <nav className="fixed left-0 top-0 z-50 w-full px-8 py-7">
        <div className="flex items-center justify-between">

          <button 
            onClick={() => scrollToScene(0)}
            className="text-[12.6px] font-semibold tracking-[0.315em] text-white hover:text-white/70 transition-colors duration-300"
          >
            PERCEPTION
          </button>

          <div className="hidden gap-8 text-[9px] tracking-[0.27em] text-white/50 md:flex">
            <button 
              onClick={() => scrollToScene(1)}
              className="hover:text-white transition-colors duration-300"
            >
              ABOUT
            </button>
            <button 
              onClick={() => scrollToScene(2)}
              className="hover:text-white transition-colors duration-300"
            >
              PROJECTS
            </button>
            <button 
              onClick={() => scrollToScene(3)}
              className="hover:text-white transition-colors duration-300"
            >
              DREAMS
            </button>
            <button 
              onClick={() => scrollToScene(4)}
              className="hover:text-white transition-colors duration-300"
            >
              CONTACT
            </button>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden flex gap-4 text-[9px] tracking-[0.27em] text-white/50">
            <button 
              onClick={() => scrollToScene(1)}
              className="hover:text-white transition-colors duration-300"
            >
              ABOUT
            </button>
            <button 
              onClick={() => scrollToScene(4)}
              className="hover:text-white transition-colors duration-300"
            >
              CONTACT
            </button>
          </div>

        </div>
      </nav>

      {/* Progress indicator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        <div className="h-px w-24 bg-white/20 overflow-hidden">
          <div 
            className="h-px bg-white/60 transition-all duration-300"
            style={{
              width: `${scrollProgress * 100}%`
            }}
          />
        </div>
        <span className="text-[8px] tracking-[0.2em] text-white/40">
          SCROLL
        </span>
      </div>
    </main>
  );
}