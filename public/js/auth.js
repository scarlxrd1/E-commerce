import { app, db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth(app);
    let isLoginMode = true;
    let currentCaptcha = '';

    // DOM Elements
    const form = document.getElementById('auth-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
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
    const captchaCanvas = document.getElementById('captcha-canvas');
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

    // Captcha Generator Function (Clean UI, High Contrast, No Distortion)
    function generateCaptcha() {
        // Excluded ambiguous characters like 0, O, 1, I, l
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += chars[Math.floor(Math.random() * chars.length)];
        }
        currentCaptcha = captcha;
        captchaInput.value = '';

        if (captchaCanvas) {
            const ctx = captchaCanvas.getContext('2d');
            const width = captchaCanvas.width;
            const height = captchaCanvas.height;

            // 1. Clean Background (Stone 100)
            ctx.fillStyle = '#F5F5F4'; 
            ctx.fillRect(0, 0, width, height);

            // 2. Minimal, elegant noise (subtle dots instead of harsh lines)
            ctx.fillStyle = '#E7E5E4'; // Stone 200
            for (let i = 0; i < 40; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // 3. Draw highly readable text
            ctx.font = 'bold 22px monospace';
            ctx.fillStyle = '#1C1917'; // Stone 900 (High contrast)
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Clear letter spacing and minimal rotation
            const startX = width / 2 - 60; // Center the 6 characters
            const spacing = 24;
            
            for (let i = 0; i < 6; i++) {
                ctx.save();
                ctx.translate(startX + (i * spacing), height / 2);
                
                // Very slight rotation (-5 to 5 degrees) for basic security without ruining readability
                const angle = (Math.random() - 0.5) * 0.1; 
                ctx.rotate(angle);
                
                ctx.fillText(captcha[i], 0, 0);
                ctx.restore();
            }
        }
    }

    refreshCaptchaBtn.addEventListener('click', generateCaptcha);

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
            
            // Generate initial captcha
            generateCaptcha();
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
            // Captcha Validation (Case-Insensitive for better UX)
            if (captchaInput.value.trim().toUpperCase() !== currentCaptcha.toUpperCase()) {
                showError("Security check failed. Please try again.");
                generateCaptcha();
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
                // Redirect immediately for login
                window.location.href = 'index.html';
            } else {
                // REGISTRATION LOGIC
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                const fName = firstNameInput.value.trim();
                const lName = lastNameInput.value.trim();

                // Create the user document in Firestore with strict shipping details
                await setDoc(doc(db, "users", user.uid), {
                    firstName: fName,
                    lastName: lName,
                    phone: phoneInput.value.trim(),
                    address: addressInput.value.trim(),
                    city: cityInput.value.trim(),
                    country: countryInput.value,
                    postalCode: postalCodeInput.value.trim(),
                    email: email,
                    cart: [], // Initialize empty cloud cart
                    createdAt: new Date().toISOString()
                });

                // Send Automated Welcome Email via EmailJS
                const templateParams = {
                    user_name: `${fName} ${lName}`.trim(),
                    user_email: email
                };
                
                emailjs.send("service_c24ml8x", "template_y5ko9jj", templateParams)
                    .then(response => {
                        console.log("EMAILJS SUCCESS:", response.status, response.text);
                        // Redirect ONLY after successful email dispatch
                        window.location.href = 'index.html';
                    })
                    .catch(error => {
                        console.error("EMAILJS CRITICAL ERROR:", error);
                        // Fallback redirect in case email fails, so user isn't stuck
                        window.location.href = 'index.html';
                    });
            }

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
