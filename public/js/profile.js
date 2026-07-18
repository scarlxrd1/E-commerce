import { app, db } from './firebase-config.js';
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth(app);
    
    // DOM Elements
    const userEmailEl = document.getElementById('user-email');
    const profileNameEl = document.getElementById('profile-name');
    const profileEmailEl = document.getElementById('profile-email');
    const profilePhoneEl = document.getElementById('profile-phone');
    const profileAddressEl = document.getElementById('profile-address');
    const logoutBtn = document.getElementById('logout-btn');

    // 1. Route Protection & Fetching User Data
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in, populate their email in the header
            if (userEmailEl) {
                userEmailEl.textContent = user.email;
            }

            // Fetch extended profile data from the Firestore "users" collection
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    
                    // Combine First and Last Name
                    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
                    profileNameEl.textContent = fullName || 'Not provided';
                    
                    // Email
                    profileEmailEl.textContent = data.email || user.email;
                    
                    // Phone Number
                    profilePhoneEl.textContent = data.phone || 'Not provided';
                    
                    // Combine Address and Postal Code/Zip
                    const postalCode = data.postalCode || data.zip || '';
                    const fullAddress = `${data.address || ''}, ${postalCode}`.replace(/^, | , $/g, '').trim();
                    profileAddressEl.textContent = fullAddress && fullAddress !== ',' ? fullAddress : 'Not provided';

                } else {
                    // Fallback if the user document is missing in Firestore
                    profileNameEl.textContent = 'Not provided';
                    profileEmailEl.textContent = user.email;
                    profilePhoneEl.textContent = 'Not provided';
                    profileAddressEl.textContent = 'Not provided';
                }
            } catch (error) {
                console.error("Error fetching user profile data:", error);
                
                // Fallback on error
                profileNameEl.textContent = 'Error loading data';
                profileEmailEl.textContent = user.email;
                profilePhoneEl.textContent = 'Error loading data';
                profileAddressEl.textContent = 'Error loading data';
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
