import { useState } from 'react'
import { ArrowRight, KeyRound, RefreshCcw, ShieldCheck } from 'lucide-react'
import { useLab } from '../../store/LabContext'
import { Button, Flow, Insight, Status } from '../ui'
import { CodeBlock, DemoFrame, Result } from './DemoPrimitives'

type TokenScenario = 'valid' | 'expired' | 'audience' | 'signature' | 'scope'

const header = { alg: 'RS256', typ: 'JWT', kid: 'boo-key-01' }
const baseClaims = { sub: 'alex-morgan', role: 'manager', scope: 'expenses:read', iss: 'https://identity.boo.example', aud: 'expense-api' }
const signature = 'illustrative-signature-only'
const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
const refreshLabel = (generation: number) => generation < 26 ? String.fromCharCode(65 + generation) : `R${generation + 1}`

export function JwtDemo() {
  const lab = useLab()
  const [issued, setIssued] = useState(false)
  const [inspect, setInspect] = useState(false)
  const [tampered, setTampered] = useState(false)
  const [scenario, setScenario] = useState<TokenScenario>('valid')
  const [validated, setValidated] = useState(false)
  const [accessExpired, setAccessExpired] = useState(false)
  const [refreshGeneration, setRefreshGeneration] = useState(0)
  const [familyRevoked, setFamilyRevoked] = useState(false)
  const [expiresAt, setExpiresAt] = useState(() => Math.floor(Date.now() / 1000) + 300)

  const claims = { ...baseClaims, role: tampered ? 'admin' : 'manager', exp: expiresAt }
  const signatureOk = !tampered && scenario !== 'signature'
  const issuerOk = true
  const audienceOk = scenario !== 'audience'
  const expiryOk = scenario !== 'expired' && !accessExpired
  const scopeOk = scenario !== 'scope'
  const trusted = signatureOk && issuerOk && audienceOk && expiryOk
  const allowed = trusted && scopeOk
  const status = !trusted ? 401 : scopeOk ? 200 : 403
  const currentRefresh = refreshLabel(refreshGeneration)
  const previousRefresh = refreshGeneration > 0 ? refreshLabel(refreshGeneration - 1) : null

  function issue() {
    setIssued(true); setInspect(false); setTampered(false); setScenario('valid'); setValidated(false)
    setAccessExpired(false); setRefreshGeneration(0); setFamilyRevoked(false)
    setExpiresAt(Math.floor(Date.now() / 1000) + 300)
    lab.complete('jwt')
    lab.log({ type: 'ACCESS_TOKEN_ISSUED', application: 'Boo Identity', result: 'success', method: 'JWT simulation', metadata: { audience: 'expense-api', scope: 'expenses:read', signing: 'illustrative only' } })
  }

  function validate() {
    setValidated(true)
    lab.log({ type: allowed ? 'TOKEN_ACCEPTED' : 'TOKEN_REJECTED', application: 'Expense API', result: allowed ? 'success' : 'denied', method: 'JWT validation simulation', metadata: { status, signatureOk, audienceOk, expiryOk, scopeOk, tampered } })
  }

  function expireAccess() {
    setAccessExpired(true)
    setValidated(false)
    lab.log({ type: 'ACCESS_TOKEN_EXPIRED', application: 'Expense API', result: 'info', method: 'lifecycle simulation', metadata: { accessToken: refreshGeneration + 1 } })
  }

  function rotateRefresh() {
    if (!accessExpired || familyRevoked) return
    const nextGeneration = refreshGeneration + 1
    setRefreshGeneration(nextGeneration); setAccessExpired(false); setScenario('valid'); setTampered(false)
    setExpiresAt(Math.floor(Date.now() / 1000) + 300)
    setValidated(false)
    lab.log({ type: 'TOKEN_REFRESHED', application: 'Boo Identity', result: 'success', method: 'refresh-token rotation simulation', metadata: { consumed: `refresh ${currentRefresh}`, issued: `refresh ${refreshLabel(nextGeneration)}`, accessToken: nextGeneration + 1 } })
  }

  function reuseOldRefresh() {
    if (!previousRefresh || familyRevoked) return
    setFamilyRevoked(true)
    lab.log({ type: 'REFRESH_REUSE_DETECTED', application: 'Boo Identity', result: 'denied', method: 'refresh-token rotation simulation', metadata: { reused: `refresh ${previousRefresh}`, action: 'refresh family revoked' } })
  }

  const check = (label: string, pass: boolean | null) => <li key={label}><span className={pass === null ? 'jwt-check-pending' : pass ? 'jwt-check-pass' : 'jwt-check-fail'}>{pass === null ? '—' : pass ? '✓' : '✕'}</span><span>{label}</span></li>

  return <div className="demo-stack">
    <DemoFrame title="Boo Identity / Access token" subtitle="Issue, inspect, alter, and validate a simulated JWT." badge="04 / API access">
      <div className="action-row"><Button onClick={issue}>Issue access token <ArrowRight size={15} /></Button>{issued && <Button variant="secondary" onClick={() => setInspect(value => !value)}>{inspect ? 'Hide token details' : 'Inspect token'}</Button>}</div>
      {!issued && <Insight label="Try this">Issue a token, inspect its three parts, then change the role and ask the API to validate it.</Insight>}
      {issued && <>
        <div className="jwt-legend"><span><i className="jwt-header-swatch" /> Header</span><span><i className="jwt-payload-swatch" /> Payload</span><span><i className="jwt-signature-swatch" /> Signature</span></div>
        <div className="code-block jwt-encoded"><div className="code-label">Three dot-separated segments · illustrative signature</div><pre><span className="jwt-header">{encode(header)}</span><span className="jwt-dot">.</span><span className="jwt-payload">{encode(claims)}</span><span className="jwt-dot">.</span><span className="jwt-signature">{signature}</span></pre></div>
        {inspect && <div className="jwt-parts">
          <div><span>01 · HEADER</span><CodeBlock>{JSON.stringify(header, null, 2)}</CodeBlock><p>Names the algorithm and the key ID the API uses to find the issuer’s public key.</p></div>
          <div><span>02 · PAYLOAD</span><CodeBlock>{JSON.stringify(claims, null, 2)}</CodeBlock><p>Readable claims. The exp value is a Unix timestamp in seconds. Base64url encoding does not conceal these contents.</p></div>
          <div><span>03 · SIGNATURE</span><div className="signature-box">sign(private key, encoded header + “.” + encoded payload)<small>This lab displays a placeholder; no cryptographic signature is generated.</small></div><p>The API verifies these exact encoded bytes with the issuer’s public key. Changing either part breaks verification.</p></div>
        </div>}
        <div className="jwt-signing-input"><strong>What is signed?</strong><span><em>Header</em> + dot + <em>Payload</em> → signing input → <em>Signature</em></span><p>The API checks the signature first, then the issuer, audience, expiry, and required scope. Decoding the payload alone proves nothing.</p></div>
        <div className="claim-switch"><code>role: {claims.role}</code><button onClick={() => { setTampered(value => !value); setValidated(false) }}>{tampered ? 'Restore original claim' : 'Modify role to admin'}</button></div>
        {tampered && <Insight label="Why this fails" tone="amber">The role changed, but the signature stayed the same. The API must reject the modified token before trusting its claims.</Insight>}
        <div className="divider" />
        <div className="mini-heading">Ask the API to validate</div>
        <div className="scenario-row" role="group" aria-label="Validation scenario">{([
          ['valid', 'Valid token'], ['expired', 'Expired'], ['audience', 'Wrong audience'], ['signature', 'Bad signature'], ['scope', 'Missing scope'],
        ] as [TokenScenario, string][]).map(([value, label]) => <button key={value} className={`scenario-chip ${scenario === value ? 'selected' : ''}`} onClick={() => { setScenario(value); setValidated(false) }}>{label}</button>)}</div>
        <Button variant="secondary" onClick={validate}>Validate at Expense API <ShieldCheck size={15} /></Button>
        {validated && <><ul className="jwt-checklist">{[
          check('Signature matches the unchanged header and payload', signatureOk),
          check('Issuer is trusted by this API', signatureOk ? issuerOk : null),
          check('Audience is expense-api', signatureOk ? audienceOk : null),
          check('Access token has not expired', signatureOk ? expiryOk : null),
          check('Token has expenses:read scope', trusted ? scopeOk : null),
        ]}</ul><Result success={allowed} title={allowed ? 'Request allowed' : status === 401 ? 'Token rejected' : 'Permission denied'} code={status === 200 ? '200 OK' : status === 401 ? '401 Unauthorized' : '403 Forbidden'}>{status === 401 ? 'The API cannot trust this token. It stops before authorization.' : status === 403 ? 'The token is valid, but lacks the permission needed for this request.' : 'The token is trusted and carries the required scope.'}</Result></>}
      </>}
    </DemoFrame>
    <DemoFrame title="Access + refresh token cycle" subtitle="Each refresh token is used once; its replacement can refresh again later." badge="Token lifecycle">
      <div className="token-lifecycle"><div><strong>Access token {refreshGeneration + 1}</strong><Status tone={accessExpired ? 'bad' : 'good'}>{accessExpired ? 'Expired' : 'API requests'}</Status><p>Sent to the Expense API. Short lifetime limits how long a stolen token works.</p></div><ArrowRight size={18} /><div><strong>Refresh token {currentRefresh}</strong><Status tone={familyRevoked ? 'bad' : 'neutral'}>{familyRevoked ? 'Family revoked' : 'Boo Identity only'}</Status><p>Sent to the authorization server for a replacement. Never sent to the API.</p></div></div>
      <div className="action-row"><Button variant="secondary" onClick={expireAccess} disabled={!issued || accessExpired}>Expire access token</Button><Button onClick={rotateRefresh} disabled={!issued || !accessExpired || familyRevoked}>Use refresh token {currentRefresh} <RefreshCcw size={15} /></Button>{previousRefresh && <Button variant="secondary" onClick={reuseOldRefresh} disabled={familyRevoked}>Replay old token {previousRefresh}</Button>}</div>
      {!issued && <p className="fine-print">Issue an access token above to begin the cycle.</p>}
      {accessExpired && !familyRevoked && <div className="token-expired-result"><Result success={false} title="Access token no longer works" code="401 Unauthorized">This demo advances the clock past the token’s expiry. The client uses its refresh token at Boo Identity to request a replacement.</Result></div>}
      {previousRefresh && !familyRevoked && !accessExpired && <div className="token-refresh-result"><Result success title="Fresh access token issued">Boo Identity consumed refresh token {previousRefresh} and issued access token {refreshGeneration + 1} plus refresh token {currentRefresh}. Token {previousRefresh} is now invalid. You can repeat the cycle with token {currentRefresh}.</Result></div>}
      {familyRevoked && <div className="token-reuse-result"><Result success={false} title="Old refresh token reused">Reuse can signal theft. Boo Identity revokes this refresh-token family, so token {currentRefresh} cannot refresh again.</Result></div>}
      <Insight label="Practical boundary">Refresh tokens need stronger storage and rotation because they can mint new access tokens. Revoking a refresh-token family does not automatically cancel an already-issued access token at an offline-validating API; its short expiry or another revocation mechanism must handle that.</Insight>
    </DemoFrame>
  </div>
}

