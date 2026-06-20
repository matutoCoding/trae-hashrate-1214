import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Phone,
  CreditCard,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Clock,
  Users,
  QrCode,
  AlertCircle,
  Zap,
  Crown,
  CircleCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { usePriorityQueue } from '@/hooks/usePriorityQueue';
import { useUserStore } from '@/store/userStore';
import type { QueueType, PricingPackage, QueueTicket } from '@/types';

type Step = 1 | 2 | 3 | 4 | 'success';

interface FormData {
  name: string;
  phone: string;
  riderId: string;
  selectedPackage: PricingPackage | null;
  queueType: QueueType;
}

const maskPhone = (phone: string) => {
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
};

export default function TicketPage() {
  const { takeTicket, getTicketPosition } = usePriorityQueue();
  const { packages, riders, getRiderById } = useUserStore();

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    riderId: '',
    selectedPackage: null,
    queueType: 'NORMAL',
  });
  const [createdTicket, setCreatedTicket] = useState<QueueTicket | null>(null);
  const [ticketPosition, setTicketPosition] = useState<{
    position: number;
    waitTime: number;
  } | null>(null);

  const isVIPPackage = formData.selectedPackage?.packageId === 'PKG003';

  const currentRiderData = useMemo(() => {
    if (!formData.riderId.trim()) return null;
    return getRiderById(formData.riderId.trim()) || null;
  }, [formData.riderId, getRiderById]);

  const riderUrgentRemaining = useMemo(() => {
    if (!currentRiderData || !formData.selectedPackage) return null;
    return currentRiderData.urgentCount;
  }, [currentRiderData, formData.selectedPackage]);

  const handleRiderIdBlur = () => {
    if (formData.riderId.trim()) {
      const rider = getRiderById(formData.riderId.trim());
      if (rider) {
        const riderPkg = packages.find((p) => p.packageId === rider.packageId);
        setFormData((prev) => ({
          ...prev,
          name: rider.name,
          phone: rider.phone,
          selectedPackage: riderPkg || prev.selectedPackage,
        }));
      }
    }
  };

  const canProceedToStep2 =
    formData.name.trim() && formData.phone.trim().length >= 11;
  const canProceedToStep3 = formData.selectedPackage !== null;
  const canProceedToStep4 = formData.queueType !== undefined;

  const handleConfirm = () => {
    if (!formData.selectedPackage) return;
    const ticket = takeTicket(
      {
        name: formData.name.trim(),
        phone: maskPhone(formData.phone.trim()),
        riderId: formData.riderId.trim() || undefined,
      },
      formData.queueType,
      formData.selectedPackage.name
    );
    setCreatedTicket(ticket);
    setTimeout(() => {
      setTicketPosition(getTicketPosition(ticket.ticketId));
    }, 50);
    setStep('success');
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      name: '',
      phone: '',
      riderId: '',
      selectedPackage: null,
      queueType: 'NORMAL',
    });
    setCreatedTicket(null);
    setTicketPosition(null);
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
          <User className="w-4 h-4 text-primary-600" />
          骑手姓名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="请输入姓名"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
          <Phone className="w-4 h-4 text-primary-600" />
          手机号码 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          className="input-field"
          placeholder="请输入11位手机号"
          maxLength={11}
          value={formData.phone}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              phone: e.target.value.replace(/\D/g, ''),
            }))
          }
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
          <CreditCard className="w-4 h-4 text-primary-600" />
          骑手ID <span className="text-slate-400">(老用户可填)</span>
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="输入骑手ID自动填充信息"
          value={formData.riderId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, riderId: e.target.value }))
          }
          onBlur={handleRiderIdBlur}
        />
        <p className="text-xs text-slate-400 mt-1">
          老用户示例ID: {riders.slice(0, 3).map((r) => r.riderId).join('、')}
        </p>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {packages.map((pkg, idx) => {
        const isSelected = formData.selectedPackage?.packageId === pkg.packageId;
        const gradients = [
          'from-slate-500 to-slate-700',
          'from-blue-500 to-indigo-600',
          'from-amber-500 to-orange-600',
        ];
        const icons = [
          <CreditCard key="1" className="w-5 h-5" />,
          <Sparkles key="2" className="w-5 h-5" />,
          <Crown key="3" className="w-5 h-5" />,
        ];
        return (
          <motion.div
            key={pkg.packageId}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              setFormData((prev) => ({ ...prev, selectedPackage: pkg }))
            }
            className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 ${
              isSelected
                ? 'border-primary-500 shadow-lg shadow-primary-200 bg-primary-50/50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[idx]} text-white flex items-center justify-center shadow-md flex-shrink-0`}
              >
                {icons[idx]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-800">
                    {pkg.name}
                  </h3>
                  <div className="text-right flex-shrink-0">
                    <span className="text-2xl font-bold text-primary-600">
                      ¥{pkg.monthlyFee}
                    </span>
                    <span className="text-xs text-slate-400">/月</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-1">{pkg.description}</p>
                <div className="flex gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Zap className="w-3.5 h-3.5 text-cyan-500" />
                    换电 {pkg.swapCount}次
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
                    加急 {pkg.urgentQuota}次
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setFormData((prev) => ({ ...prev, queueType: 'NORMAL' }))}
        className={`w-full p-5 rounded-2xl text-left transition-all duration-300 border-2 ${
          formData.queueType === 'NORMAL'
            ? 'bg-gradient-to-r from-cyan-50 to-teal-50 border-cyan-500 shadow-lg shadow-cyan-100'
            : 'bg-white border-slate-200 hover:border-cyan-300'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              formData.queueType === 'NORMAL'
                ? 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white'
                : 'bg-cyan-100 text-cyan-600'
            }`}
          >
            <Users className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">普通取号</h3>
              {formData.queueType === 'NORMAL' && (
                <CircleCheck className="w-6 h-6 text-cyan-500" />
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              标准排队，按先后顺序服务
            </p>
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs font-medium">
              免费
            </div>
          </div>
        </div>
      </motion.button>

      <motion.button
        whileHover={{ scale: isVIPPackage ? 1.02 : 1 }}
        whileTap={{ scale: isVIPPackage ? 0.98 : 1 }}
        onClick={() => {
          if (isVIPPackage) {
            setFormData((prev) => ({ ...prev, queueType: 'VIP' }));
          }
        }}
        disabled={!isVIPPackage}
        className={`w-full p-5 rounded-2xl text-left transition-all duration-300 border-2 relative overflow-hidden ${
          !isVIPPackage
            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
            : formData.queueType === 'VIP'
              ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-500 shadow-lg shadow-orange-100'
              : 'bg-white border-slate-200 hover:border-orange-300'
        }`}
      >
        {!isVIPPackage && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5 backdrop-blur-[1px] z-10 rounded-2xl">
            <div className="bg-white/95 px-4 py-2 rounded-full text-sm font-medium text-slate-600 shadow">
              需选择尊享VIP套餐
            </div>
          </div>
        )}
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              formData.queueType === 'VIP'
                ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white'
                : 'bg-orange-100 text-orange-600'
            }`}
          >
            <Crown className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">VIP通道</h3>
              {formData.queueType === 'VIP' && (
                <CircleCheck className="w-6 h-6 text-orange-500" />
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              专属绿色通道，优先安排服务
            </p>
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
              VIP套餐专享
            </div>
          </div>
        </div>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() =>
          setFormData((prev) => ({ ...prev, queueType: 'URGENT' }))
        }
        className={`w-full p-5 rounded-2xl text-left transition-all duration-300 border-2 ${
          formData.queueType === 'URGENT'
            ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-500 shadow-lg shadow-red-100'
            : 'bg-white border-slate-200 hover:border-red-300'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              formData.queueType === 'URGENT'
                ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
                : 'bg-red-100 text-red-600'
            }`}
          >
            <Zap className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">加急取号</h3>
              {formData.queueType === 'URGENT' && (
                <CircleCheck className="w-6 h-6 text-red-500" />
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              立即插队至最前，无需等待
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                {riderUrgentRemaining !== null && riderUrgentRemaining > 0
                  ? `扣减1次加急配额（剩余${riderUrgentRemaining}次）`
                  : `+¥${formData.selectedPackage?.urgentFee} 加急费（无配额）`}
              </span>
              {riderUrgentRemaining !== null ? (
                <span className="text-xs text-slate-500">
                  骑手当前剩余加急次数: {riderUrgentRemaining}次 / 套餐总额: {formData.selectedPackage?.urgentQuota}次
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  套餐加急额度: {formData.selectedPackage?.urgentQuota}次（输入骑手ID可查看实际剩余）
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );

  const estimatedCost = () => {
    if (!formData.selectedPackage) return 0;
    let cost = formData.selectedPackage.perSwapFee;
    if (formData.queueType === 'URGENT') {
      if (riderUrgentRemaining === null || riderUrgentRemaining <= 0) {
        cost += formData.selectedPackage.urgentFee;
      }
    }
    return cost;
  };

  const queueTypeLabel = (type: QueueType) => {
    switch (type) {
      case 'URGENT':
        return { text: '加急取号', color: 'bg-red-100 text-red-700' };
      case 'VIP':
        return { text: 'VIP通道', color: 'bg-orange-100 text-orange-700' };
      default:
        return { text: '普通取号', color: 'bg-cyan-100 text-cyan-700' };
    }
  };

  const renderStep4 = () => {
    const typeLabel = queueTypeLabel(formData.queueType);
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-5"
      >
        <div className="bg-gradient-to-br from-primary-50 to-cyan-50 rounded-2xl p-5 border border-primary-100">
          <h3 className="text-center text-lg font-bold text-primary-700 mb-4 flex items-center justify-center gap-2">
            <Check className="w-5 h-5" />
            确认取号信息
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-primary-100/50">
              <span className="text-slate-600 text-sm">骑手姓名</span>
              <span className="font-semibold text-slate-800">
                {formData.name}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-primary-100/50">
              <span className="text-slate-600 text-sm">手机号码</span>
              <span className="font-semibold text-slate-800">
                {maskPhone(formData.phone)}
              </span>
            </div>
            {formData.riderId && (
              <div className="flex justify-between items-center py-2 border-b border-primary-100/50">
                <span className="text-slate-600 text-sm">骑手ID</span>
                <span className="font-semibold text-slate-800">
                  {formData.riderId}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-primary-100/50">
              <span className="text-slate-600 text-sm">选择套餐</span>
              <span className="font-semibold text-slate-800">
                {formData.selectedPackage?.name}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-primary-100/50">
              <span className="text-slate-600 text-sm">排队类型</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${typeLabel.color}`}
              >
                {typeLabel.text}
              </span>
            </div>
            {formData.queueType === 'URGENT' && (
              <div className="py-2 px-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    加急费用说明
                  </span>
                </div>
                <p className="text-xs text-red-500 mt-2">
                  {riderUrgentRemaining !== null && riderUrgentRemaining > 0
                    ? `本次加急将扣减1次加急配额（剩余${riderUrgentRemaining}次），不收取加急费`
                    : `骑手加急配额已用完，本次加急将收取加急费 ¥${formData.selectedPackage?.urgentFee ?? 0}`}
                </p>
              </div>
            )}
            <div className="pt-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">预计费用</span>
                <div className="text-right">
                  <span className="text-3xl font-bold text-primary-600">
                    ¥{estimatedCost()}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">/次</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-1 text-right">
                换电费 ¥{formData.selectedPackage?.perSwapFee || 0}
                {formData.queueType === 'URGENT' &&
                  (riderUrgentRemaining !== null && riderUrgentRemaining > 0
                    ? ' + 加急配额扣减（不收费）'
                    : ` + 加急费 ¥${formData.selectedPackage?.urgentFee || 0}`)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSuccess = () => {
    const typeLabel = createdTicket
      ? queueTypeLabel(createdTicket.queueType)
      : null;
    const ticketNumber = createdTicket?.ticketId.slice(-4) || '----';
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-5"
      >
        <motion.div
          initial={{ rotateY: -90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{
            delay: 0.2,
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
          className="relative mx-auto w-64"
        >
          <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-cyan-500 rounded-3xl p-1 shadow-2xl shadow-primary-300">
            <div className="bg-gradient-to-br from-primary-700 to-cyan-700 rounded-3xl p-8 text-white text-center">
              <div className="text-sm font-medium text-white/70 mb-2">
                您的取号码
              </div>
              <div className="text-7xl font-black tracking-wider py-2 leading-none drop-shadow-lg">
                {ticketNumber}
              </div>
              {typeLabel && (
                <div className="mt-3 inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium">
                  {typeLabel.text}
                </div>
              )}
            </div>
          </div>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Ticket className="w-8 h-8 text-primary-400 drop-shadow" />
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-100 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {ticketPosition?.position ?? '--'}
            </div>
            <div className="text-xs text-slate-500 mt-1">前面等待</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-orange-100 flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {ticketPosition?.waitTime ?? '--'}
              <span className="text-sm font-normal text-slate-500 ml-0.5">
                分钟
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">预计等待</div>
          </motion.div>
        </div>

        {createdTicket?.queueType === 'URGENT' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className={`rounded-2xl p-4 shadow-sm border ${
              createdTicket.urgentQuotaUsed
                ? 'bg-emerald-50 border-emerald-100'
                : 'bg-red-50 border-red-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                createdTicket.urgentQuotaUsed ? 'bg-emerald-100' : 'bg-red-100'
              }`}>
                {createdTicket.urgentQuotaUsed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <div className={`font-semibold text-sm ${
                  createdTicket.urgentQuotaUsed ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {createdTicket.urgentQuotaUsed
                    ? '加急配额抵扣'
                    : '加急服务收费'}
                </div>
                <div className={`text-xs mt-0.5 ${
                  createdTicket.urgentQuotaUsed ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {createdTicket.urgentQuotaUsed
                    ? `已使用加急配额 1 次，无需支付加急费`
                    : `加急费 ¥${createdTicket.urgentFeeAmount || 0}，换电时一并结算`}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
        >
          <div className="text-center text-sm text-slate-500 mb-3">
            请出示此二维码到窗口
          </div>
          <div className="w-36 h-36 mx-auto bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
            <div className="text-center">
              <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-xs text-slate-400 mt-2">二维码占位</div>
            </div>
          </div>
          <div className="text-center text-xs text-slate-400 mt-4">
            取号时间: {createdTicket?.createdAt}
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={resetForm}
          className="btn-outline w-full"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          继续取号
        </motion.button>
      </motion.div>
    );
  };

  const stepTitles: Record<Exclude<Step, 'success'>, string> = {
    1: 'Step 1 骑手信息',
    2: 'Step 2 套餐选择',
    3: 'Step 3 类型选择',
    4: 'Step 4 确认取号',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-cyan-50 py-6 px-4 flex items-start justify-center">
      <div className="w-full max-w-md">
        {step !== 'success' ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-primary-200 mb-4">
                <Ticket className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">
                骑手取号登记
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                请填写以下信息完成取号
              </p>
            </motion.div>

            <div className="flex justify-center gap-2 mb-5">
              {([1, 2, 3, 4] as const).map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    typeof step === 'number' && s === step
                      ? 'w-8 bg-primary-500'
                      : typeof step === 'number' && s < step
                        ? 'w-6 bg-primary-300'
                        : 'w-6 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-6">
              {typeof step === 'number' && step < 4 && (
                <h2 className="text-base font-semibold text-slate-700 mb-5 pb-3 border-b border-slate-100">
                  {stepTitles[step]}
                </h2>
              )}
              <AnimatePresence mode="wait">
                {step === 1 && <div key="s1">{renderStep1()}</div>}
                {step === 2 && <div key="s2">{renderStep2()}</div>}
                {step === 3 && <div key="s3">{renderStep3()}</div>}
                {step === 4 && <div key="s4">{renderStep4()}</div>}
              </AnimatePresence>

              {typeof step === 'number' && (
                <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
                  {step > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep((s) => (typeof s === 'number' ? ((s - 1) as Step) : s))}
                      className="btn-outline flex-1 flex items-center justify-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      上一步
                    </motion.button>
                  )}
                  {step < 4 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep((s) => (typeof s === 'number' ? ((s + 1) as Step) : s))}
                      disabled={
                        (step === 1 && !canProceedToStep2) ||
                        (step === 2 && !canProceedToStep3) ||
                        (step === 3 && !canProceedToStep4)
                      }
                      className="btn-primary flex-1 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
                    >
                      下一步
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirm}
                      className="btn-success flex-1 flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      确认取号
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="pt-2">
            {renderSuccess()}
          </div>
        )}
      </div>
    </div>
  );
}
