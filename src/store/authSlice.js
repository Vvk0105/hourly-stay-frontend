import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({email, password}, { rejectWithValue }) => {
        try {
            const res = await api.post("users/auth/login/", {
                email,
                password
            })
            const {access, refresh} = res.data;

            localStorage.setItem("access", access);
            localStorage.setItem("refresh", refresh);

            const decode = jwtDecode(access);
            const profileRes = await api.get("users/profile/");

            return {
                user: {
                    id: decode.user_id,
                    role: decode.role,
                    permissions: decode.permissions,
                    name: profileRes.data.username,
                }
            }
        } catch (error) {
            return rejectWithValue(error.response?.data || "Login failed")
        }
    }
)

export const checkAuth = createAsyncThunk(
    'auth/checkAuth',
    async (_, {rejectWithValue}) => {
        const token = localStorage.getItem("access")
        if (!token) return rejectWithValue("No token found")

        try {
            const decoded = jwtDecode(token)
            const profileRes = await api.get("users/profile/")

            return {
                user: {
                    id: decoded.user_id,
                    role: decoded.role,
                    permissions: decoded.permissions,
                    name: profileRes.data.username,
                }
            }
        }catch (error) {
            localStorage.clear();
            return rejectWithValue("Session expired");
        }
    }
)

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        initialized: false,
        loading: false,
        error: null
    },
    reducers: {
        logout(state) {
            state.user = null;
            state.initialized = true;
            localStorage.clear()
        }
    },
    extraReducers: (builder) => {
        builder.addCase(loginUser.pending, (state) => {
            state.loading = true
            state.error = null
        })
        .addCase(loginUser.fulfilled, (state, action) => {
            state.loading = false
            state.user = action.payload.user
            state.initialized = true
        })
        .addCase(loginUser.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
        })
        .addCase(checkAuth.pending, (state) => {
        state.initialized = false;
        })
        .addCase(checkAuth.fulfilled, (state, action) => {
            state.user = action.payload.user;
            state.initialized = true;
        })
        .addCase(checkAuth.rejected, (state) => {
            state.user = null;
            state.initialized = true;
        });
    }
})

export const { logout } = authSlice.actions;
export default authSlice.reducer