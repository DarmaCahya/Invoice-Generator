'use client';

import React, { useState } from 'react';
import { Mail, Lock, LogIn, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorCode(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorCode(data.code || null);
        throw new Error(data.message || 'Gagal masuk ke sistem.');
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setSuccess('Login berhasil! Mengalihkan ke dashboard...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat melakukan login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-[#0A0A0A] p-4 relative font-sans">
      <div className="w-full max-w-[400px] bg-white border border-[#E8E8EC] p-8 rounded-[12px] shadow-sm relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#6366F1]/10 rounded-[8px] mb-3">
            <LogIn className="w-6 h-6 text-[#6366F1]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0A0A0A] tracking-tight font-display">Masuk ke Akun</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Invoice Generator & Billing Platform</p>
        </div>

        {error && (
          <div className={`p-3.5 rounded-[6px] text-xs flex items-start gap-2.5 mb-6 ${
            errorCode === 'ACCOUNT_INACTIVE'
              ? 'bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#B45309]'
              : 'bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#991B1B]'
          }`}>
            {errorCode === 'ACCOUNT_INACTIVE' ? (
              <ShieldAlert className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{errorCode === 'ACCOUNT_INACTIVE' ? 'Akun Belum Aktif' : 'Gagal Login'}</p>
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
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9C9C9C] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="w-full bg-white border border-[#E8E8EC] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15 rounded-[6px] py-2.5 pl-10 pr-4 text-[#0A0A0A] placeholder-[#9C9C9C] text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9C9C9C] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#E8E8EC] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15 rounded-[6px] py-2.5 pl-10 pr-4 text-[#0A0A0A] placeholder-[#9C9C9C] text-sm transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium rounded-[6px] shadow-sm hover:shadow-[0_4px_12px_rgba(99,102,241,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#E8E8EC] text-center text-xs text-[#6B6B6B]">
          Anggota baru? Akses akun Anda melalui email undangan resmi.
        </div>
      </div>
    </main>
  );
}
