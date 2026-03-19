import { useEffect, useRef } from 'react';

/**
 * Centralized socket event name constants.
 * Use these instead of raw strings to avoid typos.
 */
export const SOCKET_EVENTS = {
    BOOKING_UPDATED: 'bookingUpdated',
    PAYMENT_UPDATED: 'paymentUpdated',
    ROOM_STATUS_UPDATED: 'roomStatusUpdated',
    REVIEW_UPDATED: 'reviewUpdated',
};

/**
 * Custom hook to listen for WebSocket-triggered custom events.
 * Handles addEventListener + removeEventListener with proper cleanup.
 *
 * @param {string|string[]} eventNames - One or more event names to listen for.
 * @param {Function} callback - Function to call when any of the events fires.
 *
 * @example
 * useSocketEvent(SOCKET_EVENTS.BOOKING_UPDATED, fetchData);
 * useSocketEvent([SOCKET_EVENTS.BOOKING_UPDATED, SOCKET_EVENTS.PAYMENT_UPDATED], fetchData);
 */
const useSocketEvent = (eventNames, callback) => {
    const callbackRef = useRef(callback);

    // Keep the callback ref up to date without re-subscribing listeners
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const events = Array.isArray(eventNames) ? eventNames : [eventNames];

        const handler = (event) => {
            callbackRef.current(event);
        };

        events.forEach((name) => window.addEventListener(name, handler));

        return () => {
            events.forEach((name) => window.removeEventListener(name, handler));
        };
    }, [eventNames]);
};

export default useSocketEvent;
