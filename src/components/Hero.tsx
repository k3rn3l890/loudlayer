import { useState, useEffect, useRef } from "react";
import { ShoppingBag, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { animate, createTimeline, utils } from "animejs";
import heroImage from "../../loudlayer_assets/heroSection_image-.png";
import maleFemaleFront from "../../loudlayer_assets/male_female_front.jpg";
import maleHero from "../../loudlayer_assets/male-hero.jpg";
import maleFrontFemaleBack from "../../loudlayer_assets/maleFront_femaleBack.jpg";

interface HeroProps {
  onExploreClick: () => void;
  onViewStore: () => void;
}

function splitToChars(text: string) {
  return [...text].map((char, i) => (
    <span
      key={i}
      className="anime-char"
      style={{ display: "inline-block", opacity: 0 }}
    >
      {char === " " ? "\u00A0" : char}
    </span>
  ));
}

export default function Hero({ onExploreClick, onViewStore }: HeroProps) {
  const images = [heroImage, maleFemaleFront, maleHero, maleFrontFemaleBack];
  const [currentIndex, setCurrentIndex] = useState(0);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    if (animated.current) return;
    animated.current = true;

    const leftChars = leftRef.current?.querySelectorAll(".anime-char");
    const rightChars = rightRef.current?.querySelectorAll(".anime-char");

    const tl = createTimeline({});

    if (leftChars?.length) {
      tl.set(
        leftChars,
        {
          translateX: () => utils.random(-100, 100),
          translateY: () => utils.random(-80, 80),
          rotateZ: () => utils.random(-15, 15),
          scale: 0.65,
          opacity: 0.85,
        },
        0
      );

      tl.add(
        leftChars,
        {
          translateX: 0,
          translateY: 0,
          rotateZ: 0,
          scale: 1,
          opacity: 1,
          easing: "easeOutBack(1.7)",
          delay: utils.stagger(30, { from: "first" }),
          duration: 550,
        },
        500
      );
    }

    if (rightChars?.length) {
      tl.set(
        rightChars,
        {
          translateX: () => utils.random(-100, 100),
          translateY: () => utils.random(-80, 80),
          rotateZ: () => utils.random(-15, 15),
          scale: 0.65,
          opacity: 0.85,
        },
        0
      );

      tl.add(
        rightChars,
        {
          translateX: 0,
          translateY: 0,
          rotateZ: 0,
          scale: 1,
          opacity: 1,
          easing: "easeOutBack(1.7)",
          delay: utils.stagger(30, { from: "first" }),
          duration: 550,
        },
        700
      );
    }
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-zinc-50 border-b border-neutral-200/50 pt-8 pb-14 px-6 md:px-12">
      {/* Absolute Decorative Symbols */}
      <div className="absolute top-[40%] left-[10%] opacity-20 pointer-events-none">
        <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto relative flex flex-col items-center">
        {/* Main Grid: Typo Left + Model Center + Typo Right */}
        <div className="relative w-full grid grid-cols-1 md:grid-cols-12 gap-4 items-center min-h-[460px] md:min-h-[520px]">

          {/* LTL: "where - style" */}
          <div className="md:col-span-4 z-10 select-none order-2 md:order-1 flex flex-col justify-center text-left">
            <div ref={leftRef} className="space-y-0 md:-space-y-4">
              <h1 className="text-6xl sm:text-7xl lg:text-[7.5rem] font-sans font-black tracking-tighter text-neutral-900 leading-none">
                {splitToChars("where")}
              </h1>
              <h1 className="text-6xl sm:text-7xl lg:text-[7.5rem] font-sans font-black tracking-tighter text-neutral-900 leading-none flex items-center gap-2">
                {splitToChars("- style")}
              </h1>
            </div>

            {/* Stylized Collection Meta Block */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="mt-12 md:mt-24 max-w-[280px]"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-2">
                /New Collection 2026
              </p>
              <p className="text-xs md:text-sm text-neutral-600 font-light leading-relaxed">
                Explore curated collections, exclusive drops and everyday essentials, all thoughtfully designed in one stylish shipping destination.
              </p>

              <button
                onClick={onExploreClick}
                className="mt-5 border-b border-neutral-900 text-xs font-mono font-bold text-neutral-900 pb-1 hover:text-orange-500 hover:border-orange-500 transition-colors cursor-pointer inline-flex items-center gap-1 group"
              >
                DISCOVER STORY <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </motion.div>
          </div>

          {/* Center Model Portrait with layering effects */}
          <div className="md:col-span-4 relative flex flex-col justify-center items-center order-1 md:order-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="relative w-[280px] sm:w-[320px] md:w-[340px] aspect-[4/5] rounded-[24px] overflow-hidden bg-neutral-200 border-4 border-white shadow-xl shadow-neutral-300/40 z-20 group"
            >
              {/* Image */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentIndex}
                  src={images[currentIndex]}
                  alt="LOUDLAYER Editor's Choice technical parka coat"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                />
              </AnimatePresence>
              {/* Subtle Ambient Shadow Overlay inside image */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/20 via-transparent to-transparent opacity-85 pointer-events-none" />
            </motion.div>

            <div className="absolute right-0 -bottom-8 select-none text-neutral-200 pointer-events-none text-[5rem] md:text-[7rem] leading-none font-sans font-black opacity-10 hidden sm:block rotate-90 origin-bottom-right">
              LOUDLAYER
            </div>

            <motion.button
              onClick={onViewStore}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-6 flex items-center gap-2.5 px-6 py-3 bg-neutral-900 text-white text-sm font-bold rounded-full hover:bg-orange-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-neutral-900/20 cursor-pointer z-30"
            >
              <ShoppingBag className="w-4 h-4" />
              View Store
            </motion.button>
          </div>

          {/* RTR: "lives - now" */}
          <div className="md:col-span-4 z-10 select-none order-3 flex flex-col justify-center text-right">
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-2 md:-mb-1">
              // STYLED FOR LIFE
            </p>
            <div ref={rightRef} className="space-y-0 md:-space-y-4">
              <h1 className="text-6xl sm:text-7xl lg:text-[7.5rem] font-sans font-black tracking-tighter text-neutral-900 leading-none">
                {splitToChars("lives")}
              </h1>
              <h1 className="text-6xl sm:text-7xl lg:text-[7.5rem] font-sans font-black tracking-tighter text-neutral-900 leading-none">
                {splitToChars("- now")}
              </h1>
            </div>

            {/* Stylized Count Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="mt-12 md:mt-[10.5rem] self-end flex flex-col items-end"
            >
              <div className="flex items-center gap-1 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-orange-500 font-mono text-[10px] uppercase tracking-wider font-bold">
                  Live Feed Count
                </span>
              </div>
              <h3 className="text-4xl md:text-5xl font-sans font-black tracking-tighter text-neutral-900 mt-2 select-all">
                280K
              </h3>
              <p className="font-mono text-[10px] uppercase text-neutral-400 tracking-wider">
                PEOPLE WE INSPIRE
              </p>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
