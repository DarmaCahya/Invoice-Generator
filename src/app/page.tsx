'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  Plus,
  Search,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  Server,
  Trash2,
  Eye,
  X,
  UserPlus,
  RefreshCw,
  MailPlus,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Check
} from 'lucide-react';
import { apiClient, InvoiceDTO, CustomerDTO } from '@/lib/api-client';

export default function Dashboard() {
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<{ status: string; engine: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'customers'>('invoices');

  // Sidebar Toggle State
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(null);

  // Invite Member Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error'; message: string; url?: string } | null>(null);

  // New Invoice Form state
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: 11,
    discount: 0,
    notes: 'Thank you for your business!',
    items: [
      { description: 'Design System & API Services', quantity: 1, unitPrice: 2500000 },
    ],
  });

  // New Customer Form state
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
  });

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthRes, invoicesRes, customersRes] = await Promise.all([
        apiClient.getHealth().catch(() => ({ status: 'offline', engine: 'Next.js API Engine' })),
        apiClient.getInvoices().catch(() => []),
        apiClient.getCustomers().catch(() => []),
      ]);
      setHealthStatus(healthRes);
      setInvoices(invoicesRes);
      setCustomers(customersRes);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer?.company?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const totalRev = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
    const paidRev = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
    const pendingRev = invoices
      .filter((inv) => inv.status === 'PENDING')
      .reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

    return { totalRev, paidRev, pendingRev };
  }, [invoices]);

  // Create Invoice Handler
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.customerId) {
      alert('Please select a client first.');
      return;
    }
    try {
      await apiClient.createInvoice({
        invoiceNumber: newInvoice.invoiceNumber,
        customerId: newInvoice.customerId,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: newInvoice.dueDate,
        status: 'PENDING',
        taxRate: Number(newInvoice.taxRate),
        discount: Number(newInvoice.discount),
        notes: newInvoice.notes,
        items: newInvoice.items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          amount: Number(it.quantity) * Number(it.unitPrice),
        })),
      });
      setIsInvoiceModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create invoice');
    }
  };

  // Create Customer Handler
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiClient.createCustomer(newCustomer);
      setIsCustomerModalOpen(false);
      setNewCustomer({ name: '', email: '', phone: '', company: '', address: '' });
      setNewInvoice((prev) => ({ ...prev, customerId: created.id || prev.customerId }));
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  // Send Invitation Handler
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus(null);
    try {
      const res = await fetch('/api/v1/workspaces/default/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviterId: 'system-owner-id',
          email: inviteEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengirim undangan.');

      setInviteStatus({
        type: 'success',
        message: 'Undangan aktivasi akun berhasil dikirim via email!',
        url: data.activationUrl,
      });
      setInviteEmail('');
    } catch (err: any) {
      setInviteStatus({ type: 'error', message: err.message });
    }
  };

  // Toggle Status
  const handleStatusChange = async (id: string, newStatus: InvoiceDTO['status']) => {
    try {
      await apiClient.updateInvoiceStatus(id, newStatus);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Hapus invoice ini?')) return;
    try {
      await apiClient.deleteInvoice(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete invoice');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] flex flex-row font-sans">

      {/* COLLAPSIBLE SIDEBAR */}
      <aside
        className={`bg-white border-r border-[#E8E8EC] transition-all duration-300 flex flex-col justify-between z-40 sticky top-0 h-screen shrink-0 ${
          sidebarOpen ? 'w-64' : 'w-18'
        }`}
      >
        {/* Sidebar Top: Logo & Nav Links */}
        <div>
          {/* Logo Bar */}
          <div className={`h-[68px] border-b border-[#E8E8EC] flex items-center ${sidebarOpen ? 'px-4 justify-start' : 'px-0 justify-center'}`}>
            <div className={`flex items-center gap-3 overflow-hidden ${sidebarOpen ? '' : 'justify-center'}`}>
              <div className="w-8 h-8 rounded-[6px] bg-[#6366F1] flex items-center justify-center text-white font-bold text-xs shrink-0">
                <Receipt className="w-4.5 h-4.5" />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col whitespace-nowrap">
                  <span className="text-base font-bold text-[#0A0A0A] font-display tracking-tight">
                    Invoice Generator
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Menu Items */}
          <nav className="p-3 space-y-1.5">
            <button
              onClick={() => setActiveTab('invoices')}
              title={!sidebarOpen ? 'Dashboard & Invoices' : undefined}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-all ${
                sidebarOpen ? 'justify-start' : 'justify-center'
              } ${
                activeTab === 'invoices'
                  ? 'bg-[#6366F1] text-white shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#FAFAFA]'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
              {sidebarOpen && <span>Dashboard & Invoices</span>}
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              title={!sidebarOpen ? 'Data Pelanggan' : undefined}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-all ${
                sidebarOpen ? 'justify-start' : 'justify-center'
              } ${
                activeTab === 'customers'
                  ? 'bg-[#6366F1] text-white shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#FAFAFA]'
              }`}
            >
              <Users className="w-4.5 h-4.5 shrink-0" />
              {sidebarOpen && <span>Data Pelanggan</span>}
            </button>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              title={!sidebarOpen ? 'Undang Member' : undefined}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-[6px] text-sm font-medium text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] transition-all ${
                sidebarOpen ? 'justify-start' : 'justify-center'
              }`}
            >
              <MailPlus className="w-4.5 h-4.5 shrink-0 text-[#6366F1]" />
              {sidebarOpen && <span>Undang Member</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom: User Profile / Footer */}
        <div className="p-3 border-t border-[#E8E8EC] space-y-1">
          <div className={`flex items-center gap-3 px-2 py-2 overflow-hidden ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1] font-bold text-sm shrink-0">
              A
            </div>
            {sidebarOpen && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden text-ellipsis">
                <span className="text-sm font-semibold text-[#0A0A0A]">Admin Workspace</span>
                <span className="text-xs text-[#6B6B6B]">admin@billing.com</span>
              </div>
            )}
          </div>

          <a
            href="/login"
            title={!sidebarOpen ? 'Keluar' : undefined}
            className={`w-full flex items-center gap-3.5 px-3 py-2 rounded-[6px] text-sm font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors ${
              sidebarOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            {sidebarOpen && <span>Keluar</span>}
          </a>
        </div>
      </aside>

      {/* RIGHT SIDE CONTAINER: NAVBAR + MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TOP NAVBAR */}
        <header className="h-[68px] bg-white/90 backdrop-blur-md border-b border-[#E8E8EC] sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Toggle Button in Navbar */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
              className="p-2 rounded-[6px] text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] border border-[#E8E8EC] transition-colors flex items-center justify-center"
            >
              {sidebarOpen ? <PanelLeftClose className="w-4.5 h-4.5" /> : <PanelLeftOpen className="w-4.5 h-4.5" />}
            </button>

            <h2 className="text-base font-bold text-[#0A0A0A] font-display tracking-tight flex items-center gap-2">
              <span>{activeTab === 'invoices' ? 'Dashboard & Invoices' : 'Data Pelanggan'}</span>
            </h2>
          </div>

          {/* Engine Status & CTA Buttons */}
          <div className="flex items-center gap-4">
            {/* Backend Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#6B6B6B] bg-[#FAFAFA] border border-[#E8E8EC] px-3.5 py-1.5 rounded-full">
              <Server className="w-4 h-4 text-[#6366F1]" />
              <span className="font-mono text-[#0A0A0A] font-medium text-xs">
                {healthStatus?.engine || 'Next.js API Engine'}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <button
                onClick={fetchData}
                title="Refresh Engine"
                className="text-[#9C9C9C] hover:text-[#0A0A0A] transition-colors ml-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="px-3.5 py-2 rounded-[6px] border border-[#E8E8EC] text-[#0A0A0A] bg-white hover:bg-[#FAFAFA] text-sm font-medium transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4 text-[#6B6B6B]" />
                <span className="hidden sm:inline">+ Customer</span>
              </button>
              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="px-4 py-2 rounded-[6px] bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-medium shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Invoice</span>
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="max-w-[1280px] mx-auto px-6 py-8 flex-1 w-full space-y-6">

          {/* System Info Banner */}
          <div className="genesis-card p-5 bg-white border border-[#E8E8EC]">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-[6px] bg-[#6366F1]/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4.5 h-4.5 text-[#6366F1]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#0A0A0A] text-sm font-display">
                    System Multi-Tenant & Authentication Ready
                  </h3>
                  <span className="bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                    Decoupled Architecture
                  </span>
                </div>
                <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
                  Layanan <b>Aktivasi Akun Member (<code className="text-[#6366F1]">isActive</code>)</b> & <b>Email Undangan</b> aktif. Anggota yang diundang harus menyelesaikan aktivasi akun via email sebelum login.
                </p>
              </div>
            </div>
          </div>

          {/* Genesis KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="genesis-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Total Pendapatan</span>
                <div className="w-8 h-8 rounded-[6px] bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-3xl font-bold text-[#0A0A0A] tracking-tight font-mono">{formatCurrency(metrics.totalRev)}</h2>
                <p className="text-xs text-[#6B6B6B] mt-1">{invoices.length} total transaksi invoice</p>
              </div>
            </div>

            <div className="genesis-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Telah Dibayar</span>
                <div className="w-8 h-8 rounded-[6px] bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-3xl font-bold text-[#10B981] tracking-tight font-mono">{formatCurrency(metrics.paidRev)}</h2>
                <p className="text-xs text-[#6B6B6B] mt-1">Pembayaran lunas terverifikasi</p>
              </div>
            </div>

            <div className="genesis-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Belum Dibayar</span>
                <div className="w-8 h-8 rounded-[6px] bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-3xl font-bold text-[#F59E0B] tracking-tight font-mono">{formatCurrency(metrics.pendingRev)}</h2>
                <p className="text-xs text-[#6B6B6B] mt-1">Menunggu pembayaran klien</p>
              </div>
            </div>
          </div>

          {/* Navigation Controls & Search Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#E8E8EC] pb-4">
            <div className="flex items-center gap-1.5 bg-[#E8E8EC]/50 p-1 rounded-[8px]">
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-4 py-2 rounded-[6px] text-sm font-medium transition-all ${
                  activeTab === 'invoices' ? 'bg-white text-[#0A0A0A] shadow-sm' : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
                }`}
              >
                Invoice ({invoices.length})
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`px-4 py-2 rounded-[6px] text-sm font-medium transition-all ${
                  activeTab === 'customers' ? 'bg-white text-[#0A0A0A] shadow-sm' : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
                }`}
              >
                Pelanggan ({customers.length})
              </button>
            </div>

            {activeTab === 'invoices' && (
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-[#9C9C9C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nomor invoice / pelanggan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-[6px] bg-white border border-[#E8E8EC] text-sm text-[#0A0A0A] placeholder-[#9C9C9C] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-[6px] bg-white border border-[#E8E8EC] text-sm text-[#6B6B6B] focus:outline-none focus:border-[#6366F1]"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="OVERDUE">OVERDUE</option>
                </select>
              </div>
            )}
          </div>

          {/* Tab Content: Invoices Table */}
          {activeTab === 'invoices' && (
            <div className="genesis-card overflow-hidden">
              {loading ? (
                <div className="p-10 text-center text-sm text-[#6B6B6B]">Memuat data invoice...</div>
              ) : filteredInvoices.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <Receipt className="w-10 h-10 text-[#9C9C9C] mx-auto" />
                  <p className="text-[#6B6B6B] text-sm">Tidak ada invoice yang sesuai.</p>
                  <button
                    onClick={() => setIsInvoiceModalOpen(true)}
                    className="px-4 py-2 rounded-[6px] bg-[#6366F1] text-white text-sm font-medium"
                  >
                    Buat Invoice Pertama
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E8E8EC] bg-[#FAFAFA] text-xs text-[#6B6B6B] uppercase tracking-wider font-semibold">
                        <th className="py-3.5 px-5">Nomor Invoice</th>
                        <th className="py-3.5 px-5">Pelanggan</th>
                        <th className="py-3.5 px-5">Jatuh Tempo</th>
                        <th className="py-3.5 px-5">Total</th>
                        <th className="py-3.5 px-5">Status</th>
                        <th className="py-3.5 px-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E8EC] text-sm">
                      {filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-[#FAFAFA] transition-colors">
                          <td className="py-4 px-5 font-mono font-medium text-[#6366F1]">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-4 px-5">
                            <div className="font-medium text-[#0A0A0A]">{inv.customer?.name || 'N/A'}</div>
                            <div className="text-xs text-[#6B6B6B]">{inv.customer?.company || inv.customer?.email}</div>
                          </td>
                          <td className="py-4 px-5 text-[#6B6B6B] text-xs">
                            {new Date(inv.dueDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-4 px-5 font-semibold text-[#0A0A0A] font-mono">
                            {formatCurrency(inv.totalAmount)}
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                inv.status === 'PAID'
                                  ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                                  : inv.status === 'OVERDUE'
                                  ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                                  : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedInvoice(inv)}
                                title="Lihat Detail"
                                className="p-1.5 rounded-[4px] text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#E8E8EC]/50"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {inv.status !== 'PAID' && (
                                <button
                                  onClick={() => handleStatusChange(inv.id!, 'PAID')}
                                  title="Tandai Lunas"
                                  className="px-2.5 py-1 rounded-[4px] bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 text-xs font-medium border border-[#10B981]/30 flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Tandai Lunas</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteInvoice(inv.id!)}
                                title="Hapus Invoice"
                                className="p-1.5 rounded-[4px] text-[#6B6B6B] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Customers Table */}
          {activeTab === 'customers' && (
            <div className="genesis-card overflow-hidden">
              {customers.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <Users className="w-10 h-10 text-[#9C9C9C] mx-auto" />
                  <p className="text-[#6B6B6B] text-sm">Belum ada pelanggan terdaftar.</p>
                  <button
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="px-4 py-2 rounded-[6px] bg-[#6366F1] text-white text-sm font-medium"
                  >
                    Tambah Pelanggan Baru
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E8E8EC] bg-[#FAFAFA] text-xs text-[#6B6B6B] uppercase tracking-wider font-semibold">
                        <th className="py-3.5 px-5">Nama</th>
                        <th className="py-3.5 px-5">Perusahaan</th>
                        <th className="py-3.5 px-5">Email</th>
                        <th className="py-3.5 px-5">Telepon</th>
                        <th className="py-3.5 px-5">Alamat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E8EC] text-sm">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-[#FAFAFA] transition-colors">
                          <td className="py-4 px-5 font-medium text-[#0A0A0A]">{c.name}</td>
                          <td className="py-4 px-5 text-[#6B6B6B]">{c.company || '-'}</td>
                          <td className="py-4 px-5 text-[#6B6B6B]">{c.email}</td>
                          <td className="py-4 px-5 text-[#6B6B6B] font-mono text-xs">{c.phone || '-'}</td>
                          <td className="py-4 px-5 text-[#6B6B6B] text-xs">{c.address || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* INVITE MEMBER MODAL */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E8E8EC] rounded-[12px] max-w-md w-full p-6 space-y-5 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-[#E8E8EC] pb-3.5">
                <h3 className="text-base font-bold text-[#0A0A0A] flex items-center gap-2 font-display">
                  <MailPlus className="w-4.5 h-4.5 text-[#6366F1]" />
                  Kirim Undangan Member
                </h3>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="p-1 rounded-[4px] text-[#9C9C9C] hover:text-[#0A0A0A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {inviteStatus && (
                <div className={`p-3.5 rounded-[6px] text-xs ${
                  inviteStatus.type === 'success'
                    ? 'bg-[#10B981]/10 border border-[#10B981]/30 text-[#065F46]'
                    : 'bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#991B1B]'
                }`}>
                  <p className="font-semibold">{inviteStatus.message}</p>
                  {inviteStatus.url && (
                    <div className="mt-2 text-[11px] bg-white p-2 rounded border border-[#E8E8EC] font-mono select-all text-[#6366F1] break-all">
                      {inviteStatus.url}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">
                    Email Calon Member
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="member@perusahaan.com"
                    className="w-full px-3 py-2 rounded-[6px] bg-white border border-[#E8E8EC] text-sm text-[#0A0A0A] focus:border-[#6366F1] focus:outline-none"
                  />
                  <p className="text-xs text-[#9C9C9C] mt-1">
                    Sistem akan membuat akun dengan status <code className="text-[#6366F1]">isActive: false</code> dan mengirimkan link aktivasi via email.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E8EC]">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 rounded-[6px] bg-[#FAFAFA] border border-[#E8E8EC] text-sm font-medium text-[#6B6B6B]"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-[6px] bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-medium shadow-sm"
                  >
                    Kirim Email Undangan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE INVOICE MODAL */}
      <AnimatePresence>
        {isInvoiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E8E8EC] rounded-[12px] max-w-xl w-full p-6 space-y-5 shadow-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E8E8EC] pb-3.5">
                <h3 className="text-base font-bold text-[#0A0A0A] flex items-center gap-2 font-display">
                  <Receipt className="w-4.5 h-4.5 text-[#6366F1]" />
                  Buat Invoice Baru
                </h3>
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="p-1 rounded-[4px] text-[#9C9C9C] hover:text-[#0A0A0A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">
                      Nomor Invoice
                    </label>
                    <input
                      type="text"
                      value={newInvoice.invoiceNumber}
                      onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-[6px] bg-white border border-[#E8E8EC] text-sm text-[#0A0A0A] font-mono"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Pilih Klien</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsInvoiceModalOpen(false);
                          setIsCustomerModalOpen(true);
                        }}
                        className="text-xs text-[#6366F1] hover:underline"
                      >
                        + Tambah Baru
                      </button>
                    </div>
                    <select
                      value={newInvoice.customerId}
                      onChange={(e) => setNewInvoice({ ...newInvoice, customerId: e.target.value })}
                      className="w-full px-3 py-2 rounded-[6px] bg-white border border-[#E8E8EC] text-sm text-[#0A0A0A]"
                      required
                    >
                      <option value="">-- Pilih Pelanggan --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.company || c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Jatuh Tempo</label>
                    <input
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-[6px] bg-white border border-[#E8E8EC] text-sm text-[#0A0A0A]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Pajak (%)</label>
                      <input
                        type="number"
                        value={newInvoice.taxRate}
                        onChange={(e) => setNewInvoice({ ...newInvoice, taxRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-[6px] bg-white border border-[#E8E8EC] text-sm text-[#0A0A0A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Diskon (IDR)</label>
                      <input
                        type="number"
                        value={newInvoice.discount}
                        onChange={(e) => setNewInvoice({ ...newInvoice, discount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-[6px] bg-white border border-[#E8E8EC] text-sm text-[#0A0A0A]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between border-b border-[#E8E8EC] pb-1.5">
                    <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Item / Layanan</span>
                    <button
                      type="button"
                      onClick={() =>
                        setNewInvoice({
                          ...newInvoice,
                          items: [...newInvoice.items, { description: '', quantity: 1, unitPrice: 0 }],
                        })
                      }
                      className="text-xs text-[#6366F1] hover:underline flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Item
                    </button>
                  </div>

                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-[#FAFAFA] p-2 rounded-[6px] border border-[#E8E8EC]">
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Deskripsi layanan"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...newInvoice.items];
                            updated[index].description = e.target.value;
                            setNewInvoice({ ...newInvoice, items: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-[4px] bg-white border border-[#E8E8EC] text-xs text-[#0A0A0A]"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...newInvoice.items];
                            updated[index].quantity = Number(e.target.value);
                            setNewInvoice({ ...newInvoice, items: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-[4px] bg-white border border-[#E8E8EC] text-xs text-[#0A0A0A]"
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Harga"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updated = [...newInvoice.items];
                            updated[index].unitPrice = Number(e.target.value);
                            setNewInvoice({ ...newInvoice, items: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-[4px] bg-white border border-[#E8E8EC] text-xs text-[#0A0A0A]"
                          required
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        {newInvoice.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = newInvoice.items.filter((_, i) => i !== index);
                              setNewInvoice({ ...newInvoice, items: updated });
                            }}
                            className="text-[#9C9C9C] hover:text-[#EF4444]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Catatan / Ketentuan</label>
                  <textarea
                    rows={2}
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-[6px] bg-white border border-[#E8E8EC] text-sm text-[#0A0A0A]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E8EC]">
                  <button
                    type="button"
                    onClick={() => setIsInvoiceModalOpen(false)}
                    className="px-4 py-2 rounded-[6px] bg-[#FAFAFA] border border-[#E8E8EC] text-sm font-medium text-[#6B6B6B]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-[6px] bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-medium shadow-sm"
                  >
                    Simpan & Terbitkan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE CUSTOMER MODAL */}
      <AnimatePresence>
        {isCustomerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E8E8EC] rounded-[12px] max-w-md w-full p-6 space-y-4 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-[#E8E8EC] pb-3.5">
                <h3 className="text-base font-bold text-[#0A0A0A] flex items-center gap-2 font-display">
                  <UserPlus className="w-4.5 h-4.5 text-[#6366F1]" />
                  Tambah Pelanggan Baru
                </h3>
                <button
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="p-1 rounded-[4px] text-[#9C9C9C] hover:text-[#0A0A0A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-[6px] bg-white border border-[#E8E8EC] text-sm text-[#0A0A0A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Alamat Email</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-[6px] bg-white border border-[#E8E8EC] text-sm text-[#0A0A0A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Perusahaan</label>
                  <input
                    type="text"
                    value={newCustomer.company}
                    onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-[6px] bg-white border border-[#E8E8EC] text-sm text-[#0A0A0A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-[6px] bg-white border border-[#E8E8EC] text-sm text-[#0A0A0A]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E8EC]">
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(false)}
                    className="px-4 py-2 rounded-[6px] bg-[#FAFAFA] border border-[#E8E8EC] text-sm font-medium text-[#6B6B6B]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-[6px] bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-medium shadow-sm"
                  >
                    Simpan Pelanggan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW INVOICE DETAIL MODAL */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E8E8EC] rounded-[12px] max-w-2xl w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E8E8EC] pb-3.5">
                <div>
                  <h3 className="text-lg font-bold text-[#0A0A0A] font-mono">{selectedInvoice.invoiceNumber}</h3>
                  <p className="text-xs text-[#6B6B6B]">Detail Transaksi Invoice</p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 rounded-[4px] text-[#9C9C9C] hover:text-[#0A0A0A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#FAFAFA] p-3 rounded-[6px] border border-[#E8E8EC]">
                  <span className="text-[#6B6B6B] block font-semibold mb-1">Ditujukan Kepada:</span>
                  <div className="font-bold text-[#0A0A0A]">{selectedInvoice.customer?.name}</div>
                  <div className="text-[#6B6B6B]">{selectedInvoice.customer?.company}</div>
                  <div className="text-[#6B6B6B]">{selectedInvoice.customer?.email}</div>
                </div>

                <div className="bg-[#FAFAFA] p-3 rounded-[6px] border border-[#E8E8EC] space-y-1">
                  <div>
                    <span className="text-[#6B6B6B]">Status: </span>
                    <span className="font-semibold text-[#6366F1]">{selectedInvoice.status}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B]">Jatuh Tempo: </span>
                    <span className="font-medium text-[#0A0A0A]">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E8EC] text-[#6B6B6B] font-semibold">
                    <th className="py-2">Item</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Harga</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8EC]">
                  {selectedInvoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 text-[#0A0A0A]">{it.description}</td>
                      <td className="py-2 text-[#6B6B6B] font-mono">{it.quantity}</td>
                      <td className="py-2 text-[#6B6B6B] font-mono">{formatCurrency(it.unitPrice)}</td>
                      <td className="py-2 text-right font-semibold font-mono text-[#0A0A0A]">{formatCurrency(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center pt-3 border-t border-[#E8E8EC]">
                <span className="text-xs font-semibold text-[#6B6B6B]">Total Invoice:</span>
                <span className="text-lg font-bold text-[#0A0A0A] font-mono">{formatCurrency(selectedInvoice.totalAmount)}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
