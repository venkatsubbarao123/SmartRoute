import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

const useSocketEvent = (event, handler, deps = []) => {
  const socketCtx = useSocket();

  useEffect(() => {
    if (!socketCtx?.on || !event || !handler) return;
    socketCtx.on(event, handler);
    return () => socketCtx.off && socketCtx.off(event, handler);
  }, [socketCtx, event, ...deps]);
};

export const useSocketEmit = () => {
  const socketCtx = useSocket();
  return useCallback(
    (event, data) => socketCtx?.emit(event, data),
    [socketCtx]
  );
};

export default useSocketEvent;
