// Admin-facing screens. Desktop-first since admins primarily use a laptop.
// Dashboard / Set menu / Purchases / Deposits / Billing / Stock / Members.
// Page title + actions live in DesktopFrame's top bar — screen bodies focus
// on content only.

function ScreenAdminDashboard({ tok }) {
  const d = window.APP_DATA;
  const a = d.admin;
  const r = a.rate;

  const Body = (
    <div style={{ padding: '24px 28px' }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        {a.kpis.map((k) => (
          <Card key={k.key} tok={tok}>
            <Eyebrow color={tok.muted}>{k.label}</Eyebrow>
            <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
            <div style={{ fontSize: 12, color: tok.dim, marginTop: 4 }}>{k.delta}</div>
          </Card>
        ))}
      </div>

      {/* Meals table + rate hero */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 12, marginBottom: 14 }}>
        <Card tok={tok} padding="18px 20px">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Eyebrow color={tok.muted}>Today's portions</Eyebrow>
            <span style={{ fontSize: 12, color: tok.dim }}>{d.monthLabel}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr' }}>
            {['Menu', 'Users', 'Guests', 'Portions', 'Cut-off'].map((h, i) => (
              <div key={i} style={{
                padding: '8px 0', borderBottom: `1px solid ${tok.hairline}`,
                fontSize: 11, color: tok.muted, textTransform: 'uppercase',
                letterSpacing: '0.06em', fontWeight: 500,
                textAlign: i >= 1 ? 'right' : 'left',
              }}>{h}</div>
            ))}
            {a.todayMeals.map((m) => (
              <React.Fragment key={m.type}>
                <div style={{ padding: '12px 0', borderBottom: `1px solid ${tok.hairlineSoft}` }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{m.type}</div>
                  <div style={{ fontSize: 12, color: tok.muted, marginTop: 2 }}>{m.menu}</div>
                </div>
                <div style={{ padding: '12px 0', borderBottom: `1px solid ${tok.hairlineSoft}`, textAlign: 'right', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{m.users}</div>
                <div style={{ padding: '12px 0', borderBottom: `1px solid ${tok.hairlineSoft}`, textAlign: 'right', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{m.guests}</div>
                <div style={{ padding: '12px 0', borderBottom: `1px solid ${tok.hairlineSoft}`, textAlign: 'right' }}>
                  <Badge tok={tok} tone="info" style={{ fontSize: 13, padding: '2px 10px', fontVariantNumeric: 'tabular-nums' }}>{m.total}</Badge>
                </div>
                <div style={{ padding: '12px 0', borderBottom: `1px solid ${tok.hairlineSoft}`, textAlign: 'right', fontSize: 13, color: tok.muted }}>{m.cutoff}</div>
              </React.Fragment>
            ))}
          </div>
        </Card>

        <Card tok={tok} padding="20px 22px" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Eyebrow color={tok.muted}>Predicted meal rate · running</Eyebrow>
            <Badge tok={tok} tone="warn" style={{ fontSize: 11 }}>↑ {r.delta}</Badge>
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 50, fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{r.value}</div>
              <div style={{ fontSize: 14, color: tok.muted, paddingBottom: 4 }}>per meal</div>
            </div>
            <div style={{ fontSize: 12, color: tok.muted, marginTop: 6 }}>vs. {r.vs}</div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${tok.hairline}` }}>
            <div style={{ fontSize: 11, color: tok.muted }}>{r.basis}</div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: tok.muted, marginBottom: 5 }}>
              <span>{r.cycle}</span>
              <span>Projected <span style={{ color: tok.ink, fontWeight: 500 }}>{r.projected}</span></span>
            </div>
            <div style={{ position: 'relative', height: 6, background: tok.soft, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: '58%', height: '100%', background: tok.ink, borderRadius: 999 }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Low balance + Low stock */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <Card tok={tok} padding="18px 20px">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eyebrow color={tok.muted}>Low balance</Eyebrow>
              <Badge tok={tok} tone="danger">{a.lowBalance.filter(u => u.warn).length}</Badge>
            </div>
            <span style={{ fontSize: 12, color: tok.dim }}>View all →</span>
          </div>
          {a.lowBalance.map((u, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 0.9fr', gap: 8,
              padding: '10px 0', borderBottom: i < a.lowBalance.length - 1 ? `1px solid ${tok.hairlineSoft}` : 'none',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
              <div style={{ fontSize: 13, color: tok.muted }}>{u.room}</div>
              <div style={{
                fontSize: 14, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                color: u.warn ? tok.dangerInk : tok.ink, fontWeight: u.warn ? 500 : 400,
              }}>{u.balance}</div>
            </div>
          ))}
        </Card>

        <Card tok={tok} padding="18px 20px">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eyebrow color={tok.muted}>Low stock</Eyebrow>
              <Badge tok={tok} tone="warn">{a.lowStock.length}</Badge>
            </div>
            <span style={{ fontSize: 12, color: tok.dim }}>View all →</span>
          </div>
          {a.lowStock.map((s, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 0.8fr', gap: 8,
              padding: '10px 0', borderBottom: i < a.lowStock.length - 1 ? `1px solid ${tok.hairlineSoft}` : 'none',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{s.item}</div>
              <div style={{ fontSize: 14, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: tok.warnInk, fontWeight: 500 }}>{s.qty}</div>
              <div style={{ fontSize: 13, textAlign: 'right', color: tok.muted, fontVariantNumeric: 'tabular-nums' }}>threshold {s.threshold}</div>
            </div>
          ))}
        </Card>
      </div>

      {/* Approvals + Chefs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card tok={tok} padding="18px 20px">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Eyebrow color={tok.muted}>Pending approvals</Eyebrow>
            <Badge tok={tok} tone="info">{a.approvals.length}</Badge>
          </div>
          {a.approvals.map((u, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: i < a.approvals.length - 1 ? `1px solid ${tok.hairlineSoft}` : 'none',
            }}>
              <Avatar tok={tok} name={u.name} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: tok.muted }}>{u.room} · {u.when}</div>
              </div>
              <PrimaryBtn tok={tok} size="sm">Approve</PrimaryBtn>
            </div>
          ))}
        </Card>

        <Card tok={tok} padding="18px 20px">
          <Eyebrow color={tok.muted} style={{ marginBottom: 10 }}>Chef salary · May</Eyebrow>
          {a.chefs.map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: i < a.chefs.length - 1 ? `1px solid ${tok.hairlineSoft}` : 'none',
            }}>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{c.name}</div>
              <div style={{ fontSize: 13, color: tok.muted, fontVariantNumeric: 'tabular-nums' }}>{c.amount}</div>
              <Badge tok={tok} tone={c.status === 'paid' ? 'success' : 'warn'}>
                {c.status === 'paid' ? 'Paid' : 'Unpaid'}
              </Badge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );

  return <DesktopFrame tok={tok} title="Admin dashboard" subtitle={d.today} active="home" role="admin">
    {Body}
  </DesktopFrame>;
}

function ScreenSetMenu({ tok }) {
  const Body = (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { type: 'Breakfast', items: ['Paratha', 'Egg curry', 'Tea'], time: '7:30 – 9:30 AM' },
          { type: 'Lunch',     items: ['Rice', 'Beef bhuna', 'Daal', 'Mixed vegetables'], time: '12:30 – 2:30 PM' },
          { type: 'Dinner',    items: ['Rice', 'Chicken curry', 'Salad'], time: '7:30 – 9:30 PM' },
        ].map((m) => (
          <Card key={m.type} tok={tok} padding="18px 20px">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{m.type}</div>
                <div style={{ fontSize: 11, color: tok.muted, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{m.time}</div>
              </div>
              <Badge tok={tok} tone="neutral" style={{ fontSize: 10 }}>{m.items.length} items</Badge>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {m.items.map((it, i) => (
                <span key={i} style={{
                  fontSize: 12, padding: '5px 10px', borderRadius: 999,
                  background: tok.soft, color: tok.ink, border: `1px solid ${tok.hairlineSoft}`,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                  {it}
                  <I name="x" size={11} stroke={1.6} color={tok.muted} />
                </span>
              ))}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', background: tok.bg,
              border: `1px solid ${tok.hairline}`, borderRadius: 8,
            }}>
              <I name="plus" size={14} stroke={1.7} color={tok.muted} />
              <span style={{ fontSize: 13, color: tok.muted }}>Type item and press Enter</span>
            </div>
          </Card>
        ))}
      </div>

      {/* History strip */}
      <div style={{ marginTop: 18 }}>
        <Eyebrow color={tok.muted} style={{ marginBottom: 8 }}>Recent days</Eyebrow>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {window.APP_DATA.weekMenu.slice(0, 4).map((d, i) => (
            <div key={i} style={{
              padding: '8px 12px', borderRadius: 8, fontSize: 12,
              background: d.isToday ? tok.ink : tok.surface,
              color: d.isToday ? tok.bg : tok.muted,
              border: `1px solid ${d.isToday ? tok.ink : tok.hairline}`,
              cursor: 'pointer',
            }}>{d.day}</div>
          ))}
        </div>
      </div>
    </div>
  );

  return <DesktopFrame tok={tok} title="Set menu" subtitle="Sun, May 19" active="menu" role="admin"
    action={
      <div style={{ display: 'flex', gap: 8 }}>
        <GhostBtn tok={tok} size="sm" icon={<I name="calendar" size={13} stroke={1.6} />}>Pick date</GhostBtn>
        <PrimaryBtn tok={tok} size="sm">Save menu</PrimaryBtn>
      </div>
    }>
    {Body}
  </DesktopFrame>;
}

function ScreenPurchases({ tok }) {
  const d = window.APP_DATA;
  const Body = (
    <div style={{ padding: '24px 28px' }}>
      {/* Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        <Card tok={tok}>
          <Eyebrow color={tok.muted}>Month total</Eyebrow>
          <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>৳48,250</div>
          <div style={{ fontSize: 12, color: tok.dim, marginTop: 3 }}>across 7 entries</div>
        </Card>
        <Card tok={tok}>
          <Eyebrow color={tok.muted}>Top buyer</Eyebrow>
          <div style={{ fontSize: 20, fontWeight: 500, marginTop: 6 }}>Abul H.</div>
          <div style={{ fontSize: 12, color: tok.dim, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>৳17,550 · 4 purchases</div>
        </Card>
        <Card tok={tok}>
          <Eyebrow color={tok.muted}>Latest item</Eyebrow>
          <div style={{ fontSize: 16, fontWeight: 500, marginTop: 6 }}>Rice basmati 25kg</div>
          <div style={{ fontSize: 12, color: tok.dim, marginTop: 3 }}>May 18 · ৳2,250</div>
        </Card>
      </div>

      {/* Filter bar */}
      <Card tok={tok} padding="10px 12px" style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: tok.bg, border: `1px solid ${tok.hairline}`, borderRadius: 8, flex: 1 }}>
          <I name="search" size={14} stroke={1.55} color={tok.muted} />
          <span style={{ fontSize: 13, color: tok.muted }}>Search items, buyers…</span>
        </div>
        <GhostBtn tok={tok} size="sm" icon={<I name="filter" size={13} stroke={1.6} />}>All buyers</GhostBtn>
        <GhostBtn tok={tok} size="sm" icon={<I name="calendar" size={13} stroke={1.6} />}>May 2026</GhostBtn>
      </Card>

      <Card tok={tok} padding="0">
        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 2fr 0.9fr 0.9fr 0.9fr 40px', padding: '12px 18px', borderBottom: `1px solid ${tok.hairline}` }}>
          {['Date', 'Buyer', 'Item', 'Quantity', 'Unit price', 'Total', ''].map((h, i) => (
            <div key={i} style={{
              fontSize: 11, color: tok.muted, textTransform: 'uppercase',
              letterSpacing: '0.06em', fontWeight: 500,
              textAlign: i >= 3 && i <= 5 ? 'right' : 'left',
            }}>{h}</div>
          ))}
        </div>
        {d.admin.purchases.map((p, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 2fr 0.9fr 0.9fr 0.9fr 40px',
            padding: '12px 18px', borderBottom: i < d.admin.purchases.length - 1 ? `1px solid ${tok.hairlineSoft}` : 'none',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: 13, color: tok.muted, fontVariantNumeric: 'tabular-nums' }}>{p.date}</div>
            <div style={{ fontSize: 13 }}>{p.buyer}</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{p.item}</div>
            <div style={{ fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.qty}</div>
            <div style={{ fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: tok.muted }}>{p.price}</div>
            <div style={{ fontSize: 14, fontWeight: 500, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.total}</div>
            <button style={{
              width: 26, height: 26, borderRadius: 6, background: 'transparent', border: 'none',
              color: tok.muted, cursor: 'pointer', display: 'grid', placeItems: 'center',
            }}><I name="x" size={14} stroke={1.7} /></button>
          </div>
        ))}
      </Card>
    </div>
  );

  return <DesktopFrame tok={tok} title="Purchases" subtitle="May 2026 · 7 entries" active="purchases" role="admin"
    action={<PrimaryBtn tok={tok} size="sm" icon={<I name="plus" size={13} stroke={1.7} color={tok.btnInk} />}>Record purchase</PrimaryBtn>}>
    {Body}
  </DesktopFrame>;
}

function ScreenDeposits({ tok }) {
  const d = window.APP_DATA;
  const Body = (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
        <Card tok={tok} padding="0">
          <div style={{
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${tok.hairline}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: tok.bg, border: `1px solid ${tok.hairline}`, borderRadius: 8, flex: 1, maxWidth: 320 }}>
              <I name="search" size={14} stroke={1.55} color={tok.muted} />
              <span style={{ fontSize: 13, color: tok.muted }}>Search members…</span>
            </div>
            <span style={{ fontSize: 12, color: tok.muted }}>5 entries · ৳13,500 total</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.6fr 0.8fr 1fr 1fr', padding: '12px 18px', borderBottom: `1px solid ${tok.hairline}` }}>
            {['Date', 'Member', 'Room', 'Note', 'Amount'].map((h, i) => (
              <div key={i} style={{
                fontSize: 11, color: tok.muted, textTransform: 'uppercase',
                letterSpacing: '0.06em', fontWeight: 500,
                textAlign: i === 4 ? 'right' : 'left',
              }}>{h}</div>
            ))}
          </div>
          {d.admin.deposits.map((dep, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '0.8fr 1.6fr 0.8fr 1fr 1fr',
              padding: '12px 18px',
              borderBottom: i < d.admin.deposits.length - 1 ? `1px solid ${tok.hairlineSoft}` : 'none',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: 13, color: tok.muted, fontVariantNumeric: 'tabular-nums' }}>{dep.date}</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{dep.name}</div>
              <div style={{ fontSize: 13, color: tok.muted }}>{dep.room}</div>
              <div style={{ fontSize: 13, color: tok.muted }}>{dep.note || '—'}</div>
              <div style={{ fontSize: 14, fontWeight: 500, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: tok.posInk }}>+{dep.amount}</div>
            </div>
          ))}
        </Card>

        {/* Quick form */}
        <Card tok={tok} padding="18px 20px" style={{ alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
          <Eyebrow color={tok.muted}>Record deposit</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <Input tok={tok} label="Member" value="Nuruddin Anam · B-208" />
            <Input tok={tok} label="Amount" value="3,000" adornment="৳" />
            <Input tok={tok} label="Note (optional)" value="" placeholder="Cash, bKash, etc." />
            <PrimaryBtn tok={tok} size="md" style={{ width: '100%', justifyContent: 'center' }}>Record</PrimaryBtn>
          </div>
        </Card>
      </div>
    </div>
  );

  return <DesktopFrame tok={tok} title="Deposits" subtitle="May 2026 · 5 entries" active="deposits" role="admin"
    action={<PrimaryBtn tok={tok} size="sm" icon={<I name="plus" size={13} stroke={1.7} color={tok.btnInk} />}>Record deposit</PrimaryBtn>}>
    {Body}
  </DesktopFrame>;
}

function ScreenBilling({ tok }) {
  const d = window.APP_DATA;
  const b = d.admin.billing;
  const Body = (
    <div style={{ padding: '24px 28px' }}>
      <Card tok={tok} padding="14px 18px" style={{
        marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12,
        background: tok.warnBg, color: tok.warnInk, borderColor: tok.warnBg,
      }}>
        <I name="lock" size={16} stroke={1.7} />
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          <b>Preview — not yet submitted.</b> Submitting will lock this month. Purchases and other costs can no longer be modified.
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'Meal rate',         v: b.mealRate,         sub: 'per meal' },
          { label: 'Other cost / user', v: b.otherCostPerUser, sub: 'flat share' },
          { label: 'Total meals',       v: b.totalMeals,       sub: 'incl. guests' },
          { label: 'Active members',    v: b.activeUsers,      sub: 'this cycle' },
        ].map((k, i) => (
          <Card key={i} tok={tok}>
            <Eyebrow color={tok.muted}>{k.label}</Eyebrow>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{k.v}</div>
            <div style={{ fontSize: 12, color: tok.dim, marginTop: 3 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      <Card tok={tok} padding="0">
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.6fr 0.6fr 1fr 1fr 1fr', padding: '12px 18px', borderBottom: `1px solid ${tok.hairline}` }}>
          {['Member', 'Room', 'Meals', 'Guests', 'Meal cost', 'Other share', 'Total bill'].map((h, i) => (
            <div key={i} style={{
              fontSize: 11, color: tok.muted, textTransform: 'uppercase',
              letterSpacing: '0.06em', fontWeight: 500,
              textAlign: i >= 2 ? 'right' : 'left',
            }}>{h}</div>
          ))}
        </div>
        {b.rows.map((r, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.6fr 0.6fr 1fr 1fr 1fr',
            padding: '12px 18px',
            borderBottom: i < b.rows.length - 1 ? `1px solid ${tok.hairlineSoft}` : 'none',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</div>
            <div style={{ fontSize: 13, color: tok.muted }}>{r.room}</div>
            <div style={{ fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.meals}</div>
            <div style={{ fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: tok.muted }}>{r.guests}</div>
            <div style={{ fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.mealCost}</div>
            <div style={{ fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: tok.muted }}>{r.otherShare}</div>
            <div style={{ fontSize: 14, fontWeight: 500, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.total}</div>
          </div>
        ))}
      </Card>
    </div>
  );

  return <DesktopFrame tok={tok} title="Billing" subtitle="May 2026 · Preview" active="billing" role="admin"
    action={
      <div style={{ display: 'flex', gap: 8 }}>
        <GhostBtn tok={tok} size="sm" icon={<I name="download" size={13} stroke={1.6} />}>Export PDF</GhostBtn>
        <PrimaryBtn tok={tok} size="sm" icon={<I name="lock" size={13} stroke={1.7} color={tok.btnInk} />}>Submit & lock</PrimaryBtn>
      </div>
    }>
    {Body}
  </DesktopFrame>;
}

function ScreenStock({ tok }) {
  const d = window.APP_DATA;

  const isLow = (s) => parseInt(s.qty) < parseInt(s.threshold);

  const Body = (
    <div style={{ padding: '24px 28px' }}>
      <Card tok={tok} padding="0">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 40px', padding: '12px 18px', borderBottom: `1px solid ${tok.hairline}` }}>
          {['Item', 'Quantity', 'Threshold', 'Status', 'Updated', ''].map((h, i) => (
            <div key={i} style={{
              fontSize: 11, color: tok.muted, textTransform: 'uppercase',
              letterSpacing: '0.06em', fontWeight: 500,
              textAlign: i >= 1 && i <= 2 ? 'right' : 'left',
            }}>{h}</div>
          ))}
        </div>
        {d.admin.stock.map((s, i) => {
          const low = isLow(s);
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 40px',
              padding: '12px 18px',
              borderBottom: i < d.admin.stock.length - 1 ? `1px solid ${tok.hairlineSoft}` : 'none',
              alignItems: 'center',
              background: low ? tok.warnBg : 'transparent',
            }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: low ? tok.warnInk : tok.ink }}>{s.name}</div>
              <div style={{ fontSize: 14, fontWeight: 500, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: low ? tok.warnInk : tok.ink }}>{s.qty}</div>
              <div style={{ fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: tok.muted }}>{s.threshold}</div>
              <div>
                <Badge tok={tok} tone={low ? 'warn' : 'success'}>{low ? 'Low stock' : 'OK'}</Badge>
              </div>
              <div style={{ fontSize: 12, color: tok.muted }}>{s.updated}</div>
              <button style={{
                width: 26, height: 26, borderRadius: 6, background: 'transparent', border: 'none',
                color: tok.muted, cursor: 'pointer', display: 'grid', placeItems: 'center',
              }}><I name="chevron" size={14} stroke={1.6} /></button>
            </div>
          );
        })}
      </Card>
    </div>
  );

  return <DesktopFrame tok={tok} title="Stock" subtitle={`${d.admin.stock.length} items · ${d.admin.stock.filter(isLow).length} low`} active="stock" role="admin"
    action={<PrimaryBtn tok={tok} size="sm" icon={<I name="plus" size={13} stroke={1.7} color={tok.btnInk} />}>Add item</PrimaryBtn>}>
    {Body}
  </DesktopFrame>;
}

function ScreenMembers({ tok }) {
  const d = window.APP_DATA;
  const Body = (
    <div style={{ padding: '24px 28px' }}>
      {/* Status filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'All', count: d.admin.members.length, active: true },
          { label: 'Active', count: d.admin.members.filter(m => m.status === 'active').length },
          { label: 'Pending', count: 2 },
          { label: 'Blocked', count: 1 },
        ].map((f, i) => (
          <div key={i} style={{
            padding: '6px 12px', borderRadius: 999, fontSize: 13,
            background: f.active ? tok.ink : tok.surface,
            color: f.active ? tok.bg : tok.muted,
            border: `1px solid ${f.active ? tok.ink : tok.hairline}`,
            cursor: 'pointer',
          }}>{f.label} <span style={{ opacity: 0.7, marginLeft: 4 }}>{f.count}</span></div>
        ))}
      </div>

      <Card tok={tok} padding="0">
        <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 0.8fr 1.2fr 1fr 1fr 120px', padding: '12px 18px', borderBottom: `1px solid ${tok.hairline}` }}>
          {['', 'Name', 'Room', 'Phone', 'Balance', 'Status', ''].map((h, i) => (
            <div key={i} style={{
              fontSize: 11, color: tok.muted, textTransform: 'uppercase',
              letterSpacing: '0.06em', fontWeight: 500,
              textAlign: i === 4 ? 'right' : 'left',
            }}>{h}</div>
          ))}
        </div>
        {d.admin.members.map((m, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '40px 2fr 0.8fr 1.2fr 1fr 1fr 120px',
            padding: '12px 18px',
            borderBottom: i < d.admin.members.length - 1 ? `1px solid ${tok.hairlineSoft}` : 'none',
            alignItems: 'center', gap: 8,
          }}>
            <Avatar tok={tok} name={m.name} size={32} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</div>
            <div style={{ fontSize: 13, color: tok.muted }}>{m.room}</div>
            <div style={{ fontSize: 13, color: tok.muted, fontVariantNumeric: 'tabular-nums' }}>{m.phone}</div>
            <div style={{
              fontSize: 14, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
              fontWeight: m.balance.startsWith('-') ? 500 : 400,
              color: m.balance.startsWith('-') ? tok.dangerInk : tok.ink,
            }}>{m.balance}</div>
            <div>
              <Badge tok={tok} tone={m.status === 'active' ? 'success' : m.status === 'pending' ? 'info' : 'danger'}>
                {m.status[0].toUpperCase() + m.status.slice(1)}
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              {m.status === 'pending' && <PrimaryBtn tok={tok} size="sm">Approve</PrimaryBtn>}
              {m.status === 'active' && <GhostBtn tok={tok} size="sm">Manage</GhostBtn>}
              {m.status === 'blocked' && <GhostBtn tok={tok} size="sm">Unblock</GhostBtn>}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );

  return <DesktopFrame tok={tok} title="Members" subtitle={`${d.admin.members.length} accounts · 2 pending`} active="users" role="admin"
    action={<PrimaryBtn tok={tok} size="sm" icon={<I name="plus" size={13} stroke={1.7} color={tok.btnInk} />}>Invite member</PrimaryBtn>}>
    {Body}
  </DesktopFrame>;
}

Object.assign(window, { ScreenAdminDashboard, ScreenSetMenu, ScreenPurchases, ScreenDeposits, ScreenBilling, ScreenStock, ScreenMembers });
