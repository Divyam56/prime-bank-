import React, { useState, useEffect } from 'react';
import { 
  Building2, Shield, ArrowRightLeft, History, Landmark, 
  UserCheck, Settings, LogOut, Menu, X, ArrowUpRight, 
  ArrowDownLeft, AlertCircle, CheckCircle2, DollarSign,
  TrendingUp, Users, FileText, Download, Phone, Mail, MapPin,
  Lock, Key, Wallet, Plus, Trash2, Edit3, ChevronRight, RefreshCw,
  Clock, XCircle, Check
} from 'lucide-react';

import { 
  User, Account, Transaction, Loan, Investment, SystemSettings, FlashNotification 
} from './types';
import { 
  INITIAL_SYSTEM_SETTINGS, INITIAL_USERS, INITIAL_ACCOUNTS, 
  INITIAL_TRANSACTIONS, INITIAL_LOANS, INITIAL_INVESTMENTS 
} from './data/initialData';
import { LoanEMICalculator } from './components/LoanEMICalculator';
import { LoanDetailsModal } from './components/LoanDetailsModal';
import { exportTransactionHistoryPDF } from './utils/statementPdfExport';

export default function App() {
  // Demo Session & Routing State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [flash, setFlash] = useState<FlashNotification | null>(null);
  
  // Banking Ledger & System State
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS);
  const [investments, setInvestments] = useState<Investment[]>(INITIAL_INVESTMENTS);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Transfer form
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  // History Filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyType, setHistoryType] = useState('ALL');
  const [historyStatus, setHistoryStatus] = useState('ALL');

  // Services form
  const [investPlan, setInvestPlan] = useState('Fixed Deposit · 12 months');
  const [investAmount, setInvestAmount] = useState('25000');
  const [loanAmount, setLoanAmount] = useState('50000');
  const [loanTerm, setLoanTerm] = useState('12');
  const [loanPurpose, setLoanPurpose] = useState('Business expansion');

  // Repay loan modal state
  const [repayingLoan, setRepayingLoan] = useState<Loan | null>(null);
  const [repayAccountId, setRepayAccountId] = useState<number | null>(null);
  const [repayStep, setRepayStep] = useState<1 | 2>(1);
  const [selectedLoanForDetails, setSelectedLoanForDetails] = useState<Loan | null>(null);

  // Admin user form
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [adminUserName, setAdminUserName] = useState('');
  const [adminUserEmail, setAdminUserEmail] = useState('');
  const [adminUserPhone, setAdminUserPhone] = useState('');
  const [adminUserRole, setAdminUserRole] = useState<'ADMIN' | 'CUSTOMER'>('CUSTOMER');
  const [adminUserStatus, setAdminUserStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');

  // Admin settings form
  const [formFee, setFormFee] = useState(settings.transfer_fee_percent.toString());
  const [formMinTransfer, setFormMinTransfer] = useState(settings.min_transfer_amount.toString());
  const [formMaintenance, setFormMaintenance] = useState(settings.maintenance_mode ? 'true' : 'false');
  const [formPhone, setFormPhone] = useState(settings.support_phone);

  // Auto-dismiss flash
  useEffect(() => {
    if (flash) {
      const timer = setTimeout(() => setFlash(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  // Navigate helper
  const navigate = (path: string) => {
    setCurrentPath(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
    if (!user) {
      setFlash({ type: 'error', message: 'Incorrect email or password.' });
      return;
    }
    if (user.status === 'SUSPENDED') {
      setFlash({ type: 'error', message: 'This account is suspended. Please contact support.' });
      return;
    }
    // Check demo password convention
    if (loginPassword.length < 4) {
      setFlash({ type: 'error', message: 'Incorrect email or password.' });
      return;
    }

    setCurrentUser(user);
    setFlash({ type: 'success', message: `Welcome back, ${user.fullName}!` });
    if (user.role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleDemoLogin = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setFlash({ type: 'success', message: `Welcome back, ${user.fullName}!` });
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regName.trim().length < 3) {
      setFlash({ type: 'error', message: 'Full name must be at least 3 characters.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setFlash({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    if (users.some(u => u.email.toLowerCase() === regEmail.trim().toLowerCase())) {
      setFlash({ type: 'error', message: 'Email address is already registered.' });
      return;
    }
    if (regPhone.trim().length < 7) {
      setFlash({ type: 'error', message: 'Phone number must be at least 7 characters.' });
      return;
    }
    if (regPassword.length < 8) {
      setFlash({ type: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }

    const newUserId = users.length + 1;
    const newUser: User = {
      id: newUserId,
      fullName: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      phone: regPhone.trim(),
      role: 'CUSTOMER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const newAccNum = "SB" + (100000 + (newUserId * 7) % 900000);
    const newAccount: Account = {
      id: 100 + newUserId,
      userId: newUserId,
      accountNumber: newAccNum,
      accountType: 'SAVINGS',
      balance: 1000.00,
      createdAt: new Date().toISOString().substring(0, 10)
    };

    setUsers([...users, newUser]);
    setAccounts([...accounts, newAccount]);
    setCurrentUser(newUser);
    setFlash({ type: 'success', message: `Welcome to PrimeBank, ${newUser.fullName}! Your savings account is ready with ₹1,000 welcome balance.` });
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setFlash({ type: 'success', message: 'You have been successfully signed out.' });
    navigate('/');
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.maintenance_mode) {
      setFlash({ type: 'error', message: 'Transfers are temporarily disabled for scheduled maintenance.' });
      return;
    }

    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt < settings.min_transfer_amount) {
      setFlash({ type: 'error', message: `Minimum transfer amount is ₹${settings.min_transfer_amount}.` });
      return;
    }

    const fromAcc = accounts.find(a => a.accountNumber === transferFrom);
    if (!fromAcc) {
      setFlash({ type: 'error', message: 'Please select a valid source account.' });
      return;
    }

    const targetNum = transferTo.trim().toUpperCase();
    const toAcc = accounts.find(a => a.accountNumber === targetNum);
    if (!toAcc) {
      setFlash({ type: 'error', message: `Recipient account ${targetNum} not found.` });
      return;
    }

    if (fromAcc.accountNumber === toAcc.accountNumber) {
      setFlash({ type: 'error', message: 'Cannot transfer funds to the same account.' });
      return;
    }

    const fee = Math.round((amt * settings.transfer_fee_percent / 100) * 100) / 100;
    const totalDebit = amt + fee;

    const minBal = fromAcc.accountType === 'SAVINGS' ? 500 : -10000;
    if (fromAcc.balance - totalDebit < minBal) {
      setFlash({ type: 'error', message: `Insufficient balance: ₹${totalDebit.toFixed(2)} required (incl. ₹${fee.toFixed(2)} transfer fee).` });
      return;
    }

    // Execute transfer
    const updatedAccounts = accounts.map(a => {
      if (a.id === fromAcc.id) return { ...a, balance: a.balance - totalDebit };
      if (a.id === toAcc.id) return { ...a, balance: a.balance + amt };
      return a;
    });

    const newTxnRef = `TXN-${Date.now().toString().slice(-9)}`;
    const newTxn: Transaction = {
      id: Date.now(),
      reference: newTxnRef,
      fromAccountId: fromAcc.id,
      toAccountId: toAcc.id,
      amount: amt,
      type: 'TRANSFER',
      status: 'COMPLETED',
      description: transferNote.trim() || `Transfer to ${toAcc.accountNumber}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setAccounts(updatedAccounts);
    setTransactions([newTxn, ...transactions]);
    setTransferAmount('');
    setTransferNote('');
    setFlash({ type: 'success', message: `Transfer successful! ₹${amt.toFixed(2)} has been sent to account ${toAcc.accountNumber}.` });
    navigate('/dashboard');
  };

  const handleApplyLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(loanAmount);
    const term = parseInt(loanTerm);
    if (isNaN(amt) || amt < 10000 || amt > 5000000) {
      setFlash({ type: 'error', message: 'Loan amount must be between ₹10,000 and ₹50,00,000.' });
      return;
    }
    if (isNaN(term) || term < 6 || term > 60) {
      setFlash({ type: 'error', message: 'Tenure must be between 6 and 60 months.' });
      return;
    }
    if (loanPurpose.trim().length < 5) {
      setFlash({ type: 'error', message: 'Loan purpose must be at least 5 characters.' });
      return;
    }

    const newLoan: Loan = {
      id: Date.now(),
      userId: currentUser!.id,
      userName: currentUser!.fullName,
      amount: amt,
      termMonths: term,
      purpose: loanPurpose.trim(),
      status: 'REQUESTED',
      createdAt: new Date().toISOString().substring(0, 10)
    };

    setLoans([newLoan, ...loans]);
    setFlash({ type: 'success', message: `Loan request submitted! Our team will review ₹${amt.toLocaleString()} within 2 working days.` });
  };

  const handlePreFillLoan = (amount: number, tenureMonths: number, purpose: string) => {
    setLoanAmount(amount.toString());
    setLoanTerm(tenureMonths.toString());
    setLoanPurpose(purpose);
    setFlash({
      type: 'success',
      message: `Loan details pre-filled from your EMI calculation (₹${amount.toLocaleString('en-IN')} for ${tenureMonths} months). Complete and submit below!`
    });
    setTimeout(() => {
      const el = document.getElementById('loan-application-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const handleConfirmRepay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayingLoan || !repayAccountId) return;

    const sourceAcc = accounts.find(a => a.id === repayAccountId);
    if (!sourceAcc) {
      setFlash({ type: 'error', message: 'Please select an account for repayment.' });
      return;
    }

    const payoffAmount = Math.round((repayingLoan.amount * (1 + 0.09 * repayingLoan.termMonths / 12)) * 100) / 100;
    const minBal = sourceAcc.accountType === 'SAVINGS' ? 500 : -10000;

    if (sourceAcc.balance - payoffAmount < minBal) {
      setFlash({
        type: 'error',
        message: `Insufficient balance in ${sourceAcc.accountNumber}: ₹${payoffAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} required.`
      });
      return;
    }

    // Deduct balance from chosen account
    setAccounts(accounts.map(a => a.id === sourceAcc.id ? { ...a, balance: a.balance - payoffAmount } : a));

    // Update loan status to REPAID
    setLoans(loans.map(l => l.id === repayingLoan.id ? { ...l, status: 'REPAID' } : l));

    // Record repayment transaction
    const newTxnRef = `TXN-${Date.now().toString().slice(-9)}`;
    const newTxn: Transaction = {
      id: Date.now(),
      reference: newTxnRef,
      fromAccountId: sourceAcc.id,
      toAccountId: null,
      amount: payoffAmount,
      type: 'WITHDRAWAL',
      status: 'COMPLETED',
      description: `Loan repayment: ${repayingLoan.purpose} (#${repayingLoan.id})`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setTransactions([newTxn, ...transactions]);

    const loanPurposeName = repayingLoan.purpose;
    const loanIdNum = repayingLoan.id;
    setRepayingLoan(null);
    setFlash({
      type: 'success',
      message: `Loan #${loanIdNum} (${loanPurposeName}) successfully repaid! ₹${payoffAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} deducted from account ${sourceAcc.accountNumber}.`
    });
  };

  const handleStartInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(investAmount);
    let min = 1000;
    if (investPlan.includes('Fixed Deposit')) min = 25000;
    if (investPlan.includes('Senior Citizen')) min = 50000;

    if (isNaN(amt) || amt < min) {
      setFlash({ type: 'error', message: `Minimum investment for ${investPlan} is ₹${min.toLocaleString()}.` });
      return;
    }

    const newInv: Investment = {
      id: Date.now(),
      userId: currentUser!.id,
      planName: investPlan,
      amount: amt,
      createdAt: new Date().toISOString().substring(0, 10)
    };

    setInvestments([newInv, ...investments]);
    setFlash({ type: 'success', message: `Congratulations! Investment of ₹${amt.toLocaleString()} in ${investPlan} started.` });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const fee = parseFloat(formFee);
    if (isNaN(fee) || fee < 0 || fee > 5) {
      setFlash({ type: 'error', message: 'transfer_fee_percent must be a number between 0 and 5.' });
      return;
    }
    const minAmt = parseFloat(formMinTransfer);
    if (isNaN(minAmt) || minAmt < 0) {
      setFlash({ type: 'error', message: 'min_transfer_amount must be a valid positive number.' });
      return;
    }

    setSettings({
      transfer_fee_percent: fee,
      min_transfer_amount: minAmt,
      maintenance_mode: formMaintenance === 'true',
      support_phone: formPhone.trim()
    });
    setFlash({ type: 'success', message: 'System settings updated successfully.' });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUserName.trim().length < 3) {
      setFlash({ type: 'error', message: 'User name must be at least 3 characters.' });
      return;
    }
    if (!adminUserEmail.includes('@')) {
      setFlash({ type: 'error', message: 'Valid email required.' });
      return;
    }

    if (editingUserId) {
      setUsers(users.map(u => u.id === editingUserId ? {
        ...u,
        fullName: adminUserName.trim(),
        email: adminUserEmail.trim().toLowerCase(),
        phone: adminUserPhone.trim(),
        role: adminUserRole,
        status: adminUserStatus
      } : u));
      setFlash({ type: 'success', message: `User ${adminUserName} updated successfully.` });
      setEditingUserId(null);
    } else {
      const newId = users.length + 1;
      const newUser: User = {
        id: newId,
        fullName: adminUserName.trim(),
        email: adminUserEmail.trim().toLowerCase(),
        phone: adminUserPhone.trim(),
        role: adminUserRole,
        status: adminUserStatus,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setUsers([...users, newUser]);
      setFlash({ type: 'success', message: `User ${newUser.fullName} created (temporary password: Welcome@123).` });
    }
    setAdminUserName('');
    setAdminUserEmail('');
    setAdminUserPhone('');
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.role === 'ADMIN' && adminCount <= 1) {
      setFlash({ type: 'error', message: 'Cannot delete the last administrator.' });
      return;
    }
    if (confirm(`Delete user ${userName} and all their accounts? This cannot be undone.`)) {
      setAccounts(accounts.filter(a => a.userId !== userId));
      setUsers(users.filter(u => u.id !== userId));
      setFlash({ type: 'success', message: `User #${userId} and their accounts were deleted.` });
    }
  };

  // Helper for user accounts
  const userAccounts = currentUser ? accounts.filter(a => a.userId === currentUser.id) : [];
  const userAccountIds = new Set(userAccounts.map(a => a.id));

  const userTransactions = transactions.filter(t => 
    (t.fromAccountId && userAccountIds.has(t.fromAccountId)) || 
    (t.toAccountId && userAccountIds.has(t.toAccountId))
  );

  const getAccountDisplay = (accId: number | null) => {
    if (!accId) return '—';
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.accountNumber : `#${accId}`;
  };

  // CSV export for admin
  const handleExportCSV = () => {
    const headers = ['reference', 'from_account', 'to_account', 'amount', 'type', 'status', 'description', 'created_at'];
    const rows = transactions.map(t => [
      t.reference,
      getAccountDisplay(t.fromAccountId),
      getAccountDisplay(t.toAccountId),
      t.amount.toFixed(2),
      t.type,
      t.status,
      `"${t.description.replace(/"/g, '""')}"`,
      t.createdAt
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "primebank-transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF statement export for customer transaction history
  const handleExportPDF = () => {
    if (!currentUser) return;

    // Filter current user transactions matching active filters
    const filteredTxns = userTransactions
      .filter(t => historyType === 'ALL' || t.type === historyType)
      .filter(t => historyStatus === 'ALL' || t.status === historyStatus)
      .filter(t => !historySearch || t.reference.toLowerCase().includes(historySearch.toLowerCase()) || t.description.toLowerCase().includes(historySearch.toLowerCase()));

    exportTransactionHistoryPDF({
      user: currentUser,
      accounts: userAccounts,
      transactions: filteredTxns,
      filterMeta: {
        type: historyType,
        status: historyStatus,
        search: historySearch
      }
    });

    setFlash({
      type: 'success',
      message: `Transaction history statement PDF generated (${filteredTxns.length} records).`
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Sticky Navy Header */}
      <header className="sticky top-0 z-50 bg-[#0b2545] text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            onClick={() => navigate(currentUser ? (currentUser.role === 'ADMIN' ? '/admin' : '/dashboard') : '/')} 
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            {/* Logo inline SVG */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="transition-transform group-hover:scale-105">
              <rect width="32" height="32" rx="8" fill="#13315c" />
              <path d="M6 11L16 6L26 11V13H6V11Z" fill="#f59e0b" />
              <path d="M8 14H10V22H8V14Z" fill="#f59e0b" />
              <path d="M12 14H14V22H12V14Z" fill="#f59e0b" />
              <path d="M18 14H20V22H18V14Z" fill="#f59e0b" />
              <path d="M22 14H24V22H22V14Z" fill="#f59e0b" />
              <rect x="5" y="23" width="22" height="3" rx="1" fill="#f59e0b" />
            </svg>
            <span className="text-xl font-bold tracking-tight">
              Prime<span className="text-amber-400">Bank</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {!currentUser ? (
              <>
                <button onClick={() => navigate('/about')} className="hover:text-amber-400 transition">About</button>
                <button onClick={() => navigate('/contact')} className="hover:text-amber-400 transition">Contact</button>
                <button 
                  onClick={() => navigate('/login')} 
                  className="px-4 py-1.5 border border-amber-400 text-amber-400 rounded-lg hover:bg-amber-400 hover:text-slate-900 transition"
                >
                  Sign in
                </button>
                <button 
                  onClick={() => navigate('/register')} 
                  className="px-4 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm transition"
                >
                  Open account
                </button>
              </>
            ) : currentUser.role === 'CUSTOMER' ? (
              <>
                <button onClick={() => navigate('/dashboard')} className={`hover:text-amber-400 transition ${currentPath === '/dashboard' ? 'text-amber-400 font-bold' : ''}`}>Dashboard</button>
                <button onClick={() => navigate('/transfer')} className={`hover:text-amber-400 transition ${currentPath === '/transfer' ? 'text-amber-400 font-bold' : ''}`}>Transfer</button>
                <button onClick={() => navigate('/history')} className={`hover:text-amber-400 transition ${currentPath === '/history' ? 'text-amber-400 font-bold' : ''}`}>History</button>
                <button onClick={() => navigate('/services')} className={`hover:text-amber-400 transition ${currentPath === '/services' ? 'text-amber-400 font-bold' : ''}`}>Services</button>
                <button onClick={() => navigate('/profile')} className={`hover:text-amber-400 transition ${currentPath === '/profile' ? 'text-amber-400 font-bold' : ''}`}>Profile</button>
                <button onClick={() => navigate('/about')} className="hover:text-amber-400 transition">About</button>
                <button onClick={handleLogout} className="flex items-center gap-1 text-slate-300 hover:text-red-400 transition">
                  <LogOut size={16} /> Sign out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/admin')} className={`hover:text-amber-400 transition ${currentPath === '/admin' ? 'text-amber-400 font-bold' : ''}`}>Dashboard</button>
                <button onClick={() => navigate('/admin/users')} className={`hover:text-amber-400 transition ${currentPath === '/admin/users' ? 'text-amber-400 font-bold' : ''}`}>Users</button>
                <button onClick={() => navigate('/admin/transactions')} className={`hover:text-amber-400 transition ${currentPath === '/admin/transactions' ? 'text-amber-400 font-bold' : ''}`}>Transactions</button>
                <button onClick={() => navigate('/admin/settings')} className={`hover:text-amber-400 transition ${currentPath === '/admin/settings' ? 'text-amber-400 font-bold' : ''}`}>Settings</button>
                <button onClick={() => navigate('/profile')} className="hover:text-amber-400 transition">Profile</button>
                <button onClick={() => navigate('/about')} className="hover:text-amber-400 transition">About</button>
                <button onClick={handleLogout} className="flex items-center gap-1 text-slate-300 hover:text-red-400 transition">
                  <LogOut size={16} /> Sign out
                </button>
              </>
            )}
          </nav>

          {/* Mobile Hamburger Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 text-slate-200 hover:text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700 bg-[#0b2545] px-4 py-4 flex flex-col gap-3 text-base">
            {!currentUser ? (
              <>
                <button onClick={() => navigate('/about')} className="text-left py-2 hover:text-amber-400">About</button>
                <button onClick={() => navigate('/contact')} className="text-left py-2 hover:text-amber-400">Contact</button>
                <button onClick={() => navigate('/login')} className="w-full text-center py-2 border border-amber-400 text-amber-400 rounded-lg">Sign in</button>
                <button onClick={() => navigate('/register')} className="w-full text-center py-2 bg-teal-600 text-white rounded-lg">Open account</button>
              </>
            ) : currentUser.role === 'CUSTOMER' ? (
              <>
                <button onClick={() => navigate('/dashboard')} className="text-left py-2 hover:text-amber-400">Dashboard</button>
                <button onClick={() => navigate('/transfer')} className="text-left py-2 hover:text-amber-400">Transfer</button>
                <button onClick={() => navigate('/history')} className="text-left py-2 hover:text-amber-400">History</button>
                <button onClick={() => navigate('/services')} className="text-left py-2 hover:text-amber-400">Services</button>
                <button onClick={() => navigate('/profile')} className="text-left py-2 hover:text-amber-400">Profile</button>
                <button onClick={() => navigate('/about')} className="text-left py-2 hover:text-amber-400">About</button>
                <button onClick={handleLogout} className="text-left py-2 text-red-400 flex items-center gap-2">
                  <LogOut size={16} /> Sign out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/admin')} className="text-left py-2 hover:text-amber-400">Dashboard</button>
                <button onClick={() => navigate('/admin/users')} className="text-left py-2 hover:text-amber-400">Users</button>
                <button onClick={() => navigate('/admin/transactions')} className="text-left py-2 hover:text-amber-400">Transactions</button>
                <button onClick={() => navigate('/admin/settings')} className="text-left py-2 hover:text-amber-400">Settings</button>
                <button onClick={() => navigate('/profile')} className="text-left py-2 hover:text-amber-400">Profile</button>
                <button onClick={() => navigate('/about')} className="text-left py-2 hover:text-amber-400">About</button>
                <button onClick={handleLogout} className="text-left py-2 text-red-400 flex items-center gap-2">
                  <LogOut size={16} /> Sign out
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Dismissable Flash Message Banner */}
      {flash && (
        <div className={`py-3 px-4 transition-all duration-300 ${flash.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'}`}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              {flash.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" /> : <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />}
              <span>{flash.message}</span>
            </div>
            <button onClick={() => setFlash(null)} className="p-1 hover:opacity-75">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* LANDING PAGE (/) */}
        {currentPath === '/' && (
          <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-b from-[#0b2545] to-[#13315c] text-white py-16 md:py-24 px-4 overflow-hidden">
              <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-block px-3 py-1 bg-amber-400/20 text-amber-300 text-xs font-semibold rounded-full uppercase tracking-wider">
                    Online banking system
                  </div>
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                    Banking that fits your pocket.
                  </h1>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    Open an account in seconds, check real-time balances, make instant fund transfers with thread-safe concurrency, track every rupee, and grow your wealth with loans & investments.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <button 
                      onClick={() => navigate('/register')} 
                      className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl shadow-lg transition flex items-center gap-2"
                    >
                      Open a free account <ChevronRight size={18} />
                    </button>
                    <button 
                      onClick={() => navigate('/login')} 
                      className="px-6 py-3 border border-slate-400 hover:border-white text-white font-medium rounded-xl transition"
                    >
                      Sign in to demo
                    </button>
                  </div>
                  {/* Demo login hints */}
                  <div className="pt-4 border-t border-slate-700/60 text-xs text-slate-400 flex flex-col sm:flex-row gap-4">
                    <div><span className="font-semibold text-slate-200">Customer demo:</span> anita@primebank.test / Anita@123</div>
                    <div><span className="font-semibold text-slate-200">Admin demo:</span> admin@primebank.test / Admin@123</div>
                  </div>
                </div>

                {/* CSS Drawn Stacked Mini Cards */}
                <div className="relative flex justify-center py-6">
                  <div className="w-72 h-44 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-2xl shadow-2xl p-5 text-white absolute -top-4 -left-2 rotate-[-6deg] opacity-75 hidden sm:block">
                    <div className="text-xs uppercase tracking-wider font-semibold opacity-80">PrimeBank Platinum</div>
                    <div className="mt-8 text-lg font-mono tracking-widest">•••• •••• •••• 4002</div>
                    <div className="mt-4 text-xs font-mono">EXPIRES 10/28</div>
                  </div>
                  <div className="w-80 h-48 bg-gradient-to-tr from-teal-700 to-teal-500 rounded-2xl shadow-2xl p-6 text-white relative z-10 rotate-[2deg]">
                    <div className="flex justify-between items-center">
                      <div className="text-xs uppercase tracking-wider font-semibold opacity-90">Savings Account</div>
                      <Landmark size={20} className="text-teal-200" />
                    </div>
                    <div className="mt-4 text-2xl font-bold font-mono">₹42,500.00</div>
                    <div className="mt-1 text-xs opacity-80">SB100001 · Anita Sharma</div>
                    <div className="mt-6 flex justify-between items-center text-xs font-mono">
                      <span>CHIP & PIN</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded">ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats Band - live from settings */}
            <section className="bg-white border-y border-slate-200 py-10 px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Banking with no surprises</h2>
                  <p className="text-slate-600 text-sm mt-1">Clear rates, instant execution, and rock-solid reliability.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-3xl font-extrabold text-[#0b2545]">₹1,000</div>
                    <div className="font-semibold text-slate-800 mt-2">Welcome Balance</div>
                    <div className="text-xs text-slate-500 mt-1">Credited instantly upon opening your free savings account</div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-3xl font-extrabold text-teal-600">{settings.transfer_fee_percent}%</div>
                    <div className="font-semibold text-slate-800 mt-2">Flat Transfer Fee</div>
                    <div className="text-xs text-slate-500 mt-1">Ultra-low transparent pricing on all domestic transfers</div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-3xl font-extrabold text-amber-500">24×7</div>
                    <div className="font-semibold text-slate-800 mt-2">Instant Settlement</div>
                    <div className="text-xs text-slate-500 mt-1">Multi-threaded concurrent execution with deadlock prevention</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Feature Grid */}
            <section className="py-16 px-4 max-w-6xl mx-auto">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl font-bold text-slate-900">Everything you need in modern banking</h2>
                <p className="text-slate-600 mt-2">Engineered with rigorous Java concurrency primitives and strict layering.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                    <ArrowRightLeft size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Instant Transfers</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Account-level lock striping with sorted lock acquisition ensures concurrent transfers never deadlock or overdraw balances.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <History size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Searchable History</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Filter by transaction type, search descriptions, and audit past deposits, withdrawals, and inter-bank payments effortlessly.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                    <TrendingUp size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Loans & Investments</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Fixed deposits up to 8.2% p.a. and instant retail loans calculated with straightforward flat-rate yearly interest.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                    <Shield size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Built-in Security</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    120,000-iteration PBKDF2 with HMAC-SHA256, constant-time message comparison, and strict parameterized SQL queries.
                  </p>
                </div>
              </div>
            </section>

            {/* Closing CTA */}
            <section className="bg-slate-900 text-white py-14 px-4 text-center">
              <div className="max-w-2xl mx-auto space-y-4">
                <h2 className="text-3xl font-bold">Ready to try it?</h2>
                <p className="text-slate-400">Join thousands of customers banking with complete transparency and instant execution.</p>
                <div className="pt-2">
                  <button onClick={() => navigate('/register')} className="px-8 py-3 bg-teal-500 hover:bg-teal-600 font-semibold rounded-xl text-white shadow-lg transition">
                    Get started free
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* LOGIN PAGE */}
        {currentPath === '/login' && (
          <div className="py-12 px-4 max-w-md mx-auto">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
              <p className="text-sm text-slate-600 mb-6">Enter your credentials to access your PrimeBank account.</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email address</label>
                  <input 
                    type="email" 
                    required 
                    value={loginEmail} 
                    onChange={e => setLoginEmail(e.target.value)} 
                    placeholder="e.g. anita@primebank.test" 
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
                  <input 
                    type="password" 
                    required 
                    value={loginPassword} 
                    onChange={e => setLoginPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow transition text-sm">
                  Sign in
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-500">
                Don't have an account?{' '}
                <button onClick={() => navigate('/register')} className="text-teal-600 font-semibold hover:underline">
                  Open an account
                </button>
              </div>

              {/* Demo Login Shortcuts */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick demo sign-in:</div>
                <div className="space-y-2">
                  <button 
                    type="button"
                    onClick={() => handleDemoLogin('anita@primebank.test', 'Anita@123')}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs flex justify-between items-center transition"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">Anita Sharma</span> (Customer)
                      <div className="text-slate-500">anita@primebank.test · Anita@123</div>
                    </div>
                    <span className="text-teal-600 font-bold">Use →</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleDemoLogin('admin@primebank.test', 'Admin@123')}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs flex justify-between items-center transition"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">Priya Admin</span> (Administrator)
                      <div className="text-slate-500">admin@primebank.test · Admin@123</div>
                    </div>
                    <span className="text-teal-600 font-bold">Use →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REGISTER PAGE */}
        {currentPath === '/register' && (
          <div className="py-12 px-4 max-w-md mx-auto">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Open your account</h2>
              <p className="text-sm text-slate-600 mb-6">A free savings account with a ₹1,000 welcome balance.</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={regName} 
                    onChange={e => setRegName(e.target.value)} 
                    placeholder="e.g. Vikram Malhotra" 
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email address</label>
                  <input 
                    type="email" 
                    required 
                    value={regEmail} 
                    onChange={e => setRegEmail(e.target.value)} 
                    placeholder="e.g. vikram@example.com" 
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone number</label>
                  <input 
                    type="text" 
                    required 
                    value={regPhone} 
                    onChange={e => setRegPhone(e.target.value)} 
                    placeholder="+91 98765 43210" 
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Password (min 8 chars)</label>
                  <input 
                    type="password" 
                    required 
                    value={regPassword} 
                    onChange={e => setRegPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow transition text-sm">
                  Create account
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-500">
                Already registered?{' '}
                <button onClick={() => navigate('/login')} className="text-teal-600 font-semibold hover:underline">
                  Sign in
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMER DASHBOARD */}
        {currentPath === '/dashboard' && currentUser && (
          <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Hello, {currentUser.fullName.split(' ')[0]}
                </h1>
                <p className="text-sm text-slate-500">Welcome to your PrimeBank dashboard</p>
              </div>
              <button 
                onClick={() => navigate('/transfer')} 
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow flex items-center gap-2 text-sm transition"
              >
                <ArrowRightLeft size={16} /> Transfer funds
              </button>
            </div>

            {/* Three Summary Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total balance</div>
                <div className="text-3xl font-bold text-slate-900 mt-2">
                  ₹{userAccounts.reduce((sum, a) => sum + a.balance, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-emerald-600 font-medium mt-1">Available across all accounts</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Active Accounts</div>
                <div className="text-3xl font-bold text-slate-900 mt-2">{userAccounts.length}</div>
                <div className="text-xs text-slate-500 mt-1">Savings & Current deposits</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Transactions this month</div>
                <div className="text-3xl font-bold text-slate-900 mt-2">{userTransactions.length}</div>
                <div className="text-xs text-teal-600 font-medium mt-1">All settled in real-time</div>
              </div>
            </div>

            {/* Account Cards */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Your Accounts</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {userAccounts.map(acc => (
                  <div key={acc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${acc.accountType === 'SAVINGS' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          {acc.accountType}
                        </span>
                        <div className="text-lg font-mono font-bold text-slate-900 mt-2">{acc.accountNumber}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500 uppercase">Balance</div>
                        <div className="text-2xl font-bold text-[#0b2545]">
                          ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      {acc.accountType === 'SAVINGS' ? 'Min balance ₹500' : 'Overdraft up to ₹10,000'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
                <button onClick={() => navigate('/history')} className="text-teal-600 text-sm font-semibold hover:underline">
                  View full history →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Details</th>
                      <th className="py-3 px-4">Counterparty</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userTransactions.slice(0, 8).map(txn => {
                      const isCredit = txn.toAccountId && userAccountIds.has(txn.toAccountId) && (!txn.fromAccountId || !userAccountIds.has(txn.fromAccountId));
                      return (
                        <tr key={txn.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700">{txn.reference}</td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-900">{txn.description}</span>
                            <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              txn.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-800' :
                              txn.type === 'WITHDRAWAL' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {txn.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-500">
                            {txn.fromAccountId && !userAccountIds.has(txn.fromAccountId) ? `From: ${getAccountDisplay(txn.fromAccountId)}` :
                             txn.toAccountId && !userAccountIds.has(txn.toAccountId) ? `To: ${getAccountDisplay(txn.toAccountId)}` : 'Internal'}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">{txn.createdAt}</td>
                          <td className={`py-3 px-4 text-right font-mono font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {isCredit ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                    {userTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">No recent transactions.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TRANSFER PAGE */}
        {currentPath === '/transfer' && currentUser && (
          <div className="max-w-xl mx-auto py-10 px-4">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Transfer Funds</h2>
              <p className="text-sm text-slate-600 mb-6">Send money instantly with atomic thread-safe verification.</p>

              {settings.maintenance_mode && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex gap-3 items-center">
                  <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
                  <div>Transfers are temporarily disabled for scheduled maintenance.</div>
                </div>
              )}

              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">From account</label>
                  <select 
                    value={transferFrom || (userAccounts[0]?.accountNumber ?? '')} 
                    onChange={e => setTransferFrom(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                  >
                    {userAccounts.map(a => (
                      <option key={a.id} value={a.accountNumber}>
                        {a.accountType === 'SAVINGS' ? 'Savings' : 'Current'} · {a.accountNumber} · ₹{a.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Recipient Account Number</label>
                  <input 
                    type="text" 
                    required 
                    value={transferTo} 
                    onChange={e => setTransferTo(e.target.value.toUpperCase())}
                    placeholder="e.g. SB100003" 
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Try demo accounts: <span className="font-mono text-teal-600 font-semibold cursor-pointer" onClick={() => setTransferTo('SB100003')}>SB100003</span> (Rahul) or <span className="font-mono text-teal-600 font-semibold cursor-pointer" onClick={() => setTransferTo('SB100004')}>SB100004</span> (Meera)
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    step="0.01" 
                    min={settings.min_transfer_amount}
                    value={transferAmount} 
                    onChange={e => setTransferAmount(e.target.value)}
                    placeholder={`Min ₹${settings.min_transfer_amount}`}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Fee: {settings.transfer_fee_percent}% (minimum transfer amount is ₹{settings.min_transfer_amount})
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Note / Description (Optional)</label>
                  <input 
                    type="text" 
                    value={transferNote} 
                    onChange={e => setTransferNote(e.target.value)}
                    placeholder="e.g. Dinner bill split" 
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={settings.maintenance_mode}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow transition text-sm flex items-center justify-center gap-2"
                >
                  Confirm Transfer
                </button>
              </form>
            </div>
          </div>
        )}

        {/* HISTORY PAGE */}
        {currentPath === '/history' && currentUser && (
          <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
                <p className="text-sm text-slate-500">View, search, filter and export your complete official banking statement</p>
              </div>
              <button
                type="button"
                onClick={handleExportPDF}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm hover:shadow transition cursor-pointer"
                aria-label="Export transaction statement as formatted PDF"
              >
                <Download size={16} />
                <span>Export Statement (PDF)</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between shadow-xs">
              <div className="flex flex-wrap gap-3 flex-1">
                <input 
                  type="text" 
                  placeholder="Search by reference or note..." 
                  value={historySearch} 
                  onChange={e => setHistorySearch(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm min-w-[240px]"
                />
                <select 
                  value={historyType} 
                  onChange={e => setHistoryType(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm bg-white cursor-pointer"
                  aria-label="Filter by transaction type"
                >
                  <option value="ALL">All Types</option>
                  <option value="TRANSFER">Transfers</option>
                  <option value="DEPOSIT">Deposits</option>
                  <option value="WITHDRAWAL">Withdrawals</option>
                </select>
                <select 
                  value={historyStatus} 
                  onChange={e => setHistoryStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm bg-white cursor-pointer"
                  aria-label="Filter transactions by status"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setHistorySearch(''); setHistoryType('ALL'); setHistoryStatus('ALL'); }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Details</th>
                      <th className="py-3 px-4">Counterparty</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userTransactions
                      .filter(t => historyType === 'ALL' || t.type === historyType)
                      .filter(t => historyStatus === 'ALL' || t.status === historyStatus)
                      .filter(t => !historySearch || t.reference.toLowerCase().includes(historySearch.toLowerCase()) || t.description.toLowerCase().includes(historySearch.toLowerCase()))
                      .map(txn => {
                        const isCredit = txn.toAccountId && userAccountIds.has(txn.toAccountId) && (!txn.fromAccountId || !userAccountIds.has(txn.fromAccountId));
                        return (
                          <tr key={txn.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700">{txn.reference}</td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-900">{txn.description}</span>
                              <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                txn.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-800' :
                                txn.type === 'WITHDRAWAL' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {txn.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-slate-500">
                              {txn.fromAccountId && !userAccountIds.has(txn.fromAccountId) ? `From: ${getAccountDisplay(txn.fromAccountId)}` :
                               txn.toAccountId && !userAccountIds.has(txn.toAccountId) ? `To: ${getAccountDisplay(txn.toAccountId)}` : 'Internal'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                txn.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90' :
                                txn.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border border-amber-200/90' :
                                'bg-rose-50 text-rose-800 border border-rose-200/90'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  txn.status === 'COMPLETED' ? 'bg-emerald-500' :
                                  txn.status === 'PENDING' ? 'bg-amber-500 animate-pulse' :
                                  'bg-rose-500'
                                }`} />
                                <span>{txn.status}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500">{txn.createdAt}</td>
                            <td className={`py-3 px-4 text-right font-mono font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                              {isCredit ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    {userTransactions
                      .filter(t => historyType === 'ALL' || t.type === historyType)
                      .filter(t => historyStatus === 'ALL' || t.status === historyStatus)
                      .filter(t => !historySearch || t.reference.toLowerCase().includes(historySearch.toLowerCase()) || t.description.toLowerCase().includes(historySearch.toLowerCase()))
                      .length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No transactions found matching your selected filters.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SERVICES (INVESTMENTS & LOANS) */}
        {currentPath === '/services' && currentUser && (
          <div className="max-w-6xl mx-auto py-8 px-4 space-y-10">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Banking Products & Services</h1>
              <p className="text-slate-600 text-sm mt-1">Grow your savings with fixed yields or secure quick retail credit.</p>
            </div>

            {/* Investment Catalogue */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
                <span className="absolute top-5 right-5 text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">7.1% p.a.</span>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Fixed Deposit · 12 months</h3>
                <p className="text-slate-600 text-xs mb-4">Lock in a guaranteed rate for one year. Premature closure allowed after 3 months.</p>
                <div className="text-xs font-semibold text-slate-500">Minimum: ₹25,000</div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
                <span className="absolute top-5 right-5 text-xs font-bold px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full">6.8% p.a.</span>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Recurring Deposit · 24 months</h3>
                <p className="text-slate-600 text-xs mb-4">Save a fixed amount every month and earn interest on every instalment.</p>
                <div className="text-xs font-semibold text-slate-500">Minimum: ₹1,000</div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
                <span className="absolute top-5 right-5 text-xs font-bold px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full">8.2% p.a.</span>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Senior Citizen Savings</h3>
                <p className="text-slate-600 text-xs mb-4">For customers above 60. Quarterly interest payout to your savings account.</p>
                <div className="text-xs font-semibold text-slate-500">Minimum: ₹50,000</div>
              </div>
            </div>

            {/* Interactive Loan EMI Calculator */}
            <LoanEMICalculator onPreFillApplication={handlePreFillLoan} />

            {/* Side-by-side Forms */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Start Investment */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Start an Investment</h2>
                <form onSubmit={handleStartInvestment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Plan</label>
                    <select 
                      value={investPlan} 
                      onChange={e => setInvestPlan(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      <option value="Fixed Deposit · 12 months">Fixed Deposit · 12 months (7.1% p.a.)</option>
                      <option value="Recurring Deposit · 24 months">Recurring Deposit · 24 months (6.8% p.a.)</option>
                      <option value="Senior Citizen Savings">Senior Citizen Savings (8.2% p.a.)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount (₹)</label>
                    <input 
                      type="number" 
                      required 
                      value={investAmount} 
                      onChange={e => setInvestAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-sm transition">
                    Invest Now
                  </button>
                </form>
              </div>

              {/* Apply for Loan */}
              <div id="loan-application-form" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm scroll-mt-20">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-slate-900">Apply for a Loan (9.0% p.a. flat)</h2>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    Instant Review
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Submit your borrowing terms or use values pre-filled from the EMI Calculator above.</p>
                <form onSubmit={handleApplyLoan} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Loan Amount (₹10,000 - ₹50,00,000)</label>
                    <input 
                      type="number" 
                      required 
                      min={10000} 
                      max={5000000} 
                      value={loanAmount} 
                      onChange={e => setLoanAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tenure (6 - 60 Months)</label>
                    <input 
                      type="number" 
                      required 
                      min={6} 
                      max={60} 
                      value={loanTerm} 
                      onChange={e => setLoanTerm(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Purpose of Loan</label>
                    <input 
                      type="text" 
                      required 
                      value={loanPurpose} 
                      onChange={e => setLoanPurpose(e.target.value)}
                      placeholder="e.g. Home renovation"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-[#0b2545] hover:bg-[#13315c] text-white font-semibold rounded-lg text-sm transition">
                    Submit Loan Application
                  </button>
                </form>
              </div>
            </div>

            {/* Tables: Your Loans & Your Investments */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Loans Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Your Loan Applications</h3>
                    <p className="text-[11px] text-slate-500">Click any loan or "Schedule" to view full monthly amortization</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase">
                      <tr>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Tenure</th>
                        <th className="p-2">Purpose</th>
                        <th className="p-2">Est. Payable</th>
                        <th className="p-2">Status</th>
                        <th className="p-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loans.filter(l => l.userId === currentUser.id).map(loan => {
                        const estPayable = loan.amount * (1 + 0.09 * loan.termMonths / 12);
                        return (
                          <tr 
                            key={loan.id} 
                            onClick={() => setSelectedLoanForDetails(loan)}
                            className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                            title="Click to view monthly amortization schedule"
                          >
                            <td className="p-2 font-mono font-bold group-hover:text-teal-700">₹{loan.amount.toLocaleString()}</td>
                            <td className="p-2">{loan.termMonths} mos</td>
                            <td className="p-2 font-medium text-slate-800">{loan.purpose}</td>
                            <td className="p-2 font-mono font-semibold">₹{estPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                            <td className="p-2">
                              {loan.status === 'REQUESTED' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  <Clock size={11} className="text-amber-600" />
                                  <span>Pending</span>
                                </span>
                              )}
                              {loan.status === 'APPROVED' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <CheckCircle2 size={11} className="text-emerald-600" />
                                  <span>Approved</span>
                                </span>
                              )}
                              {loan.status === 'REJECTED' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200/90 shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <XCircle size={11} className="text-rose-600" />
                                  <span>Rejected</span>
                                </span>
                              )}
                              {loan.status === 'REPAID' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/90 shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                  <Check size={11} className="text-slate-600" />
                                  <span>Repaid</span>
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedLoanForDetails(loan)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-md text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer border border-slate-200"
                                  title="View monthly amortization schedule"
                                >
                                  <FileText size={11} />
                                  <span>Schedule</span>
                                </button>
                                {loan.status === 'APPROVED' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRepayingLoan(loan);
                                      setRepayAccountId(userAccounts[0]?.id || null);
                                      setRepayStep(1);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-sm transition inline-flex items-center gap-1 cursor-pointer"
                                    aria-label={`Repay loan ${loan.purpose}`}
                                  >
                                    Repay
                                  </button>
                                ) : loan.status === 'REPAID' ? (
                                  <span className="text-slate-500 font-semibold text-[11px] inline-flex items-center gap-0.5">
                                    ✓ Settled
                                  </span>
                                ) : loan.status === 'REJECTED' ? (
                                  <span className="text-rose-600 font-medium text-[11px]">
                                    Declined
                                  </span>
                                ) : (
                                  <span className="text-amber-700 font-medium text-[11px] inline-flex items-center gap-1">
                                    <Clock size={11} /> Under review
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {loans.filter(l => l.userId === currentUser.id).length === 0 && (
                        <tr><td colSpan={6} className="p-4 text-center text-slate-400">No active loan applications.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Investments Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 text-base mb-4">Your Investments</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase">
                      <tr>
                        <th className="p-2">Plan</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Since</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {investments.filter(i => i.userId === currentUser.id).map(inv => (
                        <tr key={inv.id}>
                          <td className="p-2 font-medium">{inv.planName}</td>
                          <td className="p-2 font-mono font-bold">₹{inv.amount.toLocaleString()}</td>
                          <td className="p-2 text-slate-500">{inv.createdAt}</td>
                        </tr>
                      ))}
                      {investments.filter(i => i.userId === currentUser.id).length === 0 && (
                        <tr><td colSpan={3} className="p-4 text-center text-slate-400">No active investments.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Repay Loan Modal with Summary Step */}
            {repayingLoan && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
                  {/* Modal Header */}
                  <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${repayStep === 1 ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'}`}>
                          Step 1: Account
                        </span>
                        <ChevronRight size={12} className="text-slate-400" />
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${repayStep === 2 ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'}`}>
                          Step 2: Breakdown & Summary
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {repayStep === 1 ? 'Repay Active Loan' : 'Loan Payoff Summary'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {repayStep === 1 
                          ? 'Choose funding account and verify balance before review.' 
                          : 'Verify principal, interest, and debit amount before final authorization.'}
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setRepayingLoan(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      aria-label="Close modal"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {(() => {
                    const selectedAcc = accounts.find(a => a.id === (repayAccountId || userAccounts[0]?.id));
                    const principal = repayingLoan.amount;
                    const interest = Math.round(principal * (0.09 * repayingLoan.termMonths / 12) * 100) / 100;
                    const payoff = Math.round((principal + interest) * 100) / 100;
                    const minBal = selectedAcc?.accountType === 'SAVINGS' ? 500 : -10000;
                    const hasSufficient = selectedAcc ? (selectedAcc.balance - payoff >= minBal) : false;

                    return (
                      <>
                        {/* STEP 1: Select Account & Verify Balance */}
                        {repayStep === 1 && (
                          <div className="space-y-4">
                            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Loan Reference:</span>
                                <span className="font-semibold text-slate-800">#{repayingLoan.id} - {repayingLoan.purpose}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Principal Amount:</span>
                                <span className="font-mono font-medium">₹{principal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Tenure & Rate:</span>
                                <span className="font-medium">{repayingLoan.termMonths} months · 9.0% p.a. flat interest</span>
                              </div>
                              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                <span className="font-bold text-slate-900 text-sm">Est. Total Payoff:</span>
                                <span className="font-mono font-bold text-teal-700 text-base">
                                  ₹{payoff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                                Select Account to Debit
                              </label>
                              <select
                                value={repayAccountId || (userAccounts[0]?.id ?? '')}
                                onChange={e => setRepayAccountId(Number(e.target.value))}
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                                required
                              >
                                {userAccounts.map(acc => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.accountType} · {acc.accountNumber} · Balance: ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Balance check indicator */}
                            <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                              hasSufficient ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {hasSufficient ? (
                                <>
                                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold">Sufficient funds available.</span> Remaining balance after payoff will be ₹{(selectedAcc!.balance - payoff).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.
                                  </div>
                                </>
                              ) : (
                                <>
                                  <AlertCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold">Insufficient balance.</span> Selected account balance is ₹{selectedAcc?.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, but ₹{payoff.toLocaleString('en-IN', { minimumFractionDigits: 2 })} is required.
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="flex gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => setRepayingLoan(null)}
                                className="flex-1 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-semibold transition cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={!hasSufficient}
                                onClick={() => setRepayStep(2)}
                                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                Review Payoff Summary <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* STEP 2: Breakdown of Principal and Interest & Final Authorization */}
                        {repayStep === 2 && (
                          <div className="space-y-4">
                            {/* Breakdown Card */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 divide-y divide-slate-200 text-xs">
                              <div className="pb-3 space-y-2">
                                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                  Loan Settlement Details
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">Loan Reference:</span>
                                  <span className="font-semibold text-slate-900">#{repayingLoan.id} - {repayingLoan.purpose}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">Loan Tenure:</span>
                                  <span className="font-medium text-slate-800">{repayingLoan.termMonths} months</span>
                                </div>
                              </div>

                              {/* Breakdown Table */}
                              <div className="py-3 space-y-2">
                                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                  Cost Breakdown
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-700 font-medium">Principal Amount</span>
                                  <span className="font-mono font-bold text-slate-900">
                                    ₹{principal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-amber-700">
                                  <span>
                                    Accrued Interest <span className="text-[10px] text-amber-600">(9.0% yearly × {repayingLoan.termMonths} mos)</span>
                                  </span>
                                  <span className="font-mono font-bold">
                                    + ₹{interest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between items-center text-sm font-bold">
                                  <span className="text-slate-900">Total Payoff Debit</span>
                                  <span className="font-mono text-emerald-700 text-base">
                                    ₹{payoff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>

                              {/* Account Impact */}
                              <div className="pt-3 space-y-1.5">
                                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                  Account Impact
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">Debit From:</span>
                                  <span className="font-mono font-semibold text-slate-800">
                                    {selectedAcc?.accountType} ({selectedAcc?.accountNumber})
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">Current Balance:</span>
                                  <span className="font-mono text-slate-700">
                                    ₹{selectedAcc?.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center font-semibold text-slate-900">
                                  <span className="text-slate-700">New Balance After Debit:</span>
                                  <span className="font-mono text-teal-700 font-bold">
                                    ₹{(selectedAcc ? selectedAcc.balance - payoff : 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Authorization Callout */}
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-start gap-2">
                              <Shield size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                              <div>
                                Authorizing will immediately debit <strong className="font-mono">₹{payoff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> from <strong>{selectedAcc?.accountNumber}</strong> and permanently mark Loan #{repayingLoan.id} as <strong>REPAID</strong>.
                              </div>
                            </div>

                            <form onSubmit={handleConfirmRepay} className="flex gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => setRepayStep(1)}
                                className="flex-1 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-semibold transition cursor-pointer"
                              >
                                ← Back to Account
                              </button>
                              <button
                                type="submit"
                                disabled={!hasSufficient}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Lock size={15} /> Confirm & Debit
                              </button>
                            </form>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* LOAN APPLICATION AMORTIZATION DETAILS MODAL */}
            {selectedLoanForDetails && (
              <LoanDetailsModal
                loan={selectedLoanForDetails}
                onClose={() => setSelectedLoanForDetails(null)}
                onRepay={loan => {
                  setRepayingLoan(loan);
                  setRepayAccountId(userAccounts[0]?.id || null);
                  setRepayStep(1);
                }}
              />
            )}
          </div>
        )}

        {/* PROFILE PAGE */}
        {currentPath === '/profile' && currentUser && (
          <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
              <p className="text-sm text-slate-500">Member since {currentUser.createdAt} · Role: <span className="font-bold text-[#0b2545]">{currentUser.role}</span></p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Details */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Contact Details</h2>
                <form onSubmit={e => { e.preventDefault(); setFlash({ type: 'success', message: 'Profile details updated.' }); }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
                    <input type="text" defaultValue={currentUser.fullName} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email</label>
                    <input type="email" defaultValue={currentUser.email} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone</label>
                    <input type="text" defaultValue={currentUser.phone} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                  </div>
                  <button type="submit" className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-sm">
                    Save changes
                  </button>
                </form>
              </div>

              {/* Security */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Security</h2>
                <form onSubmit={e => { e.preventDefault(); setFlash({ type: 'success', message: 'Password changed successfully.' }); }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Current Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">New Password (min 8 chars)</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                  </div>
                  <button type="submit" className="py-2 px-4 bg-[#0b2545] hover:bg-[#13315c] text-white font-medium rounded-lg text-sm">
                    Change password
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN DASHBOARD */}
        {currentPath === '/admin' && currentUser?.role === 'ADMIN' && (
          <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Admin Console</h1>
                <p className="text-sm text-slate-500">Live operational ledger, metrics & system parameters</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/admin/transactions')} className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold">
                  Transactions
                </button>
                <button onClick={() => navigate('/admin/settings')} className="px-4 py-2 bg-[#0b2545] text-white hover:bg-[#13315c] rounded-lg text-xs font-semibold">
                  Settings
                </button>
              </div>
            </div>

            {/* Six Metric Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Users</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{users.length}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Customers</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{users.filter(u => u.role === 'CUSTOMER').length}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Accounts</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{accounts.length}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Deposits</div>
                <div className="text-lg font-bold text-teal-600 mt-1">₹{accounts.reduce((s, a) => s + a.balance, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Transactions</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{transactions.length}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Volume (₹)</div>
                <div className="text-lg font-bold text-[#0b2545] mt-1">₹{transactions.reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
            </div>

            {/* 7-Day Activity Bar Chart built with CSS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-6">7-Day Transaction Activity</h2>
              <div className="h-44 flex items-end justify-between gap-4 pt-6 pb-2" role="img" aria-label="7-Day activity bar chart">
                {[
                  { day: '08 Oct', count: 3, h: '45%' },
                  { day: '09 Oct', count: 5, h: '70%' },
                  { day: '10 Oct', count: 2, h: '30%' },
                  { day: '11 Oct', count: 6, h: '85%' },
                  { day: '12 Oct', count: 4, h: '60%' },
                  { day: '13 Oct', count: 7, h: '100%' },
                  { day: '14 Oct', count: 5, h: '70%' },
                ].map((b, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500">{b.count} tx</span>
                    <div className="w-full bg-slate-100 rounded-t-lg relative flex items-end justify-center h-32">
                      <div className="w-full bg-teal-600 hover:bg-teal-700 transition-all rounded-t-lg" style={{ height: b.h }} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{b.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ADMIN USERS */}
        {currentPath === '/admin/users' && currentUser?.role === 'ADMIN' && (
          <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>

            {/* Create / Edit Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                {editingUserId ? `Edit User #${editingUserId}` : 'Create New User'}
              </h2>
              <form onSubmit={handleSaveUser} className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={adminUserName} 
                    onChange={e => setAdminUserName(e.target.value)}
                    placeholder="Name" 
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email</label>
                  <input 
                    type="email" 
                    required 
                    value={adminUserEmail} 
                    onChange={e => setAdminUserEmail(e.target.value)}
                    placeholder="Email" 
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone</label>
                  <input 
                    type="text" 
                    value={adminUserPhone} 
                    onChange={e => setAdminUserPhone(e.target.value)}
                    placeholder="Phone" 
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Role</label>
                  <select 
                    value={adminUserRole} 
                    onChange={e => setAdminUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Status</label>
                  <select 
                    value={adminUserStatus} 
                    onChange={e => setAdminUserStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button type="submit" className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-sm">
                    {editingUserId ? 'Update User' : 'Create User'}
                  </button>
                  {editingUserId && (
                    <button 
                      type="button" 
                      onClick={() => { setEditingUserId(null); setAdminUserName(''); setAdminUserEmail(''); setAdminUserPhone(''); }}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-xs">{u.id}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{u.fullName}</td>
                        <td className="py-3 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-xs">{u.phone}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button 
                            onClick={() => {
                              setEditingUserId(u.id);
                              setAdminUserName(u.fullName);
                              setAdminUserEmail(u.email);
                              setAdminUserPhone(u.phone);
                              setAdminUserRole(u.role);
                              setAdminUserStatus(u.status);
                            }}
                            className="text-teal-600 hover:underline text-xs font-semibold"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id, u.fullName)}
                            className="text-red-600 hover:underline text-xs font-semibold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN TRANSACTIONS */}
        {currentPath === '/admin/transactions' && currentUser?.role === 'ADMIN' && (
          <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Transaction Monitoring</h1>
                <p className="text-sm text-slate-500">Live system-wide audit of all account transfers & deposits</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-[#0b2545] hover:bg-[#13315c] text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow cursor-pointer transition"
                  aria-label="Export audit ledger as PDF"
                >
                  <FileText size={15} /> Export Audit PDF
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow cursor-pointer transition"
                >
                  <Download size={15} /> Download CSV report
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">From</th>
                      <th className="py-3 px-4">To</th>
                      <th className="py-3 px-4">Amount (₹)</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-xs font-semibold">{t.reference}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">{getAccountDisplay(t.fromAccountId)}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">{getAccountDisplay(t.toAccountId)}</td>
                        <td className="py-3 px-4 font-mono font-bold">₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-800' :
                            t.type === 'WITHDRAWAL' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">{t.description}</td>
                        <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">{t.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN SETTINGS */}
        {currentPath === '/admin/settings' && currentUser?.role === 'ADMIN' && (
          <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">System Settings</h1>
              <p className="text-sm text-slate-500 mb-6">Modify live system behavior and transaction processing rules.</p>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">transfer_fee_percent</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="5"
                    value={formFee} 
                    onChange={e => setFormFee(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                  />
                  <div className="text-xs text-slate-500 mt-1">Fee charged on fund transfers, as a percentage (0 to 5)</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">min_transfer_amount</label>
                  <input 
                    type="number" 
                    value={formMinTransfer} 
                    onChange={e => setFormMinTransfer(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                  />
                  <div className="text-xs text-slate-500 mt-1">Minimum amount allowed in a single transfer</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">maintenance_mode</label>
                  <select 
                    value={formMaintenance} 
                    onChange={e => setFormMaintenance(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="false">Disabled</option>
                    <option value="true">Enabled</option>
                  </select>
                  <div className="text-xs text-slate-500 mt-1">When true, customers cannot perform transfers</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">support_phone</label>
                  <input 
                    type="text" 
                    value={formPhone} 
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                  />
                  <div className="text-xs text-slate-500 mt-1">Customer support number shown in the footer</div>
                </div>

                <button type="submit" className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-sm shadow">
                  Save settings
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ABOUT PAGE */}
        {currentPath === '/about' && (
          <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">About PrimeBank</h1>
              <p className="text-slate-600 mt-2">A high-performance Java web banking application built from first principles.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 leading-relaxed text-slate-700">
              <p>
                PrimeBank is a complete, runnable online banking web application built from scratch to demonstrate production-grade architecture without heavy, opaque frameworks. It runs on Java 21 and embedded Tomcat 10.1 with Jakarta Servlets, raw JDBC through HikariCP, and a zero-dependency HTML template engine.
              </p>

              <h2 className="text-xl font-bold text-slate-900">Core Security Principles</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                <li><strong>PBKDF2 Password Hashing:</strong> 120,000 iterations using HMAC-SHA256 with 16-byte random salts. Password verification is performed using <code className="bg-slate-100 px-1 rounded">MessageDigest.isEqual</code> in constant time to eliminate timing side-channel attacks.</li>
                <li><strong>Session & Role-Based Access Control:</strong> Strict <code className="bg-slate-100 px-1 rounded">AuthFilter</code> protecting private routes and enforcing <code className="bg-slate-100 px-1 rounded">ADMIN</code> authorization.</li>
                <li><strong>SQL Injection Immunity:</strong> Every single query uses <code className="bg-slate-100 px-1 rounded">PreparedStatement</code> with bound parameters. Money values are always handled as <code className="bg-slate-100 px-1 rounded">BigDecimal</code>.</li>
                <li><strong>Thread-Safe Concurrency:</strong> Transfer execution utilizes a dedicated fixed thread pool with ordered lock striping to eliminate the possibility of deadlocks (A→B vs B→A) and race condition overdrafts.</li>
              </ul>

              <h2 className="text-xl font-bold text-slate-900">Technology Stack</h2>
              <p className="text-sm text-slate-600">
                Built strictly with Java 21, Jakarta Servlets 6.0 on embedded Tomcat 10.1.30, HikariCP 5.1.0 connection pooling, portable H2/PostgreSQL/MySQL SQL schemas, and hand-written mobile-first semantic HTML5, CSS3, and JavaScript.
              </p>
            </div>
          </div>
        )}

        {/* CONTACT PAGE */}
        {currentPath === '/contact' && (
          <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
            <div className="text-center max-w-xl mx-auto">
              <h1 className="text-3xl font-extrabold text-slate-900">Get in Touch</h1>
              <p className="text-slate-600 mt-2">We are here to assist with your accounts, transfers, and investment inquiries.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                  <Phone size={24} />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Customer Support</h3>
                <p className="text-xs text-slate-500 mb-4">Toll-free 24×7 helpdesk</p>
                <a href={`tel:${settings.support_phone.replace(/\s+/g, '')}`} className="text-teal-600 font-bold text-sm hover:underline">
                  {settings.support_phone}
                </a>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Mail size={24} />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Email Desk</h3>
                <p className="text-xs text-slate-500 mb-4">Direct correspondence</p>
                <a href="mailto:support@primebank.example" className="text-blue-600 font-bold text-sm hover:underline">
                  support@primebank.example
                </a>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <MapPin size={24} />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Head Office</h3>
                <p className="text-xs text-slate-500 mb-2">PrimeBank House, 42 Brigade Road, Bengaluru, Karnataka 560001</p>
                <div className="text-[11px] text-slate-400">Mon–Fri, 9:30 AM – 6:00 PM</div>
              </div>
            </div>
          </div>
        )}

        {/* 404 PAGE */}
        {currentPath === '/404' && (
          <div className="py-20 px-4 text-center max-w-md mx-auto space-y-6">
            <div className="text-6xl font-extrabold text-[#0b2545]">404</div>
            <h2 className="text-2xl font-bold text-slate-900">Page not found</h2>
            <p className="text-sm text-slate-600">The page you were looking for doesn't exist or has been moved.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold">
                Back to home
              </button>
              <button onClick={() => navigate('/contact')} className="px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-sm font-semibold">
                Contact support
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0b2545] text-slate-400 py-12 px-4 border-t border-slate-800 text-sm mt-auto">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="6" fill="#13315c" />
                <path d="M6 11L16 6L26 11V13H6V11Z" fill="#f59e0b" />
                <path d="M8 14H10V22H8V14Z" fill="#f59e0b" />
                <path d="M12 14H14V22H12V14Z" fill="#f59e0b" />
                <path d="M18 14H20V22H18V14Z" fill="#f59e0b" />
                <path d="M22 14H24V22H22V14Z" fill="#f59e0b" />
                <rect x="5" y="23" width="22" height="3" rx="1" fill="#f59e0b" />
              </svg>
              <span>Prime<span className="text-amber-400">Bank</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Banking that fits your pocket. Instant transfers, secure savings, and personalized wealth management.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => navigate('/about')} className="hover:text-amber-400 transition">About us</button></li>
              <li><button onClick={() => navigate('/contact')} className="hover:text-amber-400 transition">Contact</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Get in Touch</h4>
            <ul className="space-y-2 text-xs">
              <li><a href={`tel:${settings.support_phone.replace(/\s+/g, '')}`} className="hover:text-amber-400 transition">{settings.support_phone}</a></li>
              <li><a href="mailto:support@primebank.example" className="hover:text-amber-400 transition">support@primebank.example</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Security Note</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Passwords are salted and hashed with PBKDF2. This is an academic demo project - do not enter real financial data.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 mt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} PrimeBank Online Banking System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
