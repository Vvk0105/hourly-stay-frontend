import { Layout, Menu, Drawer, Grid } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined,
  ClockCircleFilled,
  DollarOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";
import { can } from "../utils/accessControl";

const { Sider } = Layout;
const { useBreakpoint } = Grid;

function Sidebar({ mobileSiderOpen, setMobileSiderOpen }) {
  const screens = useBreakpoint();
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

    can(user, 'VIEW_USERS') && {
      key: "/users",
      icon: <UserOutlined />,
      label: "Users Management",
      onClick: () => navigate("/users"),
    },

    (can(user, 'CREATE_STAFF') || user?.role === "SUPER_ADMIN") && {
      key: "/assignandchange",
      icon: <UserOutlined />,
      label: "Assign and Change",
      onClick: () => navigate("/assignandchange"),
    },
    
    can(user, 'VIEW_HOTELS') && {
      key: "/hotels",
      icon: <HomeOutlined />,
      label: "Hotel Management",
      onClick: () => navigate("/hotels"),
    },

    can(user, 'MANAGE_AMENITIES') && {
      key: "/amenities",
      icon: <SettingOutlined />,
      label: "Amenities",
      onClick: () => navigate("/amenities"),
    },

    can(user, 'VIEW_PLATFORM_FINANCIALS') && {
      key: "/transactions",
      icon: <DollarOutlined />,
      label: "Platform Transactions",
      onClick: () => navigate("/transactions"),
    },

    can(user, 'VIEW_HOTEL_FINANCIALS') && {
      key: "/hotel-manager/transactions",
      icon: <DollarOutlined />,
      label: "Hotel Transactions",
      onClick: () => navigate("/hotel-manager/transactions"),
    },

    can(user, 'VIEW_BOOKINGS') && {
      key: "/bookings",
      icon: <UserOutlined />,
      label: "Bookings",
      onClick: () => navigate("/bookings"),
    },

    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ].filter(Boolean);

  const MenuComponent = (props) => (
    <Menu
      theme="light"
      mode="inline"
      items={items}
      selectedKeys={[window.location.pathname]}
      style={{ borderRight: 0 }}
    />
  );

  const LogoContent = (
    <div className="logo" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      gap: '8px',
      cursor: 'pointer'
    }} onClick={() => navigate('/dashboard')}>
      <ClockCircleFilled style={{ fontSize: '24px', color: '#FFD700' }} />
      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>HourlyStay.com</span>
    </div>
  );

  if (!screens.md) {
    return (
      <Drawer
        placement="left"
        onClose={() => setMobileSiderOpen && setMobileSiderOpen(false)}
        open={mobileSiderOpen}
        bodyStyle={{ padding: 0 }}
        width={240}
        closable={false}
      >
        {LogoContent}
        <MenuComponent />
      </Drawer>
    );
  }

  return (
    <Sider width={250} className="sidebar" breakpoint="lg" collapsedWidth="0" theme="light" style={{
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      zIndex: 10
    }}>
      {LogoContent}
      <MenuComponent />
    </Sider>
  );
}

export default Sidebar;
