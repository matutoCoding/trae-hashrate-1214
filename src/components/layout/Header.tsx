import { Bell, Search, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Badge } from 'antd';
import { useQueueStore } from '@/store/queueStore';
import { useBatteryStore } from '@/store/batteryStore';

const Header = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [soundOn, setSoundOn] = useState(true);
  const { getQueueStats } = useQueueStore();
  const { getWarningBatches, refreshBatches } = useBatteryStore();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const queueStats = getQueueStats();
  const warnings = getWarningBatches();
  const notificationCount = queueStats.urgentCount + warnings.filter(w => w.level === 'danger').length;

  const handleRefresh = () => {
    refreshBatches();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索批次号、骑手、取号..."
            className="pl-11 pr-4 py-2 w-80 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary-100 outline-none transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-lg font-bold text-slate-800 tracking-wide">
            {currentTime.format('HH:mm:ss')}
          </p>
          <p className="text-xs text-slate-400">
            {currentTime.format('YYYY年MM月DD日 dddd')}
          </p>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <button
          onClick={() => setSoundOn(!soundOn)}
          className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 transition-all duration-200"
          title={soundOn ? '关闭提示音' : '开启提示音'}
        >
          {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <button
          onClick={handleRefresh}
          className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-primary-600 transition-all duration-200 group"
          title="刷新数据"
        >
          <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
        </button>

        <button className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 relative transition-all duration-200">
          <Badge count={notificationCount} size="small" offset={[-2, 2]}>
            <Bell className="w-5 h-5" />
          </Badge>
        </button>
      </div>
    </header>
  );
};

export default Header;
