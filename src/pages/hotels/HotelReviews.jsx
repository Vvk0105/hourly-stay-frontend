import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  List, 
  Card, 
  Rate, 
  Avatar, 
  Typography, 
  Spin, 
  message, 
  Breadcrumb, 
  Empty,
  Tag,
  Select
} from "antd";
import { HomeOutlined, StarFilled, UserOutlined, CalendarOutlined } from "@ant-design/icons";
import api from "../../api/axios";
import dayjs from "dayjs";
import PageHeader from "../../components/common/PageHeader";

const { Text, Title, Paragraph } = Typography;

function HotelReviews() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hotelInfo, setHotelInfo] = useState(null);

  // Admin hotel selector state
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [hotelsLoading, setHotelsLoading] = useState(false);

  const isAdmin = ['SUPER_ADMIN', 'GROUP_ADMIN'].includes(user?.role);
  const showSelector = isAdmin && !hotelId;

  // Fetch hotel list for admin selector
  useEffect(() => {
    if (showSelector) {
      setHotelsLoading(true);
      api.get('property/hotels/')
        .then(res => {
          const hotelList = Array.isArray(res.data.results) ? res.data.results : [];
          setHotels(hotelList);
          if (hotelList.length > 0 && !selectedHotelId) {
            setSelectedHotelId(hotelList[0].id);
          }
        })
        .catch(err => {
          console.error("Failed to fetch hotels", err);
          message.error("Failed to load hotel list");
        })
        .finally(() => setHotelsLoading(false));
    }
  }, [showSelector]);

  // Resolve the effective hotel ID
  const effectiveHotelId = hotelId || selectedHotelId || (user?.hotels?.[0]?.id || user?.hotels?.[0]);

  const fetchReviews = useCallback(async () => {
    if (!effectiveHotelId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [reviewsRes, hotelRes] = await Promise.all([
        api.get(`booking/hotels/${effectiveHotelId}/reviews/`),
        api.get(`property/hotels/${effectiveHotelId}/`)
      ]);
      
      setReviews(Array.isArray(reviewsRes.data.results) ? reviewsRes.data.results : reviewsRes.data);
      setHotelInfo(hotelRes.data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [effectiveHotelId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleHotelChange = (value) => {
    setSelectedHotelId(value);
    setReviews([]);
    setHotelInfo(null);
  };

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ marginBottom: 16, marginTop: 16 }}>
        <Breadcrumb
          items={[
            { href: '/dashboard', title: <><HomeOutlined /> Home</> },
            { title: 'Reviews' },
            hotelInfo && { title: hotelInfo.name }
          ].filter(Boolean)}
        />
      </div>

      <PageHeader 
        title={hotelInfo ? `Reviews for ${hotelInfo.name}` : "Guest Reviews"}
        subtitle="Manage and respond to guest feedback"
      />

      {/* Hotel Selector for Admin Roles */}
      {showSelector && (
        <div style={{ 
          marginTop: 16, 
          marginBottom: 8,
          padding: '16px 20px',
          background: '#fafafa',
          borderRadius: '8px',
          border: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <Text strong style={{ whiteSpace: 'nowrap' }}>Select Hotel:</Text>
          <Select
            value={selectedHotelId}
            onChange={handleHotelChange}
            loading={hotelsLoading}
            style={{ minWidth: 280 }}
            placeholder="Choose a hotel to view reviews"
            showSearch
            optionFilterProp="label"
            options={hotels.map(h => ({
              value: h.id,
              label: `${h.name}${h.city ? ` — ${h.city}` : ''}`
            }))}
          />
          <Text type="secondary" style={{ marginLeft: 'auto' }}>
            {hotels.length} hotel{hotels.length !== 1 ? 's' : ''} available
          </Text>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : !effectiveHotelId ? (
          <Empty description="No hotels available" style={{ marginTop: 60 }} />
        ) : reviews.length > 0 ? (
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
            dataSource={reviews}
            renderItem={(item) => (
              <List.Item>
                <Card 
                  hoverable 
                  style={{ borderRadius: '12px', height: '100%' }}
                  bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1a1a1a' }} />
                      <div>
                        <Text strong style={{ display: 'block' }}>Guest</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          {dayjs(item.created_at).format('MMM D, YYYY')}
                        </Text>
                      </div>
                    </div>
                    <Tag color="gold" icon={<StarFilled />} style={{ height: 'fit-content', borderRadius: '4px' }}>
                      {item.rating}
                    </Tag>
                  </div>
                  
                  <Rate disabled defaultValue={item.rating} style={{ fontSize: 14, marginBottom: 12 }} />
                  
                  <Paragraph 
                    ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                    style={{ flexGrow: 1, color: '#444' }}
                  >
                    "{item.comment}"
                  </Paragraph>
                  
                  <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Booking: #{item.booking_id || item.id}
                    </Text>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No reviews found for this hotel" style={{ marginTop: 60 }} />
        )}
      </div>
    </div>
  );
}

export default HotelReviews;
