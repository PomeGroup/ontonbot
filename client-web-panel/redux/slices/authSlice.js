import { createSlice } from '@reduxjs/toolkit';
import { authApi } from './authApiSlice'; // Adjust the import path according to your file structure

// Initial state of the auth slice
const initialState = {
    token: null, // To store the authentication token
    userData: null, // To store user information
    status: 'idle', // To track the loading status
    error: null, // To store any error message
    isLogin: false, // To store login status
};

// Creating the auth slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.token = null;
            state.userData = null;
            state.status = 'idle';
            state.error = null;
            state.isLogin = false;
            localStorage.removeItem('token'); // Remove token from localStorage on logout
        },
    },
    extraReducers: (builder) => {
        // Handling actions from the auth API slice

        // When sending the OTP (sendCode)
        builder.addMatcher(authApi.endpoints.sendOtpCode.matchPending, (state) => {
            state.status = 'loading';
            state.error = null;
        });

        builder.addMatcher(authApi.endpoints.sendOtpCode.matchFulfilled, (state) => {
            state.status = 'succeeded';
        });

        builder.addMatcher(authApi.endpoints.sendOtpCode.matchRejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message;
        });

        // When logging in with OTP
        builder.addMatcher(authApi.endpoints.loginWithOtp.matchPending, (state) => {
            state.status = 'loading';
            state.isLogin = false;
            state.error = null;
        });

        builder.addMatcher(authApi.endpoints.loginWithOtp.matchFulfilled, (state, action) => {
            state.status = 'succeeded';
            state.token = action.payload.token;
            state.userData = action.payload;
            localStorage.setItem('token', action.payload.token); // Save token to localStorage
            state.isLogin = true;
        });

        builder.addMatcher(authApi.endpoints.loginWithOtp.matchRejected, (state, action) => {
            state.status = 'failed';
            state.isLogin = false;
            state.error = action.error.message;
        });

        // When logging out
        builder.addMatcher(authApi.endpoints.logout.matchPending, (state) => {
            state.status = 'loading';
            state.error = null;
        });

        builder.addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
            state.status = 'succeeded';
            state.token = null;
            state.userData = null;
            state.isLogin = false;
            localStorage.removeItem('token'); // Clear token from localStorage on successful logout
        });

        builder.addMatcher(authApi.endpoints.logout.matchRejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message;
        });
    },
});

// Exporting the logout action and state selectors
export const { logout } = authSlice.actions;
export const selectIsLogin = (state) => state.auth.isLogin;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthStatus = (state) => state.auth.status;

// Exporting the reducer to be used in the Redux store
export default authSlice.reducer;
