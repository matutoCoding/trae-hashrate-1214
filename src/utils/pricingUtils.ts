import type { PricingPackage, Rider } from '@/types';

export const calculateSwapCost = (
  rider: Rider,
  pkg: PricingPackage
): { cost: number; withinQuota: boolean; reason?: string } => {
  if (rider.swapUsed < pkg.swapCount) {
    return { cost: 0, withinQuota: true, reason: '套餐内免费换电' };
  }
  return {
    cost: pkg.perSwapFee,
    withinQuota: false,
    reason: `超出套餐配额，按次计费 ¥${pkg.perSwapFee}`,
  };
};

export const calculateUrgentCost = (
  rider: Rider,
  pkg: PricingPackage
): { cost: number; withinQuota: boolean; reason?: string } => {
  if (rider.urgentCount > 0) {
    return { cost: 0, withinQuota: true, reason: '加急配额充足' };
  }
  return {
    cost: pkg.urgentFee,
    withinQuota: false,
    reason: `加急配额已用完，加急费 ¥${pkg.urgentFee}`,
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
