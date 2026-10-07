"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Receipt,
  Users,
  Building2,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Check,
  Package,
  Landmark,
  CreditCard,
  UserPlus,
  FileSpreadsheet,
  FolderKanban,
  Store,
} from "lucide-react";
import { useState } from "react";
import { WorkspaceDTO } from "@/lib/api-client";

export type NavigationTab = 'dashboard' | 'invoices' | 'projects' | 'customers' | 'company' | 'products';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  workspaces: WorkspaceDTO[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onOpenNewWorkspace: () => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onOpenNewInvoice: () => void;
  onOpenNewCustomer: () => void;
  onOpenInviteModal: () => void;
}

export default function Sidebar({
  mobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onOpenNewWorkspace,
  activeTab,
  setActiveTab,
  onOpenNewInvoice,
  onOpenNewCustomer,
  onOpenInviteModal,
}: SidebarProps) {
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [billingSubmenuOpen, setBillingSubmenuOpen] = useState(true);
  const [customersSubmenuOpen, setCustomersSubmenuOpen] = useState(true);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed left-0 top-0 bottom-0 bg-white border-r border-slate-200/90 flex flex-col z-50 transition-all duration-300 ${
          isCollapsed ? "lg:w-16" : "lg:w-60"
        } ${
          mobileOpen ? "w-60 translate-x-0" : "w-60 -translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center justify-between h-14 border-b border-slate-200/80 shrink-0 ${
            isCollapsed ? "lg:px-3 px-4" : "px-4"
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-red-500/20">
              I
            </div>
            <div className={`flex flex-col truncate ${isCollapsed ? "lg:hidden" : "block"}`}>
              <span className="font-display font-extrabold text-xs text-slate-900 tracking-tight truncate">
                INVOICE CMS
              </span>
              <span className="text-[9px] text-slate-400 font-semibold truncate">
                Multi-Company SaaS
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* WORKSPACE / COMPANY SELECTOR */}
        <div className="p-2.5 border-b border-slate-100 relative">
          <button
            type="button"
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            title={activeWorkspace?.name}
            className={`w-full flex items-center rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-100/80 transition-all ${
              isCollapsed ? "lg:justify-center p-2" : "justify-between p-2.5"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100/80 text-xs font-bold shadow-2xs">
                <Building2 className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col text-left truncate">
                  <span className="text-xs font-bold text-slate-800 truncate leading-tight">
                    {activeWorkspace?.name || 'Pilih Perusahaan'}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize font-medium">
                    {activeWorkspace?.type || 'company'}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  workspaceDropdownOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {/* Workspace Dropdown */}
          {workspaceDropdownOpen && (
            <div className="absolute left-2.5 right-2.5 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1 w-56 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                Pilih Perusahaan
              </div>
              {workspaces.map((ws) => (
                <button
                  type="button"
                  key={ws.id}
                  onClick={() => {
                    onSelectWorkspace(ws.id);
                    setWorkspaceDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeWorkspaceId === ws.id
                      ? "bg-red-50 text-red-600 font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{ws.name}</span>
                  </div>
                  {activeWorkspaceId === ws.id && (
                    <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  )}
                </button>
              ))}

              <div className="pt-1.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onOpenNewWorkspace();
                    setWorkspaceDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Perusahaan</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-3.5 scrollbar-thin">
          {/* SECTION UTAMA */}
          <div className="space-y-1">
            <div className={`px-2 mb-1 ${isCollapsed ? "lg:hidden" : "block"}`}>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                UTAMA
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              title={isCollapsed ? "Dashboard" : undefined}
              className={`w-full flex items-center gap-2.5 rounded-xl text-xs transition-all ${
                isCollapsed ? "lg:justify-center lg:px-0 py-2.5 px-2.5" : "px-3 py-2.5"
              } ${
                activeTab === 'dashboard'
                  ? "text-red-600 bg-red-50/80 font-bold shadow-2xs border border-red-100/60"
                  : "text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-red-600' : 'text-slate-500'}`} />
              <span className={isCollapsed ? "lg:hidden" : "block"}>
                Dashboard
              </span>
            </button>
          </div>

          {/* SECTION BILLING & INVOICE */}
          <div className="space-y-1">
            <div className={`px-2 mb-1 ${isCollapsed ? "lg:hidden" : "block"}`}>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                BILLING & INVOICE
              </span>
            </div>

            {/* Submenu Item Invoice */}
            <div>
              <div
                onClick={() => {
                  setBillingSubmenuOpen(!billingSubmenuOpen);
                  setActiveTab('invoices');
                }}
                title={isCollapsed ? "Faktur & Invoice" : undefined}
                className={`w-full flex items-center gap-2.5 rounded-xl text-xs transition-all cursor-pointer select-none ${
                  isCollapsed ? "lg:justify-center lg:px-0 py-2.5 px-2.5" : "px-3 py-2.5"
                } ${
                  activeTab === 'invoices'
                    ? "text-red-600 bg-red-50/80 font-bold shadow-2xs border border-red-100/60"
                    : "text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Receipt className={`w-4 h-4 shrink-0 ${activeTab === 'invoices' ? 'text-red-600' : 'text-slate-500'}`} />
                <span className={`flex-1 text-left ${isCollapsed ? "lg:hidden" : "block"}`}>
                  Faktur & Invoice
                </span>
                {!isCollapsed && (
                  <span className="p-0.5 rounded hover:bg-slate-200/60 transition-colors">
                    {billingSubmenuOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </span>
                )}
              </div>

              {billingSubmenuOpen && !isCollapsed && (
                <div className="ml-5 pl-3 border-l border-slate-200/80 mt-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('invoices')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                      activeTab === 'invoices'
                        ? "font-bold text-red-600 bg-red-50/60"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    Daftar Invoice
                  </button>
                  <button
                    type="button"
                    onClick={onOpenNewInvoice}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <Plus className="w-3 h-3 text-red-600" />
                    <span>Buat Invoice Baru</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SECTION MASTER DATA */}
          <div className="space-y-1">
            <div className={`px-2 mb-1 ${isCollapsed ? "lg:hidden" : "block"}`}>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                MASTER DATA
              </span>
            </div>

            {/* Submenu Item Projects */}
            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              title={isCollapsed ? "Kelola Project" : undefined}
              className={`w-full flex items-center gap-2.5 rounded-xl text-xs transition-all ${
                isCollapsed ? "lg:justify-center lg:px-0 py-2.5 px-2.5" : "px-3 py-2.5"
              } ${
                activeTab === 'projects'
                  ? "text-red-600 bg-red-50/80 font-bold shadow-2xs border border-red-100/60"
                  : "text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FolderKanban className={`w-4 h-4 shrink-0 ${activeTab === 'projects' ? 'text-red-600' : 'text-slate-500'}`} />
              <span className={isCollapsed ? "lg:hidden" : "block"}>
                Kelola Project & Milestone
              </span>
            </button>

            {/* Submenu Item Customers */}
            <div>
              <div
                onClick={() => {
                  setCustomersSubmenuOpen(!customersSubmenuOpen);
                  setActiveTab('customers');
                }}
                title={isCollapsed ? "Data Pelanggan" : undefined}
                className={`w-full flex items-center gap-2.5 rounded-xl text-xs transition-all cursor-pointer select-none ${
                  isCollapsed ? "lg:justify-center lg:px-0 py-2.5 px-2.5" : "px-3 py-2.5"
                } ${
                  activeTab === 'customers'
                    ? "text-red-600 bg-red-50/80 font-bold shadow-2xs border border-red-100/60"
                    : "text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Users className={`w-4 h-4 shrink-0 ${activeTab === 'customers' ? 'text-red-600' : 'text-slate-500'}`} />
                <span className={`flex-1 text-left ${isCollapsed ? "lg:hidden" : "block"}`}>
                  Data Pelanggan
                </span>
                {!isCollapsed && (
                  <span className="p-0.5 rounded hover:bg-slate-200/60 transition-colors">
                    {customersSubmenuOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </span>
                )}
              </div>

              {customersSubmenuOpen && !isCollapsed && (
                <div className="ml-5 pl-3 border-l border-slate-200/80 mt-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('customers')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                      activeTab === 'customers'
                        ? "font-bold text-red-600 bg-red-50/60"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    Daftar Pelanggan
                  </button>
                  <button
                    type="button"
                    onClick={onOpenNewCustomer}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <Plus className="w-3 h-3 text-red-600" />
                    <span>Tambah Pelanggan Baru</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SECTION PERUSAHAAN & TIM */}
          <div className="space-y-1">
            <div className={`px-2 mb-1 ${isCollapsed ? "lg:hidden" : "block"}`}>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                PERUSAHAAN
              </span>
            </div>

            <button
              onClick={() => setActiveTab('company')}
              title={isCollapsed ? "Perusahaan" : undefined}
              className={`w-full flex items-center gap-2.5 rounded-xl text-xs transition-all ${
                isCollapsed ? "lg:justify-center lg:px-0 py-2.5 px-2.5" : "px-3 py-2.5"
              } ${
                activeTab === 'company'
                  ? "text-red-600 bg-red-50/80 font-bold shadow-2xs border border-red-100/60"
                  : "text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Store className={`w-4 h-4 shrink-0 ${activeTab === 'company' ? 'text-red-600' : 'text-slate-500'}`} />
              <span className={isCollapsed ? "lg:hidden" : "block"}>
                Kelola Workspace
              </span>
            </button>

            <button
              onClick={onOpenInviteModal}
              title={isCollapsed ? "Undang Tim" : undefined}
              className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors ${
                isCollapsed ? "lg:justify-center lg:px-0 py-2.5 px-2.5" : "px-3 py-2"
              }`}
            >
              <UserPlus className="w-4 h-4 shrink-0 text-slate-400" />
              <span className={isCollapsed ? "lg:hidden" : "block"}>
                Undang Anggota
              </span>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              A
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate leading-tight">
                <span className="text-xs font-bold text-slate-900 truncate">
                  Admin Cendana
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate">
                  admin@cendanatech.com
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

