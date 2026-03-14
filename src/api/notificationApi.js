import api from './axios';

const notificationApi = {
    getHistory: async (page = 1) => {
        const response = await api.get('notifications/', { params: { page } });
        return response.data;
    },
    markRead: async (notificationId) => {
        const response = await api.patch(`notifications/${notificationId}/mark-as-read/`);
        return response.data;
    },
    markAllRead: async () => {
        const response = await api.post('notifications/mark-all-read/');
        return response.data;
    },
};

export default notificationApi;
