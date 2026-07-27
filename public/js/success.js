document.addEventListener('DOMContentLoaded', () => {
    // Initialize EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init("YOUR_PUBLIC_KEY");
    }

    const lastOrderStr = sessionStorage.getItem('aura_last_order');
    const emailSent = sessionStorage.getItem('aura_order_email_sent');

    if (lastOrderStr && !emailSent && typeof emailjs !== 'undefined') {
        try {
            const order = JSON.parse(lastOrderStr);
            
            // Format items summary
            const itemsSummary = order.items.map(item => 
                `${item.quantity}x [${item.sku || 'N/A'}] ${item.title} - €${item.price.toLocaleString()}`
            ).join('\n');

            // Format payment method
            let paymentString = "N/A";
            if (order.paymentMethod === 'cod') {
                paymentString = "Αντικαταβολή (+€2.50)";
            } else if (order.paymentMethod === 'card') {
                paymentString = "Πιστωτική / Χρεωστική Κάρτα (Viva Wallet)";
            }

            // Prepare Template Params
            const templateParams = {
                to_name: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
                to_email: order.customer.email,
                order_id: order.orderId,
                payment_method: paymentString,
                shipping_address: `${order.customer.address}, ${order.customer.city} ${order.customer.zip}`,
                items_summary: itemsSummary,
                total_amount: `€${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            };

            // Send Email
            emailjs.send("YOUR_SERVICE_ID", "YOUR_ORDER_TEMPLATE_ID", templateParams)
                .then(() => {
                    console.log("Order confirmation email sent successfully.");
                    sessionStorage.setItem('aura_order_email_sent', 'true');
                })
                .catch((error) => {
                    console.error("Failed to send order confirmation email:", error);
                });
                
        } catch (error) {
            console.error("Error processing order for email confirmation:", error);
        }
    }
});
