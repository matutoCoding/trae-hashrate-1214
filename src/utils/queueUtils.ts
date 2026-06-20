import type { QueueTicket, QueueType } from '@/types';

export const getPriorityByQueueType = (type: QueueType): number => {
  const priorities: Record<QueueType, number> = {
    URGENT: 1,
    VIP: 3,
    NORMAL: 5,
  };
  return priorities[type];
};

export const getQueueTypeLabel = (type: QueueType): string => {
  const labels: Record<QueueType, string> = {
    URGENT: '加急',
    VIP: 'VIP',
    NORMAL: '普通',
  };
  return labels[type];
};

export const getQueueTypeColor = (type: QueueType): string => {
  const colors: Record<QueueType, string> = {
    URGENT: '#DC2626',
    VIP: '#F97316',
    NORMAL: '#0E7490',
  };
  return colors[type];
};

export const getQueueTypeBgColor = (type: QueueType): string => {
  const colors: Record<QueueType, string> = {
    URGENT: 'bg-red-50 border-red-200',
    VIP: 'bg-orange-50 border-orange-200',
    NORMAL: 'bg-cyan-50 border-cyan-200',
  };
  return colors[type];
};

export const sortTicketsByPriority = (tickets: QueueTicket[]): QueueTicket[] => {
  return [...tickets].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
};

export const insertTicketWithPriority = (
  queue: QueueTicket[],
  newTicket: QueueTicket
): QueueTicket[] => {
  const result = sortTicketsByPriority([...queue, newTicket]);
  return result;
};

export const jumpTicketToFront = (
  queue: QueueTicket[],
  ticketId: string,
  targetPriority: QueueType = 'URGENT'
): QueueTicket[] => {
  const updated = queue.map((t) =>
    t.ticketId === ticketId
      ? {
          ...t,
          queueType: targetPriority,
          priority: getPriorityByQueueType(targetPriority),
        }
      : t
  );
  return sortTicketsByPriority(updated);
};

export const getEstimatedWaitTime = (
  queue: QueueTicket[],
  ticketIndex: number,
  avgProcessTime = 5
): number => {
  return ticketIndex * avgProcessTime;
};

export const getTicketStatusLabel = (status: QueueTicket['status']): string => {
  const labels: Record<QueueTicket['status'], string> = {
    waiting: '等待中',
    calling: '叫号中',
    processing: '办理中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return labels[status];
};

export const getTicketStatusColor = (status: QueueTicket['status']): string => {
  const colors: Record<QueueTicket['status'], string> = {
    waiting: '#0E7490',
    calling: '#F97316',
    processing: '#2563EB',
    completed: '#16A34A',
    cancelled: '#6B7280',
  };
  return colors[status];
};
