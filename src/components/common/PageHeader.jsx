import { Breadcrumb, Button } from "antd";

function PageHeader({ title, actions }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
      <div>
        <Breadcrumb items={[{ title: "Home" }, { title }]} />
        <h2 style={{ marginTop: 8 }}>{title}</h2>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {actions}
      </div>
    </div>
  );
}

export default PageHeader;
