import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize,
  Minimize,
  Clock,
  AlertTriangle,
  Zap,
  Crown,
  Users,
  Volume2,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { usePriorityQueue } from '@/hooks/usePriorityQueue';
import type { QueueTicket, QueueType } from '@/types';

const maskName = (name: string) => {
  if (!name) return '';
  if (name.length <= 1) return name;
  return name[0] + '*'.repeat(Math.min(name.length - 1, 2));
};

const maskTicketNumber = (ticketId: string) => {
  if (!ticketId) return '----';
  return ticketId.slice(-4);
};

const getPriorityInfo = (type: QueueType) => {
  switch (type) {
    case 'URGENT':
      return {
        label: '加急',
        bgColor: 'bg-gradient-to-br from-red-500 to-rose-600',
        borderColor: 'border-red-400',
        textColor: 'text-red-400',
        dotColor: 'bg-red-500',
        cardBg: 'bg-red-500/10 border-red-500/30',
      };
    case 'VIP':
      return {
        label: 'VIP',
        bgColor: 'bg-gradient-to-br from-orange-500 to-amber-600',
        borderColor: 'border-orange-400',
        textColor: 'text-orange-400',
        dotColor: 'bg-orange-500',
        cardBg: 'bg-orange-500/10 border-orange-500/30',
      };
    default:
      return {
        label: '普通',
        bgColor: 'bg-gradient-to-br from-cyan-500 to-teal-600',
        borderColor: 'border-cyan-400',
        textColor: 'text-cyan-400',
        dotColor: 'bg-cyan-500',
        cardBg: 'bg-cyan-500/10 border-cyan-500/30',
      };
  }
};

const announcements = [
  '欢迎使用智能换电系统，祝您工作顺利！',
  'VIP套餐用户专享绿色通道服务，无需长时间等待。',
  '温馨提示：请保持安全距离，有序排队办理业务。',
  '加急服务需额外收取加急费，套餐用户可使用加急额度。',
  '如长时间未听到叫号，请前往咨询台查询。',
  '请出示取号二维码到对应窗口办理换电业务。',
];

