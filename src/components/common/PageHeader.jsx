import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";

function PageHeader({ title, actions, breadcrumbs }) {
  const defaultItems = [
    { title: <Link to="/dashboard">Home</Link> },
    { title: title }
  ];

  const items = breadcrumbs ? breadcrumbs.map(item => ({
    title: item.path ? <Link to={item.path}>{item.title}</Link> : item.title
  })) : defaultItems;

  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
      <div>
        <Breadcrumb items={items} />
        <h2 style={{ marginTop: 8 }}>{title}</h2>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {actions}
      </div>
    </div>
  );
}

export default PageHeader;
