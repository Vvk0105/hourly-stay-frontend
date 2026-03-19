import { useState, useEffect, useCallback } from 'react';
import useSocketEvent, { SOCKET_EVENTS } from '../../hooks/useSocketEvent';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Table, Card, Row, Col, Statistic, Select, DatePicker, Input, Button,
    Tag, Space, message, Spin
} from 'antd';
import {
    DollarOutlined, TransactionOutlined,
    SearchOutlined, DownloadOutlined, FilterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchHotelManagerTransactions, fetchHotelManagerTransactionStats } from '../../api/transactionApi';
import api from '../../api/axios';

const { RangePicker } = DatePicker;
const { Option } = Select;

const HotelManagerTransactionManagement = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    // Check if user is HOTEL_MANAGER or SUPER_ADMIN
    useEffect(() => {
        if (!user || !['HOTEL_MANAGER', 'SUPER_ADMIN'].includes(user.role)) {
            message.error('Access denied. Hotel Manager only.');
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // Filters (no hotel_id filter for hotel managers)
    const [filters, setFilters] = useState({
        status: null,
        booking_type: null,
        date_from: null,
        date_to: null,
        search: ''
    });

    useEffect(() => {
        loadStats();
    }, []);

    useEffect(() => {
        loadTransactions();
    }, [filters, pagination.current]);

    const loadTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                page: pagination.current
            };
            const response = await fetchHotelManagerTransactions(params);
            setTransactions(response.results || []);
            setPagination(prev => ({
                ...prev,
                total: response.count || 0
            }));
        } catch (error) {
            message.error('Failed to load transactions');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.current]);

    const loadStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const params = {
                date_from: filters.date_from,
                date_to: filters.date_to
            };
            const data = await fetchHotelManagerTransactionStats(params);
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, [filters.date_from, filters.date_to]);

    const handleSocketUpdate = useCallback(() => {
        loadTransactions();
        loadStats();
    }, [loadTransactions, loadStats]);

    useSocketEvent([SOCKET_EVENTS.BOOKING_UPDATED, SOCKET_EVENTS.PAYMENT_UPDATED], handleSocketUpdate);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleDateRangeChange = (dates) => {
        if (dates && dates.length === 2) {
            setFilters(prev => ({
                ...prev,
                date_from: dates[0].toISOString(),
                date_to: dates[1].toISOString()
            }));
        } else {
            setFilters(prev => ({ ...prev, date_from: null, date_to: null }));
        }
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleSearch = (value) => {
        setFilters(prev => ({ ...prev, search: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleTableChange = (newPagination) => {
        setPagination(newPagination);
    };

    const handleViewDetails = (bookingId) => {
        navigate(`/transactions/${bookingId}`);
    };

    const handleExport = async () => {
        try {
            message.loading({ content: 'Generating Excel file...', key: 'export' });

            // Build query params from current filters
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.booking_type) params.append('booking_type', filters.booking_type);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            if (filters.search) params.append('search', filters.search);

            const queryString = params.toString();
            const url = `booking/hotel-manager/transactions/export/${queryString ? '?' + queryString : ''}`;

            // Make the API call with responseType blob
            const response = await api.get(url, {
                responseType: 'blob'
            });

            // Create a blob URL and trigger download
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Generate filename with current date
            const filename = `transactions_${dayjs().format('YYYY-MM-DD_HHmmss')}.xlsx`;
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            message.success({ content: 'Export completed successfully!', key: 'export' });
        } catch (error) {
            console.error('Export error:', error);
            message.error({ content: 'Failed to export transactions', key: 'export' });
        }
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'CONFIRMED': 'blue',
            'CHECKED_IN': 'cyan',
            'CHECKED_OUT': 'green',
            'CANCELLED': 'red',
            'PENDING_PAYMENT': 'orange',
            'NO_SHOW': 'volcano'
        };
        return colorMap[status] || 'default';
    };

    const getPayoutStatusColor = (status) => {
        const colorMap = {
            'PENDING': 'orange',
            'PROCESSING': 'blue',
            'COMPLETED': 'green',
            'FAILED': 'red',
            'NA': 'default'
        };
        return colorMap[status] || 'default';
    };

    const columns = [
        {
            title: 'Booking Ref',
            dataIndex: 'booking_reference',
            key: 'booking_reference',
            fixed: 'left',
            width: 130,
            render: (text, record) => (
                <Button type="link" onClick={() => handleViewDetails(record.id)}>
                    {text}
                </Button>
            )
        },
        {
            title: 'Date & Time',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 160,
            render: (date) => dayjs(date).format('DD MMM YYYY HH:mm')
        },
        {
            title: 'Hotel',
            dataIndex: 'hotel_name',
            key: 'hotel_name',
            width: 180,
            render: (name, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{name}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{record.hotel_city}</div>
                </div>
            )
        },
        {
            title: 'Room Category',
            dataIndex: 'room_category',
            key: 'room_category',
            width: 150
        },
        {
            title: 'Type',
            dataIndex: 'booking_type',
            key: 'booking_type',
            width: 100,
            render: (type) => (
                <Tag color={type === 'HOURLY' ? 'purple' : 'geekblue'}>
                    {type}
                </Tag>
            )
        },
        {
            title: 'Customer',
            dataIndex: 'user_uuid',
            key: 'user_uuid',
            width: 120,
            render: (uuid, record) => record.is_walk_in ? 'Walk-in' : `${uuid.substring(0, 8)}...`
        },
        {
            title: 'Your Earnings',
            dataIndex: ['payout', 'hotel_share'],
            key: 'hotel_share',
            width: 120,
            align: 'right',
            render: (share) => (
                <div style={{ fontWeight: 500, color: '#52c41a' }}>
                    ₹{parseFloat(share || 0).toFixed(2)}
                </div>
            )
        },
        {
            title: 'Payout Status',
            dataIndex: ['payout', 'status'],
            key: 'payout_status',
            width: 130,
            render: (status) => status ? (
                <Tag color={getPayoutStatusColor(status)}>
                    {status}
                </Tag>
            ) : '-'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {status.replace(/_/g, ' ')}
                </Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 100,
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    onClick={() => handleViewDetails(record.id)}
                >
                    View
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <h1 style={{ marginBottom: '24px' }}>Transaction Management</h1>

            {/* Statistics Cards */}
            <Spin spinning={statsLoading}>
                <Row gutter={16} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card variant="outlined">
                            <Statistic
                                title="Total Revenue"
                                value={stats?.total_revenue || 0}
                                prefix="₹"
                                precision={2}
                                styles={{ content: { color: '#3f8600' } }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card variant="outlined">
                            <Statistic
                                title="Platform Commission"
                                value={stats?.total_commission || 0}
                                prefix="₹"
                                precision={2}
                                styles={{ content: { color: '#1890ff' } }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card variant="outlined">
                            <Statistic
                                title="Net Earnings"
                                value={stats?.total_payout || 0}
                                prefix="₹"
                                precision={2}
                                styles={{ content: { color: '#52c41a' } }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card variant="outlined">
                            <Statistic
                                title="Total Bookings"
                                value={stats?.total_bookings || 0}
                                prefix={<TransactionOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
                <Row gutter={16} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={12}>
                        <Card variant="outlined">
                            <Statistic
                                title="Hourly Bookings"
                                value={stats?.bookings_by_type?.HOURLY || 0}
                                prefix={<DollarOutlined />}
                                styles={{ content: { color: '#722ed1' } }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Card variant="outlined">
                            <Statistic
                                title="Nightly Bookings"
                                value={stats?.bookings_by_type?.NIGHTLY || 0}
                                prefix={<DollarOutlined />}
                                styles={{ content: { color: '#1890ff' } }}
                            />
                        </Card>
                    </Col>
                </Row>
            </Spin>

            {/* Filters */}
            <Card variant="outlined" style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8}>
                        <Select
                            placeholder="Status"
                            allowClear
                            style={{ width: '100%' }}
                            onChange={(value) => handleFilterChange('status', value)}
                        >
                            <Option value="CONFIRMED">Confirmed</Option>
                            <Option value="CHECKED_IN">Checked In</Option>
                            <Option value="CHECKED_OUT">Checked Out</Option>
                            <Option value="CANCELLED">Cancelled</Option>
                            <Option value="PENDING_PAYMENT">Pending Payment</Option>
                            <Option value="FAILED">Failed</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Select
                            placeholder="Booking Type"
                            allowClear
                            style={{ width: '100%' }}
                            onChange={(value) => handleFilterChange('booking_type', value)}
                        >
                            <Option value="HOURLY">Hourly</Option>
                            <Option value="NIGHTLY">Nightly</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <RangePicker
                            style={{ width: '100%' }}
                            onChange={handleDateRangeChange}
                            format="DD MMM YYYY"
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <Input.Search
                            placeholder="Search by booking reference or hotel name"
                            allowClear
                            onSearch={handleSearch}
                            prefix={<SearchOutlined />}
                        />
                    </Col>
                    <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button
                                icon={<FilterOutlined />}
                                onClick={loadStats}
                            >
                                Refresh Stats
                            </Button>
                            <Button
                                icon={<DownloadOutlined />}
                                onClick={handleExport}
                            >
                                Export Excel
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Transactions Table */}
            <Card variant="outlined">
                <Table
                    columns={columns}
                    dataSource={transactions}
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                />
            </Card>
        </div>
    );
};

export default HotelManagerTransactionManagement;
