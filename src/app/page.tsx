'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Server,
  Zap,
  Trash2,
  Eye,
  Printer,
  X,
  UserPlus,
  Building2,
  Mail,
  Phone,
  ArrowUpRight,
  RefreshCw,
  Code2
} from 'lucide-react';
import { apiClient, InvoiceDTO, CustomerDTO } from '@/lib/api-client';

export default function Dashboard() {
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<{ status: string; engine: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'customers'>('invoices');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(null);

  // New Invoice Form state
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: 11,
    discount: 0,
    notes: 'Thank you for doing business with us!',
    items: [
      { description: 'Web Application Development Services', quantity: 1, unitPrice: 2500000 },
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
        apiClient.getHealth().catch(() => ({ status: 'offline', engine: 'Unknown / Error' })),
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
    const overdueCount = invoices.filter((inv) => inv.status === 'OVERDUE').length;

    return { totalRev, paidRev, pendingRev, overdueCount };
  }, [invoices]);

  // Create Invoice Handler
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.customerId) {
      alert('Please select a customer first');
      return;
    }
    try {
      await apiClient.createInvoice({
        invoiceNumber: newInvoice.invoiceNumber,
        customerId: newInvoice.customerId,
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

  // Toggle Invoice Status
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
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await apiClient.deleteInvoice(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete invoice');
    }
  };

  // Format currency IDR / USD
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header & Status Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Invoice Generator <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono border border-brand-500/30">Fullstack</span>
              </h1>
              <p className="text-xs text-slate-400">Billing Services & Golang Migration Architecture</p>
            </div>
          </div>

          {/* Backend Status Switch Indicator */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-full px-4 py-1.5">
            <Server className="w-4 h-4 text-cyan-400" />
            <div className="text-xs">
              <span className="text-slate-400">Engine: </span>
              <span className="font-semibold text-cyan-300 font-mono">
                {healthStatus?.engine || 'Connecting...'}
              </span>
            </div>
            <div className={`w-2 h-2 rounded-full ${healthStatus?.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <button
              onClick={fetchData}
              title="Refresh engine status"
              className="ml-1 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-all flex items-center gap-2 border border-slate-700"
            >
              <UserPlus className="w-4 h-4 text-slate-400" />
              <span>+ Customer</span>
            </button>
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-sm font-medium shadow-md shadow-brand-600/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* Architecture Info Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-slate-900/90 via-brand-950/40 to-slate-900/90 border border-brand-500/20 p-5 relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0 mt-1 md:mt-0">
                <Code2 className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm md:text-base flex items-center gap-2">
                  Architecture Ready for Golang Backend Migration 
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">Decoupled</span>
                </h3>
                <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
                  Saat ini aplikasi berjalan di <b>Next.js App Router API</b>. Kode backend alternatif dalam Golang telah disiapkan di <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono">/backend-go</code>. Cukup jalankan server Go di port 8080 & ubah <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono">NEXT_PUBLIC_API_BASE_URL</code> untuk pindah backend!
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="glass-panel glass-panel-hover p-5 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold text-white tracking-tight">{formatCurrency(metrics.totalRev)}</h2>
              <p className="text-xs text-slate-400 mt-1">{invoices.length} total invoices created</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-panel glass-panel-hover p-5 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Paid Amount</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold text-emerald-400 tracking-tight">{formatCurrency(metrics.paidRev)}</h2>
              <p className="text-xs text-slate-400 mt-1">Successfully collected</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-panel glass-panel-hover p-5 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending Balance</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold text-amber-400 tracking-tight">{formatCurrency(metrics.pendingRev)}</h2>
              <p className="text-xs text-slate-400 mt-1">Awaiting customer payment</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-panel glass-panel-hover p-5 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Customers</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-bold text-white tracking-tight">{customers.length}</h2>
              <p className="text-xs text-slate-400 mt-1">Registered clients</p>
            </div>
          </motion.div>
        </div>

        {/* Navigation Tabs & Search Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'invoices' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'customers' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Customers ({customers.length})
            </button>
          </div>

          {activeTab === 'invoices' && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search invoice or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab Content: Invoices Table */}
        {activeTab === 'invoices' && (
          <div className="glass-panel rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading invoices...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-sm">No invoices found matching criteria.</p>
                <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-medium"
                >
                  Create New Invoice
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-900/40 text-xs text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6 font-semibold">Invoice #</th>
                      <th className="py-4 px-6 font-semibold">Customer</th>
                      <th className="py-4 px-6 font-semibold">Due Date</th>
                      <th className="py-4 px-6 font-semibold">Total Amount</th>
                      <th className="py-4 px-6 font-semibold">Status</th>
                      <th className="py-4 px-6 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 font-mono font-medium text-brand-300">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-white">{inv.customer?.name || 'N/A'}</div>
                          <div className="text-xs text-slate-400">{inv.customer?.company || inv.customer?.email}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-300 text-xs">
                          {new Date(inv.dueDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-6 font-semibold text-white">
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : inv.status === 'OVERDUE'
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              title="View & Print Invoice"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {inv.status !== 'PAID' && (
                              <button
                                onClick={() => handleStatusChange(inv.id!, 'PAID')}
                                title="Mark as Paid"
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-medium transition-colors border border-emerald-500/30"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteInvoice(inv.id!)}
                              title="Delete Invoice"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
          <div className="glass-panel rounded-2xl overflow-hidden">
            {customers.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-sm">No customers registered yet.</p>
                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-medium"
                >
                  Add First Customer
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-900/40 text-xs text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6 font-semibold">Name</th>
                      <th className="py-4 px-6 font-semibold">Company</th>
                      <th className="py-4 px-6 font-semibold">Email</th>
                      <th className="py-4 px-6 font-semibold">Phone</th>
                      <th className="py-4 px-6 font-semibold">Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 font-medium text-white">{c.name}</td>
                        <td className="py-4 px-6 text-slate-300">{c.company || '-'}</td>
                        <td className="py-4 px-6 text-slate-300">{c.email}</td>
                        <td className="py-4 px-6 text-slate-300 font-mono text-xs">{c.phone || '-'}</td>
                        <td className="py-4 px-6 text-slate-400 text-xs">{c.address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CREATE INVOICE MODAL */}
      <AnimatePresence>
        {isInvoiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-400" />
                  Create New Invoice
                </h3>
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Invoice Number</label>
                    <input
                      type="text"
                      value={newInvoice.invoiceNumber}
                      onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-400">Select Customer</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsInvoiceModalOpen(false);
                          setIsCustomerModalOpen(true);
                        }}
                        className="text-[11px] text-brand-400 hover:underline"
                      >
                        + Add New
                      </button>
                    </div>
                    <select
                      value={newInvoice.customerId}
                      onChange={(e) => setNewInvoice({ ...newInvoice, customerId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                      required
                    >
                      <option value="">-- Choose Client --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.company || c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Tax (%)</label>
                      <input
                        type="number"
                        value={newInvoice.taxRate}
                        onChange={(e) => setNewInvoice({ ...newInvoice, taxRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Discount (IDR)</label>
                      <input
                        type="number"
                        value={newInvoice.discount}
                        onChange={(e) => setNewInvoice({ ...newInvoice, discount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase">Items & Services</span>
                    <button
                      type="button"
                      onClick={() =>
                        setNewInvoice({
                          ...newInvoice,
                          items: [...newInvoice.items, { description: '', quantity: 1, unitPrice: 0 }],
                        })
                      }
                      className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Item
                    </button>
                  </div>

                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...newInvoice.items];
                            updated[index].description = e.target.value;
                            setNewInvoice({ ...newInvoice, items: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
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
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updated = [...newInvoice.items];
                            updated[index].unitPrice = Number(e.target.value);
                            setNewInvoice({ ...newInvoice, items: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
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
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Notes / Terms</label>
                  <textarea
                    rows={2}
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsInvoiceModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30"
                  >
                    Save & Issue Invoice
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-brand-400" />
                  Add New Client
                </h3>
                <button
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={newCustomer.company}
                    onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30"
                  >
                    Save Client
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRINTABLE INVOICE PREVIEW MODAL */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              {/* Modal Actions */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 no-print">
                <span className="text-xs font-mono text-brand-400">Preview Mode</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> Print / PDF
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Invoice Printable View */}
              <div className="bg-white text-slate-900 p-8 rounded-xl space-y-8 font-sans">
                <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">INVOICE</h2>
                    <p className="text-xs font-mono text-slate-500 mt-1">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-slate-800">Duluin Digital Group</h3>
                    <p className="text-xs text-slate-500">Jakarta, Indonesia</p>
                    <p className="text-xs text-slate-500">billing@duluin.com</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">Billed To:</span>
                    <p className="font-bold text-slate-900 text-sm">{selectedInvoice.customer?.name}</p>
                    <p className="text-slate-600">{selectedInvoice.customer?.company}</p>
                    <p className="text-slate-600">{selectedInvoice.customer?.address}</p>
                    <p className="text-slate-600">{selectedInvoice.customer?.email}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div>
                      <span className="text-slate-500">Issue Date: </span>
                      <span className="font-semibold">{new Date(selectedInvoice.issueDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Due Date: </span>
                      <span className="font-semibold">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Status: </span>
                      <span className="font-bold text-brand-600">{selectedInvoice.status}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-slate-500 uppercase font-semibold">
                      <th className="py-2">Description</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-medium text-slate-800">{item.description}</td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 text-right font-semibold">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total Calculations */}
                <div className="flex justify-end pt-4 border-t border-slate-300">
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span>
                        {formatCurrency(
                          selectedInvoice.items.reduce((s, i) => s + i.amount, 0)
                        )}
                      </span>
                    </div>
                    {selectedInvoice.taxRate > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Tax ({selectedInvoice.taxRate}%):</span>
                        <span>
                          {formatCurrency(
                            (selectedInvoice.items.reduce((s, i) => s + i.amount, 0) * selectedInvoice.taxRate) / 100
                          )}
                        </span>
                      </div>
                    )}
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(selectedInvoice.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-300 pt-2">
                      <span>Total Amount:</span>
                      <span className="text-brand-600">{formatCurrency(selectedInvoice.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="pt-4 border-t border-slate-200 text-xs text-slate-500">
                    <span className="font-semibold block mb-1">Notes:</span>
                    <p>{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
