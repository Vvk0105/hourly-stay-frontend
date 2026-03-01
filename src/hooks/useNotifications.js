import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { notification as antdNotification } from 'antd';
import { addNotification, setNotifications, setLoading, setError } from '../store/notificationSlice';
import notificationApi from '../api/notificationApi';

const useNotifications = () => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const ws = useRef(null);

    const fetchHistory = useCallback(async () => {
        dispatch(setLoading(true));
        try {
            const history = await notificationApi.getHistory();
            dispatch(setNotifications(history));
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const connectWS = useCallback(() => {
        if (!user?.id) return;

        const wsUrl = `${import.meta.env.VITE_NOTIFICATION_WS_URL}${user.id}/`;
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

                if (notification) {
                    // Intercept silent UI updates
                    if (notification.type === 'SILENT_BOOKING_UPDATE' || notification.type === 'SILENT_PAYMENT_UPDATE') {
                        const eventName = notification.type === 'SILENT_BOOKING_UPDATE' ? 'bookingUpdated' : 'paymentUpdated';
                        console.log(`Received silent update (${notification.type}), dispatching DOM event: ${eventName}`);
                        window.dispatchEvent(new Event(eventName));
                        return; // do not store in db/redux or show toast
                    }

                    dispatch(addNotification(notification));

                    // Show a browser-level toast for real-time alerts
                    antdNotification.info({
                        message: notification.title,
                        description: notification.message,
                        placement: 'bottomRight',
                        duration: 5,
                    });
                }
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
