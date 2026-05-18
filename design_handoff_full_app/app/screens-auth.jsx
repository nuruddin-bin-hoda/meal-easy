// Auth screens — Login + Register. Standalone (no app shell).

function ScreenLogin({ tok, mode = 'mobile' }) {
  const isMobile = mode === 'mobile';
  return (
    <div style={{
      width: '100%', height: '100%', background: tok.bg, color: tok.ink,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? 16 : 32,
    }}>
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <svg width="56" height="56" viewBox="0 0 100 100" style={{
            display: 'inline-block', borderRadius: 14, background: tok.soft, marginBottom: 14,
          }}>
            <circle cx="50" cy="52" r="34" fill="#7F9E6E"/>
            <circle cx="50" cy="52" r="29" fill={tok.surface}/>
            <circle cx="55" cy="55" r="17" fill="#5A7140"/>
            <circle cx="38" cy="42" r="3.5" fill={tok.ink}/>
          </svg>
          <div style={{
            fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em',
            fontFamily: '"DM Sans", system-ui, sans-serif',
          }}>
            Meal<span style={{ color: '#7F9E6E', fontStyle: 'italic', fontWeight: 500, marginLeft: 4 }}>Easy</span>
          </div>
          <div style={{ fontSize: 13, color: tok.muted, marginTop: 4 }}>Sign in to your mess account</div>
        </div>

        <Card tok={tok} padding="20px 22px" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input tok={tok} label="Phone number" value="01779-456 218" adornment="+88" />
          <Input tok={tok} label="Password" value="••••••••" type="password" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
            <a style={{ fontSize: 12, color: tok.muted, textDecoration: 'none' }}>Forgot password?</a>
          </div>
          <PrimaryBtn tok={tok} size="lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            Sign in
          </PrimaryBtn>
        </Card>

        <div style={{ textAlign: 'center', fontSize: 13, color: tok.muted }}>
          No account?{' '}
          <a style={{ color: tok.ink, fontWeight: 500, textDecoration: 'none' }}>Request access →</a>
        </div>

        <div style={{
          marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 11, color: tok.dim,
        }}>
          <span>EN</span><span>·</span><span>বাংলা</span>
        </div>
      </div>
    </div>
  );
}

function ScreenRegister({ tok, mode = 'mobile' }) {
  const isMobile = mode === 'mobile';
  return (
    <div style={{
      width: '100%', height: '100%', background: tok.bg, color: tok.ink,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: isMobile ? '24px 16px' : 32, overflow: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'transparent', border: 'none', color: tok.muted,
            fontSize: 13, padding: 0, marginBottom: 10, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <I name="chevron" size={14} stroke={1.6} color={tok.muted} style={{ transform: 'rotate(180deg)' }} /> Back to sign in
          </button>
          <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}>Request access</div>
          <div style={{ fontSize: 13, color: tok.muted, marginTop: 4, lineHeight: 1.5 }}>
            Your registration will be reviewed by the mess admin. You'll get a push notification once approved.
          </div>
        </div>

        <Card tok={tok} padding="20px 22px" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input tok={tok} label="Full name" value="" placeholder="Nuruddin Anam" />
          <Input tok={tok} label="Phone number" value="" placeholder="01XXX-XXX XXX" adornment="+88" />
          <Input tok={tok} label="Room number" value="" placeholder="B-208" />
          <Input tok={tok} label="Password" value="" type="password" placeholder="Min 6 characters" />
          <Input tok={tok} label="Confirm password" value="" type="password" />

          {/* Photo uploader */}
          <div>
            <div style={{ fontSize: 12, color: tok.muted, fontWeight: 500, marginBottom: 6 }}>
              Photo · optional
            </div>
            <div style={{
              border: `1px dashed ${tok.hairline}`, borderRadius: 8, padding: '16px',
              display: 'flex', alignItems: 'center', gap: 12, background: tok.bg,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 999, background: tok.soft,
                color: tok.muted, display: 'grid', placeItems: 'center',
              }}><I name="users" size={20} stroke={1.5} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Drop or tap to upload</div>
                <div style={{ fontSize: 11, color: tok.muted, marginTop: 2 }}>JPEG, PNG, WebP · max 2 MB</div>
              </div>
            </div>
          </div>

          <PrimaryBtn tok={tok} size="lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            Submit request
          </PrimaryBtn>
        </Card>

        <div style={{
          padding: '10px 14px', background: tok.infoBg, color: tok.infoInk,
          fontSize: 11, borderRadius: 8, lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 500, marginBottom: 2 }}>What happens next</div>
          The admin reviews your phone and room number, then approves you. Average wait time: under 24 hours.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenLogin, ScreenRegister });
