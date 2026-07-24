export default async function handler(req, res) {
    // Restrict to POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        const { amount, customerEmail, customerName, customerPhone } = req.body;

        // Securely access environment variables
        const merchantId = process.env.VIVA_MERCHANT_ID;
        const apiKey = process.env.VIVA_API_KEY;
        const sourceCode = process.env.VIVA_SOURCE_CODE;

        if (!merchantId || !apiKey || !sourceCode) {
            throw new Error("Missing Viva Wallet credentials in environment variables.");
        }

        // Convert amount to integer cents (e.g., €15.50 -> 1550)
        const amountInCents = Math.round(amount * 100);

        // Generate Basic Auth credentials via Base64
        const credentials = Buffer.from(`${merchantId}:${apiKey}`).toString('base64');

        // Send POST request to Viva Demo Order API
        const response = await fetch('https://demo-api.vivapayments.com/checkout/v2/orders', {
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

        const data = await response.json();

        if (!response.ok) {
            console.error("Viva API Error:", data);
            return res.status(response.status).json({ 
                success: false, 
                message: 'Payment initiation failed', 
                error: data 
            });
        }

        // On success, return the orderCode to the frontend
        return res.status(200).json({ 
            success: true, 
            orderCode: data.orderCode 
        });

    } catch (error) {
        console.error("Create Payment Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}
