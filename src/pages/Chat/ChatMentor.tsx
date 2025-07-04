import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../utils/axios';
import avatar_chat from '../../assets/avatar_chat.png';
import CreateGroupModal from '../../components/CreateGroupChat';
const socket = io('http://localhost:3000');

interface Message {
  senderId: number;
  senderName?: string;
  message: string;
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

export default function FloatingChatMentor() {
  const user = getUserFromToken();
  const currentUserId = user?.sub;
  const [open, setOpen] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [chatTab, setChatTab] = useState<'intern' | 'group'>('intern');
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedInterns, setSelectedInterns] = useState<number[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // them thanh vien 
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [membersToAdd, setMembersToAdd] = useState<number[]>([]);


useEffect(() => {
  if (!user) return;

  api.get('/chat-groups/my').then(res => {
    const groupsWithNames = res.data.map((g: any) => ({
      ...g,
      memberNames: g.members?.map((m: any) => m.name).join(', ') || '',
    }));
    setGroups(groupsWithNames);
  });
}, []);


  useEffect(() => {
    if (!user) return;
    api.get('/mentor/assignments').then(res => setAssignments(res.data || []));
    // api.get('/chat-groups').then(res => {
    //   const groupsWithNames = res.data.map((g: any) => ({
    //     ...g,
    //     memberNames: g.members?.map((m: any) => m.name).join(', ') || '',
    //   }));
    //   setGroups(groupsWithNames);
    // });
  }, []);

  useEffect(() => {
    const handler = (msg: Message) => setMessages(prev => [...prev, msg]);
    socket.on('receive_message', handler);
    socket.on('receive_group_message', handler);
    return () => {
      socket.off('receive_message', handler);
      socket.off('receive_group_message', handler);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    socket.on('group_edited', (updatedGroup: any) => {
      setGroups(prev => prev.map(g =>
        g.id === updatedGroup.id
          ? { ...updatedGroup, memberNames: updatedGroup.members?.map((m: any) => m.name).join(', ') }
          : g
      ));
      if (selectedGroup?.id === updatedGroup.id) {
        setSelectedGroup(updatedGroup);
      }
    });

    socket.on('group_deleted', (groupId: number) => {
      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setMessages([]);
      }
    });
    console.log('selectedGroup:', selectedGroup);
    return () => {
      socket.off('group_edited');
      socket.off('group_deleted');
    };
  }, [selectedGroup]);

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
// useEffect(() => {
//   const handler = (msg: Message) => {
//     if (msg.senderId === currentUserId) return; 
//     setMessages(prev => [...prev, msg]);
//   };

//   socket.on('receive_message', handler);
//   socket.on('receive_group_message', handler);

//   return () => {
//     socket.off('receive_message', handler);
//     socket.off('receive_group_message', handler);
//   };
// }, [currentUserId]);


  return (
    <>
    
      <CreateGroupModal
  isOpen={isCreatingGroup}
  key={isCreatingGroup ? 'modal-open' : 'modal-closed'}
  onClose={() => setIsCreatingGroup(false)}
  assignments={assignments}
  currentUserId={currentUserId}
  onGroupCreated={(newGroup) => {
    setGroups(prev => [...prev, newGroup]);
    setSelectedGroup(newGroup);
    socket.emit('join_group', newGroup.id);
    api.get(`/messages/group/${newGroup.id}`).then(res => setMessages(res.data));
  }}
/>
 <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999 }}>
      {open ? (
        <div style={{
          width: 320,
          height: 460,
          background: 'white',
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #ccc'
        }}>
          {/* HEADER */}
          <div style={{
            background: '#1976d2',
            color: 'white',
            padding: 10,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {(selectedAssignment || selectedGroup) && (
                <button onClick={() => { setSelectedAssignment(null); setSelectedGroup(null); }} style={{ background: 'none', border: 'none', color: 'white', fontSize: 18 }}>⬅️</button>
              )}
              <span style={{ marginLeft: 8 }}>
                {selectedAssignment ? selectedAssignment.internName : selectedGroup?.name || 'Chat'}
              </span>
              {selectedGroup && (
                <button
                  onClick={() => setShowGroupModal(true)}
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: 16, marginLeft: 8 }}
                >⚙️</button>
              )}
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 18 }}>×</button>
          </div>

