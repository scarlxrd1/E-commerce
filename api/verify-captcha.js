// api/verify-captcha.js
//
// Shared reCAPTCHA v3 verification endpoint for NON-PAYMENT forms only
// (currently: account registration and support-ticket submission).
//
// This intentionally does NOT handle payments/checkout. Payment flows verify
// their own token inline inside api/create-payment.js, immediately before
// any Firestore write, inside the same request that performs the sensitive
// action — that pattern must not be split across two round-trips for money-
// moving operations. This endpoint only answers "was this token real and
// generated for one of the allow-listed non-payment actions", and callers
// are still responsible for performing their own (already-trusted-by-rules)
// Firestore write afterwards.
//
// Every response path returns valid JSON with an explicit status code, so a
// caller's `await res.json()` can never choke on an HTML error page again.

const ALLOWED_ACTIONS = ['register', 'support_ticket'];
const MIN_SCORE = 0.5;

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ success: false, error: 'Method Not Allowed' });
        }

        const { token, action } = req.body || {};

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ success: false, error: 'Missing reCAPTCHA token.' });
        }

        if (!action || typeof action !== 'string' || !ALLOWED_ACTIONS.includes(action)) {
            return res.status(400).json({ success: false, error: 'Missing or unsupported action.' });
        }

        const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
        if (!recaptchaSecret) {
            console.error('[verify-captcha] RECAPTCHA_SECRET_KEY is not configured on the server.');
            return res.status(500).json({ success: false, error: 'Server misconfiguration. Please contact support.' });
        }

        let recaptchaData;
        try {
            const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${recaptchaSecret}&response=${token}`
            });
            recaptchaData = await verifyRes.json();
        } catch (fetchError) {
            console.error('[verify-captcha] siteverify request failed:', fetchError);
            return res.status(200).json({ success: false, error: 'Security verification failed. Please try again.' });
        }

        if (!recaptchaData || !recaptchaData.success) {
            console.warn('[verify-captcha] Rejected by Google:', {
                action,
                hostname: req.headers.host,
                errorCodes: recaptchaData ? recaptchaData['error-codes'] : null
            });
            return res.status(200).json({ success: false, error: 'Security validation failed.' });
        }

        if (recaptchaData.action && recaptchaData.action !== action) {
            console.warn('[verify-captcha] Action mismatch:', {
                expected: action,
                received: recaptchaData.action,
                hostname: req.headers.host
            });
            return res.status(200).json({ success: false, error: 'Security validation failed.' });
        }

        if (typeof recaptchaData.score === 'number' && recaptchaData.score < MIN_SCORE) {
            console.warn('[verify-captcha] Low score:', {
                action,
                score: recaptchaData.score,
                hostname: req.headers.host
            });
            return res.status(200).json({ success: false, error: 'Security validation failed.' });
        }

        return res.status(200).json({ success: true, score: recaptchaData.score });

    } catch (error) {
        console.error('[verify-captcha] Unexpected error:', error);
        return res.status(500).json({ success: false, error: 'An unexpected error occurred.' });
    }
}
