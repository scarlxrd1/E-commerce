import { app, db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth(app);
    let isLoginMode = true;

    // DOM Elements
    const form = document.getElementById('auth-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    // New Registration Fields
    const registerFieldsContainer = document.getElementById('register-fields');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    const cityInput = document.getElementById('city');
    const countryInput = document.getElementById('country');
    const postalCodeInput = document.getElementById('postalCode');
    
    // Array of fields to toggle 'required' attribute on
    const allRegisterInputs = [firstNameInput, lastNameInput, phoneInput, addressInput, cityInput, countryInput, postalCodeInput];

    // UI Elements
    const titleEl = document.getElementById('auth-title');
    const subtitleEl = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleBtn = document.getElementById('toggle-mode-btn');
    const togglePrefix = document.getElementById('toggle-text-prefix');
    const errorContainer = document.getElementById('auth-error');

    // Toggle between Sign In and Create Account
    toggleBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        
        // Clear inputs and errors on toggle
        form.reset();
        hideError();

        if (isLoginMode) {
            titleEl.textContent = 'Sign In';
            subtitleEl.textContent = 'Access your AURA account.';
            submitBtn.textContent = 'Sign In';
            togglePrefix.textContent = "Don't have an account?";
            toggleBtn.textContent = "Create one";
            
            // Hide extra fields and remove 'required' so form can submit
            registerFieldsContainer.classList.add('hidden');
            registerFieldsContainer.classList.remove('flex');
            allRegisterInputs.forEach(input => input.removeAttribute('required'));
            
        } else {
            titleEl.textContent = 'Create Account';
            subtitleEl.textContent = 'Join AURA for a seamless experience.';
            submitBtn.textContent = 'Create Account';
            togglePrefix.textContent = "Already have an account?";
            toggleBtn.textContent = "Sign in";
            
            // Show extra fields and make them required
            registerFieldsContainer.classList.remove('hidden');
            registerFieldsContainer.classList.add('flex');
            allRegisterInputs.forEach(input => input.setAttribute('required', 'true'));
        }
    });

    // Handle Form Submission with Strict Validation
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Strict Validations for Registration Mode
        if (!isLoginMode) {
            const nameRegex = /^[a-zA-Zα-ωΑ-ΩάέήίόύώΆΈΉΊΌΎΏ\s]+$/;
            const phoneRegex = /^\+?\d+$/;

            if (!nameRegex.test(firstNameInput.value.trim())) {
                showError("First name can only contain letters.");
                return;
            }
            if (!nameRegex.test(lastNameInput.value.trim())) {
                showError("Last name can only contain letters.");
                return;
            }
            if (!phoneRegex.test(phoneInput.value.trim())) {
                showError("Phone number can only contain numbers and an optional leading '+'.");
                return;
            }
            if (password.length <= 6) {
                showError("Password must be greater than 6 characters.");
                return;
            }
        }

        const originalBtnText = submitBtn.textContent;

        // UI Loading State
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

        try {
            if (isLoginMode) {
                // LOGIN LOGIC
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // REGISTRATION LOGIC
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Create the user document in Firestore with strict shipping details
                await setDoc(doc(db, "users", user.uid), {
                    firstName: firstNameInput.value.trim(),
                    lastName: lastNameInput.value.trim(),
                    phone: phoneInput.value.trim(),
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
        }
    });

    // Helper: Display Error
    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
    }

    // Helper: Hide Error
    function hideError() {
        errorContainer.textContent = '';
        errorContainer.classList.add('hidden');
    }

    // Helper: Format Firebase Auth Errors
    function getFriendlyErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/invalid-email': 
                return 'Please enter a valid email address.';
            case 'auth/user-disabled': 
                return 'This account has been disabled by an administrator.';
            case 'auth/user-not-found': 
                return 'We could not find an account with that email.';
            case 'auth/wrong-password': 
                return 'The password you entered is incorrect.';
            case 'auth/invalid-credential':
                return 'Invalid email or password. Please try again.';
            case 'auth/email-already-in-use': 
                return 'An account already exists with this email address.';
            case 'auth/weak-password': 
                return 'Your password must be at least 6 characters long.';
            case 'auth/missing-password':
                return 'Please enter your password.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection and try again.';
            default: 
                return 'An unexpected error occurred. Please try again later.';
        }
    }
});
