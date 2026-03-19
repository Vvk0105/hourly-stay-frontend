import PageHeader from "../../components/common/PageHeader";
import HotelTable from "../hotels/HotelTable";
import { useEffect, useState } from "react";
import { Input } from "antd";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

function BookingHotelList() {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);

    // Role-based navigation: Hotel Managers and Front Desk auto-redirect to their bookings
    useEffect(() => {
        if (user?.role === "HOTEL_MANAGER" || user?.role === "FRONT_DESK") {
            const hotel = user.hotels?.[0];
            const hotelId = typeof hotel === 'object' ? hotel.id : hotel;
            if (hotelId) {
                navigate(`/bookings/${hotelId}`);
            }
        }
    }, [user, navigate]);

    const fetchHotels = async () => {
        setLoading(true);
        try {
            // Reusing the same endpoint as Hotel Management for now
            const res = await api.get("property/hotels/", { params: { search } });
            setHotels(Array.isArray(res.data.results) ? res.data.results : []);
        } catch (e) {
            console.error("Failed to fetch hotels", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch hotels if user is not a Hotel Manager or Front Desk (they get redirected)
        if (user?.role !== "HOTEL_MANAGER" && user?.role !== "FRONT_DESK") {
            const timer = setTimeout(() => {
                fetchHotels();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [search, user]);

    // Don't render anything for Hotel Managers/Front Desk (they're being redirected)
    if (user?.role === "HOTEL_MANAGER" || user?.role === "FRONT_DESK") {
        return null;
    }

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ color: '#888', marginBottom: 16 }}>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>Home</span> / Bookings
            </div>
            <PageHeader
                title="Bookings - Select Hotel"
            />

            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Input.Search
                    placeholder="Search Hotels..."
                    style={{ width: 300 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <HotelTable
                data={hotels}
                loading={loading}
                bookingMode={true}
            />
        </div>
    )
}

export default BookingHotelList;