function FlipNumber({ number, delay = 0 }: { number: string; delay?: number }) {
  return (
    <motion.span
      key={number + delay}
      initial={{ rotateX: -90, opacity: 0, y: -20 }}
      animate={{ rotateX: 0, opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.4,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      className="inline-block"
    >
      {number}
    </motion.span>
  );
}

function FlipTicketNumber({ ticketId }: { ticketId: string }) {
  const numStr = maskTicketNumber(ticketId);
  return (
    <span className="inline-flex">
      {numStr.split('').map((ch, i) => (
        <FlipNumber key={i} number={ch} delay={i * 0.08} />
      ))}
    </span>
  );
}

function Marquee({ items }: { items: string[] }) {
  return (
    <div className="relative overflow-hidden w-full h-10 bg-slate-900/60 border-y border-cyan-500/20">
      <div className="absolute left-0 top-0 h-full flex items-center px-4 bg-gradient-to-r from-primary-600 to-cyan-600 text-white font-bold text-sm z-10 shadow-lg">
        <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
        公告
      </div>
      <motion.div
        className="flex items-center h-full whitespace-nowrap pl-36"
        animate={{ x: ['0%', '-100%'] }}
        transition={{
          repeat: Infinity,
          duration: items.length * 15,
          ease: 'linear',
        }}
      >
        {[...items, ...items, ...items].map((item, i) => (
          <span
            key={i}
            className="text-cyan-100/80 text-sm mx-16 tracking-wide"
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function DisplayPage() {
  const {
    currentCalling,
    waitingQueue,
    urgentQueue,
    stats,
    processNextCall,
  } = usePriorityQueue();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastCallId, setLastCallId] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const callTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    callTimerRef.current = window.setInterval(() => {
      processNextCall(Math.floor(Math.random() * 3) + 1);
    }, 30000);
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [processNextCall]);

  useEffect(() => {
    if (currentCalling && currentCalling.ticketId !== lastCallId) {
      setLastCallId(currentCalling.ticketId);
      setFlashKey((k) => k + 1);
    }
  }, [currentCalling, lastCallId]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.log('全屏切换失败:', e);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatDate = (d: Date) => {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日 ${weekdays[d.getDay()]}`;
  };

  const formatTime = (d: Date) => {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const waitingNext5 = waitingQueue.slice(0, 5);

  const currentPriority = currentCalling
    ? getPriorityInfo(currentCalling.queueType)
    : null;

  const handleManualCall = () => {
    processNextCall(Math.floor(Math.random() * 3) + 1);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 text-white overflow-hidden relative"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 h-screen flex flex-col p-4 lg:p-6">
        <header className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-primary-500/30">
              <Zap className="w-8 h-8 lg:w-9 lg:h-9 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-3xl font-black tracking-wide bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
                智能换电服务中心
              </h1>
              <div className="flex items-center gap-2 text-cyan-300/70 text-sm lg:text-base mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                中关村旗舰站 · 大厅排队叫号系统
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            <div className="text-right">
              <motion.div
                className="text-3xl lg:text-6xl font-black text-white tracking-widest tabular-nums"
                key={formatTime(currentTime)}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
              >
                {formatTime(currentTime)}
              </motion.div>
              <div className="text-xs lg:text-sm text-cyan-300/70 mt-1">
                {formatDate(currentTime)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleManualCall}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-cyan-500/20 border border-primary-400/30 text-primary-200 hover:bg-primary-500/30 transition-all"
                title="手动叫号"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden lg:inline text-sm font-medium">手动叫号</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/30 transition-all"
                title={isFullscreen ? '退出全屏 (F11)' : '全屏显示 (F11)'}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
                <span className="hidden lg:inline text-sm font-medium">
                  {isFullscreen ? '退出全屏' : '全屏显示'}
                </span>
              </motion.button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6 flex-1 min-h-0">
          <div className="xl:col-span-3 flex flex-col gap-4 lg:gap-6 min-h-0">
            <motion.div
              key={`call-${flashKey}`}
              className={`flex-1 rounded-3xl border-2 ${
                currentCalling && currentCalling.queueType === 'URGENT'
                  ? 'border-red-400/50'
                  : currentCalling && currentCalling.queueType === 'VIP'
                    ? 'border-orange-400/50'
                    : 'border-cyan-400/40'
              } bg-gradient-to-br from-slate-800/80 via-slate-900/60 to-slate-800/80 backdrop-blur-sm p-6 lg:p-10 relative overflow-hidden shadow-2xl`}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {currentCalling && (
                <motion.div
                  key={`flash-${flashKey}`}
                  className={`absolute inset-0 ${
                    currentCalling.queueType === 'URGENT'
                      ? 'bg-red-500/5'
                      : currentCalling.queueType === 'VIP'
                        ? 'bg-orange-500/5'
                        : 'bg-cyan-500/5'
                  }`}
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{
                    duration: 1,
                    repeat: 3,
                    ease: 'easeInOut',
                  }}
                />
              )}

              <div className="relative z-10 flex flex-col h-full">
                <div className="text-center mb-4 lg:mb-6">
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-200/80 text-sm lg:text-base">
                    <Clock className="w-4 h-4 lg:w-5 lg:h-5" />
                    当前正在叫号
                  </div>
                </div>

                {currentCalling ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="mb-6 lg:mb-10">
                      <div
                        className={`relative inline-flex items-center justify-center px-16 lg:px-32 py-8 lg:py-16 rounded-3xl ${
                          currentPriority?.bgColor
                        } shadow-2xl`}
                        style={{ boxShadow: '0 0 80px rgba(236, 72, 153, 0.3)' }}
                      >
                        {currentCalling.queueType === 'URGENT' && (
                          <motion.div
                            className="absolute -inset-1 rounded-3xl border-4 border-red-400"
                            animate={{
                              opacity: [0.6, 0, 0.6],
                              scale: [1, 1.08, 1],
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          />
                        )}
                        <div className="tracking-wider">
                          <FlipTicketNumber
                            key={`num-${flashKey}`}
                            ticketId={currentCalling.ticketId}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 w-full max-w-4xl">
                      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 lg:p-6 border border-white/10 text-center">
                        <div className="text-cyan-300/60 text-xs lg:text-sm mb-2 tracking-wider">
                          骑手姓名
                        </div>
                        <div className="text-2xl lg:text-4xl font-bold text-white">
                          {maskName(currentCalling.riderName)}
                        </div>
                      </div>

                      <motion.div
                        key={`win-${flashKey}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="relative bg-gradient-to-br from-primary-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-5 lg:p-6 border-2 border-primary-400/40 text-center overflow-hidden"
                      >
                        {currentCalling.queueType === 'URGENT' && (
                          <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
                        )}
                        <div className="relative z-10">
                          <div className="text-primary-200/70 text-xs lg:text-sm mb-2 tracking-wider">
                            办理窗口
                          </div>
                          <div className="text-5xl lg:text-7xl font-black text-white drop-shadow-lg">
                            {currentCalling.windowNo || 1}
                            <span className="text-2xl lg:text-4xl font-normal text-cyan-200/50 ml-1">
                              号
                            </span>
                          </div>
                        </div>
                      </motion.div>

                      <div
                        className={`${currentPriority?.cardBg} backdrop-blur-sm rounded-2xl p-5 lg:p-6 border text-center`}
                      >
                        <div
                          className={`${currentPriority?.textColor}/70 text-xs lg:text-sm mb-2 tracking-wider`}
                        >
                          优先级
                        </div>
                        <div
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${currentPriority?.bgColor} text-white font-bold text-lg lg:text-xl shadow-lg`}
                        >
                          {currentCalling.queueType === 'URGENT' && (
                            <motion.div
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                              }}
                            >
                              <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6" />
                            </motion.div>
                          )}
                          {currentCalling.queueType === 'VIP' && (
                            <Crown className="w-5 h-5 lg:w-6 lg:h-6" />
                          )}
                          {currentCalling.queueType === 'NORMAL' && (
                            <Users className="w-5 h-5 lg:w-6 lg:h-6" />
                          )}
                          {currentPriority?.label}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-6 border border-dashed border-white/20">
                        <Clock className="w-16 h-16 text-cyan-400/40" />
                      </div>
                      <div className="text-3xl text-cyan-300/40 font-bold tracking-wider">
                        暂无叫号
                      </div>
                      <div className="text-base text-cyan-300/30 mt-3">
                        请稍候，即将开始叫号
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <div className="rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-white/10 p-5 lg:p-7">
              <div className="flex items-center justify-between mb-5 lg:mb-6">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400" />
                    等待队列
                  </h2>
                  <p className="text-sm lg:text-base text-cyan-300/50 mt-1">
                    当前共 {stats.totalWaiting} 位骑手等待
                  </p>
                </div>
                <div className="flex items-center gap-2 lg:gap-4 text-xs lg:text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-cyan-200/60">
                      加急 {stats.urgentCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-cyan-200/60">
                      VIP {stats.vipCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                    <span className="text-cyan-200/60">
                      普通 {stats.normalCount}
                    </span>
                  </div>
                </div>
              </div>

              {waitingNext5.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  <AnimatePresence mode="popLayout">
                    {waitingNext5.map((ticket: QueueTicket, idx: number) => {
                      const pInfo = getPriorityInfo(ticket.queueType);
                      return (
                        <motion.div
                          key={ticket.ticketId}
                          layout
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`relative rounded-2xl p-4 lg:p-5 border-l-4 ${pInfo.borderColor} ${pInfo.cardBg} backdrop-blur-sm overflow-hidden`}
                        >
                          {idx < 3 && (
                            <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-cyan-200/70">
                              {idx + 1}
                            </div>
                          )}
                          <div className="flex items-center gap-3 lg:gap-4">
                            <div className="text-center min-w-[72px] lg:min-w-[88px]">
                              <div className="text-3xl lg:text-4xl font-black text-white tracking-wider">
                                {maskTicketNumber(ticket.ticketId)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-lg lg:text-xl font-bold text-white truncate">
                                {maskName(ticket.riderName)}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <div
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${pInfo.bgColor} text-white text-xs font-medium`}
                                >
                                  {ticket.queueType === 'URGENT' && (
                                    <AlertTriangle className="w-3 h-3" />
                                  )}
                                  {ticket.queueType === 'VIP' && (
                                    <Crown className="w-3 h-3" />
                                  )}
                                  {pInfo.label}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Users className="w-16 h-16 mx-auto text-cyan-500/20 mb-3" />
                  <div className="text-lg text-cyan-300/40">暂无等待队列</div>
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-1 flex flex-col min-h-0">
            <div className="flex-1 rounded-3xl bg-gradient-to-br from-red-900/40 via-red-950/50 to-slate-900/60 backdrop-blur-sm border-2 border-red-500/30 p-5 lg:p-7 flex flex-col min-h-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/5" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-500 opacity-70" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5 lg:mb-6">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                      }}
                    >
                      <AlertTriangle className="w-6 h-6 lg:w-7 lg:h-7 text-red-400" />
                    </motion.div>
                    <h2 className="text-xl lg:text-2xl font-black text-red-300 tracking-wide">
                      加急队列
                    </h2>
                  </div>
                  <motion.div
                    key={urgentQueue.length}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-red-500/30 border-2 border-red-400/60 flex items-center justify-center"
                  >
                    <span className="text-xl lg:text-2xl font-black text-red-200 tabular-nums">
                      {urgentQueue.length}
                    </span>
                  </motion.div>
                </div>
              </div>

              <div className="relative z-10 flex-1 overflow-y-auto space-y-3 lg:space-y-4 pr-1">
                {urgentQueue.length > 0 ? (
                  urgentQueue.map((ticket: QueueTicket, idx: number) => (
                    <motion.div
                      key={ticket.ticketId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative rounded-2xl bg-red-500/10 border border-red-500/30 p-4 overflow-hidden group hover:bg-red-500/20 transition-colors"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-red-600" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: idx * 0.2,
                            }}
                            className="text-2xl lg:text-3xl font-black text-red-200 tracking-wider"
                          >
                            {maskTicketNumber(ticket.ticketId)}
                          </motion.div>
                          <div>
                            <div className="text-white font-bold text-base lg:text-lg">
                              {maskName(ticket.riderName)}
                            </div>
                            <div className="text-xs lg:text-sm text-red-300/70 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {ticket.createdAt?.slice(-8)}
                            </div>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-400/50 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-red-300" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 border border-dashed border-red-500/30 flex items-center justify-center mb-4">
                      <Zap className="w-10 h-10 text-red-400/40" />
                    </div>
                    <div className="text-lg text-red-300/50 font-medium">
                      暂无加急单号
                    </div>
                    <div className="text-sm text-red-300/30 mt-1">
                      加急单将优先处理
                    </div>
                  </div>
                )}
              </div>

              <div className="relative z-10 mt-4 pt-4 border-t border-red-500/20 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <div className="text-xs text-red-300/50 mb-1">VIP</div>
                  <div className="text-xl font-bold text-orange-300 tabular-nums">
                    {stats.vipCount}
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <div className="text-xs text-red-300/50 mb-1">普通</div>
                  <div className="text-xl font-bold text-cyan-300 tabular-nums">
                    {stats.normalCount}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 lg:mt-6 -mx-4 lg:-mx-6 mb-[-1rem] lg:mb-[-1.5rem]">
          <Marquee items={announcements} />
        </div>
      </div>
    </div>
  );
}
