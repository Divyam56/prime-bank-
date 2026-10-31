import React, { useState, useMemo } from 'react';
import { 
  X, Calendar, Landmark, Percent, DollarSign, TrendingUp, 
  Download, Clock, CheckCircle2, XCircle, Check, Search, 
  Shield, FileText, ArrowRight, ArrowDownRight, Layers, Table
} from 'lucide-react';
import { Loan } from '../types';
import { formatINR } from '../utils/formatters';
import { getLoanAmortizationDetails } from '../utils/loanAmortization';
import { EMICalculationMethod } from '../utils/emiCalculator';

interface LoanDetailsModalProps {
  loan: Loan | null;
  onClose: () => void;
  onRepay?: (loan: Loan) => void;
}

export const LoanDetailsModal: React.FC<LoanDetailsModalProps> = ({
  loan,
  onClose,
  onRepay
}) => {
  if (!loan) return null;

  const [method, setMethod] = useState<EMICalculationMethod>('FLAT');
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate Amortization details for this loan
  const details = useMemo(() => {
    return getLoanAmortizationDetails(loan, 9.0, method);
  }, [loan, method]);

  const totalYears = useMemo(() => {
    return Math.ceil(loan.termMonths / 12);
  }, [loan.termMonths]);

  // Filtered rows for schedule table
  const displayedSchedule = useMemo(() => {
    return details.schedule.filter(row => {
      if (selectedYear !== 'ALL') {
        const rowYear = Math.ceil(row.month / 12);
        if (rowYear !== selectedYear) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase().replace('month', '').replace('m', '').trim();
        if (q && !row.month.toString().includes(q)) return false;
      }
      return true;
    });
  }, [details.schedule, selectedYear, searchQuery]);

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      'Month',
      'Opening Balance (INR)',
      'Payment (INR)',
      'Principal Paid (INR)',
      'Interest Incurred (INR)',
      'Cumulative Interest (INR)',
      'Closing Balance (INR)',
      'Repaid Percent'
    ];
    const rows = details.schedule.map(r => [
      `Month ${r.month}`,
      r.openingBalance.toFixed(2),
      r.payment.toFixed(2),
      r.principalPaid.toFixed(2),
      r.interestPaid.toFixed(2),
      r.cumulativeInterest.toFixed(2),
      r.closingBalance.toFixed(2),
      `${r.repaidPercent}%`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PrimeBank_Loan_${loan.id}_Amortization_Schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0b2545] via-[#13315c] to-[#134074] text-white p-6 sm:p-7 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            aria-label="Close loan details modal"
          >
            <X size={18} />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white/15 text-teal-300 border border-white/10">
              Loan #{loan.id}
            </span>
            <span className="text-xs text-slate-300">
              Applied on {loan.createdAt}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {loan.purpose}
              </h3>
              <p className="text-xs text-teal-200/90 mt-1 flex items-center gap-2">
                <span>Personal & Retail Credit Facility</span>
                <span>•</span>
                <span>Fixed 9.0% p.a. standard rate</span>
              </p>
            </div>

            {/* Status indicator badge */}
            <div>
              {loan.status === 'REQUESTED' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <Clock size={13} />
                  <span>Pending Approval</span>
                </span>
              )}
              {loan.status === 'APPROVED' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <CheckCircle2 size={13} />
                  <span>Active & Approved</span>
                </span>
              )}
              {loan.status === 'REJECTED' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-200 border border-rose-400/30">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <XCircle size={13} />
                  <span>Application Declined</span>
                </span>
              )}
              {loan.status === 'REPAID' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  <Check size={13} />
                  <span>Fully Repaid</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key Loan Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Principal Borrowed
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {formatINR(loan.amount)}
              </div>
              <div className="text-[11px] text-teal-700 font-medium mt-0.5">Disbursed amount</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Loan Tenure
              </span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {loan.termMonths} Months
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {(loan.termMonths / 12).toFixed(loan.termMonths % 12 === 0 ? 0 : 1)} {loan.termMonths === 12 ? 'Year' : 'Years'}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Monthly Installment
              </span>
              <div className="text-xl font-bold font-mono text-teal-700 mt-1">
                {formatINR(details.monthlyPayment)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Per month for {loan.termMonths} mos</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Payoff
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {formatINR(details.totalPayable)}
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                +{formatINR(details.totalInterest)} total interest
              </div>
            </div>
          </div>

          {/* Equity & Principal vs Interest Breakdown Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-500 inline-block" />
                <span>Principal Share ({details.principalSharePercent}%)</span>
              </span>
              <span className="text-amber-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                <span>Interest Share ({details.interestSharePercent}%)</span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
              <div 
                className="bg-teal-600 h-full transition-all" 
                style={{ width: `${details.principalSharePercent}%` }} 
              />
              <div 
                className="bg-amber-500 h-full transition-all" 
                style={{ width: `${details.interestSharePercent}%` }} 
              />
            </div>
          </div>

          {/* Schedule Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Table size={16} className="text-teal-600" />
                <span>Monthly Amortization Schedule</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed month-by-month principal and interest breakdown over the entire {loan.termMonths}-month tenure.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Method Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setMethod('FLAT')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    method === 'FLAT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Flat 9%
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('REDUCING')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    method === 'REDUCING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Reducing EMI
                </button>
              </div>

              {/* CSV Export */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
                title="Download amortization table"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>

              {/* Year Filters */}
              {totalYears > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedYear('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      selectedYear === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  {Array.from({ length: totalYears }).map((_, idx) => {
                    const yr = idx + 1;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setSelectedYear(yr)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                          selectedYear === yr ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Yr {yr}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Search and Row count */}
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
            <div className="relative w-44">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Jump to month..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <span>
              Showing {displayedSchedule.length} of {loan.termMonths} installments
            </span>
          </div>

          {/* Monthly Amortization Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-inner max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/95 text-slate-700 font-bold sticky top-0 uppercase tracking-wider text-[10px] z-10 backdrop-blur-sm shadow-xs">
                <tr>
                  <th className="py-2.5 px-3 border-b border-slate-200">Month</th>
                  <th className="py-2.5 px-3 border-b border-slate-200">Opening Balance</th>
                  <th className="py-2.5 px-3 border-b border-slate-200">Installment</th>
                  <th className="py-2.5 px-3 border-b border-slate-200 text-teal-800 bg-teal-50/50">Principal Paid</th>
                  <th className="py-2.5 px-3 border-b border-slate-200 text-amber-800 bg-amber-50/50">Interest Paid</th>
                  <th className="py-2.5 px-3 border-b border-slate-200">Total Interest to Date</th>
                  <th className="py-2.5 px-3 border-b border-slate-200 text-right">Closing Balance</th>
                  <th className="py-2.5 px-3 border-b border-slate-200 text-center">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {displayedSchedule.map(row => (
                  <tr key={row.month} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-sans font-bold text-slate-900">
                      Month {row.month}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {formatINR(row.openingBalance)}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {formatINR(row.payment)}
                    </td>
                    <td className="py-2 px-3 text-teal-700 font-bold bg-teal-50/20">
                      <span>{formatINR(row.principalPaid)}</span>
                      <span className="text-[10px] text-teal-600 font-sans ml-1">({row.principalSharePercent}%)</span>
                    </td>
                    <td className="py-2 px-3 text-amber-700 font-semibold bg-amber-50/20">
                      <span>{formatINR(row.interestPaid)}</span>
                      <span className="text-[10px] text-amber-600 font-sans ml-1">({row.interestSharePercent}%)</span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      {formatINR(row.cumulativeInterest)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {formatINR(row.closingBalance)}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-10 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-teal-500 rounded-full" 
                            style={{ width: `${row.repaidPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 min-w-7 text-right">
                          {row.repaidPercent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {displayedSchedule.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 font-sans">
                      No installments match your filter.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-mono text-xs font-bold text-slate-900 border-t border-slate-200 sticky bottom-0 z-10">
                <tr>
                  <td className="py-2.5 px-3 font-sans">Totals</td>
                  <td className="py-2.5 px-3 text-slate-400">-</td>
                  <td className="py-2.5 px-3">{formatINR(details.totalPayable)}</td>
                  <td className="py-2.5 px-3 text-teal-700">{formatINR(details.principal)}</td>
                  <td className="py-2.5 px-3 text-amber-700">{formatINR(details.totalInterest)}</td>
                  <td className="py-2.5 px-3">{formatINR(details.totalInterest)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">₹0.00</td>
                  <td className="py-2.5 px-3 text-center font-sans text-teal-700">100% Repaid</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            {loan.status === 'APPROVED' && (
              <span className="text-emerald-700 font-medium flex items-center gap-1.5 justify-center sm:justify-start">
                <CheckCircle2 size={14} />
                <span>Active loan: You can repay early anytime with ₹0 foreclosure penalties.</span>
              </span>
            )}
            {loan.status === 'REQUESTED' && (
              <span className="text-amber-700 font-medium flex items-center gap-1.5 justify-center sm:justify-start">
                <Clock size={14} />
                <span>Pending underwriter review: Decision typically processed within 2 working days.</span>
              </span>
            )}
            {loan.status === 'REJECTED' && (
              <span className="text-rose-700 font-medium flex items-center gap-1.5 justify-center sm:justify-start">
                <XCircle size={14} />
                <span>Application closed: Contact your PrimeBank relationship manager for appeal options.</span>
              </span>
            )}
            {loan.status === 'REPAID' && (
              <span className="text-slate-600 font-medium flex items-center gap-1.5 justify-center sm:justify-start">
                <Check size={14} />
                <span>Loan settled in full: No further installments or interest liability remain.</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              Close
            </button>
            {loan.status === 'APPROVED' && onRepay && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRepay(loan);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Repay this Loan Now</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
