import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios";

interface Props {
  unreadTasks: number;
  setUnreadTasks: (val: number) => void;
  triggerShake: boolean;
  setShake: (val: boolean) => void;
  notifications: any[];
}

export default function NotificationBell({
  unreadTasks,
  setUnreadTasks,
  triggerShake,
  setShake,
  notifications,
}: Props) {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (triggerShake) {
      const timeout = setTimeout(() => setShake(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [triggerShake]);

  const handleToggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setUnreadTasks(0);
    } catch (err) {
      console.error("Đánh dấu đã đọc thất bại", err);
    }
  };

  const handleNavigate = () => {
    setUnreadTasks(0);
    setShake(false);
    window.dispatchEvent(new CustomEvent("reset-unread-tasks"));
    navigate("/dashboard/interns/my-tasks");
    setShowDropdown(false);
  };

  return (
    <div className="fixed bottom-6 right-6 sm:right-20 z-50">

      <div className="relative">
        <button
          className="relative bg-white rounded-full p-3 shadow-md hover:bg-gray-100"
          onClick={handleToggleDropdown}
          title="Thông báo task mới"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 text-gray-700 ${triggerShake && unreadTasks > 0 ? "animate-bounce" : ""}`}
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

       {showDropdown && (
  <div className="absolute bottom-14 right-0 w-80 bg-white rounded shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-2 font-semibold border-b">Thông báo</div>
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Không có thông báo nào</div>
            ) : (
              <ul>
                {notifications.map((noti) => (
                  <li key={noti.id} className="p-2 hover:bg-gray-100 text-sm border-b">
                    <div className="font-medium">{noti.message}</div>
                    <div className="text-xs text-gray-500">{new Date(noti.createdAt).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
            {notifications.length > 0 && (
              <div className="flex justify-between items-center p-2">
                <button
                  className="text-blue-500 text-sm hover:underline"
                  onClick={handleMarkAllRead}
                >
                  Đánh dấu đã đọc
                </button>
                <button
                  className="text-sm text-gray-600 hover:text-black"
                  onClick={handleNavigate}
                >
                  Xem task
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
