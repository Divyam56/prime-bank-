import React, { useState, useMemo } from 'react';
import { 
  Calculator, Percent, Calendar, DollarSign, TrendingUp, 
  Sparkles, ChevronDown, ChevronUp, Check, Info, ArrowRight,
  ShieldCheck, HelpCircle, Landmark, BarChart3, ArrowDownRight, 
  Download, Table, Search, Filter, CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { 
  calculateEMI, 
  EMICalculationMethod, 
  LOAN_PRESETS, 
  LoanPreset 
} from '../utils/emiCalculator';
import { formatINR } from '../utils/formatters';

interface LoanEMICalculatorProps {
  onPreFillApplication?: (amount: number, tenureMonths: number, purpose: string) => void;
  className?: string;
}

export const LoanEMICalculator: React.FC<LoanEMICalculatorProps> = ({
  onPreFillApplication,
  className = ''
}) => {
  // Calculator Parameters
  const [principal, setPrincipal] = useState<number>(200000);
  const [annualRate, setAnnualRate] = useState<number>(9.0);
  const [tenureMonths, setTenureMonths] = useState<number>(24);
  const [calcMethod, setCalcMethod] = useState<EMICalculationMethod>('REDUCING');
  const [selectedPreset, setSelectedPreset] = useState<string>('retail');
  const [chartViewMode, setChartViewMode] = useState<'all' | 'milestones'>('milestones');
  
  // Amortization Table Filters
  const [tableFilterYear, setTableFilterYear] = useState<number | 'ALL'>('ALL');
  const [searchMonth, setSearchMonth] = useState<string>('');

  // Compute EMI and breakdowns reactively
  const calculation = useMemo(() => {
    return calculateEMI(principal, annualRate, tenureMonths, calcMethod);
  }, [principal, annualRate, tenureMonths, calcMethod]);

  // Handle Preset Selection
  const applyPreset = (preset: LoanPreset) => {
    setSelectedPreset(preset.id);
    setPrincipal(preset.defaultPrincipal);
    setTenureMonths(preset.defaultTenure);
    setAnnualRate(preset.defaultRate);
    setTableFilterYear('ALL');
  };

  // Convert tenure months to human readable text
  const tenureDisplay = useMemo(() => {
    const years = Math.floor(tenureMonths / 12);
    const months = tenureMonths % 12;
    if (years === 0) return `${months} Months`;
    if (months === 0) return `${years} ${years === 1 ? 'Year' : 'Years'}`;
    return `${years} ${years === 1 ? 'Yr' : 'Yrs'} ${months} Mos`;
  }, [tenureMonths]);

  // Total years in tenure
  const totalYears = useMemo(() => {
    return Math.ceil(tenureMonths / 12);
  }, [tenureMonths]);

  // Enriched schedule with cumulative interest and repayment progress percentage
  const enrichedSchedule = useMemo(() => {
    let runningInterest = 0;
    return calculation.amortizationSchedule.map(row => {
      runningInterest = Math.round((runningInterest + row.interestPaid) * 100) / 100;
      const repaidPercent = principal > 0 
        ? Math.min(100, Math.max(0, Math.round(((principal - row.closingBalance) / principal) * 1000) / 10))
        : 100;
      const principalShare = row.emi > 0 ? Math.round((row.principalPaid / row.emi) * 100) : 0;
      const interestShare = Math.max(0, 100 - principalShare);
      return {
        ...row,
        cumulativeInterest: runningInterest,
        repaidPercent,
        principalShare,
        interestShare
      };
    });
  }, [calculation.amortizationSchedule, principal]);

  // Filtered rows for the table
  const displayedSchedule = useMemo(() => {
    return enrichedSchedule.filter(row => {
      // Year filter
      if (tableFilterYear !== 'ALL') {
        const rowYear = Math.ceil(row.month / 12);
        if (rowYear !== tableFilterYear) return false;
      }
      // Search filter
      if (searchMonth.trim()) {
        const query = searchMonth.trim().toLowerCase().replace('month', '').replace('m', '').trim();
        if (query && !row.month.toString().includes(query)) return false;
      }
      return true;
    });
  }, [enrichedSchedule, tableFilterYear, searchMonth]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Month',
      'Opening Balance (INR)',
      'Monthly EMI (INR)',
      'Principal Paid (INR)',
      'Interest Paid (INR)',
      'Cumulative Interest (INR)',
      'Closing Balance (INR)',
      'Repaid Percent'
    ];
    const rows = enrichedSchedule.map(r => [
      `Month ${r.month}`,
      r.openingBalance.toFixed(2),
      r.emi.toFixed(2),
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
    link.setAttribute('download', `PrimeBank_Amortization_Schedule_${principal}_${tenureMonths}M.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare chart data for Recharts (Stacked Bar Chart: Principal + Interest)
  const chartData = useMemo(() => {
    const schedule = calculation.amortizationSchedule;
    if (!schedule || schedule.length === 0) return [];

    if (chartViewMode === 'all' || schedule.length <= 15) {
      return schedule.map(row => ({
        label: `M${row.month}`,
        monthNum: row.month,
        principal: row.principalPaid,
        interest: row.interestPaid,
        emi: row.emi,
        closingBalance: row.closingBalance
      }));
    }

    // Milestones mode: sample evenly so chart is clean and readable
    const step = schedule.length > 36 ? 3 : 2;
    const sampled = schedule.filter((row, idx) => {
      return idx === 0 || row.month % step === 0 || idx === schedule.length - 1;
    });

    return sampled.map(row => ({
      label: `M${row.month}`,
      monthNum: row.month,
      principal: row.principalPaid,
      interest: row.interestPaid,
      emi: row.emi,
      closingBalance: row.closingBalance
    }));
  }, [calculation.amortizationSchedule, chartViewMode]);

  // Compute interest decrease stats
  const interestTrendStats = useMemo(() => {
    const schedule = calculation.amortizationSchedule;
    if (!schedule || schedule.length === 0) {
      return { m1Interest: 0, finalInterest: 0, dropPercent: 0 };
    }
    const m1Interest = schedule[0]?.interestPaid || 0;
    const finalInterest = schedule[schedule.length - 1]?.interestPaid || 0;
    const dropPercent = m1Interest > 0 
      ? Math.round(((m1Interest - finalInterest) / m1Interest) * 1000) / 10 
      : 0;
    return { m1Interest, finalInterest, dropPercent };
  }, [calculation.amortizationSchedule]);

  const handleApplyClick = () => {
    if (onPreFillApplication) {
      const presetObj = LOAN_PRESETS.find(p => p.id === selectedPreset);
      const purpose = presetObj ? presetObj.name : 'Personal Finance';
      onPreFillApplication(principal, tenureMonths, purpose);
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0b2545] via-[#13315c] to-[#134074] text-white p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-teal-300 mb-3 border border-white/10">
              <Calculator size={13} />
              <span>Interactive Financial Planning</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Loan EMI & Payment Estimator</h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Calculate exact monthly installments, visualize declining interest portions on the bar chart, and review your complete month-by-month amortization schedule.
            </p>
          </div>

          {/* Quick preset selector buttons */}
          <div className="flex flex-wrap gap-2 md:justify-end items-center">
            {LOAN_PRESETS.map(preset => {
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected 
                      ? 'bg-teal-500 text-slate-950 shadow-md font-bold' 
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  }`}
                  aria-pressed={isSelected}
                >
                  {isSelected && <Check size={12} className="stroke-[3]" />}
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Calculator Grid */}
      <div className="p-6 sm:p-8 grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Sliders & Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Method Selector */}
          <div className="flex items-center justify-between p-1.5 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setCalcMethod('REDUCING')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition text-center cursor-pointer ${
                calcMethod === 'REDUCING'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standard Reducing Balance EMI
            </button>
            <button
              type="button"
              onClick={() => setCalcMethod('FLAT')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition text-center cursor-pointer ${
                calcMethod === 'FLAT'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Flat Rate (PrimeBank Retail 9%)
            </button>
          </div>

          {/* 1. Principal Amount */}
          <div className="space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="emi-principal" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Landmark size={14} className="text-teal-600" />
                <span>Loan Principal Amount</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                <input
                  id="emi-principal"
                  type="number"
                  min={10000}
                  max={5000000}
                  step={5000}
                  value={principal || ''}
                  onChange={e => setPrincipal(Math.max(0, Number(e.target.value)))}
                  className="pl-7 pr-3 py-1.5 w-36 text-right font-mono font-bold text-slate-900 text-sm bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <input
              type="range"
              min={10000}
              max={5000000}
              step={10000}
              value={principal}
              onChange={e => setPrincipal(Number(e.target.value))}
              aria-label="Loan Principal Amount Range"
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 focus:outline-none"
            />

            <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
              <span>₹10,000</span>
              <span className="text-teal-700 font-bold font-mono">{formatINR(principal)}</span>
              <span>₹50,00,000</span>
            </div>

            {/* Quick Increment Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[25000, 50000, 100000, 250000, 500000, 1000000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPrincipal(val)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition cursor-pointer ${
                    principal === val
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  ₹{(val / 1000).toFixed(0)}k{val >= 100000 ? ` (₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L)` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Tenure */}
          <div className="space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="emi-tenure" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-teal-600" />
                <span>Loan Tenure</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="emi-tenure"
                  type="number"
                  min={6}
                  max={60}
                  value={tenureMonths || ''}
                  onChange={e => setTenureMonths(Math.min(60, Math.max(1, Number(e.target.value))))}
                  className="px-3 py-1.5 w-20 text-center font-mono font-bold text-slate-900 text-sm bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-xs font-semibold text-slate-500">Months</span>
              </div>
            </div>

            <input
              type="range"
              min={6}
              max={60}
              step={1}
              value={tenureMonths}
              onChange={e => setTenureMonths(Number(e.target.value))}
              aria-label="Loan Tenure Months Range"
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 focus:outline-none"
            />

            <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
              <span>6 Months</span>
              <span className="text-teal-700 font-bold">{tenureDisplay}</span>
              <span>60 Months (5 Yrs)</span>
            </div>

            {/* Quick Tenure Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[6, 12, 24, 36, 48, 60].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTenureMonths(m)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition cursor-pointer ${
                    tenureMonths === m
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {m >= 12 ? `${m / 12} ${m / 12 === 1 ? 'Year' : 'Years'} (${m}m)` : `${m} Months`}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Interest Rate */}
          <div className="space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="emi-rate" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Percent size={14} className="text-teal-600" />
                <span>Annual Interest Rate (% p.a.)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="emi-rate"
                  type="number"
                  min={4.0}
                  max={24.0}
                  step={0.1}
                  value={annualRate || ''}
                  onChange={e => setAnnualRate(Math.max(0, Number(e.target.value)))}
                  className="px-3 py-1.5 w-20 text-center font-mono font-bold text-slate-900 text-sm bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-xs font-semibold text-slate-500">%</span>
              </div>
            </div>

            <input
              type="range"
              min={5.0}
              max={18.0}
              step={0.25}
              value={annualRate}
              onChange={e => setAnnualRate(Number(e.target.value))}
              aria-label="Annual Interest Rate Percentage Range"
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 focus:outline-none"
            />

            <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
              <span>5.0%</span>
              <span className="text-teal-700 font-bold font-mono">{annualRate.toFixed(2)}% p.a.</span>
              <span>18.0%</span>
            </div>

            {/* Quick Rate Benchmarks */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[8.5, 9.0, 10.5, 12.0].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAnnualRate(r)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition cursor-pointer ${
                    annualRate === r
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {r.toFixed(1)}%{r === 9.0 ? ' (PrimeBank Special)' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Calculations, Graphs & Action (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main EMI Highlight Card */}
          <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
            {/* Background glowing circle */}
            <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                Monthly Repayment
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold text-teal-200 border border-white/10">
                {calcMethod === 'REDUCING' ? 'Reducing Balance' : 'Flat 9% Rate'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white">
                {formatINR(calculation.monthlyEMI)}
              </div>
              <p className="text-xs text-teal-200/80">Equated Monthly Installment for {tenureMonths} installments</p>
            </div>

            <hr className="my-6 border-white/15" />

            {/* Breakdown Figures */}
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Principal Loan Amount</span>
                <span className="font-mono font-bold text-white text-sm">{formatINR(calculation.principal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-300 flex items-center gap-1">
                  <span>Total Interest Payable</span>
                </span>
                <span className="font-mono font-bold text-amber-300 text-sm">+{formatINR(calculation.totalInterest)}</span>
              </div>
              <div className="pt-2 border-t border-white/15 flex justify-between items-center text-sm">
                <span className="font-bold text-teal-100">Total Amount Payable</span>
                <span className="font-mono font-extrabold text-teal-200 text-base">{formatINR(calculation.totalPayable)}</span>
              </div>
            </div>

            {/* Proportion Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-[11px] text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-teal-400 inline-block" />
                  Principal ({calculation.principalSharePercent}%)
                </span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                  Interest ({calculation.interestSharePercent}%)
                </span>
              </div>
              <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden flex p-0.5 border border-white/10">
                <div 
                  className="h-full bg-teal-400 rounded-l-full transition-all duration-300" 
                  style={{ width: `${calculation.principalSharePercent}%` }} 
                />
                <div 
                  className="h-full bg-amber-400 rounded-r-full transition-all duration-300" 
                  style={{ width: `${calculation.interestSharePercent}%` }} 
                />
              </div>
            </div>

            {/* Pre-fill Action */}
            <div className="mt-7">
              <button
                type="button"
                onClick={handleApplyClick}
                className="w-full py-3.5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <span>Apply with this Calculation</span>
                <ArrowRight size={16} />
              </button>
              <p className="text-[11px] text-center text-teal-200/70 mt-2">
                Transfers these estimated figures into the loan application form below.
              </p>
            </div>
          </div>

          {/* Key Advantages Card */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-teal-600" />
              <span>PrimeBank Retail Loan Benefits</span>
            </h4>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <Check size={14} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <span>Zero foreclosure or prepayment penalty after 6 installments.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <span>Instant paperless disbursement directly into your PrimeBank savings account.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <span>Transparent interest calculation with zero hidden documentation fees.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recharts Stacked Bar Chart Visualizing Decreasing Interest in EMI */}
      <div className="border-t border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-700 border border-amber-200/60">
                <BarChart3 size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Monthly EMI Composition: Decreasing Interest vs. Increasing Principal
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Every month you make the same fixed EMI payment, but watch how the <span className="font-semibold text-amber-700">interest component (amber)</span> shrinks while the <span className="font-semibold text-teal-700">principal component (teal)</span> grows to build equity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setChartViewMode('milestones')}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  chartViewMode === 'milestones'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Milestones
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  chartViewMode === 'all'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All {tenureMonths} Mos
              </button>
            </div>
          </div>
        </div>

        {/* Insight Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Month 1 Interest</div>
            <div className="text-lg font-bold font-mono text-amber-600 mt-0.5">
              {formatINR(interestTrendStats.m1Interest)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Peak interest share of EMI</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Final Month Interest</div>
            <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
              {formatINR(interestTrendStats.finalInterest)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Near-zero interest liability</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownRight size={13} className="text-teal-600" />
              <span>Interest Reduction</span>
            </div>
            <div className="text-lg font-bold text-teal-700 mt-0.5">
              {calcMethod === 'REDUCING' ? `${interestTrendStats.dropPercent}% drop` : 'Flat Rate (constant)'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {calcMethod === 'REDUCING' ? 'Over the loan tenure' : '9.0% simple annual spread'}
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm mb-8">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tickFormatter={(val: number) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip 
                  formatter={(value: any, name: any) => {
                    const num = typeof value === 'number' ? value : Number(value);
                    const formatted = formatINR(num);
                    if (name === 'principal') return [formatted, 'Principal Paid (Equity)'];
                    if (name === 'interest') return [formatted, 'Interest Cost'];
                    return [formatted, name];
                  }}
                  labelFormatter={(label) => `Instalment: ${label}`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
                  }}
                  itemStyle={{ padding: '2px 0' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value: string) => {
                    if (value === 'principal') {
                      return <span className="text-xs font-semibold text-slate-700">Principal Portion (Increasing)</span>;
                    }
                    if (value === 'interest') {
                      return <span className="text-xs font-semibold text-amber-700">Interest Portion (Decreasing)</span>;
                    }
                    return value;
                  }}
                />
                {/* Stacked bars: Principal (Teal) + Interest (Amber) */}
                <Bar 
                  dataKey="principal" 
                  stackId="emi" 
                  fill="#0d9488" 
                  radius={[0, 0, 4, 4]} 
                  name="principal"
                />
                <Bar 
                  dataKey="interest" 
                  stackId="emi" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]} 
                  name="interest"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-center text-slate-500 mt-3">
            Each bar represents total monthly EMI ({formatINR(calculation.monthlyEMI)}). Hover over any month to inspect exact principal vs. interest breakdown and remaining balance.
          </p>
        </div>

        {/* DETAILED MONTHLY AMORTIZATION BREAKDOWN TABLE (Below the bar chart) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
          {/* Table Header & Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-50 rounded-lg text-teal-700 border border-teal-200/60">
                  <Table size={16} />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Monthly Amortization Schedule & Payment Ledger
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Detailed month-by-month principal reduction, interest deduction, and remaining loan balance across all {tenureMonths} installments.
              </p>
            </div>

            {/* Actions: Export CSV & Year filter */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
                title="Download amortization schedule as CSV"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>

              {/* Year filter buttons */}
              {totalYears > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setTableFilterYear('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      tableFilterYear === 'ALL'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({tenureMonths}m)
                  </button>
                  {Array.from({ length: totalYears }).map((_, idx) => {
                    const yr = idx + 1;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setTableFilterYear(yr)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                          tableFilterYear === yr
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
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

          {/* Quick Metrics Header Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Total Installments</span>
              <div className="font-bold text-slate-900 font-mono mt-0.5">{tenureMonths} Monthly Payments</div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Principal Repaid</span>
              <div className="font-bold text-teal-700 font-mono mt-0.5">{formatINR(calculation.principal)}</div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Total Interest Incurred</span>
              <div className="font-bold text-amber-700 font-mono mt-0.5">{formatINR(calculation.totalInterest)}</div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Total Borrowing Outflow</span>
              <div className="font-bold text-slate-900 font-mono mt-0.5">{formatINR(calculation.totalPayable)}</div>
            </div>
          </div>

          {/* Filter / Search input */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-48">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Jump to month #..."
                value={searchMonth}
                onChange={e => setSearchMonth(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-800">{displayedSchedule.length}</span> of {tenureMonths} installments
            </div>
          </div>

          {/* Amortization Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-inner max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 uppercase tracking-wider text-[10px] z-10 backdrop-blur-sm shadow-sm">
                <tr>
                  <th className="py-3 px-3.5 border-b border-slate-200">Instalment</th>
                  <th className="py-3 px-3.5 border-b border-slate-200">Opening Balance</th>
                  <th className="py-3 px-3.5 border-b border-slate-200">Monthly EMI</th>
                  <th className="py-3 px-3.5 border-b border-slate-200 text-teal-800 bg-teal-50/50">Principal Paid</th>
                  <th className="py-3 px-3.5 border-b border-slate-200 text-amber-800 bg-amber-50/50">Interest Paid</th>
                  <th className="py-3 px-3.5 border-b border-slate-200">Cumulative Interest</th>
                  <th className="py-3 px-3.5 border-b border-slate-200 text-right">Closing Balance</th>
                  <th className="py-3 px-3.5 border-b border-slate-200 text-center">Loan Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {displayedSchedule.map(row => (
                  <tr key={row.month} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3.5 font-sans font-bold text-slate-900">
                      Month {row.month}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600">
                      {formatINR(row.openingBalance)}
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">
                      {formatINR(row.emi)}
                    </td>
                    <td className="py-2.5 px-3.5 text-teal-700 font-bold bg-teal-50/20">
                      <span>{formatINR(row.principalPaid)}</span>
                      <span className="text-[10px] text-teal-600 font-sans ml-1">({row.principalShare}%)</span>
                    </td>
                    <td className="py-2.5 px-3.5 text-amber-700 font-semibold bg-amber-50/20">
                      <span>{formatINR(row.interestPaid)}</span>
                      <span className="text-[10px] text-amber-600 font-sans ml-1">({row.interestShare}%)</span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500">
                      {formatINR(row.cumulativeInterest)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-slate-900">
                      {formatINR(row.closingBalance)}
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-teal-500 rounded-full" 
                            style={{ width: `${row.repaidPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 min-w-8 text-right">
                          {row.repaidPercent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {displayedSchedule.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                      No installments match your filter.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-mono text-xs font-bold text-slate-900 border-t border-slate-200 sticky bottom-0 z-10">
                <tr>
                  <td className="py-3 px-3.5 font-sans">Total Repayment</td>
                  <td className="py-3 px-3.5 text-slate-400">-</td>
                  <td className="py-3 px-3.5">{formatINR(calculation.totalPayable)}</td>
                  <td className="py-3 px-3.5 text-teal-700">{formatINR(calculation.principal)}</td>
                  <td className="py-3 px-3.5 text-amber-700">{formatINR(calculation.totalInterest)}</td>
                  <td className="py-3 px-3.5">{formatINR(calculation.totalInterest)}</td>
                  <td className="py-3 px-3.5 text-right text-emerald-600 font-bold">₹0.00</td>
                  <td className="py-3 px-3.5 text-center font-sans text-teal-700">100% Repaid</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Scroll vertically within the table to review all months or use the Year filters above.</span>
            <span>Accrual methodology: {calcMethod === 'REDUCING' ? 'Daily Reducing Balance' : 'Simple Flat Rate'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
