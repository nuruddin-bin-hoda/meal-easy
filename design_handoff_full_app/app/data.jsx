// Mock data for the full-app design — single source of fake numbers.
window.APP_DATA = {
  user: { name: 'Nuruddin Anam', room: 'B-208', phone: '01779-456 218', balance: '৳345.50', joined: 'Joined Mar 2025' },
  today: 'Saturday · May 18, 2026',
  tomorrow: 'Sunday · May 19, 2026',
  monthLabel: 'May 2026',
  rate: '৳62.40',
  lastMonthRate: '৳58.20',

  // User dashboard
  userKpis: {
    balance:     { v: '৳345.50',  sub: '47 days runway',  tone: 'neutral' },
    mealsMonth:  { v: '47',       sub: 'of 54 days',      tone: 'neutral' },
    rate:        { v: '৳62.40',   sub: '+7.2% vs April',  tone: 'warn' },
  },

  // Meal toggles (user side)
  tomorrowMeals: [
    { type: 'Breakfast', time: '7:30–9:30 AM', on: true,  guests: 0, cutoff: '6:30 AM', locked: false,
      menu: ['Paratha', 'Egg curry', 'Tea'] },
    { type: 'Lunch',     time: '12:30–2:30 PM', on: false, guests: 0, cutoff: '10:30 AM', locked: false,
      menu: ['Rice', 'Beef bhuna', 'Daal', 'Mixed vegetables'] },
    { type: 'Dinner',    time: '7:30–9:30 PM', on: true,  guests: 2, cutoff: '5:30 PM', locked: false,
      menu: ['Rice', 'Chicken curry', 'Salad'] },
  ],
  cutoffCountdown: '4h 23m',

  // Week menu
  weekMenu: [
    { day: 'Sat May 18', isToday: true, items: { Breakfast: 'Khichuri · Egg · Tea', Lunch: 'Rice · Hilsa · Daal', Dinner: 'Rice · Chicken roast · Salad' } },
    { day: 'Sun May 19', isToday: false, items: { Breakfast: 'Paratha · Egg curry · Tea', Lunch: 'Rice · Beef bhuna · Daal · Vegetables', Dinner: 'Rice · Chicken curry · Salad' } },
    { day: 'Mon May 20', isToday: false, items: { Breakfast: 'Ruti · Sabji · Tea', Lunch: 'Rice · Fish curry · Daal', Dinner: 'Rice · Vegetables · Egg' } },
    { day: 'Tue May 21', isToday: false, items: { Breakfast: 'Bhuna khichuri · Egg', Lunch: 'Rice · Mutton curry · Daal', Dinner: 'Khichuri · Beef · Salad' } },
    { day: 'Wed May 22', isToday: false, items: { Breakfast: '—', Lunch: '—', Dinner: '—' } },
  ],

  // Monthly report
  report: {
    month: 'April 2026',
    rate: '৳58.20',
    totalMeals: 71,
    guestMeals: 4,
    mealCost: '৳4,365.00',
    otherShare: '৳285.50',
    totalBill: '৳4,650.50',
    deposits: [
      { date: 'Apr 03', amount: '৳3,000', by: 'Self' },
      { date: 'Apr 19', amount: '৳2,500', by: 'Self' },
    ],
    opening: '+৳122.00',
    closing: '+৳345.50',
    attendance: { Breakfast: 22, Lunch: 26, Dinner: 23 },
  },

  // Notifications
  notifications: [
    { id: 1, kind: 'rate',    title: 'May meal rate update', body: 'Predicted rate is ৳62.40 — up from ৳58.20 last month.', when: '32m ago', unread: true },
    { id: 2, kind: 'cutoff',  title: 'Tomorrow\'s lunch cuts off at 10:30 AM', body: 'Toggle now if you want lunch.', when: '2h ago', unread: true },
    { id: 3, kind: 'deposit', title: 'Deposit recorded',     body: 'Admin recorded ৳3,000 to your account.', when: 'Yesterday', unread: true },
    { id: 4, kind: 'stock',   title: 'Low stock: Onion 3 kg',  body: 'You\'ve been mentioned in a stock alert.', when: '2 days ago', unread: false },
    { id: 5, kind: 'menu',    title: 'Menu set for May 20',    body: 'Lunch: Rice · Fish curry · Daal', when: '3 days ago', unread: false },
  ],

  // Admin
  admin: {
    todayMeals: [
      { type: 'Breakfast', users: 86, guests: 4,  total: 90,  cutoff: '6:30 AM',  menu: 'Khichuri · Egg · Tea' },
      { type: 'Lunch',     users: 94, guests: 7,  total: 101, cutoff: '10:30 AM', menu: 'Rice · Hilsa · Daal · Vegetables' },
      { type: 'Dinner',    users: 78, guests: 12, total: 90,  cutoff: '5:30 PM',  menu: 'Rice · Chicken roast · Salad' },
    ],
    kpis: [
      { key: 'users',   label: 'Active members',   value: '112',     delta: '+3 this week' },
      { key: 'spend',   label: 'Purchases · May',  value: '৳48,250', delta: '৳12,300 left' },
      { key: 'deposit', label: 'Deposits · May',   value: '৳52,800', delta: '24 entries' },
      { key: 'guests',  label: 'Guests today',     value: '23',      delta: 'across 3 meals' },
    ],
    rate: { value: '৳62.40', delta: '+7.2%', vs: '৳58.20 in April', basis: '৳48,250 spent  /  773 meals served', cycle: 'Day 18 of 31 · closes May 31', projected: '৳63.80' },
    lowBalance: [
      { name: 'Rahim Uddin',   room: 'A-302', balance: '-৳245.50', warn: true  },
      { name: 'Karim Hossain', room: 'B-104', balance: '-৳118.00', warn: true  },
      { name: 'Salim Ahmed',   room: 'C-211', balance: '৳42.25',   warn: false },
      { name: 'Fahim Iqbal',   room: 'B-208', balance: '৳89.75',   warn: false },
    ],
    lowStock: [
      { item: 'Rice · basmati', qty: '8 kg',  threshold: '15 kg' },
      { item: 'Onion',          qty: '3 kg',  threshold: '10 kg' },
      { item: 'Soybean Oil',    qty: '2 L',   threshold: '5 L'   },
    ],
    approvals: [
      { name: 'Tanvir Rashid', room: 'A-410', when: '2 days ago' },
      { name: 'Hasib Karim',   room: 'C-307', when: '5 hrs ago'  },
    ],
    chefs: [
      { name: 'Abul Hossain',  status: 'paid',   amount: '৳12,000' },
      { name: 'Jamal Mia',     status: 'unpaid', amount: '৳9,500'  },
      { name: 'Selina Begum',  status: 'paid',   amount: '৳11,000' },
    ],
    purchases: [
      { date: 'May 18', buyer: 'Abul H.', item: 'Rice basmati 25kg', qty: '25 kg', price: '৳2,250', total: '৳2,250' },
      { date: 'May 18', buyer: 'Jamal M.', item: 'Onion', qty: '15 kg', price: '৳45', total: '৳675' },
      { date: 'May 17', buyer: 'Abul H.', item: 'Beef', qty: '8 kg', price: '৳720', total: '৳5,760' },
      { date: 'May 17', buyer: 'Selina B.', item: 'Soybean Oil 5L', qty: '5 L', price: '৳168', total: '৳840' },
      { date: 'May 16', buyer: 'Abul H.', item: 'Chicken broiler', qty: '12 kg', price: '৳195', total: '৳2,340' },
      { date: 'May 16', buyer: 'Jamal M.', item: 'Tomato', qty: '4 kg', price: '৳65', total: '৳260' },
      { date: 'May 15', buyer: 'Abul H.', item: 'Hilsa', qty: '6 kg', price: '৳1,200', total: '৳7,200' },
    ],
    deposits: [
      { date: 'May 18', name: 'Nuruddin Anam',   room: 'B-208', amount: '৳3,000', note: 'Cash' },
      { date: 'May 18', name: 'Rahim Uddin',     room: 'A-302', amount: '৳2,000', note: 'bKash' },
      { date: 'May 17', name: 'Karim Hossain',   room: 'B-104', amount: '৳1,500', note: 'Cash' },
      { date: 'May 17', name: 'Selim Mahmud',    room: 'A-107', amount: '৳4,500', note: '' },
      { date: 'May 16', name: 'Fahim Iqbal',     room: 'B-208', amount: '৳2,500', note: 'Nagad' },
    ],
    billing: {
      mealRate: '৳62.40',
      otherCostPerUser: '৳245.50',
      totalPurchases: '৳48,250.00',
      totalOtherCosts: '৳27,496.00',
      totalMeals: 773,
      activeUsers: 112,
      rows: [
        { name: 'Nuruddin Anam',   room: 'B-208', meals: 47, guests: 4, mealCost: '৳3,182.40', otherShare: '৳245.50', total: '৳3,427.90' },
        { name: 'Rahim Uddin',     room: 'A-302', meals: 51, guests: 0, mealCost: '৳3,182.40', otherShare: '৳245.50', total: '৳3,427.90' },
        { name: 'Karim Hossain',   room: 'B-104', meals: 38, guests: 2, mealCost: '৳2,496.00', otherShare: '৳245.50', total: '৳2,741.50' },
        { name: 'Selim Mahmud',    room: 'A-107', meals: 49, guests: 0, mealCost: '৳3,057.60', otherShare: '৳245.50', total: '৳3,303.10' },
        { name: 'Fahim Iqbal',     room: 'B-208', meals: 45, guests: 1, mealCost: '৳2,870.40', otherShare: '৳245.50', total: '৳3,115.90' },
      ],
    },
    stock: [
      { name: 'Rice · basmati',  qty: '8 kg',  threshold: '15 kg', updated: '2h ago' },
      { name: 'Onion',           qty: '3 kg',  threshold: '10 kg', updated: '5h ago' },
      { name: 'Soybean Oil',     qty: '2 L',   threshold: '5 L',   updated: '1d ago' },
      { name: 'Lentil (masoor)', qty: '22 kg', threshold: '10 kg', updated: '2d ago' },
      { name: 'Sugar',           qty: '18 kg', threshold: '5 kg',  updated: '4d ago' },
      { name: 'Salt',            qty: '12 kg', threshold: '5 kg',  updated: '6d ago' },
      { name: 'Tomato',          qty: '4 kg',  threshold: '4 kg',  updated: '1d ago' },
      { name: 'Eggs',            qty: '6 doz', threshold: '4 doz', updated: '3h ago' },
    ],
    members: [
      { name: 'Rahim Uddin',     room: 'A-302', phone: '01711-208-419', balance: '-৳245.50', status: 'active' },
      { name: 'Karim Hossain',   room: 'B-104', phone: '01711-208-100', balance: '-৳118.00', status: 'active' },
      { name: 'Nuruddin Anam',   room: 'B-208', phone: '01779-456-218', balance: '৳345.50',  status: 'active' },
      { name: 'Selim Mahmud',    room: 'A-107', phone: '01756-202-107', balance: '৳1,420.00', status: 'active' },
      { name: 'Fahim Iqbal',     room: 'B-208', phone: '01712-208-201', balance: '৳89.75',   status: 'active' },
      { name: 'Tanvir Rashid',   room: 'A-410', phone: '01799-104-410', balance: '—',         status: 'pending' },
      { name: 'Hasib Karim',     room: 'C-307', phone: '01798-307-201', balance: '—',         status: 'pending' },
      { name: 'Imran Hossain',   room: 'C-208', phone: '01755-208-100', balance: '৳240.00',  status: 'blocked' },
    ],
  },

  chef: {
    today: 'Saturday · May 18',
    profile: { name: 'Abul Hossain', joined: 'Joined Sep 2023', salary: '৳12,000' },
    portions: [
      { type: 'Breakfast', total: 90,  users: 86, guests: 4,  served: true,  time: '7:30–9:30 AM' },
      { type: 'Lunch',     total: 101, users: 94, guests: 7,  served: false, time: '12:30–2:30 PM' },
      { type: 'Dinner',    total: 90,  users: 78, guests: 12, served: false, time: '7:30–9:30 PM' },
    ],
    nextCut: 'Lunch closes in 2h 14m',
  },
};
