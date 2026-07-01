import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { api } from "./api";
import {
  LayoutDashboard, Package, ShoppingCart, LogOut, Menu, X
} from "lucide-react";
import logo from "../../loudlayer_assets/logo.jpg";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await api.post("/auth/logout", {}); } catch {}
    navigate("/admin/login");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? "bg-neutral-900 text-white"
        : "text-neutral-600 hover:bg-neutral-200/50 hover:text-neutral-900"
    }`;

  const sidebarContent = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-3 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img src={logo} alt="LoudLayer" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900">LoudLayer</h1>
            <p className="text-[10px] text-neutral-400 font-mono">Admin Panel</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1 px-3">
        <NavLink to="/admin" end onClick={() => setSidebarOpen(false)} className={linkClass}>
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </NavLink>
        <NavLink to="/admin/products" onClick={() => setSidebarOpen(false)} className={linkClass}>
          <Package className="w-4 h-4" />
          Products
        </NavLink>
        <NavLink to="/admin/orders" onClick={() => setSidebarOpen(false)} className={linkClass}>
          <ShoppingCart className="w-4 h-4" />
          Orders
        </NavLink>
      </nav>

      <div className="border-t border-neutral-200 pt-4 mt-4 px-3 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-neutral-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-neutral-200 px-4 py-3 shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-neutral-700" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden">
            <img src={logo} alt="LoudLayer" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm font-bold text-neutral-900">LoudLayer</span>
        </div>
        <div className="w-5" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-neutral-950/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Slide-out Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-neutral-200 flex-col p-4 shrink-0">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center gap-2 px-3 py-4 mb-6 shrink-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src={logo} alt="LoudLayer" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-neutral-900">LoudLayer</h1>
              <p className="text-[10px] text-neutral-400 font-mono">Admin Panel</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <NavLink to="/admin" end className={linkClass}>
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </NavLink>
            <NavLink to="/admin/products" className={linkClass}>
              <Package className="w-4 h-4" />
              Products
            </NavLink>
            <NavLink to="/admin/orders" className={linkClass}>
              <ShoppingCart className="w-4 h-4" />
              Orders
            </NavLink>
          </nav>

          <div className="border-t border-neutral-200 pt-4 mt-4 shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-neutral-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
