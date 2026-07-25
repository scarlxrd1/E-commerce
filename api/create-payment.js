export default async function handler(req, res) {
    try {
        // Restrict to POST requests
        if (req.method !== 'POST') {
            throw new Error('Method Not Allowed. Expected POST.');
        }

        const { amount, customerEmail, customerName, customerPhone } = req.body;

        // Securely access environment variables
        const merchantId = process.env.VIVA_MERCHANT_ID;
        const apiKey = process.env.VIVA_API_KEY;
        const sourceCode = process.env.VIVA_SOURCE_CODE;

        // Strict environment variable check
        if (!merchantId || !apiKey || !sourceCode) {
            throw new Error("Missing Environment Variables");
        }

        // Safe amount calculation: parse to float and convert to integer cents
        const amountInCents = Math.round(parseFloat(amount) * 100);

        if (isNaN(amountInCents) || amountInCents <= 0) {
            throw new Error("Invalid amount provided.");
        }

        // 1. Generate Basic Auth credentials via Base64 for the OAuth2 Token Request
        const credentials = Buffer.from(`${merchantId}:${apiKey}`).toString('base64');

        // 2. Request OAuth2 Bearer Token
        const tokenResponse = await fetch('https://demo-accounts.vivapayments.com/connect/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        // Read the raw text BEFORE attempting to parse JSON to catch Viva HTML/Empty errors
        const tokenText = await tokenResponse.text();

        if (!tokenResponse.ok) {
            throw new Error(`Viva Auth Error ${tokenResponse.status}: ${tokenText}`);
        }

        const tokenData = JSON.parse(tokenText);
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            throw new Error("Failed to retrieve access token from Viva Wallet.");
        }

        // 3. Send POST request to Viva Demo Order API using the Bearer Token
        const orderResponse = await fetch('https://demo-api.vivapayments.com/checkout/v2/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
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

        // Catch non-2xx responses and throw with exact status and raw text
        if (!orderResponse.ok) {
            throw new Error(`Viva API Error ${orderResponse.status}: ${orderText}`);
        }

        const orderData = JSON.parse(orderText);

        // Return the successfully generated orderCode to the frontend
        return res.status(200).json({ 
            success: true, 
            orderCode: orderData.orderCode 
        });

    } catch (error) {
        console.error("Create Payment Error:", error.message);
        // Extreme error handling: return 400 with the exact error message
        return res.status(400).json({ 
            error: error.message 
        });
    }
}
