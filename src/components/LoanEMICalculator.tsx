import React, { useState, useMemo } from 'react';
import { 
  Calculator, Percent, Calendar, DollarSign, TrendingUp, 
  Sparkles, ChevronDown, ChevronUp, Check, Info, ArrowRight,
  ShieldCheck, HelpCircle, Landmark
} from 'lucide-react';
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
  const [showAmortization, setShowAmortization] = useState<boolean>(false);
  const [amortizationMonthsToShow, setAmortizationMonthsToShow] = useState<number>(12);

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
  };

  // Convert tenure months to human readable text
  const tenureDisplay = useMemo(() => {
    const years = Math.floor(tenureMonths / 12);
    const months = tenureMonths % 12;
    if (years === 0) return `${months} Months`;
    if (months === 0) return `${years} ${years === 1 ? 'Year' : 'Years'}`;
    return `${years} ${years === 1 ? 'Yr' : 'Yrs'} ${months} Mos`;
  }, [tenureMonths]);

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
              Calculate exact monthly installments, interest liability, and complete principal amortization schedules before submitting your application.
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

      {/* Expandable Amortization Schedule Drawer */}
      <div className="border-t border-slate-200 bg-slate-50/60 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-teal-600" />
              <span>Amortization Repayment Schedule</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect month-by-month principal vs interest deduction across the loan lifecycle.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAmortization(!showAmortization)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 text-xs transition shadow-sm cursor-pointer"
          >
            <span>{showAmortization ? 'Hide Schedule' : 'View Full Schedule'}</span>
            {showAmortization ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showAmortization && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Showing {Math.min(amortizationMonthsToShow, calculation.amortizationSchedule.length)} of {calculation.amortizationSchedule.length} months</span>
              {calculation.amortizationSchedule.length > 12 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAmortizationMonthsToShow(12)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${amortizationMonthsToShow === 12 ? 'bg-teal-600 text-white' : 'bg-white border text-slate-600'}`}
                  >
                    First 12 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmortizationMonthsToShow(calculation.amortizationSchedule.length)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${amortizationMonthsToShow > 12 ? 'bg-teal-600 text-white' : 'bg-white border text-slate-600'}`}
                  >
                    All {calculation.amortizationSchedule.length} Months
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Month</th>
                    <th className="py-2.5 px-3">Opening Balance</th>
                    <th className="py-2.5 px-3">EMI Payment</th>
                    <th className="py-2.5 px-3">Principal Paid</th>
                    <th className="py-2.5 px-3">Interest Paid</th>
                    <th className="py-2.5 px-3 text-right">Closing Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {calculation.amortizationSchedule.slice(0, amortizationMonthsToShow).map(row => (
                    <tr key={row.month} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-sans font-semibold text-slate-800">Month {row.month}</td>
                      <td className="py-2 px-3 text-slate-600">{formatINR(row.openingBalance)}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{formatINR(row.emi)}</td>
                      <td className="py-2 px-3 text-teal-700 font-semibold">{formatINR(row.principalPaid)}</td>
                      <td className="py-2 px-3 text-amber-700">{formatINR(row.interestPaid)}</td>
                      <td className="py-2 px-3 text-right text-slate-800 font-bold">{formatINR(row.closingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
