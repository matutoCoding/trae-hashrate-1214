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
  Progress,
  Modal,
  Descriptions,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Search, Lock, Unlock, Eye, Package } from 'lucide-react';
import dayjs from 'dayjs';
import { useBatteryStore } from '@/store/batteryStore';
import type { BatteryBatch, BatteryStatus } from '@/types';

const { RangePicker } = DatePicker;

const statusMap: Record<BatteryStatus, { text: string; color: string }> = {
  in_stock: { text: '在库', color: 'green' },
  in_rent: { text: '在租', color: 'blue' },
  maintenance: { text: '维护', color: 'orange' },
  locked: { text: '锁定', color: 'default' },
  expired: { text: '已过期', color: 'red' },
};

const suppliers = ['宁德时代', '比亚迪', '国轩高科', '孚能科技', '亿纬锂能'];

export default function BatchListPage() {
  const { batches, lockBatch, unlockBatch } = useBatteryStore();

  const [supplierFilter, setSupplierFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<BatteryStatus | undefined>();
  const [expiryRange, setExpiryRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [searchText, setSearchText] = useState('');
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    record: BatteryBatch | null;
  }>({ open: false, record: null });

  const filteredData = useMemo(() => {
    return batches.filter((item) => {
      if (supplierFilter && item.supplier !== supplierFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (expiryRange && expiryRange[0] && expiryRange[1]) {
        const expiry = dayjs(item.expiryDate);
        if (expiry.isBefore(expiryRange[0]) || expiry.isAfter(expiryRange[1])) {
          return false;
        }
      }
      if (searchText) {
        const lower = searchText.toLowerCase();
        if (
          !item.batchId.toLowerCase().includes(lower) &&
          !item.supplier.toLowerCase().includes(lower) &&
          !item.warehouseLocation.toLowerCase().includes(lower)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [batches, supplierFilter, statusFilter, expiryRange, searchText]);

  const getRemainingDaysTag = (days: number) => {
    let color: 'red' | 'orange' | 'green' = 'green';
    if (days <= 30) color = 'red';
    else if (days <= 90) color = 'orange';
    return <Tag color={color}>{days} 天</Tag>;
  };

  const getHealthProgressColor = (score: number) => {
    if (score >= 80) return '#16A34A';
    if (score >= 60) return '#EAB308';
    return '#DC2626';
  };

  const handleLock = (record: BatteryBatch) => {
    Modal.confirm({
      title: '确认锁定批次',
      content: `确定要锁定批次 ${record.batchId} 吗？锁定后该批次将无法出库。`,
      okText: '确认锁定',
      cancelText: '取消',
      onOk: () => {
        lockBatch(record.batchId);
        message.success(`批次 ${record.batchId} 已锁定`);
      },
    });
  };

  const handleUnlock = (record: BatteryBatch) => {
    Modal.confirm({
      title: '确认解锁批次',
      content: `确定要解锁批次 ${record.batchId} 吗？`,
      okText: '确认解锁',
      cancelText: '取消',
      onOk: () => {
        if (record.remainingDays <= 0) {
          message.error('该批次已过期，无法解锁');
          return;
        }
        unlockBatch(record.batchId);
        message.success(`批次 ${record.batchId} 已解锁`);
      },
    });
  };

  const handleViewDetail = (record: BatteryBatch) => {
    setDetailModal({ open: true, record });
  };

  const handleResetFilters = () => {
    setSupplierFilter(undefined);
    setStatusFilter(undefined);
    setExpiryRange(null);
    setSearchText('');
  };

  const columns: ColumnsType<BatteryBatch> = [
    {
      title: '批次号',
      dataIndex: 'batchId',
      key: 'batchId',
      width: 180,
      render: (text) => (
        <span className="font-mono font-medium text-slate-700">{text}</span>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 110,
    },
    {
      title: '数量 (总/可用)',
      key: 'quantity',
      width: 120,
      render: (_, record) => (
        <span>
          <span className="font-semibold text-slate-800">{record.quantity}</span>
          <span className="text-slate-400 mx-1">/</span>
          <span className="text-emerald-600 font-medium">{record.availableQty}</span>
        </span>
      ),
    },
    {
      title: '生产日期',
      dataIndex: 'manufactureDate',
      key: 'manufactureDate',
      width: 110,
    },
    {
      title: '到期日期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 110,
    },
    {
      title: '剩余天数',
      dataIndex: 'remainingDays',
      key: 'remainingDays',
      width: 100,
      render: (days) => getRemainingDaysTag(days),
      sorter: (a, b) => a.remainingDays - b.remainingDays,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: BatteryStatus) => {
        const s = statusMap[status];
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '库位',
      dataIndex: 'warehouseLocation',
      key: 'warehouseLocation',
      width: 100,
    },
    {
      title: '健康度',
      key: 'healthScore',
      width: 140,
      render: (_, record) => (
        <Progress
          percent={record.healthScore}
          size="small"
          strokeColor={getHealthProgressColor(record.healthScore)}
          showInfo={true}
        />
      ),
      sorter: (a, b) => a.healthScore - b.healthScore,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'locked' ? (
            <Button
              type="link"
              size="small"
              icon={<Unlock size={14} />}
              onClick={() => handleUnlock(record)}
            >
              解锁
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              danger
              icon={<Lock size={14} />}
              onClick={() => handleLock(record)}
            >
              锁定
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">电池批次管理</h1>
          </div>
          <p className="text-slate-500 text-sm ml-12">
            查看和管理所有电池批次信息，支持按供应商、状态、效期等条件筛选
          </p>
        </div>
        <Tag color="blue" className="text-sm px-3 py-1">
          共 {filteredData.length} 条记录
        </Tag>
      </div>

      <Card className="shadow-sm border-0">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600 font-medium">供应商</label>
            <Select
              allowClear
              placeholder="全部供应商"
              style={{ width: 160 }}
              value={supplierFilter}
              onChange={setSupplierFilter}
              options={suppliers.map((s) => ({ label: s, value: s }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600 font-medium">状态</label>
            <Select
              allowClear
              placeholder="全部状态"
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: '在库', value: 'in_stock' },
                { label: '在租', value: 'in_rent' },
                { label: '维护', value: 'maintenance' },
                { label: '锁定', value: 'locked' },
              ]}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600 font-medium">效期范围</label>
            <RangePicker
              style={{ width: 280 }}
              value={expiryRange as any}
              onChange={(dates) =>
                setExpiryRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)
              }
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[240px]">
            <label className="text-sm text-slate-600 font-medium">搜索</label>
            <Input
              allowClear
              placeholder="搜索批次号、供应商、库位..."
              prefix={<Search size={16} className="text-slate-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <Button onClick={handleResetFilters}>重置</Button>
        </div>
      </Card>

      <Card className="shadow-sm border-0">
        <Table
          rowKey="batchId"
          columns={columns}
          dataSource={filteredData}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        title={`批次详情 - ${detailModal.record?.batchId || ''}`}
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
        width={640}
      >
        {detailModal.record && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="批次号" span={2}>
              {detailModal.record.batchId}
            </Descriptions.Item>
            <Descriptions.Item label="供应商">
              {detailModal.record.supplier}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[detailModal.record.status].color}>
                {statusMap[detailModal.record.status].text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="总数量">
              {detailModal.record.quantity}
            </Descriptions.Item>
            <Descriptions.Item label="可用数量">
              {detailModal.record.availableQty}
            </Descriptions.Item>
            <Descriptions.Item label="生产日期">
              {detailModal.record.manufactureDate}
            </Descriptions.Item>
            <Descriptions.Item label="到期日期">
              {detailModal.record.expiryDate}
            </Descriptions.Item>
            <Descriptions.Item label="剩余天数">
              {getRemainingDaysTag(detailModal.record.remainingDays)}
            </Descriptions.Item>
            <Descriptions.Item label="库位">
              {detailModal.record.warehouseLocation}
            </Descriptions.Item>
            <Descriptions.Item label="容量 (Ah)" span={2}>
              {detailModal.record.capacity}
            </Descriptions.Item>
            <Descriptions.Item label="健康度" span={2}>
              <Progress
                percent={detailModal.record.healthScore}
                strokeColor={getHealthProgressColor(detailModal.record.healthScore)}
              />
            </Descriptions.Item>
            <Descriptions.Item label="入库时间" span={2}>
              {detailModal.record.createdAt}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
