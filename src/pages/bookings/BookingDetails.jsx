import React from 'react';
import { useParams } from 'react-router-dom';

const BookingDetails = () => {
    const { bookingId } = useParams();
    return (
        <div style={{ padding: 24 }}>
            <h1>Booking Details</h1>
            <p>Details for booking ID: {bookingId}</p>
        </div>
    );
};

export default BookingDetails;
