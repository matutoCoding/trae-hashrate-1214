import { create } from 'zustand';
import dayjs from 'dayjs';
import type { BatteryBatch, RentalOrder, WarningBatch } from '@/types';
import {
  mockBatteryBatches,
  mockRentalOrders,
  recalculateRemainingDays,
} from '@/mock';
import {
  getRemainingDays,
  getExpiryWarningLevel,
  generateBatchId,
  generateOrderId,
} from '@/utils/dateUtils';

interface BatteryStore {
  batches: BatteryBatch[];
  orders: RentalOrder[];
  refreshBatches: () => void;
  addBatch: (data: Partial<BatteryBatch>) => BatteryBatch;
  getFIFOBatches: () => BatteryBatch[];
  getRecommendedBatch: () => BatteryBatch | null;
  getWarningBatches: () => WarningBatch[];
  getLockedBatches: () => BatteryBatch[];
  lockBatch: (batchId: string) => void;
  unlockBatch: (batchId: string) => void;
  outbounds: (batchId: string, qty: number) => { success: boolean; message: string };
  createOrder: (order: Partial<RentalOrder>) => RentalOrder;
  processFIFOSwap: (params: {
    riderId: string;
    riderName: string;
    packageId: string;
    quantity: number;
    swapFee: number;
    urgentFee: number;
    amount: number;
    isUrgent: boolean;
    enforceFIFO?: boolean;
    requestedBatchId?: string;
  }) => {
    success: boolean;
    message: string;
    order?: RentalOrder;
    batch?: BatteryBatch;
    blocked?: boolean;
  };
  getDashboardStats: () => {
    totalBatteries: number;
    inStock: number;
    inRent: number;
    warningCount: number;
    lockedCount: number;
    todaySwap: number;
    avgHealthScore: number;
  };
  getSwapTrend: () => { date: string; count: number }[];
}

