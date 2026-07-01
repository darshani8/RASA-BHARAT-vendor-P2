import { css } from '../css';
import { useStore } from '../store';
import { ZenithAPI } from '../../api';
import { inr, mapStatus, statusMeta, channelMeta } from '../format';

export function OrdersView() {
  const { state, act, startReject, cancelReject, setOrdersTab, ordersPrev, ordersNext } = useStore();
  const api = ZenithAPI;
  const rows = state.board || [];
  const orders = rows.map((row) => {
    const status = mapStatus(row.status);
    const m = statusMeta(status);
    const ch = channelMeta(row.channel);
    const rejecting = state.rejectingId === row.orderId;
    return {
      id: row.orderNumber || '#' + String(row.orderId || '').slice(0, 4),
      orderId: row.orderId,
      customer: 'Order ' + (row.orderNumber || ''),
      items: ch.label + (row.prepMinutes ? ' · ' + row.prepMinutes + ' min prep' : ''),
      amount: inr(row.totalPaise),
      payLabel: ch.label, payIcon: ch.icon,
      status,
      pillLabel: m.label, pillIcon: m.icon, pillStyle: m.style,
      showAcceptReject: status === 'pending' && !rejecting,
      showRejectPicker: status === 'pending' && rejecting,
      showPrepared: status === 'preparing',
      showCollect: status === 'ready',
      showComplete: status === 'collected',
      showMore: status === 'completed' || status === 'rejected',
      onAccept: () => act(row.orderId, (id) => api.confirmOffline(id, 'cash')),
      onPrepared: () => act(row.orderId, (id) => api.markReady(id)),
      onCollect: () => act(row.orderId, (id) => api.completeOrder(id)),
      onComplete: () => act(row.orderId, (id) => api.completeOrder(id)),
      onStartReject: () => startReject(row.orderId),
      onCancelReject: () => cancelReject(),
      onReasonChange: (e: { target: { value: string } }) => { const v = e.target.value; if (v) { cancelReject(); act(row.orderId, (id) => api.rejectOrder(id)); } },
    };
  });
  const a = state.analytics;
  const active = state.activeBoard || [];
  const tab = state.ordersTab || 'all';
  const tabOn = 'border:none;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;padding:6px 14px;border-radius:7px;background:var(--card);color:var(--ink);box-shadow:var(--shadow-sm)';
  const tabOff = 'border:none;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:600;padding:6px 14px;border-radius:7px;background:transparent;color:var(--muted)';
  const page = (state.ordersPage || 0) + 1;
  const oActive = String(active.filter((r) => ['paid', 'ready', 'collected'].includes(r.status)).length);
  const oPreparing = String(active.filter((r) => r.status === 'paid').length);
  const oReady = String(active.filter((r) => r.status === 'ready').length);
  const oToday = String(a ? a.orderCount : orders.length);
  const oShowing = 'Page ' + page + ' · ' + orders.length + ' shown';
  const pillBtn = 'display:flex;align-items:center;gap:5px;font-family:inherit;font-size:12.5px;font-weight:600;padding:7px 13px;border-radius:9px;';
  const prevStyle = pillBtn + (page > 1 ? 'border:1px solid var(--border);background:var(--card);color:var(--text);cursor:pointer' : 'border:1px solid var(--border);background:var(--card);color:var(--faint);cursor:default');
  const nextStyle = pillBtn + (state.ordersNextCursor ? 'border:1px solid var(--border);background:var(--card);color:var(--text);cursor:pointer' : 'border:1px solid var(--border);background:var(--card);color:var(--faint);cursor:default');
  const grid = 'grid-template-columns:90px 1.3fr 1.6fr 110px 130px 150px 190px';

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
            </div>
            <div style={css('font-size:12px;color:var(--muted);font-weight:600')}>{oShowing}</div>
          </div>
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
                  <button onClick={o.onCollect} className="zbtn" style={css('display:inline-flex;align-items:center;gap:5px;border:none;background:var(--accent);color:#fff;font-family:inherit;font-size:11.5px;font-weight:700;padding:6px 13px;border-radius:8px;cursor:pointer')}><span className="ms" style={css('font-size:15px')}>shopping_bag</span>Picked Up</button>
                )}
                {o.showComplete && (
                  <button onClick={o.onComplete} className="zbtn" style={css('display:inline-flex;align-items:center;gap:5px;border:1px solid var(--accent);background:var(--accent-soft);color:var(--accent-ink);font-family:inherit;font-size:11.5px;font-weight:700;padding:6px 13px;border-radius:8px;cursor:pointer')}><span className="ms" style={css('font-size:15px')}>done_all</span>Complete</button>
                )}
                {o.showMore && (
                  <button className="zmore zbtn" style={css('border:none;background:transparent;cursor:pointer;color:var(--muted);width:30px;height:30px;border-radius:8px')}><span className="ms" style={css('font-size:20px')}>more_vert</span></button>
                )}
              </div>
            </div>
          ))}
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
