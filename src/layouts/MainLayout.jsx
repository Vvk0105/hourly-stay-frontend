import { Layout } from "antd";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";

const { Content } = Layout;

function MainLayout({ children }) {
  return (
    <Layout style={{ minHeight: "90vh" }}>
      <Sidebar />
      <Layout>
        <HeaderBar />
        <Content style={{ padding: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
