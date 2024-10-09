export default function formatPrice(price) {
    const formattedPrice = new Intl.NumberFormat('fa-IR', {
        style: 'decimal', // Use decimal to avoid automatic currency symbols
        minimumFractionDigits: 0,
    }).format(price);

    // Correct RTL and LTR display using special Unicode characters
    return `\u202B ${formattedPrice} تومان\u202C`;
}
