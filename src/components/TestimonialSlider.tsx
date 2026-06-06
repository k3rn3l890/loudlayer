import { useState } from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TESTIMONIALS } from "../data";

export default function TestimonialSlider() {
  const [index, setIndex] = useState(0);
  const activeTestimonial = TESTIMONIALS[index];

  const handleNext = () => {
    setIndex((prevIndex) => (prevIndex + 1) % TESTIMONIALS.length);
  };

  const handlePrev = () => {
    setIndex((prevIndex) => (prevIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  return (
    <section className="w-full bg-zinc-50 py-16 px-6 md:px-12 border-b border-neutral-200/50">
      <div className="max-w-7xl mx-auto">
        
        {/* Header with Testimonial metadata and big quotes icon */}
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-neutral-200/30">
          <div className="flex items-center gap-4">
            {/* Elegant 01/8 indicator format */}
            <h3 className="text-4xl font-sans font-black tracking-tight text-neutral-900 select-all">
              0{index + 1}<span className="text-neutral-300 font-light text-2xl">/{TESTIMONIALS.length}</span>
            </h3>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400 font-semibold bg-neutral-100 px-3 py-1 rounded">
              [Testimonial]
            </span>
          </div>
          
          <span className="text-6xl md:text-8xl font-serif text-orange-500/20 leading-none pointer-events-none select-none">
            “
          </span>
        </div>

        {/* Testimonial Active Display */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          
          {/* Left: Close-up Profile Card */}
          <div className="md:col-span-4 flex justify-center">
            <div className="relative w-full max-w-[200px] sm:max-w-[260px] aspect-square rounded-[32px] overflow-hidden bg-neutral-100 border-4 border-white shadow-lg shadow-neutral-200/50 group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeTestimonial.id}
                  src={activeTestimonial.image}
                  alt={activeTestimonial.author}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Float Badge overlay with role details */}
              <div className="absolute inset-x-0 bottom-0 bg-neutral-900/90 backdrop-blur-sm p-4 text-white flex flex-col justify-end">
                {activeTestimonial.author && (
                  <span className="font-sans font-bold text-sm">
                    {activeTestimonial.author}
                  </span>
                )}
                <span className="font-mono text-[9px] text-orange-400 font-semibold uppercase tracking-wider mt-0.5">
                  {activeTestimonial.role}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Testimonial quotation statement & Star ratings */}
          <div className="md:col-span-8 flex flex-col justify-center text-left">
            <div className="min-h-[160px] flex items-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={activeTestimonial.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-neutral-900 text-xl sm:text-2xl md:text-3xl font-sans tracking-tight font-light leading-relaxed select-all"
                >
                  {activeTestimonial.text}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Stars rating widget */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex gap-1 text-orange-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(activeTestimonial.rating)
                        ? "fill-orange-500"
                        : "text-neutral-200"
                    }`}
                  />
                ))}
              </div>
              
              <span className="font-mono text-xs font-bold text-neutral-800">
                {activeTestimonial.rating.toFixed(1)} ({activeTestimonial.reviewsCount} Reviews)
              </span>
            </div>
          </div>

        </div>

        {/* Carousel buttons and footer note */}
        <div className="mt-14 pt-8 border-t border-neutral-200/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Slogans */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-neutral-400 capitalize tracking-wide">
              See What Our Customers Are Saying
            </span>
            <span className="font-serif text-lg text-neutral-300">”</span>
          </div>

          {/* Arrow Controllers */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="w-11 h-11 rounded-full border border-neutral-300 hover:border-neutral-900 bg-white hover:bg-neutral-950 hover:text-white text-neutral-800 flex items-center justify-center transition cursor-pointer shadow"
              aria-label="Previous Testimonial"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="w-11 h-11 rounded-full border border-neutral-300 hover:border-neutral-900 bg-white hover:bg-neutral-950 hover:text-white text-neutral-800 flex items-center justify-center transition cursor-pointer shadow"
              aria-label="Next Testimonial"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
