# PrimeBank – Online Banking System

[![TypeScript](https://img.shields.io/badge/TypeScript-7.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Tests](https://img.shields.io/badge/Unit_Tests-Passing-brightgreen.svg)]()

PrimeBank is a production-grade online banking system featuring dual portals (Customer & Bank Officer), real-time financial ledger auditing, fund transfers with minimum-balance validation, and an interactive active loan management system with a two-step payoff and interest breakdown wizard.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |       PrimeBank Frontend Client       |
                      |   React 19 + TypeScript + Tailwind    |
                      +---------------------------------------+
                                          |
                        [State Engine / Form Validations]
                                          |
          +-------------------------------+-------------------------------+
          |                               |                               |
          v                               v                               v
+--------------------+          +--------------------+          +--------------------+
| Customer Portal    |          | Bank Officer Admin |          | Financial Engine   |
| - Account Balances |          | - User Controls    |          | - Flat 9% Interest |
| - Fund Transfers   |          | - Loan Approvals   |          | - Min Balance Rule |
| - 2-Step Loan Pay  |          | - Global Audit     |          | - Ledger Generator |
| - Statement Export |          | - System Settings  |          | - CSV Exporter     |
+--------------------+          +--------------------+          +--------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |         Data & Storage Layer          |
                      |   Portable SQL Schema (schema.sql)    |
                      |   H2 / PostgreSQL / MySQL Compatible  |
                      |   Jakarta Servlets + HikariCP Pool    |
                      +---------------------------------------+
```

---

## Repository Structure

```
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git ignore rules for node, dist, test, and IDEs
├── index.html                    # Application entry HTML with security shims
├── metadata.json                 # AI Studio applet capabilities and permissions
├── package.json                  # Frontend dependencies, scripts, and build tasks
├── pom.xml                       # Maven configuration for Java 21 / Tomcat backend
├── tsconfig.json                 # TypeScript strict compiler configuration
├── vite.config.ts                # Vite dev server and host proxy settings
├── README.md                     # Project documentation, setup guide, and specs
│
└── src/
    ├── main.tsx                  # React DOM root bootstrapping
    ├── App.tsx                   # Main banking client and routing orchestration
    ├── index.css                 # Global Tailwind CSS imports and directives
    │
    ├── types/                    # Core TypeScript domain models
    │   └── index.ts              # Account, User, Transaction, Loan, and System types
    │
    ├── data/                     # Seed and initial baseline state
    │   └── initialData.ts        # Mock users, accounts, loans, and system settings
    │
    ├── utils/                    # Pure, testable business logic and formatting
    │   ├── loanRepayment.ts      # Loan payoff and principal/interest calculation
    │   ├── loanRepayment.test.ts # Unit tests for loan repayment logic
    │   ├── formatters.ts         # Locale currency (INR), account masking, date utils
    │   └── formatters.test.ts    # Unit tests for formatting utilities
    │
    └── main/resources/           # Enterprise backend & persistence assets
        ├── schema.sql            # Portable relational DDL (H2 / Postgres / MySQL)
        └── static/               # Favicon, static assets, and logos
```

---

## Prerequisites & Requirements

### Frontend Environment
- **Node.js**: `v20.0.0` or higher (Node 22 LTS recommended)
- **Package Manager**: `npm` (v10+), `yarn`, or `pnpm`

### Optional Backend Build (Java Servlets)
- **Java Development Kit (JDK)**: Java 21 (LTS)
- **Apache Maven**: `3.9.0` or higher

---

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd online-banking-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to create your local `.env` if custom configurations are needed:
```bash
cp .env.example .env
```

### 4. Run Development Server
```bash
npm run dev
```
The application will launch at **`http://localhost:3000`**.

### 5. Run Unit Tests
Execute the automated test suite with the built-in Node test runner:
```bash
npm test
```
*Runs all unit tests in `src/utils/*.test.ts` verifying loan formulas, interest splits, minimum balance headroom, and currency formatting.*

### 6. Code Quality & Linting
Validate TypeScript type safety across all components:
```bash
npm run lint
```

### 7. Production Build & Preview
```bash
npm run build
npm run preview
```

---

## Key Features & User Workflows

### 1. Authentication & Role-Based Portals
- **Customer Access**: Pre-configured demo credentials allow quick login for customer personas (e.g., *Anita Sharma*, *Rahul Verma*, *Meera Iyer*).
- **Admin Access**: Bank officer persona (*Priya Admin*) provides access to management dashboards, system-wide metrics, and global fee configuration.

### 2. Active Loan Repayment Engine
- **In-Table Repay Action**: Active customer loans feature an interactive **Repay** button directly in the Services loans ledger.
- **Two-Step Repayment Wizard**:
  - **Step 1 (Account & Headroom Verification)**: Users choose the funding deposit account (Savings or Current) and receive real-time balance feedback against minimum balance rules.
  - **Step 2 (Transparent Financial Breakdown)**: Displays an itemized breakdown of:
    - **Principal Amount** (e.g., ₹25,000.00)
    - **Accrued Interest** computed dynamically at 9% yearly flat rate across the loan tenure.
    - **Total Debit Sum** required for settlement.
- **Atomic Settlement**: Debits the funding account, updates the loan status to `REPAID`, updates the table action to `✓ Repaid`, and appends an official audit entry (`WITHDRAWAL`) to the account statement.

### 3. Account Management & Fund Transfers
- Support for **Savings Accounts** (maintains ₹500 minimum balance) and **Current Accounts** (allows -₹10,000 overdraft limit).
- Instant inter-account sweeps and peer-to-peer transfers.
- Printable/exportable transaction statements in CSV format.

### 4. Bank Officer Administration
- Approval and rejection workflows for pending loan applications.
- Customer account status toggling (`ACTIVE` vs. `SUSPENDED`).
- Dynamic configuration for platform-wide transfer fee percentages and minimum transaction thresholds.

---

## Database Architecture (`src/main/resources/schema.sql`)

The portable SQL schema is engineered to run seamlessly across embedded **H2**, **PostgreSQL**, and **MySQL**:

| Table | Purpose |
| :--- | :--- |
| `users` | User identities, authentication hashes, contact details, and RBAC roles |
| `accounts` | Customer savings and current deposit accounts linked via foreign keys |
| `transactions` | Immutable double-entry ledger with unique references and statuses |
| `loans` | Loan facility requests, approved terms, interest metadata, and payoff state |
| `investments` | Customer term deposits (Fixed Deposits, Recurring Deposits) |
| `system_settings` | Dynamic key-value store for global banking configurations |

---

## Code Quality & Standards

- **Strict Type Safety**: Fully typed models in `src/types/index.ts` avoiding `any` types.
- **Decoupled Logic**: Business rules (e.g., `calculateLoanBreakdown`, `canRepayLoan`) are isolated as pure functions in `src/utils/` for deterministic unit testing.
- **Accessibility & UX**: Clean focus states, semantic HTML elements, high contrast palette, and responsive mobile-first views with Tailwind CSS.
- **Resilience**: Embedded defensive shims in `index.html` preventing third-party browser extensions or injected scripts from interfering with application network state.

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.
