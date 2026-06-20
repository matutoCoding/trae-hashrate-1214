import { useMemo } from 'react';
import type { BatteryBatch } from '@/types';
import { useBatteryStore } from '@/store/batteryStore';

export const useFIFO = () => {
  const { getFIFOBatches, outbounds, createOrder } = useBatteryStore();

  const fifoBatches = useMemo(() => getFIFOBatches(), [getFIFOBatches]);

  const recommendedBatch = useMemo(() => {
    return fifoBatches.find((b) => b.status === 'in_stock' && b.availableQty > 0) || null;
  }, [fifoBatches]);

  const getBatchesBySupplier = (supplier: string): BatteryBatch[] => {
    return fifoBatches.filter((b) => b.supplier === supplier);
  };

  const getTotalAvailable = (): number => {
    return fifoBatches.reduce((sum, b) => sum + b.availableQty, 0);
  };

  const processOutbound = (
    riderId: string,
    riderName: string,
    packageId: string,
    amount: number,
    batchId?: string
  ): { success: boolean; batch?: BatteryBatch; message: string } => {
    const targetBatchId = batchId || recommendedBatch?.batchId;
    if (!targetBatchId) {
      return { success: false, message: '暂无可用电池库存' };
    }
    const result = outbounds(targetBatchId, 1);
    if (!result) {
      return { success: false, message: '电池出库失败，请检查库存' };
    }
    createOrder({
      riderId,
      riderName,
      batteryBatchId: targetBatchId,
      type: 'SWAP',
      amount,
      packageId,
    });
    const batch = fifoBatches.find((b) => b.batchId === targetBatchId);
    return { success: true, batch, message: '出库成功' };
  };

  return {
    fifoBatches,
    recommendedBatch,
    getBatchesBySupplier,
    getTotalAvailable,
    processOutbound,
  };
};
