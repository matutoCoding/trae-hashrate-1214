import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import type { ExpiryWarningLevel } from '@/types';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD') => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return dayjs(date).format(format);
};

export const getRemainingDays = (expiryDate: string | Date): number => {
  const now = dayjs();
  const expiry = dayjs(expiryDate);
  return expiry.diff(now, 'day');
};

export const getExpiryWarningLevel = (remainingDays: number): ExpiryWarningLevel => {
  if (remainingDays <= 0) return 'locked';
  if (remainingDays <= 30) return 'danger';
  if (remainingDays <= 90) return 'warning';
  if (remainingDays <= 180) return 'caution';
  return 'normal';
};

export const getWarningLevelColor = (level: ExpiryWarningLevel): string => {
  const colors: Record<ExpiryWarningLevel, string> = {
    normal: '#16A34A',
    caution: '#2563EB',
    warning: '#EAB308',
    danger: '#DC2626',
    locked: '#6B7280',
  };
  return colors[level];
};

export const getWarningLevelText = (level: ExpiryWarningLevel): string => {
  const texts: Record<ExpiryWarningLevel, string> = {
    normal: '正常',
    caution: '关注',
    warning: '临期',
    danger: '紧急',
    locked: '已锁定',
  };
  return texts[level];
};

export const generateBatchId = (): string => {
  const now = dayjs();
  const prefix = `BAT${now.format('YYYYMMDD')}`;
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${suffix}`;
};

export const generateTicketId = (): string => {
  const now = dayjs();
  const prefix = `Q${now.format('MMDD')}`;
  const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${suffix}`;
};

export const generateOrderId = (): string => {
  const now = dayjs();
  const prefix = `ORD${now.format('YYYYMMDDHHmmss')}`;
  const suffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}${suffix}`;
};

export const getRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

export const formatDuration = (minutes: number): string => {
  const d = dayjs.duration(minutes, 'minutes');
  if (minutes < 60) return `${minutes}分钟`;
  return `${d.hours()}小时${d.minutes() > 0 ? d.minutes() + '分钟' : ''}`;
};
