import PageHeader from "../../components/common/PageHeader"
import api from "../../api/axios";
import HotelTable from "./HotelTable";
import { useEffect, useState } from "react";
import { Button, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

function HotelManagement() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  // Role-based navigation: Hotel Managers auto-redirect to their hotel
  useEffect(() => {
    if (user?.role === "HOTEL_MANAGER") {
      const hotelId = user.hotels?.[0];
      if (hotelId) {
        navigate(`/hotels/${hotelId}`);
      }
    }
  }, [user, navigate]);

  const fetchHotels = async () => {
    setLoading(true);
    const res = await api.get("property/hotels/", { params: { search } });
    setHotels(res.data);
    setLoading(false)
  };

  useEffect(() => {
    // Only fetch hotels if user is not a Hotel Manager (they get redirected)
    if (user?.role !== "HOTEL_MANAGER") {
      const timer = setTimeout(() => {
        fetchHotels();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search, user]);

  // Don't render anything for Hotel Managers (they're being redirected)
  if (user?.role === "HOTEL_MANAGER") {
    return null;
  }

  return (
    <>
      <PageHeader
        title="Hotel Management"
        actions={
          <>
            <Button onClick={() => navigate("/hotels/add")}>
              + Add Hotel
            </Button>
          </>
        }
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
        bookingMode={false}
      />
    </>
  )
}

export default HotelManagement
