import { app } from './firebase-config.js';
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth(app);
    const userEmailEl = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');

    // 1. Route Protection & User Data mapping
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, populate their email
            if (userEmailEl) {
                userEmailEl.textContent = user.email;
            }
        } else {
            // No user is signed in, redirect instantly to the login page
            window.location.replace('auth.html');
        }
    });

    // 2. Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                // Change button text to give UI feedback during network request
                const originalText = logoutBtn.textContent;
                logoutBtn.textContent = 'Logging out...';
                
                await signOut(auth);
                
                // On successful logout, route them to the homepage
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error signing out:', error);
                alert('An error occurred while logging out. Please try again.');
                logoutBtn.textContent = originalText;
            }
        });
    }
});
