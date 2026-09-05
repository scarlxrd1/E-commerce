import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
    });
}
const adminDb = getFirestore();

export default async function handler(req, res) {
    // 1. Verification GET request required by Viva Wallet webhook setup
    if (req.method === 'GET') {
        const webhookKey = process.env.VIVA_WEBHOOK_KEY || '';
        return res.status(200).json({ Key: webhookKey });
    }

    // 2. Reject non-POST HTTP methods
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (parseError) {
                console.error('[webhook] Failed to parse request body as JSON:', parseError);
            }
        }

        const eventData = body?.EventData || body || {};
        const rawOrderCode = eventData.OrderCode ?? eventData.orderCode ?? body?.OrderCode ?? body?.orderCode;

        if (!rawOrderCode) {
            console.warn('[webhook] Received POST webhook without an OrderCode:', body);
            return res.status(400).json({ error: 'OrderCode is missing from payload.' });
        }

        const orderCode = rawOrderCode;

        // Query Firestore orders where vivaOrderCode matches
        let snapshot = await adminDb.collection('orders').where('vivaOrderCode', '==', orderCode).get();

        // Type fallback (handle numbers vs string representation)
        if (snapshot.empty) {
            if (typeof orderCode === 'number') {
                snapshot = await adminDb.collection('orders').where('vivaOrderCode', '==', String(orderCode)).get();
            } else if (typeof orderCode === 'string' && !isNaN(Number(orderCode))) {
                snapshot = await adminDb.collection('orders').where('vivaOrderCode', '==', Number(orderCode)).get();
            }
        }

        if (snapshot.empty) {
            console.warn(`[webhook] No matching order found for vivaOrderCode: ${orderCode}`);
            return res.status(200).json({ received: true, warning: 'Order not found' });
        }

        const updatePayload = {
            status: 'paid',
            paidAt: FieldValue.serverTimestamp()
        };

        if (eventData.TransactionId) {
            updatePayload.vivaTransactionId = eventData.TransactionId;
        }

        const updatePromises = snapshot.docs.map((docSnap) => docSnap.ref.update(updatePayload));
        await Promise.all(updatePromises);

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('[webhook] Error processing Viva Wallet webhook:', error);
        return res.status(500).json({ error: 'Internal server error processing webhook.' });
    }
}
