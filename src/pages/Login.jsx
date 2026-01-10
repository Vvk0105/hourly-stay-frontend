import React from "react";
import { Form, Input, Button, message } from "antd";
import {
  ClockCircleFilled,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const onFinish = (values) => {
    dispatch(loginUser(values)).then((result) => {
      if (result.payload) {
        message.success("Login Successful");
        navigate("/dashboard");
      }
    });
  };

  return (
    <div className="login-container">
      {/* Left Image Section */}
      <div className="login-left"></div>

      {/* Right Form Section */}
      <div className="login-right">
        {/* Brand Header */}
        <div className="brand-header">
          <ClockCircleFilled className="brand-icon" />
          <span>HourlyStay.com</span>
        </div>

        <div className="login-form-wrapper">
          <h2 className="login-title">LOGIN</h2>

          <Form
            name="login_form"
            layout="vertical"
            onFinish={onFinish}
            className="login-form"
          >
            <Form.Item
              label="Email ID"
              name="email"
              rules={[
                { required: true, message: "Please input your Email ID!" },
                { type: "email", message: "Please enter a valid Email ID!" },
              ]}
            >
              <Input placeholder="Enter your email" className="login-input" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password
                placeholder="Enter your password"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                className="login-input"
              />
            </Form.Item>

            <div className="forgot-password">Forgot Password?</div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="login-button"
              >
                Login
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default Login;
