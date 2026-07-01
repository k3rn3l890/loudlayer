import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShieldCheck, ShoppingCart, Eye } from "lucide-react";
import { motion } from "motion/react";
import { DISCOVER_PRODUCTS } from "../data";
import { Product } from "../types";

interface JacketMomentoCarouselProps {
  onAddToCart: (p: Product, size: string) => void;
  onAddToWishlist: (p: Product) => void;
}

export default function JacketMomentoCarousel({
  onAddToCart,
  onAddToWishlist,
}: JacketMomentoCarouselProps) {
  const [selectedJacketId, setSelectedJacketId] = useState<string>("c3"); // default highlight charcoal Oversized Tshirt as seen in standard flow
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeftList = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRightList = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full bg-zinc-100 py-16 px-6 md:px-12 border-b border-neutral-200/50">
      <div className="max-w-7xl mx-auto">
        
        {/* Carousel Heading Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          
          {/* Title and year */}
          <div className="flex flex-col md:flex-row items-baseline gap-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-sans font-black tracking-tight text-neutral-900 leading-none">
              ©loudlayer - memento
            </h2>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400 font-bold bg-neutral-200 px-3 py-1 rounded">
              2026 Edition
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="mt-6 md:mt-0 flex items-center md:justify-end gap-6">
            <span className="font-mono text-xs uppercase tracking-wider text-neutral-400">
              [Other Collection]
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={scrollLeftList}
                className="w-10 h-10 rounded-full border border-neutral-300 bg-white hover:bg-neutral-900 hover:text-white text-neutral-800 flex items-center justify-center transition cursor-pointer shadow"
                aria-label="Scroll Left"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollRightList}
                className="w-10 h-10 rounded-full border border-neutral-300 bg-white hover:bg-neutral-900 hover:text-white text-neutral-800 flex items-center justify-center transition cursor-pointer shadow"
                aria-label="Scroll Right"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Scrollable Container */}
        <div
          ref={sliderRef}
          className="flex overflow-x-auto gap-6 sm:gap-8 pb-8 scrollbar-thin scrollbar-thumb-zinc-400 scroll-smooth snap-x"
          style={{ scrollbarWidth: "thin" }}
        >
          {DISCOVER_PRODUCTS.map((jacket) => {
            const isHighlighted = selectedJacketId === jacket.id;
            return (
              <div
                key={jacket.id}
                onClick={() => setSelectedJacketId(jacket.id)}
                className={`snap-start min-w-[220px] sm:min-w-[260px] md:min-w-[290px] bg-white rounded-[24px] md:rounded-[32px] overflow-hidden border p-3 md:p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isHighlighted
                    ? "border-neutral-900 shadow-xl ring-2 ring-neutral-900/10 scale-102"
                    : "border-neutral-200 hover:border-neutral-400 shadow-md hover:shadow-lg"
                }`}
              >
                {/* Image Section */}
                <div className="relative w-full aspect-[4/5] rounded-[24px] overflow-hidden bg-zinc-100 group">
                  <img
                    src={jacket.image}
                    alt={jacket.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Floating price overlay */}
                  <span className="absolute top-3 right-3 bg-neutral-950/90 text-white font-mono text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm shadow border border-white/15">
                    ₵{jacket.price}
                  </span>

                  {/* "Wear the Moment" hover layer or constant visible if highlithed */}
                  {isHighlighted ? (
                    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/90 backdrop-blur-sm py-3 px-4 flex items-center justify-center gap-2 text-white text-xs font-mono tracking-widest uppercase border-t border-white/10">
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                      <span>[Wear the Moment]</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-neutral-950/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white text-neutral-950 text-[10px] font-mono tracking-wider px-3 py-2 rounded-full uppercase shadow">
                        Highlight Spot
                      </span>
                    </div>
                  )}
                </div>

                {/* Jacket details */}
                <div className="pt-4 flex flex-col">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
                      {jacket.category} // {jacket.code}
                    </span>
                    <span className="font-mono text-[9px] text-orange-500 font-bold">
                      {jacket.tags?.[0]}
                    </span>
                  </div>

                  <h3 className="font-sans font-bold text-sm text-neutral-900 tracking-tight mt-1 truncate">
                    {jacket.name}
                  </h3>

                  {/* Quick Add To Bag Row */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToWishlist(jacket);
                      }}
                      className="text-xs font-mono text-neutral-400 hover:text-orange-500 transition-colors uppercase tracking-widest cursor-pointer"
                    >
                      + Save List
                    </button>

                    <div className="flex gap-1.5">
                      <Link
                        to={`/products/${jacket.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-8 rounded-full border border-neutral-200 hover:border-neutral-500 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to={`/products/${jacket.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 px-3 rounded-full bg-neutral-900 hover:bg-orange-500 text-white font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ShoppingCart className="w-3 h-3" /> ADD BAG
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
        
        {/* Dots Page Track indicators matching layout */}
        <div className="flex items-center justify-center gap-2 mt-4 select-none">
          {DISCOVER_PRODUCTS.map((jacket, idx) => (
            <button
              key={jacket.id}
              onClick={() => setSelectedJacketId(jacket.id)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                selectedJacketId === jacket.id ? "w-8 bg-neutral-900" : "w-1.5 bg-neutral-300 hover:bg-neutral-500"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
