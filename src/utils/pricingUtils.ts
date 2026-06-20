import type { PricingPackage, Rider } from '@/types';

export interface SwapCostDetail {
  cost: number;
  withinQuota: boolean;
  freeCount: number;
  paidCount: number;
  perSwapFee: number;
  reason: string;
}

export interface UrgentCostDetail {
  cost: number;
  withinQuota: boolean;
  urgentFee: number;
  reason: string;
}

export const calculateSwapCost = (
  rider: Rider,
  pkg: PricingPackage,
  quantity: number = 1
): SwapCostDetail => {
  const remainingFree = Math.max(0, pkg.swapCount - rider.swapUsed);
  const freeCount = Math.min(remainingFree, quantity);
  const paidCount = quantity - freeCount;
  const cost = paidCount * pkg.perSwapFee;
  const withinQuota = paidCount === 0;

  let reason = '';
  if (withinQuota) {
    reason = `套餐内免费换电 ${freeCount} 块（剩余免费额度 ${remainingFree - freeCount} 块）`;
  } else if (freeCount > 0) {
    reason = `套餐内免费 ${freeCount} 块 + 超额 ${paidCount} 块 × ¥${pkg.perSwapFee}`;
  } else {
    reason = `超出套餐配额，${quantity} 块 × ¥${pkg.perSwapFee} = ¥${cost}`;
  }

  return {
    cost,
    withinQuota,
    freeCount,
    paidCount,
    perSwapFee: pkg.perSwapFee,
    reason,
  };
};

export const calculateUrgentCost = (
  rider: Rider,
  pkg: PricingPackage
): UrgentCostDetail => {
  if (rider.urgentCount > 0) {
    return {
      cost: 0,
      withinQuota: true,
      urgentFee: 0,
      reason: `加急配额充足，扣减 1 次加急（剩余 ${rider.urgentCount - 1} 次）`,
    };
  }
  return {
    cost: pkg.urgentFee,
    withinQuota: false,
    urgentFee: pkg.urgentFee,
    reason: `加急配额已用完，加急费 ¥${pkg.urgentFee}`,
  };
};

export const calculateTotalCost = (
  rider: Rider,
  pkg: PricingPackage,
  quantity: number,
  isUrgent: boolean
): {
  swapCost: SwapCostDetail;
  urgentCost: UrgentCostDetail | null;
  total: number;
  totalFreeSwap: number;
  totalPaidSwap: number;
  willConsumeUrgent: boolean;
} => {
  const swapCost = calculateSwapCost(rider, pkg, quantity);
  const urgentCost = isUrgent ? calculateUrgentCost(rider, pkg) : null;
  return {
    swapCost,
    urgentCost,
    total: swapCost.cost + (urgentCost?.cost || 0),
    totalFreeSwap: swapCost.freeCount,
    totalPaidSwap: swapCost.paidCount,
    willConsumeUrgent: isUrgent && rider.urgentCount > 0,
  };
};

export const getRemainingSwapQuota = (
  rider: Rider,
  pkg: PricingPackage
): { remaining: number; total: number; percent: number } => {
  const remaining = Math.max(0, pkg.swapCount - rider.swapUsed);
  const percent = Math.round((remaining / pkg.swapCount) * 100);
  return { remaining, total: pkg.swapCount, percent };
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const getPackageUsageSummary = (
  rider: Rider,
  pkg: PricingPackage
): {
  swapText: string;
  urgentText: string;
  monthlyFeeText: string;
  depositText: string;
} => {
  const swapInfo = getRemainingSwapQuota(rider, pkg);
  return {
    swapText: `换电次数 ${pkg.swapCount - swapInfo.remaining}/${pkg.swapCount}`,
    urgentText: `加急剩余 ${rider.urgentCount}/${pkg.urgentQuota} 次`,
    monthlyFeeText: `月费 ¥${pkg.monthlyFee}`,
    depositText: `押金 ¥${pkg.deposit}`,
  };
};
