// Chef screen + shared screens (Notifications, Settings).

function ScreenChefDashboard({ tok, mode = 'mobile' }) {
  const c = window.APP_DATA.chef;
  const isMobile = mode === 'mobile';

  const Body = (
    <div style={{ padding: isMobile ? 16 : 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Today header */}
      <Card tok={tok} padding="16px 18px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Eyebrow color={tok.muted}>Today · serving</Eyebrow>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 500, letterSpacing: '-0.01em', marginTop: 2 }}>
              {c.today}
            </div>
          </div>
          <Badge tok={tok} tone="warn">{c.nextCut}</Badge>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${tok.hairlineSoft}` }}>
          <div>
            <Eyebrow color={tok.muted} style={{ fontSize: 10 }}>Total portions</Eyebrow>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>281</div>
          </div>
          <div>
            <Eyebrow color={tok.muted} style={{ fontSize: 10 }}>Guests</Eyebrow>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>23</div>
          </div>
          <div style={{ flex: 1 }}></div>
        </div>
      </Card>

      {/* Meal cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {c.portions.map((m, i) => (
          <Card key={i} tok={tok} padding="14px 16px" style={{ opacity: m.served ? 0.65 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: m.served ? tok.posBg : tok.soft,
                color: m.served ? tok.posInk : tok.ink,
                display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0,
              }}>{['I', 'II', 'III'][i]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{m.type}</div>
                  <div style={{ fontSize: 11, color: tok.muted, fontVariantNumeric: 'tabular-nums' }}>{m.time}</div>
                </div>
                <div style={{ fontSize: 12, color: tok.muted, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  {m.users} members · {m.guests} guests
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: tok.ink,
                }}>{m.total}</div>
                <div style={{ fontSize: 10, color: tok.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {m.served ? 'served' : 'portions'}
                </div>
              </div>
              {!m.served && (
                <button style={{
                  marginLeft: 4, padding: '6px 12px', borderRadius: 8,
                  background: tok.ink, color: tok.bg, border: 'none',
                  fontFamily: 'inherit', fontWeight: 500, fontSize: 12, cursor: 'pointer',
                  flexShrink: 0,
                }}>Mark served</button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Stock callout */}
      <Card tok={tok} padding="14px 16px">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Eyebrow color={tok.muted}>Stock you may need</Eyebrow>
          <a style={{ fontSize: 12, color: tok.muted, textDecoration: 'none' }}>Update stock →</a>
        </div>
        {window.APP_DATA.admin.lowStock.map((s, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${tok.hairlineSoft}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{s.item}</div>
            <div style={{ fontSize: 13, color: tok.warnInk, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{s.qty}</div>
          </div>
        ))}
      </Card>
    </div>
  );

  if (isMobile) {
    return <MobileFrame tok={tok} title="Kitchen" subtitle="Chef · Abul Hossain" tab="home" role="user">
      {Body}
    </MobileFrame>;
  }
  return <DesktopFrame tok={tok} title="Kitchen today" subtitle={c.today} active="home" role="chef">
    {Body}
  </DesktopFrame>;
}

function ScreenNotifications({ tok, mode = 'mobile' }) {
  const d = window.APP_DATA;
  const isMobile = mode === 'mobile';
  const iconFor = { rate: 'money', cutoff: 'meals', deposit: 'download', stock: 'stock', menu: 'menu' };
  const toneFor = { rate: 'warn', cutoff: 'info', deposit: 'success', stock: 'warn', menu: 'neutral' };

  const Body = (
    <div style={{ padding: isMobile ? 16 : 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <Eyebrow color={tok.muted}>3 unread</Eyebrow>
        <GhostBtn tok={tok} size="sm">Mark all read</GhostBtn>
      </div>

      <Card tok={tok} padding="0">
        {d.notifications.map((n, i) => (
          <div key={n.id} style={{
            padding: '14px 18px',
            borderTop: i === 0 ? 'none' : `1px solid ${tok.hairlineSoft}`,
            display: 'flex', gap: 12, alignItems: 'flex-start',
            background: n.unread ? tok.bg : 'transparent',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: tok[`${toneFor[n.kind]}Bg`] || tok.soft,
              color: tok[`${toneFor[n.kind]}Ink`] || tok.muted,
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}><I name={iconFor[n.kind]} size={18} stroke={1.55} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: n.unread ? 500 : 400, lineHeight: 1.4 }}>{n.title}</div>
                <div style={{ fontSize: 11, color: tok.muted, flexShrink: 0 }}>{n.when}</div>
              </div>
              <div style={{ fontSize: 12, color: tok.muted, marginTop: 4, lineHeight: 1.5 }}>{n.body}</div>
            </div>
            {n.unread && <div style={{ width: 6, height: 6, borderRadius: 999, background: tok.accent, marginTop: 14, flexShrink: 0 }} />}
          </div>
        ))}
      </Card>
    </div>
  );

  if (isMobile) {
    return <MobileFrame tok={tok} title="Notifications" subtitle="3 unread" tab="more">
      {Body}
    </MobileFrame>;
  }
  return <DesktopFrame tok={tok} title="Notifications" subtitle="3 unread" active="profile">
    {Body}
  </DesktopFrame>;
}

Object.assign(window, { ScreenChefDashboard, ScreenNotifications });
