import { app, db } from './firebase-config.js';
import { getAuth, onAuthStateChanged, signOut, updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth(app);
    let currentUser = null;
    
    // View DOM Elements
    const userNameHeaderEl = document.getElementById('user-name-header');
    const profileNameEl = document.getElementById('profile-name');
    const profileEmailEl = document.getElementById('profile-email');
    const profilePhoneEl = document.getElementById('profile-phone');
    const profileAddressEl = document.getElementById('profile-address');
    const logoutBtn = document.getElementById('logout-btn');

    // Edit DOM Elements
    const viewModeContainer = document.getElementById('profile-view-mode');
    const editModeContainer = document.getElementById('profile-edit-mode');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const saveEditBtn = document.getElementById('save-edit-btn');
    
    const editFirstNameInput = document.getElementById('edit-firstName');
    const editLastNameInput = document.getElementById('edit-lastName');
    const editPhoneInput = document.getElementById('edit-phone');
    const editAddressInput = document.getElementById('edit-address');
    const editCityInput = document.getElementById('edit-city');
    const editCountryInput = document.getElementById('edit-country');
    const editZipInput = document.getElementById('edit-zip');
    
    // Auth Edit Fields
    const editEmailInput = document.getElementById('edit-email');
    const editPasswordInput = document.getElementById('edit-password');

    // 1. Route Protection & Fetching User Data
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await loadProfileData();
        } else {
            // No user is signed in, redirect instantly to the login page
            window.location.replace('auth.html');
        }
    });

    async function loadProfileData() {
        try {
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // Update View Mode
                const firstName = data.firstName || '';
                const lastName = data.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();
                
                // Header Name
                userNameHeaderEl.textContent = fullName || currentUser.email;
                userNameHeaderEl.classList.remove('animate-pulse', 'bg-stone-200', 'text-transparent', 'rounded');
                
                profileNameEl.textContent = fullName || 'Not provided';
                profileEmailEl.textContent = data.email || currentUser.email;
                profilePhoneEl.textContent = data.phone || 'Not provided';
                
                // Format full address
                const addressStr = data.address || '';
                const cityStr = data.city || '';
                const postalCodeStr = data.postalCode || data.zip || '';
                const countryStr = data.country || '';
                
                const fullAddress = [addressStr, cityStr, postalCodeStr, countryStr]
                                    .filter(Boolean)
                                    .join(', ');
                                    
                profileAddressEl.textContent = fullAddress || 'Not provided';

                // Pre-fill Edit Mode Inputs
                editFirstNameInput.value = firstName;
                editLastNameInput.value = lastName;
                editPhoneInput.value = data.phone || '';
                editAddressInput.value = addressStr;
                editCityInput.value = cityStr;
                editCountryInput.value = countryStr;
                editZipInput.value = postalCodeStr;
                editEmailInput.value = currentUser.email;

            } else {
                userNameHeaderEl.textContent = currentUser.email;
                userNameHeaderEl.classList.remove('animate-pulse', 'bg-stone-200', 'text-transparent', 'rounded');
                profileNameEl.textContent = 'Not provided';
                profileEmailEl.textContent = currentUser.email;
                profilePhoneEl.textContent = 'Not provided';
                profileAddressEl.textContent = 'Not provided';
            }
        } catch (error) {
            console.error("Error fetching user profile data:", error);
            userNameHeaderEl.textContent = 'Error loading data';
            userNameHeaderEl.classList.remove('animate-pulse', 'bg-stone-200', 'text-transparent', 'rounded');
        }
    }

    // 2. Toggle Edit/View Modes
    editProfileBtn.addEventListener('click', () => {
        viewModeContainer.classList.add('hidden');
        editModeContainer.classList.remove('hidden');
        editModeContainer.classList.add('flex');
        editProfileBtn.classList.add('hidden');
    });

    cancelEditBtn.addEventListener('click', () => {
        editModeContainer.classList.add('hidden');
        editModeContainer.classList.remove('flex');
        viewModeContainer.classList.remove('hidden');
        editProfileBtn.classList.remove('hidden');
        // Reset inputs to original state and clear password
        editPasswordInput.value = '';
        loadProfileData(); 
    });

    // 3. Handle Profile & Auth Save
    editModeContainer.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalBtnText = saveEditBtn.textContent;
        saveEditBtn.textContent = 'Saving...';
        saveEditBtn.disabled = true;
        saveEditBtn.classList.add('opacity-70', 'cursor-not-allowed');

        try {
            // A. Prepare Auth Updates (Email & Password)
            let authUpdates = [];
            const newEmail = editEmailInput.value.trim();
            const newPassword = editPasswordInput.value;

            if (newEmail && newEmail !== currentUser.email) {
                authUpdates.push(updateEmail(currentUser, newEmail));
            }
            if (newPassword && newPassword.length > 6) {
                authUpdates.push(updatePassword(currentUser, newPassword));
            } else if (newPassword && newPassword.length <= 6) {
                alert("Password must be greater than 6 characters.");
                throw new Error("Validation Failed");
            }

            // Execute Auth Updates first (as they are more sensitive to recent login requirements)
            if (authUpdates.length > 0) {
                await Promise.all(authUpdates);
            }

            // B. Update Firestore Profile Data
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, {
                firstName: editFirstNameInput.value.trim(),
                lastName: editLastNameInput.value.trim(),
                phone: editPhoneInput.value.trim(),
                address: editAddressInput.value.trim(),
                city: editCityInput.value.trim(),
                country: editCountryInput.value,
                postalCode: editZipInput.value.trim(),
                email: newEmail || currentUser.email // keep synced with auth
            });

            // Reload data and switch back to view mode
            editPasswordInput.value = '';
            await loadProfileData();
            cancelEditBtn.click(); // Triggers the UI toggle back to view mode

        } catch (error) {
            console.error("Error updating profile:", error);
            
            if (error.code === 'auth/requires-recent-login') {
                alert("For security reasons, please log out and log back in before changing your email or password.");
            } else if (error.message !== "Validation Failed") {
                alert("An error occurred while saving your profile: " + error.message);
            }
            
        } finally {
            saveEditBtn.textContent = originalBtnText;
            saveEditBtn.disabled = false;
            saveEditBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    });

    // 4. Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const originalText = logoutBtn.textContent;
                logoutBtn.textContent = 'Logging out...';
                await signOut(auth);
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error signing out:', error);
                alert('An error occurred while logging out. Please try again.');
                logoutBtn.textContent = originalText;
            }
        });
    }
});
