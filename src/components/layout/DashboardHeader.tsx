"use client";

import { Search, Menu, PanelLeftClose, PanelLeftOpen, Bell, Sparkles } from "lucide-react";

interface Props {
  onMenuClick?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenNewInvoice?: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  userName?: string;
  userRole?: string;
}

export default function DashboardHeader({
  onMenuClick,
  isCollapsed = false,
  onToggleCollapse,
  searchTerm,
  onSearchChange,
  userName = "Administrator",
  userRole = "Company Owner",
}: Props) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center px-4 sm:px-6 justify-between gap-4 w-full shrink-0 shadow-2xs no-print print:hidden">
      {/* Mobile Menu & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* Mobile menu button (<lg) */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          title="Buka Menu Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar collapse toggle button (>=lg) */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Global Search */}
        <div className="flex-1 hidden sm:block relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nomor invoice, pelanggan, nominal..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50/90 border border-slate-200/80 rounded-xl text-slate-800 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-3 focus:ring-red-500/10 transition-all"
          />
        </div>
      </div>

      {/* Header Profile & Quick Status */}
      <div className="flex items-center gap-3">
        {/* System Active Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/70 rounded-full text-[11px] font-bold text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>SaaS Online</span>
        </div>

        {/* Notification Bell Icon */}
        <button
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors relative"
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="w-px h-5 bg-slate-200 hidden sm:block" />

        {/* User Profile */}
        <div className="flex items-center gap-2.5 cursor-pointer p-1 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {userName}
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
              {userRole}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

