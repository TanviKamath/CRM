// Single-stone sales are priced in USD. When a USD → INR rate was entered the sale is tracked in
// rupees (sale_amount_inr is the converted total). When the rate was left blank, conversion_rate is
// NULL and the sale is tracked in dollars: sale_amount_inr then simply holds the dollar total, so
// payments and outstanding balances work in the same currency. Older sales stored conversion_rate = 1
// and loose-parcel sales are always rupees.
export const isUsdSale = (sale) =>
  !!sale && !sale.loose_diamond_item_id && !sale.loose_item && sale.conversion_rate === null;

export const saleSymbol = (sale) => (isUsdSale(sale) ? "$" : "₹");

export const money = (value, symbol = "₹") => {
  if (value === null || value === undefined || value === "") return "-";
  const n = parseFloat(value);
  if (Number.isNaN(n)) return "-";
  return `${symbol}${n.toLocaleString(symbol === "$" ? "en-US" : "en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// "₹1,41,950.00 + $307.04" for totals that may mix both currencies.
export const moneyPair = (inr, usd) => {
  const parts = [];
  if (inr > 0 || usd <= 0) parts.push(money(inr, "₹"));
  if (usd > 0) parts.push(money(usd, "$"));
  return parts.join(" + ");
};
