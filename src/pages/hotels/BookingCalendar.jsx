import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Calendar, Badge, Modal, Table, Tag, Spin, message, Select, Card, Row, Col, Statistic
} from "antd";
import {
    CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
    LogoutOutlined, CloseCircleOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";

const { Option } = Select;

function BookingCalendar() {
    const { id } = useParams(); // Hotel ID
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [filterType, setFilterType] = useState("ALL");

    useEffect(() => {
        fetchBookings();
    }, [id]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await api.get(`property/hotels/${id}/bookings/`);
            setBookings(res.data);
        } catch (error) {
            message.error("Failed to load bookings");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Group bookings by date
    const getBookingsByDate = (date) => {
        const dateStr = dayjs(date).format("YYYY-MM-DD");
        return bookings.filter(booking => {
            const checkInDate = dayjs(booking.scheduled_check_in).format("YYYY-MM-DD");
            const matchesDate = checkInDate === dateStr;

            if (filterType === "ALL") return matchesDate;
            return matchesDate && booking.booking_type === filterType;
        });
    };

    // Get booking count for a specific date
    const getBookingCount = (date) => {
        return getBookingsByDate(date).length;
    };

    // Calendar cell renderer
    const dateCellRender = (value) => {
        const count = getBookingCount(value);
        if (count === 0) return null;

        // Color coding based on booking volume
        let badgeColor = "green";
        if (count >= 10) badgeColor = "red";
        else if (count >= 5) badgeColor = "orange";

        return (
            <div style={{ textAlign: "center" }}>
                <Badge
                    count={count}
                    style={{
                        backgroundColor: badgeColor,
                        cursor: "pointer"
                    }}
                />
            </div>
        );
    };

    // Handle date selection
    const onSelect = (date) => {
        const count = getBookingCount(date);
        if (count > 0) {
            setSelectedDate(date);
            setIsModalVisible(true);
        }
    };

    // Get bookings for selected date
    const selectedDateBookings = selectedDate ? getBookingsByDate(selectedDate) : [];

    // Table columns for modal
    const columns = [
        {
            title: "Reference",
            dataIndex: "booking_reference",
            key: "reference",
            render: (ref) => <strong>{ref}</strong>
        },
        {
            title: "Type",
            dataIndex: "booking_type",
            key: "type",
            render: (type) => (
                <Tag color={type === "HOURLY" ? "purple" : "blue"}>
                    {type}
                </Tag>
            )
        },
        {
            title: "Category",
            dataIndex: ["room_type", "name"],
            key: "category"
        },
        {
            title: "Check In",
            dataIndex: "scheduled_check_in",
            key: "checkIn",
            render: (date) => dayjs(date).format("DD MMM HH:mm")
        },
        {
            title: "Check Out",
            dataIndex: "scheduled_check_out",
            key: "checkOut",
            render: (date) => dayjs(date).format("DD MMM HH:mm")
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => {
                let color = "default";
                let icon = null;
                if (status === "CONFIRMED") {
                    color = "green";
                    icon = <CheckCircleOutlined />;
                }
                if (status === "CHECKED_IN") {
                    color = "gold";
                    icon = <ClockCircleOutlined />;
                }
                if (status === "CHECKED_OUT") {
                    color = "blue";
                    icon = <LogoutOutlined />;
                }
                if (status === "CANCELLED") {
                    color = "red";
                    icon = <CloseCircleOutlined />;
                }
                return (
                    <Tag color={color} icon={icon}>
                        {status}
                    </Tag>
                );
            }
        }
    ];

    // Calculate statistics
    const totalBookings = bookings.length;
    const confirmedCount = bookings.filter(b => b.status === "CONFIRMED").length;
    const checkedInCount = bookings.filter(b => b.status === "CHECKED_IN").length;
    const hourlyCount = bookings.filter(b => b.booking_type === "HOURLY").length;
    const nightlyCount = bookings.filter(b => b.booking_type === "NIGHTLY").length;

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 100 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <PageHeader
                title="Booking Calendar"
                onBack={() => navigate(`/hotels/${id}`)}
                actions={
                    <Select
                        value={filterType}
                        onChange={setFilterType}
                        style={{ width: 150 }}
                    >
                        <Option value="ALL">All Bookings</Option>
                        <Option value="HOURLY">Hourly Only</Option>
                        <Option value="NIGHTLY">Nightly Only</Option>
                    </Select>
                }
            />

            {/* Statistics Cards */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Total Bookings"
                            value={totalBookings}
                            prefix={<CalendarOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Confirmed"
                            value={confirmedCount}
                            valueStyle={{ color: "#52c41a" }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Hourly Bookings"
                            value={hourlyCount}
                            valueStyle={{ color: "#722ed1" }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Nightly Bookings"
                            value={nightlyCount}
                            valueStyle={{ color: "#1890ff" }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Calendar */}
            <Card>
                <Calendar
                    dateCellRender={dateCellRender}
                    onSelect={onSelect}
                />
            </Card>

            {/* Modal for showing bookings on selected date */}
            <Modal
                title={
                    <div>
                        <CalendarOutlined style={{ marginRight: 8 }} />
                        Bookings on {selectedDate && dayjs(selectedDate).format("DD MMMM YYYY")}
                    </div>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={900}
            >
                <Table
                    columns={columns}
                    dataSource={selectedDateBookings}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Modal>
        </div>
    );
}

export default BookingCalendar;
