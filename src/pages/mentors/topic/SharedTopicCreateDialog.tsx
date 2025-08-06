import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import authApi from "@/utils/axios";
import MuiButton from '@mui/material/Button';
import { useAuth } from "@/hooks/useAuth";
interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function SharedTopicCreateDialog({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const user=useAuth();
  const handleCreate = async () => {
  if (!title || !dueDate) {
    return alert("Vui lòng nhập tiêu đề và hạn chót.");
  }

  try {
   
    const userId = user?.id;
    if (!userId) return alert("Không tìm thấy người dùng.");

    await authApi.post("/topics", {
      title,
      description,
      dueDate,
      createdById: userId,
    });

    alert("Tạo topic thành công!");
    onCreated();
    onClose();
  } catch {
    alert("Lỗi khi tạo topic.");
  }
};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo Topic Dùng Chung</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block mb-1">Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Nhập tiêu đề topic"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Mô tả (tuỳ chọn)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border p-2 rounded"
              rows={3}
              placeholder="Mô tả topic"
            />
          </div>

          <div>
            <label className="block mb-1">Hạn chót</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
        </div>

        <DialogFooter>
          <MuiButton onClick={onClose} variant="contained">Huỷ</MuiButton>
          <MuiButton onClick={handleCreate} variant="contained">Tạo</MuiButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
