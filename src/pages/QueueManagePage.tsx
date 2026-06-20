import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from 'antd';
import {
  Megaphone,
  RefreshCw,
  Filter,
  Users,
  AlertTriangle,
  Crown,
  UserCheck,
  Clock,
  Phone,
  ArrowUpCircle,
  Edit3,
  X,
  CheckCircle,
  ArrowRight,
  GripVertical,
  Home,
  ChevronRight,
  Search,
  Zap,
} from 'lucide-react';
import { usePriorityQueue } from '@/hooks/usePriorityQueue';
import type { QueueTicket, QueueType } from '@/types';
import { getQueueTypeLabel } from '@/utils/queueUtils';
import dayjs from 'dayjs';

type FilterType = 'ALL' | 'URGENT' | 'VIP' | 'NORMAL';

const getTicketClass = (type: QueueType) => {
  switch (type) {
    case 'URGENT':
      return 'ticket-urgent';
    case 'VIP':
      return 'ticket-vip';
    case 'NORMAL':
      return 'ticket-normal';
  }
};

const getPriorityTagClass = (type: QueueType) => {
  switch (type) {
    case 'URGENT':
      return 'priority-urgent';
    case 'VIP':
      return 'priority-vip';
    case 'NORMAL':
      return 'priority-normal';
  }
};

const getActionLabel = (action: string) => {
  const map: Record<string, string> = {
    create: '取号',
    jump: '加急插队',
    priority_change: '变更优先级',
    call: '叫号',
    complete: '完成',
    cancel: '取消',
  };
  return map[action] || action;
};

const getActionColor = (action: string) => {
  const map: Record<string, string> = {
    create: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    jump: 'bg-red-100 text-red-700 border-red-200',
    priority_change: 'bg-orange-100 text-orange-700 border-orange-200',
    call: 'bg-primary-100 text-primary-700 border-primary-200',
    complete: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancel: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return map[action] || 'bg-slate-100 text-slate-600 border-slate-200';
};

const formatWaitTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
};

const getElapsedMinutes = (createdAt: string) => {
  return dayjs().diff(dayjs(createdAt), 'minute');
};

const maskPhoneLast4 = (phone: string) => {
  const match = phone.match(/(\d{4})\*?(\d{4})$/);
  return match ? match[2] : phone.slice(-4);
};

interface TicketCardProps {
  ticket: QueueTicket;
  position: number;
  waitTime: number;
  isCalling: boolean;
  onCall: () => void;
  onJump: () => void;
  onChangePriority: (type: QueueType) => void;
  onCancel: () => void;
  onDragStart: (e: any, id: string) => void;
  onDragOver: (e: any) => void;
  onDrop: (e: any, id: string) => void;
}

