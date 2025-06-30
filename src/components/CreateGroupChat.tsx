import React, { useState } from 'react';
import api from '../utils/axios';
import { useEffect } from 'react';
interface Props {
  isOpen: boolean;
  onClose: () => void;
  assignments: { internId: number; internName?: string }[];
  currentUserId: number;
  onGroupCreated: (newGroup: any) => void;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  assignments,
  currentUserId,
  onGroupCreated,
}: Props) {
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedInterns, setSelectedInterns] = useState<number[]>([]);

  // 🔥 Điều kiện hiển thị modal
  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newGroupName.trim()) return alert('Vui lòng nhập tên nhóm.');
    if (selectedInterns.length < 2) return alert('Chọn ít nhất 2 intern.');

    const res = await api.post('/chat-groups', {
      name: newGroupName,
      memberIds: [currentUserId, ...selectedInterns],
    });

    const newGroup = {
      ...res.data,
      memberNames: res.data.members.map((m: any) => m.name).join(', '),
    };

    onGroupCreated(newGroup);
    setNewGroupName('');
    setSelectedInterns([]);
    onClose();
  };

  return (
    <>
      {/* backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000
        }}
        onClick={onClose}
      />
      {/* modal box */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: 20,
          borderRadius: 10,
          zIndex: 1001,
          width: 300,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ marginBottom: 10 }}>Tạo nhóm mới</h3>
        <input
          placeholder="Tên nhóm"
          value={newGroupName}
          onChange={e => setNewGroupName(e.target.value)}
          style={{ width: '100%', marginBottom: 10, padding: 6 }}
        />
        {assignments.map(a => (
          <div key={a.internId}>
            <label>
              <input
                type="checkbox"
                value={a.internId}
                onChange={e => {
                  const id = Number(e.target.value);
                  if (e.target.checked)
                    setSelectedInterns(prev => [...prev, id]);
                  else
                    setSelectedInterns(prev => prev.filter(i => i !== id));
                }}
              />
              {a.internName}
            </label>
          </div>
        ))}
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onClose}>Hủy</button>
          <button onClick={handleCreate}>Tạo nhóm</button>
        </div>
      </div>
    </>
  );
}
