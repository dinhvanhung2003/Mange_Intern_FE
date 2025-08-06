import { useEffect, useState, useRef } from 'react';
import api from '../../utils/axios';
import { useAssignmentStore } from '../../stores/useAssignmentStore';
import { socket } from '../../utils/socket';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../../hooks/useAuth';

export default function FloatingChatIntern() {
  
  const user =useAuth()
  const { assignment } = useAssignmentStore();
  const currentUserId = user?.id;


  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'mentor' | 'group'>('group');

  const [messages, setMessages] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // gửi emoji 
  const inputRef = useRef<HTMLInputElement>(null);
const [showEmojiPicker, setShowEmojiPicker] = useState(false);



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


const socketListenerAdded = useRef(false);


useEffect(() => {
  if (!open || socketListenerAdded.current) return;

  const handler = (msg: any) => {
    setMessages(prev => {
      if (prev.some(m => m.senderId === msg.senderId && m.sentAt === msg.sentAt)) return prev;
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

  const messageText = input;

  if (selectedAssignment) {
    socket.emit('send_message', {
      assignmentId: selectedAssignment.id,
      senderId: currentUserId,
      message: messageText,
    });
  } else if (selectedGroup) {
    socket.emit('send_group_message', {
      groupId: selectedGroup.id,
      senderId: currentUserId,
      message: messageText,
    });
  }

  // setMessages(prev => [...prev, {
  //   senderId: currentUserId,
  //   senderName: user?.name,
  //   message: messageText
  // }]);

  setInput('');
};

const fetchMessagesForGroup = async (groupId: number) => {
  setMessages([]); 
  const res = await api.get(`/messages/group/${groupId}`);
  const newMessages = res.data || [];

  setMessages(prev => {
    const merged: any[] = [];
    for (const msg of newMessages) {
      const isDuplicate = merged.some(m =>
        m.senderId === msg.senderId &&
        m.message === msg.message &&
        m.sentAt === msg.sentAt
      );
      if (!isDuplicate) merged.push(msg);
    }
    return merged;
  });
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
                    setMessages([]);
api.get(`/messages/${assignment.id}`).then(res => {
  const newMessages = res.data || [];
  setMessages(prev => {
    const merged = [...prev];
    for (const msg of newMessages) {
      const isDuplicate = merged.some(m =>
        m.senderId === msg.senderId &&
        m.message === msg.message &&
        m.sentAt === msg.sentAt
      );
      if (!isDuplicate) merged.push(msg);
    }
    return merged;
  });
});



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
                  fetchMessagesForGroup(g.id);

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
           <div style={{ position: 'relative', padding: 10, borderTop: '1px solid #ccc' }}>
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <input
      ref={inputRef}
      value={input}
      onChange={e => setInput(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && sendMessage()}
      placeholder="Nhập tin nhắn..."
      style={{ width: '70%' }}
    />
    <button onClick={() => setShowEmojiPicker(prev => !prev)} style={{ marginLeft: 5 }}>
      😀
    </button>
    <button onClick={sendMessage} style={{ marginLeft: 5 }} disabled={!input.trim()}>
      Gửi
    </button>
  </div>

  {showEmojiPicker && (
    <div style={{
      position: 'absolute',
      bottom: '40px',
      right: '0px',
      zIndex: 1001,
      background: '#fff',
      borderRadius: 10,
      boxShadow: '0 0 10px rgba(0,0,0,0.2)'
    }}>
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
        <button onClick={() => setOpen(true)} style={{
          width: 60, height: 60, borderRadius: '50%',
          background: '#1976d2', color: '#fff', fontSize: 24
        }}>💬</button>
      )}
    </div>
  );
}
