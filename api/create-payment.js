export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            throw new Error('Method Not Allowed. Expected POST.');
        }

        const { amount, customerEmail, customerName, customerPhone } = req.body;

        // Παίρνουμε τα κλειδιά σου (ΕΙΝΑΙ ΣΩΣΤΑ!)
        const merchantId = process.env.VIVA_MERCHANT_ID;
        const apiKey = process.env.VIVA_API_KEY;
        const sourceCode = process.env.VIVA_SOURCE_CODE;

        if (!merchantId || !apiKey || !sourceCode) {
            throw new Error("Missing Environment Variables");
        }

        const amountInCents = Math.round(parseFloat(amount) * 100);

        if (isNaN(amountInCents) || amountInCents <= 0) {
            throw new Error("Invalid amount provided.");
        }

        // Φτιάχνουμε τον κωδικό απευθείας (Basic Auth) χωρίς Bearer Tokens!
        const credentials = Buffer.from(`${merchantId}:${apiKey}`).toString('base64');

        // Στέλνουμε την παραγγελία ΑΠΕΥΘΕΙΑΣ στη Viva
        const orderResponse = await fetch('https://demo-api.vivapayments.com/checkout/v2/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amountInCents,
                customerTrns: "AURA Order",
                customer: {
                    email: customerEmail,
                    fullName: customerName,
                    phone: customerPhone
                },
                sourceCode: sourceCode
            })
        });

        const orderText = await orderResponse.text();

        if (!orderResponse.ok) {
            throw new Error(`Viva API Error ${orderResponse.status}: ${orderText}`);
        }

        const orderData = JSON.parse(orderText);

        // Γυρνάμε τον κωδικό της παραγγελίας στο Frontend σου
        return res.status(200).json({ 
            success: true, 
            orderCode: orderData.orderCode 
        });

    } catch (error) {
        console.error("Create Payment Error:", error.message);
        return res.status(400).json({ 
            error: error.message 
        });
    }
}
