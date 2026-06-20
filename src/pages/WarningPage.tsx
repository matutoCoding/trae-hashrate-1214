import { useState, useMemo } from 'react';
import { useExpiryCheck } from '@/hooks/useExpiryCheck';
import { formatDate } from '@/utils/dateUtils';
import type { BatteryBatch, WarningBatch } from '@/types';

type TabKey = 'danger' | 'warning' | 'locked';

export default function WarningPage() {
  const {
    batches,
    dangerBatches,
    warningOnlyBatches,
    lockedBatches,
    stats,
    lockBatch,
    unlockBatch,
  } = useExpiryCheck();

  const [activeTab, setActiveTab] = useState<TabKey>('danger');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const cautionBatches = useMemo(
    () =>
      batches.filter(
        (b) =>
          b.status !== 'locked' && b.remainingDays > 90 && b.remainingDays <= 180
      ),
    [batches]
  );

  const dangerBatchDetails = useMemo<BatteryBatch[]>(() => {
    return dangerBatches
      .map((w: WarningBatch) => batches.find((b) => b.batchId === w.batchId))
      .filter(Boolean) as BatteryBatch[];
  }, [dangerBatches, batches]);

  const warningBatchDetails = useMemo<BatteryBatch[]>(() => {
    return warningOnlyBatches
      .map((w: WarningBatch) => batches.find((b) => b.batchId === w.batchId))
      .filter(Boolean) as BatteryBatch[];
  }, [warningOnlyBatches, batches]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLockBatch = (batchId: string) => {
    lockBatch(batchId);
    showMessage('success', `批次 ${batchId} 已手动锁定`);
  };

  const handleUnlockBatch = (batchId: string, remainingDays: number) => {
    if (remainingDays <= 0) {
      showMessage('error', '该批次已超期，无法解锁');
      return;
    }
    unlockBatch(batchId);
    showMessage('success', `批次 ${batchId} 已解锁`);
  };

  const handleScrapBatch = (batchId: string) => {
    lockBatch(batchId);
    showMessage('success', `批次 ${batchId} 已报废处理`);
  };

  const handleUrgentOutbound = (batchId: string) => {
    showMessage('success', `批次 ${batchId} 已标记加急出库，请到出库页办理`);
  };

  const statCards = [
    {
      label: '紧急预警',
      value: stats.danger,
      qty: stats.dangerQty,
      desc: '≤30天到期',
      gradient: 'from-red-500 to-rose-600',
      icon: '🚨',
      tabKey: 'danger' as TabKey,
    },
    {
      label: '临期提醒',
      value: stats.warning,
      qty: stats.warningQty,
      desc: '≤90天到期',
      gradient: 'from-yellow-500 to-amber-600',
      icon: '⚠️',
      tabKey: 'warning' as TabKey,
    },
    {
      label: '关注批次',
      value: cautionBatches.length,
      qty: cautionBatches.reduce((s, b) => s + b.availableQty, 0),
      desc: '≤180天到期',
      gradient: 'from-blue-500 to-indigo-600',
      icon: '📋',
      tabKey: null,
    },
    {
      label: '已锁定',
      value: stats.locked,
      qty: stats.lockedQty,
      desc: '超期不可租',
      gradient: 'from-slate-500 to-slate-700',
      icon: '🔒',
      tabKey: 'locked' as TabKey,
    },
  ];

  const getDaysColor = (days: number) => {
    if (days <= 0) return 'text-slate-600';
    if (days <= 30) return 'text-red-600';
    if (days <= 90) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getBatchCardStyle = (days: number, isLocked: boolean) => {
    if (isLocked) return 'border-l-slate-500 bg-gradient-to-r from-slate-50 to-white';
    if (days <= 30) return 'border-l-red-500 bg-gradient-to-r from-red-50 to-white';
    if (days <= 90) return 'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-white';
    return 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-white';
  };

  const getStatusBadge = (days: number, isLocked: boolean) => {
    if (isLocked) return { text: '已锁定', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
    if (days <= 30) return { text: '紧急', cls: 'bg-red-100 text-red-700 border-red-200' };
    if (days <= 90) return { text: '临期', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    return { text: '关注', cls: 'bg-blue-100 text-blue-700 border-blue-200' };
  };

  const tabs = [
    { key: 'danger' as TabKey, label: '紧急预警', count: stats.danger, icon: '🚨' },
    { key: 'warning' as TabKey, label: '临期提醒', count: stats.warning, icon: '⚠️' },
    { key: 'locked' as TabKey, label: '已锁定批次', count: stats.locked, icon: '🔒' },
  ];

  const renderBatchList = (list: BatteryBatch[], showActions: boolean, tab: TabKey) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-20 text-slate-400">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-lg">暂无数据</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {list.map((batch) => {
          const isLocked = batch.status === 'locked' || batch.remainingDays <= 0;
          const status = getStatusBadge(batch.remainingDays, isLocked);
          const isDangerTab = tab === 'danger';
          return (
            <div
              key={batch.batchId}
              className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 transition-all duration-300 hover:shadow-md
                ${getBatchCardStyle(batch.remainingDays, isLocked)}
                ${isDangerTab ? 'warning-breathe' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={`flex-shrink-0 w-24 h-24 rounded-2xl flex flex-col items-center justify-center
                      ${
                        isLocked
                          ? 'bg-slate-100'
                          : batch.remainingDays <= 30
                          ? 'bg-red-100'
                          : batch.remainingDays <= 90
                          ? 'bg-yellow-100'
                          : 'bg-blue-100'
                      }`}
                  >
                    <span
                      className={`text-3xl font-extrabold ${getDaysColor(batch.remainingDays)}`}
                    >
                      {Math.max(0, batch.remainingDays)}
                    </span>
                    <span
                      className={`text-xs font-medium mt-1 ${getDaysColor(batch.remainingDays)}`}
                    >
                      {batch.remainingDays <= 0 ? '已超期' : '天后到期'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-bold text-lg text-slate-800 truncate">
                        {batch.batchId}
                      </span>
                      <span
                        className={`badge border ${status.cls}`}
                      >
                        {status.text}
                      </span>
                      <span className="badge bg-slate-100 text-slate-600 border-slate-200">
                        {batch.warehouseLocation}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-slate-500 block text-xs mb-1">供应商</span>
                        <span className="font-medium text-slate-700">{batch.supplier}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs mb-1">到期日期</span>
                        <span className="font-medium text-slate-700">
                          {formatDate(batch.expiryDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs mb-1">可用数量</span>
                        <span className="font-medium text-slate-700">
                          {batch.availableQty} / {batch.quantity}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs mb-1">容量/健康分</span>
                        <span className="font-medium text-slate-700">
                          {batch.capacity}Ah / {batch.healthScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {showActions && (
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    {tab === 'danger' && (
                      <>
                        <button
                          onClick={() => handleUrgentOutbound(batch.batchId)}
                          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 active:scale-95 whitespace-nowrap"
                        >
                          ⚡ 加急出库
                        </button>
                        <button
                          onClick={() => handleLockBatch(batch.batchId)}
                          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors active:scale-95 whitespace-nowrap"
                        >
                          🔒 手动锁定
                        </button>
                      </>
                    )}
                    {tab === 'warning' && (
                      <button
                        onClick={() => handleUrgentOutbound(batch.batchId)}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 active:scale-95 whitespace-nowrap"
                      >
                        ⚡ 加急出库
                      </button>
                    )}
                    {tab === 'locked' && (
                      <>
                        <button
                          onClick={() => handleScrapBatch(batch.batchId)}
                          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-slate-600 to-slate-800 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 active:scale-95 whitespace-nowrap"
                        >
                          🗑️ 报废处理
                        </button>
                        <button
                          onClick={() => handleUnlockBatch(batch.batchId, batch.remainingDays)}
                          disabled={batch.remainingDays <= 0}
                          className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap active:scale-95
                            ${
                              batch.remainingDays <= 0
                                ? 'text-slate-400 bg-slate-50 cursor-not-allowed'
                                : 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200'
                            }"
                        >
                          🔓 解锁
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getActiveList = () => {
    switch (activeTab) {
      case 'danger':
        return renderBatchList(dangerBatchDetails, true, 'danger');
      case 'warning':
        return renderBatchList(warningBatchDetails, true, 'warning');
      case 'locked':
        return renderBatchList(lockedBatches, true, 'locked');
    }
  };

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">临期预警看板</h1>
          <p className="text-sm text-slate-500 mt-1">
            实时监控电池批次效期状态，提前预警降低损耗
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            onClick={() => card.tabKey && setActiveTab(card.tabKey)}
            className={`stat-card bg-gradient-to-br ${card.gradient} text-white cursor-pointer
              ${card.tabKey === activeTab ? 'ring-4 ring-offset-2 ring-primary-300' : ''}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm font-medium">{card.label}</p>
                <p className="text-xs text-white/60 mt-0.5">{card.desc}</p>
              </div>
              <span className="text-3xl">{card.icon}</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-extrabold">{card.value}</p>
                <p className="text-xs text-white/70 mt-1">共 {card.qty} 节电池</p>
              </div>
              {card.tabKey && (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-sm hover:bg-white/30 transition-colors">
                  →
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="border-b border-slate-100">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 relative
                  ${
                    activeTab === tab.key
                      ? 'text-primary-600 border-primary-600 bg-primary-50/50'
                      : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        activeTab === tab.key
                          ? 'bg-primary-600 text-white'
                          : tab.key === 'danger'
                          ? 'bg-red-100 text-red-700'
                          : tab.key === 'warning'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">{getActiveList()}</div>
      </div>
    </div>
  );
}
