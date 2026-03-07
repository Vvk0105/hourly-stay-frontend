import { Table, Button, Tag, Space } from "antd";
import { EyeTwoTone, EditOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

function HotelTable({ data, loading, bookingMode = false, pagination, onChange }) {
  const navigate = useNavigate();
  const safeData = Array.isArray(data) ? data : [];


  // Common columns for both modes
  const commonColumns = [
    {
      title: "Hotel Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
    },
    {
      title: "Mode",
      dataIndex: "is_hourly_enabled",
      key: "is_hourly_enabled",
      render: (enabled) => (
        <Tag color={enabled ? "green" : "blue"}>
          {enabled ? "Hourly + Nightly" : "Nightly Only"}
        </Tag>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const color = status === 'ACTIVE' ? 'success' : 'warning';
        return <Tag color={color}>{status}</Tag>;
      }
    },
  ];

  // Action column for Hotel Management (View/Edit)
  const actionColumn = {
    title: "Action",
    key: "action",
    render: (_, record) => {
      const isRazorpayXLinked = Boolean(record.razorpayx_contact_id && record.razorpayx_fund_account_id);

      const handleOnboard = async () => {
        try {
          await api.post(`property/hotels/${record.id}/razorpayx/onboard/`);
          // Note: using default antd message here is tricky without importing, 
          // but we can trust the parent component to refresh or just reload for now
          // A better way is firing onChange() to fetch data again
          if (onChange) {
            // trigger refresh
            onChange({ current: pagination?.current || 1 });
          }
        } catch (error) {
          console.error("Failed to onboard:", error);
          const data = error.response?.data;
          alert(data?.detail || data?.error || "Failed to onboard to RazorpayX.");
        }
      };

      return (
        <Space>
          <Button
            icon={<EyeTwoTone />}
            onClick={() => navigate(`/hotels/${record.id}`)}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/hotels/${record.id}/edit`)}
          />
          {!bookingMode && (
            isRazorpayXLinked ? (
              <Tag color="success">RazorpayX Linked</Tag>
            ) : (
              <Button size="small" type="primary" onClick={handleOnboard}>
                Link RazorpayX
              </Button>
            )
          )}
        </Space>
      );
    }
  };

  // Bookings column for Booking Navigation
  const bookingsColumn = {
    title: "Bookings",
    key: "bookings",
    render: (_, record) => (
      <Button
        onClick={() => navigate(`/bookings/${record.id}`)}
      >
        View Bookings
      </Button>
    )
  };

  // Determine columns based on mode
  const columns = bookingMode
    ? [...commonColumns, bookingsColumn]  // Bookings mode
    : [...commonColumns, actionColumn];   // Hotel Management mode

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={safeData}
      loading={loading}
      pagination={{
        ...pagination,
        placement: ["bottomCenter"],
      }}
      onChange={onChange}

    />
  );
}

export default HotelTable;