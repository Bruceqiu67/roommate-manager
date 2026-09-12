import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createHousehold, joinHousehold, getCurrentUser } from '../lib/store';
import { Home, Users, Plus, ArrowRight, Copy, Check } from 'lucide-react';

export default function Household() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [tab, setTab] = useState('create');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [household, setHousehold] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleCreate = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('请输入房间名称'); return; }
    const h = createHousehold(name.trim());
    setHousehold(h);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');
    if (!inviteCode.trim()) { setError('请输入邀请码'); return; }
    try {
      joinHousehold(inviteCode.trim());
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(household.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (household) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">房间创建成功！</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <p className="text-slate-500 mb-4">分享邀请码给室友加入</p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="px-6 py-3 bg-indigo-50 rounded-xl font-mono text-2xl font-bold text-indigo-600 tracking-widest">
                {household.inviteCode}
              </div>
              <button onClick={handleCopy} className="p-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <button onClick={() => { window.location.reload(); }} className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              进入管家 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">设置你的合租房间</h1>
          <p className="text-slate-500 mt-1">创建房间或通过邀请码加入</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl p-1 mb-6 border border-slate-100">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${tab === 'create' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            创建房间
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${tab === 'join' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users className="w-4 h-4 inline mr-1" />
            加入房间
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
          )}

          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">房间名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="例如：幸福小区3号楼502"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors">
                创建房间
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">邀请码</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition uppercase"
                  placeholder="输入6位邀请码"
                  maxLength={20}
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors">
                加入房间
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
