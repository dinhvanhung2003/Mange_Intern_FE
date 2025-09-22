import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom"; // <-- NEW
import api from "@/utils/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Select from "react-select";

interface UserLite { id: number; name: string; email: string; }
interface Task { id: number; title: string; assignedTo?: UserLite; assignedToId?: number; }
type Option = { value: number; label: string; task: Task };

// <-- NEW: kiểu context
type ContextType = {
  showSnackbar: (message: string, severity?: "success" | "error" | "info" | "warning") => void;
};

export default function AssignTasksDialog({
  topicId, open, onClose, onAssigned
}: { topicId: number; open: boolean; onClose: () => void; onAssigned: () => void; }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const { showSnackbar } = useOutletContext<ContextType>(); // <-- NEW

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);

    api.get("/mentor/tasks/assigned-no-topic", { params: { topicId } })
      .then(res => { if (alive) setTasks(res.data as Task[]); })
      .catch(err => {
        console.error(err);
        if (alive) showSnackbar("Không thể tải danh sách task.", "error"); // <-- NEW
      })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [open, topicId, showSnackbar]);

  const options: Option[] = useMemo(() => (
    tasks.map(t => ({
      value: t.id,
      label: `${t.title} — ${t.assignedTo?.name ?? `Intern ${t.assignedToId}`}`,
      task: t
    }))
  ), [tasks]);

  const valueForSelect: Option[] = useMemo(() => {
    const mapById = new Map(options.map(o => [o.value, o]));
    return selected.map(id => mapById.get(id)).filter(Boolean) as Option[];
  }, [selected, options]);

  const handleChange = (opts: readonly Option[] | null) => {
    setSelected((opts ?? []).map(o => o.value));
  };

  const handleAssign = async () => {
    try {
      await api.post("/topics/assign-tasks", { topicId, taskIds: selected });
      showSnackbar(`Đã gán ${selected.length} task vào topic.`, "success"); // <-- NEW
      onAssigned();
      onClose();
      setSelected([]);
    } catch (e) {
      console.error(e);
      showSnackbar("Không thể gán task vào topic.", "error"); // <-- NEW
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chọn task để gán vào topic</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Chỉ hiển thị task của intern thuộc bạn, chưa có trong topic.
          </div>

          <Select
            isMulti
            isLoading={loading}
            isDisabled={loading}
            options={options}
            value={valueForSelect}
            onChange={handleChange}
            placeholder="Chọn task…"
            className="react-select-container"
            classNamePrefix="react-select"
            noOptionsMessage={() => loading ? "Đang tải..." : "Không còn task phù hợp"}
          />

          {!loading && (
            <div className="text-xs text-muted-foreground">
              Đã chọn {selected.length} task
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleAssign} disabled={selected.length === 0 || loading}>
            Gán
          </Button>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
