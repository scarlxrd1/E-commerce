import { app, db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { translations } from './translations.js';

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth(app);
    let isLoginMode = true;
    let currentCaptcha = '';

    // DOM Elements
    const form = document.getElementById('auth-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const forgotPasswordContainer = document.getElementById('forgot-password-container');
    const forgotPasswordBtn = document.getElementById('forgot-password-btn');
    
    // Registration Fields
    const registerFieldsContainer = document.getElementById('register-fields');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    const cityInput = document.getElementById('city');
    const countryInput = document.getElementById('country');
    const postalCodeInput = document.getElementById('postalCode');
    
    // Captcha Elements
    const captchaTextEl = document.getElementById('captcha-text');
    const captchaInput = document.getElementById('captcha-input');
    const refreshCaptchaBtn = document.getElementById('refresh-captcha-btn');

    // Array of fields to toggle 'required' attribute on
    const allRegisterInputs = [firstNameInput, lastNameInput, phoneInput, addressInput, cityInput, countryInput, postalCodeInput, captchaInput];

    // UI Elements
    const titleEl = document.getElementById('auth-title');
    const subtitleEl = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleBtn = document.getElementById('toggle-mode-btn');
    const togglePrefix = document.getElementById('toggle-text-prefix');
    const errorContainer = document.getElementById('auth-error');

    // Captcha Generator Function
    function generateCaptcha() {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += chars[Math.floor(Math.random() * chars.length)];
        }
        captchaTextEl.textContent = captcha;
        captchaInput.value = '';
        currentCaptcha = captcha;
    }

    refreshCaptchaBtn.addEventListener('click', generateCaptcha);

    // Toggle between Sign In and Create Account
    toggleBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        
        // Clear inputs and errors on toggle
        form.reset();
        hideError();

        if (isLoginMode) {
            // Re-apply translations for Login Mode
            const currentLang = localStorage.getItem('aura_lang') || 'en';
            titleEl.textContent = translations[currentLang]?.auth?.sign_in_title || translations['en'].auth.sign_in_title;
            subtitleEl.textContent = translations[currentLang]?.auth?.sign_in_subtitle || translations['en'].auth.sign_in_subtitle;
            submitBtn.textContent = translations[currentLang]?.auth?.sign_in_btn || translations['en'].auth.sign_in_btn;
            togglePrefix.textContent = translations[currentLang]?.auth?.no_account || translations['en'].auth.no_account;
            toggleBtn.textContent = translations[currentLang]?.auth?.create_one || translations['en'].auth.create_one;
            
            // Hide extra fields and remove 'required' so form can submit
            registerFieldsContainer.classList.add('hidden');
            registerFieldsContainer.classList.remove('flex');
            allRegisterInputs.forEach(input => input.removeAttribute('required'));
            
            // Show Forgot Password logic
            forgotPasswordContainer.classList.remove('hidden');
            
        } else {
            // Apply translations for Registration Mode
            const currentLang = localStorage.getItem('aura_lang') || 'en';
            titleEl.textContent = currentLang === 'el' ? 'Δημιουργία Λογαριασμού' : 'Create Account';
            subtitleEl.textContent = currentLang === 'el' ? 'Γίνετε μέλος της AURA για μια απρόσκοπτη εμπειρία.' : 'Join AURA for a seamless experience.';
            submitBtn.textContent = currentLang === 'el' ? 'Δημιουργία Λογαριασμού' : 'Create Account';
            togglePrefix.textContent = currentLang === 'el' ? 'Έχετε ήδη λογαριασμό;' : 'Already have an account?';
            toggleBtn.textContent = currentLang === 'el' ? 'Σύνδεση' : 'Sign in';
            
            // Show extra fields and make them required
            registerFieldsContainer.classList.remove('hidden');
            registerFieldsContainer.classList.add('flex');
            allRegisterInputs.forEach(input => input.setAttribute('required', 'true'));
            
            // Hide Forgot Password logic
            forgotPasswordContainer.classList.add('hidden');
            
            // Generate initial captcha
            generateCaptcha();
        }
    });

    // Forgot Password Logic
    forgotPasswordBtn.addEventListener('click', async () => {
        hideError();
        const email = emailInput.value.trim();
        const currentLang = localStorage.getItem('aura_lang') || 'en';
        
        if (!email) {
            const emptyEmailMsg = currentLang === 'el' 
                ? "Παρακαλούμε εισάγετε τη διεύθυνση email σας στο παραπάνω πεδίο για να επαναφέρετε τον κωδικό σας." 
                : "Please enter your email address in the field above to reset your password.";
            showError(emptyEmailMsg);
            return;
        }

        const originalText = forgotPasswordBtn.textContent;
        forgotPasswordBtn.textContent = currentLang === 'el' ? 'Αποστολή...' : 'Sending...';
        forgotPasswordBtn.disabled = true;

        try {
            await sendPasswordResetEmail(auth, email);
            const successMsg = currentLang === 'el' 
                ? "Ένας σύνδεσμος επαναφοράς κωδικού έχει σταλεί στο email σας." 
                : "A password reset link has been sent to your email.";
            showSuccess(successMsg);
        } catch (error) {
            console.error("Password Reset Error:", error);
            showError(getFriendlyErrorMessage(error.code));
        } finally {
            forgotPasswordBtn.textContent = originalText;
            forgotPasswordBtn.disabled = false;
        }
    });

    // Handle Form Submission with Strict Validation
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const currentLang = localStorage.getItem('aura_lang') || 'en';

        // Strict Validations for Registration Mode
        if (!isLoginMode) {
            const nameRegex = /^[a-zA-Zα-ωΑ-ΩάέήίόύώΆΈΉΊΌΎΏ\s]+$/;
            const phoneRegex = /^\+?\d+$/;

            if (!nameRegex.test(firstNameInput.value.trim())) {
                showError(currentLang === 'el' ? "Το όνομα μπορεί να περιέχει μόνο γράμματα." : "First name can only contain letters.");
                return;
            }
            if (!nameRegex.test(lastNameInput.value.trim())) {
                showError(currentLang === 'el' ? "Το επώνυμο μπορεί να περιέχει μόνο γράμματα." : "Last name can only contain letters.");
                return;
            }
            if (!phoneRegex.test(phoneInput.value.trim())) {
                showError(currentLang === 'el' ? "Ο αριθμός τηλεφώνου μπορεί να περιέχει μόνο αριθμούς και προαιρετικά το σύμβολο '+' στην αρχή." : "Phone number can only contain numbers and an optional leading '+'.");
                return;
            }
            if (password.length <= 6) {
                showError(currentLang === 'el' ? "Ο κωδικός πρόσβασης πρέπει να είναι μεγαλύτερος από 6 χαρακτήρες." : "Password must be greater than 6 characters.");
                return;
            }
            if (captchaInput.value !== currentCaptcha) {
                showError(currentLang === 'el' ? "Η επαλήθευση ασφαλείας απέτυχε. Παρακαλώ δοκιμάστε ξανά." : "Captcha verification failed. Please try again.");
                generateCaptcha();
                return;
            }
        }

        const originalBtnText = submitBtn.textContent;

        // UI Loading State
        submitBtn.textContent = currentLang === 'el' ? 'Επεξεργασία...' : 'Processing...';
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

        try {
            if (isLoginMode) {
                // LOGIN LOGIC
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // REGISTRATION LOGIC

                // 1. Check Unique Phone Number in Firestore
                const phoneVal = phoneInput.value.trim();
                const q = query(collection(db, "users"), where("phone", "==", phoneVal));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    // Phone number already exists
                    const errorMsg = translations[currentLang]?.auth?.error_phone_exists || translations['en'].auth.error_phone_exists;
                    showError(errorMsg);
                    
                    // Revert UI Loading State
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
                    generateCaptcha();
                    return;
                }

                // 2. Proceed with user creation
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Create the user document in Firestore with strict shipping details
                await setDoc(doc(db, "users", user.uid), {
                    firstName: firstNameInput.value.trim(),
                    lastName: lastNameInput.value.trim(),
                    phone: phoneVal,
                    address: addressInput.value.trim(),
                    city: cityInput.value.trim(),
                    country: countryInput.value,
                    postalCode: postalCodeInput.value.trim(),
                    email: email,
                    cart: [], // Initialize empty cloud cart
                    createdAt: new Date().toISOString()
                });
            }
            
            // On success, redirect to the homepage
            window.location.href = 'index.html';

        } catch (error) {
            console.error("Authentication Error:", error);
            showError(getFriendlyErrorMessage(error.code));
            
            // Revert UI Loading State
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
            
            if (!isLoginMode) {
                generateCaptcha(); // Refresh captcha on failure
            }
        }
    });

    // Helper: Display Error
    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.className = "mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-sans rounded-sm text-center";
        errorContainer.classList.remove('hidden');
    }

    // Helper: Display Success
    function showSuccess(message) {
        errorContainer.textContent = message;
        errorContainer.className = "mb-6 p-4 bg-green-50 border border-green-100 text-green-600 text-sm font-sans rounded-sm text-center";
        errorContainer.classList.remove('hidden');
    }

    // Helper: Hide Error
    function hideError() {
        errorContainer.textContent = '';
        errorContainer.className = "hidden mb-6 p-4 text-sm font-sans rounded-sm text-center";
    }

    // Helper: Format Firebase Auth Errors
    function getFriendlyErrorMessage(errorCode) {
        const currentLang = localStorage.getItem('aura_lang') || 'en';
        const isEl = currentLang === 'el';

        switch (errorCode) {
            case 'auth/invalid-email': 
                return isEl ? 'Παρακαλώ εισάγετε μια έγκυρη διεύθυνση email.' : 'Please enter a valid email address.';
            case 'auth/user-disabled': 
                return isEl ? 'Αυτός ο λογαριασμός έχει απενεργοποιηθεί από τον διαχειριστή.' : 'This account has been disabled by an administrator.';
            case 'auth/user-not-found': 
                return isEl ? 'Δεν μπορέσαμε να βρούμε λογαριασμό με αυτό το email.' : 'We could not find an account with that email.';
            case 'auth/wrong-password': 
                return isEl ? 'Ο κωδικός πρόσβασης που εισαγάγατε είναι λανθασμένος.' : 'The password you entered is incorrect.';
            case 'auth/invalid-credential':
                return isEl ? 'Μη έγκυρο email ή κωδικός πρόσβασης. Παρακαλώ δοκιμάστε ξανά.' : 'Invalid email or password. Please try again.';
            case 'auth/email-already-in-use': 
                return isEl ? 'Υπάρχει ήδη λογαριασμός με αυτήν τη διεύθυνση email.' : 'An account already exists with this email address.';
            case 'auth/weak-password': 
                return isEl ? 'Ο κωδικός πρόσβασής σας πρέπει να έχει μήκος τουλάχιστον 6 χαρακτήρες.' : 'Your password must be at least 6 characters long.';
            case 'auth/missing-password':
                return isEl ? 'Παρακαλώ εισάγετε τον κωδικό πρόσβασής σας.' : 'Please enter your password.';
            case 'auth/network-request-failed':
                return isEl ? 'Σφάλμα δικτύου. Παρακαλώ ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.' : 'Network error. Please check your connection and try again.';
            default: 
                return isEl ? 'Προέκυψε ένα απροσδόκητο σφάλμα. Παρακαλώ δοκιμάστε ξανά αργότερα.' : 'An unexpected error occurred. Please try again later.';
        }
    }
});
