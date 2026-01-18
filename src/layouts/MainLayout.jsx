import { useState } from "react";
import { Layout } from "antd";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";

const { Content } = Layout;

function MainLayout({ children }) {
  const [mobileSiderOpen, setMobileSiderOpen] = useState(false);

  return (
    <Layout style={{ minHeight: "90vh" }}>
      <Sidebar mobileSiderOpen={mobileSiderOpen} setMobileSiderOpen={setMobileSiderOpen} />
      <Layout>
        <HeaderBar setMobileSiderOpen={setMobileSiderOpen} />
        <Content style={{ padding: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
