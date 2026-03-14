import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Descriptions, Tag, Typography, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Settings = () => {
    const user = useSelector(state => state.auth.user);

    if (!user) return null;

    return (
        <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
            <Title level={2} style={{ marginBottom: 24 }}>My Settings</Title>
            
            <Card title="User Profile" bordered={false} className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                    <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff', marginRight: 16 }} />
                    <div>
                        <Title level={4} style={{ margin: 0 }}>{user.name}</Title>
                        <Tag color="blue" style={{ marginTop: 4 }}>{user.role?.replace('_', ' ')}</Tag>
                    </div>
                </div>

                <Descriptions bordered column={1}>
                    <Descriptions.Item label="User ID">{user.id}</Descriptions.Item>
                    <Descriptions.Item label="Role">{user.role}</Descriptions.Item>
                    <Descriptions.Item label="Assigned Hotels">
                        {user.hotels && user.hotels.length > 0 ? (
                            user.hotels.map((hotel, idx) => (
                                <Tag key={idx} color="green">
                                    {typeof hotel === 'object' ? hotel.name : `Hotel ID: ${hotel}`}
                                </Tag>
                            ))
                        ) : (
                            <Tag>No hotels assigned</Tag>
                        )}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <div style={{ marginTop: 24, textAlign: 'center', color: '#8c8c8c' }}>
                <p>More settings (notifications, password change, etc.) will be available in the next update.</p>
            </div>
        </div>
    );
};

export default Settings;

