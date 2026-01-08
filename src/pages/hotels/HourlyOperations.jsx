import React, { useState, useEffect } from "react";
import { Card, Button, Tag, Typography, Radio, DatePicker, Statistic, Row, Col, Alert, message, Spin } from "antd";
import { ClockCircleOutlined, PoweroffOutlined, ThunderboltOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/axios";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function HourlyOperations({ hotelId }) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("INACTIVE"); // ACTIVE | INACTIVE
  const [currentWindow, setCurrentWindow] = useState(null);
  const [mode, setMode] = useState("AUTO");
  const [customRange, setCustomRange] = useState([]);
console.log(currentWindow);

  useEffect(() => {
    fetchStatus();
  }, [hotelId]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get(`property/hotels/${hotelId}/hourly-operations/`);
      setStatus(res.data.status);
      setCurrentWindow(res.data.window || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    </div>
  );
}

export default HourlyOperations;