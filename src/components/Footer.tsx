import React, { useState } from "react";
import { Facebook, Instagram, Twitter, Youtube, ArrowRight, ShieldAlert } from "lucide-react";

export default function Footer() {
  const [emailValue, setEmailValue] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailValue.trim()) {
      alert(`Subscription secured! "${emailValue}" registered for early access to next custom drop.`);
      setEmailValue("");
    }
  };

  return (
    <footer className="w-full bg-neutral-950 text-neutral-100 py-16 px-6 md:px-12 select-none relative z-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Grid: Info columns & Contact lines */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 pb-16 border-b border-white/10 items-start">
          
          {/* Left Column: Big Statement heading & Email field form */}
          <div className="md:col-span-5 flex flex-col justify-between h-full">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 block mb-3 font-semibold text-orange-500">
                CONTACT US
              </span>
              
              <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-sans font-black tracking-tighter leading-none text-white select-all">
                Fast Selling Urban Fashion Collection
              </h2>
            </div>

            {/* Subscription Form Input */}
            <form onSubmit={handleSubscribe} className="mt-8 relative max-w-sm">
              <div className="relative border-b border-white/20 py-3 flex items-center justify-between group focus-within:border-orange-500 transition-colors">
                <input
                  type="email"
                  required
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="Send email to us"
                  className="w-full bg-transparent text-sm text-white font-mono placeholder-neutral-500 focus:outline-none pr-12 focus:placeholder-white/40"
                />
                
                <button
                  type="submit"
                  className="w-10 h-10 rounded-full bg-white hover:bg-orange-500 hover:scale-105 active:scale-95 text-neutral-950 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow absolute right-0 top-1/2 -translate-y-1/2 group"
                  aria-label="Subscribe Newsletter"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </form>

            {/* Social handles list */}
            <div className="mt-10">
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 block mb-3">
                Follow Us
              </span>
              <div className="flex gap-4">
                {[
                  { icon: <Facebook className="w-4 h-4" />, href: "#" },
                  { icon: <Instagram className="w-4 h-4" />, href: "#" },
                  { icon: <Twitter className="w-4 h-4" />, href: "#" },
                  { icon: <Youtube className="w-4 h-4" />, href: "#" },
                ].map((item, id) => (
                  <a
                    key={id}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Opening sandbox social link. This links out to official LOUDLAYER editorial handle in a real tab.");
                    }}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-orange-500 hover:text-white border border-white/10 flex items-center justify-center text-neutral-300 transition-all hover:scale-110"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>

          </div>

          {/* Right Columns: Location, Call, Email, Working hours */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
            
            {/* Column Location */}
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 block mb-2 font-bold">
                LOCATION
              </span>
              <p className="text-sm font-sans text-neutral-300 font-light leading-relaxed">
                123 Oxford Street, Osu - Accra, Ghana
              </p>
            </div>

            {/* Column Call */}
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 block mb-2 font-bold">
                CALL US
              </span>
              <a href="tel:+233123456789" className="text-sm font-sans text-neutral-300 font-light tracking-wide hover:text-orange-500 transition-colors">
                +233 123456789
              </a>
            </div>

            {/* Column Email */}
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 block mb-2 font-bold">
                EMAIL
              </span>
              <a href="mailto:loudlayer@gmail.com" className="text-sm font-sans text-neutral-300 font-light hover:text-orange-500 transition-colors">
                loudlayer@gmail.com
              </a>
            </div>

            {/* Column Opening Hours */}
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 block mb-2 font-bold">
                OPEN TIME
              </span>
              <p className="text-sm font-sans text-neutral-300 font-light">
                08:00 - 11:00 pm
              </p>
            </div>

          </div>

        </div>

        {/* Lower footer information row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-neutral-500 text-[11px] gap-4">
          
          <div className="flex gap-6">
            <span className="hover:text-white transition-colors cursor-default">Terms & Conditions</span>
            <span className="hover:text-white transition-colors cursor-default">Privacy Policy</span>
          </div>

          <p className="text-center sm:text-right font-mono">
            © 2026 LOUDLAYER. All Rights Reserved.
          </p>

        </div>

      </div>
    </footer>
  );
}
