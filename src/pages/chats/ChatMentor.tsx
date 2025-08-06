import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import authApi from '../../utils/axios';
import avatar_chat from '../../assets/avatar_chat.png';
import CreateGroupModal from '../../components/CreateGroupChat';
import EmojiPicker from 'emoji-picker-react';
import { socket } from '../../utils/socket';
import { useAuth } from '../../hooks/useAuth';

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


const boxStyle = {
  padding: 8,
  border: '1px solid #ccc',
  borderRadius: 6,
  marginBottom: 5,
  background: '#eef',
  cursor: 'pointer',
};

export default function FloatingChatMentor() {
  const user = useAuth();
  const currentUserId = user?.id;
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



  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
const [showSuggestions, setShowSuggestions] = useState(false);
const [loadingMessages, setLoadingMessages] = useState(false);



  // them thanh vien 
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [membersToAdd, setMembersToAdd] = useState<number[]>([]);

const inputRef = useRef<HTMLInputElement>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

useEffect(() => {
  if (!user) return;

  authApi.get('/chat-groups/created-by-me').then(res => {
    console.log('Groups created by me:', res.data);

    const groupsWithNames = res.data.map((g: any) => ({
      ...g,
      memberNames: g.members?.map((m: any) => m.name).join(', ') || '',
    }));

    setGroups(groupsWithNames);
  });
}, [user?.sub]);




  useEffect(() => {
    if (!user) return;
    authApi.get('/mentor/assignments').then(res => setAssignments(res.data || []));
  }, []);

const socketListenerAdded = useRef(false);

useEffect(() => {
  if (!open || socketListenerAdded.current) return;

  const handler = (msg: any) => {
    setMessages(prev => {
      if (prev.some(m => m.senderId === msg.senderId )) return prev;
      return [...prev, msg];
    });
  };

  socket.on('receive_message', handler);
  socket.on('receive_group_message', handler);
  socketListenerAdded.current = true;

  return () => {
    socket.off('receive_message', handler);
    socket.off('receive_group_message', handler);
    socketListenerAdded.current = false;
  };
}, [open]);








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
   
    return () => {
      socket.off('group_edited');
      socket.off('group_deleted');
    };
  }, [selectedGroup]);

const sendMessage = () => {
  if (!input.trim() || !currentUserId) return;

  const messageText = input;
  let mentionedUserIds: number[] = [];

  if (selectedGroup) {

    const tags = messageText.match(/@(\w+)/g);
    if (tags && selectedGroup.members) {
      const tagNames = tags.map(tag => tag.slice(1).toLowerCase());
      mentionedUserIds = selectedGroup.members
        .filter((m: any) => m.name && tagNames.includes(m.name.toLowerCase()))
        .map((m: any) => m.id);
    }

    // Gửi socket
    socket.emit('send_group_message', {
      groupId: selectedGroup.id,
      senderId: currentUserId,
      message: messageText,
      mentionedUserIds,
    });

  
    setMessages(prev => [
      ...prev,
      {
        senderId: currentUserId,
        senderName: user?.name,
        message: messageText,
      
      }
    ]);

  } else if (selectedAssignment) {
    socket.emit('send_message', {
      assignmentId: selectedAssignment.id,
      senderId: currentUserId,
      message: messageText,
    });

  
    setMessages(prev => [
      ...prev,
      {
        senderId: currentUserId,
        senderName: user?.name,
        message: messageText,
      }
    ]);
  }

  setInput('');
};






// test 
const fetchMessagesForAssignment = async (assignmentId: number) => {
  setLoadingMessages(true);
  setMessages([]);
 const res = await authApi.get(`/messages/${assignmentId}`);
const newMessages = res.data || [];

setMessages(prev => {
  const merged = [...prev];
  for (const msg of newMessages) {
    const isDuplicate = merged.some(m =>
      m.senderId === msg.senderId &&
      m.message === msg.message 
      // m.sentAt === msg.sentAt
    );
    if (!isDuplicate) merged.push(msg);
  }
  return merged;
});

  setLoadingMessages(false);
};

const fetchMessagesForGroup = async (groupId: number) => {
  setLoadingMessages(true);
  setMessages([]);
  const res = await authApi.get(`/messages/group/${groupId}`);
const newMessages = res.data || [];

setMessages(prev => {
  const merged = [...prev];
  for (const msg of newMessages) {
    const isDuplicate = merged.some(m =>
      m.senderId === msg.senderId &&
      m.message === msg.message 
      // m.sentAt === msg.sentAt
    );
    if (!isDuplicate) {
      merged.push(msg);
    }
  }
  return merged;
});

  setLoadingMessages(false);
};













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
    authApi.get(`/messages/group/${newGroup.id}`).then(res => setMessages(res.data));
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
                <button
                
                
                
                onClick={() =>
                   { setSelectedAssignment(null); setSelectedGroup(null); }} 
                   
                   
                   
                   
                   
                   
                   
                   style={{ background: 'none', border: 'none', color: 'white', fontSize: 18 }}>⬅️</button>
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
                      <div key={a.id} style={boxStyle}
                       onClick={() => {
  setSelectedAssignment(a);
  socket.emit('join_room', a.id);
  fetchMessagesForAssignment(a.id);
}}
                      >
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
                     fetchMessagesForGroup(g.id);
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
<div style={{ position: 'relative', padding: 10, borderTop: '1px solid #ddd' }}>
  <div style={{ display: 'flex', alignItems: 'center' }}>
  <input
  ref={inputRef}
  value={input}
