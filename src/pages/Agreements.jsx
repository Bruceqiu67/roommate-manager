import { useState } from 'react';
import { getCurrentUser, getCurrentHousehold, getHouseholdMembers, addAgreement, getAgreements, voteAgreement, getAgreementVotes, deleteAgreement } from '../lib/store';
import { Plus, FileText, ThumbsUp, ThumbsDown, Trash2, X } from 'lucide-react';

export default function Agreements() {
  const user = getCurrentUser();
  const household = getCurrentHousehold();
  const members = getHouseholdMembers(household?.id);
  const [agreements, setAgreements] = useState(() => getAgreements());
  const [, setTick] = useState(0);
  const refresh = () => {
    setAgreements(getAgreements());
    setTick(t => t + 1);
  };
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    addAgreement(title.trim(), content.trim());
    setTitle('');
    setContent('');
    setShowForm(false);
    refresh();
  };

  const handleVote = (id, voteType) => {
    voteAgreement(id, voteType);
    refresh();
  };

  const handleDelete = (id) => {
    if (confirm('确定删除这条公约？')) {
      deleteAgreement(id);
      refresh();
    }
  };

  const statusMap = {
    draft: { label: '待投票', color: 'bg-slate-100 text-slate-500', icon: '📋' },
    active: { label: '已生效', color: 'bg-green-100 text-green-600', icon: '✅' },
    rejected: { label: '已否决', color: 'bg-red-100 text-red-600', icon: '❌' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">室友公约</h1>
          <p className="text-slate-400 text-sm mt-1">共同制定合租规则</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新建公约
        </button>
      </div>

      {/* Agreements List */}
      {agreements.length > 0 ? (
        <div className="space-y-4">
          {agreements.map(a => {
            const votes = getAgreementVotes(a.id);
            const status = statusMap[a.status] || statusMap.draft;
            const myVote = votes.find(v => v.userId === user.id);
            const yesCount = votes.filter(v => v.vote === 'yes').length;
            const noCount = votes.filter(v => v.vote === 'no').length;
            const creator = members.find(m => m.id === a.createdBy);

            return (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{status.icon}</span>
                      <div>
                        <h3 className="font-semibold text-slate-800">{a.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          由 {creator?.name || '未知'} 创建于 {new Date(a.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                  </div>

                  {/* Votes */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-sm">
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 font-medium">{yesCount}</span>
                      <span className="text-slate-400">赞同</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 font-medium">{noCount}</span>
                      <span className="text-slate-400">反对</span>
                    </div>
                  </div>

                  {/* Vote Buttons */}
                  {a.status === 'draft' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleVote(a.id, 'yes')}
                        disabled={myVote?.vote === 'yes'}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                          myVote?.vote === 'yes'
                            ? 'bg-green-100 text-green-600 cursor-default'
                            : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        {myVote?.vote === 'yes' ? '已赞同' : '赞同'}
                      </button>
                      <button
                        onClick={() => handleVote(a.id, 'no')}
                        disabled={myVote?.vote === 'no'}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                          myVote?.vote === 'no'
                            ? 'bg-red-100 text-red-600 cursor-default'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        {myVote?.vote === 'no' ? '已反对' : '反对'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-xs text-slate-400 hover:text-red-500 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">暂无室友公约</p>
          <p className="text-sm text-slate-300 mt-1">点击「新建公约」制定规则</p>
        </div>
      )}

      {/* Add Agreement Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-800">新建室友公约</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">公约标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：公共区域卫生公约"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">公约内容</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  required
                  rows={5}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="请详细描述公约内容..."
                />
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl">
                <p className="text-xs text-indigo-600">💡 公约创建后将进入投票阶段，所有室友投票通过后自动生效。</p>
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors">
                发起投票
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
