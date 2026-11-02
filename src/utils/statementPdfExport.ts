import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, User, Account } from '../types';

export interface PDFExportOptions {
  user: User;
  accounts: Account[];
  transactions: Transaction[];
  dateGenerated?: string;
  filterMeta?: {
    type?: string;
    status?: string;
    search?: string;
  };
}

export interface StatementSummary {
  totalCredits: number;
  totalDebits: number;
  netFlow: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  totalVolume: number;
}

/**
 * Calculates financial statement metrics for a given user and transaction list.
 */
export function calculateStatementSummary(
  transactions: Transaction[],
  userAccountIds: Set<number>
): StatementSummary {
  let totalCredits = 0;
  let totalDebits = 0;
  let completedCount = 0;
  let pendingCount = 0;
  let failedCount = 0;
  let totalVolume = 0;

  for (const txn of transactions) {
    totalVolume += txn.amount;
    if (txn.status === 'COMPLETED') completedCount++;
    else if (txn.status === 'PENDING') pendingCount++;
    else if (txn.status === 'FAILED') failedCount++;

    const isCredit = !!(
      txn.toAccountId &&
      userAccountIds.has(txn.toAccountId) &&
      (!txn.fromAccountId || !userAccountIds.has(txn.fromAccountId))
    );

    if (txn.status === 'COMPLETED') {
      if (isCredit) {
        totalCredits += txn.amount;
      } else {
        totalDebits += txn.amount;
      }
    }
  }

  return {
    totalCredits: Math.round(totalCredits * 100) / 100,
    totalDebits: Math.round(totalDebits * 100) / 100,
    netFlow: Math.round((totalCredits - totalDebits) * 100) / 100,
    completedCount,
    pendingCount,
    failedCount,
    totalVolume: Math.round(totalVolume * 100) / 100
  };
}

/**
 * Generates and downloads a beautifully styled PrimeBank statement PDF.
 */
