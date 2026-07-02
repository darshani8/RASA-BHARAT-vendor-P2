import { useEffect, useState } from 'react';
import { css } from '../css';
import { ZenithAPI } from '../../api';
import { inr, todayISO } from '../format';
import type { VendorAnalytics } from '../../api/types';

// Business-intelligence view — WIRED to GET /api/v1/vendor/analytics (a single UTC day). Shows the
// real numbers the backend actually provides: today's gross revenue, order count, average order
// value, and the true per-hour order/revenue distribution. (7-day trends and a payment-method split
// need endpoints that don't exist yet, so this view deliberately shows only what's real — no mock
// figures.)
export function AnalyticsView() {
  const [a, setA] = useState<VendorAnalytics | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let live = true;
    ZenithAPI.getAnalytics(todayISO())
      .then((d) => {
        if (live) setA(d);
      })
      .catch(() => {
        if (live) setErr(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const orders = a?.orderCount ?? 0;
  const grossPaise = Number(a?.grossRevenuePaise ?? 0);
  const aovPaise = orders > 0 ? Math.round(grossPaise / orders) : 0;
  const hourly = a?.hourly ?? [];
  const maxOrders = Math.max(1, ...hourly.map((h) => h.orderCount));
  const maxRev = Math.max(1, ...hourly.map((h) => Number(h.revenuePaise)));
  const peak = hourly.reduce(
    (b, h) => (h.orderCount > b.orderCount ? h : b),
    { hour: -1, orderCount: 0, revenuePaise: '0' },
  );
  const hourLabel = (h: number): string => {
    const am = h < 12;
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}${am ? 'a' : 'p'}`;
  };

  const card =
    'background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad)';
  const kpiLabel =
    'font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)';
  const kpiNum =
    'font-size:30px;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1;margin-top:14px';
  const kpiSub = 'margin-top:12px;font-size:11.5px;font-weight:600;color:var(--faint)';

  // Bar/area geometry for the 24 hourly buckets.
  const BW = 26;
  const GAP = 12;
  const H = 150;
  const W = 24 * (BW + GAP);
  // Area path for revenue-by-hour (centre of each bucket).
  const cx = (i: number): number => i * (BW + GAP) + BW / 2;
  const cy = (rev: number): number => H - Math.round((rev / maxRev) * H);
  const line = hourly.map((h, i) => `${i === 0 ? 'M' : 'L'}${cx(i)},${cy(Number(h.revenuePaise))}`).join(' ');
  const area = hourly.length ? `${line} L${cx(23)},${H} L${cx(0)},${H} Z` : '';

  return (
    <div style={css('flex:1;overflow-y:auto;padding:26px 28px 40px')}>
      <div style={css('max-width:1240px;margin:0 auto;display:flex;flex-direction:column;gap:18px')}>
        <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap')}>
          <div>
            <h1 style={css('font-size:24px;font-weight:800;color:var(--ink);letter-spacing:-.025em;line-height:1.1')}>
              Business Intelligence
            </h1>
            <p style={css('font-size:13.5px;color:var(--muted);margin-top:5px;font-weight:500')}>
              Live performance for today ({a?.date ?? todayISO()}).
            </p>
          </div>
          <div style={css('font-size:12px;font-weight:700;color:var(--accent-ink);background:var(--accent-soft);padding:7px 14px;border-radius:9px')}>
            Today
          </div>
        </div>

        {err && (
          <div style={css('background:var(--neg-soft);border:1px solid var(--neg);color:var(--neg);border-radius:12px;padding:12px 16px;font-size:13px;font-weight:600')}>
            Couldn't load analytics from the server.
          </div>
        )}

        <section style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:16px')}>
          <div className="zcard" style={css(card)}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}>
              <span style={css(kpiLabel)}>Revenue · Today</span>
              <span className="ms" style={css('font-size:20px;color:var(--accent)')}>
                trending_up
              </span>
            </div>
            <div style={css(kpiNum)}>{inr(grossPaise)}</div>
            <div style={css(kpiSub)}>Gross, revenue-bearing orders</div>
          </div>
          <div className="zcard" style={css(card)}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}>
              <span style={css(kpiLabel)}>Avg Order Value</span>
              <span className="ms" style={css('font-size:20px;color:var(--muted)')}>
                receipt_long
              </span>
            </div>
            <div style={css(kpiNum)}>{inr(aovPaise)}</div>
            <div style={css(kpiSub)}>
              {orders > 0 ? `across ${orders} order${orders === 1 ? '' : 's'}` : 'no orders yet'}
            </div>
          </div>
          <div className="zcard" style={css(card)}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}>
              <span style={css(kpiLabel)}>Orders · Today</span>
              <span className="ms" style={css('font-size:20px;color:var(--muted)')}>
                shopping_bag
              </span>
            </div>
            <div style={css(kpiNum)}>{orders}</div>
            <div style={css(kpiSub)}>
              {peak.orderCount > 0 ? `Peak ${hourLabel(peak.hour)} · ${peak.orderCount}` : '—'}
            </div>
          </div>
        </section>

        <section className="zcard" style={css(card + ';display:flex;flex-direction:column')}>
          <div style={css('display:flex;align-items:flex-start;justify-content:space-between')}>
            <div>
              <div style={css('font-size:14.5px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>
                Revenue by Hour
              </div>
              <div style={css('font-size:12px;color:var(--muted);margin-top:3px;font-weight:500')}>
                Today's takings across the day (UTC)
              </div>
            </div>
            <div style={css('text-align:right')}>
              <div style={css('font-size:20px;font-weight:800;color:var(--ink);letter-spacing:-.02em')}>
                {inr(grossPaise)}
              </div>
              <div style={css('font-size:11px;color:var(--accent);font-weight:700')}>
                {peak.orderCount > 0 ? `Peak · ${hourLabel(peak.hour)}` : 'No orders yet'}
              </div>
            </div>
          </div>
          <div style={css('margin-top:16px;overflow-x:auto')}>
            <svg
              viewBox={`0 0 ${W} ${H + 6}`}
              width="100%"
              height="200"
              preserveAspectRatio="none"
              style={css('display:block;overflow:visible')}
            >
              <defs>
                <linearGradient id="zrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {area && <path d={area} fill="url(#zrev)" />}
              {line && (
                <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
              {peak.orderCount > 0 && (
                <circle cx={cx(peak.hour)} cy={cy(Number(peak.revenuePaise))} r="5" fill="var(--card)" stroke="var(--accent)" strokeWidth="2.5" />
              )}
            </svg>
          </div>
        </section>

        <section className="zcard" style={css(card + ';display:flex;flex-direction:column')}>
          <div style={css('font-size:14.5px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>
            Orders by Hour
          </div>
          <div style={css('font-size:12px;color:var(--muted);margin-top:3px;font-weight:500')}>
            {orders > 0 ? 'Order distribution across the day (UTC)' : 'No orders yet today'}
          </div>
          <div style={css('margin-top:18px;overflow-x:auto')}>
            <svg viewBox={`0 0 ${W} ${H + 28}`} width="100%" height="200" preserveAspectRatio="none" style={css('display:block')}>
              {hourly.map((h, i) => {
                const bh = Math.max(2, Math.round((h.orderCount / maxOrders) * H));
                const x = i * (BW + GAP);
                const isPeak = h.hour === peak.hour && peak.orderCount > 0;
                return (
                  <g key={h.hour}>
                    <rect x={x} y={H - bh} width={BW} height={bh} rx="5" fill={isPeak ? 'var(--accent)' : 'var(--border-strong)'} />
                    {i % 3 === 0 && (
                      <text x={x + BW / 2} y={H + 18} textAnchor="middle" fontFamily="Manrope" fontSize="11" fontWeight={isPeak ? 700 : 600} fill={isPeak ? 'var(--accent-ink)' : 'var(--faint)'}>
                        {hourLabel(h.hour)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </section>
      </div>
    </div>
  );
}
