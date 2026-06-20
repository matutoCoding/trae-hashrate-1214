import { useState, useMemo } from 'react';
import { useFIFO } from '@/hooks/useFIFO';
import { usePriorityQueue } from '@/hooks/usePriorityQueue';
import { useBatteryStore } from '@/store/batteryStore';
import { mockPricingPackages, mockRiders } from '@/mock';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import { calculateSwapCost, formatCurrency } from '@/utils/pricingUtils';
import type { BatteryBatch } from '@/types';

export default function OutboundPage() {
  const { fifoBatches, recommendedBatch, processOutbound } = useFIFO();
  const { currentCalling, processComplete } = usePriorityQueue();
  const { orders } = useBatteryStore();

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(
    recommendedBatch?.batchId || null
  );
  const [outboundQty, setOutboundQty] = useState<number>(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedBatch = useMemo(
    () => fifoBatches.find((b) => b.batchId === selectedBatchId) || null,
    [fifoBatches, selectedBatchId]
  );

  const recentOutbounds = useMemo(() => {
    return orders
      .filter((o) => o.type === 'SWAP')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [orders]);

  const currentRider = useMemo(() => {
    if (!currentCalling) return null;
    return mockRiders.find((r) => r.riderId === currentCalling.riderId) || null;
  }, [currentCalling]);

  const riderPackage = useMemo(() => {
    if (!currentRider) return null;
    return mockPricingPackages.find((p) => p.packageId === currentRider.packageId) || null;
  }, [currentRider]);

  const pricingInfo = useMemo(() => {
    if (!currentRider || !riderPackage) return null;
    return calculateSwapCost(currentRider, riderPackage);
  }, [currentRider, riderPackage]);

  const getBatchBorderClass = (batch: BatteryBatch) => {
    if (batch.remainingDays <= 30) return 'border-red-400 border-2';
    if (batch.remainingDays <= 90) return 'border-yellow-400 border-2';
    return 'border-slate-200 border';
  };

  const getBatchDaysColor = (days: number) => {
    if (days <= 30) return 'text-red-600';
    if (days <= 90) return 'text-yellow-600';
    return 'text-slate-700';
  };

  const handleConfirmOutbound = () => {
    if (!currentCalling) {
      setMessage({ type: 'error', text: '当前没有叫号的骑手' });
      return;
    }
    if (!selectedBatch) {
      setMessage({ type: 'error', text: '请选择出库批次' });
      return;
    }
    if (outboundQty <= 0 || outboundQty > selectedBatch.availableQty) {
      setMessage({ type: 'error', text: '出库数量无效' });
      return;
    }

    const result = processOutbound(
      currentCalling.riderId,
      currentCalling.riderName,
      currentRider?.packageId || 'PKG001',
      pricingInfo?.cost || 0,
      selectedBatch.batchId
    );

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      processComplete(currentCalling.ticketId);
      setOutboundQty(1);
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="h-full grid grid-cols-12 gap-6 p-6">
      <div className="col-span-4 flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">FIFO 推荐出库列表</h2>
          <span className="badge bg-primary-100 text-primary-700">
            共 {fifoBatches.length} 个批次
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {fifoBatches.map((batch) => {
            const isRecommended = batch.batchId === recommendedBatch?.batchId;
            const isSelected = batch.batchId === selectedBatchId;
            return (
              <div
                key={batch.batchId}
                onClick={() => setSelectedBatchId(batch.batchId)}
                className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 bg-white
                  ${getBatchBorderClass(batch)}
                  ${isSelected ? 'ring-2 ring-primary-500 shadow-lg scale-[1.02]' : 'shadow-sm hover:shadow-md'}
                  ${isRecommended ? 'call-flash' : ''}`}
              >
                {isRecommended && (
                  <div className="absolute -top-2 -right-2">
                    <span className="badge bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md animate-pulse">
                      ⭐ 推荐
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => setSelectedBatchId(batch.batchId)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-800 truncate">
                        {batch.batchId}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {batch.warehouseLocation}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-600">{batch.supplier}</span>
                      <div
                        className={`text-2xl font-bold ${getBatchDaysColor(batch.remainingDays)}`}
                      >
                        {batch.remainingDays}
                        <span className="text-sm font-normal ml-1">天</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>到期: {formatDate(batch.expiryDate)}</span>
                      <span className="font-medium text-slate-700">
                        可用: {batch.availableQty}/{batch.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {fifoBatches.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg">暂无可用库存批次</p>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-4 flex flex-col">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800">出库办理</h2>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          {currentCalling ? (
            <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-primary-50 to-cyan-50 border border-primary-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="badge bg-primary-100 text-primary-700">
                    窗口 {currentCalling.windowNo} 号
                  </span>
                  <span
                    className={`badge ${
                      currentCalling.queueType === 'URGENT'
                        ? 'bg-red-100 text-red-700'
                        : currentCalling.queueType === 'VIP'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-cyan-100 text-cyan-700'
                    }`}
                  >
                    {currentCalling.queueType === 'URGENT'
                      ? '加急'
                      : currentCalling.queueType === 'VIP'
                      ? 'VIP'
                      : '普通'}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {currentCalling.ticketId}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                  {currentCalling.riderName.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-slate-800">
                    {currentCalling.riderName}
                  </p>
                  <p className="text-sm text-slate-500">{currentCalling.riderPhone}</p>
                  <p className="text-xs text-primary-600 mt-1">
                    {currentCalling.packageName}
                  </p>
                </div>
              </div>
              {currentRider && riderPackage && (
                <div className="mt-4 pt-4 border-t border-primary-200 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">换电使用: </span>
                    <span className="font-medium text-slate-700">
                      {currentRider.swapUsed}/{riderPackage.swapCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">加急剩余: </span>
                    <span className="font-medium text-slate-700">
                      {currentRider.urgentCount}/{riderPackage.urgentQuota}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 p-5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-slate-400 text-lg">暂无叫号骑手</p>
              <p className="text-slate-400 text-sm mt-1">请先在叫号系统中叫号</p>
            </div>
          )}

          {selectedBatch && (
            <div
              className={`mb-6 p-4 rounded-xl border-2 ${
                selectedBatch.batchId === recommendedBatch?.batchId
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-primary-200 bg-primary-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-slate-700">FIFO 推荐批次</span>
                {selectedBatch.batchId === recommendedBatch?.batchId && (
                  <span className="badge bg-orange-100 text-orange-700 animate-pulse">
                    最佳选择
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{selectedBatch.batchId}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedBatch.supplier} · {selectedBatch.warehouseLocation}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-3xl font-bold ${getBatchDaysColor(
                      selectedBatch.remainingDays
                    )}`}
                  >
                    {selectedBatch.remainingDays}
                    <span className="text-base font-normal ml-1">天</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    到期 {formatDate(selectedBatch.expiryDate)}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between text-sm">
                <span className="text-slate-500">容量: {selectedBatch.capacity}Ah</span>
                <span className="text-slate-500">健康分: {selectedBatch.healthScore}%</span>
                <span className="font-medium text-slate-700">
                  可用: {selectedBatch.availableQty}
                </span>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              出库数量
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOutboundQty((v) => Math.max(1, v - 1))}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max={selectedBatch?.availableQty || 1}
                value={outboundQty}
                onChange={(e) =>
                  setOutboundQty(Math.min(selectedBatch?.availableQty || 1, Math.max(1, parseInt(e.target.value) || 1)))
                }
                className="input-field text-center text-lg font-bold flex-1"
              />
              <button
                onClick={() =>
                  setOutboundQty((v) =>
                    Math.min(selectedBatch?.availableQty || v, v + 1)
                  )
                }
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {pricingInfo && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">计价信息</span>
                <span
                  className={`badge ${
                    pricingInfo.withinQuota
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {pricingInfo.withinQuota ? '套餐内' : '超额计费'}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-sm text-slate-500">{pricingInfo.reason}</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(pricingInfo.cost)}
                </p>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`mb-4 p-3 rounded-xl text-sm font-medium text-center ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-auto space-y-3">
            <button
              onClick={handleConfirmOutbound}
              disabled={!currentCalling || !selectedBatch}
              className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              确认出库
            </button>
          </div>
        </div>
      </div>

      <div className="col-span-4 flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">最近出库记录</h2>
          <span className="badge bg-slate-100 text-slate-600">最近 5 条</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {recentOutbounds.map((order, index) => (
            <div
              key={order.orderId}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0
                        ? 'bg-gradient-to-br from-emerald-400 to-green-500'
                        : index === 1
                        ? 'bg-gradient-to-br from-cyan-400 to-blue-500'
                        : 'bg-gradient-to-br from-slate-400 to-slate-500'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="font-medium text-slate-800">{order.riderName}</span>
                </div>
                <span
                  className={`badge ${
                    order.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {order.status === 'paid' ? '已支付' : '待支付'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">批次号</span>
                  <span className="text-slate-700 font-mono">{order.batteryBatchId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">订单号</span>
                  <span className="text-slate-700 font-mono text-xs">{order.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">类型</span>
                  <span className="text-slate-700">
                    {order.type === 'SWAP' ? '换电' : '租借'}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    {formatDateTime(order.createdAt)}
                  </span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(order.amount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {recentOutbounds.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg">暂无出库记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
