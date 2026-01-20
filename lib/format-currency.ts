export function formatCompactCurrency(amount: number): string {
    if (amount === 0) return "₹0";

    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);

    let formatted = "";

    if (absAmount >= 10000000) { // 1 Crore
        // format to 2 decimal places max, remove trailing zeros
        const val = absAmount / 10000000;
        formatted = `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
    } else if (absAmount >= 100000) { // 1 Lakh
        const val = absAmount / 100000;
        formatted = `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;
    } else {
        // Standard formatting for < 1 Lakh
        formatted = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(absAmount);
    }

    return isNegative ? `-${formatted}` : formatted;
}
