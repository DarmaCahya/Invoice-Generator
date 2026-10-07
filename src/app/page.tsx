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
  Trash2,
  Eye,
  X,
  UserPlus,
  RefreshCw,
  MailPlus,
  Building2,
  Filter,
  Loader2,
  ChevronRight,
  Activity,
  ArrowRight,
  DollarSign,
  Briefcase,
  Store,
  Layers,
  Sparkles,
} from 'lucide-react';
import { apiClient, InvoiceDTO, CustomerDTO, WorkspaceDTO } from '@/lib/api-client';
import Sidebar, { NavigationTab } from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import {
  InvoiceRevenueChart,
  InvoiceStatusBreakdown,
  TopCustomersCard,
  MonthlyRevenueData,
} from '@/components/dashboard/DashboardCharts';

export default function Dashboard() {
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceDTO[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Sidebar & responsive state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(null);

  // Invite Member Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error'; message: string; url?: string } | null>(null);

  // New Company / Workspace Form State
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    type: 'company',
  });

  // New Invoice Form state
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: 11,
    discount: 0,
    notes: 'Terima kasih atas kerja sama Anda.',
    items: [
      { description: 'Layanan Pengembangan Software & API Integration', quantity: 1, unitPrice: 3500000 },
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
      const [workspacesRes, invoicesRes, customersRes] = await Promise.all([
        apiClient.getWorkspaces().catch(() => [
          { id: 'ws-1', name: 'Cendana Tech Solution', type: 'company', slug: 'cendana-tech' },
          { id: 'ws-2', name: 'PT Digital Asia Utama', type: 'company', slug: 'digital-asia' },
          { id: 'ws-3', name: 'Studio Creative Indonesia', type: 'personal', slug: 'studio-creative' },
        ]),
        apiClient.getInvoices().catch(() => []),
        apiClient.getCustomers().catch(() => []),
      ]);

      setWorkspaces(workspacesRes);
      setInvoices(invoicesRes);
      setCustomers(customersRes);

      if (workspacesRes.length > 0) {
        setActiveWorkspaceId((prev) => prev || workspacesRes[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'ALL' ||
        inv.status.toUpperCase() === statusFilter.toUpperCase() ||
        (statusFilter === 'UNPAID' && (inv.status.toUpperCase() === 'PENDING' || inv.status.toUpperCase() === 'UNPAID'));
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCount = invoices.length;
    const paidInvoices = invoices.filter((i) => i.status.toUpperCase() === 'PAID');
    const unpaidInvoices = invoices.filter((i) => i.status.toUpperCase() === 'UNPAID' || i.status.toUpperCase() === 'PENDING');
    const overdueInvoices = invoices.filter((i) => i.status.toUpperCase() === 'OVERDUE');
    const draftInvoices = invoices.filter((i) => i.status.toUpperCase() === 'DRAFT');

    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const pendingRevenue = unpaidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    return {
      totalCount,
      paidCount: paidInvoices.length,
      unpaidCount: unpaidInvoices.length,
      overdueCount: overdueInvoices.length,
      draftCount: draftInvoices.length,
      totalRevenue,
      pendingRevenue,
    };
  }, [invoices]);

  // Generate 6-month monthly revenue data for SVG chart
  const monthlyRevenueData: MonthlyRevenueData[] = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const result: MonthlyRevenueData[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = `${monthNames[m]} ${String(y).slice(-2)}`;

      const inMonth = invoices.filter((inv) => {
        if (!inv.issueDate) return false;
        const invDate = new Date(inv.issueDate);
        return invDate.getMonth() === m && invDate.getFullYear() === y;
      });

      const totalRev = inMonth
        .filter((inv) => inv.status.toUpperCase() === 'PAID')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

      result.push({
        month: label,
        totalRevenue: totalRev,
        invoiceCount: inMonth.length,
        paidCount: inMonth.filter((inv) => inv.status.toUpperCase() === 'PAID').length,
      });
    }

    return result;
  }, [invoices]);

  // Top customers
  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; invoiceCount: number; email?: string }>();
    invoices.forEach((inv) => {
      const name = inv.customer?.name || 'Pelanggan Umum';
      const existing = map.get(name) || { name, invoiceCount: 0, email: inv.customer?.email };
      existing.invoiceCount += 1;
      map.set(name, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.invoiceCount - a.invoiceCount);
  }, [invoices]);

  // Format currency IDR
  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Add Item to New Invoice
  const handleAddItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  // Update item field
  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...newInvoice.items];
    updated[index] = { ...updated[index], [field]: value };
    setNewInvoice({ ...newInvoice, items: updated });
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    if (newInvoice.items.length <= 1) return;
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.filter((_, idx) => idx !== index),
    });
  };

  // Calculate Subtotal for modal preview
  const subtotalPreview = newInvoice.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0
  );
  const taxPreview = (subtotalPreview * (newInvoice.taxRate || 0)) / 100;
  const totalPreview = subtotalPreview + taxPreview - (newInvoice.discount || 0);

  // Submit New Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.customerId) {
      alert('Silakan pilih pelanggan terlebih dahulu.');
      return;
    }

    try {
      await apiClient.createInvoice({
        ...newInvoice,
        workspaceId: activeWorkspaceId,
      } as any);
      setIsInvoiceModalOpen(false);
      setNewInvoice({
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: '',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        taxRate: 11,
        discount: 0,
        notes: 'Terima kasih atas kerja sama Anda.',
        items: [{ description: 'Layanan Desain & Implementasi', quantity: 1, unitPrice: 2500000 }],
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat invoice.');
    }
  };

  // Submit New Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createCustomer({
        ...newCustomer,
        workspaceId: activeWorkspaceId,
      } as any);
      setIsCustomerModalOpen(false);
      setNewCustomer({ name: '', email: '', phone: '', company: '', address: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan pelanggan.');
    }
  };

  // Update Status
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiClient.updateInvoiceStatus(id, status);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal update status.');
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus invoice ini?')) return;
    try {
      await apiClient.deleteInvoice(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus invoice.');
    }
  };

  // Send Invitation Link
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus(null);
    try {
      const res = await apiClient.inviteWorkspaceMember(activeWorkspaceId, inviteEmail);
      setInviteStatus({
        type: 'success',
        message: 'Undangan berhasil dibuat! Tautan aktivasi siap digunakan.',
        url: res.activationUrl,
      });
      setInviteEmail('');
    } catch (err: any) {
      setInviteStatus({
        type: 'error',
        message: err.message || 'Gagal mengirim undangan.',
      });
    }
  };

  // Create Workspace
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.createWorkspace(newWorkspace);
      setIsWorkspaceModalOpen(false);
      setNewWorkspace({ name: '', type: 'company' });
      await fetchData();
      if (res && res.id) setActiveWorkspaceId(res.id);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat workspace.');
    }
  };

  // Sleek 5 Stat Cards Definition
  const statsCards = [
    {
      label: 'Total Tagihan',
      value: stats.totalCount,
      sub: `${stats.paidCount} lunas · ${stats.unpaidCount} belum bayar`,
      icon: Receipt,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      badge: 'Faktur',
    },
    {
      label: 'Total Pendapatan',
      value: formatIDR(stats.totalRevenue),
      sub: `${stats.paidCount} invoice selesai`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badge: '+0% bln ini',
    },
    {
      label: 'Menunggu Pembayaran',
      value: formatIDR(stats.pendingRevenue),
      sub: `${stats.unpaidCount + stats.overdueCount} tagihan aktif`,
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      badge: 'Aktif',
    },
    {
      label: 'Total Pelanggan',
      value: customers.length,
      sub: `${topCustomers.length} pelanggan bertransaksi`,
      icon: Users,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      badge: 'Master',
    },
    {
      label: 'Perusahaan Aktif',
      value: workspaces.length,
      sub: activeWorkspace?.name || 'Multi-tenant',
      icon: Building2,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badge: 'Tenant',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={(id) => setActiveWorkspaceId(id)}
        onOpenNewWorkspace={() => setIsWorkspaceModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewInvoice={() => setIsInvoiceModalOpen(true)}
        onOpenNewCustomer={() => setIsCustomerModalOpen(true)}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
      />

      {/* Main Content Area Container */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60'
        }`}
      >
        {/* Sticky Top Header */}
        <DashboardHeader
          onMenuClick={() => setMobileSidebarOpen(true)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenNewInvoice={() => setIsInvoiceModalOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          userName="Administrator"
          userRole={activeWorkspace?.name || 'Company Owner'}
        />

        {/* Content Gap */}
        <div className="h-4 sm:h-6 shrink-0" />

        {/* Main Content View */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-12">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Title & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div>
                <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
                  {activeTab === 'dashboard' && 'Dashboard Utama'}
                  {activeTab === 'invoices' && 'Kelola Faktur & Invoice'}
                  {activeTab === 'customers' && 'Data Master Pelanggan'}
                  {activeTab === 'company' && 'Pengaturan Perusahaan & Tim'}
                </h1>
                <p className="text-slate-500 text-xs mt-1 font-medium">
                  Ringkasan operasional invoice dan penagihan untuk{' '}
                  <span className="text-red-600 font-bold">
                    {activeWorkspace?.name || 'Perusahaan'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5 text-red-600" />
                  <span>Tambah Pelanggan</span>
                </button>
                <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-red-500/20 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Invoice Baru</span>
                </button>
              </div>
            </div>

            {/* 5 Stats Cards Grid with Spacious Breathing Room */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-5">
              {statsCards.map((st) => (
                <div
                  key={st.label}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between min-h-[145px]"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                      {st.label}
                    </span>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${st.iconBg} shadow-2xs`}
                    >
                      <st.icon className="w-4 h-4 shrink-0" />
                    </div>
                  </div>
                  <div>
                    <div className="font-display font-extrabold text-xl lg:text-2xl text-slate-900 tracking-tight leading-tight my-1 truncate">
                      {st.value}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100/90 gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium truncate">
                        {st.sub}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                        {st.badge}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* VIEW: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Revenue Trend Chart & Invoices Table */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Trend SVG Chart */}
                  <InvoiceRevenueChart data={monthlyRevenueData} />

                  {/* Recent Invoices Box */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                          <Receipt className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 font-display">
                          Faktur & Tagihan Terbaru
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab('invoices')}
                          className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                        >
                          Lihat Semua ({invoices.length}) <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Invoices Table Preview */}
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mb-2 text-red-600" />
                        <p className="text-xs font-medium">Memuat data invoice...</p>
                      </div>
                    ) : invoices.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 space-y-2">
                        <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-semibold text-slate-600">
                          Belum ada invoice yang terbit.
                        </p>
                        <button
                          onClick={() => setIsInvoiceModalOpen(true)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" /> Buat invoice pertama
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                              <th className="py-2.5 px-3">No. Invoice</th>
                              <th className="py-2.5 px-3">Pelanggan</th>
                              <th className="py-2.5 px-3">Jatuh Tempo</th>
                              <th className="py-2.5 px-3">Total Tagihan</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {invoices.slice(0, 5).map((inv) => {
                              const statusUpper = inv.status.toUpperCase();
                              const isPaid = statusUpper === 'PAID';
                              const isOverdue = statusUpper === 'OVERDUE';
                              const isUnpaid = statusUpper === 'UNPAID' || statusUpper === 'PENDING';

                              return (
                                <tr
                                  key={inv.id}
                                  className="hover:bg-slate-50/80 transition-colors group"
                                >
                                  <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                                    {inv.invoiceNumber}
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="font-semibold text-slate-800">
                                      {inv.customer?.name || 'Pelanggan'}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {inv.customer?.email || '-'}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-slate-500 font-medium">
                                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '-'}
                                  </td>
                                  <td className="py-3 px-3 font-bold text-slate-900">
                                    {formatIDR(inv.totalAmount || 0)}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                        isPaid
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : isOverdue
                                          ? 'bg-red-50 text-red-700 border-red-200'
                                          : isUnpaid
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : 'bg-slate-100 text-slate-600 border-slate-200'
                                      }`}
                                    >
                                      {isPaid
                                        ? 'Lunas'
                                        : isOverdue
                                        ? 'Jatuh Tempo'
                                        : isUnpaid
                                        ? 'Belum Bayar'
                                        : inv.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => setSelectedInvoice(inv)}
                                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="Lihat Detail Faktur"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      {!isPaid && (
                                        <button
                                          onClick={() => inv.id && handleUpdateStatus(inv.id, 'PAID')}
                                          className="px-2 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                        >
                                          Lunas
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Status Breakdown & Top Customers */}
                <div className="space-y-6">
                  {/* Status Breakdown Component */}
                  <InvoiceStatusBreakdown
                    counts={{
                      paid: stats.paidCount,
                      unpaid: stats.unpaidCount,
                      overdue: stats.overdueCount,
                      draft: stats.draftCount,
                      total: stats.totalCount,
                    }}
                  />

                  {/* Top Customers Distribution Card */}
                  <TopCustomersCard customers={topCustomers} />

                  {/* Company Profile Quick Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
                    <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-3">
                      <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold flex items-center justify-center text-xs shadow-2xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {activeWorkspace?.name || 'Cendana Tech Solution'}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          Workspace {activeWorkspace?.type || 'company'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mata Uang:</span>
                        <span className="font-semibold text-slate-800">IDR (Rupiah)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Zona Waktu:</span>
                        <span className="font-semibold text-slate-800">Asia/Jakarta</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tarif PPN Default:</span>
                        <span className="font-semibold text-slate-800">11%</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                      <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-red-600" />
                        <span>Undang Tim</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: INVOICES MANAGEMENT */}
            {activeTab === 'invoices' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                      <Receipt className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 font-display">
                      Daftar Kelola Invoice ({filteredInvoices.length})
                    </h3>
                  </div>

                  {/* Filter status buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/80 text-xs">
                    {['ALL', 'UNPAID', 'PAID', 'OVERDUE'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                          statusFilter === status
                            ? 'bg-red-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                        }`}
                      >
                        {status === 'ALL'
                          ? 'Semua Status'
                          : status === 'UNPAID'
                          ? 'Belum Bayar'
                          : status === 'PAID'
                          ? 'Lunas'
                          : 'Jatuh Tempo'}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-2 text-red-600" />
                    <p className="text-xs font-medium">Memuat daftar invoice...</p>
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 space-y-3">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">
                      Tidak ditemukan invoice yang sesuai dengan pencarian / filter.
                    </p>
                    <button
                      onClick={() => setIsInvoiceModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Buat Invoice Baru
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                          <th className="py-3 px-3">No. Invoice</th>
                          <th className="py-3 px-3">Pelanggan</th>
                          <th className="py-3 px-3">Tanggal Jatuh Tempo</th>
                          <th className="py-3 px-3">Total Tagihan</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredInvoices.map((inv) => {
                          const statusUpper = inv.status.toUpperCase();
                          const isPaid = statusUpper === 'PAID';
                          const isOverdue = statusUpper === 'OVERDUE';
                          const isUnpaid = statusUpper === 'UNPAID' || statusUpper === 'PENDING';

                          return (
                            <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                                {inv.invoiceNumber}
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="font-bold text-slate-800">
                                  {inv.customer?.name || 'Pelanggan'}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {inv.customer?.email || '-'}
                                </div>
                              </td>
                              <td className="py-3.5 px-3 text-slate-600 font-medium">
                                {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '-'}
                              </td>
                              <td className="py-3.5 px-3 font-extrabold text-slate-900 text-sm">
                                {formatIDR(inv.totalAmount || 0)}
                              </td>
                              <td className="py-3.5 px-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                    isPaid
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : isOverdue
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : isUnpaid
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {isPaid
                                    ? 'LUNAS'
                                    : isOverdue
                                    ? 'JATUH TEMPO'
                                    : isUnpaid
                                    ? 'BELUM BAYAR'
                                    : inv.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedInvoice(inv)}
                                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                                    title="Lihat Detail Faktur"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  {!isPaid && (
                                    <button
                                      onClick={() => inv.id && handleUpdateStatus(inv.id, 'PAID')}
                                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                    >
                                      Tandai Lunas
                                    </button>
                                  )}
                                  <button
                                    onClick={() => inv.id && handleDeleteInvoice(inv.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Hapus Invoice"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* VIEW: CUSTOMERS */}
            {activeTab === 'customers' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 font-display">
                      Data Master Pelanggan ({customers.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Pelanggan Baru</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                        <th className="py-3 px-3">Nama Pelanggan</th>
                        <th className="py-3 px-3">Email</th>
                        <th className="py-3 px-3">Telepon</th>
                        <th className="py-3 px-3">Alamat</th>
                        <th className="py-3 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3 font-bold text-slate-900">
                            {c.name}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 font-mono">
                            {c.email || '-'}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600">
                            {c.phone || '-'}
                          </td>
                          <td className="py-3.5 px-3 text-slate-500 truncate max-w-xs">
                            {c.address || '-'}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setNewInvoice({
                                  ...newInvoice,
                                  customerId: c.id || '',
                                });
                                setIsInvoiceModalOpen(true);
                              }}
                              className="px-3 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Buat Invoice
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW: COMPANY & WORKSPACE */}
            {activeTab === 'company' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Company Active Details */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold flex items-center justify-center text-sm shadow-2xs">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-slate-900 font-display">
                            {activeWorkspace?.name}
                          </h2>
                          <p className="text-xs text-slate-400 capitalize">
                            Tipe: {activeWorkspace?.type || 'Company Multi-Tenant'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsWorkspaceModalOpen(true)}
                        className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-red-600" />
                        <span>Tambah Perusahaan</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                      <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Total Invoice Perusahaan</span>
                        <div className="text-lg font-extrabold text-slate-900">{invoices.length} Faktur</div>
                      </div>
                      <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Total Pelanggan Terdaftar</span>
                        <div className="text-lg font-extrabold text-slate-900">{customers.length} Pelanggan</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Members & Invite */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-sm text-slate-900 font-display">
                        Anggota Tim Perusahaan
                      </h3>
                      <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Undang
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                            A
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">Administrator</div>
                            <div className="text-[10px] text-slate-400">admin@cendanatech.com</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                          Owner
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ==================================================== */}
      {/* MODAL: CREATE INVOICE (PRIMS STYLE) */}
      {/* ==================================================== */}
      <AnimatePresence>
        {isInvoiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInvoiceModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-[#DA2828] font-bold flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 font-display">
                      Buat Faktur / Invoice Baru
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Perusahaan: {activeWorkspace?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="overflow-y-auto p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Nomor Invoice <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newInvoice.invoiceNumber}
                      onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#DA2828]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Pilih Pelanggan <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={newInvoice.customerId}
                      onChange={(e) => setNewInvoice({ ...newInvoice, customerId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#DA2828] bg-white"
                    >
                      <option value="">-- Pilih Pelanggan --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Tanggal Jatuh Tempo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#DA2828]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Pajak PPN (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newInvoice.taxRate}
                        onChange={(e) => setNewInvoice({ ...newInvoice, taxRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#DA2828]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Diskon (IDR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newInvoice.discount}
                        onChange={(e) => setNewInvoice({ ...newInvoice, discount: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#DA2828]"
                      />
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 text-xs">Rincian Item & Jasa</span>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs font-bold text-[#DA2828] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Baris
                    </button>
                  </div>

                  <div className="space-y-2">
                    {newInvoice.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Deskripsi barang / layanan"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="flex-2 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#DA2828]"
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-16 px-2.5 py-2 border border-slate-200 rounded-xl text-xs text-center focus:outline-none focus:border-[#DA2828]"
                        />
                        <input
                          type="number"
                          placeholder="Harga Satuan"
                          min="0"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                          className="w-32 px-3 py-2 border border-slate-200 rounded-xl text-xs text-right focus:outline-none focus:border-[#DA2828]"
                        />
                        {newInvoice.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Summary */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-right">
                  <div className="text-[11px] text-slate-500">
                    Subtotal: <span className="font-bold text-slate-800">{formatIDR(subtotalPreview)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    PPN ({newInvoice.taxRate}%): <span className="font-bold text-slate-800">{formatIDR(taxPreview)}</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                    Total: {formatIDR(totalPreview)}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsInvoiceModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#DA2828] hover:bg-[#B81D1D] text-white font-bold rounded-xl transition-all shadow-sm"
                  >
                    Simpan & Terbitkan Invoice
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* MODAL: CREATE CUSTOMER */}
      {/* ==================================================== */}
      <AnimatePresence>
        {isCustomerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCustomerModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 font-display">
                  Tambah Data Pelanggan
                </h3>
                <button
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Nama Pelanggan / Kontak <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#DA2828]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Email Pelanggan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#DA2828]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#DA2828]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Alamat Lengkap</label>
                  <textarea
                    rows={2}
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#DA2828]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-red-500/20 active:scale-95"
                  >
                    Simpan Pelanggan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* MODAL: VIEW INVOICE DETAIL & PRINT */}
      {/* ==================================================== */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoice(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-10 p-6 space-y-5 text-xs max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 font-bold flex items-center justify-center border border-red-100 shadow-2xs">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 font-display">
                      Faktur {selectedInvoice.invoiceNumber}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Diterbitkan oleh {activeWorkspace?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Invoice details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Kepada:</span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {selectedInvoice.customer?.name}
                  </div>
                  <div className="text-slate-500 text-[11px]">{selectedInvoice.customer?.email}</div>
                  <div className="text-slate-500 text-[11px]">{selectedInvoice.customer?.address}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status Tagihan:</span>
                  <div className="mt-0.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        selectedInvoice.status.toUpperCase() === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {selectedInvoice.status.toUpperCase() === 'PAID' ? 'LUNAS' : 'BELUM DIBAYAR'}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-2 font-medium">
                    Jatuh Tempo: {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('id-ID') : '-'}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Deskripsi</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Harga</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{it.description}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600 font-mono">{formatIDR(it.unitPrice)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">{formatIDR(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grand Total */}
              <div className="text-right space-y-1">
                <div className="text-sm font-extrabold text-slate-900">
                  Total Pembayaran: {formatIDR(selectedInvoice.totalAmount || 0)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors shadow-2xs"
                >
                  Cetak / PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* MODAL: CREATE WORKSPACE */}
      {/* ==================================================== */}
      <AnimatePresence>
        {isWorkspaceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWorkspaceModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 font-display">
                  Tambah Perusahaan / Workspace
                </h3>
                <button
                  onClick={() => setIsWorkspaceModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateWorkspace} className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Nama Perusahaan / Bisnis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Prima Multi Solusi"
                    value={newWorkspace.name}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tipe Workspace</label>
                  <select
                    value={newWorkspace.type}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all bg-white"
                  >
                    <option value="company">Company / Korporasi</option>
                    <option value="umkm">UMKM / Bisnis Kecil</option>
                    <option value="personal">Personal / Freelance</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsWorkspaceModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-red-500/20 active:scale-95"
                  >
                    Buat Workspace
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* MODAL: INVITE MEMBER */}
      {/* ==================================================== */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 font-display">
                  Undang Anggota Tim ke {activeWorkspace?.name}
                </h3>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Email Calon Anggota <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@perusahaan.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all"
                  />
                </div>

                {inviteStatus && (
                  <div
                    className={`p-3 rounded-xl border ${
                      inviteStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    <p className="font-semibold">{inviteStatus.message}</p>
                    {inviteStatus.url && (
                      <div className="mt-2 text-[10px] break-all font-mono bg-white p-2 rounded border border-emerald-300 select-all">
                        {inviteStatus.url}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-red-500/20 active:scale-95"
                  >
                    Kirim Undangan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
