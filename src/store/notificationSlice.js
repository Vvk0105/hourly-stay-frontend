import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        items: [],
        unreadCount: 0,
        loading: false,
        error: null,
    },
    reducers: {
        setNotifications(state, action) {
            state.items = action.payload;
            state.unreadCount = action.payload.filter(item => !item.is_read).length;
        },
        addNotification(state, action) {
            const exists = state.items.find(item => item.id === action.payload.id);
            if (!exists) {
                const notification = {
                    ...action.payload,
                    created_at: action.payload.created_at || new Date().toISOString(),
                };
                state.items.unshift(notification);
                if (!action.payload.is_read) {
                    state.unreadCount += 1;
                }
            }
        },
        markAsRead(state, action) {
            const notification = state.items.find(item => item.id === action.payload);
            if (notification && !notification.is_read) {
                notification.is_read = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },
        markAllAsRead(state) {
            state.items.forEach(item => {
                item.is_read = true;
            });
            state.unreadCount = 0;
        },
        setLoading(state, action) {
            state.loading = action.payload;
        },
        setError(state, action) {
            state.error = action.payload;
        },
    },
});

export const {
    setNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    setLoading,
    setError,
} = notificationSlice.actions;

export default notificationSlice.reducer;
