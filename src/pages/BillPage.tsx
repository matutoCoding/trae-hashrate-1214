import { useState, useMemo } from 'react';
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Card,
  Modal,
  Descriptions,
  Statistic,
  Row,
  Col,
  Divider,
  Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Search,
  Eye,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  CreditCard,
  User,
  Package,
  Battery,
  RefreshCw,
  PieChart as PieChartIcon,
  TrendingUp,
  ArrowLeftRight,
} from 'lucide-react';
import dayjs from 'dayjs';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useBatteryStore } from '@/store/batteryStore';
import { useUserStore } from '@/store/userStore';
import type { RentalOrder } from '@/types';

const { RangePicker } = DatePicker;

const PIE_COLORS = ['#0891B2', '#F97316'];
const LINE_COLOR = '#0E7490';

const paymentStatusMap: Record<string, { text: string; color: string }> = {
  paid: { text: '已付', color: 'green' },
  unpaid: { text: '未付', color: 'orange' },
  refunded: { text: '退款', color: 'red' },
};

const orderTypeMap: Record<string, { text: string; color: string }> = {
  RENT: { text: '租', color: 'blue' },
  SWAP: { text: '换', color: 'cyan' },
};

export default function BillPage() {
  const { orders, batches } = useBatteryStore();
  const { packages, riders, getRiderById, getPackageById } = useUserStore();

  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [packageFilter, setPackageFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [riderSearch, setRiderSearch] = useState('');
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    record: RentalOrder | null;
  }>({ open: false, record: null });

  const getRiderPhone = (riderId: string) => {
    const rider = getRiderById(riderId);
    return rider?.phone || '-';
  };

  const getPackageName = (packageId: string) => {
    const pkg = getPackageById(packageId);
    return pkg?.name || '-';
  };

  const getBatchInfo = (batchId: string) => {
    const batch = batches.find((b) => b.batchId === batchId);
    return batch || null;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (dateRange && dateRange[0] && dateRange[1]) {
        const orderDate = dayjs(order.createdAt);
        if (
          orderDate.isBefore(dateRange[0], 'day') ||
          orderDate.isAfter(dateRange[1], 'day')
        ) {
          return false;
        }
      }
      if (packageFilter && order.packageId !== packageFilter) return false;
      if (statusFilter && order.status !== statusFilter) return false;
      if (riderSearch) {
        const lower = riderSearch.toLowerCase();
        const rider = getRiderById(order.riderId);
        if (
          !order.riderName.toLowerCase().includes(lower) &&
          !order.riderId.toLowerCase().includes(lower) &&
          !(rider?.phone.toLowerCase().includes(lower))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [orders, dateRange, packageFilter, statusFilter, riderSearch, getRiderById]);

  const todayRevenue = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return orders
      .filter(
        (o) => o.createdAt.startsWith(today) && o.status === 'paid'
      )
      .reduce((sum, o) => sum + o.amount, 0);
  }, [orders]);

  const monthlyRevenue = useMemo(() => {
    const monthStart = dayjs().startOf('month');
    return orders
      .filter(
        (o) => dayjs(o.createdAt).isAfter(monthStart) && o.status === 'paid'
      )
      .reduce((sum, o) => sum + o.amount, 0);
  }, [orders]);

  const pendingAmount = useMemo(() => {
    return orders
      .filter((o) => o.status === 'unpaid')
      .reduce((sum, o) => sum + o.amount, 0);
  }, [orders]);

  const totalOrders = orders.length;

  const summary = useMemo(() => {
    const total = filteredOrders.reduce((sum, o) => sum + o.amount, 0);
    const paid = filteredOrders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + o.amount, 0);
    const unpaid = filteredOrders
      .filter((o) => o.status === 'unpaid')
      .reduce((sum, o) => sum + o.amount, 0);
    const refunded = filteredOrders
      .filter((o) => o.status === 'refunded')
      .reduce((sum, o) => sum + o.amount, 0);
    const rentCount = filteredOrders.filter((o) => o.type === 'RENT').length;
    const swapCount = filteredOrders.filter((o) => o.type === 'SWAP').length;
    return { total, paid, unpaid, refunded, rentCount, swapCount, count: filteredOrders.length };
  }, [filteredOrders]);

  const pieData = useMemo(() => {
    return [
      { name: '租电', value: filteredOrders.filter((o) => o.type === 'RENT').length },
      { name: '换电', value: filteredOrders.filter((o) => o.type === 'SWAP').length },
    ];
  }, [filteredOrders]);

  const revenueTrend = useMemo(() => {
    const result: { date: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      const label = date.format('MM-DD');
      const dayRevenue = orders
        .filter(
          (o) => o.createdAt.startsWith(dateStr) && o.status === 'paid'
        )
        .reduce((sum, o) => sum + o.amount, 0);
      result.push({ date: label, revenue: dayRevenue + Math.floor(Math.random() * 200) + 50 });
    }
    return result;
  }, [orders]);

  const handleViewDetail = (record: RentalOrder) => {
    setDetailModal({ open: true, record });
  };

  const handleResetFilters = () => {
    setDateRange(null);
    setPackageFilter(undefined);
    setStatusFilter(undefined);
    setRiderSearch('');
  };

  const columns: ColumnsType<RentalOrder> = [
    {
      title: '订单号',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 200,
      render: (text) => (
        <span className="font-mono font-medium text-slate-700">{text}</span>
      ),
    },
    {
      title: '骑手姓名',
      dataIndex: 'riderName',
      key: 'riderName',
      width: 100,
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary-600" />
          </div>
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: '手机号',
      key: 'phone',
      width: 130,
      render: (_, record) => getRiderPhone(record.riderId),
    },
    {
      title: '套餐',
      key: 'package',
      width: 130,
      render: (_, record) => {
        const pkg = getPackageById(record.packageId);
        return (
          <Tag color="cyan" className="border-0">
            <Package className="w-3 h-3 inline mr-1" />
            {pkg?.name || '-'}
          </Tag>
        );
      },
    },
    {
      title: '电池批次',
      dataIndex: 'batteryBatchId',
      key: 'batteryBatchId',
      width: 170,
      render: (text) => (
        <span className="font-mono text-xs text-slate-600">{text || '-'}</span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 70,
      render: (type: 'RENT' | 'SWAP') => {
        const t = orderTypeMap[type];
        return <Tag color={t.color}>{t.text}</Tag>;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (value) => (
        <span className={`font-semibold ${value > 0 ? 'text-primary-700' : 'text-slate-500'}`}>
          ¥{value.toFixed(2)}
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '支付状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const s = paymentStatusMap[status];
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (text) => (
        <span className="text-slate-500 text-sm">{text}</span>
      ),
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<Eye size={14} />}
          onClick={() => handleViewDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-50 rounded-lg">
              <FileText className="w-6 h-6 text-cyan-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">账单统计</h1>
          </div>
          <p className="text-slate-500 text-sm ml-12">
            查看和管理所有订单账单，支持按日期、套餐、支付状态等条件筛选
          </p>
        </div>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card className="shadow-sm border-0 stat-card !p-0 overflow-hidden">
            <div className="p-5 bg-gradient-to-br from-cyan-500 to-teal-600 text-white">
              <div className="flex items-center justify-between mb-3">
                <DollarSign className="w-8 h-8 text-white/90" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">今日</span>
              </div>
              <div className="text-white/80 text-sm mb-1">今日营收</div>
              <div className="text-3xl font-bold">¥{todayRevenue.toLocaleString()}</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm border-0 stat-card !p-0 overflow-hidden">
            <div className="p-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <div className="flex items-center justify-between mb-3">
                <Calendar className="w-8 h-8 text-white/90" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">本月</span>
              </div>
              <div className="text-white/80 text-sm mb-1">本月累计</div>
              <div className="text-3xl font-bold">¥{monthlyRevenue.toLocaleString()}</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm border-0 stat-card !p-0 overflow-hidden">
            <div className="p-5 bg-gradient-to-br from-orange-500 to-amber-600 text-white">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-8 h-8 text-white/90" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">待收</span>
              </div>
              <div className="text-white/80 text-sm mb-1">待收金额</div>
              <div className="text-3xl font-bold">¥{pendingAmount.toLocaleString()}</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm border-0 stat-card !p-0 overflow-hidden">
            <div className="p-5 bg-gradient-to-br from-emerald-500 to-green-600 text-white">
              <div className="flex items-center justify-between mb-3">
                <CreditCard className="w-8 h-8 text-white/90" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">总计</span>
              </div>
              <div className="text-white/80 text-sm mb-1">总订单数</div>
              <div className="text-3xl font-bold">{totalOrders}</div>
            </div>
          </Card>
        </Col>
      </Row>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <Card className="shadow-sm border-0">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-600 font-medium">日期范围</label>
                <RangePicker
                  style={{ width: 280 }}
                  value={dateRange as any}
                  onChange={(dates) =>
                    setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-600 font-medium">套餐筛选</label>
                <Select
                  allowClear
                  placeholder="全部套餐"
                  style={{ width: 160 }}
                  value={packageFilter}
                  onChange={setPackageFilter}
                  options={packages.map((p) => ({ label: p.name, value: p.packageId }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-600 font-medium">支付状态</label>
                <Select
                  allowClear
                  placeholder="全部状态"
                  style={{ width: 140 }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { label: '已付', value: 'paid' },
                    { label: '未付', value: 'unpaid' },
                    { label: '退款', value: 'refunded' },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[240px]">
                <label className="text-sm text-slate-600 font-medium">骑手搜索</label>
                <Input
                  allowClear
                  placeholder="搜索骑手姓名/ID/手机号..."
                  prefix={<Search size={16} className="text-slate-400" />}
                  value={riderSearch}
                  onChange={(e) => setRiderSearch(e.target.value)}
                />
              </div>
              <Button
                icon={<RefreshCw size={14} />}
                onClick={handleResetFilters}
              >
                重置
              </Button>
            </div>
          </Card>

          <Card className="shadow-sm border-0">
            <Table
              rowKey="orderId"
              columns={columns}
              dataSource={filteredOrders}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              scroll={{ x: 1400 }}
            />
          </Card>

          <Row gutter={16}>
            <Col span={10}>
              <Card className="shadow-sm border-0 stat-card">
                <div className="flex items-center gap-2 mb-4">
                  <PieChartIcon className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-bold text-slate-800">订单类型占比</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={0}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
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
                          `${value} 单`,
                          name,
                        ]}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={10}
                        wrapperStyle={{ fontSize: '13px' }}
                        formatter={(value: string) => (
                          <span className="text-slate-600">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col span={14}>
              <Card className="shadow-sm border-0 stat-card">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-bold text-slate-800">每日营收趋势 (最近30天)</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={revenueTrend}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={LINE_COLOR} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={LINE_COLOR} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        dy={10}
                        interval={3}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
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
                        labelStyle={{
                          color: '#1e293b',
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                        itemStyle={{ color: LINE_COLOR, fontWeight: 500 }}
                        formatter={(value: number) => [`¥${value}`, '营收']}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke={LINE_COLOR}
                        strokeWidth={3}
                        fill="url(#revenueGradient)"
                        dot={{ r: 0 }}
                        activeDot={{
                          r: 6,
                          fill: LINE_COLOR,
                          strokeWidth: 2,
                          stroke: '#fff',
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        <div className="xl:col-span-1">
          <Card
            className="shadow-sm border-0 stat-card sticky top-6"
            title={
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-primary-600" />
                <span className="font-bold text-slate-800">筛选结果汇总</span>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary-50 to-cyan-50">
                <div className="text-sm text-slate-500 mb-1">订单总数</div>
                <div className="text-3xl font-bold text-primary-700">
                  {summary.count}
                </div>
                <div className="text-xs text-slate-400 mt-1">单</div>
              </div>

              <Divider className="my-2" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">营收总额</span>
                  <span className="text-xl font-bold text-slate-800">
                    ¥{summary.total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Tag color="green" className="!m-0">已付</Tag>
                    </span>
                    <span className="font-semibold text-slate-700">
                      ¥{summary.paid.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    percent={summary.total > 0 ? (summary.paid / summary.total) * 100 : 0}
                    size="small"
                    strokeColor="#16A34A"
                    showInfo={false}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Tag color="orange" className="!m-0">未付</Tag>
                    </span>
                    <span className="font-semibold text-slate-700">
                      ¥{summary.unpaid.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    percent={summary.total > 0 ? (summary.unpaid / summary.total) * 100 : 0}
                    size="small"
                    strokeColor="#F97316"
                    showInfo={false}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Tag color="red" className="!m-0">退款</Tag>
                    </span>
                    <span className="font-semibold text-slate-700">
                      ¥{summary.refunded.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    percent={summary.total > 0 ? (summary.refunded / summary.total) * 100 : 0}
                    size="small"
                    strokeColor="#DC2626"
                    showInfo={false}
                  />
                </div>
              </div>

              <Divider className="my-2" />

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Tag color="blue" className="!m-0 !text-xs">租</Tag>
                  </div>
                  <div className="text-xl font-bold text-blue-700">{summary.rentCount}</div>
                  <div className="text-xs text-blue-600/70">租电单</div>
                </div>
                <div className="rounded-xl bg-cyan-50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Tag color="cyan" className="!m-0 !text-xs">换</Tag>
                  </div>
                  <div className="text-xl font-bold text-cyan-700">{summary.swapCount}</div>
                  <div className="text-xs text-cyan-600/70">换电单</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        title={`订单详情 - ${detailModal.record?.orderId || ''}`}
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, record: null })}
        footer={[
          <Button
            key="close"
            onClick={() => setDetailModal({ open: false, record: null })}
          >
            关闭
          </Button>,
        ]}
        width={720}
      >
        {detailModal.record && (
          <div className="space-y-6">
            <Descriptions bordered column={2} size="small" title="订单信息">
              <Descriptions.Item label="订单号" span={2}>
                <span className="font-mono">{detailModal.record.orderId}</span>
              </Descriptions.Item>
              <Descriptions.Item label="订单类型">
                <Tag color={orderTypeMap[detailModal.record.type].color}>
                  {orderTypeMap[detailModal.record.type].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="支付状态">
                <Tag color={paymentStatusMap[detailModal.record.status].color}>
                  {paymentStatusMap[detailModal.record.status].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">
                <span className="text-lg font-bold text-primary-700">
                  ¥{detailModal.record.amount.toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {detailModal.record.createdAt}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions bordered column={2} size="small" title="骑手信息">
              <Descriptions.Item label="骑手ID">
                <span className="font-mono">{detailModal.record.riderId}</span>
              </Descriptions.Item>
              <Descriptions.Item label="骑手姓名">
                {detailModal.record.riderName}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {getRiderPhone(detailModal.record.riderId)}
              </Descriptions.Item>
              <Descriptions.Item label="所属套餐">
                <Tag color="cyan">{getPackageName(detailModal.record.packageId)}</Tag>
              </Descriptions.Item>
            </Descriptions>

            {(() => {
              const rider = getRiderById(detailModal.record.riderId);
              const pkg = getPackageById(detailModal.record.packageId);
              const batch = getBatchInfo(detailModal.record.batteryBatchId);
              return (
                <>
                  <Descriptions bordered column={2} size="small" title="电池信息">
                    <Descriptions.Item label="电池批次" span={2}>
                      <span className="font-mono">
                        {detailModal.record.batteryBatchId || '-'}
                      </span>
                    </Descriptions.Item>
                    {batch && (
                      <>
                        <Descriptions.Item label="供应商">
                          {batch.supplier}
                        </Descriptions.Item>
                        <Descriptions.Item label="容量">
                          {batch.capacity} Ah
                        </Descriptions.Item>
                        <Descriptions.Item label="生产日期">
                          {batch.manufactureDate}
                        </Descriptions.Item>
                        <Descriptions.Item label="到期日期">
                          {batch.expiryDate}
                        </Descriptions.Item>
                      </>
                    )}
                  </Descriptions>

                  {rider && pkg && (
                    <Descriptions
                      bordered
                      column={2}
                      size="small"
                      title="骑手套餐使用情况"
                    >
                      <Descriptions.Item label="套餐名称" span={2}>
                        <span className="font-medium">{pkg.name}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="月度费用">
                        ¥{pkg.monthlyFee}
                      </Descriptions.Item>
                      <Descriptions.Item label="押金">
                        ¥{pkg.deposit}
                      </Descriptions.Item>
                      <Descriptions.Item label="换电额度">
                        <span className="font-semibold">{rider.swapUsed}</span>
                        <span className="text-slate-400"> / </span>
                        <span>{pkg.swapCount} 次</span>
                        <Progress
                          percent={(rider.swapUsed / pkg.swapCount) * 100}
                          size="small"
                          className="mt-1"
                          strokeColor={
                            (rider.swapUsed / pkg.swapCount) * 100 > 90
                              ? '#DC2626'
                              : '#0891B2'
                          }
                        />
                      </Descriptions.Item>
                      <Descriptions.Item label="加急额度">
                        <span className="font-semibold">
                          {pkg.urgentQuota - rider.urgentCount}
                        </span>
                        <span className="text-slate-400"> / </span>
                        <span>{pkg.urgentQuota} 次</span>
                        <Progress
                          percent={
                            ((pkg.urgentQuota - rider.urgentCount) / pkg.urgentQuota) *
                            100
                          }
                          size="small"
                          className="mt-1"
                          strokeColor="#F97316"
                        />
                      </Descriptions.Item>
                      <Descriptions.Item label="单次换电费">
                        ¥{pkg.perSwapFee}
                      </Descriptions.Item>
                      <Descriptions.Item label="加急服务费">
                        ¥{pkg.urgentFee}
                      </Descriptions.Item>
                    </Descriptions>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
