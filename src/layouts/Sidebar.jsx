import { Layout, Menu, Drawer, Grid } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";

const { Sider } = Layout;
const { useBreakpoint } = Grid;

function Sidebar({ mobileSiderOpen, setMobileSiderOpen }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const screens = useBreakpoint();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const items = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => { navigate("/dashboard"); if (!screens.md) setMobileSiderOpen(false); },
    },

    user?.role === "SUPER_ADMIN" && {
      key: "/users",
      icon: <UserOutlined />,
      label: "Users Management",
      onClick: () => { navigate("/users"); if (!screens.md) setMobileSiderOpen(false); },
    },

    user?.role === "SUPER_ADMIN" && {
      key: "/assignandchange",
      icon: <UserOutlined />,
      label: "Assign and Change",
      onClick: () => { navigate("/assignandchange"); if (!screens.md) setMobileSiderOpen(false); },
    },
    {
      key: "/hotels",
      icon: <HomeOutlined />,
      label: "Hotel Management",
      onClick: () => { navigate("/hotels"); if (!screens.md) setMobileSiderOpen(false); },
    },

    user?.role === "HOTEL_MANAGER" && {
      key: "bookings",
      icon: <UserOutlined />,
      label: "Bookings",
      onClick: () => { navigate("/bookings/1"); if (!screens.md) setMobileSiderOpen(false); },
    },

    {
      key: "/settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => { navigate("/settings"); if (!screens.md) setMobileSiderOpen(false); },
    },

    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ].filter(Boolean);

  const MenuContent = (
    <>
      <div style={{ padding: 16, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: screens.md ? '#fff' : '#000' }}>
        HourlyStay
      </div>
      <Menu theme={screens.md ? "dark" : "light"} mode="inline" items={items} />
    </>
  );

  if (!screens.md) {
    return (
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setMobileSiderOpen(false)}
        open={mobileSiderOpen}
        bodyStyle={{ padding: 0 }}
      >
        {MenuContent}
      </Drawer>
    );
  }

  return (
    <Sider width={240} className="sidebar" breakpoint="lg" collapsedWidth="0">
      <div className="logo" style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', padding: 16, textAlign: 'center' }}>HourlyStay</div>
      <Menu theme="dark" mode="inline" items={items} />
    </Sider>
  )
}

export default Sidebar
