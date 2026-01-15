import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";

const { Sider } = Layout;

function Sidebar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const items = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => navigate("/dashboard"),
    },

    user?.role === "SUPER_ADMIN" && {
      key: "/users",
      icon: <UserOutlined />,
      label: "Users Management",
      onClick: () => navigate("/users"),
    },

    user?.role === "SUPER_ADMIN" && {
      key: "/assignandchange",
      icon: <UserOutlined />,
      label: "Assign and Change",
      onClick: () => navigate("/assignandchange"),
    },
    {
      key: "/hotels",
      icon: <HomeOutlined />,
      label: "Hotel Management",
      onClick: () => navigate("/hotels"),
    },

    user?.role === "SUPER_ADMIN" && {
      key: "/amenities",
      icon: <SettingOutlined />,
      label: "Amenities",
      onClick: () => navigate("/amenities"),
    },

    user?.role === "HOTEL_MANAGER" && {
      key: "bookings",
      icon: <UserOutlined />,
      label: "Bookings",
      onClick: () => navigate("/bookings/1"),
    },

    {
      key: "/settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => navigate("/settings"),
    },

    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ].filter(Boolean);

  return (
    <Sider width={240} className="sidebar">
      <div className="logo">HourlyStay</div>
      <Menu mode="inline" items={items} />
    </Sider>
  )
}

export default Sidebar
