import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import api from "@/utils/axios";
import Toast from "@/components/Toast"; 
import { Button } from "@/components/ui/button";

export default function CreateDeadlineForm({ topicId }: { topicId: number }) {
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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
    }

    if (!description || !deadline) {
      triggerToast("Vui lòng nhập mô tả và thời hạn.");
      return;
    }

    try {
      await api.post(`/topics/${topicId}/deadlines`, formData);
      triggerToast("Tạo deadline thành công!");
      setDescription("");
      setDeadline("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      triggerToast("Tạo deadline thất bại!");
    }
  };

  return (
    <div>
      <Textarea
        placeholder="Nhập yêu cầu hoặc mô tả..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="mb-2"
      />
      <Input type="file" ref={fileRef} className="mb-2" />
      <Input
        type="datetime-local"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
      />
      <div className="mt-4">
        <Button onClick={handleSubmit}>Xác nhận</Button>
      </div>
      <Toast
        message={toastMessage}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
