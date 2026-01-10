// app/api/accounts/route.js
import knex from "../../lib/db";
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
    if (isNaN(d.getTime())) return "";
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

        console.log("=".repeat(50));
        console.log("Exporting data from", startDate, "to", endDate);
        console.log("=".repeat(50));

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
                .leftJoin("diamonds", "sales.diamond_id", "=", "diamonds.id")
                .where(function () {
                    // Use payment_date if available, otherwise created_at
                    this.whereBetween("sale_payments.payment_date", [startDate, endDate])
                        .orWhere(function () {
                            this.whereNull("sale_payments.payment_date")
                                .andWhereBetween("sale_payments.created_at", [
                                    `${startDate} 00:00:00`,
                                    `${endDate} 23:59:59`,
                                ]);
                        });
                })
                // ✅ Exclude advance payments (they are handled separately)
                .where(function () {
                    this.whereNull("sale_payments.payment_method")
                        .orWhereNot("sale_payments.payment_method", "advance");
                })
                .select(
                    "sale_payments.id as payment_id",
                    "sale_payments.created_at as date",
                    "sale_payments.payment_date",
                    "sale_payments.payment_method",
                    "clients.company_name",
                    "clients.contact_name",
                    "diamonds.certificate_number",
                    "diamonds.weight",
                    "diamonds.shape",
                    "sale_payments.payment_amount_done as amount",
                    "sale_payments.reference",
                    "sale_payments.notes"
                );

            console.log("Sale payments found:", salePayments.length);

            salePayments.forEach((payment) => {
                let entityName = payment.company_name || payment.contact_name || "Unknown Client";

                // Add diamond info if available
                if (payment.certificate_number) {
                    entityName += ` (Cert: ${payment.certificate_number})`;
                } else if (payment.shape && payment.weight) {
                    entityName += ` (${payment.shape} ${payment.weight}ct)`;
                }

                // Add reference if available
                if (payment.reference) {
                    entityName += ` - Ref: ${payment.reference}`;
                }

                // Add payment method
                const methodLabel = payment.payment_method
                    ? payment.payment_method.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
                    : "Payment";
                entityName += ` - ${methodLabel} Received`;

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

        // ✅ 4. Get Advance Payments from Sales (Credits - Income)
        try {
            console.log("\n--- Fetching Advance Payments ---");

            // Build query step by step for better debugging
            const advanceQuery = knex("sales")
                .leftJoin("diamonds", "sales.diamond_id", "=", "diamonds.id")
                .leftJoin("clients", "sales.client_id", "=", "clients.id")
                .where("sales.advance_amount", ">", 0)
                .select(
                    "sales.id as sale_id",
                    "sales.selling_date",
                    "sales.created_at",
                    "sales.advance_amount",
                    "sales.sale_amount",
                    "sales.diamond_id",
                    "sales.client_id",
                    "diamonds.certificate_number",
                    "diamonds.weight",  // ✅ Fixed: was 'carat', should be 'weight'
                    "diamonds.shape",
                    "diamonds.color",
                    "diamonds.clarity",
                    "clients.company_name",
                    "clients.contact_name"
                );

            // Get ALL sales with advance amount first (for debugging)
            const allAdvances = await advanceQuery.clone();
            console.log("Total sales with advance > 0:", allAdvances.length);

            if (allAdvances.length > 0) {
                console.log("Sample advance record:", JSON.stringify(allAdvances[0], null, 2));
            }

            // Now filter by date range
            // Use selling_date as primary, fallback to created_at
            const advancePayments = await knex("sales")
                .leftJoin("diamonds", "sales.diamond_id", "=", "diamonds.id")
                .leftJoin("clients", "sales.client_id", "=", "clients.id")
                .where("sales.advance_amount", ">", 0)
                .where(function () {
                    // Check selling_date first
                    this.whereBetween("sales.selling_date", [startDate, endDate])
                        // Or if selling_date is null, check created_at
                        .orWhere(function () {
                            this.whereNull("sales.selling_date")
                                .andWhereBetween(knex.raw("DATE(sales.created_at)"), [startDate, endDate]);
                        });
                })
                .select(
                    "sales.id as sale_id",
                    "sales.selling_date",
                    "sales.created_at",
                    "sales.advance_amount",
                    "sales.sale_amount",
                    "sales.payment_status",
                    "sales.diamond_id",
                    "sales.client_id",
                    "diamonds.certificate_number",
                    "diamonds.weight",  // ✅ Fixed column name
                    "diamonds.shape",
                    "diamonds.color",
                    "diamonds.clarity",
                    "clients.company_name",
                    "clients.contact_name"
                );

            console.log("Advance payments in date range:", advancePayments.length);

            advancePayments.forEach((payment, index) => {
                console.log(`\nProcessing advance #${index + 1}:`, {
                    sale_id: payment.sale_id,
                    advance_amount: payment.advance_amount,
                    selling_date: payment.selling_date,
                    created_at: payment.created_at,
                    client: payment.company_name
                });

                // Build client name
                let clientName = payment.company_name || payment.contact_name || "Unknown Client";

                // Build diamond description
                let diamondInfo = "";
                if (payment.certificate_number) {
                    diamondInfo = `Cert: ${payment.certificate_number}`;
                } else if (payment.shape && payment.weight) {
                    diamondInfo = `${payment.shape} ${payment.weight}ct`;
                    if (payment.color && payment.clarity) {
                        diamondInfo += ` ${payment.color}/${payment.clarity}`;
                    }
                } else if (payment.diamond_id) {
                    diamondInfo = `Diamond #${payment.diamond_id}`;
                }

                let entityName = clientName;
                if (diamondInfo) {
                    entityName += ` (${diamondInfo})`;
                }
                entityName += " - Advance Payment Received";

                // Use selling_date if available, otherwise use created_at
                let transactionDate;
                if (payment.selling_date) {
                    transactionDate = new Date(payment.selling_date);
                } else {
                    transactionDate = new Date(payment.created_at);
                }

                // Validate date
                if (isNaN(transactionDate.getTime())) {
                    console.warn(`Invalid date for sale #${payment.sale_id}, using current date`);
                    transactionDate = new Date();
                }

                const advanceAmount = parseFloat(payment.advance_amount) || 0;

                if (advanceAmount > 0) {
                    transactions.push({
                        date: transactionDate,
                        entity_name: entityName,
                        credit: advanceAmount,
                        debit: null,
                        type: "advance_payment",
                    });

                    console.log(`✅ Added advance transaction:`, {
                        sale_id: payment.sale_id,
                        date: formatDate(transactionDate),
                        amount: advanceAmount,
                        entity: entityName.substring(0, 50) + "..."
                    });
                }
            });

            console.log("--- End Advance Payments ---\n");

        } catch (err) {
            console.error("Error fetching advance payments:", err);
            console.error("Full error stack:", err.stack);
        }

        // ✅ 5. Also check sale_payments table for advance type payments
        try {
            console.log("\n--- Fetching Advance Payments from sale_payments table ---");

            const advanceFromPaymentsTable = await knex("sale_payments")
                .join("sales", "sale_payments.sale_id", "=", "sales.id")
                .join("clients", "sales.client_id", "=", "clients.id")
                .leftJoin("diamonds", "sales.diamond_id", "=", "diamonds.id")
                .where("sale_payments.payment_method", "=", "advance")
                .where(function () {
                    this.whereBetween("sale_payments.payment_date", [startDate, endDate])
                        .orWhere(function () {
                            this.whereNull("sale_payments.payment_date")
                                .andWhereBetween("sale_payments.created_at", [
                                    `${startDate} 00:00:00`,
                                    `${endDate} 23:59:59`,
                                ]);
                        });
                })
                .select(
                    "sale_payments.id as payment_id",
                    "sale_payments.sale_id",
                    "sale_payments.payment_date",
                    "sale_payments.created_at",
                    "sale_payments.payment_amount_done as amount",
                    "sale_payments.notes",
                    "diamonds.certificate_number",
                    "diamonds.weight",
                    "diamonds.shape",
                    "clients.company_name",
                    "clients.contact_name"
                );

            console.log("Advance payments from sale_payments table:", advanceFromPaymentsTable.length);

            advanceFromPaymentsTable.forEach((payment) => {
                let clientName = payment.company_name || payment.contact_name || "Unknown Client";

                let diamondInfo = "";
                if (payment.certificate_number) {
                    diamondInfo = `Cert: ${payment.certificate_number}`;
                } else if (payment.shape && payment.weight) {
                    diamondInfo = `${payment.shape} ${payment.weight}ct`;
                }

                let entityName = clientName;
                if (diamondInfo) {
                    entityName += ` (${diamondInfo})`;
                }
                entityName += " - Advance Payment Received";

                const transactionDate = payment.payment_date
                    ? new Date(payment.payment_date)
                    : new Date(payment.created_at);

                transactions.push({
                    date: transactionDate,
                    entity_name: entityName,
                    credit: parseFloat(payment.amount) || 0,
                    debit: null,
                    type: "advance_payment_record",
                });

                console.log(`✅ Added advance from sale_payments:`, {
                    payment_id: payment.payment_id,
                    amount: payment.amount
                });
            });

        } catch (err) {
            console.error("Error fetching advance from sale_payments:", err.message);
        }

        console.log("=".repeat(50));
        console.log("TRANSACTION SUMMARY:");
        console.log("- Expenses:", transactions.filter(t => t.type === "expense").length);
        console.log("- Purchase Payments:", transactions.filter(t => t.type === "purchase_payment").length);
        console.log("- Sale Payments:", transactions.filter(t => t.type === "sale_payment").length);
        console.log("- Advance Payments (from sales):", transactions.filter(t => t.type === "advance_payment").length);
        console.log("- Advance Payments (from records):", transactions.filter(t => t.type === "advance_payment_record").length);
        console.log("- TOTAL:", transactions.length);
        console.log("=".repeat(50));

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

        // Add summary row
        const summaryRow = worksheet.addRow([
            `Total Transactions: ${transactions.length}`,
            "",
            "",
            "",
            ""
        ]);
        summaryRow.getCell(1).font = { italic: true, color: { argb: "FF666666" } };
        worksheet.addRow([]);

        // Add header row
        const headerRow = worksheet.addRow([
            "Date",
            "Entity Name / Description",
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

                    // Green for credits
                    if (colNumber === 3 && cell.value !== "") {
                        cell.font = { color: { argb: "FF008000" } };
                    }

                    // Red for debits
                    if (colNumber === 4 && cell.value !== "") {
                        cell.font = { color: { argb: "FFFF0000" } };
                    }

                    // Balance color
                    if (colNumber === 5) {
                        const balanceValue = typeof cell.value === "number" ? cell.value : runningBalance;
                        if (balanceValue < 0) {
                            cell.font = { color: { argb: "FFFF0000" } };
                        } else {
                            cell.font = { color: { argb: "FF008000" } };
                        }
                    }
                });

                // Alternate row coloring
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

                // Highlight advance payments with a subtle green background
                if (transaction.type === "advance_payment" || transaction.type === "advance_payment_record") {
                    row.eachCell((cell) => {
                        cell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: "FFE2F0D9" }, // Light green
                        };
                    });
                }
            });
        }

        // Add empty row before totals
        worksheet.addRow([]);

        // Add totals row
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
        worksheet.getColumn(1).width = 15;  // Date
        worksheet.getColumn(2).width = 60;  // Entity Name (wider for advance details)
        worksheet.getColumn(3).width = 18;  // Credit
        worksheet.getColumn(4).width = 18;  // Debit
        worksheet.getColumn(5).width = 18;  // Balance

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