import { useMemo, useEffect } from 'react';
import { useBatteryStore } from '@/store/batteryStore';
import { getExpiryWarningLevel, getWarningLevelColor, getWarningLevelText } from '@/utils/dateUtils';
import type { ExpiryWarningLevel } from '@/types';

export const useExpiryCheck = () => {
  const { batches, refreshBatches, getWarningBatches, getLockedBatches, lockBatch, unlockBatch } =
    useBatteryStore();

  useEffect(() => {
    refreshBatches();
    const interval = setInterval(refreshBatches, 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshBatches]);

  const warningBatches = useMemo(() => getWarningBatches(), [getWarningBatches]);
  const lockedBatches = useMemo(() => getLockedBatches(), [getLockedBatches]);

  const dangerBatches = useMemo(
    () => warningBatches.filter((b) => b.level === 'danger'),
    [warningBatches]
  );
  const warningOnlyBatches = useMemo(
    () => warningBatches.filter((b) => b.level === 'warning'),
    [warningBatches]
  );
  const cautionBatches = useMemo(
    () => warningBatches.filter((b) => b.level === 'caution'),
    [warningBatches]
  );

  const stats = useMemo(
    () => ({
      total: warningBatches.length + lockedBatches.length,
      danger: dangerBatches.length,
      warning: warningOnlyBatches.length,
      caution: cautionBatches.length,
      locked: lockedBatches.length,
      dangerQty: dangerBatches.reduce((s, b) => s + b.quantity, 0),
      warningQty: warningOnlyBatches.reduce((s, b) => s + b.quantity, 0),
      lockedQty: lockedBatches.reduce((s, b) => s + b.availableQty, 0),
    }),
    [
      warningBatches,
      lockedBatches,
      dangerBatches,
      warningOnlyBatches,
      cautionBatches,
    ]
  );

  const getBatchWarningInfo = (remainingDays: number): {
    level: ExpiryWarningLevel;
    color: string;
    text: string;
    isLocked: boolean;
  } => {
    const level = getExpiryWarningLevel(remainingDays);
    return {
      level,
      color: getWarningLevelColor(level),
      text: getWarningLevelText(level),
      isLocked: level === 'locked',
    };
  };

  const batchLock = (batchId: string) => lockBatch(batchId);
  const batchUnlock = (batchId: string) => unlockBatch(batchId);

  const upcomingExpiryInDays = (days: number) => {
    return batches.filter(
      (b) => b.status !== 'locked' && b.remainingDays > 0 && b.remainingDays <= days
    );
  };

  return {
    batches,
    warningBatches,
    lockedBatches,
    dangerBatches,
    warningOnlyBatches,
    cautionBatches,
    stats,
    getBatchWarningInfo,
    lockBatch: batchLock,
    unlockBatch: batchUnlock,
    upcomingExpiryInDays,
  };
};
