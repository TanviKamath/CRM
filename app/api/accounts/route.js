// app/api/accounts/route.js
import knex from "../../lib/db";  // Fixed import path
import ExcelJS from "exceljs";

// Helper function to parse date range based on selection type
function getDateRange(searchParams) {
    const selectionType = searchParams.get("selection_type");
    let startDate, endDate;

    switch (selectionType) {
        case "dateRange":
            startDate = searchParams.get("start_date");
            endDate = searchParams.get("end_date");
            break;

        case "financialYear":
            const year = parseInt(searchParams.get("financial_year"));
            // Indian Financial Year: April 1st to March 31st
            startDate = `${year}-04-01`;
            endDate = `${year + 1}-03-31`;
            break;

        case "quarter":
            const fyYear = parseInt(searchParams.get("financial_year"));
            const quarter = searchParams.get("quarter");

            switch (quarter) {
                case "Q1":
                    startDate = `${fyYear}-04-01`;
                    endDate = `${fyYear}-06-30`;
                    break;
                case "Q2":
                    startDate = `${fyYear}-07-01`;
                    endDate = `${fyYear}-09-30`;
                    break;
                case "Q3":
                    startDate = `${fyYear}-10-01`;
                    endDate = `${fyYear}-12-31`;
                    break;
                case "Q4":
                    startDate = `${fyYear + 1}-01-01`;
                    endDate = `${fyYear + 1}-03-31`;
                    break;
            }
            break;

        default:
            return { startDate: null, endDate: null, error: "Invalid selection type" };
    }

    return { startDate, endDate, error: null };
}

// Format date to DD-MM-YYYY
function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        // Check if this is an export request
        const action = searchParams.get("action");

        if (action === "export") {
            return handleExport(searchParams);
        }

        // Default: return account summary or other data
        return Response.json({ message: "Accounts API" }, { status: 200 });
    } catch (e) {
        console.error("API Error:", e);
        return Response.json(
            { error: e.message || "Something went wrong" },
            { status: 500 }
        );
    }
}

