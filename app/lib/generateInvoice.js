// app/lib/generateInvoice.js
// Generates a bill by populating bill.html (domestic) or export-bill.html (export) template

// Number-to-words converter for Indian Rupees
function numberToWords(num) {
    if (num === 0) return "ZERO RUPEES ONLY";

    const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
        "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
        "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
    const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

    function convertChunk(n) {
        if (n === 0) return "";
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
        return ones[Math.floor(n / 100)] + " HUNDRED" + (n % 100 ? " " + convertChunk(n % 100) : "");
    }

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = Math.floor(num % 1000);

    let words = "";
    if (crore) words += convertChunk(crore) + " CRORE ";
    if (lakh) words += convertChunk(lakh) + " LAKH ";
    if (thousand) words += convertChunk(thousand) + " THOUSAND ";
    if (remainder) words += convertChunk(remainder);

    return words.trim() + " RUPEES ONLY";
}

// Number-to-words converter for USD
function numberToWordsUSD(num) {
    if (num === 0) return "ZERO US DOLLARS ONLY";

    const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
        "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
        "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
    const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

    function convertChunk(n) {
        if (n === 0) return "";
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
        return ones[Math.floor(n / 100)] + " HUNDRED" + (n % 100 ? " " + convertChunk(n % 100) : "");
    }

    const wholePart = Math.floor(num);
    const centPart = Math.round((num - wholePart) * 100);

    const billion = Math.floor(wholePart / 1000000000);
    const million = Math.floor((wholePart % 1000000000) / 1000000);
    const thousand = Math.floor((wholePart % 1000000) / 1000);
    const remainder = wholePart % 1000;

    let words = "";
    if (billion) words += convertChunk(billion) + " BILLION ";
    if (million) words += convertChunk(million) + " MILLION ";
    if (thousand) words += convertChunk(thousand) + " THOUSAND ";
    if (remainder) words += convertChunk(remainder);

    words = words.trim() + " US DOLLARS";
    if (centPart > 0) words += " AND " + convertChunk(centPart) + " CENTS";
    return words + " ONLY";
}

