export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            throw new Error('Method Not Allowed');
        }

        const { amount, customerEmail, customerName, customerPhone } = req.body;

        // Παίρνουμε τα ολοκαίνουργια κλειδιά από το Vercel
        const clientId = process.env.VIVA_CLIENT_ID;
        const clientSecret = process.env.VIVA_CLIENT_SECRET;
        const sourceCode = process.env.VIVA_SOURCE_CODE;

        if (!clientId || !clientSecret || !sourceCode) {
            throw new Error("Λείπουν τα νέα VIVA_CLIENT_ID ή VIVA_CLIENT_SECRET από το Vercel.");
        }

        const amountInCents = Math.round(parseFloat(amount) * 100);

        // 1. Ζητάμε το Token Ασφαλείας (OAuth2)
        const tokenCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const tokenResponse = await fetch('https://demo-accounts.vivapayments.com/connect/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${tokenCredentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenData.access_token) {
            throw new Error(`Viva Auth Error: ${JSON.stringify(tokenData)}`);
        }

        // 2. Στέλνουμε την παραγγελία στο Smart Checkout με το Token
        const orderResponse = await fetch('https://demo-api.vivapayments.com/checkout/v2/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amountInCents,
                customerTrns: "AURA Order",
                customer: {
                    email: customerEmail || 'test@aura.gr',
                    fullName: customerName || 'AURA Customer',
                    phone: customerPhone || '+306900000000'
                },
                sourceCode: sourceCode
            })
        });

        const orderText = await orderResponse.text();
        if (!orderResponse.ok) {
            throw new Error(`Viva Order API Error ${orderResponse.status}: ${orderText}`);
        }

        const orderData = JSON.parse(orderText);
        
        // Επιτυχία! Στέλνουμε τον κωδικό της παραγγελίας πίσω στο site σου
        return res.status(200).json({ success: true, orderCode: orderData.orderCode });

    } catch (error) {
        console.error("Backend Error:", error.message);
        return res.status(400).json({ error: error.message });
    }
}
