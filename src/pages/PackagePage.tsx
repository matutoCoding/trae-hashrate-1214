import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Form, Input, InputNumber, message } from 'antd';
import {
  Home,
  ChevronRight,
  Plus,
  Package,
  Zap,
  AlertTriangle,
  Wallet,
  Crown,
  Edit3,
  Trash2,
  Users,
  BarChart3,
  TrendingUp,
  DollarSign,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { useUserStore } from '@/store/userStore';
import type { PricingPackage, Rider } from '@/types';
import { formatCurrency } from '@/utils/pricingUtils';

const PACKAGE_GRADIENTS: Record<string, string> = {
  '基础套餐': 'from-cyan-500 via-teal-500 to-emerald-600',
  '标准套餐': 'from-blue-500 via-indigo-500 to-purple-600',
  '尊享VIP套餐': 'from-orange-500 via-rose-500 to-purple-600',
};

const PACKAGE_BAR_COLORS = ['#14B8A6', '#6366F1', '#F97316'];

const getPackageGradient = (name: string) => {
  return PACKAGE_GRADIENTS[name] || 'from-slate-500 to-slate-700';
};

interface PackageCardProps {
  pkg: PricingPackage;
  subscriberCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onViewRiders: () => void;
}

function PackageCard({
  pkg,
  subscriberCount,
  onEdit,
  onDelete,
  onViewRiders,
}: PackageCardProps) {
  const gradient = getPackageGradient(pkg.name);
  const isVip = pkg.name.includes('VIP');
  const isBasic = pkg.name.includes('基础');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className={`stat-card p-0 overflow-hidden bg-gradient-to-br ${gradient} text-white relative group`}
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 transition-transform duration-500 group-hover:scale-125" />
      <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-14 -translate-x-14 transition-transform duration-500 group-hover:scale-125" />

      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              {isVip ? (
                <Crown className="w-6 h-6" />
              ) : isBasic ? (
                <Package className="w-6 h-6" />
              ) : (
                <Zap className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">{pkg.name}</h3>
              <p className="text-white/70 text-xs mt-0.5 max-w-[200px] truncate">
                {pkg.description || '换电服务套餐'}
              </p>
            </div>
          </div>
          {isVip && (
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold flex items-center gap-1">
              <Crown className="w-3 h-3" />
              推荐
            </span>
          )}
        </div>

        <div className="mb-5">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-sm text-white/70">月费</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black tracking-tight">¥{pkg.monthlyFee}</span>
            <span className="text-white/70 text-sm">/月</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl bg-white/10 backdrop-blur p-3">
            <div className="flex items-center gap-1.5 text-white/70 text-xs mb-1">
              <Zap className="w-3.5 h-3.5" />
              月换电次数
            </div>
            <div className="text-xl font-bold">{pkg.swapCount}<span className="text-sm font-normal text-white/70 ml-1">次</span></div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur p-3">
            <div className="flex items-center gap-1.5 text-white/70 text-xs mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              加急配额
            </div>
            <div className="text-xl font-bold">{pkg.urgentQuota}<span className="text-sm font-normal text-white/70 ml-1">次</span></div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur p-3">
            <div className="flex items-center gap-1.5 text-white/70 text-xs mb-1">
              <Wallet className="w-3.5 h-3.5" />
              押金
            </div>
            <div className="text-xl font-bold">¥{pkg.deposit}</div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur p-3">
            <div className="flex items-center gap-1.5 text-white/70 text-xs mb-1">
              <RefreshCw className="w-3.5 h-3.5" />
              超次单价
            </div>
            <div className="text-xl font-bold">¥{pkg.perSwapFee}<span className="text-sm font-normal text-white/70 ml-1">/次</span></div>
          </div>
        </div>

        <div className="rounded-xl bg-white/10 backdrop-blur p-3 mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-white/70 text-xs mb-0.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              加急费单价
            </div>
            <div className="text-lg font-bold">¥{pkg.urgentFee}<span className="text-sm font-normal text-white/70 ml-1">/次</span></div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-white/70 text-xs mb-0.5 justify-end">
              <Users className="w-3.5 h-3.5" />
              订阅人数
            </div>
            <div className="text-lg font-bold flex items-center gap-1 justify-end">
              <Check className="w-4 h-4 text-emerald-200" />
              {subscriberCount}<span className="text-sm font-normal text-white/70 ml-1">人</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/15">
          <button
            onClick={onEdit}
            className="py-2 px-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur text-sm font-medium transition-all duration-300 active:scale-95 inline-flex items-center justify-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            编辑
          </button>
          <button
            onClick={onDelete}
            className="py-2 px-3 rounded-full bg-white/10 hover:bg-red-500/80 backdrop-blur text-sm font-medium transition-all duration-300 active:scale-95 inline-flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            删除
          </button>
          <button
            onClick={onViewRiders}
            className="py-2 px-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur text-sm font-medium transition-all duration-300 active:scale-95 inline-flex items-center justify-center gap-1"
          >
            <Users className="w-3.5 h-3.5" />
            骑手
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface RidersModalProps {
  open: boolean;
  onClose: () => void;
  riders: Rider[];
  packageName: string;
}

function RidersModal({ open, onClose, riders, packageName }: RidersModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-600" />
          <span>{packageName} - 订阅骑手列表</span>
          <span className="badge bg-primary-100 text-primary-700 border border-primary-200 ml-2">
            {riders.length} 人
          </span>
        </div>
      }
      footer={null}
      width={600}
    >
      {riders.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>暂无订阅骑手</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
          {riders.map((rider, idx) => (
            <div
              key={rider.riderId}
              className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  rider.level === 'VIP'
                    ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                    : 'bg-gradient-to-br from-cyan-500 to-teal-600'
                }`}
              >
                {rider.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-slate-800">{rider.name}</span>
                  <span
                    className={`badge ${
                      rider.level === 'VIP'
                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                        : 'bg-cyan-100 text-cyan-700 border-cyan-200'
                    }`}
                  >
                    {rider.level === 'VIP' ? 'VIP' : '普通'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">{rider.riderId} · {rider.phone}</div>
              </div>
              <div className="text-right text-xs">
                <div className="text-slate-500">换电 {rider.swapUsed} 次</div>
                <div className="text-slate-500 mt-0.5">加急剩 {rider.urgentCount} 次</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function PackagePage() {
  const {
    packages,
    riders,
    addPackage,
    updatePackage,
    getPackageRevenue,
  } = useUserStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PricingPackage | null>(null);
  const [ridersModalOpen, setRidersModalOpen] = useState(false);
  const [viewingPackage, setViewingPackage] = useState<PricingPackage | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const revenueData = useMemo(() => getPackageRevenue(), [getPackageRevenue]);

  const subscriptionData = useMemo(() => {
    return packages.map((pkg) => ({
      name: pkg.name,
      订阅人数: riders.filter((r) => r.packageId === pkg.packageId).length,
    }));
  }, [packages, riders]);

  const totalRevenue = useMemo(
    () => revenueData.reduce((sum, r) => sum + r.value, 0),
    [revenueData]
  );

  const getSubscriberCount = (packageId: string) => {
    return riders.filter((r) => r.packageId === packageId).length;
  };

  const getPackageRiders = (packageId: string) => {
    return riders.filter((r) => r.packageId === packageId);
  };

  const handleAdd = () => {
    setEditingPackage(null);
    form.resetFields();
    form.setFieldsValue({
      name: '',
      monthlyFee: 299,
      swapCount: 30,
      urgentQuota: 2,
      deposit: 500,
      perSwapFee: 15,
      urgentFee: 20,
      description: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (pkg: PricingPackage) => {
    setEditingPackage(pkg);
    form.setFieldsValue({
      name: pkg.name,
      monthlyFee: pkg.monthlyFee,
      swapCount: pkg.swapCount,
      urgentQuota: pkg.urgentQuota,
      deposit: pkg.deposit,
      perSwapFee: pkg.perSwapFee,
      urgentFee: pkg.urgentFee,
      description: pkg.description,
    });
    setModalOpen(true);
  };

  const handleDelete = (pkg: PricingPackage) => {
    Modal.confirm({
      title: '确认删除套餐',
      icon: <Trash2 className="w-5 h-5 text-red-500" />,
      content: `确定要删除套餐「${pkg.name}」吗？此操作不可恢复。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        const count = getSubscriberCount(pkg.packageId);
        if (count > 0) {
          messageApi.error(`该套餐下还有 ${count} 名订阅骑手，无法删除`);
          return;
        }
        updatePackage(pkg.packageId, { name: pkg.name + '(已删除)' } as any);
        messageApi.success('套餐已删除');
      },
    });
  };

  const handleViewRiders = (pkg: PricingPackage) => {
    setViewingPackage(pkg);
    setRidersModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingPackage) {
        updatePackage(editingPackage.packageId, values);
        messageApi.success('套餐更新成功');
      } else {
        addPackage(values);
        messageApi.success('套餐创建成功');
      }
      setModalOpen(false);
    } catch (e) {
      // validation error
    }
  };

  return (
    <div className="p-6 space-y-6">
      {contextHolder}

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
            <span>会员管理</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-primary-700 font-medium">套餐月费管理</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-primary-500 to-primary-700 rounded-full" />
            套餐月费管理
          </h1>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增套餐
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="stat-card"
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              月度营收统计
            </h3>
            <p className="text-sm text-slate-500 mt-1">各套餐订阅收入对比</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">本月预计营收</div>
              <div className="flex items-baseline gap-1">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span className="text-3xl font-black text-slate-800">
                  {formatCurrency(totalRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                {revenueData.map((_, idx) => (
                  <linearGradient key={idx} id={`revenueGradient${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PACKAGE_BAR_COLORS[idx % PACKAGE_BAR_COLORS.length]} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={PACKAGE_BAR_COLORS[idx % PACKAGE_BAR_COLORS.length]} stopOpacity={0.3} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 13 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dx={-5}
                tickFormatter={(v) => `¥${v}`}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  padding: '12px 16px',
                }}
                labelStyle={{ color: '#1e293b', fontWeight: 600, marginBottom: 6 }}
                formatter={(value: number) => [formatCurrency(value), '月营收']}
              />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                maxBarSize={80}
              >
                {revenueData.map((_, idx) => (
                  <Cell key={idx} fill={`url(#revenueGradient${idx})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div>
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
          <Package className="w-5 h-5 text-primary-600" />
          套餐列表
          <span className="badge bg-slate-100 text-slate-600 border border-slate-200 ml-1">
            共 {packages.length} 个套餐
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {packages.map((pkg, idx) => (
              <motion.div
                key={pkg.packageId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
              >
                <PackageCard
                  pkg={pkg}
                  subscriberCount={getSubscriberCount(pkg.packageId)}
                  onEdit={() => handleEdit(pkg)}
                  onDelete={() => handleDelete(pkg)}
                  onViewRiders={() => handleViewRiders(pkg)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="stat-card"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              套餐订阅分布
            </h3>
            <p className="text-sm text-slate-500 mt-1">各套餐订阅骑手数量对比</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500">总订阅骑手: </span>
            <span className="font-bold text-slate-800">{riders.length} 人</span>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subscriptionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                {subscriptionData.map((_, idx) => (
                  <linearGradient key={idx} id={`subGradient${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PACKAGE_BAR_COLORS[idx % PACKAGE_BAR_COLORS.length]} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={PACKAGE_BAR_COLORS[idx % PACKAGE_BAR_COLORS.length]} stopOpacity={0.3} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 13 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dx={-5}
                allowDecimals={false}
                tickFormatter={(v) => `${v}人`}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  padding: '12px 16px',
                }}
                labelStyle={{ color: '#1e293b', fontWeight: 600, marginBottom: 6 }}
                formatter={(value: number) => [`${value} 人`, '订阅人数']}
              />
              <Legend
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }}
                formatter={(value: string) => <span className="text-slate-600">{value}</span>}
              />
              <Bar
                dataKey="订阅人数"
                radius={[8, 8, 0, 0]}
                maxBarSize={80}
                label={{
                  position: 'top',
                  fill: '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                  formatter: (v: number) => `${v}人`,
                }}
              >
                {subscriptionData.map((_, idx) => (
                  <Cell key={idx} fill={`url(#subGradient${idx})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            {editingPackage ? (
              <Edit3 className="w-5 h-5 text-primary-600" />
            ) : (
              <Plus className="w-5 h-5 text-primary-600" />
            )}
            <span>{editingPackage ? '编辑套餐' : '新增套餐'}</span>
          </div>
        }
        onOk={handleSubmit}
        okText={editingPackage ? '保存修改' : '创建套餐'}
        okButtonProps={{ className: 'btn-primary !px-6' }}
        cancelButtonProps={{ className: 'rounded-full !px-6' }}
        width={640}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
          initialValues={{
            monthlyFee: 299,
            swapCount: 30,
            urgentQuota: 2,
            deposit: 500,
            perSwapFee: 15,
            urgentFee: 20,
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="套餐名称"
              name="name"
              rules={[{ required: true, message: '请输入套餐名称' }]}
              className="col-span-2"
            >
              <Input
                size="large"
                placeholder="如：基础套餐、标准套餐、VIP套餐等"
                className="!rounded-xl"
                prefix={<Package className="w-4 h-4 text-slate-400" />}
              />
            </Form.Item>

            <Form.Item
              label="月费 (元)"
              name="monthlyFee"
              rules={[{ required: true, message: '请输入月费' }]}
            >
              <InputNumber
                size="large"
                min={0}
                className="!w-full !rounded-xl"
                prefix="¥"
                placeholder="299"
              />
            </Form.Item>

            <Form.Item
              label="押金 (元)"
              name="deposit"
              rules={[{ required: true, message: '请输入押金' }]}
            >
              <InputNumber
                size="large"
                min={0}
                className="!w-full !rounded-xl"
                prefix="¥"
                placeholder="500"
              />
            </Form.Item>

            <Form.Item
              label="月换电次数"
              name="swapCount"
              rules={[{ required: true, message: '请输入换电次数' }]}
            >
              <InputNumber
                size="large"
                min={0}
                className="!w-full !rounded-xl"
                addonAfter="次"
                placeholder="30"
              />
            </Form.Item>

            <Form.Item
              label="加急配额"
              name="urgentQuota"
              rules={[{ required: true, message: '请输入加急配额' }]}
            >
              <InputNumber
                size="large"
                min={0}
                className="!w-full !rounded-xl"
                addonAfter="次"
                placeholder="2"
              />
            </Form.Item>

            <Form.Item
              label="超次单价 (元)"
              name="perSwapFee"
              rules={[{ required: true, message: '请输入超次单价' }]}
            >
              <InputNumber
                size="large"
                min={0}
                className="!w-full !rounded-xl"
                prefix="¥"
                addonAfter="/次"
                placeholder="15"
              />
            </Form.Item>

            <Form.Item
              label="加急费单价 (元)"
              name="urgentFee"
              rules={[{ required: true, message: '请输入加急费单价' }]}
            >
              <InputNumber
                size="large"
                min={0}
                className="!w-full !rounded-xl"
                prefix="¥"
                addonAfter="/次"
                placeholder="20"
              />
            </Form.Item>
          </div>

          <Form.Item
            label="套餐描述"
            name="description"
          >
            <Input.TextArea
              size="large"
              rows={3}
              placeholder="套餐说明、适用人群、权益说明等"
              className="!rounded-xl resize-none"
              showCount
              maxLength={200}
            />
          </Form.Item>
        </Form>
      </Modal>

      {viewingPackage && (
        <RidersModal
          open={ridersModalOpen}
          onClose={() => setRidersModalOpen(false)}
          riders={getPackageRiders(viewingPackage.packageId)}
          packageName={viewingPackage.name}
        />
      )}
    </div>
  );
}
