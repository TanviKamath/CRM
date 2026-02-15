// app/lib/generateInvoice.js
// Generates a bill by populating bill.html template and opening in a new tab

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

    // Indian number system: lakhs and crores
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
    const month = d.getMonth(); // 0-indexed
    if (month >= 3) { // April onwards
        return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
}

function formatNumber(num) {
    const n = parseFloat(num) || 0;
    return n.toFixed(2);
}

export function generateInvoicePDF(sale) {
    // Calculations
    const saleAmountINR = parseFloat(sale.sale_amount_inr) || 0;
    const weight = parseFloat(sale.diamond?.weight) || 0;
    const ratePerCarat = weight > 0 ? saleAmountINR / weight : 0;

    // GST at 1.5% (CGST 0.75% + SGST 0.75%)
    const cgstAmount = saleAmountINR * 0.0075;
    const sgstAmount = saleAmountINR * 0.0075;
    const totalBeforeRound = saleAmountINR + cgstAmount + sgstAmount;
    const totalRounded = Math.round(totalBeforeRound);
    const roundOff = (totalRounded - totalBeforeRound).toFixed(2);

    const sellingDate = sale.selling_date || sale.created_at || new Date();
    const invoiceDate = formatDate(sellingDate);
    const financialYear = getFinancialYear(sellingDate);

    // Invoice number: LS/SaleID/FY
    const fyShort = financialYear.replace("-", "-");
    const invoiceNo = `LS/${sale.id}/${fyShort}`;

    // Client info
    const client = sale.client || {};
    const buyerName = client.company_name || client.contact_name || "N/A";

    // Build buyer address from available fields
    const buyerAddress = client.reg_address || client.bdb_address || "N/A";

    const buyerGST = client.gst_no || client.gst_number || "N/A";
    const buyerPAN = client.pan_no || client.pan_number || "N/A";

    // Consignee info
    const consigneeCity = client.city || "SURAT";
    const consigneeState = client.state || "GUJARAT";
    const consigneeInfo = `DIRECT - PARCEL<br>${consigneeCity}, ${consigneeState}`;

    // Terms
    const termsDays = sale.terms_days || "N/A";

    // Amount in words
    const amountInWords = numberToWords(totalRounded);

    // Build the replacements map
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
    };

    // Fetch the bill.html template and populate it
    fetch("/bill.html")
        .then((res) => {
            if (!res.ok) throw new Error("Could not load bill template");
            return res.text();
        })
        .then((html) => {
            // Replace all placeholders
            let populated = html;
            for (const [placeholder, value] of Object.entries(replacements)) {
                populated = populated.split(placeholder).join(value);
            }

            // Open in a new tab
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