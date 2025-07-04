import { Link } from "react-router-dom";
import SidebarLink from "./SidebarLink";
export default function Submenu({
  label,
  icon,
  routes,
  submenuOpen,
  setSubmenuOpen,
  currentPath
}: {
  label: string;
  icon: string;
  routes: { label: string; to: string }[];
  submenuOpen: boolean;
  setSubmenuOpen: (open: boolean) => void;
  currentPath: string;
}) {
  const isParentActive = routes.some(route => currentPath === route.to);




  return (

    <div className="relative">
      <SidebarLink
  to="#"
  label={label}
  icon={icon}
  currentPath={isParentActive ? "active" : ""}
  onClick={() => setSubmenuOpen(!submenuOpen)}
/>



      {submenuOpen && (
        // Overlay to detect outside click
        <div
          className="fixed inset-0 z-30"
          onClick={() => setSubmenuOpen(false)}
        >
          {/* Submenu */}
          <div
            className="absolute top-0 left-64 h-full bg-[#111] w-48 shadow-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* <div className="border-b border-gray-700 px-4 py-3 font-semibold">
            {label}
          </div> */}
          <div className="flex flex-col px-2 py-1">
  {routes.map(route => (
    <Link
      key={route.to}
      to={route.to}
      className={`text-sm px-4 py-2.5 rounded-lg transition w-full text-left ${
        currentPath === route.to
          ? "bg-gray-700 text-white font-medium"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`}
    >
      {route.label}
    </Link>
  ))}
</div>

          </div>
        </div>
      )}
    </div>


  );
}
