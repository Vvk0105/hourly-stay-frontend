import { useState, useEffect } from 'react';
import useSocketEvent, { SOCKET_EVENTS } from '../../hooks/useSocketEvent';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Card, Row, Col, Descriptions, Tag, Button, Spin, message, Breadcrumb, Divider, Typography, Space, Tooltip
} from 'antd';
import {
    ArrowLeftOutlined, HomeOutlined, BookOutlined,
    CalendarOutlined, UserOutlined, ClockCircleOutlined,
    CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined,
    TransactionOutlined, DownloadOutlined
} from '@ant-design/icons';

import dayjs from 'dayjs';
import api from '../../api/axios';
import { fetchTransactionDetails, fetchHotelManagerTransactionDetails } from '../../api/transactionApi';
import PageHeader from '../../components/common/PageHeader';

const { Title, Text } = Typography;

const BookingDetails = () => {
    const { id: bookingId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(null);

    const loadBookingDetails = async () => {
        setLoading(true);
        try {
            const data = user?.role === 'HOTEL_MANAGER'
                ? await fetchHotelManagerTransactionDetails(bookingId)
                : await fetchTransactionDetails(bookingId);
            setBooking(data);
        } catch (error) {
            message.error('Failed to load booking details');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookingDetails();
    }, [bookingId]);

    useSocketEvent([SOCKET_EVENTS.BOOKING_UPDATED, SOCKET_EVENTS.PAYMENT_UPDATED], loadBookingDetails);

    const handleDownloadInvoice = async () => {
        try {
            message.loading({ content: 'Generating Invoice...', key: 'invoice' });

            const response = await api.get(`booking/bookings/${bookingId}/invoice/`, {
                responseType: 'blob',
            });

            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);

            const link = document.createElement('a');
            link.href = fileURL;
            link.download = `Invoice_INV-${bookingId}_${booking.booking_reference}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(fileURL);

            message.success({ content: 'Invoice downloaded successfully!', key: 'invoice', duration: 3 });
        } catch (error) {
            console.error('Download failed:', error);
            message.error({ content: 'Failed to generate invoice. Please try again.', key: 'invoice', duration: 3 });
        }
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'CONFIRMED': 'green',
            'CHECKED_IN': 'gold',
            'CHECKED_OUT': 'blue',
            'CANCELLED': 'red',
            'PENDING_PAYMENT': 'orange',
            'FAILED': 'volcano',
        };
        return colorMap[status] || 'default';
    };

    if (loading || !booking) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <Spin size="large">
                    <div style={{ marginTop: 16 }}>Loading booking details...</div>
                </Spin>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ color: '#888', marginBottom: 16 }}>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>Home</span> / 
                <span style={{ cursor: 'pointer', marginLeft: 4, marginRight: 4 }} onClick={() => navigate('/bookings')}> Bookings </span> / 
                <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/bookings/${booking.hotel}`)}> {booking.hotel_details?.name || "..."} </span> / 
                 {booking.booking_reference}
            </div>
            <PageHeader
                title={`Booking: ${booking.booking_reference}`}
                actions={[
                    <Tag key="status" color={getStatusColor(booking.status)} style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '12px' }}>
                        {booking.status.replace(/_/g, ' ')}
                    </Tag>,
                    ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(booking.status) ? (
                        <Button
                            key="download"
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={handleDownloadInvoice}
                            ghost
                        >
                            Download Invoice
                        </Button>
                    ) : null
                ]}
            />

            <Row gutter={[24, 24]}>
                {/* Main Information Section */}
                <Col xs={24} lg={16}>
                    <Space orientation="vertical" size="large" style={{ width: '100%' }}>

                        {/* Stay Details */}
                        <Card title={<Space orientation="horizontal"><CalendarOutlined />Stay Details</Space>} variant="borderless" className="detail-card">
                            <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                                <Descriptions.Item label="Check-In">
                                    <Text strong>{dayjs(booking.scheduled_check_in).format('DD MMM YYYY')}</Text>
                                    <br />
                                    <Text type="secondary">{dayjs(booking.scheduled_check_in).format('HH:mm')}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Check-Out">
                                    <Text strong>{dayjs(booking.scheduled_check_out).format('DD MMM YYYY')}</Text>
                                    <br />
                                    <Text type="secondary">{dayjs(booking.scheduled_check_out).format('HH:mm')}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Booking Type">
                                    <Tag color={booking.booking_type === 'HOURLY' ? 'purple' : 'geekblue'}>
                                        {booking.booking_type}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Duration">
                                    {dayjs(booking.scheduled_check_out).diff(dayjs(booking.scheduled_check_in), 'hour')} hours
                                </Descriptions.Item>
                                <Descriptions.Item label="Room Category">
                                    {booking.room_type_details?.name}
                                </Descriptions.Item>
                                <Descriptions.Item label="Rooms / Guests">
                                    {booking.rooms_count} Room(s), {booking.adults_count} Adult(s)
                                </Descriptions.Item>
                                {booking.assigned_room_details && (
                                    <Descriptions.Item label="Assigned Room">
                                        <Tag color="blue">Room {booking.assigned_room_details.room_number}</Tag>
                                        <Text type="secondary"> (Floor {booking.assigned_room_details.floor_number})</Text>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </Card>

                        {/* Financial Details */}
                        <Card title={<Space orientation="horizontal"><TransactionOutlined />Financial Breakdown</Space>} variant="borderless">
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Descriptions column={1} size="small">
                                        <Descriptions.Item label="Base Amount">₹{parseFloat(booking.base_amount).toFixed(2)}</Descriptions.Item>
                                        <Descriptions.Item label="Tax">₹{parseFloat(booking.tax_amount).toFixed(2)}</Descriptions.Item>
                                        {booking.discount_amount > 0 && (
                                            <Descriptions.Item label="Discount">
                                                <Text type="success">- ₹{parseFloat(booking.discount_amount).toFixed(2)}</Text>
                                            </Descriptions.Item>
                                        )}
                                        <Descriptions.Item label={<Text strong>Gross Amount</Text>}>
                                            <Text strong style={{ fontSize: '18px' }}>₹{parseFloat(booking.total_amount).toFixed(2)}</Text>
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Col>
                                <Col span={12} style={{ borderLeft: '1px solid #f0f0f0' }}>
                                    <Descriptions column={1} size="small">
                                        <Descriptions.Item label="Payment Status">
                                            <Tag color={booking.payment_status === 'SUCCESS' ? 'green' : 'orange'}>
                                                {booking.payment_status || 'PENDING'}
                                            </Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Transaction ID">
                                            <Text copyable style={{ fontSize: '12px' }}>{booking.razorpay_payment_id || 'N/A'}</Text>
                                        </Descriptions.Item>
                                        {user?.role === 'SUPERADMIN' && (
                                            <>
                                                <Descriptions.Item label="Commission">
                                                    <Text type="danger">₹{parseFloat(booking.commission_amount).toFixed(2)}</Text>
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Net Payout">
                                                    <Text type="success" strong>₹{parseFloat(booking.net_payout).toFixed(2)}</Text>
                                                </Descriptions.Item>
                                            </>
                                        )}
                                    </Descriptions>
                                </Col>
                            </Row>
                        </Card>

                        {/* Refund Information */}
                        {booking.refund_request && (
                            <Card
                                title={<Space orientation="horizontal"><InfoCircleOutlined /> Refund Details</Space>}
                                variant="outlined"
                                styles={{ header: { backgroundColor: '#fff7e6' }, body: { backgroundColor: '#fffbe6' } }}
                            >
                                <Descriptions column={{ xs: 1, sm: 2 }}>
                                    <Descriptions.Item label="Refund Status">
                                        <Tag color={booking.refund_request.status === 'COMPLETED' ? 'green' : 'orange'}>
                                            {booking.refund_request.status}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Refund Amount">
                                        <Text strong style={{ color: '#d46b08', fontSize: '16px' }}>
                                            ₹{booking.refund_request.refund_amount}
                                        </Text>
                                        <Text type="secondary" style={{ marginLeft: 8 }}>
                                            ({booking.refund_request.refund_percentage}%)
                                        </Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Reason">
                                        {booking.refund_request.reason}
                                    </Descriptions.Item>
                                    {booking.refund_request.processed_at && (
                                        <Descriptions.Item label="Processed At">
                                            {dayjs(booking.refund_request.processed_at).format('DD MMM YYYY, HH:mm')}
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </Card>
                        )}
                    </Space>
                </Col>

                {/* Sidebar Info */}
                <Col xs={24} lg={8}>
                    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                        <Card title="Hotel Details" variant="outlined">
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Name"><Text strong>{booking.hotel_details?.name}</Text></Descriptions.Item>
                                <Descriptions.Item label="Location">{booking.hotel_details?.city}, {booking.hotel_details?.state}</Descriptions.Item>
                            </Descriptions>
                            <Divider style={{ margin: '12px 0' }} />
                            <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/hotels/${booking.hotel}`)}>
                                View Hotel Management
                            </Button>
                        </Card>

                        <Card title="Customer Information" variant="outlined">
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Guest Name">
                                    <Text strong>{booking.guest_name || "Online Guest"}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Source">
                                    {booking.is_walk_in ? <Tag color="orange">Walk-in</Tag> : <Tag color="blue">Online</Tag>}
                                </Descriptions.Item>
                                <Descriptions.Item label="Reference">
                                    <code style={{ fontSize: '11px' }}>{booking.booking_reference}</code>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Space>
                </Col>
            </Row>
        </div>
    );
};

export default BookingDetails;
