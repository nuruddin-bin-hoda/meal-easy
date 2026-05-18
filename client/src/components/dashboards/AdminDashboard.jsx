import { useState, useEffect, useCallback } from 'react';
import {
  Alert, Avatar, Box, CircularProgress, Typography, useTheme,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTopbar } from '../../context/TopbarContext';
import api from '../../api/axios';

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt   = (n) => `৳${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtN  = (n) => Number(n ?? 0).toLocaleString('en-US');

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return '?';
  return (parts[0][0] + (parts[parts.length - 1][0] ?? '')).toUpperCase();
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 24) return `${h} hr${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
};

// ─── RateHero ───────────────────────────────────────────────────────────────

function RateHero({ predictedMealRate, previousMonthRate, totalPurchasesThisMonth, totalMealsThisMonth, cycleDay, cycleTotal, projectedFinalRate, tok, t }) {
  const delta = previousMonthRate && previousMonthRate > 0
    ? (predictedMealRate - previousMonthRate) / previousMonthRate
    : null;
  const isUp  = delta !== null && delta > 0;
  const pct   = delta !== null ? `${Math.abs(delta * 100).toFixed(1)}%` : null;

  const pctLabel = pct ? (isUp ? t('dashboard.rateUp', { pct }) : t('dashboard.rateDown', { pct })) : null;
  const cyclePct = cycleTotal > 0 ? Math.min((cycleDay / cycleTotal) * 100, 100) : 0;

  const now       = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toLocaleDateString('en-US', { month: 'long' });
  const lastDay   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const closeDate = lastDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <Box sx={{
      bgcolor: tok.surface,
      border: `1px solid ${tok.hairline}`,
      borderRadius: '12px',
      p: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      minHeight: 220,
    }}>
      {/* Eyebrow + delta pill */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Typography sx={{ fontSize: 11, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
          {t('dashboard.rateEyebrow')}
        </Typography>
        {pctLabel && (
          <Box component="span" sx={{
            fontSize: 11, fontWeight: 500,
            px: '9px', py: '3px', borderRadius: '999px',
            bgcolor: isUp ? tok.warnBg : tok.posBg,
            color:   isUp ? tok.warnInk : tok.posInk,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}>
            {pctLabel}
          </Box>
        )}
      </Box>

      {/* Big number */}
      <Box sx={{ mt: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography sx={{
            fontSize: 56, fontWeight: 500, letterSpacing: '-0.035em',
            lineHeight: 1, color: tok.ink, fontVariantNumeric: 'tabular-nums',
          }}>
            {fmt(predictedMealRate)}
          </Typography>
          <Typography sx={{ fontSize: 14, color: tok.muted, pb: '4px' }}>
            {t('dashboard.ratePerMeal')}
          </Typography>
        </Box>
        {previousMonthRate != null && previousMonthRate > 0 && (
          <Typography sx={{ fontSize: 12, color: tok.muted, mt: 0.75 }}>
            {t('dashboard.rateVsLastMonth', { amount: fmt(previousMonthRate).replace('৳', ''), month: prevMonth })}
          </Typography>
        )}
      </Box>

      {/* Basis */}
      <Box sx={{ mt: '14px', pt: '12px', borderTop: `1px solid ${tok.hairline}` }}>
        <Typography sx={{ fontSize: 11, color: tok.muted, fontVariantNumeric: 'tabular-nums' }}>
          {t('dashboard.rateBasis', { spent: fmtN(Math.round(totalPurchasesThisMonth)), meals: fmtN(totalMealsThisMonth) })}
        </Typography>
      </Box>

      {/* Cycle progress */}
      <Box sx={{ mt: '12px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
          <Typography sx={{ fontSize: 11, color: tok.muted }}>
            {t('dashboard.rateCycle', { day: cycleDay, total: cycleTotal, date: closeDate })}
          </Typography>
          <Typography sx={{ fontSize: 11, color: tok.muted }}>
            {t('dashboard.rateProjected')}{' '}
            <Box component="span" sx={{ color: tok.ink, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
              {fmt(projectedFinalRate)}
            </Box>
          </Typography>
        </Box>
        <Box sx={{ position: 'relative', height: 6, bgcolor: tok.soft, borderRadius: '999px', overflow: 'hidden' }}>
          <Box sx={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${cyclePct}%`, bgcolor: tok.ink, borderRadius: '999px',
          }} />
        </Box>
      </Box>
    </Box>
  );
}

// ─── CountBadge ─────────────────────────────────────────────────────────────

function CountBadge({ count, bg, color }) {
  return (
    <Box component="span" sx={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 500,
      px: '8px', py: '2px', borderRadius: '999px',
      bgcolor: bg, color,
    }}>
      {count}
    </Box>
  );
}

// ─── SectionHeader ──────────────────────────────────────────────────────────

function SectionHeader({ label, badge, badgeBg, badgeInk, viewLink, viewLabel, tok }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '12px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: 11, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
          {label}
        </Typography>
        {badge != null && (
          <CountBadge count={badge} bg={badgeBg} color={badgeInk} />
        )}
      </Box>
      {viewLink && (
        <Box
          component={Link} to={viewLink}
          sx={{ fontSize: 12, color: tok.dim, textDecoration: 'none', '&:hover': { color: tok.muted } }}
        >
          {viewLabel} →
        </Box>
      )}
    </Box>
  );
}

// ─── AdminDashboard ─────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user }    = useAuth();
  const { t, i18n } = useTranslation();
  const theme       = useTheme();
  const tok         = theme.tokens;
  const { setTopbar } = useTopbar();

  useEffect(() => {
    setTopbar({ title: t('nav.dashboard') });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [pendingUsers, setPendingUsers] = useState([]);

  useEffect(() => {
    api.get('/dashboard/admin')
      .then((res) => {
        setData(res.data);
        setPendingUsers(res.data.pendingApprovals?.users ?? []);
      })
      .catch(() => setError(t('dashboard.failedToLoad')))
      .finally(() => setLoading(false));
  }, [t]);

  const handleApprove = useCallback(async (userId) => {
    try {
      await api.patch(`/users/${userId}/approve`);
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch { /* silently fail — table will refresh on next load */ }
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error)   return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  const {
    totalActiveUsers = 0,
    todayMealCounts = [],
    todayTotalGuests = 0,
    predictedMealRate = 0,
    previousMonthRate = null,
    totalPurchasesThisMonth = 0,
    totalDepositsThisMonth = 0,
    totalMealsThisMonth = 0,
    cycleDay = 1,
    cycleTotal = 31,
    projectedFinalRate = 0,
    lowBalanceUsers = [],
    lowStockItems = [],
    chefSalaryStatus = [],
  } = data;

  // KPI row helpers
  const now       = new Date();
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  const mealCount = todayMealCounts.length;

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).replace(',', ' ·');

  // Common sx shortcuts
  const eyebrowSx = {
    fontSize: 11, color: tok.muted, textTransform: 'uppercase',
    letterSpacing: '0.06em', fontWeight: 500,
  };
  const cardSx = {
    bgcolor: tok.surface,
    border: `1px solid ${tok.hairline}`,
    borderRadius: '12px',
    p: '18px 20px',
  };
  const tblHeaderSx = {
    fontSize: 11, color: tok.muted, textTransform: 'uppercase',
    letterSpacing: '0.06em', fontWeight: 500,
    py: '8px', borderBottom: `1px solid ${tok.hairline}`,
  };

  return (
    <Box sx={{
      px: { xs: '16px', md: '28px' },
      py: { xs: '16px', md: '24px' },
      bgcolor: tok.bg,
      minHeight: '100%',
      fontFeatureSettings: '"tnum","cv11"',
    }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: '22px' }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', color: tok.ink }}>
            {t('dashboard.adminTitle')}
          </Typography>
          <Typography sx={{ fontSize: 13, color: tok.muted, mt: '2px' }}>
            {formattedDate}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box component="span" sx={{
            fontSize: 11, px: '10px', py: '4px', borderRadius: '999px',
            bgcolor: tok.soft, color: tok.muted,
            border: `1px solid ${tok.hairline}`, letterSpacing: '0.04em',
          }}>
            {user?.role === 'superadmin' ? 'Superadmin' : 'Admin'}
          </Box>
          <Avatar sx={{ width: 32, height: 32, bgcolor: tok.ink, color: tok.bg, fontSize: 12, fontWeight: 500 }}>
            {getInitials(user?.name)}
          </Avatar>
        </Box>
      </Box>

      {/* ── KPI row (4 tiles) ────────────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: '12px',
        mb: '14px',
      }}>
        {/* Active Members */}
        <Box sx={cardSx}>
          <Typography sx={eyebrowSx}>{t('dashboard.activeMembers')}</Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', mt: 1, fontVariantNumeric: 'tabular-nums', color: tok.ink }}>
            {fmtN(totalActiveUsers)}
          </Typography>
          <Typography sx={{ fontSize: 12, color: tok.dim, mt: 0.75 }}>
            {t('dashboard.membersWeekDelta', { n: 0 })}
          </Typography>
        </Box>

        {/* Purchases this month */}
        <Box sx={cardSx}>
          <Typography sx={eyebrowSx}>{t('dashboard.purchasesMonth', { month: monthName })}</Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', mt: 1, fontVariantNumeric: 'tabular-nums', color: tok.ink }}>
            {fmt(totalPurchasesThisMonth)}
          </Typography>
          <Typography sx={{ fontSize: 12, color: tok.dim, mt: 0.75 }}>
            &nbsp;
          </Typography>
        </Box>

        {/* Deposits this month */}
        <Box sx={cardSx}>
          <Typography sx={eyebrowSx}>{t('dashboard.depositsMonth', { month: monthName })}</Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', mt: 1, fontVariantNumeric: 'tabular-nums', color: tok.ink }}>
            {fmt(totalDepositsThisMonth)}
          </Typography>
          <Typography sx={{ fontSize: 12, color: tok.dim, mt: 0.75 }}>
            &nbsp;
          </Typography>
        </Box>

        {/* Guests today */}
        <Box sx={cardSx}>
          <Typography sx={eyebrowSx}>{t('dashboard.guestsToday')}</Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', mt: 1, fontVariantNumeric: 'tabular-nums', color: tok.ink }}>
            {fmtN(todayTotalGuests)}
          </Typography>
          <Typography sx={{ fontSize: 12, color: tok.dim, mt: 0.75 }}>
            {t('dashboard.guestsAcrossMeals', { n: mealCount })}
          </Typography>
        </Box>
      </Box>

      {/* ── Today's portions + Rate Hero ─────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.7fr 1fr' },
        gap: '12px',
        mb: '14px',
      }}>
        {/* Portions table — order 2 on mobile (hero comes first) */}
        <Box sx={{ ...cardSx, order: { xs: 2, md: 1 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '12px' }}>
            <Typography sx={eyebrowSx}>{t('dashboard.todayMealCounts')}</Typography>
            <Typography sx={{ fontSize: 12, color: tok.dim }}>
              {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Typography>
          </Box>

          {todayMealCounts.length === 0 ? (
            <Typography sx={{ fontSize: 14, color: tok.muted, py: 2 }}>
              {t('dashboard.noMealsToday')}
            </Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.8fr 0.8fr' }}>
              {/* Header */}
              {[t('dashboard.menuCol'), t('dashboard.users'), t('dashboard.guests'), t('dashboard.totalPortions'), t('dashboard.cutoffCol')].map((h, i) => (
                <Box key={h} sx={{ ...tblHeaderSx, textAlign: i > 0 ? 'right' : 'left' }}>
                  {h}
                </Box>
              ))}

              {/* Rows */}
              {todayMealCounts.map((meal, ri) => {
                const isLast = ri === todayMealCounts.length - 1;
                const rowBorder = isLast ? 'none' : `1px solid ${tok.hairlineSoft}`;
                const cellSx = { py: '10px', borderBottom: rowBorder, fontSize: 14 };
                return [
                  /* Menu cell */
                  <Box key={`${meal.mealType}-menu`} sx={cellSx}>
                    <Typography sx={{ fontWeight: 500, fontSize: 14, color: tok.ink, textTransform: 'capitalize' }}>
                      {meal.mealType}
                    </Typography>
                    {meal.menuItems?.length > 0 && (
                      <Typography sx={{ fontSize: 12, color: tok.muted, mt: '2px' }}>
                        {meal.menuItems.join(' · ')}
                      </Typography>
                    )}
                  </Box>,
                  /* Users */
                  <Box key={`${meal.mealType}-u`} sx={{ ...cellSx, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: tok.ink }}>
                    {meal.userCount}
                  </Box>,
                  /* Guests */
                  <Box key={`${meal.mealType}-g`} sx={{ ...cellSx, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: tok.ink }}>
                    {meal.guestCount}
                  </Box>,
                  /* Portions pill */
                  <Box key={`${meal.mealType}-t`} sx={{ ...cellSx, textAlign: 'right' }}>
                    <Box component="span" sx={{
                      display: 'inline-block',
                      bgcolor: tok.infoBg, color: tok.infoInk,
                      px: '10px', py: '2px', borderRadius: '999px',
                      fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums',
                    }}>
                      {meal.totalPortions}
                    </Box>
                  </Box>,
                  /* Cutoff */
                  <Box key={`${meal.mealType}-c`} sx={{ ...cellSx, textAlign: 'right', color: tok.muted, fontSize: 13 }}>
                    {meal.cutoffTime ?? '—'}
                  </Box>,
                ];
              })}
            </Box>
          )}
        </Box>

        {/* Rate Hero — order 1 on mobile */}
        <Box sx={{ order: { xs: 1, md: 2 } }}>
          <RateHero
            predictedMealRate={predictedMealRate}
            previousMonthRate={previousMonthRate}
            totalPurchasesThisMonth={totalPurchasesThisMonth}
            totalMealsThisMonth={totalMealsThisMonth}
            cycleDay={cycleDay}
            cycleTotal={cycleTotal}
            projectedFinalRate={projectedFinalRate}
            tok={tok}
            t={t}
          />
        </Box>
      </Box>

      {/* ── Low Balance + Low Stock ───────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: '12px',
        mb: '14px',
      }}>
        {/* Low Balance */}
        <Box sx={cardSx}>
          <SectionHeader
            label={t('dashboard.lowBalanceUsers')}
            badge={lowBalanceUsers.filter(u => u.warn).length || undefined}
            badgeBg={tok.dangerBg}
            badgeInk={tok.dangerInk}
            viewLink="/users"
            viewLabel={t('dashboard.viewAll')}
            tok={tok}
          />
          {lowBalanceUsers.length === 0 ? (
            <Alert severity="success" sx={{ mt: 0 }}>{t('dashboard.sufficientBalance')}</Alert>
          ) : (
            lowBalanceUsers.map((u, i) => {
              const isLast = i === lowBalanceUsers.length - 1;
              return (
                <Box key={u.userId?.toString() ?? i} sx={{
                  display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 0.9fr',
                  gap: '8px', py: '10px', alignItems: 'center',
                  borderBottom: isLast ? 'none' : `1px solid ${tok.hairlineSoft}`,
                }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: tok.ink }}>{u.name}</Typography>
                  <Typography sx={{ fontSize: 13, color: tok.muted }}>{u.roomNumber}</Typography>
                  <Typography sx={{
                    fontSize: 14, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                    color: u.warn ? tok.dangerInk : tok.ink,
                    fontWeight: u.warn ? 500 : 400,
                  }}>
                    {fmt(u.balance)}
                  </Typography>
                </Box>
              );
            })
          )}
        </Box>

        {/* Low Stock */}
        <Box sx={cardSx}>
          <SectionHeader
            label={t('dashboard.lowStockItems')}
            badge={lowStockItems.length || undefined}
            badgeBg={tok.warnBg}
            badgeInk={tok.warnInk}
            viewLink="/stock"
            viewLabel={t('dashboard.viewAll')}
            tok={tok}
          />
          {lowStockItems.length === 0 ? (
            <Alert severity="success">{t('dashboard.adequateStock')}</Alert>
          ) : (
            lowStockItems.map((item, i) => {
              const isLast = i === lowStockItems.length - 1;
              return (
                <Box key={item._id?.toString() ?? i} sx={{
                  display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 0.8fr',
                  gap: '8px', py: '10px', alignItems: 'center',
                  borderBottom: isLast ? 'none' : `1px solid ${tok.hairlineSoft}`,
                }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: tok.ink }}>{item.itemName}</Typography>
                  <Typography sx={{
                    fontSize: 14, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                    color: tok.warnInk, fontWeight: 500,
                  }}>
                    {item.quantity} {item.unit}
                  </Typography>
                  <Typography sx={{ fontSize: 13, textAlign: 'right', color: tok.muted, fontVariantNumeric: 'tabular-nums' }}>
                    {t('dashboard.thresholdLabel', { value: `${item.lowThreshold} ${item.unit}` })}
                  </Typography>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* ── Pending Approvals + Chef Salary ──────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: '12px',
      }}>
        {/* Pending Approvals */}
        <Box sx={cardSx}>
          <SectionHeader
            label={t('dashboard.pendingApprovals')}
            badge={pendingUsers.length || undefined}
            badgeBg={tok.infoBg}
            badgeInk={tok.infoInk}
            tok={tok}
          />
          {pendingUsers.length === 0 ? (
            <Alert severity="success">{t('dashboard.noPendingApprovals')}</Alert>
          ) : (
            pendingUsers.map((u, i) => {
              const isLast = i === pendingUsers.length - 1;
              return (
                <Box key={u._id} sx={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  py: '10px',
                  borderBottom: isLast ? 'none' : `1px solid ${tok.hairlineSoft}`,
                }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: tok.soft, color: tok.muted, fontSize: 12, fontWeight: 500 }}>
                    {getInitials(u.name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: tok.ink }} noWrap>
                      {u.name}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: tok.muted }}>
                      {u.roomNumber} · {timeAgo(u.createdAt)}
                    </Typography>
                  </Box>
                  <Box
                    component="button"
                    onClick={() => handleApprove(u._id)}
                    sx={{
                      fontSize: 12, px: '12px', py: '6px', borderRadius: '6px',
                      bgcolor: tok.btnBg, color: tok.btnInk,
                      border: 'none', fontFamily: 'inherit', fontWeight: 500,
                      cursor: 'pointer', flexShrink: 0,
                      '&:hover': { opacity: 0.88 },
                    }}
                  >
                    {t('dashboard.approve')}
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        {/* Chef Salary Status */}
        <Box sx={cardSx}>
          <SectionHeader
            label={t('dashboard.chefSalaryStatus')}
            tok={tok}
          />
          {chefSalaryStatus.length === 0 ? (
            <Alert severity="info">{t('dashboard.noActiveChefs')}</Alert>
          ) : (
            chefSalaryStatus.map((chef, i) => {
              const isPaid = chef.paidStatus === 'paid';
              const isLast = i === chefSalaryStatus.length - 1;
              return (
                <Box key={chef.chefId?.toString() ?? i} sx={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  py: '10px',
                  borderBottom: isLast ? 'none' : `1px solid ${tok.hairlineSoft}`,
                }}>
                  <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 500, color: tok.ink }} noWrap>
                    {chef.name}
                  </Typography>
                  {chef.salaryAmount != null && (
                    <Typography sx={{ fontSize: 13, color: tok.muted, fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(chef.salaryAmount)}
                    </Typography>
                  )}
                  <Box component="span" sx={{
                    fontSize: 11, fontWeight: 500,
                    px: '10px', py: '3px', borderRadius: '999px',
                    bgcolor: isPaid ? tok.posBg : tok.warnBg,
                    color:   isPaid ? tok.posInk : tok.warnInk,
                  }}>
                    {isPaid ? t('common.paid') : t('common.unpaid')}
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

    </Box>
  );
}