function formatDate(date) {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function getFinancialYear(date) {
    const d = date ? new Date(date) : new Date();
    const year = d.getFullYear();
    const month = d.getMonth();
    if (month >= 3) return `${year}-${year + 1}`;
    return `${year - 1}-${year}`;
}

function formatNumber(num) {
    const n = parseFloat(num) || 0;
    return n.toFixed(2);
}

// ─── DOMESTIC INVOICE ────────────────────────────────────────────────────────

function generateDomesticInvoice(sale, paymentMode) {
    const saleAmountINR = parseFloat(sale.sale_amount_inr) || 0;
    const weight = parseFloat(sale.diamond?.weight) || 0;
    const ratePerCarat = weight > 0 ? saleAmountINR / weight : 0;

    const cgstAmount = saleAmountINR * 0.0075;
    const sgstAmount = saleAmountINR * 0.0075;
    const totalBeforeRound = saleAmountINR + cgstAmount + sgstAmount;
    const totalRounded = Math.round(totalBeforeRound);
    const roundOff = (totalRounded - totalBeforeRound).toFixed(2);

    const sellingDate = sale.selling_date || sale.created_at || new Date();
    const invoiceDate = formatDate(sellingDate);
    const financialYear = getFinancialYear(sellingDate);
    const invoiceNo = `LS/${sale.id}/${financialYear}`;

    const client = sale.client || {};
    const buyerName = client.company_name || client.contact_name || "N/A";
    const buyerAddress = client.reg_address || client.bdb_address || "N/A";
    const buyerGST = client.gst_no || client.gst_number || "N/A";
    const buyerPAN = client.pan_no || client.pan_number || "N/A";

    const consigneeCity = client.city || "SURAT";
    const consigneeState = client.state || "GUJARAT";
    const consigneeInfo = `DIRECT - PARCEL<br>${consigneeCity}, ${consigneeState}`;

    const termsDays = sale.terms_days || "N/A";
    const amountInWords = numberToWords(totalRounded);

    const replacements = {
        "{{INVOICE_DATE}}": invoiceDate,
        "{{INVOICE_NO}}": invoiceNo,
        "{{FINANCIAL_YEAR}}": financialYear,
        "{{CONSIGNEE_INFO}}": consigneeInfo,
        "{{BUYER_NAME}}": buyerName,
        "{{BUYER_ADDRESS}}": buyerAddress,
        "{{BUYER_GST}}": buyerGST,
        "{{BUYER_PAN}}": buyerPAN,
        "{{TERMS_DAYS}}": String(termsDays),
        "{{DIAMOND_WEIGHT}}": formatNumber(weight),
        "{{RATE_PER_CARAT}}": formatNumber(ratePerCarat),
        "{{NET_AMOUNT}}": formatNumber(saleAmountINR),
        "{{CGST_AMOUNT}}": formatNumber(cgstAmount),
        "{{SGST_AMOUNT}}": formatNumber(sgstAmount),
        "{{ROUND_OFF}}": roundOff,
        "{{TOTAL_BILL_AMOUNT}}": formatNumber(totalRounded),
        "{{AMOUNT_IN_WORDS}}": amountInWords + ".",
        "{{PAYMENT_MODE}}": paymentMode || "N/A",
    };

    return { template: "/bill.html", replacements, invoiceNo };
}

// ─── EXPORT INVOICE ───────────────────────────────────────────────────────────

function generateExportInvoice(sale, paymentMode) {
    const client = sale.client || {};
    const diamond = sale.diamond || {};

    // Simplified: Export invoices also in INR as per user request
    const currencySymbol = "₹";
    const saleAmount = parseFloat(sale.sale_amount_inr || sale.sale_amount) || 0;

    const weight = parseFloat(diamond.weight) || 0;
    const ratePerCarat = weight > 0 ? saleAmount / weight : 0;

    const sellingDate = sale.selling_date || sale.created_at || new Date();
    const invoiceDate = formatDate(sellingDate);
    const financialYear = getFinancialYear(sellingDate);

    // Export invoice number: EXPLP/saleId/YY-YY
    const fyShort = financialYear.slice(2, 4) + "-" + financialYear.slice(-2); // "25-26" from "2025-2026"
    const invoiceNo = `EXPLP/${sale.id}/${fyShort}`;

    const buyerName = client.company_name || client.contact_name || "N/A";
    const buyerAddress = client.reg_address || client.bdb_address || "N/A";
    const buyerCity = client.city || client.billing_city || client.shipping_city || client.destination_city || "N/A";
    const buyerCountry = client.country || client.billing_country || client.destination_country || "N/A";

    const totalPcs = diamond.pieces || 1;
    const amountInWords = numberToWords(saleAmount);


    // Diamond details
    const shape = diamond.shape || "ROUND FANCY";
    const color = diamond.color || "";
    const clarity = diamond.clarity || "";
    const measurement = diamond.measurement || "AS PER PL";

    const replacements = {
        "{{INVOICE_DATE}}": invoiceDate,
        "{{INVOICE_NO}}": invoiceNo,
        "{{FINANCIAL_YEAR}}": financialYear,
        "{{BUYER_NAME}}": buyerName,
        "{{BUYER_ADDRESS}}": buyerAddress,
        "{{BUYER_CITY}}": buyerCity,
        "{{BUYER_COUNTRY}}": buyerCountry,
        "{{BUYER_GST}}": client.gst_no || client.gst_number || "N/A",
        "{{BUYER_PAN}}": client.pan_no || client.pan_number || "N/A",
        "{{TERMS_DAYS}}": String(termsDays),
        "{{CURRENCY_SYMBOL}}": currencySymbol,
        "{{DIAMOND_WEIGHT}}": formatNumber(weight),
        "{{DIAMOND_SHAPE}}": shape,
        "{{DIAMOND_COLOR}}": color,
        "{{DIAMOND_CLARITY}}": clarity,
        "{{DIAMOND_MEASUREMENT}}": measurement,
        "{{DIAMOND_CERT}}": diamond.certificate_number || "N/A",
        "{{DIAMOND_PCS}}": String(totalPcs),
        "{{BUYER_PHONE}}": client.phone || client.contact_phone || "N/A",
        "{{GROSS_WEIGHT}}": formatNumber(parseFloat(diamond.gross_weight) || 0),
        "{{RATE_PER_CARAT}}": formatNumber(ratePerCarat),
        "{{SALE_AMOUNT}}": formatNumber(saleAmount),
        "{{AMOUNT_IN_WORDS}}": amountInWords,
        "{{PAYMENT_MODE}}": paymentMode || "N/A",
    };

    return { template: "/export-bill.html", replacements, invoiceNo };
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

/**
 * @param {object} sale   - Sale object with client, diamond, etc.
 * @param {string} paymentMode - e.g. "Cash" | "Online - UPI" | "Export"
 */
export function generateInvoicePDF(sale, paymentMode = "") {
    const isExport = paymentMode === "Export";

    const { template, replacements, invoiceNo } = isExport
        ? generateExportInvoice(sale, paymentMode)
        : generateDomesticInvoice(sale, paymentMode);

    fetch(`${template}?v=${Date.now()}`, { cache: "no-store" })
        .then((res) => {
            if (!res.ok) throw new Error(`Could not load template: ${template}`);
            return res.text();
        })
        .then((html) => {
            let populated = html;
            for (const [placeholder, value] of Object.entries(replacements)) {
                populated = populated.split(placeholder).join(value);
            }

            const newTab = window.open("", "_blank");
            if (newTab) {
                newTab.document.write(populated);
                newTab.document.close();
            } else {
                alert("Please allow popups to view the invoice.");
            }
        })
        .catch((err) => {
            console.error("Invoice generation error:", err);
            alert("Failed to generate invoice: " + err.message);
        });

    return invoiceNo;
}