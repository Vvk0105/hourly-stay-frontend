import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, Switch, Button, Row, Col, Typography, InputNumber, message, Card, Divider, Modal, Spin, Select } from "antd";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";

const { TextArea } = Input;
const { Text } = Typography;

function EditRoomType() {
    const { id, typeId } = useParams(); // Hotel ID, RoomType ID
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [isHourly, setIsHourly] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [amenities, setAmenities] = useState([]);

    useEffect(() => {
        fetchDetails();
        fetchAmenities();
    }, [typeId]);

    const fetchAmenities = async () => {
        try {
            const res = await api.get("property/amenities/");
            setAmenities(res.data);
        } catch (err) {
            console.error("Failed to load amenities", err);
        }
    };

    const fetchDetails = async () => {
        try {
            const res = await api.get(`property/room-types/${typeId}/`);
            const data = res.data;

            form.setFieldsValue({
                name: data.name,
                total_inventory: data.total_inventory,
                max_adults: data.max_adults,
                max_children: data.max_children,
                base_price_nightly: data.base_price_nightly,
                description: data.description,
                is_hourly_enabled: data.is_hourly_enabled,
                amenity_ids: data.amenities?.map(a => a.id) || []
            });

            setIsHourly(data.is_hourly_enabled);

            if (data.is_hourly_enabled && data.hourly_config) {
                form.setFieldsValue({
                    min_duration_hours: data.hourly_config.min_duration_hours,
                    hourly_base_price: data.hourly_config.base_price,
                    price_per_extra_hour: data.hourly_config.price_per_extra_hour,
                    cleaning_buffer_minutes: data.hourly_config.cleaning_buffer_minutes
                });
            }

        } catch (err) {
            message.error("Failed to load category details");
        } finally {
            setFetching(false);
        }
    };

    const onFinish = async (values) => {
        setLoading(true);

        const payload = {
            hotel: id,
            name: values.name,
            total_inventory: values.total_inventory,
            max_adults: values.max_adults,
            max_children: values.max_children,
            size_sqft: values.size_sqft, // Note: Backend might not store this if field missing in model, but we pass it. (Checked model: No size field? Maybe I missed it or it's new. Removing validation requirement if fail)
            base_price_nightly: values.base_price_nightly,
            description: values.description,
            is_hourly_enabled: values.is_hourly_enabled,
            amenity_ids: values.amenity_ids || [],
        };

        if (values.is_hourly_enabled) {
            payload.hourly_config = {
                min_duration_hours: values.min_duration_hours,
                base_price: values.hourly_base_price,
                price_per_extra_hour: values.price_per_extra_hour,
                cleaning_buffer_minutes: values.cleaning_buffer_minutes || 30,
                is_active: true
            };
        } else {
            payload.hourly_config = null;
        }

        try {
            await api.put(`property/room-types/${typeId}/`, payload);
            message.success("Category Updated Successfully");
            navigate(`/hotels/${id}`);
        } catch (err) {
            message.error("Failed to update category");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Modal.confirm({
            title: "Delete Room Category?",
            content: "This will delete the category definition. Physical rooms linked to this might need attention.",
            okType: 'danger',
            onOk: async () => {
                try {
                    await api.delete(`property/room-types/${typeId}/`);
                    message.success("Category Deleted");
                    navigate(`/hotels/${id}`);
                } catch (e) {
                    message.error("Failed to delete");
                }
            }
        })
    }

    if (fetching) return <Spin style={{ display: 'block', margin: '50px auto' }} />;

    return (
        <div style={{ padding: 24 }}>
            <PageHeader
                title="Edit Room Category"
                actions={<Button danger onClick={handleDelete}>Delete Category</Button>}
            />
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={24}>
                    <Col span={16}>
                        <Card title="Category Details">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Ex: Deluxe King' }]}>
                                        <Input placeholder="e.g. Deluxe King" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Initial Inventory Count" name="total_inventory" rules={[{ required: true }]}>
                                        <InputNumber style={{ width: '100%' }} placeholder="0" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label="Max Adults" name="max_adults"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label="Max Children" name="max_children"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
                                </Col>
                                {/* 
                <Col span={8}>
                   <Form.Item label="Size (Sq. Ft)" name="size_sqft"><InputNumber style={{ width: '100%' }} /></Form.Item>
                </Col> 
                */}
                                <Col span={24}>
                                    <Form.Item label="Description" name="description"><TextArea rows={3} /></Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="Amenities" name="amenity_ids">
                                        <Select
                                            mode="multiple"
                                            placeholder="Select amenities"
                                            options={amenities.map(a => ({ label: a.name, value: a.id }))}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    <Col span={8}>
                        <Card title="Pricing & Rules">
                            <Text strong>Standard Nightly Rate</Text>
                            <Form.Item name="base_price_nightly" rules={[{ required: true }]} style={{ marginTop: 8 }}>
                                <InputNumber style={{ width: '100%' }} prefix="₹" placeholder="2000" />
                            </Form.Item>

                            <Divider />

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <Text strong>Enable Hourly?</Text>
                                <Form.Item name="is_hourly_enabled" valuePropName="checked" noStyle>
                                    <Switch onChange={(checked) => setIsHourly(checked)} />
                                </Form.Item>
                            </div>

                            {isHourly && (
                                <div style={{ backgroundColor: '#f6ffed', padding: 16, borderRadius: 8, border: '1px solid #b7eb8f' }}>
                                    <Form.Item label="Min Duration (Hrs)" name="min_duration_hours" initialValue={3} rules={[{ required: true }]}>
                                        <InputNumber min={1} style={{ width: '100%' }} />
                                    </Form.Item>
                                    <Form.Item label="Base Price (Min Duration)" name="hourly_base_price" rules={[{ required: true }]}>
                                        <InputNumber style={{ width: '100%' }} prefix="₹" />
                                    </Form.Item>
                                    <Form.Item label="Extra Hour Price" name="price_per_extra_hour" rules={[{ required: true }]}>
                                        <InputNumber style={{ width: '100%' }} prefix="₹" />
                                    </Form.Item>
                                    <Form.Item label="Cleaning Gap (Mins)" name="cleaning_buffer_minutes" initialValue={30}>
                                        <InputNumber step={15} style={{ width: '100%' }} />
                                    </Form.Item>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
                <div style={{ marginTop: 24, textAlign: 'right' }}>
                    <Button onClick={() => navigate(-1)} style={{ marginRight: 12 }}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>Update Category</Button>
                </div>
            </Form>
        </div>
    );
}

export default EditRoomType;
