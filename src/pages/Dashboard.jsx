import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Row, Col, Statistic, Button, Card, Typography } from "antd";
import {
    LogoutOutlined,
    ShopOutlined,
    UserOutlined,
    SettingOutlined,
    BarChartOutlined,
    CalendarOutlined
} from "@ant-design/icons";
import { logout } from "../store/authSlice";
import { can } from "../utils/accessControl";
import axios from "axios";
import DashboardStats from "../components/dashboard/DashboardStats";
import "./Dashboard.css";

const { Title, Text } = Typography;

export default function Dashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(state => state.auth.user);
    const [stats, setStats] = React.useState(null);
    const [opStats, setOpStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/");
    };

    React.useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch financial/booking stats
                const statsResponse = await axios.get(`${import.meta.env.VITE_BOOKING_SERVICE_URL}/api/v1/booking/dashboard/stats/`);
                setStats(statsResponse.data);

                // For operational roles, fetch property stats
                if (user?.role !== 'GUEST') {
                    const opResponse = await axios.get(`${import.meta.env.VITE_PROPERTY_SERVICE_URL}/api/v1/property/dashboard/operational/`);
                    setOpStats(opResponse.data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    // Determine quick actions based on permissions
    const getQuickActions = () => {
        const actions = [];

        if (can(user, 'VIEW_USERS')) {
            actions.push({ label: 'User Management', icon: <UserOutlined />, path: '/users' });
        }

        if (can(user, 'VIEW_HOTELS')) {
            const hotel = user.hotels?.[0];
            const hotelId = typeof hotel === 'object' ? hotel.id : hotel;
            const path = (hotelId && user.role !== 'SUPER_ADMIN') ? `/hotels/${hotelId}` : '/hotels';
            actions.push({ label: 'Manage Hotels', icon: <ShopOutlined />, path });
        }

        if (user?.role === 'SUPER_ADMIN') {
            actions.push({ label: 'Assign & Change', icon: <SettingOutlined />, path: '/assignandchange' });
        }


        if (can(user, 'VIEW_BOOKINGS')) {
             const hotel = user.hotels?.[0];
             const hotelId = typeof hotel === 'object' ? hotel.id : hotel;
             const path = (hotelId && user.role !== 'SUPER_ADMIN') ? `/bookings/${hotelId}` : '/bookings';
             actions.push({ label: 'Bookings', icon: <CalendarOutlined />, path });
        }

        actions.push({ label: 'My Settings', icon: <SettingOutlined />, path: '/settings' });

        return actions;
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <h1 className="dashboard-title">Dashboard</h1>
                <p className="dashboard-subtitle">Overview of your activity and system status.</p>
            </div>

            {/* Welcome Card */}
            <div className="welcome-card">
                <div className="welcome-content">
                    <h2>Welcome back, {user?.name || "User"}!</h2>
                    <p>
                        You are logged in as a <strong>{user?.role?.replace('_', ' ') || "Guest"}</strong>.
                        Here is what's happening today.
                    </p>
                    <Button type="primary" size="large" onClick={() => navigate('/hotels')} style={{ marginRight: 12 }}>
                        View Hotels
                    </Button>
                    <Button ghost size="large" icon={<LogoutOutlined />} onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="dashboard-stats-section">
                <Title level={4} style={{ marginBottom: 16 }}>Key Metrics</Title>
                <DashboardStats stats={stats} role={user?.role} />
                
                {opStats && (user?.role === 'HOTEL_MANAGER' || user?.role === 'FRONT_DESK' || user?.role === 'SUPER_ADMIN') && (
                    <div style={{ marginTop: 24 }}>
                        <Title level={4} style={{ marginBottom: 16 }}>Operations (Today)</Title>
                        <DashboardStats stats={opStats} role={user?.role} />
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <Title level={4} style={{ marginBottom: 20 }}>Quick Actions</Title>
            <div className="quick-actions-grid">
                {getQuickActions().map((action, idx) => (
                    <div
                        key={idx}
                        className="action-card"
                        onClick={() => navigate(action.path)}
                    >
                        <div className="action-icon">{action.icon}</div>
                        <div className="action-label">{action.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 40, color: '#999', fontSize: '12px', textAlign: 'center' }}>
                HourlyStay Dashboard v1.0 &copy; 2026
            </div>
        </div>
    );
}
