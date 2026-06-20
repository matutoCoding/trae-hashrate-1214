import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BatteryCharging,
  PackagePlus,
  ArrowUpFromLine,
  AlertTriangle,
  Ticket,
  MonitorPlay,
  ListOrdered,
  Wallet,
  Receipt,
  Zap,
  LogOut,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group?: string;
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard, group: '概览' },
  { path: '/battery/batches', label: '批次列表', icon: BatteryCharging, group: '电池批次' },
  { path: '/battery/warehouse', label: '到货入库', icon: PackagePlus, group: '电池批次' },
  { path: '/expiry/outbound', label: '效期出库', icon: ArrowUpFromLine, group: '效期管理' },
  { path: '/expiry/warning', label: '临期预警', icon: AlertTriangle, group: '效期管理' },
  { path: '/queue/ticket', label: '取号登记', icon: Ticket, group: '排队叫号' },
  { path: '/queue/display', label: '叫号大屏', icon: MonitorPlay, group: '排队叫号' },
  { path: '/queue/manage', label: '队列管理', icon: ListOrdered, group: '优先插队' },
  { path: '/pricing/packages', label: '套餐管理', icon: Wallet, group: '套餐计价' },
  { path: '/pricing/bills', label: '账单统计', icon: Receipt, group: '套餐计价' },
];

const Sidebar = () => {
  const location = useLocation();
  const { currentUser, logout } = useUserStore();

  const groupedItems = menuItems.reduce((acc, item) => {
    const group = item.group || '其他';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 z-30 shadow-sm">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-6 border-b border-slate-100"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">电池换电</h1>
            <p className="text-xs text-slate-400">智能管理系统</p>
          </div>
        </div>
      </motion.div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {Object.entries(groupedItems).map(([group, items], groupIndex) => (
          <div key={group} className="mb-4">
            {groupIndex > 0 && (
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
                {group}
              </p>
            )}
            <ul className="space-y-1">
              {items.map((item, idx) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <motion.li
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIndex * 0.1 + idx * 0.03 }}
                  >
                    <NavLink
                      to={item.path}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                        ${isActive
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-200'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-primary-700'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? '' : 'opacity-75'}`} />
                      <span>{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                        />
                      )}
                    </NavLink>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-slate-500">
                {currentUser?.role === 'admin' ? '运营管理员' : currentUser?.role === 'operator' ? '站点操作员' : '骑手'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
