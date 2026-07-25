import { app, db } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Immediately clear local storage carts
    localStorage.removeItem('cart');
    localStorage.removeItem('aura_cart');

    // 2. Clear global cart array if the function exists
    if (typeof window.syncGlobalCart === 'function') {
        window.syncGlobalCart([]);
    }

    // 3. Clear Firestore cart for authenticated users
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
});
