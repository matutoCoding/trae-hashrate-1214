import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Battery,
  Package,
  Zap,
  Activity,
  AlertTriangle,
  Heart,
  Home,
  ChevronRight,
  Plus,
  Users,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Crown,
  Star,
  UserCheck,
  Megaphone,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useBatteryStore } from '@/store/batteryStore';
import { useQueueStore } from '@/store/queueStore';
import { useUserStore } from '@/store/userStore';
import type { WarningBatch } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend: number;
  gradientClass: string;
  isWarning?: boolean;
  suffix?: string;
}

function StatCard({
  icon,
  label,
  value,
  trend,
  gradientClass,
  isWarning,
  suffix,
}: StatCardProps) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-emerald-100' : trend < 0 ? 'text-red-100' : 'text-white/70';

  return (
    <motion.div
      variants={itemVariants}
      className={`stat-card ${gradientClass} relative overflow-hidden ${
        isWarning ? 'warning-breathe' : ''
      }`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            {icon}
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span>{Math.abs(trend)}%</span>
          </div>
        </div>
        <div className="text-white/80 text-sm font-medium mb-1">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          {suffix && <span className="text-white/80 text-sm font-medium">{suffix}</span>}
        </div>
      </div>
    </motion.div>
  );
}

function getWarningBadgeClass(level: string) {
  switch (level) {
    case 'danger':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'warning':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'caution':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function getWarningLabel(level: string) {
  switch (level) {
    case 'danger':
      return '危险';
    case 'warning':
      return '警告';
    case 'caution':
      return '注意';
    default:
      return '正常';
  }
}

function WarningBatchItem({ batch, index }: { batch: WarningBatch; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          batch.level === 'danger'
            ? 'bg-red-100 text-red-600'
            : batch.level === 'warning'
              ? 'bg-orange-100 text-orange-600'
              : 'bg-yellow-100 text-yellow-600'
        }`}
      >
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-slate-800 truncate">{batch.batchId}</span>
          <span
            className={`badge border ${getWarningBadgeClass(batch.level)}`}
          >
            {getWarningLabel(batch.level)}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            {batch.quantity}节
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {batch.supplier}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div
          className={`text-lg font-bold ${
            batch.remainingDays <= 7
              ? 'text-red-600'
              : batch.remainingDays <= 30
                ? 'text-orange-600'
                : 'text-yellow-600'
          }`}
        >
          {batch.remainingDays > 0 ? `${batch.remainingDays}天` : '已过期'}
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1 justify-end">
          <Clock className="w-3 h-3" />
          {batch.expiryDate}
        </div>
      </div>
    </motion.div>
  );
}

const PIE_COLORS = ['#0E7490', '#F97316'];

export default function DashboardPage() {
  const getDashboardStats = useBatteryStore((s) => s.getDashboardStats);
  const getSwapTrend = useBatteryStore((s) => s.getSwapTrend);
  const getWarningBatches = useBatteryStore((s) => s.getWarningBatches);

  const getQueueStats = useQueueStore((s) => s.getQueueStats);
  const currentCalling = useQueueStore((s) => s.currentCalling);

  const getRidersByLevel = useUserStore((s) => s.getRidersByLevel);

  const stats = useMemo(() => getDashboardStats(), [getDashboardStats]);
  const swapTrend = useMemo(() => getSwapTrend(), [getSwapTrend]);
  const warningBatches = useMemo(() => getWarningBatches().slice(0, 5), [getWarningBatches]);
  const queueStats = useMemo(() => getQueueStats(), [getQueueStats]);
  const riderLevel = useMemo(() => getRidersByLevel(), [getRidersByLevel]);

  const pieData = useMemo(
    () => [
      { name: 'VIP骑手', value: riderLevel.vip },
      { name: '普通骑手', value: riderLevel.normal },
    ],
    [riderLevel]
  );

  const mockTrends = useMemo(
    () => ({
      totalBatteries: 12.5,
      inStock: 5.3,
      inRent: 8.7,
      todaySwap: 15.2,
      warningCount: -3.1,
      avgHealthScore: 2.1,
    }),
    []
  );

  return (
    <div className="space-y-6">
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
            <span>首页</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-primary-700 font-medium">运营总览</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-primary-500 to-primary-700 rounded-full" />
            运营总览
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <Bell className="w-4 h-4" />
            <span className="text-sm font-medium">消息通知</span>
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">快速取号</span>
          </button>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        <StatCard
          icon={<Battery className="w-6 h-6 text-white" />}
          label="电池总数"
          value={stats.totalBatteries.toLocaleString()}
          trend={mockTrends.totalBatteries}
          gradientClass="gradient-card-cyan"
          suffix="节"
        />
        <StatCard
          icon={<Package className="w-6 h-6 text-white" />}
          label="在库数量"
          value={stats.inStock.toLocaleString()}
          trend={mockTrends.inStock}
          gradientClass="gradient-card-green"
          suffix="节"
        />
        <StatCard
          icon={<Zap className="w-6 h-6 text-white" />}
          label="在租数量"
          value={stats.inRent.toLocaleString()}
          trend={mockTrends.inRent}
          gradientClass="gradient-card-blue"
          suffix="节"
        />
        <StatCard
          icon={<Activity className="w-6 h-6 text-white" />}
          label="今日换电"
          value={stats.todaySwap}
          trend={mockTrends.todaySwap}
          gradientClass="gradient-card-orange"
          suffix="次"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6 text-white" />}
          label="临期预警"
          value={stats.warningCount}
          trend={mockTrends.warningCount}
          gradientClass="gradient-card-red"
          isWarning={stats.warningCount > 0}
          suffix="批"
        />
        <StatCard
          icon={<Heart className="w-6 h-6 text-white" />}
          label="平均健康度"
          value={stats.avgHealthScore}
          trend={mockTrends.avgHealthScore}
          gradientClass="bg-gradient-to-br from-violet-500 to-purple-600 text-white"
          suffix="分"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-2 stat-card"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600" />
                7天换电趋势
              </h3>
              <p className="text-sm text-slate-500 mt-1">最近一周每日换电次数统计</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gradient-to-br from-primary-500 to-primary-700" />
                <span className="text-slate-600">换电次数</span>
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={swapTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="swapGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0E7490" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0E7490" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dx={-5}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '12px 16px',
                  }}
                  labelStyle={{ color: '#1e293b', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: '#0E7490', fontWeight: 500 }}
                  formatter={(value: number) => [`${value} 次`, '换电次数']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0E7490"
                  strokeWidth={3}
                  fill="url(#swapGradient)"
                  dot={{ r: 4, fill: '#0E7490', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#0E7490', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="stat-card"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              骑手等级分布
            </h3>
            <p className="text-sm text-slate-500 mt-1">VIP与普通骑手占比</p>
          </div>
          <div className="h-72 flex flex-col">
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      padding: '12px 16px',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} 人`,
                      name,
                    ]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }}
                    formatter={(value: string) => <span className="text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="rounded-xl bg-primary-50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Crown className="w-4 h-4 text-primary-600" />
                  <span className="text-xs text-primary-700 font-medium">VIP骑手</span>
                </div>
                <div className="text-xl font-bold text-primary-800">{riderLevel.vip}</div>
              </div>
              <div className="rounded-xl bg-orange-50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Star className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-orange-700 font-medium">普通骑手</span>
                </div>
                <div className="text-xl font-bold text-orange-800">{riderLevel.normal}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                临期预警批次
                {warningBatches.length > 0 && (
                  <span className="badge bg-red-100 text-red-700 border border-red-200 ml-1">
                    Top 5
                  </span>
                )}
              </h3>
              <p className="text-sm text-slate-500 mt-1">效期不足90天的电池批次</p>
            </div>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors">
              查看全部
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {warningBatches.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-slate-600 font-medium">暂无临期预警</p>
              <p className="text-sm text-slate-400 mt-1">所有批次状态良好</p>
            </div>
          ) : (
            <div className="space-y-3">
              {warningBatches.map((batch, index) => (
                <WarningBatchItem key={batch.batchId} batch={batch} index={index} />
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary-600" />
                队列实时概览
              </h3>
              <p className="text-sm text-slate-500 mt-1">当前等待队列与叫号状态</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">{queueStats.urgentCount}</div>
              <div className="text-xs text-red-600/80 font-medium mt-1">加急队列</div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-2">
                <Crown className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{queueStats.vipCount}</div>
              <div className="text-xs text-orange-600/80 font-medium mt-1">VIP队列</div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-100 p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center mx-auto mb-2">
                <UserCheck className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="text-2xl font-bold text-cyan-600">{queueStats.normalCount}</div>
              <div className="text-xs text-cyan-600/80 font-medium mt-1">普通队列</div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-primary-50 via-white to-orange-50 border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="badge bg-primary-100 text-primary-700 border border-primary-200">
                  <Megaphone className="w-3 h-3 mr-1" />
                  当前叫号
                </span>
              </div>
              {currentCalling && (
                <span
                  className={`badge border ${
                    currentCalling.queueType === 'URGENT'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : currentCalling.queueType === 'VIP'
                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                        : 'bg-cyan-100 text-cyan-700 border-cyan-200'
                  }`}
                >
                  {currentCalling.queueType === 'URGENT'
                    ? '加急'
                    : currentCalling.queueType === 'VIP'
                      ? 'VIP'
                      : '普通'}
                </span>
              )}
            </div>

            {currentCalling ? (
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center call-flash shadow-lg shadow-primary-200">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {currentCalling.ticketId.slice(-3)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-slate-800">
                      {currentCalling.riderName}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Users className="w-4 h-4" />
                      <span>{currentCalling.riderId}</span>
                      <span className="text-slate-300">|</span>
                      <span>{currentCalling.packageName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span>叫号时间: {currentCalling.calledAt?.slice(11) || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-600 text-white text-sm font-semibold shadow-md">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    窗口 {currentCalling.windowNo || 1}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">暂无叫号</p>
                <p className="text-sm text-slate-400 mt-1">等待下一位骑手</p>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                等待人数: <span className="font-semibold text-slate-700">{queueStats.totalWaiting}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                平均等待: <span className="font-semibold text-slate-700">{queueStats.avgWaitTime}分钟</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
