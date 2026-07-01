import { css } from '../css';
import { useStore } from '../store';
import { inr, termMeta } from '../format';

export function QueueView() {
  const { state, setMethod } = useStore();
  // The local order-builder isn't a vendor capability in this backend, so the
  // Order Zone stays empty; the live queue drives the Terminal Queue board.
  const items: never[] = [];
  const q = state.queueData;
  const entries = q && q.entries ? q.entries : [];
  const nowServing = q ? q.nowServingOrderId : null;
  const terminals = entries.map((e) => {
    const serving = (nowServing && e.orderId === nowServing) || e.position === 0;
    const st = serving ? 'serving' : 'open';
    const m = termMeta(st);
    return { id: 'Order ' + e.orderNumber, token: '#' + (e.position + 1), cashier: serving ? 'Now serving' : 'In queue', status: st, pillStyle: m.style, pillLabel: m.label, dot: m.dot };
  });
  const qItemCount = items.length;
  const qEmpty = entries.length === 0;
  const qSubtotal = inr(0), qTax = inr(0), qTotal = inr(0);
  const mBase = 'flex:1;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;padding:10px;border-radius:10px;';
  const sel = mBase + 'border:1px solid var(--accent);background:var(--accent-soft);color:var(--accent-ink);';
  const idle = mBase + 'border:1px solid var(--border);background:var(--card);color:var(--text);';
  const grid = 'grid-template-columns:1.4fr 1fr 1.2fr 140px';

  return (
    <div style={css('flex:1;overflow-y:auto;padding:26px 28px 40px')}>
      <div style={css('max-width:1240px;margin:0 auto;display:flex;flex-direction:column;gap:18px')}>
        <div style={css('display:grid;grid-template-columns:1.6fr 1fr;gap:18px;align-items:stretch')}>

          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;overflow:hidden')}>
            <div style={css('padding:18px var(--pad) 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)')}>
              <div style={css('display:flex;align-items:center;gap:10px')}><span className="ms" style={css('font-size:20px;color:var(--accent)')}>receipt_long</span><span style={css('font-size:15px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>Order Zone</span></div>
              <span style={css('font-size:11.5px;font-weight:700;color:var(--muted);background:var(--hover);padding:4px 10px;border-radius:8px')}>Order #4092</span>
            </div>
            <div style={css('flex:1;display:flex;flex-direction:column;padding:8px 12px')} />
            <div style={css('padding:14px var(--pad);border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--card-soft)')}>
              <span style={css('font-size:12px;font-weight:600;color:var(--muted)')}>{qItemCount} items in order</span>
              <button className="zbtn" style={css('display:flex;align-items:center;gap:6px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;font-size:12px;font-weight:700;padding:7px 13px;border-radius:9px;cursor:pointer')}><span className="ms" style={css('font-size:16px;color:var(--muted)')}>add</span>Add Item</button>
            </div>
          </div>

          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;overflow:hidden')}>
            <div style={css('padding:18px var(--pad) 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border)')}><span className="ms" style={css('font-size:20px;color:var(--accent)')}>account_balance_wallet</span><span style={css('font-size:15px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>Payment Zone</span></div>
            <div style={css('padding:20px var(--pad);display:flex;flex-direction:column;flex:1')}>
              <div style={css('text-align:center;padding:10px 0 16px')}>
                <div style={css('font-size:10.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)')}>Amount Due</div>
                <div style={css('font-size:42px;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1;margin-top:8px')}>{qTotal}</div>
              </div>
              <div style={css('display:flex;flex-direction:column;gap:9px;padding:14px 0;border-top:1px dashed var(--border);border-bottom:1px dashed var(--border)')}>
                <div style={css('display:flex;justify-content:space-between;font-size:13px')}><span style={css('color:var(--muted);font-weight:500')}>Subtotal</span><span style={css('color:var(--text);font-weight:600')}>{qSubtotal}</span></div>
                <div style={css('display:flex;justify-content:space-between;font-size:13px')}><span style={css('color:var(--muted);font-weight:500')}>Tax (8.5%)</span><span style={css('color:var(--text);font-weight:600')}>{qTax}</span></div>
              </div>
              <div style={css('font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:16px 0 9px')}>Payment Method</div>
              <div style={css('display:flex;gap:8px')}>
                <button onClick={() => setMethod('cash')} className="zbtn" style={css(state.method === 'cash' ? sel : idle)}><span className="ms" style={css('font-size:17px')}>payments</span>Cash</button>
                <button onClick={() => setMethod('card')} className="zbtn" style={css(state.method === 'card' ? sel : idle)}><span className="ms" style={css('font-size:17px')}>credit_card</span>Card</button>
                <button onClick={() => setMethod('app')} className="zbtn" style={css(state.method === 'app' ? sel : idle)}><span className="ms" style={css('font-size:17px')}>phone_iphone</span>App</button>
              </div>
              <button className="zbtn" style={css('margin-top:auto;width:100%;display:flex;align-items:center;justify-content:center;gap:9px;border:none;cursor:pointer;background:var(--ink);color:#fff;font-family:inherit;font-size:15px;font-weight:800;padding:14px;border-radius:12px;letter-spacing:-.01em')}>Charge {qTotal}<span className="ms" style={css('font-size:20px')}>arrow_forward</span></button>
            </div>
          </div>
        </div>

        <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);overflow:hidden')}>
          <div style={css('padding:18px var(--pad) 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)')}>
            <div style={css('display:flex;align-items:center;gap:10px')}><span className="ms" style={css('font-size:20px;color:var(--accent)')}>point_of_sale</span><span style={css('font-size:15px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>Terminal Queue</span><span style={css('font-size:11.5px;font-weight:700;color:var(--muted);background:var(--hover);padding:3px 9px;border-radius:7px')}>{terminals.length} terminals</span></div>
            <button className="zbtn" style={css('display:flex;align-items:center;gap:6px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;font-size:12px;font-weight:700;padding:7px 13px;border-radius:9px;cursor:pointer')}><span className="ms" style={css('font-size:16px;color:var(--muted)')}>filter_list</span>Filter</button>
          </div>
          <div style={css('display:grid;' + grid + ';background:var(--card-soft);border-bottom:1px solid var(--border)')}>
            <div style={css('padding:11px var(--pad);font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Order</div>
            <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Position</div>
            <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>State</div>
            <div style={css('padding:11px var(--pad);font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Status</div>
          </div>
          {qEmpty && <div style={css('padding:48px 20px;text-align:center;color:var(--muted);font-size:13px;font-weight:600')}>Queue is empty. Customers waiting for pickup will appear here live.</div>}
          {terminals.map((t, i) => (
            <div key={i} className="zrow" style={css('display:grid;' + grid + ';align-items:center;border-top:1px solid var(--border)')}>
              <div style={css('padding:14px var(--pad);font-size:13px;font-weight:700;color:var(--ink)')}>{t.id}</div>
              <div style={css('padding:14px 16px;font-size:14px;font-weight:800;color:var(--ink)')}>{t.token}</div>
              <div style={css('padding:14px 16px;font-size:12.5px;color:var(--text);font-weight:600')}>{t.cashier}</div>
              <div style={css('padding:14px var(--pad)')}><span style={css(t.pillStyle)}><span style={css('width:6px;height:6px;border-radius:50%;background:' + t.dot)} />{t.pillLabel}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
