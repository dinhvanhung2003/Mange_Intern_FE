import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Gán vfs an toàn
pdfMake.vfs = (pdfFonts as any)?.pdfMake?.vfs || (pdfFonts as any)?.vfs;

export const exportScoreReport = (internName: string, tasks: any[]) => {
  const today = new Date().toLocaleDateString("vi-VN");

  const tableBody = [
    [
      { text: "Tiêu đề", bold: true, fillColor: "#1976d2", color: "white" },
      { text: "Hạn", bold: true, fillColor: "#1976d2", color: "white" },
      { text: "Trạng thái", bold: true, fillColor: "#1976d2", color: "white" },
      { text: "Điểm", bold: true, fillColor: "#1976d2", color: "white" }
    ],
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
      task.score != null ? `${task.score} điểm` : "Chưa chấm"
    ])
  ];

  const docDefinition = {
    content: [
      { text: `Báo cáo điểm - ${internName}`, style: "header" },
      { text: `Ngày xuất: ${today}`, style: "subHeader" },
      {
        table: {
          headerRows: 1,
          widths: ["*", "*", "*", "*"],
          body: tableBody
        }
      }
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 5] },
      subHeader: { fontSize: 12, italics: true, margin: [0, 0, 0, 10] }
    },
    defaultStyle: {
      font: "Roboto"
    }
  };

  pdfMake.createPdf(docDefinition).download(`bao-cao-diem-${internName}.pdf`);
};
