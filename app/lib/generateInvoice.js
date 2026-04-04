// app/lib/generateInvoice.js
// Generates a bill by populating bill.html or export-bill.html template and opening in a new tab

// ─── Company config from env (NEXT_PUBLIC_ prefix required for client-side) ──
function getCompanyConfig() {
    return {
        "{{COMPANY_NAME}}":          process.env.NEXT_PUBLIC_COMPANY_NAME          || "",
        "{{COMPANY_ADDRESS_LINE1}}": process.env.NEXT_PUBLIC_COMPANY_ADDRESS_LINE1 || "",
        "{{COMPANY_ADDRESS_LINE2}}": process.env.NEXT_PUBLIC_COMPANY_ADDRESS_LINE2 || "",
        "{{COMPANY_ADDRESS_LINE3}}": process.env.NEXT_PUBLIC_COMPANY_ADDRESS_LINE3 || "",
        "{{COMPANY_GST}}":           process.env.NEXT_PUBLIC_COMPANY_GST           || "",
        "{{COMPANY_PAN}}":           process.env.NEXT_PUBLIC_COMPANY_PAN           || "",
        "{{COMPANY_IE_CODE}}":       process.env.NEXT_PUBLIC_COMPANY_IE_CODE       || "",
        "{{COMPANY_PHONE}}":         process.env.NEXT_PUBLIC_COMPANY_PHONE         || "",
        "{{COMPANY_EMAIL}}":         process.env.NEXT_PUBLIC_COMPANY_EMAIL         || "",
        "{{COMPANY_CITY}}":          process.env.NEXT_PUBLIC_COMPANY_CITY          || "",
        "{{COMPANY_PORT_OF_LOADING}}": process.env.NEXT_PUBLIC_COMPANY_PORT_OF_LOADING || "",
        "{{COMPANY_JURISDICTION}}":  process.env.NEXT_PUBLIC_COMPANY_JURISDICTION  || "",
        "{{COMPANY_BANK_NAME}}":     process.env.NEXT_PUBLIC_COMPANY_BANK_NAME     || "",
        "{{COMPANY_BANK_ADDRESS}}":  process.env.NEXT_PUBLIC_COMPANY_BANK_ADDRESS  || "",
        "{{COMPANY_BANK_ACCOUNT}}":  process.env.NEXT_PUBLIC_COMPANY_BANK_ACCOUNT  || "",
        "{{COMPANY_BANK_IFSC}}":     process.env.NEXT_PUBLIC_COMPANY_BANK_IFSC     || "",
    };
}

// Number-to-words converter
function numberToWords(num) {
    if (num === 0) return "ZERO";

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

    return words.trim();
}

function inrToWords(num) {
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    let words = numberToWords(rupees) + " RUPEES";
    if (paise > 0) words += " AND " + numberToWords(paise) + " PAISE";
    return words + " ONLY";
}

