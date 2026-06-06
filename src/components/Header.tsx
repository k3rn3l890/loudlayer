import React, { useState } from "react";
import { Menu, Search, Heart, ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  wishlistCount: number;
  onWishlistClick: () => void;
  onSearch: (query: string) => void;
}

export default function Header({
  cartItemsCount,
  onCartClick,
  wishlistCount,
  onWishlistClick,
  onSearch,
}: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    setShowSearch(false);
  };

  return (
    <header className="relative w-full z-40 bg-zinc-50/80 backdrop-blur-md px-3 md:px-6 py-5 grid grid-cols-3 items-center border-b border-neutral-200/50">
      {/* Left Menu Icon */}
      <div className="flex items-center justify-start">
        <button
          id="btn-menu-trigger"
          className="p-2 -ml-2 rounded-full hover:bg-neutral-200/50 transition-colors cursor-pointer group"
          aria-label="Toggle Side Menu"
        >
          <Menu className="w-5 h-5 text-neutral-800 group-hover:scale-105 transition-transform" />
        </button>
      </div>

      {/* Center Logo */}
      <div className="text-center select-none truncate">
        <a href="#" className="font-sans text-sm sm:text-lg md:text-2xl font-light tracking-[0.15em] sm:tracking-[0.25em] md:tracking-[0.35em] text-neutral-900 transition-opacity hover:opacity-80">
          LOUDLAYER
        </a>
      </div>

      {/* Right Actions */}
      <div className="flex items-center justify-end gap-0 md:gap-2">
        {/* Search Toggle */}
        <button
          id="btn-search"
          onClick={() => setShowSearch(true)}
          className="p-2 rounded-full hover:bg-neutral-200/50 transition-colors cursor-pointer group"
          aria-label="Search Collection"
        >
          <Search className="w-5 h-5 text-neutral-800 group-hover:scale-105 transition-transform" />
        </button>

        {/* Wishlist Button */}
        <button
          id="btn-wishlist"
          onClick={onWishlistClick}
          className="p-2 rounded-full hover:bg-neutral-200/50 transition-colors cursor-pointer relative group"
          aria-label="View Wishlist"
        >
          <Heart className={`w-5 h-5 text-neutral-800 group-hover:scale-105 transition-transform ${wishlistCount > 0 ? "fill-orange-500 text-orange-500" : ""}`} />
          {wishlistCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-zinc-50" />
          )}
        </button>

        {/* Cart Button */}
        <button
          id="btn-cart"
          onClick={onCartClick}
          className="p-2 rounded-full hover:bg-neutral-200/50 transition-colors cursor-pointer relative group"
          aria-label="Open Shopping Cart"
        >
          <ShoppingBag className="w-5 h-5 text-neutral-800 group-hover:scale-105 transition-transform" />
          <AnimatePresence>
            {cartItemsCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-neutral-900 text-[10px] font-mono font-bold text-white flex items-center justify-center px-1 rounded-full border border-zinc-50"
              >
                {cartItemsCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Full screen / Overlay search bar with Framer Motion */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 w-full h-full bg-zinc-50 z-50 px-6 py-4 flex items-center justify-between"
          >
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl mx-auto flex items-center gap-3">
              <Search className="w-5 h-5 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collection, jackets, shirts..."
                className="w-full bg-transparent border-b border-neutral-300 py-2 focus:outline-none focus:border-neutral-800 text-neutral-900 text-sm md:text-base font-sans"
                autoFocus
              />
              <button
                type="submit"
                className="bg-neutral-950 text-white font-mono text-xs px-3 py-1.5 rounded hover:bg-neutral-800 transition"
              >
                Search
              </button>
            </form>
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
              className="p-2 rounded-full hover:bg-neutral-200/50 transition-colors ml-4 cursor-pointer"
            >
              <X className="w-5 h-5 text-neutral-800" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
