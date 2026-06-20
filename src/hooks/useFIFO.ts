import { useMemo } from 'react';
import type { BatteryBatch } from '@/types';
import { useBatteryStore } from '@/store/batteryStore';
import { useUserStore } from '@/store/userStore';
import { useQueueStore } from '@/store/queueStore';
import { calculateSwapCost, formatCurrency } from '@/utils/pricingUtils';

export interface OutboundResult {
  success: boolean;
  message: string;
  blocked?: boolean;
  orderId?: string;
  batchId?: string;
  quantity?: number;
  amount?: number;
  swapFee?: number;
  urgentFee?: number;
  freeSwapUsed?: number;
  paidSwapUsed?: number;
  urgentQuotaUsed?: boolean;
  urgentFeeCharged?: boolean;
}

export const useFIFO = () => {
  const { getFIFOBatches, getRecommendedBatch, processFIFOSwap, orders } =
    useBatteryStore();
  const { getRiderById, getPackageById, consumeSwapQuota } =
    useUserStore();

  const fifoBatches = useMemo(() => getFIFOBatches(), [getFIFOBatches]);
  const recommendedBatch = useMemo(() => getRecommendedBatch(), [getRecommendedBatch]);

  const getBatchesBySupplier = (supplier: string): BatteryBatch[] => {
    return fifoBatches.filter((b) => b.supplier === supplier);
  };

  const getTotalAvailable = (): number => {
    return fifoBatches.reduce((sum, b) => sum + b.availableQty, 0);
  };

  const isBatchAllowed = (batchId: string): boolean => {
    if (!recommendedBatch) return false;
    return batchId === recommendedBatch.batchId;
  };

  const confirmOutbound = (params: {
    riderId: string;
    riderName: string;
    quantity: number;
    isUrgent: boolean;
    selectedBatchId?: string;
    ticketId?: string;
  }): OutboundResult => {
    const { riderId, riderName, quantity, isUrgent, selectedBatchId, ticketId } = params;

    if (quantity <= 0) {
      return { success: false, message: '出库数量必须大于 0' };
    }

    if (selectedBatchId && !isBatchAllowed(selectedBatchId)) {
      return {
        success: false,
        blocked: true,
        message: `出库必须遵循 FIFO 效期先进先出规则，请选择推荐批次「${recommendedBatch?.batchId || '暂无'}」，不能选择其他批次。`,
      };
    }

    const rider = getRiderById(riderId);
    if (!rider) {
      return { success: false, message: '骑手信息不存在' };
    }
    const pkg = getPackageById(rider.packageId);
    if (!pkg) {
      return { success: false, message: '骑手套餐信息不存在' };
    }

    const swapCost = calculateSwapCost(rider, pkg, quantity);

    let urgentQuotaUsed = false;
    let urgentFeeCharged = false;
    let urgentFee = 0;

    if (isUrgent && ticketId) {
      const ticket = useQueueStore.getState().tickets.find(
        (t) => t.ticketId === ticketId
      );
      urgentQuotaUsed = ticket?.urgentQuotaUsed || false;
      urgentFeeCharged = ticket?.urgentFeeCharged || false;

      if (ticket && ticket.urgentFeeAmount !== undefined && ticket.urgentFeeAmount > 0) {
        urgentFee = ticket.urgentFeeAmount;
      } else if (urgentFeeCharged) {
        urgentFee = pkg.urgentFee;
      }
    } else if (isUrgent) {
      urgentFee = pkg.urgentFee;
      urgentFeeCharged = true;
    }

    const totalAmount = swapCost.cost + urgentFee;

    const result = processFIFOSwap({
      riderId,
      riderName,
      packageId: rider.packageId,
      quantity,
      swapFee: swapCost.cost,
      urgentFee,
      amount: totalAmount,
      isUrgent,
      enforceFIFO: true,
      requestedBatchId: selectedBatchId,
    });

    if (!result.success) {
      return {
        success: false,
        blocked: result.blocked,
        message: result.message,
      };
    }

    consumeSwapQuota(riderId, quantity);

    return {
      success: true,
      message: result.message,
      orderId: result.order?.orderId,
      batchId: result.batch?.batchId,
      quantity,
      amount: totalAmount,
      swapFee: swapCost.cost,
      urgentFee,
      freeSwapUsed: swapCost.freeCount,
      paidSwapUsed: swapCost.paidCount,
      urgentQuotaUsed,
      urgentFeeCharged,
    };
  };

  const recentOutbounds = useMemo(
    () =>
      [...orders]
        .filter((o) => o.type === 'SWAP')
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5),
    [orders]
  );

  return {
    fifoBatches,
    recommendedBatch,
    getBatchesBySupplier,
    getTotalAvailable,
    isBatchAllowed,
    confirmOutbound,
    recentOutbounds,
  };
};