function TicketCard({
  ticket,
  position,
  waitTime,
  isCalling,
  onCall,
  onJump,
  onChangePriority,
  onCancel,
  onDragStart,
  onDragOver,
  onDrop,
}: TicketCardProps) {
  const canJump = ticket.queueType !== 'URGENT';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={(e) => onDragStart(e, ticket.ticketId)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, ticket.ticketId)}
      className={`ticket-card ${getTicketClass(ticket.queueType)} ${
        isCalling ? 'call-flash ring-2 ring-orange-400 ring-offset-2' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors pt-1">
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex flex-col items-center min-w-[72px]">
          <div className="text-xs text-slate-500 font-medium mb-1">取号码</div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-md">
            <span className="text-xl font-black text-white tracking-tight">
              {ticket.ticketId.slice(-3)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono">{ticket.ticketId}</div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-lg font-bold text-slate-800">{ticket.riderName}</span>
            <span className="inline-flex items-center gap-1 text-sm text-slate-500">
              <Phone className="w-3.5 h-3.5" />
              尾号 {maskPhoneLast4(ticket.riderPhone)}
            </span>
            <span className={`priority-tag ${getPriorityTagClass(ticket.queueType)}`}>
              {ticket.queueType === 'URGENT' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {ticket.queueType === 'VIP' && <Crown className="w-3 h-3 mr-1" />}
              {getQueueTypeLabel(ticket.queueType)}
            </span>
            {ticket.queueType === 'URGENT' && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                ticket.urgentQuotaUsed
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {ticket.urgentQuotaUsed ? '配额抵扣' : '待收加急费'}
              </span>
            )}
            {isCalling && (
              <span className="badge bg-orange-100 text-orange-700 border border-orange-200 animate-pulse">
                <Megaphone className="w-3 h-3 mr-1" />
                叫号中
              </span>
            )}
          </div>

          <div className="flex items-center gap-5 text-sm text-slate-500 mb-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              等待 <span className="font-semibold text-slate-700">{getElapsedMinutes(ticket.createdAt)}分钟</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              位次 <span className="font-semibold text-slate-700">#{position}</span>
            </span>
            {waitTime > 0 && (
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-slate-400" />
                预计还需 <span className="font-semibold text-slate-700">{formatWaitTime(waitTime)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onCall}
              disabled={isCalling}
              className="btn-primary !px-4 !py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Megaphone className="w-3.5 h-3.5 mr-1" />
              叫号
            </button>
            {canJump && (
              <button
                onClick={onJump}
                className="btn-danger !px-4 !py-1.5 text-sm"
              >
                <ArrowUpCircle className="w-3.5 h-3.5 mr-1" />
                加急插队
              </button>
            )}
            <Select
              size="small"
              value={ticket.queueType}
              onChange={(val: QueueType) => onChangePriority(val)}
              className="!w-28"
              options={[
                { value: 'URGENT', label: '加急' },
                { value: 'VIP', label: 'VIP' },
                { value: 'NORMAL', label: '普通' },
              ]}
              suffixIcon={<Edit3 className="w-3 h-3" />}
            />
            <button
              onClick={onCancel}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-medium transition-all duration-300 active:scale-95 inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              取消
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface QueueGroupProps {
  title: string;
  icon: React.ReactNode;
  headerClass: string;
  tickets: QueueTicket[];
  currentCallingId: string | null;
  getPosition: (id: string) => { position: number; waitTime: number };
  onCall: (id: string) => void;
  onJump: (id: string) => void;
  onChangePriority: (id: string, type: QueueType) => void;
  onCancel: (id: string) => void;
  dragId: string | null;
  setDragId: (id: string | null) => void;
  reorder: (from: string, to: string) => void;
}

function QueueGroup({
  title,
  icon,
  headerClass,
  tickets,
  currentCallingId,
  getPosition,
  onCall,
  onJump,
  onChangePriority,
  onCancel,
  dragId,
  setDragId,
  reorder,
}: QueueGroupProps) {
  const handleDragStart = (e: any, id: string) => {
    setDragId(id);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: any) => {
    if (e.preventDefault) e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: any, targetId: string) => {
    if (e.preventDefault) e.preventDefault();
    if (dragId && dragId !== targetId) {
      reorder(dragId, targetId);
    }
    setDragId(null);
  };

  return (
    <div className="mb-5">
      <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${headerClass}`}>
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-bold text-base">{title}</span>
          <span className="badge bg-white/30 text-white border-0 ml-1">
            {tickets.length} 人
          </span>
        </div>
      </div>
      <div className="rounded-b-2xl border border-t-0 border-slate-100 bg-slate-50/50 p-3 space-y-3 min-h-[100px]">
        <AnimatePresence>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">暂无等待人员</p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const { position, waitTime } = getPosition(ticket.ticketId);
              return (
                <TicketCard
                  key={ticket.ticketId}
                  ticket={ticket}
                  position={position}
                  waitTime={waitTime}
                  isCalling={ticket.ticketId === currentCallingId}
                  onCall={() => onCall(ticket.ticketId)}
                  onJump={() => onJump(ticket.ticketId)}
                  onChangePriority={(type) => onChangePriority(ticket.ticketId, type)}
                  onCancel={() => onCancel(ticket.ticketId)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function QueueManagePage() {
  const {
    urgentQueue,
    vipQueue,
    normalQueue,
    waitingQueue,
    currentCalling,
    stats,
    recentLogs,
    getTicketPosition,
    processNextCall,
    processCallById,
    processComplete,
    processCancel,
    processJumpQueue,
    processChangePriority,
  } = usePriorityQueue();

  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [dragId, setDragId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filteredUrgent = useMemo(
    () => (filterType === 'ALL' || filterType === 'URGENT' ? urgentQueue : []),
    [filterType, urgentQueue]
  );
  const filteredVip = useMemo(
    () => (filterType === 'ALL' || filterType === 'VIP' ? vipQueue : []),
    [filterType, vipQueue]
  );
  const filteredNormal = useMemo(
    () => (filterType === 'ALL' || filterType === 'NORMAL' ? normalQueue : []),
    [filterType, normalQueue]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleCallNext = useCallback(() => {
    processNextCall(1);
  }, [processNextCall]);

  const handleCallById = useCallback(
    (ticketId: string) => {
      processCallById(ticketId, 1);
    },
    [processCallById]
  );

  const handleJump = useCallback(
    (ticketId: string) => {
      processJumpQueue(ticketId, '管理员');
    },
    [processJumpQueue]
  );

  const handleChangePriority = useCallback(
    (ticketId: string, type: QueueType) => {
      processChangePriority(ticketId, type, '管理员');
    },
    [processChangePriority]
  );

  const handleCancel = useCallback(
    (ticketId: string) => {
      processCancel(ticketId);
    },
    [processCancel]
  );

  const handleComplete = useCallback(() => {
    if (currentCalling) {
      processComplete(currentCalling.ticketId);
    }
  }, [currentCalling, processComplete]);

  const handleNext = useCallback(() => {
    if (currentCalling) {
      processComplete(currentCalling.ticketId);
    }
    processNextCall(1);
  }, [currentCalling, processComplete, processNextCall]);

  const reorder = useCallback(
    (fromId: string, toId: string) => {
      const fromTicket = waitingQueue.find((t) => t.ticketId === fromId);
      const toTicket = waitingQueue.find((t) => t.ticketId === toId);
      if (fromTicket && toTicket) {
        processChangePriority(fromId, toTicket.queueType, '管理员');
      }
    },
    [waitingQueue, processChangePriority]
  );

  const callingWaitDuration = useMemo(() => {
    if (!currentCalling?.calledAt) return 0;
    return dayjs().diff(dayjs(currentCalling.calledAt), 'minute');
  }, [currentCalling]);

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Home className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
            <span>队列管理</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-primary-700 font-medium">优先级队列维护</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-primary-500 to-primary-700 rounded-full" />
            优先级队列维护
          </h1>
        </div>
      </motion.div>

      <div className="grid grid-cols-10 gap-6">
        <div className="col-span-10 lg:col-span-7 flex flex-col">
          <div className="stat-card mb-5 p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={handleCallNext} className="btn-success flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                叫号下一位
              </button>
              <button
                onClick={handleRefresh}
                className="px-6 py-2.5 border-2 border-primary-600 text-primary-700 rounded-full font-medium hover:bg-primary-50 transition-all duration-300 active:scale-95 inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                批量刷新
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                <Filter className="w-4 h-4" />
                筛选
              </span>
              <div className="inline-flex rounded-full border border-slate-200 overflow-hidden bg-white shadow-sm">
                {(['ALL', 'URGENT', 'VIP', 'NORMAL'] as FilterType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      filterType === type
                        ? type === 'URGENT'
                          ? 'bg-red-500 text-white'
                          : type === 'VIP'
                            ? 'bg-orange-500 text-white'
                            : type === 'NORMAL'
                              ? 'bg-cyan-500 text-white'
                              : 'bg-primary-600 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {type === 'ALL'
                      ? '全部'
                      : type === 'URGENT'
                        ? '加急'
                        : type === 'VIP'
                          ? 'VIP'
                          : '普通'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 max-h-[calc(100vh-320px)]">
            <QueueGroup
              title="加急队列"
              icon={<AlertTriangle className="w-5 h-5" />}
              headerClass="bg-gradient-to-r from-red-500 to-rose-600 text-white"
              tickets={filteredUrgent}
              currentCallingId={currentCalling?.ticketId || null}
              getPosition={getTicketPosition}
              onCall={handleCallById}
              onJump={handleJump}
              onChangePriority={handleChangePriority}
              onCancel={handleCancel}
              dragId={dragId}
              setDragId={setDragId}
              reorder={reorder}
            />
            <QueueGroup
              title="VIP队列"
              icon={<Crown className="w-5 h-5" />}
              headerClass="bg-gradient-to-r from-orange-500 to-amber-600 text-white"
              tickets={filteredVip}
              currentCallingId={currentCalling?.ticketId || null}
              getPosition={getTicketPosition}
              onCall={handleCallById}
              onJump={handleJump}
              onChangePriority={handleChangePriority}
              onCancel={handleCancel}
              dragId={dragId}
              setDragId={setDragId}
              reorder={reorder}
            />
            <QueueGroup
              title="普通队列"
              icon={<UserCheck className="w-5 h-5" />}
              headerClass="bg-gradient-to-r from-cyan-500 to-teal-600 text-white"
              tickets={filteredNormal}
              currentCallingId={currentCalling?.ticketId || null}
              getPosition={getTicketPosition}
              onCall={handleCallById}
              onJump={handleJump}
              onChangePriority={handleChangePriority}
              onCancel={handleCancel}
              dragId={dragId}
              setDragId={setDragId}
              reorder={reorder}
            />
          </div>
        </div>

        <div className="col-span-10 lg:col-span-3 space-y-5 flex flex-col">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="stat-card"
          >
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-primary-600" />
              队列统计
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-gradient-to-br from-primary-50 to-cyan-50 border border-primary-100 p-3 text-center">
                <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-4 h-4 text-primary-600" />
                </div>
                <div className="text-2xl font-bold text-primary-700">{stats.totalWaiting}</div>
                <div className="text-xs text-primary-600/80 font-medium mt-0.5">总等待</div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 p-3 text-center">
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-700">{stats.urgentCount}</div>
                <div className="text-xs text-red-600/80 font-medium mt-0.5">加急</div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-3 text-center">
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center mx-auto mb-2">
                  <Crown className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-700">{stats.vipCount}</div>
                <div className="text-xs text-orange-600/80 font-medium mt-0.5">VIP</div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-100 p-3 text-center">
                <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center mx-auto mb-2">
                  <UserCheck className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="text-2xl font-bold text-cyan-700">{stats.normalCount}</div>
                <div className="text-xs text-cyan-600/80 font-medium mt-0.5">普通</div>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 p-4 text-center">
              <div className="text-xs text-slate-500 font-medium mb-1">平均等待时间</div>
              <div className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-1">
                <Clock className="w-5 h-5 text-slate-500" />
                {formatWaitTime(stats.avgWaitTime)}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary-600" />
                当前叫号详情
              </h3>
              {currentCalling && (
                <span
                  className={`badge ${getPriorityTagClass(currentCalling.queueType)}`}
                >
                  {getQueueTypeLabel(currentCalling.queueType)}
                </span>
              )}
            </div>

            {currentCalling ? (
              <>
                <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-5 text-white mb-4 call-flash">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <span className="text-3xl font-black tracking-tight">
                        {currentCalling.ticketId.slice(-3)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xl font-bold truncate">{currentCalling.riderName}</div>
                      <div className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                        <Phone className="w-3.5 h-3.5" />
                        {currentCalling.riderPhone}
                      </div>
                      <div className="text-white/70 text-xs mt-1 truncate">
                        {currentCalling.packageName}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 mb-5 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary-500" />
                      窗口号
                    </span>
                    <span className="font-semibold text-slate-800">
                      窗口 {currentCalling.windowNo || 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" />
                      叫号时间
                    </span>
                    <span className="font-semibold text-slate-800 font-mono text-xs">
                      {currentCalling.calledAt?.slice(11) || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      等待时长
                    </span>
                    <span className="font-bold text-orange-600">
                      {callingWaitDuration} 分钟
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleComplete}
                    className="btn-success !px-4 !py-2 text-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    完成
                  </button>
                  <button
                    onClick={handleNext}
                    className="btn-primary !px-4 !py-2 text-sm flex items-center justify-center gap-1.5"
                  >
                    <ArrowRight className="w-4 h-4" />
                    转下一位
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">暂无叫号</p>
                <p className="text-sm text-slate-400 mt-1">请点击"叫号下一位"</p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="stat-card flex-1 min-h-0 flex flex-col"
          >
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 flex-shrink-0">
              <Edit3 className="w-5 h-5 text-primary-600" />
              操作日志
              <span className="badge bg-slate-100 text-slate-600 border border-slate-200 ml-1">
                最近 10 条
              </span>
            </h3>
            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
              {recentLogs.slice(0, 10).length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Edit3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">暂无操作日志</p>
                </div>
              ) : (
                <div className="relative pl-5 before:absolute before:left-2 before:top-1 before:bottom-1 before:w-px before:bg-slate-200">
                  {recentLogs.slice(0, 10).map((log, idx) => (
                    <div
                      key={log.id}
                      className="relative mb-4 last:mb-0"
                    >
                      <div
                        className={`absolute -left-3.5 top-1 w-3 h-3 rounded-full border-2 border-white ${
                          log.action === 'complete'
                            ? 'bg-emerald-500'
                            : log.action === 'call'
                              ? 'bg-primary-500'
                              : log.action === 'jump'
                                ? 'bg-red-500'
                                : log.action === 'cancel'
                                  ? 'bg-slate-400'
                                  : log.action === 'priority_change'
                                    ? 'bg-orange-500'
                                    : 'bg-cyan-500'
                        }`}
                      />
                      <div className="bg-slate-50 rounded-xl p-3 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`badge ${getActionColor(log.action)} !text-xs`}>
                            {getActionLabel(log.action)}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {log.ticketId}
                          </span>
                        </div>
                        {log.remark && (
                          <p className="text-sm text-slate-600 mb-1.5">{log.remark}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{log.operator}</span>
                          <span className="font-mono">{log.timestamp.slice(11)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
