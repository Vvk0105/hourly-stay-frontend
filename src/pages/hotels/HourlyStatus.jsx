import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Typography, Row, Col, Tag, message, Spin, Tooltip, Radio, DatePicker, Statistic, Alert } from "antd";
import { PoweroffOutlined, ArrowLeftOutlined, ClockCircleOutlined, ThunderboltOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";
import api from "../../api/axios";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function HourlyStatus() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("INACTIVE");
    const [hotelName, setHotelName] = useState("Hotel");
    const [currentWindow, setCurrentWindow] = useState(null);
    const [slotsData, setSlotsData] = useState(null);

    // Control Panel State
    const [mode, setMode] = useState("AUTO");
    const [customRange, setCustomRange] = useState([]);

    // Mock Stats (to be replaced with real data later if available)
    const [stats, setStats] = useState({
        guestsToday: 0,
        revenueToday: 0
    });

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(() => {
            if (status === 'ACTIVE') {
                fetchSlots();
            }
        }, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [id, status]);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            // 1. Get Hotel Name
            const hotelRes = await api.get(`property/hotels/${id}/`);
            setHotelName(hotelRes.data.name);

            // 2. Get Hourly Status
            const statusRes = await api.get(`property/hotels/${id}/hourly-operations/`);
            const apiStatus = statusRes.data.status;
            setStatus(apiStatus);

            if (apiStatus === 'ACTIVE') {
                setCurrentWindow(statusRes.data.window);
                fetchSlots();
            } else {
                setCurrentWindow(null);
                setSlotsData(null);
            }
        } catch (err) {
            console.error(err);
            message.error("Failed to fetch hourly status");
        } finally {
            setLoading(false);
        }
    };

    const fetchSlots = async () => {
        try {
            const res = await api.get(`property/hotels/${id}/hourly-slots/`);
            setSlotsData(res.data);
        } catch (e) {
            console.error("Failed to fetch slots");
        }
    };

    const handleStartOperations = async () => {
        try {
            const payload = { mode };

            if (mode === 'CUSTOM') {
                if (!customRange || customRange.length < 2) {
                    message.error("Please select a time range");
                    return;
                }
                payload.start_datetime = customRange[0].toISOString();
                payload.end_datetime = customRange[1].toISOString();
            }

            const res = await api.post(`property/hotels/${id}/hourly-operations/`, payload);

            setStatus("ACTIVE");
            setCurrentWindow(res.data.window);
            message.success("Hourly operations started!");
            fetchSlots();
        } catch (err) {
            console.error(err);
            message.error("Failed to start operations");
        }
    };

    const handleStopOperations = async () => {
        try {
            await api.delete(`property/hotels/${id}/hourly-operations/`);
            setStatus("INACTIVE");
            setCurrentWindow(null);
            setSlotsData(null);
            message.info("Hourly operations stopped");
        } catch (err) {
            console.error(err);
            message.error("Failed to stop operations");
        }
    };

    if (loading && !status) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

    return (
        <div style={{ padding: 24, paddingBottom: 50 }}>
            {/* Page Header */}
            <div style={{ marginBottom: 24 }}>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(`/hotels/${id}`)}
                    style={{ marginBottom: 16 }}
                >
                    Back to Hotel
                </Button>
                <Title level={2} style={{ margin: 0 }}>{hotelName} - Hourly Operations</Title>
            </div>

            <Row gutter={24}>
                {/* Left Column: Status, Controls, Live View */}
                <Col xs={24} md={14}>
                    {/* 1. Status Card */}
                    <Card style={{ marginBottom: 24, textAlign: 'center', border: status === 'ACTIVE' ? '1px solid #52c41a' : '1px solid #d9d9d9' }}>
                        <Statistic
                            title="Current Hourly Status"
                            value={status}
                            valueStyle={{ color: status === 'ACTIVE' ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}
                            prefix={status === 'ACTIVE' ? <ThunderboltOutlined /> : <PoweroffOutlined />}
                        />
                        {status === 'ACTIVE' && currentWindow && (
                            <div style={{ marginTop: 16 }}>
                                <Tag color="green" style={{ fontSize: 16, padding: '6px 14px' }}>
                                    Accepting Guests until: <b>{dayjs(currentWindow.end_datetime).local().format("DD MMM, hh:mm A")}</b>
                                </Tag>
                                <div style={{ marginTop: 16 }}>
                                    <Button danger type="primary" onClick={handleStopOperations}>Stop Operations</Button>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* 2. Start Operations Control (Only if Inactive) */}
                    {status === 'INACTIVE' && (
                        <Card title="Start Operations" style={{ marginBottom: 24 }}>
                            <Text strong>Choose how you want to open availability:</Text>
                            <div style={{ margin: '16px 0' }}>
                                <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} buttonStyle="solid">
                                    <Radio.Button value="AUTO">Auto Mode</Radio.Button>
                                    <Radio.Button value="CUSTOM">Custom Schedule</Radio.Button>
                                </Radio.Group>
                            </div>

                            {mode === 'AUTO' && (
                                <Alert
                                    message="Auto Mode"
                                    description="Opens availability immediately. Automatically closes at the standard check-out time tomorrow."
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                            )}

                            {mode === 'CUSTOM' && (
                                <div style={{ marginBottom: 16 }}>
                                    <Text style={{ display: 'block', marginBottom: 8 }}>Select Valid Window:</Text>
                                    <RangePicker
                                        showTime
                                        format="YYYY-MM-DD HH:mm"
                                        onChange={(dates) => setCustomRange(dates)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            )}

                            <Button type="primary" size="large" icon={<ClockCircleOutlined />} onClick={handleStartOperations} block>
                                {mode === 'AUTO' ? "Start Now" : "Set Custom Schedule"}
                            </Button>
                        </Card>
                    )}

                    {/* 3. Live Availability (Timeline View) */}
                    {status === 'ACTIVE' && slotsData && (
                        <div style={{ marginTop: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <Title level={4} style={{ margin: 0 }}>
                                    Live Availability
                                </Title>
                                {currentWindow && (
                                    <Text type="secondary">
                                        Window ends: {dayjs(currentWindow.end_datetime).format('MMM D, h:mm A')}
                                    </Text>
                                )}
                            </div>

                            <div style={{ overflowX: 'auto', paddingBottom: 10 }}>
                                {slotsData?.rooms.map(room => (
                                    <Card key={room.id} size="small" style={{ marginBottom: 16 }} bodyStyle={{ padding: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Tag color="geekblue" style={{ fontSize: 14 }}>Room {room.number}</Tag>
                                                <Text type="secondary">{room.type}</Text>
                                            </div>
                                            <Tag color={room.status === 'CLEAN' ? 'success' : room.status === 'DIRTY' ? 'warning' : 'error'}>
                                                {room.status}
                                            </Tag>
                                        </div>

                                        {/* Timeline Bar */}
                                        <div style={{ display: 'flex', height: 40, alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden', border: '1px solid #d9d9d9' }}>
                                            {room.slots.length === 0 ? (
                                                <div style={{ width: '100%', textAlign: 'center', color: '#888', padding: 8, fontSize: 12 }}>
                                                    No Availability Data
                                                </div>
                                            ) : (
                                                room.slots.map((slot, idx) => {
                                                    const start = dayjs(slot.start);
                                                    const end = dayjs(slot.end);
                                                    // Calculate simple flex basis based on duration relative to window could be complex, 
                                                    // but for now relying on CSS flex to share space proportional to durationMins works if all slots cover the full window.
                                                    // Assuming slots returned cover the requested window contiguously or we just show them in sequence.
                                                    const durationMins = end.diff(start, 'minute');

                                                    return (
                                                        <Tooltip
                                                            key={idx}
                                                            title={`${slot.type === 'BOOKED' ? 'Booked' : 'Available'} (${start.format('HH:mm')} - ${end.format('HH:mm')})`}
                                                        >
                                                            <div style={{
                                                                flex: durationMins,
                                                                height: '100%',
                                                                backgroundColor: slot.type === 'BOOKED' ? '#ffccc7' : '#d9f7be',
                                                                borderRight: '1px solid #fff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: 11,
                                                                color: '#555',
                                                                cursor: 'pointer',
                                                                minWidth: 30, // Ensure tiny slots are visible
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden'
                                                            }}>
                                                                {slot.type === 'BOOKED' ? 'Booked' : 'Free'}
                                                            </div>
                                                        </Tooltip>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </Col>

                {/* Right Column: Stats */}
                <Col xs={24} md={10}>
                    <Card title="Quick Stats">
                        <div style={{ marginBottom: 16 }}>
                            <Text type="secondary">Hourly Guests Today</Text>
                            <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                                {slotsData ? slotsData.rooms.reduce((acc, room) => acc + room.slots.filter(s => s.type === 'BOOKED').length, 0) : 0}
                            </div>
                        </div>
                        <div style={{ height: 1, backgroundColor: '#f0f0f0', margin: '12px 0' }} />
                        <div>
                            <Text type="secondary">Revenue Today</Text>
                            <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                                {/* Placeholder for Revenue - requires backend support */}
                                --
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default HourlyStatus;
