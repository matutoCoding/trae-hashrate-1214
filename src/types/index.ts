export type BatteryStatus = 'in_stock' | 'in_rent' | 'maintenance' | 'locked' | 'expired';

export type ExpiryWarningLevel = 'normal' | 'caution' | 'warning' | 'danger' | 'locked';

export interface BatteryBatch {
  batchId: string;
  supplier: string;
  quantity: number;
  availableQty: number;
  manufactureDate: string;
  expiryDate: string;
  remainingDays: number;
  status: BatteryStatus;
  warehouseLocation: string;
  createdAt: string;
  healthScore: number;
  capacity: number;
}

export interface Rider {
  riderId: string;
  name: string;
  phone: string;
  level: 'VIP' | 'NORMAL';
  packageId: string;
  urgentCount: number;
  swapUsed: number;
  avatar?: string;
}

export type TicketStatus = 'waiting' | 'calling' | 'processing' | 'completed' | 'cancelled';
export type QueueType = 'URGENT' | 'VIP' | 'NORMAL';

export interface QueueTicket {
  ticketId: string;
  riderId: string;
  riderName: string;
  riderPhone: string;
  queueType: QueueType;
  priority: number;
  status: TicketStatus;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
  packageName: string;
  estimatedTime?: number;
  windowNo?: number;
  urgentQuotaUsed?: boolean;
  urgentFeeCharged?: boolean;
}

export interface PricingPackage {
  packageId: string;
  name: string;
  monthlyFee: number;
  swapCount: number;
  urgentQuota: number;
  description: string;
  perSwapFee: number;
  urgentFee: number;
  deposit: number;
}

export interface RentalOrder {
  orderId: string;
  riderId: string;
  riderName: string;
  batteryBatchId: string;
  type: 'RENT' | 'SWAP';
  quantity: number;
  swapFee: number;
  urgentFee: number;
  amount: number;
  createdAt: string;
  status: 'paid' | 'unpaid' | 'refunded';
  packageId: string;
  isUrgent: boolean;
}

export interface WarningBatch {
  batchId: string;
  level: ExpiryWarningLevel;
  remainingDays: number;
  expiryDate: string;
  quantity: number;
  supplier: string;
}

export interface QueueLog {
  id: string;
  ticketId: string;
  action: 'create' | 'jump' | 'priority_change' | 'call' | 'complete' | 'cancel';
  operator: string;
  timestamp: string;
  remark?: string;
}
