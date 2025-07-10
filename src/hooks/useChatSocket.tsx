import { useEffect, useRef } from 'react';
import { socket } from '../utils/socket';

export function useChatSocket(currentUserId: number | null, onMessage: (msg: any) => void) {
  const handlerRef = useRef<(msg: any) => void>(onMessage);


  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!currentUserId) return;

socket.off('receive_message');
socket.off('receive_group_message');

const handleMessage = (msg: any) => {
  if (handlerRef.current) handlerRef.current(msg);
};

socket.on('receive_message', handleMessage);
socket.on('receive_group_message', handleMessage);

  }, [currentUserId]);
  
}
