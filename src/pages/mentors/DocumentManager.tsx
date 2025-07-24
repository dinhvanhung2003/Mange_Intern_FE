import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import MuiButton from '@mui/material/Button';

import axios from '@/utils/axios';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

interface Document {
  id: number;
  title: string;
  description?: string;
  type: 'image' | 'video' | 'file';
  files: { fileUrl: string; type: string }[];
 status: 'pending' | 'approved' | 'rejected';

  uploadedAt: string;
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [files, setFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({ title: '', description: '', type: 'file' });

  // Xem hình ảnh hay video 
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const fetchDocs = async () => {
    const res = await axios.get('/documents/my');
    setDocuments(res.data);
  };

  const handleUpload = async () => {
  if (files.length === 0) return alert('Chọn ít nhất một file');
  if (!formData.type) return alert('Vui lòng chọn loại tài liệu');

  const data = new FormData();

  files.forEach((file) => {
    data.append('files', file);
  });

  data.append('title', formData.title || '');
  data.append('description', formData.description || '');
  data.append('type', formData.type || 'file');

  try {
    await axios.post('/documents/upload', data);
    setFormData({ title: '', description: '', type: 'file' });
    setFiles([]);
    fetchDocs();
    alert('Tải lên thành công');
  } catch (err: any) {
    console.error(err);
    alert('Đã xảy ra lỗi khi tải lên tài liệu');
  }
};



  useEffect(() => {
    fetchDocs();
  }, []);

  const filteredDocs = documents.filter((doc) => {
    const matchSearch = doc.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filter === 'all' ||
     (filter === 'approved' && doc.status === 'approved') ||
(filter === 'pending' && doc.status === 'pending')

    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Tài liệu đã tải lên</h2>

      {/* Upload Form */}
      <Dialog>
        <DialogTrigger asChild>
         <MuiButton variant="contained">Tải tài liệu</MuiButton>
        </DialogTrigger>

        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tải tài liệu mới</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentType">Loại tài liệu</Label>
              <select
                id="documentType"
                value={formData.type}
                onChange={(e) => setFormData((f) => ({ ...f, type: e.target.value }))}
                className="w-full h-10 px-3 py-2 border rounded-md text-sm"
              >
                <option value="file">File</option>
                <option value="image">Ảnh</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Chọn file</Label>
              <Input
                type="file"
                multiple
                accept={
                  formData.type === 'image'
                    ? 'image/*'
                    : formData.type === 'video'
                      ? 'video/*'
                      : '*/*'
                }
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />



            </div>

            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
  <MuiButton variant="outlined">Huỷ</MuiButton>
</DialogClose>
<MuiButton variant="contained" onClick={handleUpload}>Tải lên</MuiButton>

            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Filter + Search */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Tabs value={filter} onValueChange={(val) => setFilter(val as any)}>
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Document List */}
      {/* Document Table View */}
      <div className="overflow-auto rounded border">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Tiêu đề</th>
              <th className="px-4 py-2">Mô tả</th>
              <th className="px-4 py-2">Loại</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2">Tải lên</th>
              <th className="px-4 py-2">Xem/Tải</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((doc) => (
              <tr key={doc.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{doc.title}</td>
                <td className="px-4 py-2">{doc.description}</td>
                <td className="px-4 py-2 capitalize">{doc.type}</td>
                <td className="px-4 py-2">
                <span
  className={`text-xs px-2 py-0.5 rounded ${
    doc.status === 'approved'
      ? 'bg-green-100 text-green-800'
      : doc.status === 'rejected'
      ? 'bg-red-100 text-red-800'
      : 'bg-yellow-100 text-yellow-800'
  }`}
>
  {doc.status === 'approved'
    ? 'Đã duyệt'
    : doc.status === 'rejected'
    ? 'Từ chối'
    : 'Chờ duyệt'}
</span>
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {new Date(doc.uploadedAt).toLocaleString()}
                </td>
               <td className="px-4 py-2">
  {doc.type === 'image' && doc.files?.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {doc.files.map((f, i) => (
        <img
          key={i}
          src={`http://localhost:3000/${f.fileUrl}`}
          alt={`${doc.title} - ${i}`}
          className="h-10 rounded cursor-pointer"
          onClick={() => setPreviewDoc(doc)}
        />
      ))}
    </div>
  )}

  {doc.type === 'video' && doc.files?.length > 0 && (
    <div className="flex flex-col gap-1">
      {doc.files.map((f, i) => (
        <video
          key={i}
          className="h-10 cursor-pointer"
          onClick={() => setPreviewDoc(doc)}
        >
          <source src={`http://localhost:3000/${f.fileUrl}`} />
        </video>
      ))}
    </div>
  )}

  {doc.type === 'file' && doc.files?.length > 0 && (
    <ul className="space-y-1">
      {doc.files.map((f, i) => (
        <li key={i}>
          <a
            href={`http://localhost:3000/${f.fileUrl}`}
            download
            className="text-blue-600 underline"
          >
            File {i + 1}
          </a>
        </li>
      ))}
    </ul>
  )}
</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

<Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>{previewDoc?.title}</DialogTitle>
    </DialogHeader>

    <div className="mt-4 space-y-2">
      <p className="text-sm text-gray-600">{previewDoc?.description}</p>

      {previewDoc?.type === 'image' && previewDoc.files?.length > 0 && (
        <div className="space-y-4">
          {previewDoc.files.map((f, i) => (
            <img
              key={i}
              src={`http://localhost:3000/${f.fileUrl}`}
              alt={`Preview ${i}`}
              className="w-full rounded"
            />
          ))}
        </div>
      )}

      {previewDoc?.type === 'video' && previewDoc.files?.length > 0 && (
        <div className="space-y-4">
          {previewDoc.files.map((f, i) => (
            <video key={i} controls className="w-full rounded">
              <source src={`http://localhost:3000/${f.fileUrl}`} />
            </video>
          ))}
        </div>
      )}

      {previewDoc?.type === 'file' && previewDoc.files?.length > 0 && (
        <ul className="space-y-1">
          {previewDoc.files.map((f, i) => (
            <li key={i}>
              <a
                href={`http://localhost:3000/${f.fileUrl}`}
                download
                className="text-blue-600 underline"
              >
                Tải xuống File {i + 1}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  </DialogContent>
</Dialog>



    </div>
  );
}
