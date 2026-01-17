import PageHeader from "../../components/common/PageHeader";
import HotelTable from "../hotels/HotelTable";
import { useEffect, useState } from "react";
import { Input } from "antd";
import api from "../../api/axios";

function BookingHotelList() {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const fetchHotels = async () => {
        setLoading(true);
        try {
            // Reusing the same endpoint as Hotel Management for now
            const res = await api.get("property/hotels/", { params: { search } });
            setHotels(res.data);
        } catch (e) {
            console.error("Failed to fetch hotels", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchHotels();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <>
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
                bookingMode={true} // Hint to Table to show/hide specific cols if needed
            />
        </>
    )
}

export default BookingHotelList;
