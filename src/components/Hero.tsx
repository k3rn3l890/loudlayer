import { useState, useEffect } from "react";
import { Plus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import heroImage from "../../loudlayer_assets/heroSection_image-.png";
import maleFemaleFront from "../../loudlayer_assets/male_female_front.jpg";
import maleHero from "../../loudlayer_assets/male-hero.jpg";
import maleFrontFemaleBack from "../../loudlayer_assets/maleFront_femaleBack.jpg";

interface HeroProps {
  onAddCurated: () => void;
  onExploreClick: () => void;
}

export default function Hero({ onAddCurated, onExploreClick }: HeroProps) {
  const images = [heroImage, maleFemaleFront, maleHero, maleFrontFemaleBack];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

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
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-0 md:-space-y-4"
            >
              <h1 className="text-6xl sm:text-7xl lg:text-[7.5rem] font-sans font-black tracking-tighter text-neutral-900 leading-none">
                where
              </h1>
              <h1 className="text-6xl sm:text-7xl lg:text-[7.5rem] font-sans font-black tracking-tighter text-neutral-900 leading-none flex items-center gap-2">
                - style
              </h1>
            </motion.div>

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
          <div className="md:col-span-4 relative flex justify-center items-center order-1 md:order-2">
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

              {/* Styled Orange Ribbon / Accent Tag on jacket context */}
              <div className="absolute top-1/2 right-4 flex flex-col items-center gap-1 pointer-events-none">
                <span className="w-[3px] h-12 bg-orange-500 rounded-full animate-bounce" />
                <span className="font-mono text-[9px] text-white font-bold bg-orange-500 px-1 py-0.5 rounded tracking-tighter shadow-md">
                  CORE TAG V.26
                </span>
              </div>
            </motion.div>

            {/* Styling Assist / Floating Widget Overlay (Stags icons & + Button) */}
            <motion.div
              initial={{ scale: 0, opacity: 0, x: 40 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              transition={{ delay: 0.6, type: "spring", mass: 0.5, damping: 15 }}
              className="absolute -right-4 sm:-right-8 top-[60%] z-30 bg-white/95 backdrop-blur-sm self-center shadow-lg rounded-[18px] p-3 border border-neutral-100 flex items-center gap-3"
            >
              <div className="flex items-center -space-x-2">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120"
                  alt="Stylist 1"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=120"
                  alt="Stylist 2"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover"
                />
              </div>
              <button
                id="btn-add-curated"
                onClick={onAddCurated}
                className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all cursor-pointer shadow shadow-orange-500/50 hover:scale-110 active:scale-95 group"
                title="Add Curated Outfit to Cart"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              </button>
            </motion.div>

            {/* Accent Cross Mark behind image */}
            <div className="absolute -left-12 -bottom-2 select-none text-orange-500 pointer-events-none font-bold text-4xl font-mono animate-spin-slow opacity-90 hidden sm:block">
              +
            </div>
            
            <div className="absolute right-0 -bottom-8 select-none text-neutral-200 pointer-events-none text-[5rem] md:text-[7rem] leading-none font-sans font-black opacity-10 hidden sm:block rotate-90 origin-bottom-right">
              LOUDLAYER
            </div>
          </div>

          {/* RTR: "lives - now" */}
          <div className="md:col-span-4 z-10 select-none order-3 flex flex-col justify-center text-right">
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-0 md:-space-y-4"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-2 md:-mb-1">
                // STYLED FOR LIFE
              </p>
              <h1 className="text-6xl sm:text-7xl lg:text-[7.5rem] font-sans font-black tracking-tighter text-neutral-900 leading-none">
                lives
              </h1>
              <h1 className="text-6xl sm:text-7xl lg:text-[7.5rem] font-sans font-black tracking-tighter text-neutral-900 leading-none">
                - now
              </h1>
            </motion.div>

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
