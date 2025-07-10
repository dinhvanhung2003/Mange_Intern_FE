import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../utils/axios';
import { useAssignmentStore } from '../../stores/useAssignmentStore';

const socket = io('http://localhost:3000');

function getUserFromToken() {
  const token = sessionStorage.getItem('accessToken');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function FloatingChatIntern() {
  const user = getUserFromToken();
  const { assignment } = useAssignmentStore();
  const currentUserId = user?.sub;

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'mentor' | 'group'>('group');

  const [messages, setMessages] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mentioned notification
  useEffect(() => {
    const handleMention = (data: any) => {
      console.log('Bạn được tag:', data);
      alert(`📣 ${data.from.name} đã tag bạn trong nhóm! Nội dung: ${data.message}`);
    };

    socket.on('mentioned_notification', handleMention);

    return () => {
      socket.off('mentioned_notification', handleMention);
    };
  }, []);

  // Join user room + fetch groups + listen new group
  useEffect(() => {
    if (!currentUserId) return;

    socket.emit('join_user_room', currentUserId);

    api.get('/chat-groups/my').then(res => {
      const myGroups = res.data || [];
      setGroups(myGroups);
      myGroups.forEach((group: any) => {
        socket.emit('join_group', group.id);
      });
    });

    const handleNewGroup = (group: any) => {
      console.log('📥 Nhận nhóm mới:', group);
      setGroups(prev => {
        if (prev.some(g => g.id === group.id)) return prev;
        return [...prev, group];
      });
      socket.emit('join_group', group.id);
    };

    socket.on('new_group_created', handleNewGroup);

    return () => {
      socket.off('new_group_created', handleNewGroup);
    };
  }, [currentUserId]);


  useEffect(() => {
    const handleMsg = (msg: any) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on('receive_message', handleMsg);
    socket.on('receive_group_message', handleMsg);

    return () => {
      socket.off('receive_message', handleMsg);
      socket.off('receive_group_message', handleMsg);
    };
  }, []);

  // Nhóm bị sửa
  useEffect(() => {
    const handleGroupEdited = (updatedGroup: any) => {
      setGroups(prev =>
        prev.map(g =>
          g.id === updatedGroup.id
            ? { ...updatedGroup, memberNames: updatedGroup.members?.map((m: any) => m.name).join(', ') }
            : g
        )
      );
      if (selectedGroup?.id === updatedGroup.id) {
        setSelectedGroup(updatedGroup);
      }
    };

    socket.on('group_edited', handleGroupEdited);
    return () => {
      socket.off('group_edited', handleGroupEdited);
    };
  }, [selectedGroup]);

  // Auto scroll xuống cuối
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !currentUserId) return;

    if (selectedAssignment) {
      socket.emit('send_message', {
        assignmentId: selectedAssignment.id,
        senderId: currentUserId,
        message: input,
      });
    } else if (selectedGroup) {
      socket.emit('send_group_message', {
        groupId: selectedGroup.id,
        senderId: currentUserId,
        message: input,
      });
    }

    setInput('');
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAssignment(null);
    setSelectedGroup(null);
    setMessages([]);
    setInput('');
  };

  const handleBack = () => {
    setSelectedAssignment(null);
    setSelectedGroup(null);
    setMessages([]);
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
      {open ? (
        <div style={{
          width: 320, height: 460, background: '#fff',
          borderRadius: 10, border: '1px solid #ccc',
          display: 'flex', flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            background: '#1976d2', color: '#fff', padding: 10,
            display: 'flex', justifyContent: 'space-between'
          }}>
            {(selectedGroup || selectedAssignment) && (
              <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#fff' }}>⬅️</button>
            )}
            <span>
              {selectedAssignment ? 'Chat với Mentor' : selectedGroup?.name || 'Chat'}
            </span>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#fff' }}>×</button>
          </div>

          {/* Tabs */}
          {!(selectedGroup || selectedAssignment) && (
            <div style={{ display: 'flex' }}>
              <button onClick={() => setTab('mentor')} style={{ flex: 1, padding: 8, background: tab === 'mentor' ? '#eee' : '#fff' }}>Mentor</button>
              <button onClick={() => setTab('group')} style={{ flex: 1, padding: 8, background: tab === 'group' ? '#eee' : '#fff' }}>Nhóm</button>
            </div>
          )}

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            {(selectedGroup || selectedAssignment) ? (
              <>
                {messages.map((msg, idx) => (
                  <div key={idx} style={{ textAlign: msg.senderId === currentUserId ? 'right' : 'left', marginBottom: 4 }}>
                    {msg.senderId !== currentUserId && <div style={{ fontSize: 12 }}>{msg.senderName}</div>}
                    <div style={{
                      display: 'inline-block',
                      background: msg.senderId === currentUserId ? '#dcf8c6' : '#eee',
                      padding: 8, borderRadius: 10
                    }}>{msg.message}</div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </>
            ) : (
              <>
                {tab === 'mentor' && assignment && (
                  <div onClick={() => {
                    setSelectedAssignment(assignment);
                    socket.emit('join_room', assignment.id);
                    api.get(`/messages/${assignment.id}`).then(res => setMessages(res.data));
                  }} style={{
                    padding: 8, background: '#eef', borderRadius: 6, marginBottom: 6, cursor: 'pointer'
                  }}>
                    💬 Chat với Mentor
                  </div>
                )}
                {tab === 'group' && groups.map(g => (
                  <div key={g.id} onClick={() => {
                    setSelectedGroup(g);
                    socket.emit('join_group', g.id);
                    api.get(`/messages/group/${g.id}`).then(res => setMessages(res.data));
                  }} style={{
                    padding: 8, background: '#eef', borderRadius: 6, marginBottom: 6, cursor: 'pointer'
                  }}>
                    {g.name || `Nhóm ${g.id}`}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Input */}
          {(selectedGroup || selectedAssignment) && (
            <div style={{ padding: 10, borderTop: '1px solid #ccc' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Nhập tin nhắn..."
                style={{ width: '80%' }}
              />
              <button onClick={sendMessage} disabled={!input.trim()}>Gửi</button>
            </div>
          )}
        </div>
      ) : (
        <button onClick={() => setOpen(true)} style={{
          width: 60, height: 60, borderRadius: '50%',
          background: '#1976d2', color: '#fff', fontSize: 24
        }}>💬</button>
      )}
    </div>
  );
}
