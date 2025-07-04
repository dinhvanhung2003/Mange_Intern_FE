import { Link } from "react-router-dom";

interface SidebarLinkProps {
  to: string;
  label: string;
  icon: string;
  currentPath: string;
  onClick?: () => void;
}

export default function SidebarLink({
  to,
  label,
  icon,
  currentPath,
  onClick,
}: {
  to: string;
  label: string;
  icon: string;
  currentPath: string;
  onClick?: () => void;
}) {
  const isActive = currentPath === to || currentPath === "active";

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-4 py-5 rounded-xl transition hover:bg-gray-800 ${
        isActive ? "bg-gray-800" : ""
      }`}
    >
      <img src={icon} alt={label} className="w-7 h-7 mb-2" />
      <span
        className={`text-base transition font-normal ${
          isActive ? "font-semibold" : "hover:font-semibold"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
