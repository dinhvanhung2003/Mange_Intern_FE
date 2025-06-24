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
  return (
    <div className="relative">
      {/* Nút cha dùng SidebarLink */}
      <SidebarLink
        to="#" // Không điều hướng
        label={label}
        icon={icon}
        currentPath=""
        onClick={() => setSubmenuOpen(!submenuOpen)}
      />

      {/* Submenu hiển thị bên cạnh */}
      {submenuOpen && (
        <div className="absolute top-0 left-full ml-2 bg-[#111] rounded-lg overflow-hidden shadow-md z-30 w-48">
          <div className="border-b border-gray-700 px-4 py-3 font-semibold">
            {label}
          </div>
          <div className="flex flex-col">
            {routes.map((route, index) => (
              <Link
                key={index}
                to={route.to}
                className={`px-4 py-2 hover:bg-gray-700 border-b border-gray-800 text-sm ${
                  currentPath === route.to ? "bg-gray-800 font-semibold" : ""
                }`}
              >
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
