import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import api from "@/utils/axios";
import Toast from "@/components/Toast"; 
export default function CreateDeadlineForm({ topicId }: { topicId: number }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  // Toast state 
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
 const handleSubmit = async () => {
  const formData = new FormData();
  formData.append("requirement", description); 

  formData.append("deadline", deadline);

  const file = fileRef.current?.files?.[0];
  if (file) {
    formData.append("file", file);
    console.log(file)
  }
if (!description || !deadline) {
 triggerToast("Vui lòng nhập mô tả và thời hạn.");
  return;
}

  try {
    await api.post(`/topics/${topicId}/deadlines`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
     triggerToast("Tạo deadline thành công!");
    setOpen(false);
    setDescription("");
setDeadline("");
if (fileRef.current) fileRef.current.value = "";

  } catch (err) {
    triggerToast("Tạo deadline thất bại!");
  }
};


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">+ Tạo Deadline</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo deadline cho đề tài</DialogTitle>
        </DialogHeader>

        <Textarea
          placeholder="Nhập yêu cầu hoặc mô tả..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mb-2"
        />

        <Input
          type="file"
          ref={fileRef}
          className="mb-2"
        />

        <Input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <DialogFooter className="mt-4">
          <Button onClick={handleSubmit}>Xác nhận</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
