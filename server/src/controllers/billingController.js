const { BillingCycle, UserBill, User, Deposit, AuditLog } = require('../models');
const { calculateBilling } = require('../utils/billingEngine');
const { sendPushToAllUsers } = require('../utils/pushService');
const { generateBillingReportHTML } = require('../utils/billingReportTemplate');
const { generatePDF } = require('../utils/pdfGenerator');

const previewBilling = async (req, res, next) => {
  try {
    const result = await calculateBilling(req.params.month);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const submitBilling = async (req, res, next) => {
  try {
    const { month } = req.params;

    const existing = await BillingCycle.findOne({ billingMonth: month });
    if (existing?.isLocked) {
      return res.status(400).json({ message: 'Already submitted.' });
    }

    const result = await calculateBilling(month);

    const billingCycle = await BillingCycle.findOneAndUpdate(
      { billingMonth: month },
      {
        billingMonth: month,
        totalItemCost: result.totalItemCost,
        totalOtherCost: result.totalOtherCost,
        totalMealCount: result.totalMealCount,
        mealRate: result.mealRate,
        otherCostPerUser: result.otherCostPerUser,
        activeUserCount: result.activeUserCount,
        isLocked: true,
        submittedAt: new Date(),
        submittedBy: req.user.userId,
      },
      { upsert: true, new: true },
    );

    const userBillDocs = result.userBills.map((u) => ({
      userId: u.userId,
      billingMonth: month,
      mealCount: u.mealCount,
      guestMealCount: u.guestMealCount,
      mealCost: u.mealCost,
      otherCostShare: u.otherCostShare,
      totalBill: u.totalBill,
    }));

    if (userBillDocs.length > 0) {
      await UserBill.insertMany(userBillDocs);
    }

    await AuditLog.create({
      actorId: req.user.userId,
      actorRole: req.user.role,
      action: 'BILLING_SUBMITTED',
      targetEntity: 'BillingCycle',
      targetId: billingCycle._id,
      oldValue: null,
      newValue: billingCycle.toObject(),
    });

    sendPushToAllUsers({ title: 'Monthly Billing Submitted', body: `Billing for ${month} has been finalised.` }).catch(() => {});

    res.status(201).json({ billingCycle });
  } catch (err) {
    next(err);
  }
};

const getBilling = async (req, res, next) => {
  try {
    const { month } = req.params;
    const { userId, role } = req.user;

    const billingCycle = await BillingCycle.findOne({ billingMonth: month });
    if (!billingCycle) return res.status(404).json({ message: 'Billing cycle not found.' });

    if (role === 'admin' || role === 'superadmin') {
      const userBills = await UserBill.find({ billingMonth: month })
        .populate('userId', 'name email');
      return res.json({ billingCycle, userBills });
    }

    const userBill = await UserBill.findOne({ billingMonth: month, userId });
    res.json({ billingCycle, userBill: userBill ?? null });
  } catch (err) {
    next(err);
  }
};

const getPredictedRate = async (req, res, next) => {
  try {
    const { month } = req.params;

    const cycle = await BillingCycle.findOne({ billingMonth: month });
    if (cycle?.isLocked) {
      return res.json({ mealRate: cycle.mealRate, isLocked: true });
    }

    const { mealRate } = await calculateBilling(month);
    res.json({ mealRate, isLocked: false });
  } catch (err) {
    next(err);
  }
};

const downloadBillingPDF = async (req, res, next) => {
  try {
    const { month } = req.params;
    const monthStart = new Date(`${month}-01`);
    const monthEnd   = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const billingCycle = await BillingCycle.findOne({ billingMonth: month });
    if (!billingCycle) {
      return res.status(404).json({ message: 'Billing cycle not found for this month.' });
    }

    // For locked cycles use stored UserBill docs; for preview recalculate.
    let userBills;
    let cycleData = billingCycle.toObject();

    if (billingCycle.isLocked) {
      userBills = await UserBill.find({ billingMonth: month }).lean();
    } else {
      const preview = await calculateBilling(month);
      userBills = preview.userBills ?? [];
      // Overlay preview numbers (stored cycle may be stale).
      cycleData = { ...cycleData, ...preview, billingMonth: month };
    }

    const [users, deposits, submittedByUser] = await Promise.all([
      User.find({ status: 'active' }).select('name roomNumber').lean(),
      Deposit.find({ date: { $gte: monthStart, $lt: monthEnd } }).select('userId amount').lean(),
      billingCycle.isLocked && billingCycle.submittedBy
        ? User.findById(billingCycle.submittedBy).select('name').lean()
        : Promise.resolve(null),
    ]);

    const depositMap = {};
    for (const d of deposits) {
      const uid = d.userId.toString();
      depositMap[uid] = (depositMap[uid] ?? 0) + d.amount;
    }

    const html = generateBillingReportHTML({
      billingCycle: { ...cycleData, submittedByName: submittedByUser?.name ?? null },
      userBills,
      users,
      depositMap,
    });

    const pdfBuffer = await generatePDF(html);
    const [yyyy, mm] = month.split('-');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="billing-${mm}-${yyyy}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { previewBilling, submitBilling, getBilling, getPredictedRate, downloadBillingPDF };
