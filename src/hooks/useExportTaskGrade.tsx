import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

export const exportAllTaskScoresExcel = (tasks: any[]) => {
  const today = new Date().toLocaleDateString("vi-VN");

  const data = [
    ["Tiêu đề", "Hạn", "Trạng thái", "Điểm", "Intern", "Email"],
    ...tasks.map(task => [
      task.title,
      task.dueDate,
      task.status === "assigned"
        ? "Chưa nhận"
        : task.status === "in_progress"
        ? "Đang làm"
        : task.status === "completed"
        ? "Hoàn thành"
        : "Lỗi",
      task.score != null ? `${task.score} điểm` : "Chưa chấm",
      task.assignedTo?.name || "Chưa giao",
      task.assignedTo?.email || "-"
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Thêm border cho toàn bộ cell
  Object.keys(ws).forEach((cell) => {
    if (cell[0] === "!") return;
    ws[cell].s = {
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Danh sách Task");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const file = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(file, `danh-sach-task-${today}.xlsx`);
};
