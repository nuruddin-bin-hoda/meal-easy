// App shell — Mobile (top bar + bottom tabs) and Desktop (left sidebar +
// top bar). Each screen wraps its content in <MobileFrame> or <DesktopFrame>.
// Frames render the chrome and reserve content space; screen contents flow
// into the children slot.

function MobileFrame({ tok, children, title, subtitle, tab = 'home', role = 'user', bell = 3, leading, action }) {
  const TABS_USER = [
    { id: 'home',   label: 'Home',   icon: 'home' },
    { id: 'meals',  label: 'Meals',  icon: 'meals' },
    { id: 'menu',   label: 'Menu',   icon: 'menu' },
    { id: 'report', label: 'Report', icon: 'report' },
    { id: 'more',   label: 'More',   icon: 'settings' },
  ];
  const TABS_ADMIN = [
    { id: 'home',   label: 'Home',   icon: 'home' },
    { id: 'meals',  label: 'Meals',  icon: 'meals' },
    { id: 'stock',  label: 'Stock',  icon: 'stock' },
    { id: 'money',  label: 'Money',  icon: 'money' },
    { id: 'more',   label: 'More',   icon: 'settings' },
  ];
  const tabs = role === 'admin' ? TABS_ADMIN : TABS_USER;

  return (
    <div style={{
      width: '100%', height: '100%', background: tok.bg, color: tok.ink,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        flexShrink: 0,
        padding: '12px 16px 10px',
        background: tok.bg, borderBottom: `1px solid ${tok.hairlineSoft}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {leading}
        <div style={{ flex: 1, minWidth: 0 }}>
          {subtitle && (
            <div style={{
              fontSize: 10, color: tok.muted, textTransform: 'uppercase',
              letterSpacing: '0.06em', fontWeight: 500,
            }}>{subtitle}</div>
          )}
          <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            {title}
          </div>
        </div>
        {action || (
          <>
            <button style={{
              width: 36, height: 36, borderRadius: 999, border: `1px solid ${tok.hairline}`,
              background: tok.surface, color: tok.ink, position: 'relative',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}>
              <I name="bell" size={17} stroke={1.6} />
              {bell > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16,
                  borderRadius: 999, background: tok.accent, color: tok.accentInk,
                  fontSize: 10, fontWeight: 600, display: 'grid', placeItems: 'center',
                  padding: '0 4px', border: `2px solid ${tok.bg}`, fontFamily: 'inherit',
                }}>{bell}</span>
              )}
            </button>
            <Avatar tok={tok} name="Nuruddin Anam" size={36} />
          </>
        )}
      </div>

      {/* Content (scrollable design surface) */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>

      {/* Bottom tab bar */}
      <div style={{
        flexShrink: 0, display: 'flex',
        borderTop: `1px solid ${tok.hairlineSoft}`, background: tok.surface,
        padding: '8px 4px 14px',
      }}>
        {tabs.map((tb) => (
          <button key={tb.id} style={{
            flex: 1, background: 'transparent', border: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '6px 0', cursor: 'pointer',
            color: tb.id === tab ? tok.ink : tok.muted,
            fontFamily: 'inherit',
          }}>
            <I name={tb.icon} size={20} stroke={tb.id === tab ? 1.9 : 1.5} />
            <span style={{
              fontSize: 10, fontWeight: tb.id === tab ? 500 : 400,
              letterSpacing: '0.02em',
            }}>{tb.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DesktopFrame({ tok, children, title, subtitle, active = 'home', role = 'user', bell = 3, action }) {
  const NAV_USER = [
    { id: 'home',     label: 'Dashboard',      icon: 'home' },
    { id: 'meals',    label: 'Meals',          icon: 'meals' },
    { id: 'menu',     label: 'Menu',           icon: 'menu' },
    { id: 'report',   label: 'My report',      icon: 'report' },
    { id: 'profile',  label: 'Profile',        icon: 'users' },
  ];
  const NAV_ADMIN = [
    { id: 'home',         label: 'Dashboard',      icon: 'home' },
    { id: 'meals',        label: 'Meal totals',    icon: 'meals' },
    { id: 'menu',         label: 'Set menu',       icon: 'menu' },
    { id: 'purchases',    label: 'Purchases',      icon: 'money' },
    { id: 'costs',        label: 'Other costs',    icon: 'money' },
    { id: 'deposits',     label: 'Deposits',       icon: 'download' },
    { id: 'billing',      label: 'Billing',        icon: 'report' },
    { id: 'stock',        label: 'Stock',          icon: 'stock' },
    { id: 'chefs',        label: 'Chefs',          icon: 'chef' },
    { id: 'users',        label: 'Members',        icon: 'users' },
    { id: 'audit',        label: 'Audit logs',     icon: 'lock' },
  ];
  const NAV_CHEF = [
    { id: 'home',     label: 'Today',          icon: 'home' },
    { id: 'stock',    label: 'Stock',          icon: 'stock' },
    { id: 'profile',  label: 'Profile',        icon: 'users' },
  ];
  const nav = role === 'admin' ? NAV_ADMIN : role === 'chef' ? NAV_CHEF : NAV_USER;

  return (
    <div style={{
      width: '100%', height: '100%', background: tok.bg, color: tok.ink,
      display: 'grid', gridTemplateColumns: '240px 1fr', overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <div style={{
        background: tok.surface, borderRight: `1px solid ${tok.hairline}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 18px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="30" height="30" viewBox="0 0 100 100" style={{ display: 'block', borderRadius: 7, background: tok.soft }}>
            <circle cx="50" cy="52" r="34" fill="#7F9E6E"/>
            <circle cx="50" cy="52" r="29" fill={tok.surface}/>
            <circle cx="55" cy="55" r="17" fill="#5A7140"/>
            <circle cx="38" cy="42" r="3.5" fill={tok.ink}/>
          </svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>Meal Easy</div>
            <div style={{ fontSize: 10, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {role === 'admin' ? 'Admin' : role === 'chef' ? 'Kitchen' : 'Member'}
            </div>
          </div>
        </div>
        <div style={{ padding: '0 10px', flex: 1, overflow: 'auto' }}>
          {nav.map((n) => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              background: n.id === active ? tok.soft : 'transparent',
              color: n.id === active ? tok.ink : tok.muted,
              fontSize: 13, fontWeight: n.id === active ? 500 : 400,
              marginBottom: 2, cursor: 'pointer',
            }}>
              <I name={n.icon} size={17} stroke={1.55} />
              <span>{n.label}</span>
            </div>
          ))}
        </div>
        <div style={{
          padding: '14px 14px', borderTop: `1px solid ${tok.hairlineSoft}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Avatar tok={tok} name="Nuruddin Anam" size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Nuruddin A.</div>
            <div style={{ fontSize: 11, color: tok.muted }}>
              {role === 'admin' ? 'Superadmin' : role === 'chef' ? 'Chef' : 'B-208'}
            </div>
          </div>
          <button style={{
            width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent',
            color: tok.muted, cursor: 'pointer', display: 'grid', placeItems: 'center',
          }}><I name="logout" size={14} stroke={1.55} /></button>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: `1px solid ${tok.hairline}`, background: tok.surface,
        }}>
          <div style={{ flex: 1 }}>
            {subtitle && (
              <div style={{
                fontSize: 11, color: tok.muted, textTransform: 'uppercase',
                letterSpacing: '0.06em', fontWeight: 500,
              }}>{subtitle}</div>
            )}
            <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>
              {title}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
              background: tok.bg, border: `1px solid ${tok.hairline}`, borderRadius: 8,
              color: tok.muted, fontSize: 13, width: 260,
            }}>
              <I name="search" size={14} stroke={1.55} />
              <span>Search members, items…</span>
            </div>
            <button style={{
              padding: '6px 10px', borderRadius: 8, background: 'transparent',
              border: `1px solid ${tok.hairline}`, color: tok.ink, fontSize: 12,
              fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>EN · বাংলা</button>
            <button style={{
              width: 34, height: 34, borderRadius: 8, border: `1px solid ${tok.hairline}`,
              background: 'transparent', color: tok.ink, position: 'relative',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}>
              <I name="bell" size={15} stroke={1.55} />
              {bell > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16,
                  borderRadius: 999, background: tok.accent, color: tok.accentInk,
                  fontSize: 10, fontWeight: 600, display: 'grid', placeItems: 'center',
                  padding: '0 4px', border: `2px solid ${tok.surface}`, fontFamily: 'inherit',
                }}>{bell}</span>
              )}
            </button>
            {action}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', background: tok.bg }}>
          {children}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MobileFrame, DesktopFrame });
