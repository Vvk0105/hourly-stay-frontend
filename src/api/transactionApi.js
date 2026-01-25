import api from './axios';

// Fetch all transactions with filters
export const fetchTransactions = async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.hotel_id) queryParams.append('hotel_id', params.hotel_id);
    if (params.status) queryParams.append('status', params.status);
    if (params.booking_type) queryParams.append('booking_type', params.booking_type);
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);

    const response = await api.get(`/property/transactions/?${queryParams.toString()}`);
    return response.data;
};

// Fetch single transaction details
export const fetchTransactionDetails = async (bookingId) => {
    const response = await api.get(`/property/transactions/${bookingId}/`);
    return response.data;
};

// Fetch transaction statistics
export const fetchTransactionStats = async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.hotel_id) queryParams.append('hotel_id', params.hotel_id);
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);

    const response = await api.get(`/property/transactions/stats/?${queryParams.toString()}`);
    return response.data;
};

// Export transactions (placeholder for CSV export)
export const exportTransactions = async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.hotel_id) queryParams.append('hotel_id', params.hotel_id);
    if (params.status) queryParams.append('status', params.status);
    if (params.booking_type) queryParams.append('booking_type', params.booking_type);
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);

    // For now, fetch the data and convert to CSV client-side
    const transactions = await fetchTransactions({ ...params, page_size: 1000 });
    return transactions;
};
