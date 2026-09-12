import { useState } from 'react';
import { getCurrentHousehold, getHouseholdMembers, addSharedItem, getSharedItems, deleteSharedItem, consumeItem, restockItem, getItemConsumptions } from '../lib/store';
import { Plus, Trash2, Package, AlertTriangle, ShoppingCart, ArrowDown, ArrowUp } from 'lucide-react';

export default function Items() {
  const household = getCurrentHousehold();
  const members = getHouseholdMembers(household?.id);
  const [items, setItems] = useState(() => getSharedItems());
  const refresh = () => setItems(getSharedItems());

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [threshold, setThreshold] = useState('');
  const [unit, setUnit] = useState('个');
  const [activeItem, setActiveItem] = useState(null);
  const [consumeQty, setConsumeQty] = useState('');
  const [consumeNote, setConsumeNote] = useState('');
  const [restockQty, setRestockQty] = useState('');

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!name.trim() || !quantity) return;
    addSharedItem(name.trim(), quantity, threshold || 1, unit);
    setName('');
    setQuantity('');
    setThreshold('');
    setUnit('个');
    setShowForm(false);
    refresh();
  };

  const handleConsume = (itemId) => {
    if (!consumeQty || parseFloat(consumeQty) <= 0) return;
    consumeItem(itemId, consumeQty, consumeNote);
    setConsumeQty('');
    setConsumeNote('');
    setActiveItem(null);
    refresh();
  };

  const handleRestock = (itemId) => {
    if (!restockQty || parseFloat(restockQty) <= 0) return;
    restockItem(itemId, restockQty);
    setRestockQty('');
    setActiveItem(null);
    refresh();
  };

  const handleDeleteItem = (id) => {
    if (confirm('确定删除该物品？')) {
      deleteSharedItem(id);
      refresh();
    }
  };

  const lowItems = items.filter(i => i.quantity <= i.threshold);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">公共物品管理</h1>
          <p className="text-slate-400 text-sm mt-1">登记共用物品，追踪消耗</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          添加物品
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="font-semibold text-amber-700 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" />
            库存不足提醒
          </h2>
          <div className="space-y-2">
            {lowItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-700">{item.name}</p>
                  <p className="text-xs text-amber-600">剩余 {item.quantity} {item.unit}（低于阈值 {item.threshold}）</p>
                </div>
                <button
                  onClick={() => setActiveItem(item)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition"
                >
                  <ShoppingCart className="w-3 h-3 inline mr-1" />
                  补货
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const isLow = item.quantity <= item.threshold;
            const percentage = Math.min(100, (item.quantity / (item.threshold * 3)) * 100);
            const consumptions = getItemConsumptions(item.id);
            return (
              <div key={item.id} className={`bg-white rounded-2xl border p-5 transition ${isLow ? 'border-amber-200' : 'border-slate-100'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{item.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isLow ? '⚠️ 库存不足' : '✅ 库存充足'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>当前：{item.quantity} {item.unit}</span>
                    <span>阈值：{item.threshold} {item.unit}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isLow ? 'bg-amber-400' : 'bg-green-400'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setActiveItem(item); setRestockQty(''); setConsumeQty(''); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl text-xs font-medium transition"
                  >
                    <ArrowUp className="w-3 h-3" />
                    补货
                  </button>
                  <button
                    onClick={() => { setActiveItem(item); setConsumeQty(''); setRestockQty(''); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-medium transition"
                  >
                    <ArrowDown className="w-3 h-3" />
                    使用
                  </button>
                </div>

                {/* Recent history */}
                {consumptions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-1">最近使用</p>
                    {consumptions.slice(0, 2).map(c => (
                      <p key={c.id} className="text-xs text-slate-500">
                        {members.find(m => m.id === c.userId)?.name || '未知'} 使用了 {c.quantity} {item.unit}
                        {c.note && ` - ${c.note}`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">暂无公共物品</p>
          <p className="text-sm text-slate-300 mt-1">点击「添加物品」开始登记</p>
        </div>
      )}

      {/* Add Item Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">添加公共物品</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">物品名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：纸巾、洗衣液"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">数量</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    required
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">单位</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {['个', '包', '瓶', '袋', '盒', '卷', '升', '千克'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">提醒阈值（低于此数量提醒补货）</label>
                <input
                  type="number"
                  value={threshold}
                  onChange={e => setThreshold(e.target.value)}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="默认 1"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors">
                添加
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Consume/Restock Modal */}
      {activeItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setActiveItem(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{activeItem.name} - 操作</h3>

            <div className="space-y-4">
              {/* Consume */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm font-medium text-blue-700 mb-2">📝 记录使用</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    value={consumeQty}
                    onChange={e => setConsumeQty(e.target.value)}
                    min="0.1"
                    step="0.1"
                    className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder={`数量（${activeItem.unit}）`}
                  />
                </div>
                <input
                  type="text"
                  value={consumeNote}
                  onChange={e => setConsumeNote(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
                  placeholder="备注（可选）"
                />
                <button
                  onClick={() => handleConsume(activeItem.id)}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition"
                >
                  记录使用
                </button>
              </div>

              {/* Restock */}
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm font-medium text-green-700 mb-2">🛒 补货</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={restockQty}
                    onChange={e => setRestockQty(e.target.value)}
                    min="0.1"
                    step="0.1"
                    className="flex-1 px-3 py-2 border border-green-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder={`补货数量（${activeItem.unit}）`}
                  />
                  <button
                    onClick={() => handleRestock(activeItem.id)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition"
                  >
                    补货
                  </button>
                </div>
              </div>
            </div>

            <button onClick={() => setActiveItem(null)} className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
