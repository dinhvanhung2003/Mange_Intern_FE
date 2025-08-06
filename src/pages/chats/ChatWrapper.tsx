import FloatingChatMentor from './ChatMentor';
import FloatingChatIntern from './ChatIntern';
import { useAuth } from '../../hooks/useAuth';

export default function FloatingChatWrapper() {
  const user = useAuth();

  if (!user) return null;

  return user.type === 'mentor' ? <FloatingChatMentor /> : <FloatingChatIntern />;
}
