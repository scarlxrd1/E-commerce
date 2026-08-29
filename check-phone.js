import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ error: 'Invalid phone.' });
    }
    
    try {
        const snap = await adminDb.collection('users').where('phone', '==', phone.trim()).limit(1).get();
        return res.status(200).json({ exists: !snap.empty });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Could not verify phone number.' });
    }
}
