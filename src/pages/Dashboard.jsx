import { getCurrentUser, getCurrentHousehold, getExpenses, getBalanceSummary, getSchedules, getSharedItems, getAgreements, getHouseholdMembers } from '../lib/store';
import { Receipt, Calendar, Package, FileText, TrendingUp, AlertTriangle, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function Dashboard() {
  const user = getCurrentUser();
  const household = getCurrentHousehold();
  const members = getHouseholdMembers(household?.id);
  const expenses = getExpenses();
  const { debts } = getBalanceSummary();
  const currentMonth = format(new Date(), 'yyyy-MM');
  const schedules = getSchedules(currentMonth);
  const items = getSharedItems();
  const agreements = getAgreements();

  const lowItems = items.filter(i => i.quantity <= i.threshold);
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaySchedule = schedules.find(s => s.date === today);
  const recentExpenses = expenses.slice(0, 3);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const quickStats = [
    { label: '本月支出', value: `¥${totalSpent.toFixed(2)}`, icon: TrendingUp, color: 'bg-blue-50 text-blue-500' },
    { label: '室友数', value: members.length, icon: Users, color: 'bg-purple-50 text-purple-500' },
    { label: '待结算', value: debts.length > 0 ? `${debts.length}笔` : '已结清', icon: Receipt, color: 'bg-amber-50 text-amber-500' },
    { label: '物品库存', value: `${items.length}种`, icon: Package, color: 'bg-green-50 text-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">👋 你好，{user?.name}！</h1>
        <p className="text-white/80">欢迎回到 {household?.name} 的合租管家</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-lg font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              今日值日
            </h2>
            <Link to="/cleaning" className="text-sm text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {todaySchedule ? (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                {members.find(m => m.id === todaySchedule.userId)?.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-medium text-slate-700">{members.find(m => m.id === todaySchedule.userId)?.name || '未知'}</p>
                <p className="text-sm text-slate-400">{todaySchedule.completed ? '✅ 已完成' : '⏳ 待完成'}</p>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-4 text-center">今天没有安排值日</p>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              库存提醒
            </h2>
            <Link to="/items" className="text-sm text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {lowItems.length > 0 ? (
            <div className="space-y-2">
              {lowItems.slice(0, 3).map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  <span className="text-sm text-amber-600">剩余 {item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-4 text-center">所有物品库存充足 ✅</p>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-500" />
              最近费用
            </h2>
            <Link to="/expenses" className="text-sm text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentExpenses.length > 0 ? (
            <div className="space-y-2">
              {recentExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{exp.title}</p>
                    <p className="text-xs text-slate-400">{members.find(m => m.id === exp.paidBy)?.name || '未知'} 付款</p>
                  </div>
                  <span className="font-semibold text-slate-800">¥{exp.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-4 text-center">暂无费用记录</p>
          )}
        </div>

        {/* Agreements Status */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              室友公约
            </h2>
            <Link to="/agreements" className="text-sm text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {agreements.length > 0 ? (
            <div className="space-y-2">
              {agreements.slice(0, 3).map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-medium text-slate-700">{a.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    a.status === 'active' ? 'bg-green-100 text-green-600' :
                    a.status === 'rejected' ? 'bg-red-100 text-red-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {a.status === 'active' ? '已生效' : a.status === 'rejected' ? '已否决' : '待投票'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-4 text-center">暂无公约</p>
          )}
        </div>
      </div>
    </div>
  );
}
