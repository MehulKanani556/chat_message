import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import sessionStorage from 'redux-persist/es/storage/session';
import axios from 'axios';
import { BASE_URL } from '../../utils/baseUrl';

const handleErrors = (error, rejectWithValue) => {
    const errorMessage = error.response?.data?.message || 'An error occurred';
    return rejectWithValue(error.response?.data || { message: errorMessage });
};

const initialState = {
    user: null,
    isAuthenticated: !!sessionStorage.getItem('token') && sessionStorage.getItem('role') === 'admin',
    loading: false,
    error: null,
    loggedIn: false,
    isLoggedOut: false,
    message: null
};

export const login = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/usrLogin`, credentials);
            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('userId', response.data.user._id);
            return response.data;
        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/createUser`, userData);
            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('userId', response.data.user._id);
            return response.data;
        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);

export const forgotPassword = createAsyncThunk(
    'auth/forgotPassword',
    async (email, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/forgotPassword`, { email });
            if (response.status === 200) {
                return response.data;
            }
        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);

export const verifyOtp = createAsyncThunk(
    'auth/verifyOtp',
    async ({ email, otp }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/verifyOtp`, { email, otp });
            if (response.status === 200) {
                return response.data;
            }
        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);

export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async ({ email, newPassword }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/changePassword`, { email, newPassword });
            if (response.status === 200) {
                return response.data;
            }
        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);
export const mobileOtp = createAsyncThunk(
    'auth/mobileOtp',
    async ({ mobileNumber }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/mobile-otp`, { mobileNumber });
            if (response.status === 200) {
                return response.data;
            }
        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);
export const verifyMobileOtp = createAsyncThunk(
    'auth/verify-mobile-otp',
    async ({ mobileNumber, otp }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/verify-mobile-otp`, { mobileNumber, otp }, { withCredentials: true });
            if (response.status === 200) {
                sessionStorage.setItem('token', response.data.token);
                localStorage.setItem('ChatToken', response.data.token);
                sessionStorage.setItem('userId', response.data.user._id);
                localStorage.setItem('ChatuserId', response.data.user._id);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                if (window.electron) {
                    window.electron.saveAuthData({
                        token: response.data.token,
                        userId: response.data.user._id,
                        refToken: response.data.refreshToken
                    });
                }
                return response.data;
            }
        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);

export const googleLogin = createAsyncThunk(
    'auth/google-login',
    async ({ uid, userName, email, photo }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/google-login`, { uid, userName, email, photo });
            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('userId', response.data.user._id);
            return response.data;

        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);

export const createPlan = createAsyncThunk(
    'auth/createPlan',
    async (planData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/user/plan`, planData);
            return response.data;
        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);

export const logoutUser = createAsyncThunk('auth/logout', async (userId, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${BASE_URL}/logoutUser`, { _id: userId });
        if (!response.data.success) {
            throw new Error(response.data.message || 'Logout failed');
        }
        localStorage.removeItem('ChatToken');
        localStorage.removeItem('user');
        localStorage.removeItem("ChatuserId")
        sessionStorage.clear();

        if (window.electron) {
            window.electron.clearAuthToken();
        }

        return response.data;
    } catch (err) {
        return rejectWithValue(err.message || 'An unknown error occurred during logout.');
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state, action) => {
            state.user = null;
            state.isAuthenticated = false;
            state.loggedIn = false;
            state.isLoggedOut = true;
            state.message = action.payload?.message || "Logged out successfully";
            window.localStorage.clear();
            window.sessionStorage.clear();

        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.loading = false;
                state.error = null;
                state.message = action.payload?.message || "Login successfully";
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
                state.message = action.payload?.message || "Login Failed";

            })
            .addCase(logoutUser.fulfilled, (state, action) => {
                state.user = null;
                state.isAuthenticated = false;
                state.loggedIn = false;
                state.isLoggedOut = true;
                state.message = action.payload?.message || "Logged out successfully";
                window.sessionStorage.clear();
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
                state.message = action.payload?.message || "Login Failed";
            })
            .addCase(register.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.loading = false;
                state.error = null;
                state.message = action.payload?.message || "Register successfully";
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
                state.message = action.payload?.message || "User Already Exist";
            })
            .addCase(forgotPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.message = action.payload;
            })
            .addCase(forgotPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
                state.message = action.payload?.message || "Forgot Password Failed";
            })
            .addCase(verifyOtp.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.message = action.payload.message;
            })
            .addCase(verifyOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
                state.message = action.payload.data?.message || "Verify OTP Failed";
            })
            .addCase(resetPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.message = action.payload;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
                state.message = action.payload?.message || "Reset Password Failed";
            })
            .addCase(googleLogin.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.loading = false;
                state.error = null;
                state.message = action.payload?.message || "Google Login successful";
            })
            .addCase(googleLogin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
                state.message = action.payload?.message || "Google Login Failed";
            })
            .addCase(createPlan.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.message = action.payload?.message || "Plan created successfully";
            })
            .addCase(createPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
                state.message = action.payload?.message || "Failed to create plan";
            })
            .addCase(mobileOtp.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.message = action.payload.message || "OTP sent successfully";
            })
            .addCase(mobileOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
                state.message = action.payload?.message || "Failed to send OTP";
            })
            .addCase(verifyMobileOtp.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.message = action.payload.message || "OTP Verify successfully";
            })
            .addCase(verifyMobileOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
                state.message = action.payload?.message || "Failed to verify OTP";
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
