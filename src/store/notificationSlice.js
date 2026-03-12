import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        items: [],
        unreadCount: 0,
        totalCount: 0,
        loading: false,
        error: null,
        soundEnabled: localStorage.getItem('notif_sound_enabled') !== 'false', // Default to true
    },
    reducers: {
        setNotifications(state, action) {
            const { results, count, unread_count } = action.payload;
            state.items = results || action.payload;
            state.unreadCount = unread_count !== undefined ? unread_count : state.items.filter(item => !item.is_read).length;
            state.totalCount = count || state.items.length;
        },
        appendNotifications(state, action) {
            const { results } = action.payload;
            const newItems = results || [];
            // filter out duplicates
            const existingIds = new Set(state.items.map(i => i.id));
            const filtered = newItems.filter(i => !existingIds.has(i.id));
            state.items = [...state.items, ...filtered];
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
        toggleSound(state) {
            state.soundEnabled = !state.soundEnabled;
            localStorage.setItem('notif_sound_enabled', state.soundEnabled);
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
    appendNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    toggleSound,
    setLoading,
    setError,
} = notificationSlice.actions;

export default notificationSlice.reducer;
