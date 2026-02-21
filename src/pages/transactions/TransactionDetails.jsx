import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Card, Row, Col, Descriptions, Tag, Button, Spin, message, Breadcrumb, Divider
} from 'antd';
import { ArrowLeftOutlined, HomeOutlined, TransactionOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchTransactionDetails, fetchHotelManagerTransactionDetails } from '../../api/transactionApi';

const TransactionDetails = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [loading, setLoading] = useState(false);
    const [transaction, setTransaction] = useState(null);

    useEffect(() => {
        loadTransactionDetails();
    }, [bookingId]);

    const loadTransactionDetails = async () => {
        setLoading(true);
        try {
            // Use hotel manager endpoint if user is hotel manager
            const data = user?.role === 'HOTEL_MANAGER'
                ? await fetchHotelManagerTransactionDetails(bookingId)
                : await fetchTransactionDetails(bookingId);
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

    const payout = transaction.payout || {};
    const hotelDetails = transaction.hotel_details || {};

    const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toFixed(2)}`;

    return (
        <div style={{ padding: '24px' }}>
            {/* Breadcrumb */}
            <Breadcrumb style={{ marginBottom: '16px' }}>
                <Breadcrumb.Item href="/dashboard">
                    <HomeOutlined />
                </Breadcrumb.Item>
                <Breadcrumb.Item href={user?.role === 'HOTEL_MANAGER' ? '/hotel-manager/transactions' : '/transactions'}>
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
                        onClick={() => navigate(user?.role === 'HOTEL_MANAGER' ? '/hotel-manager/transactions' : '/transactions')}
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


                    {/* Refund Information */}
                    {transaction.refund_request && (
                        <Card title="Refund Information" bordered style={{ marginTop: '16px' }}>
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="Status">
                                    <Tag color={transaction.refund_request.status === 'COMPLETED' ? 'green' : 'red'}>
                                        {transaction.refund_request.status}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Refund Amount">
                                    <span style={{ fontWeight: 'bold', color: 'green' }}>
                                        ₹{transaction.refund_request.refund_amount}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>
                                        ({transaction.refund_request.refund_percentage}%)
                                    </span>
                                </Descriptions.Item>
                                <Descriptions.Item label="Reason">
                                    {transaction.refund_request.reason}
                                </Descriptions.Item>
                                <Descriptions.Item label="Processed At">
                                    {transaction.refund_request.processed_at ? dayjs(transaction.refund_request.processed_at).format('DD MMM YYYY, HH:mm') : '-'}
                                </Descriptions.Item>
                                {transaction.refund_request.failure_reason && (
                                    <Descriptions.Item label="Failure Reason">
                                        <span style={{ color: 'red' }}>{transaction.refund_request.failure_reason}</span>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </Card>
                    )}
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

                            {transaction.payment_details ? (
                                <>
                                    <Descriptions.Item label="Method">
                                        {transaction.payment_details.method ? transaction.payment_details.method.toUpperCase() : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Gateway Fee">
                                        ₹{((transaction.payment_details.fee || 0) / 100).toFixed(2)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Gateway Tax">
                                        ₹{((transaction.payment_details.tax || 0) / 100).toFixed(2)}
                                    </Descriptions.Item>
                                </>
                            ) : null}

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
                            <h4 style={{ marginBottom: '12px' }}>Financial Split Breakdown</h4>
                            <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Collected from Guest:</span>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(transaction.total_amount)}</span>
                                </div>
                                <Divider style={{ margin: '8px 0' }} />

                                {Object.keys(payout).length > 0 ? (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span>Room Base Amount:</span>
                                            <span>{formatCurrency(payout.room_base_amount)}</span>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span>Tax Collected ({hotelDetails.tax_name}):</span>
                                            <span>{formatCurrency(payout.tax_collected)}</span>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#1890ff' }}>
                                            <span>Platform Commission ({transaction.hotel_details?.commission_type === 'PERCENTAGE' ? `${transaction.hotel_details?.commission_percent}%` : 'Fixed'}):</span>
                                            <span>- {formatCurrency(payout.platform_commission)}</span>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#fa8c16' }}>
                                            <span>Commission GST (18%):</span>
                                            <span>- {formatCurrency(payout.commission_gst)}</span>
                                        </div>

                                        {parseFloat(payout.tcs_deducted) > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#f5222d' }}>
                                                <span>TCS Deducted (1%):</span>
                                                <span>- {formatCurrency(payout.tcs_deducted)}</span>
                                            </div>
                                        )}

                                        <Divider style={{ margin: '12px 0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '16px', fontWeight: 600, color: '#52c41a' }}>Final Hotel Share:</span>
                                            <span style={{ fontSize: '18px', fontWeight: 700, color: '#52c41a' }}>
                                                {formatCurrency(payout.hotel_share)}
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: '12px', color: '#888' }}>
                                            (Amount {payout.status === 'COMPLETED' ? 'transferred' : 'to be transferred'} to hotel)
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '16px 0', color: '#888' }}>
                                        <em>Payout calculations are pending. This will update when the background task runs.</em>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payout Tracking */}
                        {payout.status && (
                            <div style={{ marginTop: '24px' }}>
                                <h4 style={{ marginBottom: '12px' }}>Payout Status</h4>
                                <Descriptions column={1} bordered size="small">
                                    <Descriptions.Item label="Status">
                                        <Tag color={payout.status === 'COMPLETED' ? 'green' : payout.status === 'FAILED' ? 'red' : 'blue'}>
                                            {payout.status}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Method">
                                        {payout.method?.replace(/_/g, ' ')}
                                    </Descriptions.Item>
                                    {payout.payout_reference && (
                                        <Descriptions.Item label="Reference ID">
                                            <code>{payout.payout_reference}</code>
                                        </Descriptions.Item>
                                    )}
                                    {payout.completed_at && (
                                        <Descriptions.Item label="Processed At">
                                            {dayjs(payout.completed_at).format('DD MMM YYYY, HH:mm')}
                                        </Descriptions.Item>
                                    )}
                                    {payout.notes && (
                                        <Descriptions.Item label="Notes">
                                            <span style={{ color: '#f5222d' }}>{payout.notes}</span>
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </div>
                        )}
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
        </div >
    );
};

export default TransactionDetails;
