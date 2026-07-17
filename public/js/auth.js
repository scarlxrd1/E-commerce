import { app } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth(app);
    let isLoginMode = true;

    // DOM Elements
    const form = document.getElementById('auth-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const titleEl = document.getElementById('auth-title');
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
            submitBtn.textContent = 'Sign In';
            togglePrefix.textContent = "Don't have an account?";
            toggleBtn.textContent = "Create one";
        } else {
            titleEl.textContent = 'Create Account';
            submitBtn.textContent = 'Create Account';
            togglePrefix.textContent = "Already have an account?";
            toggleBtn.textContent = "Sign in";
        }
    });

    // Handle Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const originalBtnText = submitBtn.textContent;

        // UI Loading State
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
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
