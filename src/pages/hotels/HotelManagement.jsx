import PageHeader from "../../components/common/PageHeader"
import api from "../../api/axios";
import HotelTable from "./HotelTable";
import { useEffect, useState } from "react";
import { Button, Input } from "antd";
import { useNavigate } from "react-router-dom";

function HotelManagement() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchHotels = async () => {
    setLoading(true);
    const res = await api.get("property/hotels/", { params: { search } });
    setHotels(res.data);
    setLoading(false)
  };

  useEffect(() => {
    // Debounce or just effect
    const timer = setTimeout(() => {
      fetchHotels();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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
      />
    </>
  )
}

export default HotelManagement