const oauthSteps = [
  { title: 'Request access', detail: 'Expense Portal redirects Alex to Boo Identity with client ID, registered redirect URI, requested scope, state, and PKCE challenge.' },
  { title: 'Approve permission', detail: 'Boo Identity authenticates Alex and asks for consent to the requested API access.' },
  { title: 'Return a code', detail: 'Boo Identity redirects the browser back with a short-lived authorization code and the original state value.' },
  { title: 'Exchange the code', detail: 'Expense Portal sends the code and PKCE verifier to Boo Identity. The verifier must match the earlier challenge.' },
  { title: 'Call the API', detail: 'Expense Portal sends the scoped access token to Expense API, not Alex’s password.' },
]

export function OAuthDemo() {
  const lab = useLab()
  const [step, setStep] = useState(-1)
  function advance() { const next = Math.min(step + 1, oauthSteps.length - 1); setStep(next); if (next === oauthSteps.length - 1) { lab.complete('oauth'); lab.log({ type: 'OAUTH_ACCESS_GRANTED', application: 'Expense Portal', result: 'success', method: 'authorization code + PKCE', metadata: { scope: 'expenses:read', resource: 'Expense API' } }) } }
  return <div className="demo-stack"><DemoFrame title="Expense Portal / OAuth authorization" subtitle="Follow Alex’s delegated API-access request." badge="05 / Delegation"><div className="actor-grid"><div><span className="actor-icon">01</span><strong>Alex</strong><small>Resource owner</small></div><div><span className="actor-icon">02</span><strong>Expense Portal</strong><small>Client</small></div><div><span className="actor-icon">03</span><strong>Boo Identity</strong><small>Authorization server</small></div><div><span className="actor-icon">04</span><strong>Expense API</strong><small>Resource server</small></div></div><div className="oauth-flow"><Flow steps={oauthSteps.map(item => item.title)} active={step} direction="horizontal" /></div>{step >= 0 && <div className="step-detail"><div className="step-count">STEP {String(step + 1).padStart(2, '0')} / 05</div><h3>{oauthSteps[step].title}</h3><p>{oauthSteps[step].detail}</p></div>}<div className="action-row"><Button onClick={advance} disabled={step === oauthSteps.length - 1}>{step < 0 ? 'Start authorization' : step === oauthSteps.length - 1 ? 'Access granted' : 'Continue flow'} <ArrowRight size={15} /></Button><Button variant="ghost" onClick={() => setStep(-1)}>Replay</Button></div>{step === oauthSteps.length - 1 && <Result success title="Expense Portal can call Expense API">The access token is limited to expenses:read. Alex’s password was never given to Expense Portal.</Result>}</DemoFrame><Insight label="OAuth’s job">OAuth delegates access to a resource. OpenID Connect adds a standard way for the client to learn who authenticated.</Insight></div>
}

