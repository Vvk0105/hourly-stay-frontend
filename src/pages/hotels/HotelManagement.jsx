import PageHeader from "../../components/common/PageHeader"
import api from "../../api/axios";
import HotelTable from "./HotelTable";
import { useEffect, useState } from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
function HotelManagement() {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

      const fetchHotels = async () => {
        setLoading(true);
        const res = await api.get("property/hotels/");
        setHotels(res.data);
        setLoading(false)
      };

      useEffect(()=>{
        fetchHotels()
      },[])
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

    <HotelTable
    data={hotels}
    loading={loading}
    />
    </>
  )
}

export default HotelManagement
