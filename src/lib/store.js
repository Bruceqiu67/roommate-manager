// Local data store using localStorage
// Structure: { households, users, currentUser, expenses, cleaningTasks, cleaningSchedules, sharedItems, agreements }

const STORE_KEY = 'roommate_manager_data';

const defaultData = {
  households: [],
  users: [],
  currentUser: null,
  expenses: [],
  cleaningTasks: [],
  cleaningSchedules: [],
  sharedItems: [],
  itemConsumptions: [],
  agreements: [],
  agreementVotes: [],
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      return { ...defaultData, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  return { ...defaultData };
}

function saveData(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ===== Auth =====
export function register(name, email, password) {
  const data = loadData();
  if (data.users.find(u => u.email === email)) {
    throw new Error('该邮箱已注册');
  }
  const user = { id: genId(), name, email, password, householdId: null, createdAt: new Date().toISOString() };
  data.users.push(user);
  data.currentUser = user;
  saveData(data);
  return user;
}

export function login(email, password) {
  const data = loadData();
  const user = data.users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('邮箱或密码错误');
  data.currentUser = user;
  saveData(data);
  return user;
}

export function logout() {
  const data = loadData();
  data.currentUser = null;
  saveData(data);
}

export function getCurrentUser() {
  const data = loadData();
  return data.currentUser;
}

export function getHouseholdMembers(householdId) {
  const data = loadData();
  return data.users.filter(u => u.householdId === householdId);
}

// ===== Household =====
export function createHousehold(name) {
  const data = loadData();
  const user = data.currentUser;
  if (!user) throw new Error('请先登录');

  const inviteCode = genId().toUpperCase();
  const household = { id: genId(), name, inviteCode, createdBy: user.id, createdAt: new Date().toISOString() };
  data.households.push(household);

  // Update user household
  const userIdx = data.users.findIndex(u => u.id === user.id);
  data.users[userIdx].householdId = household.id;
  data.currentUser = data.users[userIdx];
  saveData(data);
  return household;
}

export function joinHousehold(inviteCode) {
  const data = loadData();
  const user = data.currentUser;
  if (!user) throw new Error('请先登录');

  const household = data.households.find(h => h.inviteCode === inviteCode.toUpperCase());
  if (!household) throw new Error('邀请码无效');

  const userIdx = data.users.findIndex(u => u.id === user.id);
  data.users[userIdx].householdId = household.id;
  data.currentUser = data.users[userIdx];
  saveData(data);
  return household;
}

export function getCurrentHousehold() {
  const data = loadData();
  if (!data.currentUser) return null;
  return data.households.find(h => h.id === data.currentUser.householdId) || null;
}

// ===== Expenses =====
export function addExpense(title, amount, category, paidBy, splitAmong) {
  const data = loadData();
  const expense = {
    id: genId(),
    householdId: data.currentUser.householdId,
    title, amount: parseFloat(amount), category, paidBy, splitAmong,
    createdAt: new Date().toISOString(),
  };
  data.expenses.push(expense);
  saveData(data);
  return expense;
}

export function getExpenses() {
  const data = loadData();
  const hid = data.currentUser?.householdId;
  return data.expenses.filter(e => e.householdId === hid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function deleteExpense(id) {
  const data = loadData();
  data.expenses = data.expenses.filter(e => e.id !== id);
  saveData(data);
}

export function getBalanceSummary() {
  const data = loadData();
  const hid = data.currentUser?.householdId;
  const expenses = data.expenses.filter(e => e.householdId === hid);
  const members = data.users.filter(u => u.householdId === hid);

  // { userId: net balance } positive = others owe this person, negative = this person owes others
  const balances = {};
  members.forEach(m => { balances[m.id] = 0; });

  expenses.forEach(exp => {
    const share = exp.amount / exp.splitAmong.length;
    balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.amount - share * exp.splitAmong.length + share;
    exp.splitAmong.forEach(uid => {
      if (uid !== exp.paidBy) {
        balances[uid] = (balances[uid] || 0) - share;
        balances[exp.paidBy] = (balances[exp.paidBy] || 0) + share;
      }
    });
  });

  // Simplify debts
  const debts = [];
  const debtors = Object.entries(balances).filter(([, v]) => v < -0.01).map(([id, v]) => ({ id, amount: -v }));
  const creditors = Object.entries(balances).filter(([, v]) => v > 0.01).map(([id, v]) => ({ id, amount: v }));

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i], c = creditors[j];
    const min = Math.min(d.amount, c.amount);
    if (min > 0.01) {
      debts.push({ from: d.id, to: c.id, amount: Math.round(min * 100) / 100 });
    }
    d.amount -= min;
    c.amount -= min;
    if (d.amount < 0.01) i++;
    if (c.amount < 0.01) j++;
  }

  return { balances, debts, members };
}

// ===== Cleaning =====
export function addCleaningTask(title, description) {
  const data = loadData();
  const task = {
    id: genId(),
    householdId: data.currentUser.householdId,
    title, description,
    createdAt: new Date().toISOString(),
  };
  data.cleaningTasks.push(task);
  saveData(data);
  return task;
}

export function getCleaningTasks() {
  const data = loadData();
  const hid = data.currentUser?.householdId;
  return data.cleaningTasks.filter(t => t.householdId === hid);
}

export function deleteCleaningTask(id) {
  const data = loadData();
  data.cleaningTasks = data.cleaningTasks.filter(t => t.id !== id);
  data.cleaningSchedules = data.cleaningSchedules.filter(s => s.taskId !== id);
  saveData(data);
}

export function generateSchedule(startDate, endDate) {
  const data = loadData();
  const hid = data.currentUser?.householdId;
  const members = data.users.filter(u => u.householdId === hid);
  const tasks = data.cleaningTasks.filter(t => t.householdId === hid);

  if (members.length === 0 || tasks.length === 0) return [];

  // Generate daily schedules rotating among members
  const start = new Date(startDate);
  const end = new Date(endDate);
  const schedules = [];

  let memberIdx = 0;
  let taskIdx = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    // Remove existing schedules for this date
    data.cleaningSchedules = data.cleaningSchedules.filter(s => s.date !== dateStr);

    const task = tasks[taskIdx % tasks.length];
    const member = members[memberIdx % members.length];

    const schedule = {
      id: genId(),
      householdId: hid,
      taskId: task.id,
      userId: member.id,
      date: dateStr,
      completed: false,
    };
    data.cleaningSchedules.push(schedule);
    schedules.push(schedule);

    memberIdx++;
    if (memberIdx >= members.length) {
      memberIdx = 0;
      taskIdx++;
    }
  }

  saveData(data);
  return schedules;
}

export function getSchedules(month) {
  const data = loadData();
  const hid = data.currentUser?.householdId;
  return data.cleaningSchedules.filter(s => s.householdId === hid && s.date.startsWith(month));
}

export function toggleScheduleComplete(scheduleId) {
  const data = loadData();
  const idx = data.cleaningSchedules.findIndex(s => s.id === scheduleId);
  if (idx >= 0) {
    data.cleaningSchedules[idx].completed = !data.cleaningSchedules[idx].completed;
    saveData(data);
  }
}

// ===== Shared Items =====
export function addSharedItem(name, quantity, threshold, unit) {
  const data = loadData();
  const item = {
    id: genId(),
    householdId: data.currentUser.householdId,
    name, quantity: parseFloat(quantity), threshold: parseFloat(threshold), unit,
    createdAt: new Date().toISOString(),
  };
  data.sharedItems.push(item);
  saveData(data);
  return item;
}

export function getSharedItems() {
  const data = loadData();
  const hid = data.currentUser?.householdId;
  return data.sharedItems.filter(i => i.householdId === hid);
}

export function deleteSharedItem(id) {
  const data = loadData();
  data.sharedItems = data.sharedItems.filter(i => i.id !== id);
  data.itemConsumptions = data.itemConsumptions.filter(c => c.itemId !== id);
  saveData(data);
}

export function consumeItem(itemId, quantity, note) {
  const data = loadData();
  const item = data.sharedItems.find(i => i.id === itemId);
  if (!item) return;

  item.quantity = Math.max(0, item.quantity - parseFloat(quantity));

  const consumption = {
    id: genId(),
    itemId,
    userId: data.currentUser.id,
    quantity: parseFloat(quantity),
    note,
    createdAt: new Date().toISOString(),
  };
  data.itemConsumptions.push(consumption);
  saveData(data);
  return item;
}

export function restockItem(itemId, quantity) {
  const data = loadData();
  const item = data.sharedItems.find(i => i.id === itemId);
  if (!item) return;
  item.quantity += parseFloat(quantity);
  saveData(data);
  return item;
}

export function getItemConsumptions(itemId) {
  const data = loadData();
  return data.itemConsumptions.filter(c => c.itemId === itemId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ===== Agreements =====
export function addAgreement(title, content) {
  const data = loadData();
  const agreement = {
    id: genId(),
    householdId: data.currentUser.householdId,
    title, content,
    status: 'draft',
    createdBy: data.currentUser.id,
    createdAt: new Date().toISOString(),
  };
  data.agreements.push(agreement);
  saveData(data);
  return agreement;
}

export function getAgreements() {
  const data = loadData();
  const hid = data.currentUser?.householdId;
  return data.agreements.filter(a => a.householdId === hid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function voteAgreement(agreementId, vote) {
  const data = loadData();
  const userId = data.currentUser.id;

  // Remove existing vote
  data.agreementVotes = data.agreementVotes.filter(v => !(v.agreementId === agreementId && v.userId === userId));

  data.agreementVotes.push({
    id: genId(),
    agreementId,
    userId,
    vote,
    createdAt: new Date().toISOString(),
  });

  // Check if all members voted yes
  const hid = data.currentUser.householdId;
  const members = data.users.filter(u => u.householdId === hid);
  const votes = data.agreementVotes.filter(v => v.agreementId === agreementId);
  const allVoted = members.every(m => votes.find(v => v.userId === m.id));
  const allYes = votes.every(v => v.vote === 'yes');

  const idx = data.agreements.findIndex(a => a.id === agreementId);
  if (allVoted && allYes) {
    data.agreements[idx].status = 'active';
  } else if (votes.some(v => v.vote === 'no')) {
    data.agreements[idx].status = 'rejected';
  }

  saveData(data);
}

export function getAgreementVotes(agreementId) {
  const data = loadData();
  return data.agreementVotes.filter(v => v.agreementId === agreementId);
}

export function deleteAgreement(id) {
  const data = loadData();
  data.agreements = data.agreements.filter(a => a.id !== id);
  data.agreementVotes = data.agreementVotes.filter(v => v.agreementId !== id);
  saveData(data);
}

// ===== Stats =====
export function getMonthlyExpenseStats() {
  const data = loadData();
  const hid = data.currentUser?.householdId;
  const expenses = data.expenses.filter(e => e.householdId === hid);

  const stats = {};
  expenses.forEach(e => {
    const month = e.createdAt.slice(0, 7);
    if (!stats[month]) stats[month] = { month, total: 0, categories: {} };
    stats[month].total += e.amount;
    stats[month].categories[e.category] = (stats[month].categories[e.category] || 0) + e.amount;
  });

  return Object.values(stats).sort((a, b) => a.month.localeCompare(b.month));
}

// ===== Demo Mode & Member Switching =====
export function switchUser(userId) {
  const data = loadData();
  const target = data.users.find(u => u.id === userId);
  if (!target) throw new Error('用户不存在');
  data.currentUser = target;
  saveData(data);
  return target;
}

export function seedDemoData() {
  const householdId = 'hh_sunshine_302';
  const u1 = { id: 'u_zhangwei', name: '张伟 (我)', email: 'zhangwei@demo.com', password: '123', householdId, createdAt: new Date().toISOString() };
  const u2 = { id: 'u_lichen', name: '李晨', email: 'lichen@demo.com', password: '123', householdId, createdAt: new Date().toISOString() };
  const u3 = { id: 'u_wangxiaoli', name: '王晓丽', email: 'wangxiaoli@demo.com', password: '123', householdId, createdAt: new Date().toISOString() };
  const users = [u1, u2, u3];

  const household = {
    id: householdId,
    name: '阳光花园 302 室',
    inviteCode: 'SUN302',
    createdBy: u1.id,
    createdAt: new Date().toISOString(),
  };

  const now = Date.now();
  const expenses = [
    {
      id: 'exp_rent',
      householdId,
      title: '7月份合租房租总额',
      amount: 4500,
      category: 'rent',
      paidBy: u1.id,
      splitAmong: [u1.id, u2.id, u3.id],
      createdAt: new Date(now - 6 * 86400000).toISOString(),
    },
    {
      id: 'exp_elec',
      householdId,
      title: '夏季空调高峰电费',
      amount: 360,
      category: 'electric',
      paidBy: u2.id,
      splitAmong: [u1.id, u2.id, u3.id],
      createdAt: new Date(now - 4 * 86400000).toISOString(),
    },
    {
      id: 'exp_water',
      householdId,
      title: '农夫山泉大桶装饮用水 (4桶)',
      amount: 72,
      category: 'water',
      paidBy: u3.id,
      splitAmong: [u1.id, u2.id, u3.id],
      createdAt: new Date(now - 2 * 86400000).toISOString(),
    },
    {
      id: 'exp_daily',
      householdId,
      title: '公共卫生间洗洁精与洁厕灵',
      amount: 54,
      category: 'daily',
      paidBy: u1.id,
      splitAmong: [u1.id, u2.id, u3.id],
      createdAt: new Date(now - 1 * 86400000).toISOString(),
    },
    {
      id: 'exp_food',
      householdId,
      title: '周末室友聚餐火锅食材',
      amount: 210,
      category: 'food',
      paidBy: u2.id,
      splitAmong: [u1.id, u2.id, u3.id],
      createdAt: new Date(now - 4 * 3600000).toISOString(),
    },
  ];

  const cleaningTasks = [
    { id: 'ct_1', householdId, title: '客厅地面吸尘与公区垃圾打包', description: '每周二/五清理客厅沙发、地面吸尘，将公区垃圾扔到楼下分类点', createdAt: new Date().toISOString() },
    { id: 'ct_2', householdId, title: '厨房台面油污与水槽彻底清洁', description: '做饭后清理水槽残渣、使用油污净喷擦油烟机与灶台', createdAt: new Date().toISOString() },
    { id: 'ct_3', householdId, title: '卫生间干湿分离地面与台盆消毒', description: '地面刮水、补充洗手液并使用消毒液刷洗马桶内圈', createdAt: new Date().toISOString() },
  ];

  // Generate cleaning schedule for current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cleaningSchedules = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const task = cleaningTasks[(d - 1) % cleaningTasks.length];
    const member = users[(d - 1) % users.length];
    cleaningSchedules.push({
      id: 'cs_' + dateStr,
      householdId,
      taskId: task.id,
      userId: member.id,
      date: dateStr,
      completed: d <= today.getDate() && (d % 2 === 1),
    });
  }

  const sharedItems = [
    { id: 'item_1', householdId, name: '维达超韧抽纸 (3层)', quantity: 1, threshold: 2, unit: '提', createdAt: new Date().toISOString() },
    { id: 'item_2', householdId, name: '45L 抽绳加厚分类垃圾袋', quantity: 5, threshold: 2, unit: '卷', createdAt: new Date().toISOString() },
    { id: 'item_3', householdId, name: '蓝月亮除菌洁净洗衣液', quantity: 2, threshold: 1, unit: '瓶', createdAt: new Date().toISOString() },
    { id: 'item_4', householdId, name: '立白浓缩柠檬洗洁精', quantity: 0, threshold: 1, unit: '瓶', createdAt: new Date().toISOString() },
  ];

  const itemConsumptions = [
    { id: 'ic_1', itemId: 'item_1', userId: u2.id, quantity: 1, note: '客厅茶几抽纸用完补领一包', createdAt: new Date(now - 86400000).toISOString() },
    { id: 'ic_2', itemId: 'item_4', userId: u3.id, quantity: 1, note: '厨房洗洁精完全用空，急需补货', createdAt: new Date(now - 12 * 3600000).toISOString() },
  ];

  const agreements = [
    {
      id: 'agr_1',
      householdId,
      title: '公区夜间静音公约',
      content: '工作日 23:00、周末 24:00 后公区保持安静。洗漱吹头、语音游戏连麦、观看视频请在各自卧室关门并佩戴耳机。',
      status: 'active',
      createdBy: u1.id,
      createdAt: new Date(now - 7 * 86400000).toISOString(),
    },
    {
      id: 'agr_2',
      householdId,
      title: '厨房使用后随手清理与全屋禁烟',
      content: '厨房使用完毕后半小时内清理水槽厨余、擦拭灶台。合租所有公共区域及卧室内严禁吸烟，以维护安全与空气清新。',
      status: 'active',
      createdBy: u3.id,
      createdAt: new Date(now - 5 * 86400000).toISOString(),
    },
    {
      id: 'agr_3',
      householdId,
      title: '朋友留宿需提前报备公约',
      content: '邀请朋友或亲属留宿超过 1 晚需提前至少 12 小时在室友群告知并征得全员同意，非紧急情况每月留宿累计不得超过 3 天。',
      status: 'draft',
      createdBy: u2.id,
      createdAt: new Date(now - 1 * 86400000).toISOString(),
    },
  ];

  const agreementVotes = [
    { id: 'av_1_1', agreementId: 'agr_1', userId: u1.id, vote: 'yes', createdAt: new Date(now - 6 * 86400000).toISOString() },
    { id: 'av_1_2', agreementId: 'agr_1', userId: u2.id, vote: 'yes', createdAt: new Date(now - 6 * 86400000).toISOString() },
    { id: 'av_1_3', agreementId: 'agr_1', userId: u3.id, vote: 'yes', createdAt: new Date(now - 6 * 86400000).toISOString() },
    { id: 'av_2_1', agreementId: 'agr_2', userId: u1.id, vote: 'yes', createdAt: new Date(now - 4 * 86400000).toISOString() },
    { id: 'av_2_2', agreementId: 'agr_2', userId: u2.id, vote: 'yes', createdAt: new Date(now - 4 * 86400000).toISOString() },
    { id: 'av_2_3', agreementId: 'agr_2', userId: u3.id, vote: 'yes', createdAt: new Date(now - 4 * 86400000).toISOString() },
    { id: 'av_3_1', agreementId: 'agr_3', userId: u2.id, vote: 'yes', createdAt: new Date(now - 1 * 86400000).toISOString() },
    { id: 'av_3_2', agreementId: 'agr_3', userId: u1.id, vote: 'yes', createdAt: new Date(now - 12 * 3600000).toISOString() },
  ];

  const data = {
    households: [household],
    users,
    currentUser: u1,
    expenses,
    cleaningTasks,
    cleaningSchedules,
    sharedItems,
    itemConsumptions,
    agreements,
    agreementVotes,
  };

  saveData(data);
  return u1;
}
