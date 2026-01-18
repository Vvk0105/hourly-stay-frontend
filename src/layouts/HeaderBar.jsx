import { Layout, Dropdown, Avatar, Grid } from "antd";
import { BellOutlined, UserOutlined, MenuOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

const { Header } = Layout;
const { useBreakpoint } = Grid;

function HeaderBar({ setMobileSiderOpen }) {
  const user = useSelector((state) => state.auth.user);
  const screens = useBreakpoint();

  const menuItems = [
    {
      key: "role",
      label: user?.role,
    },
  ];

  return (
    <Header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff' }}>
      <div className="header-left">
        {!screens.md && (
          <MenuOutlined
            style={{ fontSize: 20, cursor: "pointer", marginRight: 16 }}
            onClick={() => setMobileSiderOpen && setMobileSiderOpen(true)}
          />
        )}
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <BellOutlined className="icon" style={{ fontSize: 20 }} />

        <Dropdown menu={{ items: menuItems }}>
          <div className="profile" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
            <Avatar icon={<UserOutlined />} />
            {screens.md && <span>{user?.name}</span>}
          </div>
        </Dropdown>
      </div>
    </Header>
  );
}

export default HeaderBar;