onChange={e => {
  const value = e.target.value;
  setInput(value);

  const lastWord = value.split(' ').pop();
  if (lastWord?.startsWith('@') && selectedGroup) {
    const keyword = lastWord.slice(1).toLowerCase();
    const matches = selectedGroup.members?.filter((m: any) =>
      m.name.toLowerCase().includes(keyword)
    );
    setMentionSuggestions(matches);
    setShowSuggestions(true);
  } else {
    setShowSuggestions(false);
  }
}}

  onKeyDown={e => e.key === 'Enter' && sendMessage()}
  placeholder="Nhập tin nhắn..."
  style={{ width: '70%' }}
/>
{showSuggestions && mentionSuggestions.length > 0 && (
  <div style={{
    position: 'absolute',
    bottom: '45px',
    left: 10,
    right: 10,
    maxHeight: 100,
    overflowY: 'auto',
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: 6,
    zIndex: 10001,
  }}>
    {mentionSuggestions.map((user, idx) => (
      <div key={idx} style={{ padding: 8, cursor: 'pointer' }}
        onClick={() => {
          const parts = input.split(' ');
          parts[parts.length - 1] = `@${user.name}`;
          setInput(parts.join(' ') + ' ');
          setShowSuggestions(false);
          inputRef.current?.focus();
        }}>
        {user.name}
      </div>
    ))}
  </div>
)}

    <button onClick={() => setShowEmojiPicker(p => !p)} style={{ marginLeft: 5 }}>😀</button>
    <button onClick={sendMessage} style={{ marginLeft: 5 }}>Gửi</button>
  </div>

 {showEmojiPicker && (
  <div
    style={{
      position: 'absolute',
      bottom: '40px',
      right: '0px',
      zIndex: 10001,
      background: '#fff',
      borderRadius: 10,
      boxShadow: '0px 0px 10px rgba(0,0,0,0.2)'
    }}
  >
    <EmojiPicker
      onEmojiClick={(emojiData) => {
        setInput(prev => prev + emojiData.emoji);
        inputRef.current?.focus();
      }}
    />
  </div>
)}

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
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 1000
      }}
      onClick={() => setShowGroupModal(false)}
    />
    <div
      style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        padding: 24,
        borderRadius: 12,
        zIndex: 1001,
        width: 360,
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
      }}
    >
      <h2 style={{ marginBottom: 12, textAlign: 'center', color: '#333' }}>👥 Quản lý nhóm</h2>

      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {selectedGroup.members?.map((m: any) => (
          <li key={m.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            padding: '6px 10px',
            background: '#f9f9f9',
            borderRadius: 6
          }}>
            <span>{m.name}</span>
            {m.id !== currentUserId && (
              <button
                onClick={async () => {
                  await authApi.post(`/chat-groups/${selectedGroup.id}/remove-member`, { userId: m.id });
                  socket.emit('group_updated', selectedGroup.id);
                }}
                style={{
                  border: 'none',
                  background: '#ff4d4f',
                  color: '#fff',
                  borderRadius: 6,
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                ❌
              </button>
            )}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => setShowAddMemberModal(true)}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 8,
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ➕ Thêm thành viên
        </button>
      </div>

      {showAddMemberModal && selectedGroup && (
        <>
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.4)', zIndex: 1000
            }}
            onClick={() => setShowAddMemberModal(false)}
          />
          <div
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white', padding: 20, borderRadius: 12,
              zIndex: 1001, width: 340, maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
          >
            <h3 style={{ marginBottom: 12 }}>📋 Chọn thêm thành viên</h3>
            {assignments.map(a => (
              <div key={a.internId} style={{ marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    value={a.internId}
                    disabled={selectedGroup.members.some((m: any) => m.id === a.internId)}
                    onChange={e => {
                      const id = Number(e.target.value);
                      setMembersToAdd(prev =>
                        e.target.checked
                          ? [...prev, id]
                          : prev.filter(i => i !== id)
                      );
                    }}
                  />
                  {a.internName}
                </label>
              </div>
            ))}
            <div style={{
              marginTop: 12,
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <button
                onClick={() => setShowAddMemberModal(false)}
                style={{
                  padding: '8px 12px',
                  background: '#ccc',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ❌ Hủy
              </button>
              <button
                onClick={async () => {
                  if (!membersToAdd.length) return alert('Chọn ít nhất 1 intern');
                  await authApi.post(`/chat-groups/${selectedGroup.id}/add-members`, { memberIds: membersToAdd });
                  socket.emit('group_edited', selectedGroup.id);
                  setShowAddMemberModal(false);
                  setMembersToAdd([]);
                }}
                style={{
                  padding: '8px 12px',
                  background: '#28a745',
                  color: '#fff',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ✅ Thêm
              </button>
            </div>
          </div>
        </>
      )}

      <button
        onClick={async () => {
          if (!window.confirm('Bạn có chắc muốn giải tán nhóm?')) return;
          await authApi.delete(`/chat-groups/${selectedGroup.id}`);
          setSelectedGroup(null);
          setShowGroupModal(false);
          socket.emit('group_deleted', selectedGroup.id);
        }}
        style={{
          marginTop: 20,
          width: '100%',
          background: '#ff4d4f',
          color: 'white',
          padding: 10,
          borderRadius: 8,
          border: 'none',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        🗑 Giải tán nhóm
      </button>

      <div style={{ marginTop: 12, textAlign: 'right' }}>
        <button
          onClick={() => setShowGroupModal(false)}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #ccc',
            background: '#f5f5f5',
            cursor: 'pointer'
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  </>
)}



    
      

    </div>
    </>
   
    
  );
}