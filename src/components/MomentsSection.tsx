import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Info, Heart, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import { apiGet } from "../lib/userApi";

interface MomentsSectionProps {
  onAddToCart: (p: Product, size: string) => void;
  onAddToWishlist: (p: Product) => void;
}

function mapDbProduct(p: any): Product {
  let tags: string[] = [];
  if (Array.isArray(p.tags)) tags = p.tags;
  else if (typeof p.tags === "string") try { tags = JSON.parse(p.tags); } catch {}
  return {
    id: String(p.id),
    slug: p.slug || "",
    name: p.name,
    price: p.price,
    discountPrice: p.discount_price ?? undefined,
    discountPercentage: p.discount_percentage ?? undefined,
    image: p.image || "/placeholder-product.svg",
    category: p.category || "",
    code: p.code ?? undefined,
    tags,
    description: p.description ?? undefined,
    stock: p.stock ?? 0,
  };
}

export default function MomentsSection({
  onAddToCart,
  onAddToWishlist,
}: MomentsSectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [momentsProducts, setMomentsProducts] = useState<Product[]>([]);
  const sizes = ["S", "M", "L", "XL"];

  useEffect(() => {
    apiGet<{ products: any[] }>("/products?visible=1")
      .then((data) => setMomentsProducts(data.products.slice(0, 2).map(mapDbProduct)))
      .catch(() => {});
  }, []);

  const handleOpenQuickView = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize("M");
  };

  if (momentsProducts.length < 2) return null;

  return (
    <section className="w-full bg-zinc-100 hover:bg-zinc-50 transition-colors duration-1000 py-16 px-6 md:px-12 border-b border-neutral-200/50">
      <div className="max-w-7xl mx-auto">
        
        {/* Title Block with Orange Star Accent */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 relative">
          <div className="space-y-0 md:-space-y-3">
            <div className="flex items-center gap-3">
              {/* Decorative design star asterisks exactly as seen in Frame 00:02 */}
              <div className="relative w-8 h-8 flex items-center justify-center text-orange-500">
                <span className="absolute w-2 h-8 bg-orange-500 rounded-full" />
                <span className="absolute w-8 h-2 bg-orange-500 rounded-full" />
                <span className="absolute w-5 h-5 bg-orange-500 rounded-full rotate-45" />
              </div>
              <h2 className="text-5xl sm:text-6xl md:text-[5.5rem] font-sans font-black tracking-tighter text-neutral-900 leading-none">
                All - about
              </h2>
            </div>
            <h2 className="text-5xl sm:text-6xl md:text-[5.5rem] font-sans font-black tracking-tighter text-neutral-900 leading-none pl-11 sm:pl-0">
              moments ©26
            </h2>
          </div>


        </div>

        {/* Multi-layered Grid Display */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start mt-8">
          
          {/* Card 1: Left Model showcase (Going Distance 2026 - Caramel brown zip high collar) */}
          <div className="md:col-span-6 flex flex-col group">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              
              {/* Image Frame */}
              <div className="relative w-full sm:w-2/3 aspect-[4/5] rounded-[32px] overflow-hidden bg-neutral-200 shadow-lg group-hover:shadow-xl transition-shadow border-4 border-white">
                <img
                  src={momentsProducts[0].image}
                  alt={momentsProducts[0].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                
                {/* Image Actions Trigger */}
                <div className="absolute inset-x-0 bottom-4 px-4 flex justify-between items-center z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => handleOpenQuickView(momentsProducts[0])}
                    className="bg-white/90 hover:bg-white text-neutral-900 text-[10px] font-mono tracking-wider uppercase px-4 h-9 rounded-full shadow border border-neutral-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-neutral-700" /> QUICK VIEW
                  </button>
                  <button
                    onClick={() => onAddToWishlist(momentsProducts[0])}
                    className="w-9 h-9 rounded-full bg-white/90 hover:bg-orange-500 hover:text-white text-neutral-900 flex items-center justify-center shadow transition-colors cursor-pointer"
                    title="Add to Wishlist"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editorial Caption Blurb next to it */}
              <div className="w-full sm:w-1/3 flex flex-col justify-center">
                <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-orange-500 mb-1">
                  [Featured Product]
                </span>
                <h4 className="text-sm font-sans font-semibold text-neutral-800 leading-tight mb-2">
                  Where Elegance Meets Sustainability, Luxury Made Accessible
                </h4>
                <div className="my-3 h-[1px] w-12 bg-neutral-300" />
                <h3 className="text-2xl font-sans font-black text-neutral-900 leading-none">
                  ₵{momentsProducts[0].price}
                </h3>
                <p className="font-mono text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">
                  (RRP ₵120 VALUE)
                </p>
                <Link
                  to={`/products/${momentsProducts[0].slug}`}
                  className="mt-4 self-start bg-neutral-950 hover:bg-orange-500 text-white text-[10px] font-mono tracking-widest uppercase px-4 py-2 rounded-full flex items-center gap-2 transition"
                >
                  <ShoppingCart className="w-3 h-3" /> ADD TO BAG
                </Link>
              </div>

            </div>

            {/* Custom Bottom Name */}
            <div className="mt-4 flex items-center justify-between">
              <Link
                to={`/products/${momentsProducts[0].slug}`}
                className="text-neutral-500 font-mono text-xs hover:text-orange-500 transition-colors"
              >
                {momentsProducts[0].name}
              </Link>
            </div>
          </div>

          {/* Card 2: Right Model showcase (Just Do It 2026 - Dark green/grey badge embroidery jacket) */}
          <div className="md:col-span-6 flex flex-col group">
            <div className="flex flex-col sm:flex-row-reverse gap-6 items-start sm:items-center">
              
              {/* Image Frame */}
              <div className="relative w-full sm:w-2/3 aspect-[4/5] rounded-[32px] overflow-hidden bg-neutral-200 shadow-lg group-hover:shadow-xl transition-shadow border-4 border-white">
                <img
                  src={momentsProducts[1].image}
                  alt={momentsProducts[1].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                
                {/* Image Actions Trigger */}
                <div className="absolute inset-x-0 bottom-4 px-4 flex justify-between items-center z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => handleOpenQuickView(momentsProducts[1])}
                    className="bg-white/90 hover:bg-white text-neutral-900 text-[10px] font-mono tracking-wider uppercase px-4 h-9 rounded-full shadow border border-neutral-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-neutral-700" /> QUICK VIEW
                  </button>
                  <button
                    onClick={() => onAddToWishlist(momentsProducts[1])}
                    className="w-9 h-9 rounded-full bg-white/90 hover:bg-orange-500 hover:text-white text-neutral-900 flex items-center justify-center shadow transition-colors cursor-pointer"
                    title="Add to Wishlist"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Side discount tags / label next to it */}
              <div className="w-full sm:w-1/3 flex flex-col justify-center items-start sm:items-end sm:text-right">
                <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-orange-500 mb-1">
                  [Limited Promo]
                </span>
                <div className="bg-orange-500 text-white rounded-full text-sm font-mono font-bold tracking-wider px-3.5 py-1.5 shadow-md shadow-orange-500/20 mb-3 select-all">
                  ({momentsProducts[1].discountPercentage} OFF)
                </div>
                <h4 className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
                  ESTIMATE SAVINGS
                </h4>
                <p className="text-xs text-neutral-500 leading-relaxed sm:text-right mt-1 font-light">
                  Meticulous high zip tech jacket designed for optimal insulation.
                </p>
                <div className="my-2 h-[1px] w-12 bg-neutral-300 self-start sm:self-end" />
                <h3 className="text-2xl font-sans font-black text-neutral-950">
                  ₵{momentsProducts[1].price}
                </h3>
              </div>

            </div>

            {/* Custom Bottom Name */}
            <div className="mt-4 flex items-center justify-between sm:justify-end">
              <Link
                to={`/products/${momentsProducts[1].slug}`}
                className="text-neutral-500 font-mono text-xs hover:text-orange-500 transition-colors"
              >
                {momentsProducts[1].name}
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* QUICK VIEW CONTAINER DIALOG OVERLAY */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", mass: 0.5, damping: 15 }}
              className="bg-white rounded-[32px] overflow-hidden max-w-2xl w-full relative shadow-2xl flex flex-col sm:flex-row border border-neutral-100"
            >
              {/* Left Column Image */}
              <div className="w-full sm:w-1/2 aspect-[4/5] bg-neutral-100">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Right Column Product description */}
              <div className="w-full sm:w-1/2 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded">
                      {selectedProduct.category}
                    </span>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="p-1.5 -mr-1.5 rounded-full hover:bg-neutral-100 transition"
                    >
                      <X className="w-4 h-4 text-neutral-500" />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-sans font-bold text-neutral-900 mb-1 leading-tight">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-xs font-mono text-neutral-400 mb-4">
                    CODE: {selectedProduct.code}
                  </p>
                  
                  <p className="text-xs text-neutral-600 font-light leading-relaxed mb-6">
                    {selectedProduct.description}
                  </p>

                  {/* Size Selectors */}
                  <div className="mb-6">
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block mb-2">
                      SELECT SIZE:
                    </span>
                    <div className="flex gap-2">
                      {sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={`w-10 h-10 rounded-full font-mono text-xs font-bold transition flex items-center justify-center border cursor-pointer ${
                            selectedSize === s
                              ? "bg-neutral-950 border-neutral-950 text-white"
                              : "border-neutral-200 hover:border-neutral-500 text-neutral-800"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 block leading-none">
                      PRICE VALUE
                    </span>
                    <span className="text-2xl font-sans font-black text-neutral-950 leading-none block mt-1">
                      ₵{selectedProduct.price}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      to={`/products/${selectedProduct.slug}`}
                      onClick={() => setSelectedProduct(null)}
                      className="h-11 w-11 rounded-full border border-neutral-200 hover:border-neutral-500 text-neutral-600 flex items-center justify-center transition cursor-pointer"
                      title="View Full Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => {
                        onAddToCart(selectedProduct, selectedSize);
                        setSelectedProduct(null);
                      }}
                      className="h-11 px-5 bg-orange-500 hover:bg-orange-600 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" /> ADD TO BAG
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
