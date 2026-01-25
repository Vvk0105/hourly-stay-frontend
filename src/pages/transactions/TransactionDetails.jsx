import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card, Row, Col, Descriptions, Tag, Button, Spin, message, Breadcrumb, Divider
} from 'antd';
import { ArrowLeftOutlined, HomeOutlined, TransactionOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchTransactionDetails } from '../../api/transactionApi';

const TransactionDetails = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [transaction, setTransaction] = useState(null);

    useEffect(() => {
        loadTransactionDetails();
    }, [bookingId]);

    const loadTransactionDetails = async () => {
        setLoading(true);
        try {
            const data = await fetchTransactionDetails(bookingId);
            setTransaction(data);
        } catch (error) {
            message.error('Failed to load transaction details');
            console.error(error);
        } finally {
            setLoading(false);
        }
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

    if (loading || !transaction) {
        return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    const commission = transaction.commission_amount || 0;
    const netPayout = transaction.net_payout || 0;

    return (
        <div style={{ padding: '24px' }}>
            {/* Breadcrumb */}
            <Breadcrumb style={{ marginBottom: '16px' }}>
                <Breadcrumb.Item href="/dashboard">
                    <HomeOutlined />
                </Breadcrumb.Item>
                <Breadcrumb.Item href="/transactions">
                    <TransactionOutlined />
                    <span>Transactions</span>
                </Breadcrumb.Item>
                <Breadcrumb.Item>{transaction.booking_reference}</Breadcrumb.Item>
            </Breadcrumb>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/transactions')}
                        style={{ marginRight: '16px' }}
                    >
                        Back
                    </Button>
                    <span style={{ fontSize: '24px', fontWeight: 600 }}>
                        {transaction.booking_reference}
                    </span>
                    <Tag
                        color={getStatusColor(transaction.status)}
                        style={{ marginLeft: '12px', fontSize: '14px', padding: '4px 12px' }}
                    >
                        {transaction.status.replace(/_/g, ' ')}
                    </Tag>
                </div>
                <div style={{ fontSize: '14px', color: '#888' }}>
                    {dayjs(transaction.created_at).format('DD MMM YYYY, HH:mm')}
                </div>
            </div>

            <Row gutter={[16, 16]}>
                {/* Booking Information */}
                <Col xs={24} lg={12}>
                    <Card title="Booking Information" bordered>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Hotel">
                                {transaction.hotel_details?.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="City">
                                {transaction.hotel_details?.city}
                            </Descriptions.Item>
                            <Descriptions.Item label="Room Category">
                                {transaction.room_type_details?.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Booking Type">
                                <Tag color={transaction.booking_type === 'HOURLY' ? 'purple' : 'geekblue'}>
                                    {transaction.booking_type}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Check-In">
                                {dayjs(transaction.scheduled_check_in).format('DD MMM YYYY, HH:mm')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Check-Out">
                                {dayjs(transaction.scheduled_check_out).format('DD MMM YYYY, HH:mm')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Rooms">
                                {transaction.rooms_count}
                            </Descriptions.Item>
                            <Descriptions.Item label="Adults">
                                {transaction.adults_count}
                            </Descriptions.Item>
                            <Descriptions.Item label="Children">
                                {transaction.children_count}
                            </Descriptions.Item>
                            <Descriptions.Item label="Customer Type">
                                {transaction.is_walk_in ? (
                                    <Tag color="orange">Walk-in</Tag>
                                ) : (
                                    <Tag color="blue">Online</Tag>
                                )}
                            </Descriptions.Item>
                            {!transaction.is_walk_in && (
                                <Descriptions.Item label="User UUID">
                                    <code style={{ fontSize: '11px' }}>{transaction.user_uuid}</code>
                                </Descriptions.Item>
                            )}
                            {transaction.assigned_room_details && (
                                <Descriptions.Item label="Assigned Room">
                                    Room {transaction.assigned_room_details.room_number}
                                    {' '}(Floor {transaction.assigned_room_details.floor_number})
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Card>
                </Col>

                {/* Payment Information */}
                <Col xs={24} lg={12}>
                    <Card title="Payment Information" bordered>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Payment Status">
                                <Tag color={transaction.payment_status === 'SUCCESS' ? 'green' : 'orange'}>
                                    {transaction.payment_status || 'N/A'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Razorpay Order ID">
                                <code style={{ fontSize: '11px' }}>
                                    {transaction.razorpay_order_id || 'N/A'}
                                </code>
                            </Descriptions.Item>
                            <Descriptions.Item label="Razorpay Payment ID">
                                <code style={{ fontSize: '11px' }}>
                                    {transaction.razorpay_payment_id || 'N/A'}
                                </code>
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        {/* Financial Breakdown */}
                        <div style={{ marginTop: '16px' }}>
                            <h4 style={{ marginBottom: '12px' }}>Financial Breakdown</h4>
                            <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Base Amount:</span>
                                    <span style={{ fontWeight: 500 }}>₹{parseFloat(transaction.base_amount).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Tax ({transaction.hotel_details?.tax_name} @ {transaction.hotel_details?.tax_percent}%):</span>
                                    <span style={{ fontWeight: 500 }}>₹{parseFloat(transaction.tax_amount).toFixed(2)}</span>
                                </div>
                                {transaction.discount_amount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#52c41a' }}>
                                        <span>Discount:</span>
                                        <span style={{ fontWeight: 500 }}>- ₹{parseFloat(transaction.discount_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                <Divider style={{ margin: '12px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: 600 }}>Gross Total:</span>
                                    <span style={{ fontSize: '16px', fontWeight: 600 }}>₹{parseFloat(transaction.total_amount).toFixed(2)}</span>
                                </div>

                                {/* Commission Breakdown */}
                                <div style={{ backgroundColor: '#e6f7ff', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 500, color: '#1890ff' }}>Platform Commission</div>
                                            {transaction.commission_percent_applied > 0 && (
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    @ {transaction.commission_percent_applied}%
                                                </div>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#1890ff' }}>
                                            ₹{commission.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <Divider style={{ margin: '12px 0' }} />

                                {/* Net Payout */}
                                <div style={{ backgroundColor: '#f6ffed', padding: '12px', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#52c41a' }}>
                                            Net Payout to Hotel:
                                        </span>
                                        <span style={{ fontSize: '18px', fontWeight: 700, color: '#52c41a' }}>
                                            ₹{netPayout.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Hotel Commission Configuration (for reference) */}
                {transaction.hotel_details && (
                    <Col xs={24}>
                        <Card title="Hotel Commission Settings" bordered>
                            <Descriptions column={3} bordered size="small">
                                <Descriptions.Item label="Commission Type">
                                    <Tag color={transaction.hotel_details.commission_type === 'PERCENTAGE' ? 'blue' : 'green'}>
                                        {transaction.hotel_details.commission_type}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Commission Percentage">
                                    {transaction.hotel_details.commission_percent}%
                                </Descriptions.Item>
                                <Descriptions.Item label="Fixed Commission Amount">
                                    ₹{parseFloat(transaction.hotel_details.fixed_commission_amount || 0).toFixed(2)}
                                </Descriptions.Item>
                                {transaction.hotel_details.razorpay_account_id && (
                                    <Descriptions.Item label="Razorpay Account ID" span={3}>
                                        <code>{transaction.hotel_details.razorpay_account_id}</code>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </Card>
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default TransactionDetails;
