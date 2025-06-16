import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  unreadTasks: number;
  setUnreadTasks: (val: number) => void;
  triggerShake: boolean;
  setShake: (val: boolean) => void;
}

export default function NotificationBell({
  unreadTasks,
  setUnreadTasks,
  triggerShake,
  setShake,
}: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (triggerShake) {
      const timeout = setTimeout(() => setShake(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [triggerShake]);

  const handleClick = () => {
    setUnreadTasks(0);
    setShake(false);
    window.dispatchEvent(new CustomEvent("reset-unread-tasks"));
    navigate("/dashboard/interns/my-tasks");
  };

  return (
    <div className="fixed bottom-6 right-20 z-50">
      <button
        className="relative bg-white rounded-full p-3 shadow-md hover:bg-gray-100"
        onClick={handleClick}
        title="Thông báo task mới"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 text-gray-700 ${
            triggerShake && unreadTasks > 0 ? "shake" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadTasks > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">
            {unreadTasks}
          </span>
        )}
      </button>
    </div>
  );
}
