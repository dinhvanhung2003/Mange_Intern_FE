import React, { useEffect, useState } from "react";
import axios from "@/utils/axios";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TextField,
  Typography,
} from "@mui/material";
import DocumentViewerDialog from "@/components/Document/DocumentViewer";
interface Document {
  id: number;
  title: string;
  description?: string;
  type: "image" | "video" | "file";
  files: { fileUrl: string; type: string }[];
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [openUpload, setOpenUpload] = useState(false);

  const fetchDocs = async () => {
    const res = await axios.get("/documents/my");
    setDocuments(res.data);
  };

  const detectFileType = (files: File[]): "image" | "video" | "file" => {
    if (files.length === 0) return "file";
    const types = files.map((f) => f.type.split("/")[0]);
    const uniqueTypes = new Set(types);
    if (uniqueTypes.size > 1) return "file";
    const type = types[0];
    if (type === "image") return "image";
    if (type === "video") return "video";
    return "file";
  };

  const handleUpload = async () => {
    if (files.length === 0) return alert("Chọn ít nhất một file");
    const detectedType = detectFileType(files);
    const data = new FormData();
    files.forEach((file) => data.append("files", file));
    data.append("title", formData.title || "");
    data.append("description", formData.description || "");
    data.append("type", detectedType);

    try {
      await axios.post("/documents/upload", data);
      setFormData({ title: "", description: "" });
      setFiles([]);
      fetchDocs();
      alert("Tải lên thành công");
      setOpenUpload(false);
    } catch {
      alert("Đã xảy ra lỗi khi tải lên tài liệu");
    }
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviewUrls([]);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const filteredDocs = documents.filter((doc) => {
    const matchSearch = doc.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filter === "all" ||
      (filter === "approved" && doc.status === "approved") ||
      (filter === "pending" && doc.status === "pending");
    return matchSearch && matchStatus;
  });

  return (
    <Box maxWidth="lg" mx="auto" p={3}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Tài liệu đã tải lên
      </Typography>

      {/* Upload Button */}
      <Button variant="contained" onClick={() => setOpenUpload(true)} sx={{ mb: 2 }}>
        Tải tài liệu
      </Button>

      {/* Search + Filter */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <TextField
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <Tabs value={filter} onChange={(_, val) => setFilter(val)}>
          <Tab label="Tất cả" value="all" />
          <Tab label="Đã duyệt" value="approved" />
          <Tab label="Chờ duyệt" value="pending" />
        </Tabs>
      </Stack>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Tải lên</TableCell>
              <TableCell>Xem/Tải</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDocs.map((doc) => (
              <TableRow key={doc.id} hover>
                <TableCell>{doc.title}</TableCell>
                <TableCell>{doc.description}</TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>{doc.type}</TableCell>
                <TableCell>
                  <Chip
                    label={
                      doc.status === "approved"
                        ? "Đã duyệt"
                        : doc.status === "rejected"
                          ? "Từ chối"
                          : "Chờ duyệt"
                    }
                    color={
                      doc.status === "approved"
                        ? "success"
                        : doc.status === "rejected"
                          ? "error"
                          : "warning"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(doc.uploadedAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setPreviewDoc(doc)}
                  >
                    Xem
                  </Button>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Upload Dialog */}
      <Dialog open={openUpload} onClose={() => setOpenUpload(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tải tài liệu mới</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tiêu đề"
              value={formData.title}
              onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Mô tả"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              fullWidth
            />
            <Button
              variant="outlined"
              component="label"
            >
              Chọn file
              <input
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  const selectedFiles = Array.from(e.target.files || []);
                  setFiles(selectedFiles);
                  setPreviewUrls(selectedFiles.map((file) => URL.createObjectURL(file)));
                }}
              />
            </Button>

            {files.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary">Xem trước</Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {files.map((file, index) => {
                    const url = previewUrls[index];
                    if (file.type.startsWith("image/")) {
                      return <img key={index} src={url} style={{ height: 80, borderRadius: 4 }} />;
                    }
                    if (file.type.startsWith("video/")) {
                      return <video key={index} src={url} style={{ height: 80 }} controls />;
                    }
                    return <Typography key={index} variant="body2">{file.name}</Typography>;
                  })}
                </Stack>
                <Button
                  size="small"
                  color="error"
                  onClick={() => {
                    previewUrls.forEach((url) => URL.revokeObjectURL(url));
                    setFiles([]);
                    setPreviewUrls([]);
                  }}
                >
                  Xoá tất cả
                </Button>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpload(false)}>Huỷ</Button>
          <Button variant="contained" onClick={handleUpload}>Tải lên</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <DocumentViewerDialog
        open={!!previewDoc}
        document={previewDoc as unknown as import("@/components/Document/DocumentViewer").Document}
        onClose={() => setPreviewDoc(null)}
      />

    </Box>
  );
}
