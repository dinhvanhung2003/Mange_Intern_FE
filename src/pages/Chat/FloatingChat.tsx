import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../utils/axios';
import avatar_chat from '../../assets/avatar_chat.png'
const socket = io('http://localhost:3000');

interface Message {
  senderId: number;
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

  useEffect(() => {
    if (!user) return;

    if (isMentor) {
      api.get('/mentor/assignments').then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setAssignments(data);
        setCurrentUserId(user.sub);
      });
    } else {
      api.get('/interns/assignment').then((res) => {
        const { id, internId, mentorId } = res.data;
        setSelectedAssignment({ id, internId });
        setCurrentUserId(user.sub);
      });
    }
  }, []);

  useEffect(() => {
    if (!selectedAssignment) return;

    socket.emit('join_room', selectedAssignment.id);

    api.get(`/messages/${selectedAssignment.id}`).then((res) => {
      setMessages(res.data);
    });
  }, [selectedAssignment]);

  useEffect(() => {
    const handler = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('receive_message', handler);
    return () => {
      socket.off('receive_message', handler);
    };
  }, []);
  // useEffect(() => {
  //   const handleHistory = (messagesFromRedis: Message[]) => {
  //     setMessages((prev) => {
  //       const existingKeys = new Set(prev.map((m) => `${m.senderId}-${m.sentAt}`));
  //       const uniqueNew = messagesFromRedis.filter(
  //         (m) => !existingKeys.has(`${m.senderId}-${m.sentAt}`)
  //       );
  //       return [...prev, ...uniqueNew];
  //     });
  //   };

  //   socket.on('receive_message_history', handleHistory);
  //   return () => {
  //     socket.off('receive_message_history', handleHistory);
  //   };
  // }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !selectedAssignment || !currentUserId) return;

    const msg = {
      assignmentId: selectedAssignment.id,
      senderId: currentUserId,
      message: input,
    };

    socket.emit('send_message', msg);
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
          boxShadow: '0 0 10px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            background: '#1976d2',
            color: 'white',
            padding: 10,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isMentor && selectedAssignment && (
                <button onClick={() => setSelectedAssignment(null)} style={{
                  background: 'none', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer',
                }}>⬅️</button>
              )}
              <span>
                {isMentor
                  ? selectedAssignment
                    ? `Intern: ${selectedAssignment.internName}`
                    : 'Chọn Intern để chat'
                  : 'Chat với Mentor'}
              </span>
            </div>
            <button onClick={() => {
              if (isMentor && selectedAssignment) setSelectedAssignment(null);
              else setOpen(false);
            }} style={{ color: 'white', background: 'none', border: 'none' }}>×</button>
          </div>

          {!selectedAssignment && isMentor ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
              <input
                type="text"
                placeholder="Tìm intern..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: 6,
                  border: '1px solid #ccc',
                  borderRadius: 6,
                  marginBottom: 10
                }}
              />
              {assignments
                .filter(a => a.internName?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((a) => (
                  <div key={a.id} onClick={() => setSelectedAssignment(a)} style={{
                    cursor: 'pointer',
                    padding: 10,
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    marginBottom: 8,
                    background: '#f9f9f9'
                  }}>
                    <img src={avatar_chat} alt="Avatar"></img>
                     {a.internName}
                  </div>
                ))}
            </div>
          ) : (
            <>
              <div style={{ flex: 1, padding: 10, overflowY: 'auto' }}>
                {messages.map((msg, idx) => (
                  <div key={idx} style={{ textAlign: msg.senderId === currentUserId ? 'right' : 'left', margin: '4px 0' }}>
                    <div style={{
                      display: 'inline-block',
                      background: msg.senderId === currentUserId ? '#dcf8c6' : '#f1f0f0',
                      padding: '6px 10px',
                      borderRadius: 12,
                      maxWidth: '80%',
                    }}>{msg.message}</div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
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
            </>
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
