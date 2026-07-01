import { css } from '../css';

// Cosmetic business-intelligence view: static figures + SVG charts (no backend),
// ported 1:1 from the original template. Same as the dc-runtime version.
export function AnalyticsView() {
  return (
    <div style={css('flex:1;overflow-y:auto;padding:26px 28px 40px')}>
      <div style={css('max-width:1240px;margin:0 auto;display:flex;flex-direction:column;gap:18px')}>

        <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap')}>
          <div>
            <h1 style={css('font-size:24px;font-weight:800;color:var(--ink);letter-spacing:-.025em;line-height:1.1')}>Business Intelligence</h1>
            <p style={css('font-size:13.5px;color:var(--muted);margin-top:5px;font-weight:500')}>Deep-dive performance metrics for Terminal 01.</p>
          </div>
          <div style={css('display:flex;gap:2px;background:var(--hover);padding:3px;border-radius:9px')}>
            <button className="zbtn" style={css('border:none;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;padding:6px 14px;border-radius:7px;background:var(--card);color:var(--ink);box-shadow:var(--shadow-sm)')}>Today</button>
            <button className="zbtn" style={css('border:none;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;padding:6px 14px;border-radius:7px;background:transparent;color:var(--muted)')}>7 Days</button>
            <button className="zbtn" style={css('border:none;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;padding:6px 14px;border-radius:7px;background:transparent;color:var(--muted)')}>30 Days</button>
          </div>
        </div>

        <section style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:16px')}>
          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad)')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}><span style={css('font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)')}>Total Revenue · 7d</span><span className="ms" style={css('font-size:20px;color:var(--accent)')}>trending_up</span></div>
            <div style={css('font-size:30px;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1;margin-top:14px')}>$42,850</div>
            <div style={css('display:inline-flex;align-items:center;gap:4px;margin-top:12px;font-size:11.5px;font-weight:700;color:var(--pos)')}><span className="ms" style={css('font-size:15px')}>arrow_upward</span>12.5%<span style={css('color:var(--faint);font-weight:500')}>vs last week</span></div>
          </div>
          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad)')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}><span style={css('font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)')}>Avg Order Value</span><span className="ms" style={css('font-size:20px;color:var(--muted)')}>receipt_long</span></div>
            <div style={css('font-size:30px;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1;margin-top:14px')}>$85.20</div>
            <div style={css('display:inline-flex;align-items:center;gap:4px;margin-top:12px;font-size:11.5px;font-weight:700;color:var(--muted)')}><span className="ms" style={css('font-size:15px')}>remove</span>0.0%<span style={css('color:var(--faint);font-weight:500')}>vs last week</span></div>
          </div>
          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad)')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}><span style={css('font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)')}>Total Orders</span><span className="ms" style={css('font-size:20px;color:var(--muted)')}>shopping_bag</span></div>
            <div style={css('font-size:30px;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1;margin-top:14px')}>503</div>
            <div style={css('display:inline-flex;align-items:center;gap:4px;margin-top:12px;font-size:11.5px;font-weight:700;color:var(--pos)')}><span className="ms" style={css('font-size:15px')}>arrow_upward</span>8.2%<span style={css('color:var(--faint);font-weight:500')}>vs last week</span></div>
          </div>
        </section>

        <section style={css('display:grid;grid-template-columns:1.62fr 1fr;gap:16px')}>
          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad);display:flex;flex-direction:column')}>
            <div style={css('display:flex;align-items:flex-start;justify-content:space-between')}>
              <div><div style={css('font-size:14.5px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>Sales Trend</div><div style={css('font-size:12px;color:var(--muted);margin-top:3px;font-weight:500')}>Daily revenue · last 7 days</div></div>
              <div style={css('text-align:right')}><div style={css('font-size:20px;font-weight:800;color:var(--ink);letter-spacing:-.02em')}>$8,900</div><div style={css('font-size:11px;color:var(--pos);font-weight:700')}>Peak · Saturday</div></div>
            </div>
            <div style={css('position:relative;margin-top:16px;height:220px')}>
              <svg viewBox="0 0 720 260" width="100%" height="100%" preserveAspectRatio="none" style={css('display:block;overflow:visible')}>
                <defs><linearGradient id="zt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
                <line x1="0" y1="30" x2="720" y2="30" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 5" />
                <line x1="0" y1="92" x2="720" y2="92" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 5" />
                <line x1="0" y1="154" x2="720" y2="154" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 5" />
                <line x1="0" y1="216" x2="720" y2="216" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 5" />
                <path d="M0,137 C60,127 60,117 120,117 C180,117 180,123 240,123 C300,123 300,92 360,92 C420,92 420,63 480,63 C540,63 540,32 600,32 C660,32 660,93 720,93 L720,260 L0,260 Z" fill="url(#zt)" />
                <path d="M0,137 C60,127 60,117 120,117 C180,117 180,123 240,123 C300,123 300,92 360,92 C420,92 420,63 480,63 C540,63 540,32 600,32 C660,32 660,93 720,93" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="600" cy="32" r="5" fill="var(--card)" stroke="var(--accent)" strokeWidth="2.5" />
              </svg>
            </div>
            <div style={css('display:flex;justify-content:space-between;margin-top:10px;font-size:11px;font-weight:600;color:var(--faint)')}><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
          </div>

          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad);display:flex;flex-direction:column')}>
            <div style={css('font-size:14.5px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>Payment Split</div>
            <div style={css('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding-top:8px')}>
              <div style={css('position:relative;width:168px;height:168px')}>
                <svg viewBox="0 0 180 180" width="168" height="168">
                  <g transform="rotate(-90 90 90)">
                    <circle cx="90" cy="90" r="70" fill="none" stroke="var(--ink)" strokeWidth="22" strokeDasharray="285.9 153.9" strokeDashoffset="0" />
                    <circle cx="90" cy="90" r="70" fill="none" stroke="var(--accent)" strokeWidth="22" strokeDasharray="88 351.8" strokeDashoffset="-285.9" />
                    <circle cx="90" cy="90" r="70" fill="none" stroke="var(--amber)" strokeWidth="22" strokeDasharray="66 373.8" strokeDashoffset="-373.9" />
                  </g>
                </svg>
                <div style={css('position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center')}><span style={css('font-size:22px;font-weight:800;color:var(--ink);letter-spacing:-.02em')}>100%</span><span style={css('font-size:10.5px;font-weight:600;color:var(--muted)')}>Processed</span></div>
              </div>
              <div style={css('display:flex;flex-direction:column;gap:10px;width:100%;padding:0 6px')}>
                <div style={css('display:flex;align-items:center;gap:9px')}><span style={css('width:10px;height:10px;border-radius:3px;background:var(--ink)')} /><span style={css('font-size:12.5px;color:var(--text);font-weight:600;flex:1')}>Credit / Debit</span><span style={css('font-size:12.5px;font-weight:800;color:var(--ink)')}>65%</span></div>
                <div style={css('display:flex;align-items:center;gap:9px')}><span style={css('width:10px;height:10px;border-radius:3px;background:var(--accent)')} /><span style={css('font-size:12.5px;color:var(--text);font-weight:600;flex:1')}>Prepaid</span><span style={css('font-size:12.5px;font-weight:800;color:var(--ink)')}>20%</span></div>
                <div style={css('display:flex;align-items:center;gap:9px')}><span style={css('width:10px;height:10px;border-radius:3px;background:var(--amber)')} /><span style={css('font-size:12.5px;color:var(--text);font-weight:600;flex:1')}>Cash</span><span style={css('font-size:12.5px;font-weight:800;color:var(--ink)')}>15%</span></div>
              </div>
            </div>
          </div>
        </section>

        <section style={css('display:grid;grid-template-columns:1fr 1.35fr;gap:16px')}>
          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad);display:flex;flex-direction:column')}>
            <div style={css('font-size:14.5px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>Peak Hours</div>
            <div style={css('font-size:12px;color:var(--muted);margin-top:3px;font-weight:500')}>Transactions by hour</div>
            <div style={css('flex:1;margin-top:18px;min-height:170px')}>
              <svg viewBox="0 0 320 190" width="100%" height="100%" preserveAspectRatio="none" style={css('display:block')}>
                <rect x="9" y="139" width="26" height="21" rx="5" fill="var(--border-strong)" />
                <rect x="55" y="100" width="26" height="60" rx="5" fill="var(--border-strong)" />
                <rect x="101" y="44" width="26" height="116" rx="5" fill="var(--border-strong)" />
                <rect x="147" y="83" width="26" height="77" rx="5" fill="var(--border-strong)" />
                <rect x="193" y="20" width="26" height="140" rx="5" fill="var(--accent)" />
                <rect x="239" y="66" width="26" height="94" rx="5" fill="var(--border-strong)" />
                <rect x="285" y="126" width="26" height="34" rx="5" fill="var(--border-strong)" />
                <text x="22" y="178" textAnchor="middle" fontFamily="Manrope" fontSize="11" fontWeight="600" fill="var(--faint)">8a</text>
                <text x="68" y="178" textAnchor="middle" fontFamily="Manrope" fontSize="11" fontWeight="600" fill="var(--faint)">10a</text>
                <text x="114" y="178" textAnchor="middle" fontFamily="Manrope" fontSize="11" fontWeight="600" fill="var(--faint)">12p</text>
                <text x="160" y="178" textAnchor="middle" fontFamily="Manrope" fontSize="11" fontWeight="600" fill="var(--faint)">2p</text>
                <text x="206" y="178" textAnchor="middle" fontFamily="Manrope" fontSize="11" fontWeight="700" fill="var(--accent-ink)">4p</text>
                <text x="252" y="178" textAnchor="middle" fontFamily="Manrope" fontSize="11" fontWeight="600" fill="var(--faint)">6p</text>
                <text x="298" y="178" textAnchor="middle" fontFamily="Manrope" fontSize="11" fontWeight="600" fill="var(--faint)">8p</text>
              </svg>
            </div>
          </div>

          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);overflow:hidden;display:flex;flex-direction:column')}>
            <div style={css('padding:18px var(--pad) 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)')}>
              <div style={css('font-size:14.5px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>High-Value Orders</div>
              <button className="zbtn" style={css('display:flex;align-items:center;gap:6px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;font-size:12px;font-weight:700;padding:7px 13px;border-radius:9px;cursor:pointer')}>View all<span className="ms" style={css('font-size:16px;color:var(--muted)')}>arrow_forward</span></button>
            </div>
            <table style={css('width:100%;border-collapse:collapse')}>
              <thead><tr style={css('background:var(--card-soft)')}>
                <th style={css('text-align:left;padding:10px var(--pad);font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Order ID</th>
                <th style={css('text-align:left;padding:10px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Time</th>
                <th style={css('text-align:left;padding:10px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Type</th>
                <th style={css('text-align:right;padding:10px var(--pad);font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Amount</th>
              </tr></thead>
              <tbody>
                <tr className="zrow" style={css('border-top:1px solid var(--border)')}><td style={css('padding:13px var(--pad);font-size:13px;font-weight:700;color:var(--ink)')}>#ORD-9021</td><td style={css('padding:13px 16px;font-size:12.5px;color:var(--muted)')}>14:32</td><td style={css('padding:13px 16px')}><span style={css('font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--accent-ink);background:var(--accent-soft);padding:3px 9px;border-radius:6px')}>Prepaid</span></td><td style={css('padding:13px var(--pad);font-size:13px;font-weight:800;color:var(--ink);text-align:right')}>$450.00</td></tr>
                <tr className="zrow" style={css('border-top:1px solid var(--border)')}><td style={css('padding:13px var(--pad);font-size:13px;font-weight:700;color:var(--ink)')}>#ORD-9018</td><td style={css('padding:13px 16px;font-size:12.5px;color:var(--muted)')}>13:15</td><td style={css('padding:13px 16px')}><span style={css('font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--text);background:var(--hover);padding:3px 9px;border-radius:6px')}>Card</span></td><td style={css('padding:13px var(--pad);font-size:13px;font-weight:800;color:var(--ink);text-align:right')}>$325.50</td></tr>
                <tr className="zrow" style={css('border-top:1px solid var(--border)')}><td style={css('padding:13px var(--pad);font-size:13px;font-weight:700;color:var(--ink)')}>#ORD-8995</td><td style={css('padding:13px 16px;font-size:12.5px;color:var(--muted)')}>11:45</td><td style={css('padding:13px 16px')}><span style={css('font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--amber);background:var(--amber-soft);padding:3px 9px;border-radius:6px')}>Cash</span></td><td style={css('padding:13px var(--pad);font-size:13px;font-weight:800;color:var(--ink);text-align:right')}>$210.00</td></tr>
                <tr className="zrow" style={css('border-top:1px solid var(--border)')}><td style={css('padding:13px var(--pad);font-size:13px;font-weight:700;color:var(--ink)')}>#ORD-8980</td><td style={css('padding:13px 16px;font-size:12.5px;color:var(--muted)')}>10:05</td><td style={css('padding:13px 16px')}><span style={css('font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--text);background:var(--hover);padding:3px 9px;border-radius:6px')}>Card</span></td><td style={css('padding:13px var(--pad);font-size:13px;font-weight:800;color:var(--ink);text-align:right')}>$185.00</td></tr>
                <tr className="zrow" style={css('border-top:1px solid var(--border)')}><td style={css('padding:13px var(--pad);font-size:13px;font-weight:700;color:var(--ink)')}>#ORD-8967</td><td style={css('padding:13px 16px;font-size:12.5px;color:var(--muted)')}>09:22</td><td style={css('padding:13px 16px')}><span style={css('font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--accent-ink);background:var(--accent-soft);padding:3px 9px;border-radius:6px')}>Prepaid</span></td><td style={css('padding:13px var(--pad);font-size:13px;font-weight:800;color:var(--ink);text-align:right')}>$162.40</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
