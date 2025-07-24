import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MuiButton from '@mui/material/Button';
import axios from '@/utils/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Document {
  id: number;
  title: string;
  description?: string;
  type: 'image' | 'video' | 'file';
  
  status: 'pending' | 'approved' | 'rejected';

  uploadedAt: string;
  uploadedBy: {
    id: number;
    name: string;
    email: string;
  };
  files: {
    id: number;
    fileUrl: string;
    type: 'image' | 'video' | 'file';
  }[]; 
}


export default function AdminDocumentApproval() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [search, setSearch] = useState('');

  const fetchPending = async () => {
    const res = await axios.get('/documents/all');;
    setDocuments(res.data);
  };

  const handleApprove = async (id: number) => {
    await axios.patch(`/documents/${id}/approve`);
    fetchPending();
  };

  const handleReject = async (id: number) => {
    await axios.patch(`/documents/${id}/reject`);
    fetchPending();
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Tài liệu chờ duyệt</h2>

      <Input
        placeholder="Tìm kiếm..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-auto rounded border">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Tiêu đề</th>
              <th className="px-4 py-2">Người gửi</th>
              <th className="px-4 py-2">Loại</th>
              <th className="px-4 py-2">Tải lên</th>
              <th className="px-4 py-2">Xem</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((doc) => (
              <tr key={doc.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{doc.title}</td>
                <td className="px-4 py-2">{doc.uploadedBy?.name || doc.uploadedBy?.email}</td>
                <td className="px-4 py-2 capitalize">{doc.type}</td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {new Date(doc.uploadedAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <Button variant="outline" onClick={() => setSelectedDoc(doc)}>
                    Xem
                  </Button>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${doc.status === 'approved'
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
                <td className="px-4 py-2">
                  {doc.status === 'pending' && (
                    <>
                      <MuiButton
                        variant="contained"
                        size="small"
                        color="success"
                        onClick={() => handleApprove(doc.id)}
                      >
                        Duyệt
                      </MuiButton>
                      <MuiButton
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => handleReject(doc.id)}
                        sx={{ marginLeft: 1 }}
                      >
                        Từ chối
                      </MuiButton>
                    </>
                  )}

                  {doc.status === 'approved' && (
                    <span className="text-green-700 text-sm font-medium">Đã duyệt</span>
                  )}
                  {doc.status === 'rejected' && (
                    <span className="text-red-600 text-sm font-medium">Đã từ chối</span>
                  )}
                </td>




              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal xem chi tiết tài liệu */}
     <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>{selectedDoc?.title}</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{selectedDoc?.description}</p>

      {selectedDoc?.type === 'image' &&
        selectedDoc?.files?.map((file, idx) => (
          <img
            key={idx}
            src={`http://localhost:3000/${file.fileUrl}`}
            alt={`${selectedDoc.title} - ${idx}`}
            className="w-full rounded mb-2"
          />
        ))}

      {selectedDoc?.type === 'video' &&
        selectedDoc?.files?.map((file, idx) => (
          <video key={idx} controls className="w-full rounded mb-2">
            <source src={`http://localhost:3000/${file.fileUrl}`} />
          </video>
        ))}

      {selectedDoc?.type === 'file' &&
        selectedDoc?.files?.map((file, idx) => (
          <a
            key={idx}
            href={`http://localhost:3000/${file.fileUrl}`}
            download
            className="text-blue-600 underline block mb-2"
          >
            Tải file {idx + 1}
          </a>
        ))}
    </div>
  </DialogContent>
</Dialog>

    </div>
  );
}