          {/* BODY */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            {(selectedAssignment || selectedGroup) ? (
              <>
                {messages.map((msg, idx) => (
                  <div key={idx} style={{ textAlign: msg.senderId === currentUserId ? 'right' : 'left', margin: '4px 0' }}>
                    {msg.senderId !== currentUserId && msg.senderName && <div style={{ fontSize: 12 }}>{msg.senderName}</div>}
                    <div style={{ display: 'inline-block', background: msg.senderId === currentUserId ? '#dcf8c6' : '#f1f0f0', padding: '6px 10px', borderRadius: 12 }}>{msg.message}</div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </>
            ) : (
              <>
                <div style={{ display: 'flex' }}>
                  <button style={{ flex: 1, padding: 8, background: chatTab === 'intern' ? '#eee' : '#fff' }} onClick={() => setChatTab('intern')}>Chat Intern</button>
                  <button style={{ flex: 1, padding: 8, background: chatTab === 'group' ? '#eee' : '#fff' }} onClick={() => setChatTab('group')}>Chat Nhóm</button>
                </div>
                {chatTab === 'intern' && (
                  <>
                    <input placeholder="Tìm intern..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 10 }} />
                    {assignments.filter(a => a.internName?.toLowerCase().includes(searchTerm.toLowerCase())).map(a => (
                      <div key={a.id} style={boxStyle} onClick={() => {
                        setSelectedAssignment(a);
                        socket.emit('join_room', a.id);
                        api.get(`/messages/${a.id}`).then(res => setMessages(res.data));
                      }}>
                        <img src={avatar_chat} alt="avatar" /> {a.internName}
                      </div>
                    ))}
                  </>
                )}
                {chatTab === 'group' && (
                  <>
                    <button onClick={() => setIsCreatingGroup(true)}>➕ Tạo nhóm</button>
                    {groups.map(g => (
                      <div key={g.id} style={boxStyle} onClick={() => {
                        console.log('Selected group:', g);
                        setSelectedGroup(g);
                        socket.emit('join_group', g.id);
                        api.get(`/messages/group/${g.id}`).then(res => setMessages(res.data));
                      }}>
                        {g.name}
                      
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* INPUT */}
          {(selectedAssignment || selectedGroup) && (
            <div style={{ padding: 10, borderTop: '1px solid #ddd' }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Nhập tin nhắn..." style={{ width: '80%' }} />
              <button onClick={sendMessage}>Gửi</button>
            </div>
          )}
        </div>
      ) : (
        <button onClick={() => setOpen(true)} style={{ width: 60, height: 60, borderRadius: '50%', background: '#1976d2', color: 'white', fontSize: 24 }}>💬</button>
      )}

      {/* MODAL QUẢN LÝ NHÓM */}
      {showGroupModal && selectedGroup && (
        <>
          <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }}
            onClick={() => setShowGroupModal(false)}
          />
          <div
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: 'white', padding: 20, borderRadius: 10, zIndex: 1001, width: 300
            }}
          >
            <h3>Quản lý nhóm</h3>
            <ul>
              {selectedGroup.members?.map((m: any) => (
                <li key={m.id}>
                  {m.name}
                  {m.id !== currentUserId && (
                    <button onClick={async () => {
                      await api.post(`/chat-groups/${selectedGroup.id}/remove-member`, { userId: m.id });
                      socket.emit('group_updated', selectedGroup.id);
                    }}>Xóa❌</button>
                  )}
                </li>
              ))}
            </ul>
            <button onClick={() => setShowAddMemberModal(true)}>Thêm thành viên</button>
            {showAddMemberModal && selectedGroup && (
              <>
                <div
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }}
                  onClick={() => setShowAddMemberModal(false)}
                />
                <div
                  style={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'white', padding: 20, borderRadius: 10, zIndex: 1001, width: 300, maxHeight: '80vh', overflowY: 'auto'
                  }}
                >
                  <h3>➕Thêm thành viên</h3>
                  {assignments.map(a => (
                    <div key={a.internId}>
                      <label>
                        <input
                          type="checkbox"
                          value={a.internId}
                          disabled={selectedGroup.members.some((m: any) => m.id === a.internId)}
                          onChange={e => {
                            const id = Number(e.target.value);
                            if (e.target.checked) setMembersToAdd(prev => [...prev, id]);
                            else setMembersToAdd(prev => prev.filter(i => i !== id));
                          }}
                        />
                        {a.internName}
                      </label>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <button onClick={() => setShowAddMemberModal(false)}>❌ Hủy</button>
                    <button
                      onClick={async () => {
                        if (!membersToAdd.length) return alert('Chọn ít nhất 1 intern');
                        console.log('Thêm intern:', membersToAdd);
                        await api.post(`/chat-groups/${selectedGroup.id}/add-members`, { memberIds: membersToAdd });

                        socket.emit('group_edited', selectedGroup.id);
                        setShowAddMemberModal(false);
                        setMembersToAdd([]);
                      }}
                    >Thêm</button>
                  </div>
                </div>
              </>
            )}

            <button onClick={async () => {
              if (!window.confirm('Bạn có chắc muốn giải tán nhóm?')) return;

              await api.delete(`/chat-groups/${selectedGroup.id}`);
              setSelectedGroup(null);
              setShowGroupModal(false);
              socket.emit('group_deleted', selectedGroup.id);
            }}>🗑Giải tán nhóm</button>
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <button onClick={() => setShowGroupModal(false)}>Đóng</button>
            </div>
          </div>
        </>
      )}


    
      

    </div>
    </>
   
    
  );
}
