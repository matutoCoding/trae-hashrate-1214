import { useState, useMemo, useEffect } from 'react';
import { useFIFO } from '@/hooks/useFIFO';
import { usePriorityQueue } from '@/hooks/usePriorityQueue';
import { useUserStore } from '@/store/userStore';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import {
  calculateSwapCost,
  calculateUrgentCost,
  formatCurrency,
} from '@/utils/pricingUtils';
import type { BatteryBatch } from '@/types';
import { AlertTriangle, Lock, Star, CheckCircle2 } from 'lucide-react';

export default function OutboundPage() {
  const {
    fifoBatches,
    recommendedBatch,
    isBatchAllowed,
    confirmOutbound,
    recentOutbounds,
  } = useFIFO();
  const { currentCalling, processComplete } = usePriorityQueue();
  const { getRiderById, getPackageById } = useUserStore();

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [outboundQty, setOutboundQty] = useState<number>(1);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (recommendedBatch) {
      setSelectedBatchId(recommendedBatch.batchId);
    } else {
      setSelectedBatchId(null);
    }
  }, [recommendedBatch]);

  const selectedBatch = useMemo(
    () => fifoBatches.find((b) => b.batchId === selectedBatchId) || null,
    [fifoBatches, selectedBatchId]
  );

  const currentRider = useMemo(() => {
    if (!currentCalling) return null;
    return getRiderById(currentCalling.riderId) || null;
  }, [currentCalling, getRiderById]);

  const riderPackage = useMemo(() => {
    if (!currentRider) return null;
    return getPackageById(currentRider.packageId) || null;
  }, [currentRider, getPackageById]);

  const isUrgent = currentCalling?.queueType === 'URGENT';

  const pricingInfo = useMemo(() => {
    if (!currentRider || !riderPackage) return null;
    const swapCost = calculateSwapCost(currentRider, riderPackage, outboundQty);
    let urgentCost = null;
    if (isUrgent) {
      if (currentCalling?.urgentQuotaUsed) {
        urgentCost = { cost: 0, withinQuota: true, urgentFee: 0, reason: '加急配额已扣减，无需额外收费' };
      } else if (currentCalling?.urgentFeeCharged) {
        urgentCost = { cost: riderPackage.urgentFee, withinQuota: false, urgentFee: riderPackage.urgentFee, reason: `加急配额不足，收取加急费 ¥${riderPackage.urgentFee}` };
      } else {
        urgentCost = calculateUrgentCost(currentRider, riderPackage);
      }
    }
    const total = swapCost.cost + (urgentCost?.cost || 0);
    return {
      swapCost,
      urgentCost,
      total,
      totalFreeSwap: swapCost.freeCount,
      totalPaidSwap: swapCost.paidCount,
    };
  }, [currentRider, riderPackage, outboundQty, isUrgent, currentCalling]);

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

  const handleBatchClick = (batch: BatteryBatch) => {
    if (batch.batchId === recommendedBatch?.batchId) {
      setSelectedBatchId(batch.batchId);
      return;
    }
    setMessage({
      type: 'warning',
      text: `出库必须遵循 FIFO 效期先进先出规则，只能选择推荐批次「${recommendedBatch?.batchId}」。请点击⭐推荐的批次。`,
    });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleConfirmOutbound = () => {
    if (!currentCalling) {
      setMessage({ type: 'error', text: '当前没有叫号的骑手，请先在叫号系统中叫号' });
      return;
    }
    if (!selectedBatch) {
      setMessage({ type: 'error', text: '请选择出库批次' });
      return;
    }
    if (!isBatchAllowed(selectedBatch.batchId)) {
      setMessage({
        type: 'warning',
        text: `该批次不是 FIFO 推荐的最早到期批次，请选择⭐推荐批次「${recommendedBatch?.batchId}」`,
      });
      return;
    }
    if (outboundQty <= 0) {
      setMessage({ type: 'error', text: '出库数量必须大于 0' });
      return;
    }
    if (outboundQty > selectedBatch.availableQty) {
      setMessage({
        type: 'error',
        text: `库存不足，推荐批次可用数量仅 ${selectedBatch.availableQty} 块`,
      });
      return;
    }

    const result = confirmOutbound({
      riderId: currentCalling.riderId,
      riderName: currentCalling.riderName,
      quantity: outboundQty,
      isUrgent,
      selectedBatchId: selectedBatch.batchId,
      ticketId: currentCalling.ticketId,
    });

    if (result.success) {
      const parts = [result.message];
      parts.push(
        `换电 ${outboundQty} 块：免费 ${result.freeSwapUsed || 0} 块 + 超额 ${result.paidSwapUsed || 0} 块`
      );
      if (isUrgent) {
        if (result.urgentQuotaUsed) {
          parts.push('加急：已扣减加急配额1次');
        } else if (result.urgentFeeCharged) {
          parts.push(`加急：收取加急费 ¥${result.urgentFee || 0}`);
        }
      }
      setMessage({ type: 'success', text: parts.join(' ｜ ') });
      processComplete(currentCalling.ticketId);
      setOutboundQty(1);
      setTimeout(() => setMessage(null), 5000);
    } else {
      setMessage({
        type: result.blocked ? 'warning' : 'error',
        text: result.message,
      });
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div className="h-full grid grid-cols-12 gap-6 p-6">
      <div className="col-span-4 flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">FIFO 效期先进先出</h2>
            <p className="text-xs text-slate-500 mt-1">
              仅⭐推荐批次可选择出库，其他批次已被 FIFO 规则锁定
            </p>
          </div>
          <span className="badge bg-primary-100 text-primary-700">
            共 {fifoBatches.length} 个可用批次
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {fifoBatches.map((batch) => {
            const isRecommended = batch.batchId === recommendedBatch?.batchId;
            const isSelected = batch.batchId === selectedBatchId;
            const allowed = isRecommended;
            return (
              <div
                key={batch.batchId}
                onClick={() => handleBatchClick(batch)}
                className={`relative p-4 rounded-xl transition-all duration-300 bg-white
                  ${allowed ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-60'}
                  ${getBatchBorderClass(batch)}
                  ${isSelected && allowed ? 'ring-2 ring-primary-500 shadow-lg scale-[1.02]' : 'shadow-sm'}
                  ${isRecommended ? 'call-flash' : ''}`}
              >
                {isRecommended && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="badge bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md animate-pulse flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" />
                      FIFO 推荐
                    </span>
                  </div>
                )}
                {!allowed && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="badge bg-slate-200 text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      FIFO 锁定
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected && allowed
                        ? 'bg-primary-500 border-primary-500'
                        : allowed
                        ? 'border-slate-300'
                        : 'border-slate-200 bg-slate-100'
                    }`}
                  >
                    {isSelected && allowed && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
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
                        className={`text-2xl font-bold ${getBatchDaysColor(
                          batch.remainingDays
                        )}`}
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
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-lg">暂无可用库存批次</p>
              <p className="text-sm">已到期或锁定批次均不可出库</p>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-4 flex flex-col">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800">出库办理</h2>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col overflow-y-auto">
          {currentCalling ? (
            <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-primary-50 to-cyan-50 border border-primary-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
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
                      ? '⚡ 加急'
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
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {currentCalling.riderName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
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
                    <span
                      className={`font-medium ${
                        currentRider.swapUsed >= riderPackage.swapCount
                          ? 'text-red-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {currentRider.swapUsed}/{riderPackage.swapCount}
                    </span>
                    {currentRider.swapUsed >= riderPackage.swapCount && (
                      <span className="ml-1 badge bg-red-100 text-red-600 text-[10px]">
                        超额计费
                      </span>
                    )}
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
                  ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-slate-700">
                  出库批次（FIFO 规则）
                </span>
                {selectedBatch.batchId === recommendedBatch?.batchId && (
                  <span className="badge bg-orange-100 text-orange-700 flex items-center gap-1 animate-pulse">
                    <Star className="w-3 h-3 fill-orange-700" />
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
                <span className="font-semibold text-slate-800">
                  可用库存: {selectedBatch.availableQty} 块
                </span>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              出库数量（块）
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOutboundQty((v) => Math.max(1, v - 1))}
                className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max={selectedBatch?.availableQty || 1}
                value={outboundQty}
                onChange={(e) =>
                  setOutboundQty(
                    Math.min(
                      selectedBatch?.availableQty || 1,
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  )
                }
                className="input-field text-center text-xl font-bold flex-1"
              />
              <button
                onClick={() =>
                  setOutboundQty((v) =>
                    Math.min(selectedBatch?.availableQty || v, v + 1)
                  )
                }
                className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-colors"
              >
                +
              </button>
            </div>
            {selectedBatch && outboundQty > selectedBatch.availableQty && (
              <p className="text-xs text-red-500 mt-2">
                超出可用库存 {selectedBatch.availableQty} 块
              </p>
            )}
          </div>

          {pricingInfo && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">计价明细</span>
                <div className="flex gap-2">
                  {isUrgent && (
                    <span
                      className={`badge ${
                        pricingInfo.urgentCost?.withinQuota
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      ⚡ 加急 {pricingInfo.urgentCost?.withinQuota ? '配额' : '计费'}
                    </span>
                  )}
                  <span
                    className={`badge ${
                      pricingInfo.swapCost.withinQuota
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {pricingInfo.swapCost.withinQuota
                      ? `套餐内 ×${pricingInfo.totalFreeSwap}`
                      : `超额 ×${pricingInfo.totalPaidSwap}`}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>
                    换电 {outboundQty} 块
                    {pricingInfo.totalFreeSwap > 0 && (
                      <span className="text-emerald-600">
                        {' '}
                        （免费 {pricingInfo.totalFreeSwap}）
                      </span>
                    )}
                    {pricingInfo.totalPaidSwap > 0 && (
                      <span className="text-yellow-600">
                        {' '}
                        （计费 {pricingInfo.totalPaidSwap} × ¥{pricingInfo.swapCost.perSwapFee}）
                      </span>
                    )}
                  </span>
                  <span className="font-medium">{formatCurrency(pricingInfo.swapCost.cost)}</span>
                </div>
                {isUrgent && pricingInfo.urgentCost && (
                  <div className="flex justify-between text-slate-600">
                    <span>
                      加急服务
                      {pricingInfo.urgentCost.withinQuota && (
                        <span className="text-orange-600">（扣配额）</span>
                      )}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(pricingInfo.urgentCost.cost)}
                    </span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-emerald-200 flex items-end justify-between">
                  <span className="text-xs text-slate-500">
                    {pricingInfo.swapCost.reason}
                    {pricingInfo.urgentCost && ` ｜ ${pricingInfo.urgentCost.reason}`}
                  </span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(pricingInfo.total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`mb-4 p-3 rounded-xl text-sm font-medium flex items-start gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : message.type === 'warning'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.type === 'warning' && (
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <span className="flex-1">{message.text}</span>
            </div>
          )}

          <div className="mt-auto space-y-3">
            <button
              onClick={handleConfirmOutbound}
              disabled={!currentCalling || !selectedBatch || !isBatchAllowed(selectedBatch?.batchId || '')}
              className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              确认出库（{formatCurrency(pricingInfo?.total || 0)}）
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
                  {order.isUrgent && (
                    <span className="badge bg-red-100 text-red-700 text-[10px]">⚡ 加急</span>
                  )}
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
                  <span className="text-slate-500">数量</span>
                  <span className="font-semibold text-slate-700">
                    {order.quantity} 块
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">批次号</span>
                  <span className="text-slate-700 font-mono text-xs">
                    {order.batteryBatchId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">订单号</span>
                  <span className="text-slate-700 font-mono text-xs">{order.orderId}</span>
                </div>
                {(order.swapFee > 0 || order.urgentFee > 0) && (
                  <div className="pt-1 border-t border-slate-100 space-y-1 text-xs">
                    {order.swapFee > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>换电费</span>
                        <span>{formatCurrency(order.swapFee)}</span>
                      </div>
                    )}
                    {order.urgentFee > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>加急费</span>
                        <span>{formatCurrency(order.urgentFee)}</span>
                      </div>
                    )}
                  </div>
                )}
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