const apps = ['Expense Portal', 'HR Portal', 'Admin Console']

export function OidcDemo() {
  const lab = useLab()
  const [lastOpened, setLastOpened] = useState<{ app: string, mode: 'fresh' | 'sso' } | null>(null)
  return <div className="demo-stack"><div className="two-col-cards"><div className="mini-card"><KeyRound size={20} /><h3>Access token</h3><p>Presented to an API to request a resource. Its audience is the API.</p></div><div className="mini-card accent-card"><ShieldCheck size={20} /><h3>ID token</h3><p>Presented to the client application as an identity assertion. The client validates its signature, issuer, audience, expiry, and nonce.</p></div></div><DemoFrame title="Boo Identity / Single sign-on" subtitle="Open several apps and watch Boo Identity’s session get reused." badge="06 / OIDC + SSO"><div className="app-cards">{apps.map((app, index) => <button key={app} className={`app-card ${lab.signedInApps.includes(app) ? 'app-signed-in' : ''}`} onClick={() => setLastOpened({ app, mode: lab.openApp(app) })}><span className="app-icon">{['E', 'H', 'A'][index]}</span><strong>{app}</strong><small>{lab.signedInApps.includes(app) ? 'Signed in · open again' : 'Open application'}</small></button>)}</div>{lastOpened && <Result success title={`${lastOpened.app} opened`}>{lastOpened.mode === 'fresh' ? 'Boo Identity authenticated Alex and established an IdP session.' : 'Boo Identity reused Alex’s existing IdP session, so no new credential prompt was needed.'} The app still validates its own ID token and establishes its own session.</Result>}</DemoFrame><Insight label="What SSO reuses">The shared IdP session helps later apps sign in. Each app receives a token meant for itself; one app must not treat another app’s ID token as its own.</Insight></div>
}
