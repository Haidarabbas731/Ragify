import { Outlet } from "react-router-dom";
import { AdminTabs } from "./AdminTabs";

/** Frame shared by every admin page: section tabs above the routed page. */
export function AdminSection() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <AdminTabs />
      <Outlet />
    </div>
  );
}
