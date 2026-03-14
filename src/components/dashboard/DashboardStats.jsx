import React from 'react';
import { Row, Col, Statistic, Card } from 'antd';
import {
    CalendarOutlined,
    ShopOutlined,
    UserOutlined,
    DollarCircleOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { Tooltip } from 'antd';


const DashboardStats = ({ stats, role }) => {
    if (!stats) return null;

    const renderSuperAdminStats = () => (
        <>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="stat-card">
                        <Statistic 
                            title="Total Bookings" 
                            value={stats.total_bookings} 
                            prefix={<CalendarOutlined />} 
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="stat-card">
                        <Statistic 
                            title="Monthly Revenue" 
                            value={stats.monthly_revenue} 
                            prefix="₹" 
                            precision={2}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="stat-card">
                        <Statistic 
                            title="Total Revenue" 
                            value={stats.total_revenue} 
                            prefix="₹" 
                            precision={2}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="stat-card">
                        <Statistic 
                            title="Active Bookings" 
                            value={stats.active_bookings} 
                            prefix={<ClockCircleOutlined />} 
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="stat-card">
                        <Statistic 
                            title={
                                <span>
                                    Success Rate <Tooltip title="Percentage of bookings that reached a successful status (Confirmed, Checked-in, or Checked-out), reflecting the overall booking fulfillment."><InfoCircleOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} /></Tooltip>
                                </span>

                            }
                            value={
                                ((stats.status_breakdown?.CONFIRMED || 0) + 
                                 (stats.status_breakdown?.CHECKED_IN || 0) + 
                                 (stats.status_breakdown?.CHECKED_OUT || 0)) / 
                                (stats.total_bookings || 1) * 100
                            } 
                            suffix="%" 
                            prefix={<CheckCircleOutlined />} 
                            precision={1}
                        />
                    </Card>
                </Col>
            </Row>
        </>
    );

    const renderManagementStats = () => (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
                <Card bordered={false} className="stat-card">
                    <Statistic 
                        title="My Bookings" 
                        value={stats.total_bookings} 
                        prefix={<CalendarOutlined />} 
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card bordered={false} className="stat-card">
                    <Statistic 
                        title="Revenue (MTD)" 
                        value={stats.monthly_revenue} 
                        prefix="₹" 
                        precision={2}
                        valueStyle={{ color: '#3f8600' }}
                    />

                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card bordered={false} className="stat-card">
                    <Statistic 
                        title="Active Now" 
                        value={stats.active_bookings} 
                        prefix={<ClockCircleOutlined />} 
                        valueStyle={{ color: '#1890ff' }}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card bordered={false} className="stat-card">
                    <Statistic 
                        title={
                            <span>
                                Success Rate <Tooltip title="Percentage of bookings that were confirmed, checked-in, or checked-out out of total bookings."><InfoCircleOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} /></Tooltip>
                            </span>
                        }
                        value={
                            ((stats.status_breakdown?.CONFIRMED || 0) + 
                             (stats.status_breakdown?.CHECKED_IN || 0) + 
                             (stats.status_breakdown?.CHECKED_OUT || 0)) / 
                            (stats.total_bookings || 1) * 100
                        } 
                        suffix="%" 
                        prefix={<CheckCircleOutlined />} 
                        precision={1}
                    />

                </Card>
            </Col>
        </Row>
    );

    const renderOperationalStats = (opStats) => (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
                <Card bordered={false} className="stat-card highlight-arrival">
                    <Statistic 
                        title="Today's Arrivals" 
                        value={opStats.arrivals_today} 
                        prefix={<CalendarOutlined />} 
                        valueStyle={{ color: '#52c41a' }}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card bordered={false} className="stat-card highlight-departure">
                    <Statistic 
                        title="Today's Departures" 
                        value={opStats.departures_today} 
                        prefix={<LogoutOutlined />} 
                        valueStyle={{ color: '#faad14' }}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card bordered={false} className="stat-card highlight-dirty">
                    <Statistic 
                        title="Dirty Rooms" 
                        value={opStats.dirty_rooms} 
                        prefix={<ExclamationCircleOutlined />} 
                        valueStyle={{ color: '#ff4d4f' }}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card bordered={false} className="stat-card highlight-available">
                    <Statistic 
                        title="Available Rooms" 
                        value={opStats.available_rooms} 
                        prefix={<ShopOutlined />} 
                        valueStyle={{ color: '#1890ff' }}
                    />
                </Card>
            </Col>
        </Row>
    );

    if (stats.arrivals_today !== undefined) return renderOperationalStats(stats);
    if (role === 'SUPER_ADMIN') return renderSuperAdminStats();
    return renderManagementStats();
};

import { LogoutOutlined } from '@ant-design/icons';

export default DashboardStats;
