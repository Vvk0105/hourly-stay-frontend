import React, { useEffect } from 'react';
import { List, Avatar, Badge, Typography, Card, Button, Space, Empty, Spin } from 'antd';
import { BellOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { markAsRead, markAllAsRead } from '../store/notificationSlice';
import useNotifications from '../hooks/useNotifications';
import notificationApi from '../api/notificationApi';

const { Title, Text } = Typography;

const NotificationsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items, unreadCount, loading } = useSelector((state) => state.notifications);
    const { fetchHistory } = useNotifications();

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleMarkRead = async (id, actionUrl) => {
        try {
            await notificationApi.markRead(id);
            dispatch(markAsRead(id));
            if (actionUrl) {
                navigate(actionUrl);
            }
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllRead();
            dispatch(markAllAsRead());
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Space size="middle">
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate(-1)}
                            type="text"
                        />
                        <Title level={3} style={{ margin: 0 }}>
                            All Notifications
                            {unreadCount > 0 && <Badge count={unreadCount} style={{ backgroundColor: '#52c41a', marginLeft: 12 }} />}
                        </Title>
                    </Space>
                    {unreadCount > 0 && (
                        <Button type="primary" onClick={handleMarkAllRead}>
                            Mark all as read
                        </Button>
                    )}
                </div>

                <List
                    loading={loading}
                    itemLayout="horizontal"
                    dataSource={items}
                    locale={{ emptyText: <Empty description="No notifications found" /> }}
                    renderItem={(item) => (
                        <List.Item
                            style={{
                                padding: '16px',
                                marginBottom: 8,
                                borderRadius: 8,
                                cursor: 'pointer',
                                backgroundColor: item.is_read ? '#fff' : '#e6f7ff',
                                border: '1px solid #f0f0f0',
                                transition: 'all 0.3s'
                            }}
                            onClick={() => handleMarkRead(item.id, item.action_url)}
                            actions={[
                                !item.is_read && (
                                    <Button
                                        type="text"
                                        icon={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkRead(item.id);
                                        }}
                                    >
                                        Mark read
                                    </Button>
                                )
                            ].filter(Boolean)}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                        icon={<BellOutlined />}
                                        style={{ backgroundColor: item.is_read ? '#d9d9d9' : '#1890ff' }}
                                    />
                                }
                                title={
                                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                                        <Text strong={!item.is_read} style={{ fontSize: 16 }}>{item.title}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {new Date(item.created_at).toLocaleString()}
                                        </Text>
                                    </Space>
                                }
                                description={
                                    <div style={{ marginTop: 8 }}>
                                        <Text>{item.message}</Text>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};

export default NotificationsPage;
