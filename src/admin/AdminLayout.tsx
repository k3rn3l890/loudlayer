import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { adminApi } from "./api";
import {
  LayoutDashboard, Package, ShoppingCart, LogOut, Menu, X
} from "lucide-react";
import logo from "../../loudlayer_assets/logo.jpg";
import { MonoCaption } from "./ui";

const NAV_ITEMS = [
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", end: false, label: "Products", icon: Package },
  { to: "/admin/orders", end: false, label: "Orders", icon: ShoppingCart },
] as const;

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await adminApi.logout(); } catch {}
    navigate("/admin/login");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
      isActive
        ? "bg-zinc-100 font-medium text-zinc-950"
        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
    }`;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand block */}
      <div className="flex shrink-0 items-start justify-between px-2 pb-2 pt-4 sm:px-3">
        <div className="flex items-center gap-2.5 px-1">
          <div className="h-9 w-9 overflow-hidden rounded-xl">
            <img src={logo} alt="LoudLayer" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-zinc-950">LoudLayer</p>
            <span className="mt-0.5 inline-block rounded bg-zinc-100 px-1.5 py-px font-mono text-[9px] font-medium uppercase tracking-widest text-zinc-500">
              Admin
            </span>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="-mr-1 -mt-1 p-2 text-zinc-500 transition-colors duration-150 hover:text-zinc-950 cursor-pointer md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={linkClass}
          >
            <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom zone: meta + danger-separated sign out */}
      <div className="shrink-0 border-t border-zinc-200 px-3 pb-4 pt-3">
        <div className="px-3 pb-2">
          <MonoCaption className="text-[10px]">Signed in</MonoCaption>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 md:h-screen md:overflow-hidden md:flex-row">
      {/* Mobile top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="-mb-2 -ml-2 -mt-2 p-2 text-zinc-700 transition-colors duration-150 hover:text-zinc-950 cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 overflow-hidden rounded-lg">
            <img src={logo} alt="LoudLayer" className="h-full w-full object-cover" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-950">LoudLayer</span>
        </div>
        <div className="w-5" aria-hidden="true" />
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-950/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-out drawer — visibility defers to the slide animation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-zinc-200 bg-white shadow-2xl shadow-neutral-950/10 will-change-transform md:hidden ${
          sidebarOpen
            ? "visible translate-x-0 [transition-delay:0s,0s]"
            : "invisible -translate-x-full [transition-delay:0s,300ms]"
        } [transition-duration:300ms,0s] [transition-property:transform,visibility] [transition-timing-function:ease-in-out,linear]`}
        aria-label="Admin navigation"
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar — hairline rail */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
        {sidebarContent}
      </aside>

      {/* Main content — soft gray canvas */}
      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 md:h-full md:overflow-y-auto lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
