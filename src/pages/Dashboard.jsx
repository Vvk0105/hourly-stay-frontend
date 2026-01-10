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
import "./Dashboard.css";

const { Title, Text } = Typography;

export default function Dashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(state => state.auth.user);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/");
    };

    // Determine quick actions based on role
    const getQuickActions = () => {
        const actions = [
            { label: 'Manage Hotels', icon: <ShopOutlined />, path: '/hotels' },
            { label: 'My Settings', icon: <SettingOutlined />, path: '/settings' },
        ];

        if (user?.role === 'SUPER_ADMIN') {
            actions.unshift({ label: 'User Management', icon: <UserOutlined />, path: '/users' });
            actions.push({ label: 'System Health', icon: <BarChartOutlined />, path: '/assignandchange' });
        }

        if (user?.role === 'HOTEL_MANAGER') {
            actions.unshift({ label: 'Bookings', icon: <CalendarOutlined />, path: '/bookings/1' });
        }

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

            {/* Stats Example */}
            <div className="dashboard-stats-grid">
                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} md={6}>
                        <div className="stat-card">
                            <Statistic title="Total Properties" value={12} prefix={<ShopOutlined />} />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div className="stat-card">
                            <Statistic title="Active Bookings" value={8} prefix={<CalendarOutlined />} valueStyle={{ color: '#3f8600' }} />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div className="stat-card">
                            <Statistic title="Total Users" value={93} prefix={<UserOutlined />} />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div className="stat-card">
                            <Statistic title="System Status" value="Online" valueStyle={{ color: '#52c41a' }} />
                        </div>
                    </Col>
                </Row>
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
