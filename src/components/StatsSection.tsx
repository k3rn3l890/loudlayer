import { useState } from "react";
import { ArrowRight, Eye, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CATEGORY_STATS } from "../data";

const PRODUCT_DETAILS: Record<string, { name: string; description: string; features: string[]; price: number; tagline: string }> = {
  "01": {
    name: "LOUDLAYER Structured Crew Shirt",
    description: "A refined heavyweight shirt constructed from premium organic cotton jersey with reinforced shoulder seams and a relaxed drop-shoulder cut.",
    features: ["Organic Cotton", "Reinforced Seams", "Drop Shoulder", "Breathable Knit", "Tubular Hem", "Pre-Shrunk"],
    price: 85,
    tagline: "Engineered for all-day comfort with a clean, sculptural silhouette."
  },
  "02": {
    name: "LOUDLAYER Insulated Field Jacket",
    description: "A technical all-weather shell built from recycled ripstop nylon with taped seams and a hidden snap storm placket.",
    features: ["Waterproof 12000mm", "Breathable 8000g/m²", "Ripstop Fabric", "Reflective Outlines", "Modular Zip Knees", "Packable Hood"],
    price: 240,
    tagline: "Featuring high-reflectivity neon active elements and double tape zip protectors, made specifically to capture active movement in extreme rain."
  },
  "03": {
    name: "LOUDLAYER Relaxed Tapered Trouser",
    description: "A modern tailored trouser cut from Japanese stretch twill with an elasticated waistband and articulated knee panels.",
    features: ["Stretch Twill", "Elastic Waist", "Articulated Knees", "Zip Fly", "Side Pockets", "Tapered Leg"],
    price: 120,
    tagline: "Designed for fluid movement through urban environments without sacrificing structure or finish."
  },
  "04": {
    name: "LOUDLAYER Heavyweight Sweatsuit Set",
    description: "A coordinated fleece set made from 400GSM brushed-back loop terry, finished with ribbed cuffs and a kangaroo pocket.",
    features: ["400GSM Fleece", "Brushed Terry", "Ribbed Cuffs", "Kangaroo Pocket", "Matching Set", "Adjustable Hood"],
    price: 195,
    tagline: "Maximum warmth, zero bulk. Built for low-impact days and high-impact street presence."
  }
};

interface StatsSectionProps {
  onCategorySelect?: (categoryName: string) => void;
}

