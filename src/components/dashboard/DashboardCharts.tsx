"use client";

import { useState } from "react";
import { TrendingUp, CheckCircle2, Clock, AlertCircle, FileText, Users, ArrowUpRight } from "lucide-react";

export interface MonthlyRevenueData {
  month: string;
  totalRevenue: number;
  invoiceCount: number;
  paidCount: number;
}

export function InvoiceRevenueChart({ data }: { data: MonthlyRevenueData[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(...data.map((d) => d.totalRevenue), 1000000);
  const chartHeight = 170;
  const chartWidth = 500;
  const paddingX = 35;
  const paddingBottom = 30;
  const paddingTop = 20;

  const points = data.map((d, i) => {
    const x =
      paddingX +
      (i / Math.max(data.length - 1, 1)) * (chartWidth - paddingX * 2);
    const y =
      paddingTop +
      (1 - d.totalRevenue / maxVal) * (chartHeight - paddingTop - paddingBottom);
    return { x, y, ...d };
  });

  // SVG path for line
  const linePath = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  // SVG path for area fill
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${
          chartHeight - paddingBottom
        } L ${points[0].x} ${chartHeight - paddingBottom} Z`
      : "";

  const formatRupiah = (val: number) => {
    if (val >= 1000000) {
      return `Rp ${(val / 1000000).toFixed(1)} jt`;
    }
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-100/80 flex items-center justify-center text-red-600 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 font-display">
              Tren Pendapatan & Tagihan
            </h3>
          </div>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Akumulasi nilai invoice dalam 6 bulan terakhir
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-200/80 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-200" /> Pendapatan (IDR)
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden pt-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-44 overflow-visible"
        >
          <defs>
            <linearGradient id="invoiceAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y =
              paddingTop + ratio * (chartHeight - paddingTop - paddingBottom);
            return (
              <line
                key={`grid-${idx}`}
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="#F1F5F9"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#invoiceAreaGrad)" />}

          {/* Smooth Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#DC2626"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive points */}
          {points.map((pt, idx) => (
            <g
              key={`pt-${idx}`}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIdx === idx ? 6 : 4}
                fill="#ffffff"
                stroke="#DC2626"
                strokeWidth={hoveredIdx === idx ? 3 : 2}
                className="transition-all duration-200"
              />
              {/* Month label on X axis */}
              <text
                x={pt.x}
                y={chartHeight - 8}
                textAnchor="middle"
                fontSize="11"
                fill="#64748B"
                fontWeight="600"
              >
                {pt.month}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && (
          <div
            className="absolute -top-1 pointer-events-none transform -translate-x-1/2 bg-slate-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap z-20 flex flex-col items-center gap-0.5 border border-slate-700/50"
            style={{
              left: `${(points[hoveredIdx].x / chartWidth) * 100}%`,
            }}
          >
            <div className="font-bold text-white text-xs">
              {formatRupiah(points[hoveredIdx].totalRevenue)}
            </div>
            <div className="text-slate-300 text-[10px]">
              {points[hoveredIdx].invoiceCount} invoice · {points[hoveredIdx].paidCount} lunas
            </div>
            <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mb-1 mt-0.5 border-r border-b border-slate-700/50" />
          </div>
        )}
      </div>
    </div>
  );
}

export function InvoiceStatusBreakdown({
  counts,
}: {
  counts: {
    paid: number;
    unpaid: number;
    overdue: number;
    draft: number;
    total: number;
  };
}) {
  const items = [
    {
      status: 'paid',
      label: 'Lunas (Paid)',
      count: counts.paid,
      color: 'bg-emerald-500',
      badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: CheckCircle2,
    },
    {
      status: 'unpaid',
      label: 'Belum Dibayar',
      count: counts.unpaid,
      color: 'bg-amber-500',
      badge: 'text-amber-700 bg-amber-50 border-amber-200',
      icon: Clock,
    },
    {
      status: 'overdue',
      label: 'Jatuh Tempo',
      count: counts.overdue,
      color: 'bg-red-600',
      badge: 'text-red-700 bg-red-50 border-red-200',
      icon: AlertCircle,
    },
    {
      status: 'draft',
      label: 'Draft / Pending',
      count: counts.draft,
      color: 'bg-slate-400',
      badge: 'text-slate-600 bg-slate-50 border-slate-200',
      icon: FileText,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3.5">
        <h3 className="font-bold text-sm text-slate-900 font-display">
          Status Tagihan
        </h3>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          Total {counts.total} Invoice
        </span>
      </div>

      {/* Stacked Progress Bar */}
      <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex mb-5 p-0.5 border border-slate-200/50">
        {counts.total > 0 ? (
          items.map((item) => {
            const widthPct = (item.count / counts.total) * 100;
            if (widthPct === 0) return null;
            return (
              <div
                key={item.status}
                style={{ width: `${widthPct}%` }}
                className={`${item.color} h-full first:rounded-l-full last:rounded-r-full transition-all duration-300`}
                title={`${item.label}: ${item.count} (${widthPct.toFixed(0)}%)`}
              />
            );
          })
        ) : (
          <div className="w-full h-full bg-slate-200 rounded-full" />
        )}
      </div>

      {/* Item list breakdown */}
      <div className="space-y-2.5">
        {items.map((item) => {
          const percentage =
            counts.total > 0 ? Math.round((item.count / counts.total) * 100) : 0;
          return (
            <div
              key={item.status}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0 ring-2 ring-white shadow-2xs`} />
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-extrabold text-slate-900">
                  {item.count}
                </span>
                <span className="text-[10px] font-bold text-slate-400 w-9 text-right bg-slate-100 px-1.5 py-0.5 rounded">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TopCustomersCard({
  customers,
}: {
  customers: Array<{
    name: string;
    invoiceCount: number;
    email?: string;
  }>;
}) {
  const maxInvoices = Math.max(...customers.map((c) => c.invoiceCount), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-2xs">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 font-display">
            Pelanggan Teraktif
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          5 Teratas
        </span>
      </div>

      <div className="space-y-4">
        {customers.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-6">
            Belum ada data pelanggan.
          </p>
        ) : (
          customers.slice(0, 5).map((cust, idx) => {
            const pct = Math.round((cust.invoiceCount / maxInvoices) * 100);
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate max-w-[180px]">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {cust.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800 truncate">
                      {cust.name}
                    </span>
                  </div>
                  <span className="text-slate-500 font-bold text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    {cust.invoiceCount} Invoice
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