function usdToWords(num) {
    const dollars = Math.floor(num);
    const cents = Math.round((num - dollars) * 100);
    let words = numberToWords(dollars) + " DOLLARS";
    if (cents > 0) words += " AND " + numberToWords(cents) + " CENTS";
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

function getModeChar(paymentMode) {
    if (paymentMode === "online") return "O";
    if (paymentMode === "export") return "E";
    return "C";
}

// ─── TAX INVOICE (Cash / Online) ────────────────────────────────────────────
function buildTaxInvoiceReplacements(sale) {
    const saleAmountINR = parseFloat(sale.sale_amount_inr) || 0;
    const weight = parseFloat(sale.sold_carats) || parseFloat(sale.diamond?.weight) || 0;
    const ratePerCarat = weight > 0 ? saleAmountINR / weight : 0;

    const cgstAmount = saleAmountINR * 0.0075;
    const sgstAmount = saleAmountINR * 0.0075;
    const totalBeforeRound = saleAmountINR + cgstAmount + sgstAmount;
    const totalRounded = Math.round(totalBeforeRound);
    const roundOff = (totalRounded - totalBeforeRound).toFixed(2);

    const sellingDate = sale.selling_date || sale.created_at || new Date();
    const invoiceDate = formatDate(sellingDate);
    const financialYear = getFinancialYear(sellingDate);

    const modeChar = getModeChar(sale.payment_mode);
    const seq = sale.invoice_sequence || sale.id;
    const invoiceNo = sale.invoice_number || `LS/${modeChar}/${seq}/${financialYear}`;

    const client = sale.client || {};
    const buyerName = client.company_name || client.contact_name || "N/A";
    const buyerAddress = client.reg_address || client.bdb_address || "N/A";
    const buyerGST = client.gst_no || client.gst_number || "N/A";
    const buyerPAN = client.pan_no || client.pan_number || "N/A";

    const consigneeCity = client.city || "SURAT";
    const consigneeState = client.state || "GUJARAT";
    const consigneeInfo = `DIRECT - PARCEL<br>${consigneeCity}, ${consigneeState}`;

    const termsDays = sale.terms_days || "N/A";
    const paymentMode = sale.payment_mode
        ? sale.payment_mode.charAt(0).toUpperCase() + sale.payment_mode.slice(1)
        : "N/A";

    const amountInWords = inrToWords(totalRounded);

    return {
        ...getCompanyConfig(),  // ← company fields from env
        "{{INVOICE_DATE}}": invoiceDate,
        "{{INVOICE_NO}}": invoiceNo,
        "{{FINANCIAL_YEAR}}": financialYear,
        "{{CONSIGNEE_INFO}}": consigneeInfo,
        "{{BUYER_NAME}}": buyerName,
        "{{BUYER_ADDRESS}}": buyerAddress,
        "{{BUYER_GST}}": buyerGST,
        "{{BUYER_PAN}}": buyerPAN,
        "{{TERMS_DAYS}}": String(termsDays),
        "{{PAYMENT_MODE}}": paymentMode,
        "{{DIAMOND_WEIGHT}}": formatNumber(weight),
        "{{RATE_PER_CARAT}}": formatNumber(ratePerCarat),
        "{{NET_AMOUNT}}": formatNumber(saleAmountINR),
        "{{CGST_AMOUNT}}": formatNumber(cgstAmount),
        "{{SGST_AMOUNT}}": formatNumber(sgstAmount),
        "{{ROUND_OFF}}": roundOff,
        "{{TOTAL_BILL_AMOUNT}}": formatNumber(totalRounded),
        "{{AMOUNT_IN_WORDS}}": amountInWords + ".",
    };
}

// ─── EXPORT INVOICE ──────────────────────────────────────────────────────────
function buildExportInvoiceReplacements(sale) {
    const saleAmountUSD = parseFloat(sale.sale_amount) || 0;
    const weight = parseFloat(sale.sold_carats) || parseFloat(sale.diamond?.weight) || 0;
    const ratePerCarat = weight > 0 ? saleAmountUSD / weight : 0;

    const sellingDate = sale.selling_date || sale.created_at || new Date();
    const invoiceDate = formatDate(sellingDate);
    const financialYear = getFinancialYear(sellingDate);

    const seq = sale.invoice_sequence || sale.id;
    const invoiceNo = sale.invoice_number || `LS/E/${seq}/${financialYear}`;

    const client = sale.client || {};
    const diamond = sale.diamond || {};

    const buyerName = client.company_name || client.contact_name || "N/A";
    const buyerAddress = client.reg_address || client.bdb_address || "N/A";
    const consigneeName = client.company_name || "N/A";
    const consigneeAddress = client.reg_address || client.bdb_address || "N/A";
    const destinationCountry = client.country || "N/A";
    const termsDays = sale.terms_days || "N/A";

    const diamondDesc = [diamond.shape, diamond.color, diamond.clarity]
        .filter(Boolean)
        .join(" / ");

    const amountInWords = usdToWords(saleAmountUSD);

    return {
        ...getCompanyConfig(),  // ← company fields from env
        "{{INVOICE_DATE}}": invoiceDate,
        "{{INVOICE_NO}}": invoiceNo,
        "{{FINANCIAL_YEAR}}": financialYear,
        "{{BUYER_ORDER_NO}}": "N/A",
        "{{OTHER_REF}}": "N/A",
        "{{BUYER_NAME}}": buyerName,
        "{{BUYER_ADDRESS}}": buyerAddress,
        "{{CONSIGNEE_NAME}}": consigneeName,
        "{{CONSIGNEE_ADDRESS}}": consigneeAddress,
        "{{DESTINATION_COUNTRY}}": destinationCountry,
        "{{TERMS_DAYS}}": String(termsDays),
        "{{FLIGHT_NO}}": "N/A",
        "{{PORT_OF_DISCHARGE}}": destinationCountry,
        "{{FINAL_DESTINATION}}": destinationCountry,
        "{{MARKS_NOS}}": `Sale #${sale.id}`,
        "{{PKG_COUNT}}": "1",
        "{{PKG_TYPE}}": "Parcel",
        "{{DIAMOND_DESCRIPTION}}": diamondDesc,
        "{{DIAMOND_WEIGHT}}": formatNumber(weight),
        "{{RATE_PER_CARAT}}": formatNumber(ratePerCarat),
        "{{NET_AMOUNT}}": formatNumber(saleAmountUSD),
        "{{AMOUNT_IN_WORDS}}": amountInWords,
    };
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function generateInvoicePDF(sale) {
    const isExport = sale.payment_mode === "export";
    const templateUrl = isExport ? "/export-bill.html" : "/bill.html";
    const replacements = isExport
        ? buildExportInvoiceReplacements(sale)
        : buildTaxInvoiceReplacements(sale);

    const sellingDate = sale.selling_date || sale.created_at || new Date();
    const financialYear = getFinancialYear(sellingDate);
    const modeChar = getModeChar(sale.payment_mode);
    const seq = sale.invoice_sequence || sale.id;
    const invoiceNo = sale.invoice_number || `LS/${modeChar}/${seq}/${financialYear}`;

    fetch(templateUrl)
        .then((res) => {
            if (!res.ok) throw new Error(`Could not load template: ${templateUrl}`);
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
            console.error("Bill generation error:", err);
            alert("Failed to generate bill: " + err.message);
        });

    return invoiceNo;
}