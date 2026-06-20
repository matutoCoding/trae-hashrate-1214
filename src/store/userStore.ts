import { create } from 'zustand';
import type { Rider, PricingPackage } from '@/types';
import { mockRiders, mockPricingPackages } from '@/mock';

type UserRole = 'admin' | 'operator' | 'rider';

interface User {
  userId: string;
  username: string;
  role: UserRole;
  name: string;
  avatar?: string;
}

interface UserStore {
  currentUser: User | null;
  isLoggedIn: boolean;
  riders: Rider[];
  packages: PricingPackage[];

  login: (username: string, password: string) => boolean;
  logout: () => void;
  getRiderById: (riderId: string) => Rider | undefined;
  getPackageById: (packageId: string) => PricingPackage | undefined;
  updateRider: (riderId: string, data: Partial<Rider>) => void;
  addPackage: (pkg: Partial<PricingPackage>) => PricingPackage;
  updatePackage: (packageId: string, data: Partial<PricingPackage>) => void;
  getRidersByLevel: () => { vip: number; normal: number };
  getPackageRevenue: () => { name: string; value: number }[];
}

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: {
    userId: 'U001',
    username: 'admin',
    role: 'admin',
    name: '系统管理员',
  },
  isLoggedIn: true,
  riders: mockRiders,
  packages: mockPricingPackages,

  login: (username, password) => {
    if (username === 'admin' && password === '123456') {
      set({
        currentUser: {
          userId: 'U001',
          username: 'admin',
          role: 'admin',
          name: '系统管理员',
        },
        isLoggedIn: true,
      });
      return true;
    }
    if (username === 'operator' && password === '123456') {
      set({
        currentUser: {
          userId: 'U002',
          username: 'operator',
          role: 'operator',
          name: '站点操作员',
        },
        isLoggedIn: true,
      });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ currentUser: null, isLoggedIn: false });
  },

  getRiderById: (riderId) => {
    return get().riders.find((r) => r.riderId === riderId);
  },

  getPackageById: (packageId) => {
    return get().packages.find((p) => p.packageId === packageId);
  },

  updateRider: (riderId, data) => {
    set((state) => ({
      riders: state.riders.map((r) =>
        r.riderId === riderId ? { ...r, ...data } : r
      ),
    }));
  },

  addPackage: (pkg) => {
    const newPkg: PricingPackage = {
      packageId: `PKG${Date.now().toString().slice(-6)}`,
      name: pkg.name || '新套餐',
      monthlyFee: pkg.monthlyFee || 399,
      swapCount: pkg.swapCount || 50,
      urgentQuota: pkg.urgentQuota || 3,
      description: pkg.description || '',
      perSwapFee: pkg.perSwapFee || 12,
      urgentFee: pkg.urgentFee || 15,
      deposit: pkg.deposit || 500,
    };
    set((state) => ({ packages: [...state.packages, newPkg] }));
    return newPkg;
  },

  updatePackage: (packageId, data) => {
    set((state) => ({
      packages: state.packages.map((p) =>
        p.packageId === packageId ? { ...p, ...data } : p
      ),
    }));
  },

  getRidersByLevel: () => {
    const { riders } = get();
    return {
      vip: riders.filter((r) => r.level === 'VIP').length,
      normal: riders.filter((r) => r.level === 'NORMAL').length,
    };
  },

  getPackageRevenue: () => {
    const { riders, packages } = get();
    return packages.map((pkg) => {
      const count = riders.filter((r) => r.packageId === pkg.packageId).length;
      return {
        name: pkg.name,
        value: count * pkg.monthlyFee,
      };
    });
  },
}));
