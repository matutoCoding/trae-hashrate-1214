import { useMemo } from 'react';
import { useQueueStore } from '@/store/queueStore';
import { sortTicketsByPriority } from '@/utils/queueUtils';
import { getEstimatedWaitTime } from '@/utils/queueUtils';
import type { QueueType } from '@/types';

export const usePriorityQueue = () => {
  const {
    tickets,
    currentCalling,
    logs,
    getSortedQueue,
    createTicket,
    callNext,
    callSpecific,
    completeTicket,
    cancelTicket,
    jumpQueue,
    changePriority,
    getQueueStats,
  } = useQueueStore();

  const sortedQueue = useMemo(() => getSortedQueue(), [getSortedQueue]);
  const waitingQueue = useMemo(
    () => sortedQueue.filter((t) => t.status === 'waiting'),
    [sortedQueue]
  );
  const stats = useMemo(() => getQueueStats(), [getQueueStats]);

  const urgentQueue = useMemo(
    () => waitingQueue.filter((t) => t.queueType === 'URGENT'),
    [waitingQueue]
  );
  const vipQueue = useMemo(
    () => waitingQueue.filter((t) => t.queueType === 'VIP'),
    [waitingQueue]
  );
  const normalQueue = useMemo(
    () => waitingQueue.filter((t) => t.queueType === 'NORMAL'),
    [waitingQueue]
  );

  const getTicketPosition = (ticketId: string): { position: number; waitTime: number } => {
    const index = waitingQueue.findIndex((t) => t.ticketId === ticketId);
    if (index === -1) return { position: 0, waitTime: 0 };
    return {
      position: index + 1,
      waitTime: getEstimatedWaitTime(waitingQueue, index),
    };
  };

  const takeTicket = (
    rider: { name: string; phone: string; riderId?: string },
    queueType: QueueType,
    packageName: string
  ) => {
    return createTicket(rider, queueType, packageName);
  };

  const processNextCall = (windowNo = 1) => {
    return callNext(windowNo);
  };

  const processCallById = (ticketId: string, windowNo = 1) => {
    return callSpecific(ticketId, windowNo);
  };

  const processComplete = (ticketId: string) => {
    completeTicket(ticketId);
  };

  const processCancel = (ticketId: string) => {
    cancelTicket(ticketId);
  };

  const processJumpQueue = (ticketId: string, operator?: string) => {
    return jumpQueue(ticketId, operator);
  };

  const processChangePriority = (
    ticketId: string,
    newType: QueueType,
    operator?: string
  ) => {
    changePriority(ticketId, newType, operator);
  };

  const recentLogs = useMemo(() => logs.slice(0, 20), [logs]);

  return {
    tickets,
    sortedQueue,
    waitingQueue,
    urgentQueue,
    vipQueue,
    normalQueue,
    currentCalling,
    stats,
    recentLogs,
    getTicketPosition,
    takeTicket,
    processNextCall,
    processCallById,
    processComplete,
    processCancel,
    processJumpQueue,
    processChangePriority,
  };
};
