'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, UserCheck, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

function ActivateContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Token aktivasi tidak ditemukan pada URL. Silakan periksa kembali email undangan Anda.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal terdiri dari 6 karakter.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/v1/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengaktifkan akun.');
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setSuccess('Akun berhasil diaktifkan! Mengalihkan ke dashboard...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat aktivasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-white border border-[#E8E8EC] p-8 rounded-[12px] shadow-sm relative">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#10B981]/10 rounded-[8px] mb-3">
          <UserCheck className="w-6 h-6 text-[#10B981]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0A0A0A] tracking-tight font-display">Aktivasi Akun Member</h1>
        <p className="text-[#6B6B6B] text-sm mt-1">Setel kata sandi Anda untuk mengaktifkan akses ke workspace</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-[6px] text-xs flex items-start gap-2.5 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#991B1B] mb-6">
          <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Gagal Aktivasi</p>
            <p className="mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-[6px] text-xs flex items-center gap-2.5 bg-[#10B981]/10 border border-[#10B981]/30 text-[#065F46] mb-6">
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1.5">
            Nama Lengkap (Opsional)
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#9C9C9C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
              className="w-full bg-white border border-[#E8E8EC] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15 rounded-[6px] py-2.5 pl-10 pr-4 text-[#0A0A0A] placeholder-[#9C9C9C] text-sm transition-all outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1.5">
            Kata Sandi Baru
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#9C9C9C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full bg-white border border-[#E8E8EC] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15 rounded-[6px] py-2.5 pl-10 pr-4 text-[#0A0A0A] placeholder-[#9C9C9C] text-sm transition-all outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1.5">
            Konfirmasi Kata Sandi
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#9C9C9C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi"
              className="w-full bg-white border border-[#E8E8EC] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15 rounded-[6px] py-2.5 pl-10 pr-4 text-[#0A0A0A] placeholder-[#9C9C9C] text-sm transition-all outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-2.5 px-4 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium rounded-[6px] shadow-sm hover:shadow-[0_4px_12px_rgba(99,102,241,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Aktifkan Akun & Masuk</span>
              <ShieldCheck className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-[#0A0A0A] p-4 relative font-sans">
      <Suspense fallback={
        <div className="text-[#6B6B6B] flex items-center gap-2 text-sm">
          <span className="w-4 h-4 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
          <span>Memuat halaman aktivasi...</span>
        </div>
      }>
        <ActivateContent />
      </Suspense>
    </main>
  );
}
