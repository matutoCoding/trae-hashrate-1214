import { create } from 'zustand';
import dayjs from 'dayjs';
import type { QueueTicket, QueueLog, QueueType, Rider } from '@/types';
import { mockQueueTickets, mockQueueLogs, mockRiders } from '@/mock';
import {
  sortTicketsByPriority,
  insertTicketWithPriority,
  jumpTicketToFront,
  getPriorityByQueueType,
} from '@/utils/queueUtils';
import { generateTicketId } from '@/utils/dateUtils';

interface QueueStore {
  tickets: QueueTicket[];
  riders: Rider[];
  logs: QueueLog[];
  currentCalling: QueueTicket | null;
  counter: number;

  getWaitingQueue: () => QueueTicket[];
  getSortedQueue: () => QueueTicket[];
  createTicket: (
    rider: Partial<Rider> & { name: string; phone: string },
    queueType: QueueType,
    packageName: string
  ) => QueueTicket;
  callNext: (windowNo?: number) => QueueTicket | null;
  callSpecific: (ticketId: string, windowNo?: number) => boolean;
  completeTicket: (ticketId: string) => void;
  cancelTicket: (ticketId: string) => void;
  jumpQueue: (ticketId: string, operator?: string) => boolean;
  changePriority: (ticketId: string, newType: QueueType, operator?: string) => void;
  addLog: (log: Partial<QueueLog>) => void;
  getQueueStats: () => {
    totalWaiting: number;
    urgentCount: number;
    vipCount: number;
    normalCount: number;
    avgWaitTime: number;
  };
}

