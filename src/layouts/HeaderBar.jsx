import { Layout, Dropdown, Avatar } from "antd";
import { BellOutlined, UserOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

const { Header } = Layout;

function HeaderBar() {
  const user = useSelector((state) => state.auth.user);

  const menuItems = [
    {
      key: "role",
      label: user?.role,
    },
  ];

  return (
    <Header className="header">
      <div className="header-left" />

      <div className="header-right">
        <BellOutlined className="icon" />

        <Dropdown menu={{ items: menuItems }}>
          <div className="profile">
            <Avatar icon={<UserOutlined />} />
            <span>{user?.name}</span>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
}

export default HeaderBar;