export function exportTransactionHistoryPDF(options: PDFExportOptions): void {
  const { user, accounts, transactions, filterMeta } = options;
  const userAccountIds = new Set(accounts.map(a => a.id));
  const summary = calculateStatementSummary(transactions, userAccountIds);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper for account display
  const getAccountDisplay = (accId: number | null): string => {
    if (!accId) return 'Internal / Counter';
    const acc = accounts.find(a => a.id === accId);
    return acc ? `${acc.accountNumber} (${acc.accountType})` : `#${accId}`;
  };

  // --- HEADER & BRANDING BAR ---
  // Deep Navy background for top header bar
  doc.setFillColor(11, 37, 69); // #0b2545
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Accent Teal bottom line
  doc.setFillColor(13, 148, 136); // #0d9488
  doc.rect(0, 36, pageWidth, 2.5, 'F');

  // PrimeBank Brand Logo Mark (P monogram box)
  doc.setFillColor(19, 49, 92); // #13315c
  doc.roundedRect(14, 8, 18, 18, 3, 3, 'F');
  doc.setFillColor(13, 148, 136); // Teal dot inside
  doc.circle(23, 17, 4.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('P', 21.5, 19.5);

  // Bank Name & Tagline
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PrimeBank', 36, 17);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(153, 246, 228); // Teal light
  doc.text('OFFICIAL ACCOUNT TRANSACTION STATEMENT', 36, 23);

  // Statement Metadata (right aligned)
  const now = new Date();
  const dateStr = options.dateGenerated || now.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`Generated: ${dateStr}`, pageWidth - 14, 15, { align: 'right' });
  doc.text(`Doc Ref: STMT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${user.id}`, pageWidth - 14, 20, { align: 'right' });
  doc.text('PrimeBank National Financial Services', pageWidth - 14, 25, { align: 'right' });

  // --- CUSTOMER & ACCOUNT DETAILS CARD ---
  let cursorY = 44;

  doc.setFillColor(248, 250, 252); // #f8fafc slate-50
  doc.setDrawColor(226, 232, 240); // #e2e8f0 border
  doc.roundedRect(14, cursorY, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('ACCOUNT HOLDER DETAILS', 18, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600

  // Left column: Name, Email, Phone
  doc.text(`Name: `, 18, cursorY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${user.fullName} (#${user.id})`, 32, cursorY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Email: ${user.email}`, 18, cursorY + 17);
  doc.text(`Phone: ${user.phone || 'N/A'}`, 18, cursorY + 22);

  // Right column: Primary Accounts & Status
  const accList = accounts.length > 0 
    ? accounts.map(a => `${a.accountNumber} (${a.accountType})`).join(', ')
    : 'No linked accounts';
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  doc.text(`Linked Accounts: `, 105, cursorY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(accList.length > 40 ? accList.substring(0, 37) + '...' : accList, 133, cursorY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Combined Balance: `, 105, cursorY + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136); // Teal
  doc.text(`INR ${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 138, cursorY + 17);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Account Status: Active / KYC Verified`, 105, cursorY + 22);

  // --- FINANCIAL SUMMARY TABLE (METRICS) ---
  cursorY = 74;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 37, 69);
  doc.text('STATEMENT FINANCIAL SUMMARY', 14, cursorY);

  cursorY += 3;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: 'bold',
      halign: 'center'
    },
    body: [
      [
        { content: 'Total Transactions', styles: { fontStyle: 'bold' } },
        `${transactions.length} records`,
        { content: 'Completed Inflows (Credits)', styles: { fontStyle: 'bold', textColor: [22, 101, 52] } },
        `+ INR ${summary.totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ],
      [
        { content: 'Status Breakdown', styles: { fontStyle: 'bold' } },
        `${summary.completedCount} Completed | ${summary.pendingCount} Pending | ${summary.failedCount} Failed`,
        { content: 'Completed Outflows (Debits)', styles: { fontStyle: 'bold', textColor: [159, 18, 57] } },
        `- INR ${summary.totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ],
      [
        { content: 'Total Transaction Volume', styles: { fontStyle: 'bold' } },
        `INR ${summary.totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        { content: 'Net Cash Flow', styles: { fontStyle: 'bold', textColor: [11, 37, 69] } },
        `${summary.netFlow >= 0 ? '+' : ''} INR ${summary.netFlow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]
    ]
  });

  // --- FILTER CRITERIA CALLOUT (if filtered) ---
  const lastAutoTable = (doc as any).lastAutoTable;
  cursorY = lastAutoTable ? lastAutoTable.finalY + 6 : cursorY + 28;

  if (filterMeta && (filterMeta.type !== 'ALL' || filterMeta.status !== 'ALL' || filterMeta.search)) {
    doc.setFillColor(254, 243, 199); // Amber-100
    doc.setDrawColor(251, 191, 36); // Amber-400
    doc.roundedRect(14, cursorY, pageWidth - 28, 7, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(146, 64, 14); // Amber-800
    const filterText = `Applied Filters: [Type: ${filterMeta.type || 'ALL'}] · [Status: ${filterMeta.status || 'ALL'}]${filterMeta.search ? ` · [Search: "${filterMeta.search}"]` : ''}`;
    doc.text(filterText, 18, cursorY + 4.5);
    cursorY += 11;
  } else {
    cursorY += 3;
  }

  // --- DETAILED TRANSACTIONS LEDGER ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 37, 69);
  doc.text('TRANSACTION LEDGER', 14, cursorY);

  cursorY += 3;

  const tableRows = transactions.map(txn => {
    const isCredit = !!(
      txn.toAccountId &&
      userAccountIds.has(txn.toAccountId) &&
      (!txn.fromAccountId || !userAccountIds.has(txn.fromAccountId))
    );

    const counterparty = txn.fromAccountId && !userAccountIds.has(txn.fromAccountId)
      ? `From: ${getAccountDisplay(txn.fromAccountId)}`
      : txn.toAccountId && !userAccountIds.has(txn.toAccountId)
      ? `To: ${getAccountDisplay(txn.toAccountId)}`
      : 'Internal Account';

    const formattedAmount = `${isCredit ? '+' : '-'} INR ${txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return [
      txn.reference,
      txn.createdAt,
      txn.type,
      txn.description,
      counterparty,
      txn.status,
      formattedAmount
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    margin: { left: 14, right: 14 },
    head: [['Reference', 'Date & Time', 'Type', 'Description', 'Counterparty', 'Status', 'Amount']],
    body: tableRows,
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [241, 245, 249],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [11, 37, 69], // Navy header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { font: 'courier', fontStyle: 'bold', cellWidth: 24 },
      1: { cellWidth: 26, fontSize: 7 },
      2: { cellWidth: 20, fontStyle: 'bold' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 32, fontSize: 7 },
      5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 28, halign: 'right', font: 'courier', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Color-code Status column
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw as string;
        if (val === 'COMPLETED') {
          data.cell.styles.textColor = [22, 101, 52]; // emerald-800
        } else if (val === 'PENDING') {
          data.cell.styles.textColor = [180, 83, 9]; // amber-700
        } else if (val === 'FAILED') {
          data.cell.styles.textColor = [190, 18, 60]; // rose-700
        }
      }
      // Color-code Amount column
      if (data.section === 'body' && data.column.index === 6) {
        const val = data.cell.raw as string;
        if (val.startsWith('+')) {
          data.cell.styles.textColor = [13, 148, 136]; // teal
        } else {
          data.cell.styles.textColor = [15, 23, 42]; // dark
        }
      }
    },
    didDrawPage: (data) => {
      // Footer on every page
      const pageNumber = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.text('PrimeBank Official Computer-Generated Statement · Valid without physical signature', 14, pageHeight - 8);
      doc.text(`Page ${data.pageNumber} of ${pageNumber}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }
  });

  // Trigger browser download
  const cleanName = user.fullName.replace(/\s+/g, '_');
  const filename = `PrimeBank_Statement_${cleanName}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