export const useQueueStore = create<QueueStore>((set, get) => ({
  tickets: sortTicketsByPriority(mockQueueTickets),
  riders: mockRiders,
  logs: mockQueueLogs,
  currentCalling:
    mockQueueTickets.find((t) => t.status === 'calling') || null,
  counter: 100,

  getWaitingQueue: () => {
    return get().tickets.filter(
      (t) => t.status === 'waiting' || t.status === 'calling'
    );
  },

  getSortedQueue: () => {
    return sortTicketsByPriority(get().getWaitingQueue());
  },
  createTicket: (rider, queueType, packageName) => {
    const { counter, addLog } = get();
    const newCounter = counter + 1;

    let urgentQuotaUsed = false;
    let urgentFeeCharged = false;
    let urgentRemark = '';
    let urgentFeeAmount = 0;

    if (queueType === 'URGENT' && rider.riderId) {
      try {
        const userStore = require('@/store/userStore').useUserStore;
        const riderData = userStore.getState().getRiderById(rider.riderId);
        if (riderData) {
          const pkg = userStore.getState().getPackageById(riderData.packageId);
          urgentFeeAmount = pkg?.urgentFee || 15;

          if (riderData.urgentCount > 0) {
            const result = userStore.getState().consumeUrgentQuota(rider.riderId);
            if (result.usedQuota) {
              urgentQuotaUsed = true;
              urgentFeeAmount = 0;
              urgentRemark = '（已扣加急配额1次）';
            } else {
              urgentFeeCharged = true;
              urgentRemark = `（加急配额不足，收取加急费 ¥${urgentFeeAmount}）`;
            }
          } else {
            urgentFeeCharged = true;
            urgentRemark = `（无加急配额，收取加急费 ¥${urgentFeeAmount}）`;
          }
        } else {
          urgentFeeCharged = true;
          urgentRemark = `（新用户无加急配额，收取加急费 ¥${urgentFeeAmount}）`;
        }
      } catch (e) {
        urgentFeeCharged = true;
        urgentFeeAmount = 15;
        urgentRemark = '（加急配额扣减异常，按收费处理）';
      }
    }

    const newTicket: QueueTicket = {
      ticketId: generateTicketId(),
      riderId: rider.riderId || `R${String(newCounter).padStart(3, '0')}`,
      riderName: rider.name,
      riderPhone: rider.phone,
      queueType,
      priority: getPriorityByQueueType(queueType),
      status: 'waiting',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      packageName,
      urgentQuotaUsed,
      urgentFeeCharged,
      urgentFeeAmount,
    };

    set((state) => ({
      tickets: insertTicketWithPriority(state.tickets, newTicket),
      counter: newCounter,
    }));
    addLog({
      ticketId: newTicket.ticketId,
      action: 'create',
      operator: '系统',
      remark: `取号成功，类型：${queueType === 'URGENT' ? '加急' : queueType === 'VIP' ? 'VIP' : '普通'}${urgentRemark}`,
    });
    return newTicket;
  },

  callNext: (windowNo = 1) => {
    const { getSortedQueue, addLog } = get();
    const queue = getSortedQueue();
    const next = queue.find((t) => t.status === 'waiting');
    if (!next) return null;

    const updated: QueueTicket = {
      ...next,
      status: 'calling',
      calledAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      windowNo,
    };
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.ticketId === next.ticketId ? updated : t
      ),
      currentCalling: updated,
    }));
    addLog({
      ticketId: next.ticketId,
      action: 'call',
      operator: '系统',
      remark: `窗口${windowNo}叫号`,
    });
    return updated;
  },

  callSpecific: (ticketId, windowNo = 1) => {
    const { addLog } = get();
    const ticket = get().tickets.find((t) => t.ticketId === ticketId);
    if (!ticket || ticket.status !== 'waiting') return false;

    const updated: QueueTicket = {
      ...ticket,
      status: 'calling',
      calledAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      windowNo,
    };
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.ticketId === ticketId ? updated : t
      ),
      currentCalling: updated,
    }));
    addLog({
      ticketId,
      action: 'call',
      operator: '操作员',
      remark: `窗口${windowNo}叫号（手动指定）`,
    });
    return true;
  },

  completeTicket: (ticketId) => {
    const { addLog } = get();
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.ticketId === ticketId
          ? {
              ...t,
              status: 'completed',
              completedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            }
          : t
      ),
      currentCalling:
        state.currentCalling?.ticketId === ticketId ? null : state.currentCalling,
    }));
    addLog({
      ticketId,
      action: 'complete',
      operator: '操作员',
      remark: '换电完成',
    });
  },

  cancelTicket: (ticketId) => {
    const { addLog } = get();
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.ticketId === ticketId ? { ...t, status: 'cancelled' } : t
      ),
      currentCalling:
        state.currentCalling?.ticketId === ticketId ? null : state.currentCalling,
    }));
    addLog({
      ticketId,
      action: 'cancel',
      operator: '系统',
      remark: '号码已取消',
    });
  },

  jumpQueue: (ticketId, operator = '管理员') => {
    const { addLog } = get();
    const ticket = get().tickets.find((t) => t.ticketId === ticketId);
    if (!ticket || ticket.status !== 'waiting') return false;

    let urgentQuotaUsed = ticket.urgentQuotaUsed || false;
    let urgentFeeCharged = ticket.urgentFeeCharged || false;
    let urgentFeeAmount = ticket.urgentFeeAmount || 0;
    let urgentRemark = '';

    if (ticket.queueType !== 'URGENT') {
      try {
        const userStore = require('@/store/userStore').useUserStore;
        const riderData = userStore.getState().getRiderById(ticket.riderId);
        if (riderData) {
          const pkg = userStore.getState().getPackageById(riderData.packageId);
          urgentFeeAmount = pkg?.urgentFee || 15;

          if (riderData.urgentCount > 0) {
            const result = userStore.getState().consumeUrgentQuota(ticket.riderId);
            if (result.usedQuota) {
              urgentQuotaUsed = true;
              urgentFeeAmount = 0;
              urgentRemark = '，已扣加急配额1次';
            } else {
              urgentFeeCharged = true;
              urgentRemark = `，加急配额不足，收取加急费 ¥${urgentFeeAmount}`;
            }
          } else {
            urgentFeeCharged = true;
            urgentRemark = `，无加急配额，收取加急费 ¥${urgentFeeAmount}`;
          }
        } else {
          urgentFeeCharged = true;
          urgentFeeAmount = 15;
          urgentRemark = `，无骑手信息，收取加急费 ¥${urgentFeeAmount}`;
        }
      } catch (e) {
        urgentFeeCharged = true;
        urgentFeeAmount = 15;
        urgentRemark = '，加急配额扣减异常，按收费处理';
      }
    }

    set((state) => ({
      tickets: jumpTicketToFront(state.tickets, ticketId, 'URGENT').map((t) =>
        t.ticketId === ticketId
          ? { ...t, queueType: 'URGENT', priority: 1, urgentQuotaUsed, urgentFeeCharged, urgentFeeAmount }
          : t
      ),
    }));
    addLog({
      ticketId,
      action: 'jump',
      operator,
      remark: `加急插队处理${urgentRemark}`,
    });
    return true;
  },

  changePriority: (ticketId, newType, operator = '管理员') => {
    const { addLog, tickets } = get();
    const ticket = tickets.find((t) => t.ticketId === ticketId);

    let urgentQuotaUsed = ticket?.urgentQuotaUsed || false;
    let urgentFeeCharged = ticket?.urgentFeeCharged || false;
    let urgentFeeAmount = ticket?.urgentFeeAmount || 0;
    let remarkSuffix = '';

    if (ticket && newType === 'URGENT' && ticket.queueType !== 'URGENT') {
      try {
        const userStore = require('@/store/userStore').useUserStore;
        const riderData = userStore.getState().getRiderById(ticket.riderId);
        if (riderData) {
          const pkg = userStore.getState().getPackageById(riderData.packageId);
          urgentFeeAmount = pkg?.urgentFee || 15;

          if (riderData.urgentCount > 0) {
            const result = userStore.getState().consumeUrgentQuota(ticket.riderId);
            if (result.usedQuota) {
              urgentQuotaUsed = true;
              urgentFeeAmount = 0;
              remarkSuffix = '，已扣加急配额1次';
            } else {
              urgentFeeCharged = true;
              remarkSuffix = `，加急配额不足，收取加急费 ¥${urgentFeeAmount}`;
            }
          } else {
            urgentFeeCharged = true;
            remarkSuffix = `，无加急配额，收取加急费 ¥${urgentFeeAmount}`;
          }
        } else {
          urgentFeeCharged = true;
          urgentFeeAmount = 15;
          remarkSuffix = `，无骑手信息，收取加急费 ¥${urgentFeeAmount}`;
        }
      } catch (e) {
        urgentFeeCharged = true;
        urgentFeeAmount = 15;
        remarkSuffix = '，加急配额扣减异常，按收费处理';
      }
    }

    const updated = jumpTicketToFront(tickets, ticketId, newType).map((t) =>
      t.ticketId === ticketId
        ? { ...t, urgentQuotaUsed, urgentFeeCharged, urgentFeeAmount }
        : t
    );
    set({ tickets: updated });
    addLog({
      ticketId,
      action: 'priority_change',
      operator,
      remark: `优先级变更为：${newType === 'URGENT' ? '加急' : newType === 'VIP' ? 'VIP' : '普通'}${remarkSuffix}`,
    });
  },

  addLog: (log) => {
    const newLog: QueueLog = {
      id: `LOG${Date.now()}`,
      ticketId: log.ticketId || '',
      action: log.action || 'create',
      operator: log.operator || '系统',
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      remark: log.remark || '',
    };
    set((state) => ({ logs: [newLog, ...state.logs] }));
  },

  getQueueStats: () => {
    const { tickets } = get();
    const waiting = tickets.filter((t) => t.status === 'waiting');
    return {
      totalWaiting: waiting.length,
      urgentCount: waiting.filter((t) => t.queueType === 'URGENT').length,
      vipCount: waiting.filter((t) => t.queueType === 'VIP').length,
      normalCount: waiting.filter((t) => t.queueType === 'NORMAL').length,
      avgWaitTime: waiting.length * 5,
    };
  },
}));
