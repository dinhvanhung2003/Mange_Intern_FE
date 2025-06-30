import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../utils/axios';
import avatar_chat from '../../assets/avatar_chat.png'
import { useAssignmentStore } from '../../stores/useAssignmentStore';
const socket = io('http://localhost:3000');

interface Message {
  senderId: number;
  senderName?: string;
  message: string;
  sentAt?: string;
}

interface Assignment {
  id: number;
  internId: number;
  internName?: string;
}

function getUserFromToken() {
  const token = sessionStorage.getItem('accessToken');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}
const boxStyle = {
  padding: 8,
  border: '1px solid #ccc',
  borderRadius: 6,
  marginBottom: 5,
  background: '#eef',
  cursor: 'pointer',
};
export default function FloatingChatUnified() {
  const user = getUserFromToken();
  const isMentor = user?.type === 'mentor';

  const [open, setOpen] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const [chatTab, setChatTab] = useState<'intern' | 'group'>('intern');
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedInterns, setSelectedInterns] = useState<number[]>([]);

  const { assignment } = useAssignmentStore();

  // Load data...
  useEffect(() => {
    if (!user) return;
    if (isMentor) {
      api.get('/mentor/assignments').then(res => {
        setAssignments(Array.isArray(res.data) ? res.data : []);
        setCurrentUserId(user.sub);
      });
      api.get('/chat-groups').then(res => {
        const groupsWithNames = res.data.map((g: any) => ({
          ...g,
          memberNames: g.members?.map((m: any) => m.name).join(', ') || '',
        }));
        setGroups(groupsWithNames);
      });
    }
  }, []);

  useEffect(() => {
    if (assignment) {
      setSelectedAssignment({
        id: assignment.id,
        internId: assignment.internId,
        internName: user?.name,
      });
      setCurrentUserId(user.sub);
    }
  }, [assignment]);

  useEffect(() => {
    if (!selectedAssignment) return;
    socket.emit('join_room', selectedAssignment.id);
    api.get(`/messages/${selectedAssignment.id}`).then(res => setMessages(res.data));
  }, [selectedAssignment]);

 useEffect(() => {
  const handler = (msg: Message) => setMessages(prev => [...prev, msg]);
  socket.on('receive_message', handler);


  return () => {
    socket.off('receive_message', handler);
  };
}, []);

  useEffect(() => {
  const handler = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
  };

  socket.on('receive_group_message', handler);
  return () => {
    socket.off('receive_group_message', handler);
  };
}, []);



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

  if (!user || !currentUserId) return null;

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999 }}>
      {open ? (
        <div style={{
          width: 320,
          height: 460,
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            background: '#1976d2',
            color: 'white',
            padding: 10,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            {(selectedAssignment || selectedGroup) && (
              <button onClick={() => {
                setSelectedAssignment(null);
                setSelectedGroup(null);
              }} style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: 18,
                cursor: 'pointer',
              }}>⬅️</button>
            )}
            <span style={{ fontWeight: 'bold' }}>
              {selectedAssignment ? `Intern: ${selectedAssignment.internName}` :
                selectedGroup ? `Nhóm: ${selectedGroup.name}` :
                  'Chat'}
            </span>
            <button onClick={() => setOpen(false)} style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: 18,
            }}>×</button>
          </div>

          {/* Tabs (chỉ khi chưa chọn đoạn chat) */}
          {!selectedAssignment && !selectedGroup && isMentor && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc' }}>
              <button
                style={{ flex: 1, padding: 8, background: chatTab === 'intern' ? '#eee' : '#fff' }}
                onClick={() => setChatTab('intern')}
              >
                Chat Intern
              </button>
              <button
                style={{ flex: 1, padding: 8, background: chatTab === 'group' ? '#eee' : '#fff' }}
                onClick={() => setChatTab('group')}
              >
                Chat Nhóm
              </button>
            </div>
          )}

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            {/* Nếu đã chọn intern / nhóm */}
            {(selectedAssignment || selectedGroup) ? (
              <>
                {messages.map((msg, idx) => (
                  <div key={idx} style={{
                    textAlign: msg.senderId === currentUserId ? 'right' : 'left',
                    margin: '4px 0',
                  }}>
                    {msg.senderId !== currentUserId && msg.senderName && (
                      <div style={{ fontSize: 12, color: '#555' }}>{msg.senderName}</div>
                    )}
                    <div style={{
                      display: 'inline-block',
                      background: msg.senderId === currentUserId ? '#dcf8c6' : '#f1f0f0',
                      padding: '6px 10px',
                      borderRadius: 12,
                      maxWidth: '80%',
                    }}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </>
            ) : (
              <>
                {/* Danh sách intern hoặc nhóm */}
                {isMentor && chatTab === 'intern' && (
                  <>
                    <input
                      type="text"
                      placeholder="Tìm intern..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 6,
                        border: '1px solid #ccc',
                        borderRadius: 6,
                        marginBottom: 10,
                      }}
                    />
                    {assignments.filter(a =>
                      a.internName?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((a) => (
                      <div key={a.id} onClick={() => {
                        setSelectedGroup(null);
                        setSelectedAssignment(a);
                        socket.emit('join_room', a.id);
                        api.get(`/messages/${a.id}`).then(res => setMessages(res.data));
                      }} style={boxStyle}>
                        <img src={avatar_chat} alt="Avatar" /> {a.internName}
                      </div>
                    ))}
                  </>
                )}
                {isMentor && chatTab === 'group' && (
                  <>
                    <button onClick={() => setIsCreatingGroup(true)} style={{ marginBottom: 10 }}>
                      ➕ Tạo nhóm
                    </button>
                    {groups.map((g) => (
                      <div key={g.id} onClick={() => {
                        setSelectedAssignment(null);
                        setSelectedGroup(g);
                        socket.emit('join_group', g.id);
                        api.get(`/messages/group/${g.id}`).then(res => setMessages(res.data));
                      }} style={boxStyle}>
                        {g.name} ({g.memberNames})
                      </div>
                    ))}
                  </>
                )}
                {!isMentor && (
                  <>
                    <div onClick={() => {
                      if (assignment) {
                        setSelectedGroup(null);
                        setSelectedAssignment({
                          id: assignment.id,
                          internId: assignment.internId,
                          internName: user?.name,
                        });
                        socket.emit('join_room', assignment.id);
                        api.get(`/messages/${assignment.id}`).then(res => setMessages(res.data));
                      }
                    }} style={boxStyle}>💬 Chat với Mentor</div>
                    {groups.map((g) => (
                      <div key={g.id} onClick={() => {
                        setSelectedAssignment(null);
                        setSelectedGroup(g);
                        socket.emit('join_group', g.id);
                        api.get(`/messages/group/${g.id}`).then(res => setMessages(res.data));
                      }} style={boxStyle}>
                        {g.name} ({g.memberNames})
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* Input gửi tin nhắn */}
          {(selectedAssignment || selectedGroup) && (
            <div style={{ padding: 10, borderTop: '1px solid #ddd' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Nhập tin nhắn..."
                style={{ width: '80%', padding: '6px' }}
              />
              <button onClick={sendMessage} style={{ padding: '6px 10px', marginLeft: 5 }}>Gửi</button>
            </div>
          )}

          {/* Popup tạo nhóm */}
          {isCreatingGroup && (
            <div style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6, margin: 10 }}>
              <input
                placeholder="Tên nhóm"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                style={{ marginBottom: 10, width: '100%' }}
              />
              {assignments.map((a) => (
                <div key={a.internId}>
                  <label>
                    <input
                      type="checkbox"
                      value={a.internId}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        if (e.target.checked) setSelectedInterns((prev) => [...prev, id]);
                        else setSelectedInterns((prev) => prev.filter((v) => v !== id));
                      }}
                    />
                    {a.internName}
                  </label>
                </div>
              ))}
              <hr />
              <button
                onClick={async () => {
                  const res = await api.post('/chat-groups', {
                    name: newGroupName,
                    memberIds: selectedInterns,
                  });
                  setGroups((prev) => [
                    ...prev,
                    {
                      ...res.data,
                      memberNames: res.data.members.map((m: any) => m.name).join(', ')
                    }
                  ]);
                  setIsCreatingGroup(false);
                  setNewGroupName('');
                  setSelectedInterns([]);
                }}
              >
                ✅ Xác nhận tạo
              </button>
            </div>
          )}
        </div>
      ) : (
        <button onClick={() => setOpen(true)} style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: '#1976d2',
          color: 'white',
          fontSize: 24,
          border: 'none',
        }}>💬</button>
      )}
    </div>
  );
}