export default function StatsSection({ onCategorySelect }: StatsSectionProps) {
  const [activeCategory, setActiveCategory] = useState(CATEGORY_STATS[0]); // Default to "Shirt"
  const [showProductOverlay, setShowProductOverlay] = useState(false);
  const product = PRODUCT_DETAILS[activeCategory.code];

  return (
    <section className="w-full bg-zinc-50 py-16 px-6 md:px-12 border-b border-neutral-200/50">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Description & See Product action */}
          <div className="md:col-span-4 flex flex-col justify-center">
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-3">
              // DESIGN PHILOSOPHY
            </span>
            <p className="text-neutral-700 text-lg md:text-xl font-light leading-relaxed mb-8">
              Every piece carries rhythm beyond clothing, it's motion and meaning where street energy meets.
            </p>

            <button
              id="btn-see-product"
              onClick={() => setShowProductOverlay(true)}
              className="self-start px-6 h-12 rounded-full border border-neutral-800 hover:border-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300 font-mono text-xs tracking-widest uppercase inline-flex items-center gap-3 cursor-pointer group"
            >
              SEE PRODUCT 
              <span className="w-6 h-6 rounded-full bg-neutral-950 text-white flex items-center justify-center group-hover:bg-white group-hover:text-neutral-950 transition-colors">
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>

          {/* Central Column: Cutout Model Image Showcase */}
          <div className="md:col-span-4 flex justify-center relative">
            <div className="relative w-[280px] sm:w-[320px] aspect-[4/5] flex items-center justify-center">
              
              {/* Outer Custom Cutout Framing with Orange Accents */}
              <div className="absolute inset-0 border-2 border-dashed border-neutral-300 rounded-[48px] p-4 scale-105 pointer-events-none" />
              
              {/* Spinning Orange Loader Accent */}
              <div className="absolute top-4 left-4 w-6 h-6 border-b-2 border-orange-500 rounded-full animate-spin pointer-events-none" />
              
              {/* Beautiful frame with a unique rounded layout masking */}
              <div className="relative w-full h-full rounded-[40px] overflow-hidden bg-neutral-100 border-4 border-white shadow-xl z-10 group">
                
                {/* Dynamically transition image when selecting categories */}
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeCategory.code}
                    src={activeCategory.image}
                    alt={activeCategory.name}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>

                {/* Constant Bottom Technical Overlay Tag */}
                <div className="absolute bottom-4 inset-x-4 bg-white/90 backdrop-blur-md px-4 py-3 rounded-[20px] shadow border border-neutral-200/50 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-mono text-neutral-400 block leading-none font-bold uppercase">
                      ACTIVE VIEWER
                    </span>
                    <span className="font-mono text-[11px] font-bold text-neutral-800 block mt-1">
                      SPEC // {activeCategory.name.toUpperCase()}-{activeCategory.code}26c
                    </span>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
                </div>
              </div>

              {/* Decorative category label on the left edge */}
              <div className="hidden md:block absolute -left-12 top-[40%] bg-neutral-900 border border-neutral-800 text-white font-mono text-[10px] uppercase font-bold tracking-widest py-1.5 px-4 rotate-270 rounded-full z-20 pointer-events-none shadow-md">
                CAT-{activeCategory.code} / V26
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Typographic List of Categories with Counts */}
          <div className="md:col-span-4 flex flex-col justify-center">
            <span className="font-mono text-[9px] tracking-widest uppercase text-neutral-400 font-bold mb-6">
              [CATEGORIES]
            </span>

            <div className="space-y-3">
              {CATEGORY_STATS.map((category) => {
                const isActive = activeCategory.code === category.code;
                return (
                  <button
                    key={category.code}
                    onClick={() => {
                      setActiveCategory(category);
                      if (onCategorySelect) onCategorySelect(category.name);
                    }}
                    className={`w-full text-left py-4 px-5 rounded-[20px] transition-all duration-300 flex items-center justify-between cursor-pointer border ${
                      isActive
                        ? "bg-neutral-950 border-neutral-950 text-white shadow-md shadow-neutral-950/10 scale-102"
                        : "bg-white hover:bg-neutral-100/80 border-neutral-200 text-neutral-800 hover:scale-101"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Interactive Code Counter */}
                      <span className={`font-mono text-xs ${isActive ? "text-orange-500 font-bold" : "text-neutral-400"}`}>
                        [{category.code}]
                      </span>
                      
                      {/* Name */}
                      <span className="font-sans text-xl font-bold tracking-tight">
                        {category.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Count in brackets */}
                      <span className={`font-mono text-xs font-semibold ${isActive ? "text-white" : "text-neutral-500"}`}>
                        ({category.count})
                      </span>
                      <ChevronRightArrow show={isActive} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Immersive technical quote responsive block dependent on selection */}
            <div className="mt-8 p-5 bg-neutral-100 rounded-[20px] border border-neutral-200/40 relative">
              <span className="font-mono text-[83s] absolute right-4 top-2 text-neutral-300 pointer-events-none opacity-20 hover:opacity-40 transition-opacity">
                “
              </span>
              <span className="font-mono text-[9px] uppercase font-bold text-orange-500 block mb-1">
                FIT & FEEL SPECS:
              </span>
              <p className="text-xs text-neutral-600 font-mono italic leading-relaxed">
                "{activeCategory.quote}"
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* SEE PRODUCT FULL SCREEN ATTACHMENT VIEW OVERLAY MODAL */}
      <AnimatePresence>
        {showProductOverlay && (
          <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex items-center p-0 md:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] overflow-hidden max-w-4xl w-full relative shadow-2xl flex flex-col md:flex-row border border-neutral-100/10 my-auto max-md:rounded-none md:max-h-[90vh] md:overflow-y-auto"
            >
              {/* Product Close Button */}
              <button
                onClick={() => setShowProductOverlay(false)}
                className="absolute top-3 right-3 md:top-4 md:right-4 p-2.5 rounded-full bg-neutral-900 hover:bg-orange-500 text-white transition z-20 cursor-pointer shadow"
              >
                ✕
              </button>

              {/* Picture columns */}
              <div className="w-full md:w-1/2 relative bg-neutral-950 aspect-[3/2] sm:aspect-[4/3] md:aspect-auto">
                <img
                  src={activeCategory.image}
                  alt={`${activeCategory.name} technical view`}
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-4 left-4 font-mono text-[10px] text-white/70 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                  FIT MODEL: HEIGHT 188CM // WEARING SIZE L
                </span>
              </div>

              {/* Specs detailed card descriptions */}
              <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] text-orange-500 font-bold uppercase tracking-widest block mb-1">
                    [TECHNICAL BREAKDOWN]
                  </span>
                  <h3 className="text-3xl font-sans font-black tracking-tight text-neutral-950 leading-none mb-4">
                    {product.name}
                  </h3>

                  <div className="space-y-4 font-sans text-sm text-neutral-600 font-light leading-relaxed">
                    <p>
                      {product.description}
                    </p>

                    {/* Bullet elements with tiny checkboxes */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {product.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 font-mono text-[11px] text-neutral-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-neutral-500 font-mono mt-4 italic bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                      "{product.tagline}"
                    </p>
                  </div>
                </div>

                <div className="mt-6 md:mt-8 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 block pb-1">
                      PRICE VALUE
                    </span>
                    <span className="text-3xl font-sans font-bold text-neutral-950 block">
                      ${product.price}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      alert(`${product.name} sample requested successfully! Added to test buffer.`);
                      setShowProductOverlay(false);
                    }}
                    className="h-12 px-6 bg-neutral-950 hover:bg-orange-500 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full flex items-center gap-2 transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" /> RECRUIT SYSTEM STYLING
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

// Minimal Arrow component
function ChevronRightArrow({ show }: { show: boolean }) {
  return (
    <span
      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
        show ? "bg-orange-500 text-white rotate-90 scale-110" : "bg-neutral-100 text-neutral-950"
      }`}
    >
      →
    </span>
  );
}
