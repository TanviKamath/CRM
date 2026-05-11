# Diamond Tech

Diamond Tech is a comprehensive, full-stack merchant and inventory management system designed specifically for the diamond industry. Built with a modern web architecture, it streamlines business operations including inventory tracking, sales processing, client and broker management, memo (consignment) generation, and detailed financial reporting.

## Features

- **Inventory Management**: Track loose diamonds and diamond lots with precision.
- **Client & Broker Management**: Maintain detailed records of clients and brokers.
- **Sales & Memos**: Generate, track, and manage sales invoices and memos (consignment notes).
- **Financial Accounts & Expenses**: Comprehensive tracking of expenses and account ledgers.
- **Reporting & Data Visualization**: Interactive charts for business insights and automated PDF/Excel report generation.
- **Authentication**: Secure login and session management.

## Tech Stack

**Frontend:**
- [Next.js](https://nextjs.org/) (App Router & Server Components)
- [React](https://reactjs.org/)
- [Bootstrap](https://getbootstrap.com/) for UI styling
- [Lucide React](https://lucide.dev/) for iconography
- [Recharts](https://recharts.org/) for data visualization

**Backend & Database:**
- Next.js API Routes (Serverless Functions)
- [MySQL](https://www.mysql.com/) as the primary relational database
- [Knex.js](https://knexjs.org/) for SQL query building and database communication
- [Zod](https://zod.dev/) for robust data validation
- [Bcryptjs](https://www.npmjs.com/package/bcryptjs) & [JSONWebToken](https://jwt.io/) for authentication and authorization

**Utilities:**
- **Report Generation**: [PDFKit](https://pdfkit.org/), [jsPDF](https://parall.ax/products/jspdf), [ExcelJS](https://github.com/exceljs/exceljs), and [SheetJS (xlsx)](https://sheetjs.com/) for generating dynamic invoices, memos, and financial reports.
- **Email Integration**: [Nodemailer](https://nodemailer.com/)

## Prerequisites

Before running the project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Diamond-Tech
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root directory and configure your database and environment variables:
   ```env
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   JWT_SECRET=your_jwt_secret
   # Add any other necessary keys (AWS, Email, etc.)
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Diamond-Tech/
├── app/
│   ├── accounts/         # Account ledgers and financial tracking
│   ├── api/              # Next.js API routes (Backend)
│   ├── auth/             # Authentication pages (Login, Register)
│   ├── brokers/          # Broker management module
│   ├── clients/          # Client management module
│   ├── components/       # Reusable UI components
│   ├── diamonds/         # Diamond inventory management
│   ├── excel-tool/       # Utilities for Excel data import/export
│   ├── expenses/         # Expense tracking module
│   ├── lib/              # Shared utilities, DB connection (Knex), helpers
│   ├── loose-diamonds/   # Specific module for loose diamonds
│   ├── memos/            # Memo (consignment) generation and tracking
│   ├── sales/            # Sales tracking and invoice generation
│   └── styles/           # Global and modular CSS/SCSS
├── public/               # Static assets (images, fonts)
├── .env.local            # Environment variables (not tracked in git)
├── package.json          # Project metadata and dependencies
└── README.md             # Project documentation
```

## Architecture Notes

Diamond Tech leverages the Next.js App Router paradigm, utilizing Server Components for optimized data fetching and rendering, alongside Client Components for interactive UI elements. The backend logic is encapsulated within Next.js API routes, interfacing with the MySQL database through the Knex.js query builder to ensure efficient query execution and protection against SQL injection.