async function handleExport(searchParams) {
    try {
        const { startDate, endDate, error } = getDateRange(searchParams);

        if (error || !startDate || !endDate) {
            return Response.json(
                { error: error || "Invalid date range" },
                { status: 400 }
            );
        }

        console.log("Exporting data from", startDate, "to", endDate);

        // Array to hold all transactions
        let transactions = [];

        // 1. Get Expenses (Debits)
        try {
            const expenses = await knex("expenses")
                .whereBetween("expense_date", [startDate, endDate])
                .select(
                    "expense_date as date",
                    "paid_to",
                    "description",
                    "category",
                    "amount"
                )
                .orderBy("expense_date", "asc");

            console.log("Expenses found:", expenses.length);

            expenses.forEach((expense) => {
                let entityName = expense.paid_to || expense.description || "Unknown";
                const categoryFormatted = (expense.category || "other")
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                entityName += ` (${categoryFormatted})`;

                transactions.push({
                    date: new Date(expense.date),
                    entity_name: entityName,
                    credit: null,
                    debit: parseFloat(expense.amount) || 0,
                    type: "expense",
                });
            });
        } catch (err) {
            console.error("Error fetching expenses:", err.message);
        }

        // 2. Get Payment Outstanding (Debits - Diamond Purchase Payments)
        try {
            const purchasePayments = await knex("payment_outstanding")
                .join("diamonds", "payment_outstanding.diamond_id", "=", "diamonds.id")
                .whereBetween("payment_outstanding.created_at", [
                    `${startDate} 00:00:00`,
                    `${endDate} 23:59:59`,
                ])
                .select(
                    "payment_outstanding.created_at as date",
                    "diamonds.purchase_from",
                    "diamonds.certificate_number",
                    "payment_outstanding.payment_amount_done as amount"
                );

            console.log("Purchase payments found:", purchasePayments.length);

            purchasePayments.forEach((payment) => {
                let entityName = payment.purchase_from || "Unknown Supplier";
                if (payment.certificate_number) {
                    entityName += ` (Cert: ${payment.certificate_number})`;
                }
                entityName += " - Diamond Purchase Payment";

                transactions.push({
                    date: new Date(payment.date),
                    entity_name: entityName,
                    credit: null,
                    debit: parseFloat(payment.amount) || 0,
                    type: "purchase_payment",
                });
            });
        } catch (err) {
            console.error("Error fetching purchase payments:", err.message);
        }

        // 3. Get Sale Payments (Credits - Income from Sales)
        try {
            const salePayments = await knex("sale_payments")
                .join("sales", "sale_payments.sale_id", "=", "sales.id")
                .join("clients", "sales.client_id", "=", "clients.id")
                .whereBetween("sale_payments.created_at", [
                    `${startDate} 00:00:00`,
                    `${endDate} 23:59:59`,
                ])
                .select(
                    "sale_payments.created_at as date",
                    "sale_payments.payment_date",
                    "clients.company_name",
                    "clients.contact_name",
                    "sale_payments.payment_amount_done as amount",
                    "sale_payments.reference"
                );

            console.log("Sale payments found:", salePayments.length);

            salePayments.forEach((payment) => {
                let entityName = payment.company_name || payment.contact_name || "Unknown Client";
                if (payment.reference) {
                    entityName += ` (Ref: ${payment.reference})`;
                }
                entityName += " - Sale Payment Received";

                const date = payment.payment_date
                    ? new Date(payment.payment_date)
                    : new Date(payment.date);

                transactions.push({
                    date: date,
                    entity_name: entityName,
                    credit: parseFloat(payment.amount) || 0,
                    debit: null,
                    type: "sale_payment",
                });
            });
        } catch (err) {
            console.error("Error fetching sale payments:", err.message);
        }

        console.log("Total transactions:", transactions.length);

        // Sort all transactions by date (chronological order)
        transactions.sort((a, b) => a.date - b.date);

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Diamond Tech";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet("Account Statement", {
            pageSetup: { paperSize: 9, orientation: "landscape" },
        });

        // Add title row
        worksheet.mergeCells("A1:E1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = `Account Statement: ${formatDate(startDate)} to ${formatDate(endDate)}`;
        titleCell.font = { bold: true, size: 16, color: { argb: "FF1F4E79" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(1).height = 30;

        // Add empty row
        worksheet.addRow([]);

        // Add header row
        const headerRow = worksheet.addRow([
            "Date",
            "Entity Name",
            "Credit (₹)",
            "Debit (₹)",
            "Balance (₹)",
        ]);

        // Style header row
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF4472C4" },
            };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });
        headerRow.height = 25;

        // Add data rows with running balance
        let runningBalance = 0;
        let totalCredit = 0;
        let totalDebit = 0;

        if (transactions.length === 0) {
            const noDataRow = worksheet.addRow([
                "",
                "No transactions found for the selected period",
                "",
                "",
                "",
            ]);
            noDataRow.getCell(2).font = { italic: true, color: { argb: "FF666666" } };
            noDataRow.getCell(2).alignment = { horizontal: "center" };
            worksheet.mergeCells(`A${noDataRow.number}:E${noDataRow.number}`);
        } else {
            transactions.forEach((transaction, index) => {
                const credit = transaction.credit || 0;
                const debit = transaction.debit || 0;
                runningBalance = runningBalance + credit - debit;
                totalCredit += credit;
                totalDebit += debit;

                const row = worksheet.addRow([
                    formatDate(transaction.date),
                    transaction.entity_name,
                    credit > 0 ? credit : "",
                    debit > 0 ? debit : "",
                    runningBalance,
                ]);

                row.eachCell((cell, colNumber) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                    cell.alignment = { vertical: "middle" };

                    if (colNumber >= 3 && colNumber <= 5) {
                        cell.alignment = { horizontal: "right", vertical: "middle" };
                        if (typeof cell.value === "number") {
                            cell.numFmt = "₹#,##0.00";
                        }
                    }

                    if (colNumber === 3 && cell.value !== "") {
                        cell.font = { color: { argb: "FF008000" } };
                    }

                    if (colNumber === 4 && cell.value !== "") {
                        cell.font = { color: { argb: "FFFF0000" } };
                    }

                    if (colNumber === 5) {
                        const balanceValue = typeof cell.value === "number" ? cell.value : runningBalance;
                        if (balanceValue < 0) {
                            cell.font = { color: { argb: "FFFF0000" } };
                        } else {
                            cell.font = { color: { argb: "FF008000" } };
                        }
                    }
                });

                if (index % 2 === 0) {
                    row.eachCell((cell) => {
                        if (!cell.fill || cell.fill.type !== "pattern") {
                            cell.fill = {
                                type: "pattern",
                                pattern: "solid",
                                fgColor: { argb: "FFF2F2F2" },
                            };
                        }
                    });
                }
            });
        }

        worksheet.addRow([]);

        const totalsRow = worksheet.addRow([
            "TOTAL",
            "",
            totalCredit,
            totalDebit,
            totalCredit - totalDebit,
        ]);

        totalsRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true, size: 12 };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE2EFDA" },
            };
            cell.border = {
                top: { style: "medium" },
                left: { style: "thin" },
                bottom: { style: "medium" },
                right: { style: "thin" },
            };
            cell.alignment = { vertical: "middle" };

            if (colNumber >= 3 && colNumber <= 5) {
                cell.alignment = { horizontal: "right", vertical: "middle" };
                cell.numFmt = "₹#,##0.00";
            }
        });
        totalsRow.height = 25;

        // Set column widths
        worksheet.getColumn(1).width = 15;
        worksheet.getColumn(2).width = 55;
        worksheet.getColumn(3).width = 18;
        worksheet.getColumn(4).width = 18;
        worksheet.getColumn(5).width = 18;

        // Generate Excel buffer
        const buffer = await workbook.xlsx.writeBuffer();

        const filename = `account_statement_${startDate}_to_${endDate}.xlsx`;

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (e) {
        console.error("Export Error:", e);
        return Response.json(
            { error: e.message || "Failed to generate export" },
            { status: 500 }
        );
    }
}