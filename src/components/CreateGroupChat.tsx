import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import api from '../utils/axios';

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

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          zIndex: 1001,
          width: 360,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}
      >
        <h2 style={{
          marginBottom: 16,
          fontSize: 20,
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#333'
        }}>
          Tạo nhóm mới
        </h2>

        <input
          placeholder="Nhập tên nhóm..."
          value={newGroupName}
          onChange={e => setNewGroupName(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: 8,
            border: '1px solid #ccc',
            marginBottom: 16,
            fontSize: 14,
          }}
        />

        <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
          {assignments.map(a => (
            <label key={a.internId} style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 8,
              fontSize: 14,
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                value={a.internId}
                onChange={e => {
                  const id = Number(e.target.value);
                  setSelectedInterns(prev =>
                    e.target.checked
                      ? [...prev, id]
                      : prev.filter(i => i !== id)
                  );
                }}
                style={{ marginRight: 8 }}
              />
              {a.internName}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #ccc',
              background: '#f5f5f5',
              cursor: 'pointer',
            }}
          >
            ❌ Hủy
          </button>
          <button
            onClick={handleCreate}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#1976d2',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ➕ Tạo nhóm
          </button>
        </div>
      </div>
    </>,
    document.getElementById('modal-root') as HTMLElement
  );
}
