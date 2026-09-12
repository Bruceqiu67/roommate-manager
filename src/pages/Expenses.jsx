import { useState } from 'react';
import { getCurrentUser, getCurrentHousehold, getExpenses, addExpense, deleteExpense, getBalanceSummary, getHouseholdMembers } from '../lib/store';
import { Plus, Trash2, Receipt, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';

const CATEGORIES = [
  { value: 'rent', label: '🏠 房租', color: 'bg-blue-50 text-blue-600' },
  { value: 'water', label: '💧 水费', color: 'bg-cyan-50 text-cyan-600' },
  { value: 'electric', label: '⚡ 电费', color: 'bg-yellow-50 text-yellow-600' },
  { value: 'gas', label: '🔥 燃气', color: 'bg-orange-50 text-orange-600' },
  { value: 'internet', label: '📶 网费', color: 'bg-purple-50 text-purple-600' },
  { value: 'daily', label: '🧴 日用品', color: 'bg-green-50 text-green-600' },
  { value: 'food', label: '🍜 餐饮', color: 'bg-red-50 text-red-600' },
  { value: 'other', label: '📦 其他', color: 'bg-slate-50 text-slate-600' },
];

export default function Expenses() {
  const user = getCurrentUser();
  const household = getCurrentHousehold();
  const members = getHouseholdMembers(household?.id);
  const expenses = getExpenses();
  const { debts } = getBalanceSummary();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [splitAmong, setSplitAmong] = useState(members.map(m => m.id));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !amount || splitAmong.length === 0) return;
    addExpense(title.trim(), amount, category, user.id, splitAmong);
    setTitle('');
    setAmount('');
    setCategory('other');
    setSplitAmong(members.map(m => m.id));
    setShowForm(false);
  };

  const toggleMember = (id) => {
    setSplitAmong(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getCatInfo = (cat) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];

  const totalByCategory = {};
  expenses.forEach(e => {
    totalByCategory[e.category] = (totalByCategory[e.category] || 0) + e.amount;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">费用 AA 分摊</h1>
          <p className="text-slate-400 text-sm mt-1">记录费用，自动计算分摊</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          记一笔
        </button>
      </div>

      {/* Settlement Summary */}
      {debts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            💰 结算建议
          </h2>
          <div className="space-y-2">
            {debts.map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-sm text-slate-600">
                  <strong>{members.find(m => m.id === d.from)?.name}</strong>
                  {' '}需付给{' '}
                  <strong>{members.find(m => m.id === d.to)?.name}</strong>
                </span>
                <span className="ml-auto font-bold text-red-500">¥{d.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Stats */}
      {Object.keys(totalByCategory).length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(totalByCategory).sort((a, b) => b[1] - a[1]).map(([cat, total]) => {
            const info = getCatInfo(cat);
            return (
              <div key={cat} className={`rounded-xl p-3 ${info.color}`}>
                <p className="text-sm font-medium">{info.label}</p>
                <p className="text-lg font-bold mt-1">¥{total.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Expense List */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {expenses.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {expenses.map(exp => {
              const info = getCatInfo(exp.category);
              const payer = members.find(m => m.id === exp.paidBy);
              const perPerson = (exp.amount / exp.splitAmong.length).toFixed(2);
              return (
                <div key={exp.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${info.color}`}>
                    {info.label.split(' ')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700">{exp.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {payer?.name} 付款 · {exp.splitAmong.length}人均摊 · 每人 ¥{perPerson}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">¥{exp.amount.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">{new Date(exp.createdAt).toLocaleDateString('zh-CN')}</p>
                  </div>
                  <button
                    onClick={() => { if (confirm('确定删除这条费用记录？')) deleteExpense(exp.id); }}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400">暂无费用记录</p>
            <p className="text-sm text-slate-300 mt-1">点击「记一笔」开始记录</p>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-800">记一笔费用</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">费用名称</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例如：3月电费"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">金额（元）</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">类别</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`p-2 rounded-xl text-xs font-medium border-2 transition ${
                        category === cat.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                          : 'border-slate-100 hover:border-slate-200 text-slate-500'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">付款人</label>
                <div className="px-4 py-2.5 bg-indigo-50 rounded-xl text-sm text-indigo-600 font-medium">
                  {user?.name}（你）
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">参与分摊</label>
                <div className="space-y-2">
                  {members.map(m => (
                    <label key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={splitAmong.includes(m.id)}
                        onChange={() => toggleMember(m.id)}
                        className="w-4 h-4 text-indigo-500 rounded"
                      />
                      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold">
                        {m.name.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-600">{m.name}</span>
                      {splitAmong.includes(m.id) && splitAmong.length > 0 && (
                        <span className="ml-auto text-xs text-slate-400">¥{(parseFloat(amount || 0) / splitAmong.length).toFixed(2)}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors">
                保存
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
