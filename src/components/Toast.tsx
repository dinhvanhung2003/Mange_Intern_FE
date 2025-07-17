import React from "react";

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, show, onClose }) => {
  return (
    <div
      className={`fixed top-5 right-5 z-[9999] transition-all duration-300 transform ${
        show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="bg-green-600 text-white px-4 py-2 rounded shadow-lg flex items-center space-x-4 min-w-[250px]">
        <span className="flex-1">{message}</span>
        <button onClick={onClose} className="text-white hover:text-gray-200 text-lg font-bold">
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
