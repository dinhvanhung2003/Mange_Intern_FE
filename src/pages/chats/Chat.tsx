// src/components/FloatingChat.tsx
import { useEffect, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { socket } from '../../utils/socket';
import authApi from '../../utils/axios';
import { useAuth } from '../../hooks/useAuth';
import CreateGroupModal from '../../components/CreateGroupChat';
import avatar_chat from '../../assets/avatar_chat.png';
import { useAssignmentStore } from '../../stores/useAssignmentStore';

type Role = 'mentor' | 'intern';
type Tab = 'intern' | 'mentor' | 'group';

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

interface GroupMember {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
  members: GroupMember[];
  memberNames?: string;
}

const boxStyle: React.CSSProperties = {
  padding: 8,
  border: '1px solid #ccc',
  borderRadius: 6,
  marginBottom: 5,
  background: '#eef',
  cursor: 'pointer',
};

export default function Chat() {
  const user = useAuth();
  const role: Role = (user?.type as Role) || 'intern';
  const currentUserId = user?.id;

  // tab mặc định: mentor → 'intern', intern → 'group'
  const defaultTabFor = (r: Role): Tab => (r === 'mentor' ? 'intern' : 'group');

  // UI state
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>(defaultTabFor(role));
  const [searchTerm, setSearchTerm] = useState('');

  // Data state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Input state
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mention suggestions
  const [mentionSuggestions, setMentionSuggestions] = useState<GroupMember[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mentor group modals
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [membersToAdd, setMembersToAdd] = useState<number[]>([]);

  // intern store (an toàn nếu store không mount)
  const { assignment: internAssignment } = useAssignmentStore?.() || { assignment: null };

  // ======= bootstrap theo role =======
  useEffect(() => {
    if (!user) return;

    if (role === 'mentor') {
      // nhóm do mentor tạo
      authApi.get('/chat-groups/created-by-me').then(res => {
        const groupsWithNames: Group[] = (res.data || []).map((g: Group) => ({
          ...g,
          memberNames: g.members?.map((m) => m.name).join(', ') || '',
        }));
        setGroups(groupsWithNames);
      });
      // danh sách assignments
      authApi.get('/mentor/assignments').then(res => setAssignments(res.data || []));
    } else {
      // intern: join user room để nhận mention
      if (currentUserId) socket.emit('join_user_room', currentUserId);

      // nhóm của intern
      authApi.get('/chat-groups/my').then(res => {
        const myGroups: Group[] = res.data || [];
        setGroups(myGroups);
        myGroups.forEach(g => socket.emit('join_group', g.id));
      });
    }
  }, [user?.id, role, currentUserId]);

  // ======= socket listeners (khi mở chat) =======
  const socketListenerAdded = useRef(false);
  useEffect(() => {
    if (!open || socketListenerAdded.current) return;

    // nhận tin nhắn (1-1 và nhóm)
   const handler = (msg: Message) => {
  const key = `${msg.senderId}|${msg.message}`;
  setMessages(prev => {
    const exists = prev.some(m => `${m.senderId}|${m.message}` === key);
    return exists ? prev : [...prev, msg];
  });
};
socket.on('receive_message', handler);
socket.on('receive_group_message', handler);





  

    // intern: popup khi bị @mention
    const handleMention = (data: any) => {
      if (role === 'intern') {
        // bạn có thể thay alert = toast
        alert(`📣 ${data.from.name} đã tag bạn trong nhóm!\n\n${data.message}`);
      }
    };
    socket.on('mentioned_notification', handleMention);

    // cập nhật nhóm (cả 2 role)
    const onGroupEdited = (updated: Group) => {
      setGroups(prev =>
        prev.map(g =>
          g.id === updated.id
            ? { ...updated, memberNames: updated.members?.map(m => m.name).join(', ') }
            : g
        )
      );
      if (selectedGroup?.id === updated.id) setSelectedGroup(updated);
    };
    socket.on('group_edited', onGroupEdited);

    const onGroupDeleted = (gid: number) => {
      setGroups(prev => prev.filter(g => g.id !== gid));
      if (selectedGroup?.id === gid) {
        setSelectedGroup(null);
        setMessages([]);
      }
    };
    socket.on('group_deleted', onGroupDeleted);

    // intern được add vào group mới
    const onNewGroup = (group: Group) => {
      setGroups(prev => (prev.some(g => g.id === group.id) ? prev : [...prev, group]));
      socket.emit('join_group', group.id);
    };
    socket.on('new_group_created', onNewGroup);

    socketListenerAdded.current = true;
    return () => {
      socket.off('receive_message', handler);
      socket.off('receive_group_message', handler);
      socket.off('mentioned_notification', handleMention);
      socket.off('group_edited', onGroupEdited);
      socket.off('group_deleted', onGroupDeleted);
      socket.off('new_group_created', onNewGroup);
      socketListenerAdded.current = false;
    };
  }, [open, role, selectedGroup?.id]);

  // autoscroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ======= fetch messages =======
  const fetchMessagesForAssignment = async (assignmentId: number) => {
    setLoadingMessages(true);
    setMessages([]);
    const res = await authApi.get(`/messages/${assignmentId}`);
   const newMessages: Message[] = res.data || [];
const dedup: Message[] = [];
const seen = new Set<string>();
for (const msg of newMessages) {
  const key = `${msg.senderId}|${msg.message}|${msg.sentAt ?? ''}`;
  if (!seen.has(key)) {
    seen.add(key);
    dedup.push(msg);
  }
}
setMessages(dedup);

    setLoadingMessages(false);
  };

  const fetchMessagesForGroup = async (groupId: number) => {
    setLoadingMessages(true);
    setMessages([]);
    const res = await authApi.get(`/messages/group/${groupId}`);
   const newMessages: Message[] = res.data || [];
const dedup: Message[] = [];
const seen = new Set<string>();
for (const msg of newMessages) {
  const key = `${msg.senderId}|${msg.message}`;
  if (!seen.has(key)) {
    seen.add(key);
    dedup.push(msg);
  }
}
setMessages(dedup);

    setLoadingMessages(false);
  };

  // ======= send =======
  const sendMessage = () => {
  if (!input.trim() || !currentUserId) return;
  if (!selectedGroup && !selectedAssignment) return; // chưa chọn hội thoại nào

  const messageText = input.trim();

  if (selectedGroup) {
    // Parse @mentions trong nhóm
    let mentionedUserIds: number[] = [];
    const tags = messageText.match(/@(\w+)/g);
    if (tags && selectedGroup.members) {
      const tagNames = tags.map(t => t.slice(1).toLowerCase());
      mentionedUserIds = selectedGroup.members
        .filter(m => m.name && tagNames.includes(m.name.toLowerCase()))
        .map(m => m.id);
    }

    socket.emit('send_group_message', {
      groupId: selectedGroup.id,
      senderId: currentUserId,
      message: messageText,
      mentionedUserIds,
    });
  } else if (selectedAssignment) {
    socket.emit('send_message', {
      assignmentId: selectedAssignment.id,
      senderId: currentUserId,
      message: messageText,
    });
  }

  // Chỉ clear input, KHÔNG setMessages ở đây để tránh nhân đôi (server sẽ echo lại)
  setInput('');
  setShowSuggestions(false);
  setShowEmojiPicker(false);
};

  // ======= helpers UI =======
  const showListScreen = !selectedAssignment && !selectedGroup;

  const closeAll = () => {
    setOpen(false);
    setSelectedGroup(null);
    setSelectedAssignment(null);
    setMessages([]);
    setInput('');
    setShowEmojiPicker(false);
    setShowSuggestions(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999 }}>
      {open ? (
        <div
          style={{
            width: 320,
            height: 460,
            background: '#fff',
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #ccc',
          }}
        >
          {/* HEADER */}
          <div
            style={{
              background: '#1976d2',
              color: 'white',
              padding: 10,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {!showListScreen && (
                <button
                  onClick={() => {
                    setSelectedAssignment(null);
                    setSelectedGroup(null);
                    setMessages([]);
                  }}
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: 18 }}
                >
                  ⬅️
                </button>
              )}
              <span style={{ marginLeft: 8 }}>
                {selectedAssignment
                  ? role === 'mentor'
                    ? selectedAssignment.internName
                    : 'Chat với Mentor'
                  : selectedGroup?.name || 'Chat'}
              </span>

              {/* nút setting nhóm (mentor) */}
              {role === 'mentor' && selectedGroup && (
                <button
                  onClick={() => setShowGroupModal(true)}
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: 16, marginLeft: 8 }}
                >
                  ⚙️
                </button>
              )}
            </div>
            <button
              onClick={closeAll}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: 18 }}
            >
              ×
            </button>
          </div>

          {/* BODY */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            {showListScreen ? (
              <>
                {/* Tabs */}
                <div style={{ display: 'flex' }}>
                  {role === 'mentor' ? (
                    <>
                      <button
                        style={{ flex: 1, padding: 8, background: tab === 'intern' ? '#eee' : '#fff' }}
                        onClick={() => setTab('intern')}
                      >
                        Chat Intern
                      </button>
                      <button
                        style={{ flex: 1, padding: 8, background: tab === 'group' ? '#eee' : '#fff' }}
                        onClick={() => setTab('group')}
                      >
                        Chat Nhóm
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        style={{ flex: 1, padding: 8, background: tab === 'mentor' ? '#eee' : '#fff' }}
                        onClick={() => setTab('mentor')}
                      >
                        Mentor
                      </button>
                      <button
                        style={{ flex: 1, padding: 8, background: tab === 'group' ? '#eee' : '#fff' }}
                        onClick={() => setTab('group')}
                      >
                        Nhóm
                      </button>
                    </>
                  )}
                </div>

                {/* Lists */}
                {role === 'mentor' && tab === 'intern' && (
                  <>
                    <input
                      placeholder="Tìm intern..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{ width: '100%', padding: 6, marginTop: 10 }}
                    />
                    {assignments
                      .filter(a => a.internName?.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(a => (
                        <div
                          key={a.id}
                          style={boxStyle}
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

                {tab === 'group' && (
                  <>
                    {role === 'mentor' && (
                      <button onClick={() => setIsCreatingGroup(true)} style={{ marginBottom: 8 }}>
                        ➕ Tạo nhóm
                      </button>
                    )}
                    {groups.map(g => (
                      <div
                        key={g.id}
                        style={boxStyle}
                        onClick={() => {
                          setSelectedGroup(g);
                          socket.emit('join_group', g.id);
                          fetchMessagesForGroup(g.id);
                        }}
                      >
                        {g.name}
                      </div>
                    ))}
                  </>
                )}

                {role === 'intern' && tab === 'mentor' && internAssignment && (
                  <div
                    onClick={() => {
                      setSelectedAssignment(internAssignment as any);
                      socket.emit('join_room', (internAssignment as any).id);
                      fetchMessagesForAssignment((internAssignment as any).id);
                    }}
                    style={boxStyle}
                  >
                    💬 Chat với Mentor
                  </div>
                )}
              </>
            ) : (
              <>
                {loadingMessages && <div>Đang tải tin nhắn…</div>}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{ textAlign: msg.senderId === currentUserId ? 'right' : 'left', margin: '4px 0' }}
                  >
                    {msg.senderId !== currentUserId && msg.senderName && (
                      <div style={{ fontSize: 12 }}>{msg.senderName}</div>
                    )}
                    <div
                      style={{
                        display: 'inline-block',
                        background: msg.senderId === currentUserId ? '#dcf8c6' : '#f1f0f0',
                        padding: '6px 10px',
                        borderRadius: 12,
                      }}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* INPUT */}
          {!showListScreen && (
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
                      const matches =
                        selectedGroup.members?.filter((m) => m.name.toLowerCase().includes(keyword)) || [];
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

                {/* Mention dropdown */}
                {showSuggestions && mentionSuggestions.length > 0 && (
                  <div
                    style={{
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
                    }}
                  >
                    {mentionSuggestions.map((u, idx) => (
                      <div
                        key={idx}
                        style={{ padding: 8, cursor: 'pointer' }}
                        onClick={() => {
                          const parts = input.split(' ');
                          parts[parts.length - 1] = `@${u.name}`;
                          setInput(parts.join(' ') + ' ');
                          setShowSuggestions(false);
                          inputRef.current?.focus();
                        }}
                      >
                        {u.name}
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => setShowEmojiPicker(p => !p)} style={{ marginLeft: 5 }}>
                  😀
                </button>
                <button onClick={sendMessage} style={{ marginLeft: 5 }} disabled={!input.trim()}>
                  Gửi
                </button>
              </div>

              {showEmojiPicker && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '40px',
                    right: 0,
                    zIndex: 10001,
                    background: '#fff',
                    borderRadius: 10,
                    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
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
        <button
          onClick={() => setOpen(true)}
          style={{ width: 60, height: 60, borderRadius: '50%', background: '#1976d2', color: '#fff', fontSize: 24 }}
        >
          💬
        </button>
      )}

      {/* ====== MENTOR MODALS ====== */}
      {role === 'mentor' && (
        <>
          <CreateGroupModal
            isOpen={isCreatingGroup}
            key={isCreatingGroup ? 'modal-open' : 'modal-closed'}
            onClose={() => setIsCreatingGroup(false)}
            assignments={assignments}
            currentUserId={currentUserId}
            onGroupCreated={(newGroup: Group) => {
              setGroups(prev => [...prev, newGroup]);
              setSelectedGroup(newGroup);
              socket.emit('join_group', newGroup.id);
              authApi.get(`/messages/group/${newGroup.id}`).then(res => setMessages(res.data || []));
            }}
          />

          {showGroupModal && selectedGroup && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.4)',
                  zIndex: 1000,
                }}
                onClick={() => setShowGroupModal(false)}
              />
              <div
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'white',
                  padding: 24,
                  borderRadius: 12,
                  zIndex: 1001,
                  width: 360,
                  maxHeight: '80vh',
                  overflowY: 'auto',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                }}
              >
                <h2 style={{ marginBottom: 12, textAlign: 'center', color: '#333' }}>👥 Quản lý nhóm</h2>

                <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                  {selectedGroup.members?.map((m) => (
                    <li
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                        padding: '6px 10px',
                        background: '#f9f9f9',
                        borderRadius: 6,
                      }}
                    >
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
                            cursor: 'pointer',
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
                      cursor: 'pointer',
                    }}
                  >
                    ➕ Thêm thành viên
                  </button>
                </div>

                {showAddMemberModal && (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.4)',
                        zIndex: 1000,
                      }}
                      onClick={() => setShowAddMemberModal(false)}
                    />
                    <div
                      style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'white',
                        padding: 20,
                        borderRadius: 12,
                        zIndex: 1001,
                        width: 340,
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      }}
                    >
                      <h3 style={{ marginBottom: 12 }}>📋 Chọn thêm thành viên</h3>
                      {assignments.map(a => (
                        <div key={a.internId} style={{ marginBottom: 8 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="checkbox"
                              value={a.internId}
                              disabled={selectedGroup.members.some(m => m.id === a.internId)}
                              onChange={e => {
                                const id = Number(e.target.value);
                                setMembersToAdd(prev => (e.target.checked ? [...prev, id] : prev.filter(i => i !== id)));
                              }}
                            />
                            {a.internName}
                          </label>
                        </div>
                      ))}
                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                        <button
                          onClick={() => setShowAddMemberModal(false)}
                          style={{ padding: '8px 12px', background: '#ccc', borderRadius: 6, border: 'none' }}
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
                    cursor: 'pointer',
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
                      cursor: 'pointer',
                    }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
