import React, { useState } from "react";
import { ArrowUpRight, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DIRECTORY_SPOTLIGHT, DIRECTORY_ACCORDIONS } from "../data";
import accordionImg from "../../loudlayer_assets/accordiongimg.jpg";

export default function CollectionsDirectory() {
  const [expandedId, setExpandedId] = useState<string>("dir-1");
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notifyEmail.trim()) {
      alert(`Email verified: "${notifyEmail}" registered for exclusive catalog notifications.`);
      setNotifyEmail("");
      setShowNotifyModal(false);
    }
  };

  return (
    <section className="w-full bg-zinc-50 py-16 px-6 md:px-12 border-b border-neutral-200/50">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Bento Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-stretch">
          
          {/* Left Block: Vertical Model Frame divided by modern horizontal lines (Frame 00:11 and 00:12) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-zinc-100 rounded-[32px] p-6 sm:p-8 border border-neutral-200/40 shadow-inner">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] uppercase tracking-widest text-orange-500 font-bold mb-4">
                // INTRODUCING OUR TIMELINE
              </span>
              
              <h3 className="text-3xl font-sans font-black tracking-tight text-neutral-900 leading-tight mb-4 select-all">
                Being Part Of Our journey.
              </h3>
              
              <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed mb-8 max-w-[320px]">
                From enduring classics to daring statement pieces, our collections are crafted with intention.
              </p>
            </div>

            {/* Split Graphic Panels simulating Frame 00:11 and 00:12 */}
            <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden bg-neutral-200 border-2 border-white shadow flex flex-col gap-1.5 p-1">
              
              {/* Part 1 (Top Panel) */}
              <div className="flex-1 overflow-hidden relative">
                <img
                  src={accordionImg}
                  alt="Loudlayer journey top"
                  className="absolute inset-0 w-full h-[300px] object-cover"
                  style={{ top: "0%" }}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Dividing negative border label banner */}
              <div className="h-[2px] bg-white w-full relative z-10" />

              {/* Part 2 (Bottom Panel) */}
              <div className="flex-1 overflow-hidden relative">
                <img
                  src={accordionImg}
                  alt="Loudlayer journey bottom"
                  className="absolute inset-0 w-full h-[300px] object-cover"
                  style={{ top: "-150px" }}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Overlay dynamic focus coordinates */}
              <div className="absolute top-4 left-4 font-mono text-[8px] text-white font-heavy bg-black/40 backdrop-blur-sm p-1 rounded">
                GRID // AXS-269c
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
                ACTIVE LAB CALIBRATED 2026
              </span>
            </div>
          </div>

          {/* Right Block: Bento cards with "Statement Pieces 2025" at top & interactive accordions underneath */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-8">
            
            {/* Top Spotlight card ("Statement Pieces 2025") */}
            <div className="bg-zinc-100 rounded-[32px] p-6 sm:p-8 border border-neutral-200/40 shadow-inner flex flex-col sm:flex-row gap-6 items-center justify-between relative overflow-hidden group">
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-orange-500">
                    [SPOTLIGHT ARCHIVE]
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-neutral-900 leading-none">
                  {DIRECTORY_SPOTLIGHT.title}
                </h3>

                <p className="text-xs text-neutral-600 font-light leading-relaxed">
                  {DIRECTORY_SPOTLIGHT.description}
                </p>

                <button
                  onClick={() => setShowNotifyModal(true)}
                  className="px-5 h-9 bg-neutral-950 hover:bg-orange-500 text-white font-mono text-[10px] tracking-widest uppercase rounded-full transition cursor-pointer inline-flex items-center gap-2 group/btn"
                >
                  GET STARTED 
                  <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Thumbnail graphic illustration frame */}
              <div className="w-32 aspect-square rounded-[24px] overflow-hidden bg-neutral-200 border-4 border-white shadow-md shadow-neutral-300 shrink-0 self-start sm:self-center">
                <img
                  src={DIRECTORY_SPOTLIGHT.image}
                  alt="Spotlight jacket preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Decorative side badge */}
              <div className="absolute top-4 right-4 bg-orange-500 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded tracking-widest">
                ARCHIVE
              </div>
            </div>

            {/* Bottom: Stylized Premium Accordion items with line borders */}
            <div className="bg-white rounded-[32px] p-4 sm:p-6 border border-neutral-200/50 shadow flex flex-col text-left">
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-4 pl-2">
                [COLLECTION ACCORDIONS]
              </span>

              <div className="divide-y divide-neutral-200/60">
                {DIRECTORY_ACCORDIONS.map((item) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <div key={item.id} className="py-4">
                      
                      {/* Accordion Trigger Header Row */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? "" : item.id)}
                        className="w-full flex items-center justify-between py-2 text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs text-neutral-400">
                            {item.date} // 
                          </span>
                          <span className={`font-sans font-bold text-base md:text-lg tracking-tight transition-colors ${
                            isExpanded ? "text-orange-500" : "text-neutral-800 group-hover:text-black"
                          }`}>
                            {item.title}
                          </span>
                        </div>

                        {/* Interactive Arrow Key */}
                        <span className={`w-8 h-8 rounded-full border border-neutral-200 bg-zinc-50 flex items-center justify-center transition-transform ${
                          isExpanded ? "rotate-45 bg-neutral-900 border-neutral-900 text-white" : "group-hover:bg-neutral-100 text-neutral-800"
                        }`}>
                          <ArrowUpRight className="w-4 h-4" />
                        </span>
                      </button>

                      {/* Accordion collapsible body content */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 pb-2 pl-4 pr-8">
                              <p className="text-xs text-neutral-600 leading-relaxed font-light">
                                {item.content}
                              </p>
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={() => alert(`Redirecting mock flow for: "${item.title}" catalog.`)}
                                  className="text-[10px] font-mono text-neutral-900 font-bold hover:text-orange-500 transition-colors uppercase border-b border-neutral-900 pb-0.5 cursor-pointer"
                                >
                                  Browse Directory Entries →
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* SUBSCRIBE NOTIFICATION MODAL DIALOG */}
      <AnimatePresence>
        {showNotifyModal && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full relative border border-neutral-200 shadow-2xl"
            >
              <button
                onClick={() => setShowNotifyModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 transition cursor-pointer"
              >
                ✕
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-4 animate-bounce">
                  <AlertCircle className="w-6 h-6" />
                </div>
                
                <h3 className="text-lg font-sans font-extrabold text-neutral-900 tracking-tight leading-snug mb-1">
                  Secure Access Code Required
                </h3>
                
                <p className="text-xs text-neutral-500 leading-relaxed font-light mb-6">
                  LOUDLAYER archival series are locked behind exclusive digital keycodes. Register your email to join the queue for access keys.
                </p>

                <form onSubmit={handleNotifySubmit} className="w-full space-y-3">
                  <input
                    type="email"
                    required
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-4 h-11 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-neutral-800 text-xs rounded-xl text-neutral-900 text-center"
                  />
                  
                  <button
                    type="submit"
                    className="w-full h-11 bg-neutral-950 hover:bg-orange-500 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-xl transition cursor-pointer"
                  >
                    ACQUIRE ACCESS KEYS
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
