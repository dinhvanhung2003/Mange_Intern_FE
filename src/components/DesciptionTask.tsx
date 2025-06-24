import React from 'react';
interface DescriptionViewerDialogProps {
  open: boolean;
  onClose: () => void;
  description: string;
}

const DescriptionViewerDialog: React.FC<DescriptionViewerDialogProps> = ({ open, onClose, description }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white w-full max-w-xl rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Nội dung mô tả</h2>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:underline"
          >
            Đóng
          </button>
        </div>
       <div className="prose max-w-none [&_img]:rounded">
          <div dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      </div>
    </div>
  );
};

export default DescriptionViewerDialog;
