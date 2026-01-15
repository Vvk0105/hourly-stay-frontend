import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Card } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";

function AmenityManagement() {
    const [amenities, setAmenities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAmenity, setEditingAmenity] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchAmenities();
    }, []);

    const fetchAmenities = async () => {
        setLoading(true);
        try {
            const res = await api.get("property/amenities/");
            setAmenities(res.data);
        } catch (err) {
            message.error("Failed to load amenities");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingAmenity(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingAmenity(record);
        form.setFieldsValue({
            name: record.name,
            icon: record.icon
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`property/amenities/${id}/`);
            message.success("Amenity deleted successfully");
            fetchAmenities();
        } catch (err) {
            message.error("Failed to delete amenity");
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            if (editingAmenity) {
                // Update
                await api.put(`property/amenities/${editingAmenity.id}/`, values);
                message.success("Amenity updated successfully");
            } else {
                // Create
                await api.post("property/amenities/", values);
                message.success("Amenity created successfully");
            }

            setModalVisible(false);
            form.resetFields();
            fetchAmenities();
        } catch (err) {
            message.error(editingAmenity ? "Failed to update amenity" : "Failed to create amenity");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name)
        },
        {
            title: "Icon",
            dataIndex: "icon",
            key: "icon",
            render: (icon) => icon || "-"
        },
        {
            title: "Created At",
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => new Date(date).toLocaleDateString()
        },
        {
            title: "Actions",
            key: "actions",
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete this amenity?"
                        description="This will remove it from all room categories."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <PageHeader
                title="Amenity Management"
                actions={
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        Add Amenity
                    </Button>
                }
            />

            <Card>
                <Table
                    dataSource={amenities}
                    columns={columns}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={editingAmenity ? "Edit Amenity" : "Add Amenity"}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[{ required: true, message: "Please enter amenity name" }]}
                    >
                        <Input placeholder="e.g., WiFi, Pool, Gym" />
                    </Form.Item>
                    <Form.Item
                        label="Icon (Optional)"
                        name="icon"
                        help="Icon name or identifier for UI display"
                    >
                        <Input placeholder="e.g., wifi, pool, gym" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default AmenityManagement;
