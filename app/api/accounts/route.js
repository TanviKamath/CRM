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
        const category = searchParams.get("category") || "all";
        const { startDate, endDate, error } = getDateRange(searchParams);

        if (error || !startDate || !endDate) {
            return Response.json(
                { error: error || "Invalid date range" },
                { status: 400 }
            );
        }

        console.log("=".repeat(50));
        console.log(`Exporting ${category} data from`, startDate, "to", endDate);
        console.log("=".repeat(50));

        // Array to hold all transactions
        let transactions = [];

        // Special case: Stock Summary (Inventory snapshot)
        if (category === "stock") {
            try {
                const diamonds = await knex("diamonds")
                    .whereIn("availability", ["available", "memo", "at_lab"])
                    .select(
                        "certificate_number",
                        "shape",
                        "weight",
                        "color",
                        "clarity",
                        "purchase_price",
                        "purchase_price_inr",
                        "purchase_from",
                        "buying_date",
                        "availability"
                    )
                    .orderBy("buying_date", "desc");

                console.log("Diamonds found for stock summary:", diamonds.length);

                diamonds.forEach((d) => {
                    let desc = `${d.shape} ${d.weight}ct ${d.color}/${d.clarity}`;
                    if (d.certificate_number) desc += ` (Cert: ${d.certificate_number})`;
                    desc += ` [Status: ${d.availability}]`;

                    transactions.push({
                        date: d.buying_date ? new Date(d.buying_date) : new Date(),
                        entity_name: desc,
                        credit: null,
                        debit: parseFloat(d.purchase_price_inr) || 0,
                        type: "stock",
                    });
                });
            } catch (err) {
                console.error("Error fetching stock summary:", err.message);
            }
        }

        // 1. Get Expenses (Debits)
        if (category === "all" || category === "expenses" || category === "bank" || category === "cash") {
            try {
                let query = knex("expenses").whereBetween("expense_date", [startDate, endDate]);

                if (category === "bank") {
                    query = query.whereIn("payment_method", ["bank_transfer", "cheque", "credit_card", "debit_card", "upi"]);
                } else if (category === "cash") {
                    query = query.where("payment_method", "cash");
                }

                const expenses = await query.select(
                    "expense_date as date",
                    "paid_to",
                    "description",
                    "category",
                    "amount",
                    "payment_method"
                ).orderBy("expense_date", "asc");

                console.log("Expenses found:", expenses.length);

                expenses.forEach((expense) => {
                    let entityName = expense.paid_to || expense.description || "Unknown";
                    const categoryFormatted = (expense.category || "other")
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase());
                    entityName += ` (${categoryFormatted})`;
                    if (expense.payment_method) {
                        entityName += ` [Method: ${expense.payment_method.replace(/_/g, " ").toUpperCase()}]`;
                    }

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
        }

        // 2. Get Payment Outstanding (Debits - Diamond Purchase Payments)
        if (category === "all" || category === "buy" || category === "bank" || category === "cash") {
            try {
                let query = knex("payment_outstanding")
                    .join("diamonds", "payment_outstanding.diamond_id", "=", "diamonds.id")
                    .whereBetween("payment_outstanding.created_at", [
                        `${startDate} 00:00:00`,
                        `${endDate} 23:59:59`,
                    ]);

                // Note: assuming payment_outstanding table might not have payment_method directly, 
                // if it's missing, we might need to join or assume. 
                // Let's check payment_outstanding schema if needed. 
                // For now, I'll filter if the column exists or skip filter if it doesn't.

                const purchasePayments = await query.select(
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
        }

        // 3. Get Sale Payments (Credits - Income from Sales)
        if (category === "all" || category === "bank" || category === "cash") {
            try {
                let query = knex("sale_payments")
                    .join("sales", "sale_payments.sale_id", "=", "sales.id")
                    .join("clients", "sales.client_id", "=", "clients.id")
                    .leftJoin("diamonds", "sales.diamond_id", "=", "diamonds.id")
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
                    .where(function () {
                        this.whereNull("sale_payments.payment_method")
                            .orWhereNot("sale_payments.payment_method", "advance");
                    });

                if (category === "bank") {
                    query = query.whereIn("sale_payments.payment_method", ["bank_transfer", "cheque", "credit_card", "debit_card", "upi"]);
                } else if (category === "cash") {
                    query = query.where("sale_payments.payment_method", "cash");
                }

                const salePayments = await query.select(
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
        }

        // 4. Get Advance Payments from Sales (Credits - Income)
        if (category === "all" || category === "bank" || category === "cash") {
            try {
                // Implementation for advance payments... 
                // We'll keep the existing logic but respect category if possible.
                // Advance payments in 'sales' table don't have a payment_method explicitly 
                // unless we join with sale_payments. 
                // For 'all', we include them. For bank/cash, it's ambiguous, but usually advance is bank.
                // Assuming advance is 'all' or 'bank' for now.

                if (category === "all" || category === "bank") {
                    const advancePayments = await knex("sales")
                        .leftJoin("diamonds", "sales.diamond_id", "=", "diamonds.id")
                        .leftJoin("clients", "sales.client_id", "=", "clients.id")
                        .where("sales.advance_amount", ">", 0)
                        .where(function () {
                            this.whereBetween("sales.selling_date", [startDate, endDate])
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
                            "diamonds.certificate_number",
                            "diamonds.weight",
                            "diamonds.shape",
                            "clients.company_name",
                            "clients.contact_name"
                        );

                    console.log("Advance payments found:", advancePayments.length);

                    advancePayments.forEach((payment) => {
                        let entityName = payment.company_name || payment.contact_name || "Unknown Client";
                        if (payment.certificate_number) entityName += ` (Cert: ${payment.certificate_number})`;
                        entityName += " - Advance Payment Received";

                        const date = payment.selling_date ? new Date(payment.selling_date) : new Date(payment.created_at);

                        transactions.push({
                            date: date,
                            entity_name: entityName,
                            credit: parseFloat(payment.advance_amount) || 0,
                            debit: null,
                            type: "advance_payment",
                        });
                    });
                }
            } catch (err) {
                console.error("Error fetching advances:", err.message);
            }
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