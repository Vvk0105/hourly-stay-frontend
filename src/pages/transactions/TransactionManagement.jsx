import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Table, Card, Row, Col, Statistic, Select, DatePicker, Input, Button,
    Tag, Space, message, Spin
} from 'antd';
import {
    DollarOutlined, TransactionOutlined, BankOutlined,
    SearchOutlined, DownloadOutlined, FilterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchTransactions, fetchTransactionStats } from '../../api/transactionApi';
import api from '../../api/axios';

const { RangePicker } = DatePicker;
const { Option } = Select;

const TransactionManagement = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    // Check if user is SUPER_ADMIN
    useEffect(() => {
        if (user?.role !== 'SUPER_ADMIN') {
            message.error('Access denied. SuperAdmin only.');
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [hotels, setHotels] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // Filters
    const [filters, setFilters] = useState({
        hotel_id: null,
        status: null,
        booking_type: null,
        date_from: null,
        date_to: null,
        search: ''
    });

    useEffect(() => {
        loadHotels();
        loadStats();
    }, []);

    useEffect(() => {
        loadTransactions();
    }, [filters, pagination.current]);

    const loadHotels = async () => {
        try {
            const response = await api.get('property/hotels/');
            setHotels(response.data.results || response.data);
        } catch (error) {
            console.error('Error loading hotels:', error);
        }
    };

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                page: pagination.current
            };
            const response = await fetchTransactions(params);
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
    };

    const loadStats = async () => {
        setStatsLoading(true);
        try {
            const params = {
                hotel_id: filters.hotel_id,
                date_from: filters.date_from,
                date_to: filters.date_to
            };
            const data = await fetchTransactionStats(params);
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setStatsLoading(false);
        }
    };

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
        message.info('Export functionality coming soon');
        // TODO: Implement CSV export
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'CONFIRMED': 'blue',
            'CHECKED_IN': 'cyan',
            'CHECKED_OUT': 'green',
            'CANCELLED': 'red',
            'PENDING_PAYMENT': 'orange',
            'FAILED': 'red',
            'NO_SHOW': 'volcano'
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
            title: 'Amount',
            dataIndex: 'total_amount',
            key: 'total_amount',
            width: 100,
            align: 'right',
            render: (amount) => `₹${parseFloat(amount).toFixed(2)}`
        },
        {
            title: 'Commission',
            key: 'commission',
            width: 140,
            align: 'right',
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 500, color: '#1890ff' }}>
                        ₹{record.commission_amount?.toFixed(2) || '0.00'}
                    </div>
                    {record.commission_percent_applied > 0 && (
                        <div style={{ fontSize: '12px', color: '#888' }}>
                            ({record.commission_percent_applied}%)
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Net Payout',
            dataIndex: 'net_payout',
            key: 'net_payout',
            width: 120,
            align: 'right',
            render: (payout) => (
                <div style={{ fontWeight: 500, color: '#52c41a' }}>
                    ₹{payout?.toFixed(2) || '0.00'}
                </div>
            )
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
                        <Card>
                            <Statistic
                                title="Total Revenue"
                                value={stats?.total_revenue || 0}
                                prefix="₹"
                                precision={2}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Platform Commission"
                                value={stats?.total_commission || 0}
                                precision={2}
                                valueStyle={{ color: '#1890ff' }}
                                prefix={<DollarOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Net Payout"
                                value={stats?.total_payout || 0}
                                precision={2}
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<BankOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Total Transactions"
                                value={stats?.total_bookings || 0}
                                prefix={<TransactionOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            </Spin>

            {/* Filters */}
            <Card style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Select
                            placeholder="Select Hotel"
                            allowClear
                            showSearch
                            style={{ width: '100%' }}
                            onChange={(value) => handleFilterChange('hotel_id', value)}
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {hotels.map(hotel => (
                                <Option key={hotel.id} value={hotel.id}>
                                    {hotel.name}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
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
                    <Col xs={24} sm={12} md={6}>
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
                    <Col xs={24} sm={12} md={6}>
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
                                Export CSV
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Transactions Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={transactions}
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    scroll={{ x: 1500 }}
                />
            </Card>
        </div>
    );
};

export default TransactionManagement;
