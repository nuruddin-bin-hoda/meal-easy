// User-facing screens: Dashboard, Meal toggle (single-sheet), Menu (week),
// My report, Profile. All embed in <MobileFrame> or <DesktopFrame>.

function ScreenUserDashboard({ tok, mode = 'mobile' }) {
  const d = window.APP_DATA;
  const isMobile = mode === 'mobile';

  const Body = (
    <div style={{ padding: isMobile ? 16 : 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Greeting + Cutoff banner */}
      <Card tok={tok} padding="16px 18px" style={{
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 4, height: 44, borderRadius: 2, background: tok.accent, flexShrink: 0,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Eyebrow color={tok.muted}>Good evening</Eyebrow>
          <div style={{ fontSize: 18, fontWeight: 500, marginTop: 2 }}>{d.user.name.split(' ')[0]}</div>
          <div style={{ fontSize: 11, color: tok.muted, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            Cutoff for tomorrow closes in <b style={{ color: tok.ink }}>{d.cutoffCountdown}</b>
          </div>
        </div>
        <PrimaryBtn tok={tok} size="sm">Plan tomorrow →</PrimaryBtn>
      </Card>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr 1fr' : 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { label: 'Balance', v: d.user.balance, sub: '47 days runway' },
          { label: 'Meals · May', v: '47', sub: 'of 54 days' },
          { label: 'Predicted', v: d.rate, sub: 'per meal' },
        ].map((k, i) => (
          <Card key={i} tok={tok} padding="12px 14px">
            <Eyebrow color={tok.muted} style={{ fontSize: 10 }}>{k.label}</Eyebrow>
            <div style={{
              fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em',
              marginTop: 3, fontVariantNumeric: 'tabular-nums',
            }}>{k.v}</div>
            <div style={{ fontSize: 11, color: tok.dim, marginTop: 1 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Tomorrow's meals — compact single sheet */}
      <Card tok={tok} padding="0" radius={12}>
        <div style={{
          padding: '14px 16px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <Eyebrow color={tok.muted}>Tomorrow</Eyebrow>
            <div style={{ fontSize: 15, fontWeight: 500, marginTop: 2 }}>Sun, May 19</div>
          </div>
          <Badge tok={tok} tone="warn" style={{ padding: '4px 10px', fontSize: 11 }}>
            Cutoff in {d.cutoffCountdown}
          </Badge>
        </div>
        {d.tomorrowMeals.map((m, i) => (
          <div key={i} style={{
            padding: '12px 16px', borderTop: `1px solid ${tok.hairlineSoft}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{m.type}</div>
                <div style={{ fontSize: 11, color: tok.muted, fontVariantNumeric: 'tabular-nums' }}>{m.time}</div>
              </div>
              <div style={{
                fontSize: 12, color: tok.muted, marginTop: 4, lineHeight: 1.4,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{m.menu.join(' · ')}</div>
            </div>
            {m.on && m.guests > 0 && (
              <Badge tok={tok} tone="neutral" style={{ fontSize: 10 }}>+{m.guests} guest</Badge>
            )}
            <Toggle tok={tok} on={m.on} disabled={m.locked} />
          </div>
        ))}
        <div style={{
          padding: '10px 16px', borderTop: `1px solid ${tok.hairlineSoft}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 12, color: tok.muted,
        }}>
          <span>2 of 3 meals · 2 guests · ৳249.60</span>
          <span style={{ color: tok.posInk, fontWeight: 500 }}>
            <I name="check" size={12} stroke={2} color={tok.posInk} /> Saved
          </span>
        </div>
      </Card>

      {/* Recent notifications (3) */}
      <Card tok={tok} padding="14px 16px 8px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Eyebrow color={tok.muted}>Recent</Eyebrow>
          <a style={{ fontSize: 12, color: tok.muted, textDecoration: 'none' }}>See all →</a>
        </div>
        {d.notifications.slice(0, 3).map((n, i) => (
          <div key={n.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
            borderTop: i === 0 ? 'none' : `1px solid ${tok.hairlineSoft}`,
          }}>
            <div style={{
              width: 4, height: 4, borderRadius: 999,
              background: n.unread ? tok.accent : tok.dim, marginTop: 8, flexShrink: 0,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: n.unread ? 500 : 400,
                color: tok.ink, lineHeight: 1.4,
              }}>{n.title}</div>
              <div style={{ fontSize: 11, color: tok.muted, marginTop: 1 }}>{n.when}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );

  if (isMobile) {
    return <MobileFrame tok={tok} title="My dashboard" subtitle="Member · B-208" tab="home">
      {Body}
    </MobileFrame>;
  }
  return <DesktopFrame tok={tok} title="My dashboard" subtitle={d.today} active="home">
    {Body}
  </DesktopFrame>;
}

function ScreenMealToggle({ tok, mode = 'mobile' }) {
  const d = window.APP_DATA;
  const isMobile = mode === 'mobile';

  const Body = (
    <div style={{ padding: isMobile ? 16 : 28 }}>
      <div style={{
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 280px',
        gap: 14,
      }}>
        <div>
          {/* Cutoff hint */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 12, color: tok.muted }}>
              <span style={{ color: tok.warnInk, fontWeight: 500 }}>{d.cutoffCountdown} left</span> · cutoffs differ per meal
            </div>
          </div>

          {/* Single composed meals sheet */}
          <Card tok={tok} padding="0" radius={14}>
            {d.tomorrowMeals.map((m, i) => (
              <div key={i} style={{
                padding: '16px 18px',
                borderTop: i === 0 ? 'none' : `1px solid ${tok.hairlineSoft}`,
                opacity: m.locked ? 0.6 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: m.on ? tok.onBg : tok.soft,
                    color: m.on ? tok.onInk : tok.muted,
                    display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 500,
                    flexShrink: 0,
                  }}>{['I', 'II', 'III'][i]}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>{m.type}</div>
                      <div style={{ fontSize: 11, color: tok.muted, fontVariantNumeric: 'tabular-nums' }}>{m.time}</div>
                    </div>
                    <div style={{ fontSize: 11, color: tok.dim, marginTop: 3 }}>
                      Closes {m.cutoff} tomorrow
                    </div>
                    <div style={{ fontSize: 12, color: tok.muted, marginTop: 7, lineHeight: 1.5 }}>
                      {m.menu.join(' · ')}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
                  }}>
                    <Toggle tok={tok} on={m.on} disabled={m.locked} />
                    {m.on && !m.locked && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button style={{
                          width: 24, height: 24, borderRadius: 6, background: tok.soft,
                          color: tok.muted, border: `1px solid ${tok.hairline}`,
                          fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1,
                        }}>−</button>
                        <div style={{
                          minWidth: 30, textAlign: 'center', fontSize: 12, fontWeight: 500,
                          fontVariantNumeric: 'tabular-nums', color: tok.ink,
                        }}>
                          <span style={{ fontSize: 10, color: tok.muted, marginRight: 3 }}>+</span>{m.guests}
                        </div>
                        <button style={{
                          width: 24, height: 24, borderRadius: 6, background: tok.soft,
                          color: tok.muted, border: `1px solid ${tok.hairline}`,
                          fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1,
                        }}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Card>

          {/* Mobile summary */}
          {isMobile && (
            <Card tok={tok} padding="16px 18px" style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 4, height: 36, borderRadius: 2, background: tok.accent, flexShrink: 0 }} />
                <div>
                  <Eyebrow color={tok.muted}>Your tomorrow</Eyebrow>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                    <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                      ৳249.60
                    </div>
                    <div style={{ fontSize: 12, color: tok.muted }}>2 meals · 2 guests</div>
                  </div>
                </div>
              </div>
              <div style={{
                marginTop: 10, paddingTop: 10, borderTop: `1px solid ${tok.hairlineSoft}`,
                display: 'flex', justifyContent: 'space-between', fontSize: 11, color: tok.muted,
              }}>
                <span>Rate ৳62.40 · running</span>
                <span style={{ color: tok.posInk, fontWeight: 500 }}>
                  <I name="check" size={11} stroke={2} color={tok.posInk} /> auto-saved
                </span>
              </div>
            </Card>
          )}
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
            <Card tok={tok} padding="18px 20px">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 4, height: 38, borderRadius: 2, background: tok.accent, flexShrink: 0 }} />
                <Eyebrow color={tok.muted}>Your tomorrow</Eyebrow>
              </div>
              <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 10, fontVariantNumeric: 'tabular-nums' }}>
                ৳249.60
              </div>
              <div style={{ fontSize: 12, color: tok.muted, marginTop: 3 }}>2 of 3 meals · 2 guests</div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${tok.hairlineSoft}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: tok.muted, marginBottom: 4 }}>
                  <span>Rate</span><span style={{ fontVariantNumeric: 'tabular-nums', color: tok.ink }}>{d.rate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: tok.muted }}>
                  <span>Balance</span><span style={{ fontVariantNumeric: 'tabular-nums', color: tok.ink }}>{d.user.balance}</span>
                </div>
              </div>
            </Card>
            <Card tok={tok} padding="14px 16px">
              <Eyebrow color={tok.muted}>Heads up</Eyebrow>
              <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                Lunch and breakfast cut off in the next 5 hours.
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return <MobileFrame tok={tok} title="Tomorrow's meals" subtitle="Sun · May 19" tab="meals">
      {Body}
    </MobileFrame>;
  }
  return <DesktopFrame tok={tok} title="Tomorrow's meals" subtitle="Sun, May 19, 2026" active="meals">
    {Body}
  </DesktopFrame>;
}

function ScreenMenu({ tok, mode = 'mobile' }) {
  const d = window.APP_DATA;
  const isMobile = mode === 'mobile';

  const Body = (
    <div style={{ padding: isMobile ? 16 : 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {d.weekMenu.map((day, i) => (
          <Card key={i} tok={tok} padding="0" radius={12} style={{
            background: day.isToday ? tok.soft : tok.surface,
            borderColor: day.isToday ? tok.ink : tok.hairline,
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${tok.hairlineSoft}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{day.day}</div>
                {day.isToday && <Badge tok={tok} tone="info" style={{ fontSize: 10 }}>Today</Badge>}
              </div>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 0,
            }}>
              {['Breakfast', 'Lunch', 'Dinner'].map((mt, idx) => (
                <div key={mt} style={{
                  padding: '12px 16px',
                  borderLeft: !isMobile && idx > 0 ? `1px solid ${tok.hairlineSoft}` : 'none',
                  borderTop: isMobile && idx > 0 ? `1px solid ${tok.hairlineSoft}` : 'none',
                }}>
                  <Eyebrow color={tok.muted} style={{ fontSize: 10 }}>{mt}</Eyebrow>
                  <div style={{
                    fontSize: 13, marginTop: 4, color: day.items[mt] === '—' ? tok.dim : tok.ink,
                    lineHeight: 1.5,
                  }}>{day.items[mt] === '—' ? 'Menu not set' : day.items[mt]}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return <MobileFrame tok={tok} title="Menu" subtitle="Week of May 18" tab="menu">
      {Body}
    </MobileFrame>;
  }
  return <DesktopFrame tok={tok} title="Menu" subtitle="Week of May 18" active="menu">
    {Body}
  </DesktopFrame>;
}

function ScreenMyReport({ tok, mode = 'mobile' }) {
  const d = window.APP_DATA;
  const r = d.report;
  const isMobile = mode === 'mobile';

  const Body = (
    <div style={{ padding: isMobile ? 16 : 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Month picker */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        <button style={{
          width: 32, height: 32, borderRadius: 8, background: tok.surface,
          border: `1px solid ${tok.hairline}`, color: tok.ink, cursor: 'pointer',
          display: 'grid', placeItems: 'center',
        }}><I name="chevron" size={14} stroke={1.6} style={{ transform: 'rotate(180deg)' }} /></button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Eyebrow color={tok.muted}>Billing month</Eyebrow>
          <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em', marginTop: 2 }}>{r.month}</div>
        </div>
        <button style={{
          width: 32, height: 32, borderRadius: 8, background: tok.surface,
          border: `1px solid ${tok.hairline}`, color: tok.ink, cursor: 'pointer',
          display: 'grid', placeItems: 'center',
        }}><I name="chevron" size={14} stroke={1.6} /></button>
      </div>

      {/* Big numbers */}
      <Card tok={tok} padding="20px 22px">
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
          <div>
            <Eyebrow color={tok.muted}>Meal rate</Eyebrow>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{r.rate}</div>
          </div>
          <div>
            <Eyebrow color={tok.muted}>Total meals</Eyebrow>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{r.totalMeals}</div>
            <div style={{ fontSize: 11, color: tok.muted, marginTop: 1 }}>incl. {r.guestMeals} guest</div>
          </div>
          <div>
            <Eyebrow color={tok.muted}>Total bill</Eyebrow>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{r.totalBill}</div>
          </div>
          <div>
            <Eyebrow color={tok.muted}>Closing balance</Eyebrow>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4, fontVariantNumeric: 'tabular-nums', color: tok.posInk }}>{r.closing}</div>
          </div>
        </div>
      </Card>

      {/* Attendance + Cost breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
        <Card tok={tok} padding="16px 18px">
          <Eyebrow color={tok.muted}>Attendance</Eyebrow>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(r.attendance).map(([type, count], i) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 13, width: 80 }}>{type}</div>
                <div style={{ flex: 1, height: 6, background: tok.soft, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(count / 31) * 100}%`, height: '100%',
                    background: tok.ink, borderRadius: 999,
                  }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums', width: 36, textAlign: 'right' }}>{count}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card tok={tok} padding="16px 18px">
          <Eyebrow color={tok.muted}>Cost breakdown</Eyebrow>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Meal cost (71 × ৳58.20)', value: r.mealCost },
              { label: 'Other-cost share',          value: r.otherShare },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, color: tok.muted }}>{row.label}</span>
                <span style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${tok.hairlineSoft}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Total bill</span>
              <span style={{ fontSize: 16, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{r.totalBill}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Deposits */}
      <Card tok={tok} padding="16px 18px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Eyebrow color={tok.muted}>April deposits</Eyebrow>
          <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>৳5,500 total</span>
        </div>
        {r.deposits.map((dep, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${tok.hairlineSoft}`,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{dep.date}</div>
              <div style={{ fontSize: 11, color: tok.muted, marginTop: 1 }}>by {dep.by}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: tok.posInk }}>+{dep.amount}</div>
          </div>
        ))}
      </Card>

      <PrimaryBtn tok={tok} size="lg" icon={<I name="download" size={14} stroke={1.7} color={tok.btnInk} />} style={{ width: '100%', justifyContent: 'center' }}>
        Download PDF report
      </PrimaryBtn>
    </div>
  );

  if (isMobile) {
    return <MobileFrame tok={tok} title="My report" subtitle="April 2026" tab="report">
      {Body}
    </MobileFrame>;
  }
  return <DesktopFrame tok={tok} title="My report" subtitle="April 2026" active="report">
    {Body}
  </DesktopFrame>;
}

function ScreenProfile({ tok, mode = 'mobile' }) {
  const d = window.APP_DATA;
  const isMobile = mode === 'mobile';

  const rows = [
    { label: 'Phone', value: d.user.phone },
    { label: 'Room',  value: d.user.room },
    { label: 'Member since', value: d.user.joined },
    { label: 'Language',  value: 'English' },
    { label: 'Theme', value: 'Auto' },
    { label: 'Push notifications', value: 'On' },
  ];

  const Body = (
    <div style={{ padding: isMobile ? 16 : 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card tok={tok} padding="18px 20px" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar tok={tok} name={d.user.name} size={56} accent />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{d.user.name}</div>
          <div style={{ fontSize: 12, color: tok.muted, marginTop: 2 }}>Member · {d.user.room}</div>
          <div style={{ marginTop: 8 }}>
            <Badge tok={tok} tone="success">Balance {d.user.balance}</Badge>
          </div>
        </div>
        <GhostBtn tok={tok} size="sm">Edit</GhostBtn>
      </Card>

      <Card tok={tok} padding="0">
        {rows.map((r, i) => (
          <div key={i} style={{
            padding: '14px 18px',
            borderTop: i === 0 ? 'none' : `1px solid ${tok.hairlineSoft}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          }}>
            <div style={{ fontSize: 13, color: tok.muted }}>{r.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{r.value}</div>
              <I name="chevron" size={14} stroke={1.6} color={tok.dim} />
            </div>
          </div>
        ))}
      </Card>

      <Card tok={tok} padding="14px 18px" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        color: tok.dangerInk,
      }}>
        <I name="logout" size={16} stroke={1.7} color={tok.dangerInk} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>Sign out</div>
      </Card>
    </div>
  );

  if (isMobile) {
    return <MobileFrame tok={tok} title="Profile" subtitle="Settings & account" tab="more">
      {Body}
    </MobileFrame>;
  }
  return <DesktopFrame tok={tok} title="Profile" subtitle="Settings & account" active="profile">
    {Body}
  </DesktopFrame>;
}

Object.assign(window, { ScreenUserDashboard, ScreenMealToggle, ScreenMenu, ScreenMyReport, ScreenProfile });
