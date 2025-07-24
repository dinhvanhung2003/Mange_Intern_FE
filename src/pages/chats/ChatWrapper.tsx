import FloatingChatMentor from './ChatMentor';
import FloatingChatIntern from './ChatIntern';

function getUserFromToken() {
  const token = sessionStorage.getItem('accessToken');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function FloatingChatWrapper() {
  const user = getUserFromToken();

  if (!user) return null;

  return user.type === 'mentor' ? <FloatingChatMentor /> : <FloatingChatIntern />;
}
