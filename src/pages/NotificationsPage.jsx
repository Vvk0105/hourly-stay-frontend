import React, { useEffect, useState, useMemo } from 'react';
import { List, Avatar, Badge, Typography, Card, Button, Space, Empty, Tabs, Input, Tag, Switch } from 'antd';
import { BellOutlined, CheckCircleOutlined, ArrowLeftOutlined, SearchOutlined, SoundOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { markAsRead, markAllAsRead, toggleSound } from '../store/notificationSlice';
import useNotifications from '../hooks/useNotifications';
import notificationApi from '../api/notificationApi';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const NotificationsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items, unreadCount, totalCount, loading, soundEnabled } = useSelector((state) => state.notifications);
    const { fetchHistory } = useNotifications();
    const [activeTab, setActiveTab] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchHistory(1);
    }, [fetchHistory]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchHistory(nextPage, true);
    };

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

    const filteredItems = useMemo(() => {
        let filtered = items;
        
        // Filter by tab
        if (activeTab === 'unread') {
            filtered = filtered.filter(item => !item.is_read);
        } else if (activeTab === 'booking') {
            filtered = filtered.filter(item => item.type && item.type.includes('BOOKING'));
        } else if (activeTab === 'payment') {
            filtered = filtered.filter(item => item.type && item.type.includes('PAYMENT'));
        }

        // Filter by search text
        if (searchText) {
            const lowerSearch = searchText.toLowerCase();
            filtered = filtered.filter(item => 
                item.title?.toLowerCase().includes(lowerSearch) || 
                item.message?.toLowerCase().includes(lowerSearch)
            );
        }

        return filtered;
    }, [items, activeTab, searchText]);

    const getTagColor = (type) => {
        if (!type) return 'default';
        if (type.includes('BOOKING')) return 'blue';
        if (type.includes('PAYMENT')) return 'green';
        if (type.includes('CANCEL')) return 'red';
        if (type.includes('CLEANING')) return 'orange';
        return 'default';
    };

    return (
        <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
            <Card className="notification-card-glass" style={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Space size="middle">
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate(-1)}
                            type="text"
                            style={{ borderRadius: '50%' }}
                        />
                        <Title level={3} style={{ margin: 0 }}>
                            Notifications
                            {unreadCount > 0 && <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f', marginLeft: 12 }} />}
                        </Title>
                    </Space>
                    <Space>
                        <Input 
                            placeholder="Search notifications..." 
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 250, borderRadius: 8 }}
                            allowClear
                        />
                        <Space style={{ marginLeft: 8, marginRight: 8 }}>
                            <SoundOutlined style={{ color: soundEnabled ? '#1890ff' : '#bfbfbf' }} />
                            <Switch 
                                checked={soundEnabled} 
                                onChange={() => dispatch(toggleSound())} 
                                size="small"
                                title="Notification Sound"
                            />
                        </Space>
                        {unreadCount > 0 && (
                            <Button type="primary" onClick={handleMarkAllRead} style={{ borderRadius: 8 }}>
                                Mark all as read
                            </Button>
                        )}
                    </Space>
                </div>

                <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 16 }}>
                    <TabPane tab="All" key="all" />
                    <TabPane tab="Unread" key="unread" />
                    <TabPane tab="Bookings" key="booking" />
                    <TabPane tab="Payments" key="payment" />
                </Tabs>

                <List
                    loading={loading && page === 1}
                    itemLayout="horizontal"
                    dataSource={filteredItems}
                    locale={{ emptyText: <Empty description="No notifications found" /> }}
                    loadMore={
                        !loading && items.length < totalCount && (
                            <div style={{ textAlign: 'center', marginTop: 12, height: 32, lineHeight: '32px' }}>
                                <Button onClick={handleLoadMore}>Load more</Button>
                            </div>
                        )
                    }
                    renderItem={(item) => (
                        <List.Item
                            style={{
                                padding: '20px',
                                marginBottom: 12,
                                borderRadius: 12,
                                cursor: 'pointer',
                                backgroundColor: item.is_read ? '#fff' : '#f0f7ff',
                                border: `1px solid ${item.is_read ? '#f0f0f0' : '#bae7ff'}`,
                                transition: 'all 0.3s',
                                boxShadow: item.is_read ? 'none' : '0 4px 12px rgba(24, 144, 255, 0.05)'
                            }}
                            className="notification-item-hover"
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
                                        size={48}
                                        icon={<BellOutlined />}
                                        style={{ 
                                            backgroundColor: item.is_read ? '#f5f5f5' : '#1890ff',
                                            color: item.is_read ? '#bfbfbf' : '#fff'
                                        }}
                                    />
                                }
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Space direction="vertical" size={0}>
                                            <Space>
                                                <Text strong={!item.is_read} style={{ fontSize: 16 }}>{item.title}</Text>
                                                <Tag color={getTagColor(item.type)} style={{ fontSize: 10, borderRadius: 4 }}>
                                                    {item.type?.replace(/_/g, ' ')}
                                                </Tag>
                                            </Space>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {item.created_at && !isNaN(new Date(item.created_at).getTime()) 
                                                    ? new Date(item.created_at).toLocaleString() 
                                                    : 'Just now'}
                                            </Text>
                                        </Space>
                                    </div>
                                }
                                description={
                                    <div style={{ marginTop: 8 }}>
                                        <Text style={{ color: '#595959' }}>{item.message}</Text>
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
