import React, { useState, useEffect } from "react";
import { Card, Button, Tag, Typography, Radio, DatePicker, Statistic, Row, Col, Alert, message, Spin, Tooltip } from "antd";
import { ClockCircleOutlined, PoweroffOutlined, ThunderboltOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/axios";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function HourlyOperations({ hotelId }) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("INACTIVE"); // ACTIVE | INACTIVE
  const [currentWindow, setCurrentWindow] = useState(null);
  const [mode, setMode] = useState("AUTO");
  const [customRange, setCustomRange] = useState([]);
  
  // Slots Data
  const [slotsData, setSlotsData] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  
  
  useEffect(() => {
    fetchStatus();
    // Poll for slots if active
    const interval = setInterval(() => {
      if (status === 'ACTIVE') {
        fetchSlots();
      }
    }, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [hotelId, status]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get(`property/hotels/${hotelId}/hourly-operations/`);
      console.log(res, 'testing res');
      
      const apiStatus = res.data.status;
      setStatus(apiStatus);
      if (apiStatus === 'ACTIVE') {
        setCurrentWindow(res.data.window);
        fetchSlots(); // Initial fetch
      } else {
        setCurrentWindow(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await api.get(`property/hotels/${hotelId}/hourly-slots/`);
      setSlotsData(res.data);
    } catch (e) {
      console.error("Failed to fetch slots");
    }
  };

  const handleStart = async () => {
    try {
      setLoading(true);
      const payload = { mode };

      if (mode === 'CUSTOM') {
        if (!customRange || customRange.length < 2) {
          message.error("Please select a time range");
          setLoading(false);
          return;
        }
        payload.start_datetime = customRange[0].toISOString();
        payload.end_datetime = customRange[1].toISOString();
      }

      const res = await api.post(`property/hotels/${hotelId}/hourly-operations/`, payload);
      setStatus("ACTIVE");
      setCurrentWindow(res.data.window);
      message.success("Hourly Mode Started!");
      fetchSlots();
    } catch (err) {
      message.error("Failed to start hourly mode");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setLoading(true);
      await api.delete(`property/hotels/${hotelId}/hourly-operations/`);
      setStatus("INACTIVE");
      setCurrentWindow(null);
      setSlotsData(null);
      message.info("Hourly Mode Stopped");
    } catch (err) {
      message.error("Failed to stop");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !status) return <Spin />;

  return (
    <div style={{ padding: 16 }}>

      {/* 1. STATUS DISPLAY */}
      <Card style={{ marginBottom: 24, textAlign: 'center', border: status === 'ACTIVE' ? '1px solid #52c41a' : '1px solid #d9d9d9' }}>
        <Statistic
          title="Current Hourly Status"
          value={status}
          valueStyle={{ color: status === 'ACTIVE' ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}
          prefix={status === 'ACTIVE' ? <ThunderboltOutlined /> : <PoweroffOutlined />}
        />
        {status === 'ACTIVE' && currentWindow && (
          <div style={{ marginTop: 16 }}>
            <Tag color="green" style={{ fontSize: 14, padding: 6 }}>
              Accepting Guests until: {dayjs(currentWindow.end_datetime).local().format("DD MMM, hh:mm A")}
            </Tag>
            <div style={{ marginTop: 12 }}>
              <Button danger type="primary" onClick={handleStop}>Stop Operations</Button>
            </div>
          </div>
        )}
      </Card>

      {/* 2. CONTROL PANEL (Only show if Inactive) */}
      {status === 'INACTIVE' && (
        <Card title="Start Operations">
          <Text>Choose how you want to open availability:</Text>
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

          <Button type="primary" size="large" icon={<ClockCircleOutlined />} onClick={handleStart} block>
            {mode === 'AUTO' ? "Start Now" : "Set Custom Schedule"}
          </Button>
        </Card>
      )}

      {/* 3. SLOTS GRID (Only if Active) */}
      {status === 'ACTIVE' && slotsData && (
        <div style={{ marginTop: 24 }}>
          <Title level={4}>Live Availability (Next 12 Hours)</Title>
          <div style={{ overflowX: 'auto', paddingBottom: 10 }}>
            {slotsData?.rooms.map(room => (
              <Card key={room.id} size="small" style={{ marginBottom: 16 }} bodyStyle={{ padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Tag color="geekblue" style={{ fontSize: 14 }}>Room {room.number}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>{room.type} ({room.status})</Text>
                </div>

                {/* Timeline Bar */}
                <div style={{ display: 'flex', gap: 4, height: 40, alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 4, padding: 4, position: 'relative' }}>
                  {room.slots.length === 0 ? (
                    <Text type="secondary" style={{ width: '100%', textAlign: 'center' }}>No upcoming bookings</Text>
                  ) : (
                    room.slots.map(slot => {
                      const start = dayjs(slot.start);
                      const end = dayjs(slot.end);
                      return (
                        <Tooltip key={slot.id} title={`${start.format('HH:mm')} - ${end.format('HH:mm')} (${slot.status})`}>
                          <div style={{
                            backgroundColor: slot.status === 'CONFIRMED' ? '#1890ff' : '#52c41a',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            whiteSpace: 'nowrap'
                          }}>
                            {start.format('HH:mm')} - {end.format('HH:mm')}
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
    </div>
  );
}

export default HourlyOperations;