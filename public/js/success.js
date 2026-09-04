import { app, db } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. CLEAR CART LOGIC
    // ==========================================
    
    // Immediately clear local storage carts
    localStorage.removeItem('cart');
    localStorage.removeItem('aura_cart');

    // Clear global cart array if the function exists
    if (typeof window.syncGlobalCart === 'function') {
        window.syncGlobalCart([]);
    }

    // Clear Firestore cart for authenticated users
    const auth = getAuth(app);
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, { cart: [] });
            } catch (error) {
                console.error("Error clearing user cart in Firestore:", error);
            }
        }
    });

    // ==========================================
    // 2. ORDER CONFIRMATION EMAIL VIA RESEND
    // ==========================================
    try {
        const orderData = JSON.parse(sessionStorage.getItem('aura_last_order'));

        if (orderData && !sessionStorage.getItem('aura_order_email_sent')) {
            sessionStorage.setItem('aura_order_email_sent', 'true');

            fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'order_confirmation',
                    orderData: orderData
                })
            })
            .then(async (response) => {
                if (!response.ok) {
                    const errPayload = await response.json().catch(() => ({}));
                    console.error("Failed to dispatch order confirmation email via Resend:", errPayload.error || response.statusText);
                } else {
                    console.log("Order confirmation email sent successfully via Resend.");
                }
            })
            .catch((networkError) => {
                console.error("Network error while sending order confirmation email:", networkError);
            });
        }
    } catch (error) {
        console.error("Error processing order confirmation for email delivery:", error);
    }
});
