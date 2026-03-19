import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { notification as antdNotification } from 'antd';
import { addNotification, setNotifications, setLoading, setError } from '../store/notificationSlice';
import notificationApi from '../api/notificationApi';

const useNotifications = () => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const soundEnabled = useSelector((state) => state.notifications.soundEnabled);
    const ws = useRef(null);

    const fetchHistory = useCallback(async (page = 1, append = false) => {
        dispatch(setLoading(true));
        try {
            const data = await notificationApi.getHistory(page);
            if (append) {
                dispatch({ type: 'notifications/appendNotifications', payload: data });
            } else {
                dispatch(setNotifications(data));
            }
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const connectWS = useCallback(() => {
        if (!user?.id) return;

        const baseUrl = import.meta.env.VITE_NOTIFICATION_WS_URL;
        const wsUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${user.id}/`;
        console.log(`Connecting to Notification WebSocket: ${wsUrl}`);

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('Notification WebSocket connected');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Received notification data:', data);

                const notification = data.notification;

                if (!notification) return;

                if (notification.type === 'BOOKING_CONFIRMED' || 
                    notification.type === 'SILENT_BOOKING_UPDATE' || 
                    notification.type === 'BOOKING' || 
                    notification.type === 'NEW_BOOKING' ||
                    notification.type === 'CANCELLED' || 
                    notification.type === 'BOOKING_CANCELLED' ||
                    notification.type === 'CHECK_IN' || 
                    notification.type === 'CHECK_OUT') {
                    window.dispatchEvent(new CustomEvent('bookingUpdated', { detail: data }));
                }

                if (notification.type === 'SILENT_PAYMENT_UPDATE' || 
                    notification.type === 'PAYMENT_SUCCESS' || 
                    notification.type === 'PAYMENT_FAILED') {
                    window.dispatchEvent(new CustomEvent('paymentUpdated', { detail: data }));
                }

                if (notification.type === 'NEW_REVIEW' || notification.type === 'REVIEW_UPDATED') {
                    window.dispatchEvent(new CustomEvent('reviewUpdated', { detail: data }));
                }

                if (notification.type === 'CLEANING_ALERT' || 
                    notification.type === 'CHECK_IN' || 
                    notification.type === 'CHECK_OUT') {
                    window.dispatchEvent(new CustomEvent('roomStatusUpdated', { detail: data }));
                }

                if (notification.type === 'SILENT_NOTIFICATION_UPDATE') {
                    fetchHistory();
                }

                if (notification.type === 'SILENT_NOTIFICATION_UPDATE' || 
                    notification.type === 'SILENT_BOOKING_UPDATE' || 
                    notification.type === 'SILENT_PAYMENT_UPDATE') {
                    return;
                }

                dispatch(addNotification(notification));

                const criticalTypes = [
                    'BOOKING',
                    'NEW_BOOKING',
                    'NEW_REVIEW',
                    'CLEANING_ALERT',
                    'PAYMENT_SUCCESS'
                ];

                if (criticalTypes.includes(notification.type) && soundEnabled) {
                    try {
                        const audio = new Audio(
                            'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
                        );
                        audio.play().catch(e =>
                            console.log('Audio play failed:', e)
                        );
                    } catch (err) {
                        console.error('Error playing notification sound:', err);
                    }
                }

                // toast notification
                antdNotification.info({
                    title: notification.title,
                    description: notification.message,
                    placement: 'bottomRight',
                    duration: 5,
                });

            } catch (err) {
                console.error('Error parsing notification message:', err);
            }
        };

        socket.onerror = (err) => {
            console.error('Notification WebSocket error:', err);
        };

        socket.onclose = (e) => {
            console.log(`Notification WebSocket closed: ${e.code} ${e.reason}. Retrying in 5s...`);
            ws.current = null;
            // Reconnect after 5 seconds
            setTimeout(() => {
                connectWS();
            }, 5000);
        };

        ws.current = socket;
    }, [user?.id, dispatch]);

    useEffect(() => {
        if (!user?.id) return;

        fetchHistory();
        connectWS();

        return () => {
            if (ws.current) {
                // Prevent automatic reconnection on unmount
                ws.current.onclose = null;
                ws.current.close();
            }
        };
    }, [user?.id, fetchHistory, connectWS]);

    return { fetchHistory };
};

export default useNotifications;
