import { useState } from 'react';
import { getCurrentUser, getCurrentHousehold, getHouseholdMembers, addCleaningTask, getCleaningTasks, deleteCleaningTask, generateSchedule, getSchedules, toggleScheduleComplete } from '../lib/store';
import { Plus, Trash2, Calendar, Check, ChevronLeft, ChevronRight, Settings } from 'lucide-react';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function Cleaning() {
  const user = getCurrentUser();
  const household = getCurrentHousehold();
  const members = getHouseholdMembers(household?.id);
  const tasks = getCleaningTasks();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const schedules = getSchedules(monthStr);

  // Calendar data
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    addCleaningTask(taskName.trim(), taskDesc.trim());
    setTaskName('');
    setTaskDesc('');
    setShowTaskForm(false);
  };

  const handleGenerateSchedule = () => {
    if (tasks.length === 0 || members.length === 0) return;
    const start = `${monthStr}-01`;
    const end = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;
    generateSchedule(start, end);
    setShowScheduleForm(false);
  };

  const getScheduleForDay = (day) => {
    if (!day) return null;
    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
    return schedules.find(s => s.date === dateStr);
  };

  const memberColor = (id) => {
    const colors = ['bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-amber-100 text-amber-600', 'bg-pink-100 text-pink-600', 'bg-cyan-100 text-cyan-600'];
    const idx = members.findIndex(m => m.id === id);
    return colors[idx % colors.length];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">清洁值日排班</h1>
          <p className="text-slate-400 text-sm mt-1">自动轮转，公平分担</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTaskForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-medium transition-colors"
          >
            <Settings className="w-4 h-4" />
            管理任务
          </button>
          <button
            onClick={() => setShowScheduleForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            生成排班
          </button>
        </div>
      </div>

      {/* Tasks */}
      {tasks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tasks.map(t => (
            <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-sm text-slate-600">
              <span>{t.title}</span>
              <button onClick={() => deleteCleaningTask(t.id)} className="text-slate-300 hover:text-red-500">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h2 className="font-semibold text-slate-800">{year}年{month + 1}月</h2>
          <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const schedule = getScheduleForDay(day);
            const member = schedule ? members.find(m => m.id === schedule.userId) : null;
            const isToday = `${monthStr}-${String(day).padStart(2, '0')}` === todayStr;

            return (
              <div
                key={day}
                className={`relative p-1.5 min-h-[72px] rounded-xl border transition ${
                  isToday ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <span className={`text-xs font-medium ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {day}
                </span>
                {schedule && member && (
                  <div className="mt-1">
                    <button
                      onClick={() => toggleScheduleComplete(schedule.id)}
                      className={`w-full text-left text-xs p-1 rounded-lg transition ${
                        schedule.completed ? 'bg-green-100 text-green-600 line-through' : memberColor(member.id)
                      }`}
                    >
                      {schedule.completed && <Check className="w-3 h-3 inline mr-0.5" />}
                      {member.name}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today Detail */}
      {schedules.filter(s => s.date === todayStr).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-3">📌 今日安排</h3>
          {schedules.filter(s => s.date === todayStr).map(s => {
            const member = members.find(m => m.id === s.userId);
            const task = tasks.find(t => t.id === s.taskId);
            return (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <button
                  onClick={() => toggleScheduleComplete(s.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                    s.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-green-400'
                  }`}
                >
                  {s.completed && <Check className="w-3 h-3" />}
                </button>
                <div>
                  <p className={`text-sm font-medium ${s.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {task?.title || '清洁任务'}
                  </p>
                  <p className="text-xs text-slate-400">{member?.name || '未知'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTaskForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">管理清洁任务</h3>
            <form onSubmit={handleAddTask} className="space-y-3 mb-4">
              <input
                type="text"
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="任务名称，如：扫地拖地"
              />
              <input
                type="text"
                value={taskDesc}
                onChange={e => setTaskDesc(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="描述（可选）"
              />
              <button type="submit" className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium">
                添加任务
              </button>
            </form>

            {tasks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-medium">当前任务</p>
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-600">{t.title}</span>
                    <button onClick={() => deleteCleaningTask(t.id)} className="text-slate-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setShowTaskForm(false)} className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition">
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Schedule Generation Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowScheduleForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">生成值日排班</h3>
            <p className="text-sm text-slate-400 mb-4">
              将为 {year}年{month + 1}月 生成排班，按照任务和成员轮流分配。
            </p>

            {tasks.length === 0 ? (
              <div className="p-4 bg-amber-50 text-amber-600 rounded-xl text-sm mb-4">
                ⚠️ 请先添加清洁任务
              </div>
            ) : members.length < 2 ? (
              <div className="p-4 bg-amber-50 text-amber-600 rounded-xl text-sm mb-4">
                ⚠️ 至少需要2位室友才能生成排班
              </div>
            ) : (
              <div className="mb-4 space-y-2">
                <p className="text-sm text-slate-600">将参与排班的室友：</p>
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold">
                      {m.name.charAt(0)}
                    </div>
                    <span className="text-sm text-slate-600">{m.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowScheduleForm(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition">
                取消
              </button>
              <button
                onClick={handleGenerateSchedule}
                disabled={tasks.length === 0 || members.length < 2}
                className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                生成排班
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