export const useBatteryStore = create<BatteryStore>((set, get) => ({
  batches: recalculateRemainingDays(mockBatteryBatches),
  orders: mockRentalOrders,

  refreshBatches: () => {
    set((state) => ({
      batches: state.batches.map((b) => {
        const remaining = getRemainingDays(b.expiryDate);
        let status = b.status;
        if (remaining <= 0 && b.status !== 'locked') {
          status = 'locked';
        }
        return { ...b, remainingDays: remaining, status };
      }),
    }));
  },

  addBatch: (data) => {
    const expiryDate =
      data.expiryDate || dayjs().add(365, 'day').format('YYYY-MM-DD');
    const remaining = getRemainingDays(expiryDate);
    const autoLocked = remaining <= 0;
    const status: BatteryBatch['status'] = autoLocked ? 'locked' : 'in_stock';

    const newBatch: BatteryBatch = {
      batchId: data.batchId || generateBatchId(),
      supplier: data.supplier || '未知供应商',
      quantity: data.quantity || 100,
      availableQty: autoLocked ? 0 : data.availableQty || data.quantity || 100,
      manufactureDate: data.manufactureDate || dayjs().format('YYYY-MM-DD'),
      expiryDate,
      remainingDays: remaining,
      status,
      warehouseLocation: data.warehouseLocation || '未分配',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      healthScore: data.healthScore || 100,
      capacity: data.capacity || 60,
    };
    set((state) => ({ batches: [newBatch, ...state.batches] }));
    return newBatch;
  },

  getFIFOBatches: () => {
    const { batches } = get();
    return batches
      .filter((b) => b.status === 'in_stock' && b.availableQty > 0 && b.remainingDays > 0)
      .sort((a, b) => a.remainingDays - b.remainingDays);
  },

  getRecommendedBatch: () => {
    return get().getFIFOBatches()[0] || null;
  },

  getWarningBatches: () => {
    const { batches } = get();
    return batches
      .filter((b) => b.status !== 'locked' && b.remainingDays <= 90 && b.remainingDays > 0)
      .map((b) => ({
        batchId: b.batchId,
        level: getExpiryWarningLevel(b.remainingDays),
        remainingDays: b.remainingDays,
        expiryDate: b.expiryDate,
        quantity: b.availableQty,
        supplier: b.supplier,
      }))
      .sort((a, b) => a.remainingDays - b.remainingDays);
  },

  getLockedBatches: () => {
    const { batches } = get();
    return batches.filter((b) => b.status === 'locked');
  },

  lockBatch: (batchId) => {
    set((state) => ({
      batches: state.batches.map((b) =>
        b.batchId === batchId ? { ...b, status: 'locked' } : b
      ),
    }));
  },

  unlockBatch: (batchId) => {
    set((state) => ({
      batches: state.batches.map((b) =>
        b.batchId === batchId && b.remainingDays > 0
          ? { ...b, status: 'in_stock' }
          : b
      ),
    }));
  },

  outbounds: (batchId, qty) => {
    if (qty <= 0) return { success: false, message: '出库数量必须大于0' };
    const { batches } = get();
    const batch = batches.find((b) => b.batchId === batchId);
    if (!batch) return { success: false, message: '批次不存在' };
    if (batch.status === 'locked') return { success: false, message: '该批次已锁定，不可出库' };
    if (batch.remainingDays <= 0) return { success: false, message: '该批次已到期，不可出库' };
    if (batch.availableQty < qty) {
      return {
        success: false,
        message: `库存不足，可用数量仅 ${batch.availableQty} 块`,
      };
    }
    set((state) => ({
      batches: state.batches.map((b) =>
        b.batchId === batchId
          ? { ...b, availableQty: b.availableQty - qty }
          : b
      ),
    }));
    return { success: true, message: '出库成功' };
  },

  createOrder: (order) => {
    const newOrder: RentalOrder = {
      orderId: order.orderId || generateOrderId(),
      riderId: order.riderId || 'R000',
      riderName: order.riderName || '未知骑手',
      batteryBatchId: order.batteryBatchId || '',
      type: order.type || 'SWAP',
      quantity: order.quantity || 1,
      swapFee: order.swapFee || 0,
      urgentFee: order.urgentFee || 0,
      amount: order.amount || 0,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      status: order.status || 'paid',
      packageId: order.packageId || 'PKG001',
      isUrgent: order.isUrgent || false,
    };
    set((state) => ({ orders: [newOrder, ...state.orders] }));
    return newOrder;
  },

  processFIFOSwap: ({
    riderId,
    riderName,
    packageId,
    quantity,
    swapFee,
    urgentFee,
    amount,
    isUrgent,
    enforceFIFO = true,
    requestedBatchId,
  }) => {
    const recommended = get().getRecommendedBatch();

    if (enforceFIFO && requestedBatchId && requestedBatchId !== recommended?.batchId) {
      return {
        success: false,
        blocked: true,
        message: `出库必须遵循 FIFO 规则，请选择推荐批次「${recommended?.batchId || '暂无可用批次'}」。当前所选批次不是效期最早的。`,
      };
    }

    const targetBatch = enforceFIFO ? recommended : get().batches.find((b) => b.batchId === requestedBatchId);

    if (!targetBatch) {
      return { success: false, message: '暂无可用电池库存' };
    }

    const outboundResult = get().outbounds(targetBatch.batchId, quantity);
    if (!outboundResult.success) {
      return { success: false, message: outboundResult.message };
    }

    const order = get().createOrder({
      riderId,
      riderName,
      batteryBatchId: targetBatch.batchId,
      type: 'SWAP',
      quantity,
      swapFee,
      urgentFee,
      amount,
      packageId,
      isUrgent,
      status: 'paid',
    });

    const finalBatch = get().batches.find((b) => b.batchId === targetBatch.batchId);

    return {
      success: true,
      message: `出库成功：从批次 ${targetBatch.batchId} 出库 ${quantity} 块电池`,
      order,
      batch: finalBatch,
    };
  },

  getDashboardStats: () => {
    const { batches, orders } = get();
    const today = dayjs().format('YYYY-MM-DD');
    const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
    const totalBatteries = batches.reduce((s, b) => s + b.quantity, 0);
    const inStock = batches.reduce((s, b) => s + b.availableQty, 0);
    const warnings = batches.filter(
      (b) => b.status !== 'locked' && b.remainingDays <= 90 && b.remainingDays > 0
    ).length;
    const locked = batches.filter((b) => b.status === 'locked').length;
    const avgHealth =
      batches.reduce((s, b) => s + b.healthScore, 0) / (batches.length || 1);

    return {
      totalBatteries,
      inStock,
      inRent: totalBatteries - inStock,
      warningCount: warnings,
      lockedCount: locked,
      todaySwap: todayOrders.reduce((s, o) => s + o.quantity, 0),
      avgHealthScore: Math.round(avgHealth),
    };
  },

  getSwapTrend: () => {
    const { orders } = get();
    const result: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('MM-DD');
      const fullDate = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const dayOrders = orders.filter((o) => o.createdAt.startsWith(fullDate));
      const qty = dayOrders.reduce((s, o) => s + o.quantity, 0);
      result.push({ date, count: qty + Math.floor(Math.random() * 10) + 3 });
    }
    return result;
  },
}));
