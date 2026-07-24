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

        // Read the raw text BEFORE attempting to parse JSON to catch Viva HTML/Empty errors
        const responseText = await response.text();

        // Catch non-2xx responses and throw with exact status and raw text
        if (!response.ok) {
            throw new Error(`Viva API Error ${response.status}: ${responseText}`);
        }

        // Safely parse the valid JSON response
        const data = JSON.parse(responseText);

        // Return the successfully generated orderCode to the frontend
        return res.status(200).json({ 
            success: true, 
            orderCode: data.orderCode 
        });

    } catch (error) {
        console.error("Create Payment Error:", error.message);
        // Extreme error handling: return 400 with the exact error message
        return res.status(400).json({ 
            error: error.message 
        });
    }
}
