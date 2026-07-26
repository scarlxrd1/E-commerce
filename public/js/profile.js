import { app, db } from './firebase-config.js';
import { getAuth, onAuthStateChanged, signOut, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
            await loadUserOrders();
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

    async function loadUserOrders() {
        const ordersContainer = document.getElementById('orders-list-container');
        if (!ordersContainer) return;

        try {
            const q = query(collection(db, "orders"), where("userId", "==", currentUser.uid));
            const snapshot = await getDocs(q);
            
            let orders = [];
            snapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() });
            });

            // Sort descending by date (handled client-side to avoid missing index errors)
            orders.sort((a, b) => {
                const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });

            const currentLang = localStorage.getItem('aura_lang') || 'en';
            const t = translations[currentLang].profile.orders || translations['en'].profile.orders;

            if (orders.length === 0) {
                ordersContainer.innerHTML = `
                    <div class="border border-stone-200 bg-white p-16 rounded-sm flex flex-col items-center justify-center text-center shadow-sm">
                        <svg class="w-12 h-12 text-stone-300 mb-4 stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                        <h3 class="font-sans text-stone-900 font-medium mb-2">${t.empty_title || 'No orders yet'}</h3>
                        <p class="font-sans text-sm text-stone-500 mb-6 max-w-sm">${t.empty_desc || 'When you place an order, it will appear here.'}</p>
                        <a href="collection.html" class="font-sans text-xs tracking-widest uppercase border-b border-stone-900 text-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors">
                            ${t.explore_btn || 'Explore Collection'}
                        </a>
                    </div>
                `;
                return;
            }

            let html = '';
            orders.forEach(order => {
                const dateObj = order.createdAt ? order.createdAt.toDate() : new Date();
                const dateStr = dateObj.toLocaleDateString(currentLang === 'el' ? 'el-GR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                
                let statusLabel = t.status_pending || 'Pending Payment';
                let statusClasses = "bg-amber-50 text-amber-700 border-amber-100";
                
                if (order.status === 'paid') {
                    statusLabel = t.status_paid || 'Paid';
                    statusClasses = "bg-green-50 text-green-700 border-green-100";
                } else if (order.status === 'shipped') {
                    statusLabel = t.status_shipped || 'Shipped';
                    statusClasses = "bg-blue-50 text-blue-700 border-blue-100";
                }

                const statusBadge = `<span class="px-3 py-1 border rounded-sm text-[10px] uppercase font-bold tracking-wider ${statusClasses}">${statusLabel}</span>`;

                let itemsHtml = '';
                (order.items || []).forEach(item => {
                    const skuText = item.sku ? `<span class="text-stone-400 ml-2 font-mono text-xs tracking-wider">[${item.sku}]</span>` : '';
                    itemsHtml += `
                        <div class="flex items-center gap-4">
                            <div class="w-16 h-20 bg-stone-100 rounded-sm overflow-hidden flex-shrink-0 border border-stone-100">
                                <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
                            </div>
                            <div class="flex-1 flex justify-between items-center">
                                <div>
                                    <h4 class="font-serif text-stone-900 text-sm md:text-base">${item.title} ${skuText}</h4>
                                    <p class="font-sans text-stone-500 text-xs mt-1">x${item.quantity}</p>
                                </div>
                                <div class="font-sans text-stone-900 text-sm font-medium">
                                    €${(item.price * item.quantity).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    `;
                });

                html += `
                    <div class="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
                        <div class="bg-stone-50/50 border-b border-stone-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <p class="font-sans text-xs tracking-widest uppercase text-stone-500 mb-1">${t.order_no || 'Order #'} ${order.id.slice(0,8).toUpperCase()}</p>
                                <p class="font-sans text-sm text-stone-900 font-medium">${dateStr}</p>
                            </div>
                            <div class="flex items-center gap-6">
                                <div class="text-right">
                                    <p class="font-sans text-xs tracking-widest uppercase text-stone-500 mb-1">${t.total || 'Total'}</p>
                                    <p class="font-sans text-sm font-medium text-stone-900">€${(order.totalAmount || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    ${statusBadge}
                                </div>
                            </div>
                        </div>
                        <div class="p-6 flex flex-col gap-6">
                            ${itemsHtml}
                        </div>
                    </div>
                `;
            });

            ordersContainer.innerHTML = html;

        } catch (error) {
            console.error("Error fetching orders:", error);
            ordersContainer.innerHTML = `<p class="text-red-500 font-sans text-sm p-4 bg-red-50 border border-red-100 rounded-sm text-center">Error loading order history.</p>`;
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
