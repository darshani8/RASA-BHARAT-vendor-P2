import { css } from '../css';
import { useStore } from '../store';
import { inr, mapStatus, statusMeta, channelMeta } from '../format';

export function DashboardView() {
  const { state, onToggleOpen } = useStore();
  const a = state.analytics;
  const q = state.queueData;
  const name = state.vendor && state.vendor.name ? state.vendor.name : 'there';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date();
  const hrs = a && a.hourly ? a.hourly.filter((h) => h.hour >= 9 && h.hour <= 19) : [];
  const maxr = Math.max(1, ...hrs.map((h) => Number(h.revenuePaise) || 0));
  const bars = hrs.map((h) => {
    const v = Number(h.revenuePaise) || 0;
    const pct = Math.round((v / maxr) * 100);
    return { barStyle: 'width:100%;border-radius:4px 4px 0 0;background:var(--accent);opacity:.85;height:' + Math.max(2, pct) + '%' };
  });
  const entries = q && q.entries ? q.entries : [];
  const liveQueue = entries.slice(0, 6).map((e) => ({
    num: '#' + (e.position + 1),
    name: 'Order ' + e.orderNumber,
    sub: e.position === 0 ? 'Now serving' : 'In queue',
    pillLabel: e.position === 0 ? 'Serving' : 'Queued',
    pillStyle: 'font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:999px;' + (e.position === 0 ? 'color:var(--accent-ink);background:var(--accent-soft)' : 'color:var(--muted);background:var(--hover)'),
  }));
  const recent = (state.recent || []).map((o) => {
    const m = statusMeta(mapStatus(o.status));
    return {
      // Same queue token the customer sees; older rows fall back to the global order number.
      num: o.queueToken || o.orderNumber,
      amount: inr(o.totalPaise),
      channel: channelMeta(o.channel).label,
      time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
      pillLabel: m.label,
      pillStyle: m.style,
    };
  });
  const dashGreeting = 'Welcome, ' + name;
  const dashDate = days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate();
  const dashRevenue = inr(a ? a.grossRevenuePaise : 0);
  const dashOrders = String(a ? a.orderCount : 0);
  const liveQueueCount = String(entries.length) + ' active';

  // Both fields are a rolling-out backend addition — absent (older server) or null (no
  // completions yet today) must render as "—", never a made-up number.
  const completedCount = a?.completedCount;
  const completionRatePct =
    a && a.orderCount > 0 && completedCount !== undefined
      ? Math.round((completedCount / a.orderCount) * 100)
      : null;
  const completionRateLabel = completionRatePct != null ? completionRatePct + '%' : '—';
  const completionSubLabel =
    a && a.orderCount > 0 && completedCount !== undefined
      ? completedCount + ' of ' + a.orderCount + ' fulfilled'
      : 'not enough data yet';
  const avgHandleMinutes = a?.avgHandleMinutes;
  const avgHandleLabel =
    avgHandleMinutes != null ? Math.round(avgHandleMinutes) + 'm' : '—';

  const accepting = state.vendor ? state.vendor.acceptingOrders !== false : true;
  const pauseLabel = accepting ? 'Pause' : 'Resume';
  const pauseIcon = accepting ? 'pause_circle' : 'play_circle';

  return (
    <div style={css('flex:1;overflow-y:auto;padding:26px 28px 40px')}>
      <div style={css('max-width:1240px;margin:0 auto;display:flex;flex-direction:column;gap:18px')}>

        <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap')}>
          <div>
            <h1 style={css('font-size:25px;font-weight:800;color:var(--ink);letter-spacing:-.025em;line-height:1.1')}>{dashGreeting}</h1>
            <p style={css('font-size:13.5px;color:var(--muted);margin-top:5px;font-weight:500')}>Here's how your stall is performing today · {dashDate}</p>
          </div>
          <div style={css('display:flex;align-items:center;gap:7px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;font-size:12.5px;font-weight:600;padding:8px 14px;border-radius:10px')}><span className="ms" style={css('font-size:18px;color:var(--muted)')}>calendar_today</span>Today</div>
        </div>

        <section style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:16px')}>
          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad)')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}>
              <span style={css('font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)')}>Today's Revenue</span>
            </div>
            <div style={css('font-size:32px;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1;margin-top:14px')}>{dashRevenue}</div>
            <div style={css('margin-top:12px')}>
              <span style={css('font-size:11.5px;color:var(--faint);font-weight:500')}>gross revenue today</span>
            </div>
          </div>

          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad)')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}>
              <span style={css('font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)')}>Orders Today</span>
              <span style={css('display:inline-flex;align-items:center;gap:3px;font-size:11.5px;font-weight:700;color:var(--pos);background:var(--accent-soft);padding:3px 7px;border-radius:7px')}><span className="ms" style={css('font-size:14px')}>receipt_long</span>live</span>
            </div>
            <div style={css('font-size:32px;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1;margin-top:14px')}>{dashOrders}</div>
            <div style={css('margin-top:12px')}>
              <span style={css('font-size:11.5px;color:var(--faint);font-weight:500')}>orders placed today</span>
            </div>
          </div>

          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad)')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}>
              <span style={css('font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)')}>Avg Handle Time</span>
            </div>
            <div style={css('font-size:32px;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1;margin-top:14px')}>{avgHandleLabel}</div>
            <div style={css('margin-top:12px')}>
              <span style={css('font-size:11.5px;color:var(--faint);font-weight:500')}>payment to ready, today's average</span>
            </div>
          </div>

          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad)')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}>
              <span style={css('font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)')}>Completion Rate</span>
            </div>
            <div style={css('font-size:32px;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1;margin-top:14px')}>{completionRateLabel}</div>
            <div style={css('margin-top:16px')}>
              <div style={css('height:6px;border-radius:999px;background:var(--hover);overflow:hidden')}><div style={css('height:100%;width:' + (completionRatePct ?? 0) + '%;border-radius:999px;background:linear-gradient(90deg,#9E2A48,#5E0F27)')} /></div>
              <div style={css('font-size:11.5px;color:var(--faint);font-weight:500;margin-top:8px')}>{completionSubLabel}</div>
            </div>
          </div>
        </section>

        <section style={css('display:grid;grid-template-columns:1.85fr 1fr;gap:16px')}>
          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad);display:flex;flex-direction:column')}>
            <div style={css('display:flex;align-items:flex-start;justify-content:space-between;gap:12px')}>
              <div>
                <div style={css('font-size:14.5px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>Revenue Flow</div>
                <div style={css('font-size:12px;color:var(--muted);margin-top:3px;font-weight:500')}>Hourly net sales · 9:00 — 19:00</div>
              </div>
              <div style={css('display:flex;background:var(--hover);padding:3px;border-radius:9px')}>
                <span style={css('font-family:inherit;font-size:12px;font-weight:700;padding:5px 12px;border-radius:7px;background:var(--card);color:var(--ink);box-shadow:var(--shadow-sm)')}>Today</span>
              </div>
            </div>

            <div style={css('display:flex;align-items:baseline;gap:10px;margin-top:14px')}>
              <span style={css('font-size:27px;font-weight:800;color:var(--ink);letter-spacing:-.03em')}>{dashRevenue}</span>
              <span style={css('display:inline-flex;align-items:center;gap:3px;font-size:12.5px;font-weight:700;color:var(--pos)')}><span className="ms" style={css('font-size:16px')}>schedule</span>today</span>
            </div>

            <div style={css('position:relative;margin-top:10px;flex:1;min-height:150px;display:flex;align-items:flex-end;gap:6px')}>
              {bars.length === 0 && <div style={css('margin:auto;color:var(--faint);font-size:12.5px;font-weight:600')}>No sales yet today</div>}
              {bars.map((b, i) => (
                <div key={i} style={css('flex:1;height:100%;display:flex;align-items:flex-end')}><div style={css(b.barStyle)} /></div>
              ))}
            </div>
            <div style={css('display:flex;justify-content:space-between;margin-top:10px;font-size:11px;font-weight:600;color:var(--faint)')}>
              <span>9a</span><span>11a</span><span>1p</span><span>3p</span><span>5p</span><span>7p</span>
            </div>
          </div>

          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;overflow:hidden')}>
            <div style={css('padding:18px var(--pad) 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)')}>
              <div style={css('font-size:14.5px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>Live Queue</div>
              <span style={css('font-size:11px;font-weight:700;color:var(--muted);background:var(--hover);padding:3px 9px;border-radius:7px')}>{liveQueueCount}</span>
            </div>
            <div style={css('flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:6px')}>
              {liveQueue.length === 0 && <div style={css('padding:34px 12px;text-align:center;color:var(--muted);font-size:12.5px;font-weight:600')}>No one in the queue right now.</div>}
              {liveQueue.map((e, i) => (
                <div key={i} className="zrow" style={css('display:flex;align-items:center;gap:12px;padding:11px 10px;border-radius:11px')}>
                  <div style={css('width:40px;height:40px;border-radius:10px;background:var(--accent-soft);color:var(--accent-ink);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0')}>{e.num}</div>
                  <div style={css('flex:1;min-width:0')}>
                    <div style={css('font-size:13px;font-weight:700;color:var(--ink)')}>{e.name}</div>
                    <div style={css('font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{e.sub}</div>
                  </div>
                  <span style={css('flex-shrink:0;' + e.pillStyle)}>{e.pillLabel}</span>
                </div>
              ))}
              <div style={css('padding:12px;border-top:1px solid var(--border)')}>
                <button onClick={onToggleOpen} className="zbtn" style={css('width:100%;display:flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;font-size:12px;font-weight:700;padding:9px;border-radius:10px;cursor:pointer')}><span className="ms" style={css('font-size:17px;color:var(--muted)')}>{pauseIcon}</span>{pauseLabel}</button>
              </div>
            </div>
          </div>
        </section>

        <section className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);overflow:hidden')}>
          <div style={css('padding:18px var(--pad);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)')}>
            <div>
              <div style={css('font-size:14.5px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>Recent Transactions</div>
              <div style={css('font-size:12px;color:var(--muted);margin-top:3px;font-weight:500')}>Last 6 completed orders</div>
            </div>
            <a href="#/orders" className="zbtn" style={css('display:flex;align-items:center;gap:6px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;font-size:12px;font-weight:700;padding:7px 13px;border-radius:9px;cursor:pointer;text-decoration:none')}>View all<span className="ms" style={css('font-size:16px;color:var(--muted)')}>arrow_forward</span></a>
          </div>
          <div style={css('display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr 1fr;background:var(--card-soft);border-bottom:1px solid var(--border)')}>
            <div style={css('padding:10px var(--pad);font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Order</div>
            <div style={css('padding:10px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Time</div>
            <div style={css('padding:10px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Channel</div>
            <div style={css('padding:10px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);text-align:right')}>Amount</div>
            <div style={css('padding:10px var(--pad);font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);text-align:right')}>Status</div>
          </div>
          {recent.length === 0 && <div style={css('padding:40px 20px;text-align:center;color:var(--muted);font-size:13px;font-weight:600')}>No transactions yet today.</div>}
          {recent.map((t, i) => (
            <div key={i} className="zrow" style={css('display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr 1fr;align-items:center;border-top:1px solid var(--border)')}>
              <div style={css('padding:13px var(--pad);font-size:13px;font-weight:700;color:var(--ink)')}>{t.num}</div>
              <div style={css('padding:13px 16px;font-size:12.5px;color:var(--muted)')}>{t.time}</div>
              <div style={css('padding:13px 16px;font-size:12.5px;color:var(--text)')}>{t.channel}</div>
              <div style={css('padding:13px 16px;font-size:13px;font-weight:700;color:var(--ink);text-align:right')}>{t.amount}</div>
              <div style={css('padding:13px var(--pad);text-align:right')}><span style={css(t.pillStyle)}>{t.pillLabel}</span></div>
            </div>
          ))}
        </section>

      </div>
    </div>
  );
}
