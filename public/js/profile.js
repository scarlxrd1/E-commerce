import { app, db } from './firebase-config.js';
import { getAuth, onAuthStateChanged, signOut, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { translations } from './translations.js';

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
    
    const currentEmailDisplay = document.getElementById('current-email-display');

    // Email Modal Elements
    const emailModal = document.getElementById('change-email-modal');
    const emailModalBackdrop = document.getElementById('change-email-backdrop');
    const openEmailModalBtn = document.getElementById('open-email-modal-btn');
    const closeEmailModalBtn = document.getElementById('close-email-modal-btn');
    const emailForm = document.getElementById('change-email-form');
    const newEmailInput = document.getElementById('new-email-input');
    const confirmPasswordInput = document.getElementById('confirm-password-input');
    const emailModalAlert = document.getElementById('email-modal-alert');
    const submitEmailModalBtn = document.getElementById('submit-email-modal-btn');

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
                currentEmailDisplay.textContent = currentUser.email;

            } else {
                userNameHeaderEl.textContent = currentUser.email;
                userNameHeaderEl.classList.remove('animate-pulse', 'bg-stone-200', 'text-transparent', 'rounded');
                profileNameEl.textContent = 'Not provided';
                profileEmailEl.textContent = currentUser.email;
                profilePhoneEl.textContent = 'Not provided';
                profileAddressEl.textContent = 'Not provided';
                currentEmailDisplay.textContent = currentUser.email;
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
        loadProfileData(); 
    });

    // 3. Handle Main Profile Save (No Auth changes here anymore)
    editModeContainer.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalBtnText = saveEditBtn.textContent;
        
        const currentLang = localStorage.getItem('aura_lang') || 'en';
        saveEditBtn.textContent = currentLang === 'el' ? 'Αποθήκευση...' : 'Saving...';
        saveEditBtn.disabled = true;
        saveEditBtn.classList.add('opacity-70', 'cursor-not-allowed');

        try {
            // Update Firestore Profile Data
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, {
                firstName: editFirstNameInput.value.trim(),
                lastName: editLastNameInput.value.trim(),
                phone: editPhoneInput.value.trim(),
                address: editAddressInput.value.trim(),
                city: editCityInput.value.trim(),
                country: editCountryInput.value,
                postalCode: editZipInput.value.trim()
            });

            // Reload data and switch back to view mode
            await loadProfileData();
            cancelEditBtn.click(); 

        } catch (error) {
            console.error("Error updating profile:", error);
            const msg = currentLang === 'el' 
                ? "Προέκυψε σφάλμα κατά την αποθήκευση του προφίλ σας: " 
                : "An error occurred while saving your profile: ";
            alert(msg + error.message);
        } finally {
            saveEditBtn.textContent = originalBtnText;
            saveEditBtn.disabled = false;
            saveEditBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    });

    // 4. Handle Email Update Modal & Re-authentication
    function closeEmailModal() {
        emailModal.classList.add('hidden');
        emailForm.reset();
        emailModalAlert.classList.add('hidden');
        emailModalAlert.textContent = '';
    }

    openEmailModalBtn.addEventListener('click', () => {
        emailModal.classList.remove('hidden');
    });

    closeEmailModalBtn.addEventListener('click', closeEmailModal);
    emailModalBackdrop.addEventListener('click', closeEmailModal);

    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentLang = localStorage.getItem('aura_lang') || 'en';
        
        const newEmail = newEmailInput.value.trim();
        const password = confirmPasswordInput.value;

        if (!newEmail || !password) return;

        const originalText = submitEmailModalBtn.textContent;
        submitEmailModalBtn.textContent = currentLang === 'el' ? 'Επεξεργασία...' : 'Processing...';
        submitEmailModalBtn.disabled = true;
        submitEmailModalBtn.classList.add('opacity-70', 'cursor-not-allowed');
        
        emailModalAlert.classList.add('hidden');

        try {
            // 1. Re-authenticate user
            const credential = EmailAuthProvider.credential(currentUser.email, password);
            await reauthenticateWithCredential(currentUser, credential);

            // 2. Trigger verification email to the new address
            await verifyBeforeUpdateEmail(currentUser, newEmail);

            // 3. Update Firestore to reflect the pending/new email
            await updateDoc(doc(db, "users", currentUser.uid), {
                email: newEmail
            });

            // 4. Show success
            const successMsg = translations[currentLang]?.profile?.email_modal?.success || translations['en'].profile.email_modal.success;
            emailModalAlert.textContent = successMsg;
            emailModalAlert.className = "mb-6 p-4 bg-green-50 border border-green-100 text-green-600 text-sm font-sans rounded-sm text-center";
            emailModalAlert.classList.remove('hidden');

            // 5. Cleanup
            setTimeout(() => {
                closeEmailModal();
                loadProfileData(); // refresh UI
            }, 3000);

        } catch (error) {
            console.error("Email Update Error:", error);
            let errorMsg = translations[currentLang]?.profile?.email_modal?.error_generic || translations['en'].profile.email_modal.error_generic;
            
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMsg = translations[currentLang]?.profile?.email_modal?.error_password || translations['en'].profile.email_modal.error_password;
            }

            emailModalAlert.textContent = errorMsg;
            emailModalAlert.className = "mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-sans rounded-sm text-center";
            emailModalAlert.classList.remove('hidden');
        } finally {
            submitEmailModalBtn.textContent = originalText;
            submitEmailModalBtn.disabled = false;
            submitEmailModalBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    });

    // 5. Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const originalText = logoutBtn.textContent;
                const currentLang = localStorage.getItem('aura_lang') || 'en';
                logoutBtn.textContent = currentLang === 'el' ? 'Αποσύνδεση...' : 'Logging out...';
                await signOut(auth);
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error signing out:', error);
                const msg = localStorage.getItem('aura_lang') === 'el' 
                    ? "Προέκυψε σφάλμα κατά την αποσύνδεση. Παρακαλώ δοκιμάστε ξανά."
                    : "An error occurred while logging out. Please try again.";
                alert(msg);
                logoutBtn.textContent = originalText;
            }
        });
    }
});
