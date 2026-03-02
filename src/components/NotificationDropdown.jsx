import React from 'react';
import { List, Avatar, Badge, Typography, Button, Space, Empty } from 'antd';
import { BellOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { markAsRead, markAllAsRead } from '../store/notificationSlice';
import notificationApi from '../api/notificationApi';

const { Text } = Typography;

const NotificationDropdown = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items, unreadCount, loading } = useSelector((state) => state.notifications);

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
        <div style={{ width: 350, backgroundColor: '#fff', boxShadow: '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08), 0 9px 28px 8px rgba(0,0,0,.05)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Notifications {unreadCount > 0 && <Badge count={unreadCount} style={{ backgroundColor: '#52c41a', marginLeft: 8 }} />}</Text>
                {unreadCount > 0 && (
                    <Button type="link" size="small" onClick={handleMarkAllRead}>
                        Mark all as read
                    </Button>
                )}
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <List
                    loading={loading}
                    itemLayout="horizontal"
                    dataSource={items}
                    locale={{ emptyText: <Empty description="No notifications" /> }}
                    renderItem={(item) => (
                        <List.Item
                            style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                backgroundColor: item.is_read ? '#fff' : '#e6f7ff',
                                transition: 'background-color 0.3s'
                            }}
                            onClick={() => handleMarkRead(item.id, item.action_url)}
                            actions={[
                                !item.is_read && <CheckCircleOutlined style={{ color: '#1890ff' }} onClick={(e) => { e.stopPropagation(); handleMarkRead(item.id); }} />
                            ].filter(Boolean)}
                        >
                            <List.Item.Meta
                                avatar={<Avatar icon={<BellOutlined />} style={{ backgroundColor: item.is_read ? '#d9d9d9' : '#1890ff' }} />}
                                title={<Text strong={!item.is_read}>{item.title}</Text>}
                                description={
                                    <Space direction="vertical" size={0}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{item.message}</Text>
                                        <Text type="secondary" style={{ fontSize: 10 }}>{item.created_at && !isNaN(new Date(item.created_at).getTime()) ? new Date(item.created_at).toLocaleString() : 'Just now'}</Text>
                                    </Space>
                                }
                            />
                        </List.Item>
                    )}
                />
            </div>
            {(items.length > 5 || true) && (
                <div style={{ padding: '8px 16px', textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
                    <Button type="link" size="small" onClick={() => navigate('/notifications')}>
                        View all notifications
                    </Button>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
