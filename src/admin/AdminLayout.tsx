import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { adminApi } from "./api";
import {
  LayoutDashboard, Package, ShoppingCart, LogOut, Menu, X
} from "lucide-react";
import logo from "../../loudlayer_assets/logo.jpg";
import { MonoCaption } from "./ui";

const NAV_ITEMS = [
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard, index: "01" },
  { to: "/admin/products", end: false, label: "Products", icon: Package, index: "02" },
  { to: "/admin/orders", end: false, label: "Orders", icon: ShoppingCart, index: "03" },
] as const;

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await adminApi.logout(); } catch {}
    navigate("/admin/login");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex items-center gap-3 py-3 pl-5 pr-3 text-sm cursor-pointer transition-colors duration-200 ${
      isActive
        ? "font-semibold text-zinc-950"
        : "text-zinc-500 hover:text-zinc-950"
    }`;

  const renderNavLink = (item: (typeof NAV_ITEMS)[number], onClick?: () => void) => (
    <NavLink key={item.label} to={item.to} end={item.end} onClick={onClick} className={linkClass}>
      {({ isActive }: { isActive: boolean }) => (
        <>
          {/* Active marker: 2px orange bar, full row height */}
          <span
            aria-hidden="true"
            className={`absolute left-0 top-0 h-full w-[2px] rounded-full bg-orange-500 transition-opacity duration-200 ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          />
          <span aria-hidden="true" className="font-mono text-[10px] tracking-widest text-zinc-400">
            {item.index}
          </span>
          <span>{item.label}</span>
          <item.icon className="ml-auto h-4 w-4" strokeWidth={1.5} />
        </>
      )}
    </NavLink>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand block */}
      <div className="flex shrink-0 items-start justify-between px-3 pb-6 pt-5 sm:px-4">
        <div className="flex items-center gap-2.5 pl-2">
          <div className="h-9 w-9 overflow-hidden rounded-md">
            <img src={logo} alt="LoudLayer" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-zinc-950">LoudLayer</p>
            <MonoCaption className="mt-0.5 block text-[10px]">Admin</MonoCaption>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="-mr-2 -mt-1 p-2 text-zinc-500 transition-colors duration-200 hover:text-zinc-950 cursor-pointer md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Numbered ledger nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 sm:px-4" aria-label="Admin">
        {NAV_ITEMS.map((item) => renderNavLink(item, () => setSidebarOpen(false)))}
      </nav>

      {/* Bottom zone: meta + danger-separated sign out */}
      <div className="shrink-0 border-t border-neutral-200 px-3 pb-4 pt-3 sm:px-4">
        <div className="pb-2 pl-5">
          <MonoCaption className="text-[10px]">Signed in</MonoCaption>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="group relative flex w-full items-center gap-3 py-3 pl-5 pr-3 text-sm text-zinc-500 cursor-pointer transition-colors duration-200 hover:text-red-600"
        >
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 h-full w-[2px] rounded-full bg-red-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 md:h-screen md:overflow-hidden md:flex-row">
      {/* Mobile top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="-mb-2 -ml-2 -mt-2 p-2 text-zinc-700 transition-colors duration-200 hover:text-zinc-950 cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 overflow-hidden rounded-sm">
            <img src={logo} alt="LoudLayer" className="h-full w-full object-cover" />
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-950">LoudLayer</span>
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
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-neutral-200 bg-white shadow-xl shadow-neutral-950/5 will-change-transform md:hidden ${
          sidebarOpen
            ? "visible translate-x-0 [transition-delay:0s,0s]"
            : "invisible -translate-x-full [transition-delay:0s,300ms]"
        } [transition-duration:300ms,0s] [transition-property:transform,visibility] [transition-timing-function:ease-in-out,linear]`}
        aria-label="Admin navigation"
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar — hairline rail */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        {sidebarContent}
      </aside>

      {/* Main content — paper */}
      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 md:h-full md:overflow-y-auto lg:px-12 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
