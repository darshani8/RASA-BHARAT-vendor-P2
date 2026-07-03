import { useEffect, useState } from 'react';
import { css } from '../css';
import { useStore } from '../store';
import { ZenithAPI } from '../../api';
import { inr, mapStatus, statusMeta, channelMeta } from '../format';

// Cook-start countdown for a parked/scheduled order. `now` is passed in (a ticking clock) so the
// label re-renders live. Returns `due` once cook-start has arrived (the backend then auto-moves the
// order onto the live board).
function cookCountdown(cookStartAt: string | null, now: number): { label: string; due: boolean } {
  if (!cookStartAt) return { label: 'scheduled', due: false };
  const ms = new Date(cookStartAt).getTime() - now;
  if (ms <= 0) return { label: 'cooking now', due: true };
  // ceil so the countdown is monotonic toward zero — shows "cooks in 1 min" until due, never "0 min".
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return { label: `cooks in ${mins} min`, due: false };
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return { label: `cooks in ${h}h ${m}m`, due: false };
}

export function OrdersView() {
  const { state, act, startReject, cancelReject, setOrdersTab, ordersPrev, ordersNext } = useStore();
  const api = ZenithAPI;

  // Tick every 30s so the parked-order countdowns stay live between server polls.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // QR verify-pickup: which ready order is being verified + the scanned/typed pickup code. (C4)
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [qr, setQr] = useState('');

  const tab = state.ordersTab || 'all';
  const rows = state.board || [];

  // Real ordered items per row. The board/list endpoints deliberately return rows WITHOUT line
  // items, so the "Items" column fetches each order's detail once and caches a
  // "2× Masala Dosa · 1× Filter Coffee" summary. '' marks a failed fetch so the cell falls back
  // to the channel label instead of retrying forever.
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, string>>({});
  useEffect(() => {
    const missing = rows.filter((r) => r.orderId && itemsByOrder[r.orderId] === undefined);
    if (missing.length === 0) return;
    let alive = true;
    void Promise.all(
      missing.map(async (r) => {
        try {
          const detail = await api.getOrder(r.orderId);
          const summary = (detail.items || []).map((i) => i.quantity + '× ' + i.name).join(' · ');
          return [r.orderId, summary] as const;
        } catch {
          return [r.orderId, ''] as const;
        }
      })
    ).then((entries) => {
      if (!alive) return;
      setItemsByOrder((prev) => {
        const next = { ...prev };
        for (const [id, summary] of entries) next[id] = summary;
        return next;
      });
    });
    return () => {
      alive = false;
    };
  }, [rows, itemsByOrder, api]);
  const orders = rows.map((row) => {
    const status = mapStatus(row.status);
    const m = statusMeta(status);
    const ch = channelMeta(row.channel);
    const rejecting = state.rejectingId === row.orderId;
    const verifying = verifyId === row.orderId;
    return {
      id: row.orderNumber || '#' + String(row.orderId || '').slice(0, 4),
      orderId: row.orderId,
      customer: 'Order ' + (row.orderNumber || ''),
      items: itemsByOrder[row.orderId] || ch.label + (row.prepMinutes ? ' · ' + row.prepMinutes + ' min prep' : ''),
      amount: inr(row.totalPaise),
      payLabel: ch.label, payIcon: ch.icon,
      status,
      pillLabel: m.label, pillIcon: m.icon, pillStyle: m.style,
      showAcceptReject: status === 'pending' && !rejecting,
      showRejectPicker: status === 'pending' && rejecting,
      showPrepared: status === 'preparing',
      // A ready order is closed by verifying the customer's QR (ready → collected), NOT by calling
      // complete (which the backend allows only FROM ready and skips the QR proof). (C4)
      showCollect: status === 'ready' && !verifying,
      showVerifyInput: status === 'ready' && verifying,
      // 'collected' is terminal — the old "Complete" button here called complete() on a collected
      // order, which the backend rejects (completed only from 'ready') → a guaranteed 400. (C4)
      showMore: status === 'completed' || status === 'rejected' || status === 'collected',
      onAccept: () => act(row.orderId, (id) => api.confirmOffline(id, 'cash')),
      onPrepared: () => act(row.orderId, (id) => api.markReady(id)),
      onCollect: () => { setVerifyId(row.orderId); setQr(''); },
      onVerifySubmit: () => {
        const token = qr.trim();
        if (!token) return;
        // Do NOT dismiss the input synchronously: act() is fire-and-forget, so closing here would
        // hide the field before verifyPickup resolves. Instead let the outcome drive it — on success
        // the reload flips the order to 'collected', so showVerifyInput (which requires status
        // 'ready') hides it; on an invalid code the order stays 'ready', so the input stays open with
        // the typed code for an immediate retry, alongside the error toast. (C4 review)
        act(row.orderId, async (id) => {
          const r = await api.verifyPickup(id, token);
          if (r.status === 'invalid_or_expired') throw new Error('Invalid or expired pickup code — check the customer’s QR.');
        });
      },
      onCancelVerify: () => { setVerifyId(null); setQr(''); },
      onStartReject: () => startReject(row.orderId),
      onCancelReject: () => cancelReject(),
      onReasonChange: (e: { target: { value: string } }) => { const v = e.target.value; if (v) { cancelReject(); act(row.orderId, (id) => api.rejectOrder(id)); } },
    };
  });

  // Parked orders (lane='scheduled'): shown only on the Scheduled tab, where `state.board` holds the
  // scheduled rows. Sorted soonest-cook-first (null cook-start last). No lifecycle actions — they
  // auto-move to the live board at cook-time.
  const scheduled = rows
    .map((row) => {
      const ch = channelMeta(row.channel);
      const cd = cookCountdown(row.cookStartAt, now);
      return {
        id: row.orderNumber || '#' + String(row.orderId || '').slice(0, 4),
        orderId: row.orderId,
        amount: inr(row.totalPaise),
        channel: ch.label,
        channelIcon: ch.icon,
        cookStartAt: row.cookStartAt,
        cookStartLabel: row.cookStartAt
          ? new Date(row.cookStartAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
          : '—',
        countdown: cd.label,
        due: cd.due,
      };
    })
    .sort((a, b) => {
      const at = a.cookStartAt ? new Date(a.cookStartAt).getTime() : Infinity;
      const bt = b.cookStartAt ? new Date(b.cookStartAt).getTime() : Infinity;
      return at - bt;
    });

  const a = state.analytics;
  const active = state.activeBoard || [];
  const tabOn = 'border:none;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;padding:6px 14px;border-radius:7px;background:var(--card);color:var(--ink);box-shadow:var(--shadow-sm)';
  const tabOff = 'border:none;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:600;padding:6px 14px;border-radius:7px;background:transparent;color:var(--muted)';
  const page = (state.ordersPage || 0) + 1;
  const oActive = String(active.filter((r) => ['paid', 'ready', 'collected'].includes(r.status)).length);
  const oPreparing = String(active.filter((r) => r.status === 'paid').length);
  const oReady = String(active.filter((r) => r.status === 'ready').length);
  // Fall back to the live-board count (never the tab-scoped `orders`, which holds parked rows on the
  // Scheduled tab) if analytics hasn't resolved yet.
  const oToday = String(a ? a.orderCount : active.length);
  const oShowing = tab === 'scheduled' ? scheduled.length + ' parked' : 'Page ' + page + ' · ' + orders.length + ' shown';
  const pillBtn = 'display:flex;align-items:center;gap:5px;font-family:inherit;font-size:12.5px;font-weight:600;padding:7px 13px;border-radius:9px;';
  const prevStyle = pillBtn + (page > 1 ? 'border:1px solid var(--border);background:var(--card);color:var(--text);cursor:pointer' : 'border:1px solid var(--border);background:var(--card);color:var(--faint);cursor:default');
  const nextStyle = pillBtn + (state.ordersNextCursor ? 'border:1px solid var(--border);background:var(--card);color:var(--text);cursor:pointer' : 'border:1px solid var(--border);background:var(--card);color:var(--faint);cursor:default');
  const grid = 'grid-template-columns:90px 1.3fr 1.6fr 110px 130px 150px 190px';
  const schedGrid = 'grid-template-columns:110px 120px 1fr 1.4fr 1.3fr 130px';
  const schedPill = 'display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;padding:4px 10px;border-radius:999px;color:var(--amber);background:var(--amber-soft)';

  return (
    <div style={css('flex:1;overflow-y:auto;padding:26px 28px 40px')}>
      <div style={css('max-width:1240px;margin:0 auto;display:flex;flex-direction:column;gap:18px')}>
        <div>
          <h1 style={css('font-size:24px;font-weight:800;color:var(--ink);letter-spacing:-.025em;line-height:1.1')}>Pipeline Management</h1>
          <p style={css('font-size:13.5px;color:var(--muted);margin-top:5px;font-weight:500')}>Live tracking and historical order records across the counter.</p>
        </div>

        <section style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:16px')}>
          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad)')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}><span style={css('font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)')}>Active Queue</span><span className="ms" style={css('font-size:20px;color:var(--muted)')}>pending_actions</span></div>
            <div style={css('font-size:34px;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1;margin-top:14px')}>{oActive}</div>
            <div style={css('display:inline-flex;align-items:center;gap:4px;margin-top:12px;font-size:11.5px;font-weight:700;color:var(--pos)')}><span className="ms" style={css('font-size:15px')}>bolt</span>live<span style={css('color:var(--faint);font-weight:500')}>on the board</span></div>
          </div>
          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad)')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}><span style={css('font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)')}>Preparing</span><span className="ms" style={css('font-size:20px;color:var(--amber)')}>skillet</span></div>
            <div style={css('font-size:34px;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1;margin-top:14px')}>{oPreparing}</div>
            <div style={css('margin-top:12px;font-size:11.5px;font-weight:500;color:var(--faint)')}>orders <span style={css('color:var(--text);font-weight:700')}>cooking now</span></div>
          </div>
          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad)')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}><span style={css('font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)')}>Ready for Pickup</span><span className="ms" style={css('font-size:20px;color:var(--accent)')}>check_circle</span></div>
            <div style={css('font-size:34px;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1;margin-top:14px')}>{oReady}</div>
            <div style={css('margin-top:12px;font-size:11.5px;font-weight:500;color:var(--amber)')}>awaiting pickup</div>
          </div>
          <div style={css('background:var(--ink);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad);position:relative;overflow:hidden')}>
            <span className="ms" style={css('position:absolute;right:-18px;top:-12px;font-size:118px;color:rgba(255,255,255,.05)')}>monitoring</span>
            <div style={css('position:relative')}><span style={css('font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:rgba(255,255,255,.6)')}>Completed Today</span>
              <div style={css('font-size:34px;font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1;margin-top:14px')}>{oToday}</div>
              <div style={css('display:inline-flex;align-items:center;gap:5px;margin-top:12px;font-size:11.5px;font-weight:600;color:rgba(255,255,255,.85)')}><span className="ms" style={css('font-size:15px;color:#3FD0A0')}>trending_up</span>orders placed today</div></div>
          </div>
        </section>

        <section className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);overflow:hidden')}>
          <div style={css('padding:14px var(--pad);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);gap:12px;flex-wrap:wrap')}>
            <div style={css('display:flex;gap:2px;background:var(--hover);padding:3px;border-radius:9px')}>
              <button onClick={() => setOrdersTab('all')} className="zbtn" style={css(tab === 'all' ? tabOn : tabOff)}>All Orders</button>
              <button onClick={() => setOrdersTab('active')} className="zbtn" style={css(tab === 'active' ? tabOn : tabOff)}>Active</button>
              <button onClick={() => setOrdersTab('completed')} className="zbtn" style={css(tab === 'completed' ? tabOn : tabOff)}>Completed</button>
              <button onClick={() => setOrdersTab('scheduled')} className="zbtn" style={css(tab === 'scheduled' ? tabOn : tabOff)}>Scheduled</button>
            </div>
            <div style={css('font-size:12px;color:var(--muted);font-weight:600')}>{oShowing}</div>
          </div>

          {tab === 'scheduled' ? (
            <>
              <div style={css('display:grid;' + schedGrid + ';background:var(--card-soft);border-bottom:1px solid var(--border)')}>
                <div style={css('padding:11px var(--pad);font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Order</div>
                <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);text-align:right')}>Amount</div>
                <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Channel</div>
                <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Cook-start</div>
                <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Countdown</div>
                <div style={css('padding:11px var(--pad);font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Status</div>
              </div>
              {scheduled.length === 0 && (
                <div style={css('padding:48px 20px;text-align:center;color:var(--muted);font-size:13px;font-weight:600')}>No parked orders — customers who reserve a pickup slot appear here.</div>
              )}
              {scheduled.map((o) => (
                <div key={o.orderId} className="zrow" style={css('display:grid;' + schedGrid + ';align-items:center;border-top:1px solid var(--border)')}>
                  <div style={css('padding:14px var(--pad);font-size:14px;font-weight:800;color:var(--ink)')}>{o.id}</div>
                  <div style={css('padding:14px 16px;font-size:13px;font-weight:700;color:var(--ink);text-align:right')}>{o.amount}</div>
                  <div style={css('padding:14px 16px')}><span style={css('display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--text)')}><span className="ms" style={css('font-size:15px;color:var(--muted)')}>{o.channelIcon}</span>{o.channel}</span></div>
                  <div style={css('padding:14px 16px;font-size:12.5px;color:var(--text);font-weight:600')}>{o.cookStartLabel}</div>
                  <div style={css('padding:14px 16px;font-size:12.5px;font-weight:700;color:' + (o.due ? 'var(--accent-ink)' : 'var(--muted)'))}>
                    <span style={css('display:inline-flex;align-items:center;gap:5px')}><span className="ms" style={css('font-size:15px;color:' + (o.due ? 'var(--accent)' : 'var(--muted)'))}>{o.due ? 'skillet' : 'schedule'}</span>{o.countdown}</span>
                  </div>
                  <div style={css('padding:14px var(--pad)')}><span style={css(schedPill)}><span className="ms" style={css('font-size:13px')}>event_upcoming</span>Scheduled</span></div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div style={css('display:grid;' + grid + ';background:var(--card-soft);border-bottom:1px solid var(--border)')}>
                <div style={css('padding:11px var(--pad);font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Token</div>
                <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Customer</div>
                <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Items</div>
                <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);text-align:right')}>Amount</div>
                <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Payment</div>
                <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Status</div>
                <div style={css('padding:11px var(--pad)')} />
              </div>
              {orders.length === 0 && <div style={css('padding:48px 20px;text-align:center;color:var(--muted);font-size:13px;font-weight:600')}>No active orders right now. New orders appear here live.</div>}
              {orders.map((o) => (
                <div key={o.orderId} className="zrow" style={css('display:grid;' + grid + ';align-items:center;border-top:1px solid var(--border)')}>
                  <div style={css('padding:14px var(--pad);font-size:14px;font-weight:800;color:var(--ink)')}>{o.id}</div>
                  <div style={css('padding:14px 16px;font-size:13px;font-weight:600;color:var(--text)')}>{o.customer}</div>
                  <div style={css('padding:14px 16px;font-size:12.5px;color:var(--muted)')}>{o.items}</div>
                  <div style={css('padding:14px 16px;font-size:13px;font-weight:700;color:var(--ink);text-align:right')}>{o.amount}</div>
                  <div style={css('padding:14px 16px')}><span style={css('display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:var(--text)')}><span className="ms" style={css('font-size:15px;color:var(--muted)')}>{o.payIcon}</span>{o.payLabel}</span></div>
                  <div style={css('padding:14px 16px')}>
                    <div style={css('display:flex;flex-direction:column;gap:4px;align-items:flex-start')}>
                      <span style={css(o.pillStyle)}><span className="ms" style={css('font-size:13px')}>{o.pillIcon}</span>{o.pillLabel}</span>
                    </div>
                  </div>
                  <div style={css('padding:14px var(--pad);text-align:right')}>
                    {o.showAcceptReject && (
                      <div style={css('display:flex;gap:7px;justify-content:flex-end')}>
                        <button onClick={o.onStartReject} className="zbtn" style={css('display:inline-flex;align-items:center;gap:5px;border:1px solid var(--border);background:var(--card);color:var(--neg);font-family:inherit;font-size:11.5px;font-weight:700;padding:6px 12px;border-radius:8px;cursor:pointer')}><span className="ms" style={css('font-size:15px')}>close</span>Reject</button>
                        <button onClick={o.onAccept} className="zbtn" style={css('display:inline-flex;align-items:center;gap:5px;border:none;background:var(--accent);color:#fff;font-family:inherit;font-size:11.5px;font-weight:700;padding:6px 13px;border-radius:8px;cursor:pointer')}><span className="ms" style={css('font-size:15px')}>payments</span>Take Cash</button>
                      </div>
                    )}
                    {o.showRejectPicker && (
                      <div style={css('display:flex;gap:6px;justify-content:flex-end;align-items:center')}>
                        <select onChange={o.onReasonChange} style={css('border:1px solid var(--neg);background:var(--card);color:var(--ink);font-family:inherit;font-size:11.5px;font-weight:600;padding:6px 8px;border-radius:8px;outline:none;cursor:pointer')} defaultValue="">
                          <option value="">Select reason…</option>
                          <option value="Out of stock">Out of stock</option>
                          <option value="Item unavailable">Item unavailable</option>
                          <option value="Kitchen closed">Kitchen closed</option>
                          <option value="Payment issue">Payment issue</option>
                          <option value="Customer cancelled">Customer cancelled</option>
                        </select>
                        <button onClick={o.onCancelReject} className="zbtn" style={css('border:1px solid var(--border);background:var(--card);cursor:pointer;width:30px;height:30px;border-radius:8px;color:var(--muted);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0')}><span className="ms" style={css('font-size:18px')}>close</span></button>
                      </div>
                    )}
                    {o.showPrepared && (
                      <button onClick={o.onPrepared} className="zbtn" style={css('display:inline-flex;align-items:center;gap:5px;border:none;background:var(--amber);color:#fff;font-family:inherit;font-size:11.5px;font-weight:700;padding:6px 13px;border-radius:8px;cursor:pointer')}><span className="ms" style={css('font-size:15px')}>skillet</span>Mark Ready</button>
                    )}
                    {o.showCollect && (
                      <button onClick={o.onCollect} className="zbtn" style={css('display:inline-flex;align-items:center;gap:5px;border:none;background:var(--accent);color:#fff;font-family:inherit;font-size:11.5px;font-weight:700;padding:6px 13px;border-radius:8px;cursor:pointer')}><span className="ms" style={css('font-size:15px')}>qr_code_scanner</span>Verify Pickup</button>
                    )}
                    {o.showVerifyInput && (
                      <div style={css('display:flex;gap:6px;justify-content:flex-end;align-items:center')}>
                        <input
                          autoFocus
                          value={qr}
                          onChange={(e) => setQr(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') o.onVerifySubmit(); if (e.key === 'Escape') o.onCancelVerify(); }}
                          placeholder="Scan / enter pickup code"
                          style={css('width:150px;border:1px solid var(--accent);background:var(--card);color:var(--ink);font-family:inherit;font-size:11.5px;font-weight:600;padding:6px 9px;border-radius:8px;outline:none')}
                        />
                        <button onClick={o.onVerifySubmit} className="zbtn" style={css('border:none;background:var(--accent);color:#fff;cursor:pointer;width:30px;height:30px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0')}><span className="ms" style={css('font-size:18px')}>check</span></button>
                        <button onClick={o.onCancelVerify} className="zbtn" style={css('border:1px solid var(--border);background:var(--card);cursor:pointer;width:30px;height:30px;border-radius:8px;color:var(--muted);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0')}><span className="ms" style={css('font-size:18px')}>close</span></button>
                      </div>
                    )}
                    {o.showMore && (
                      <button className="zmore zbtn" style={css('border:none;background:transparent;cursor:pointer;color:var(--muted);width:30px;height:30px;border-radius:8px')}><span className="ms" style={css('font-size:20px')}>more_vert</span></button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          <div style={css('padding:14px var(--pad);display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border)')}>
            <button onClick={ordersPrev} className="zbtn" style={css(prevStyle)}><span className="ms" style={css('font-size:17px')}>chevron_left</span>Prev</button>
            <div style={css('display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:var(--ink)')}>Page {page}</div>
            <button onClick={ordersNext} className="zbtn" style={css(nextStyle)}>Next<span className="ms" style={css('font-size:17px')}>chevron_right</span></button>
          </div>
        </section>
      </div>
    </div>
  );
}
