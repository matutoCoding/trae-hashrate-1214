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
  getWarningBatches: () => WarningBatch[];
  getLockedBatches: () => BatteryBatch[];
  lockBatch: (batchId: string) => void;
  unlockBatch: (batchId: string) => void;
  outbounds: (batchId: string, qty: number) => boolean;
  createOrder: (order: Partial<RentalOrder>) => RentalOrder;
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
    const newBatch: BatteryBatch = {
      batchId: data.batchId || generateBatchId(),
      supplier: data.supplier || '未知供应商',
      quantity: data.quantity || 100,
      availableQty: data.availableQty || data.quantity || 100,
      manufactureDate: data.manufactureDate || dayjs().format('YYYY-MM-DD'),
      expiryDate: data.expiryDate || dayjs().add(365, 'day').format('YYYY-MM-DD'),
      remainingDays: getRemainingDays(
        data.expiryDate || dayjs().add(365, 'day').format('YYYY-MM-DD')
      ),
      status: 'in_stock',
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
      .filter((b) => b.status === 'in_stock' && b.availableQty > 0)
      .sort((a, b) => a.remainingDays - b.remainingDays);
  },

  getWarningBatches: () => {
    const { batches } = get();
    return batches
      .filter((b) => b.status !== 'locked' && b.remainingDays <= 90)
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
    const { batches } = get();
    const batch = batches.find((b) => b.batchId === batchId);
    if (!batch || batch.status === 'locked' || batch.availableQty < qty) {
      return false;
    }
    set((state) => ({
      batches: state.batches.map((b) =>
        b.batchId === batchId
          ? { ...b, availableQty: b.availableQty - qty }
          : b
      ),
    }));
    return true;
  },

  createOrder: (order) => {
    const newOrder: RentalOrder = {
      orderId: order.orderId || generateOrderId(),
      riderId: order.riderId || 'R000',
      riderName: order.riderName || '未知骑手',
      batteryBatchId: order.batteryBatchId || '',
      type: order.type || 'SWAP',
      amount: order.amount || 0,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      status: order.status || 'paid',
      packageId: order.packageId || 'PKG001',
    };
    set((state) => ({ orders: [newOrder, ...state.orders] }));
    return newOrder;
  },

  getDashboardStats: () => {
    const { batches, orders } = get();
    const today = dayjs().format('YYYY-MM-DD');
    const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
    const totalBatteries = batches.reduce((s, b) => s + b.quantity, 0);
    const inStock = batches.reduce((s, b) => s + b.availableQty, 0);
    const warnings = batches.filter(
      (b) => b.status !== 'locked' && b.remainingDays <= 90
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
      todaySwap: todayOrders.length,
      avgHealthScore: Math.round(avgHealth),
    };
  },

  getSwapTrend: () => {
    const { orders } = get();
    const result: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('MM-DD');
      const fullDate = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const count = orders.filter((o) => o.createdAt.startsWith(fullDate)).length;
      result.push({ date, count: count + Math.floor(Math.random() * 15) + 5 });
    }
    return result;
  },
}));
