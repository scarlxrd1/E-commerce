export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, customerEmail, customerName, customerPhone } = req.body;
        
        // Τα κλειδιά από το Settings -> API Access & το 4ψήφιο Source Code
        const clientId = process.env.VIVA_MERCHANT_ID; 
        const clientSecret = process.env.VIVA_API_KEY; 
        const sourceCode = process.env.VIVA_SOURCE_CODE; 

        if (!clientId || !clientSecret || !sourceCode) {
            throw new Error('Missing Environment Variables in Vercel');
        }

        const amountInCents = Math.round(parseFloat(amount) * 100);

        // Βήμα 1: Παίρνουμε το OAuth2 Access Token από τη Viva Demo
        const tokenResponse = await fetch('https://demo-accounts.vivapayments.com/connect/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
            },
            body: 'grant_type=client_credentials'
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.access_token) {
            throw new Error(`Viva Auth Error ${tokenResponse.status}: ${JSON.stringify(tokenData)}`);
        }

        const accessToken = tokenData.access_token;

        // Βήμα 2: Δημιουργία παραγγελίας (Smart Checkout Order) με το Access Token
        const orderResponse = await fetch('https://demo-api.vivapayments.com/checkout/v2/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amountInCents,
                customerTrns: 'AURA Store Order',
                customer: {
                    email: customerEmail || 'test@aura.gr',
                    fullName: customerName || 'AURA Customer',
                    phone: customerPhone || '+306900000000'
                },
                sourceCode: sourceCode
            })
        });

        const orderText = await orderResponse.text();
        let orderData;
        try {
            orderData = JSON.parse(orderText);
        } catch (e) {
            throw new Error(`Invalid JSON from Viva Orders API: ${orderText}`);
        }

        if (!orderResponse.ok) {
            throw new Error(`Viva Orders API Error ${orderResponse.status}: ${orderText}`);
        }

        return res.status(200).json({ success: true, orderCode: orderData.orderCode });

    } catch (error) {
        console.error('Viva Payment Backend Error:', error);
        return res.status(400).json({ error: error.message });
    }
}
