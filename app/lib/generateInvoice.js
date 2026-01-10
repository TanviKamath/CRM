// app/lib/generateInvoice.js
import { jsPDF } from "jspdf";

// Company Details
const COMPANY = {
    name: "Diamond Tech Pvt. Ltd.",
    address: "123 Diamond Plaza, Mira Road, Maharashtra - 401107, India",
    phone: "+91 98765 43210",
    email: "sales@diamondtech.com",
    gst: "24ABCDE1234F1Z5",
    pan: "ABCDE1234F",
    bankName: "HDFC Bank",
    bankAccount: "1234567890123",
    bankIfsc: "HDFC0001234",
};

// GST Rate
const GST_RATE = 18;

function formatDate(date) {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatINR(amount) {
    const num = parseFloat(amount) || 0;
    // Format without currency symbol first, then add Rupee symbol
    const formatted = num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return "Rs. " + formatted;
}

export function generateInvoicePDF(sale) {
    const doc = new jsPDF();

    // Calculations - GST on TOP of sale amount
    const saleAmountINR = parseFloat(sale.sale_amount_inr) || 0;
    const gstAmount = saleAmountINR * (GST_RATE / 100);
    const totalWithGST = saleAmountINR + gstAmount;

    // Invoice number
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(sale.id).padStart(5, "0")}`;

    let y = 20;

    // === COMPANY HEADER ===
    doc.setFontSize(20);
    doc.setTextColor(26, 54, 93);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, 20, y);

    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(COMPANY.address, 20, y);
    y += 4;
    doc.text("Phone: " + COMPANY.phone + " | Email: " + COMPANY.email, 20, y);
    y += 4;
    doc.text("GSTIN: " + COMPANY.gst + " | PAN: " + COMPANY.pan, 20, y);

    // === INVOICE TITLE ===
    doc.setFontSize(22);
    doc.setTextColor(49, 130, 206);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 190, 25, { align: "right" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Invoice No: " + invoiceNo, 190, 35, { align: "right" });
    doc.text("Date: " + formatDate(new Date()), 190, 42, { align: "right" });
    doc.text("Sale Date: " + formatDate(sale.selling_date), 190, 49, { align: "right" });

    // Line
    y = 55;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);

    // === BILL TO ===
    y = 65;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text("BILL TO:", 20, y);

    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);

    const client = sale.client || {};

    if (client.company_name) {
        doc.setFont("helvetica", "bold");
        doc.text(client.company_name, 20, y);
        y += 5;
        doc.setFont("helvetica", "normal");
    }

    if (client.contact_name) {
        doc.text(client.contact_name, 20, y);
        y += 5;
    }

    if (client.address) {
        doc.text(client.address, 20, y);
        y += 5;
    }

    if (client.city || client.state) {
        const location = [client.city, client.state, client.country].filter(Boolean).join(", ");
        doc.text(location, 20, y);
        y += 5;
    }

    if (client.phone) {
        doc.text("Phone: " + client.phone, 20, y);
        y += 5;
    }

    if (client.email) {
        doc.text("Email: " + client.email, 20, y);
        y += 5;
    }

    if (client.gst_number) {
        doc.text("GSTIN: " + client.gst_number, 20, y);
        y += 5;
    }

    // === DIAMOND DETAILS ===
    y = Math.max(y + 15, 120);

    doc.setFillColor(26, 54, 93);
    doc.rect(20, y, 170, 8, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("DIAMOND DETAILS", 25, y + 6);

    y += 15;

    const diamond = sale.diamond || {};

    doc.setFontSize(10);

    // Row 1: Shape & Weight
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Shape:", 25, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text(diamond.shape || "N/A", 55, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Weight:", 110, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text(diamond.weight ? diamond.weight + " ct" : "N/A", 140, y);

    y += 7;

    // Row 2: Color & Clarity
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Color:", 25, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text(diamond.color || "N/A", 55, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Clarity:", 110, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text(diamond.clarity || "N/A", 140, y);

    y += 7;

    // Certificate
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Certificate:", 25, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text(diamond.certificate_number || "N/A", 55, y);

    // === PRICING TABLE ===
    y += 20;

    doc.setFillColor(26, 54, 93);
    doc.rect(20, y, 170, 8, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("PRICING DETAILS", 25, y + 6);

    y += 15;

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 4, 170, 8, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text("Description", 25, y);
    doc.text("Amount (INR)", 180, y, { align: "right" });

    y += 12;

    // Sale Amount
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Sale Amount", 25, y);
    doc.text(formatINR(saleAmountINR), 180, y, { align: "right" });

    y += 8;

    // GST
    doc.text("Add: GST @ " + GST_RATE + "%", 25, y);
    doc.text(formatINR(gstAmount), 180, y, { align: "right" });

    y += 5;
    doc.setDrawColor(26, 54, 93);
    doc.setLineWidth(0.5);
    doc.line(25, y, 185, y);
    y += 8;

    // Grand Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 54, 93);
    doc.text("GRAND TOTAL", 25, y);
    doc.text(formatINR(totalWithGST), 180, y, { align: "right" });

    // Double line under total
    y += 3;
    doc.setLineWidth(0.5);
    doc.line(25, y, 185, y);
    y += 1;
    doc.line(25, y, 185, y);

    // === BANK DETAILS ===
    y += 20;
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(20, y, 80, 32, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text("BANK DETAILS", 25, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Bank: " + COMPANY.bankName, 25, y + 16);
    doc.text("A/C: " + COMPANY.bankAccount, 25, y + 23);
    doc.text("IFSC: " + COMPANY.bankIfsc, 25, y + 30);

    // === FOOTER - Fixed at bottom ===
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for your business!", 105, 279, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("This is a computer-generated invoice and does not require a signature.", 105, 283, { align: "center" });

    // Generated date at bottom edge
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text("Generated on " + formatDate(new Date()) + " | " + COMPANY.name, 105, 287, { align: "center" });

    // Save
    doc.save("Invoice_" + invoiceNo + ".pdf");

    return invoiceNo;
}