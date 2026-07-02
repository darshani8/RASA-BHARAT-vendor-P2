import { css } from '../css';
import { useStore } from '../store';
import { inr, iconFor } from '../format';

export function PosView() {
  const { state, add, inc, dec, clear, setPosCat, setPosMethod, onCharge, itemCategory } = useStore();

  const products0 = (state.menu || []).filter((m) => m.isAvailable !== false).map((m) => ({
    id: m.id, name: m.name, cat: m.category || itemCategory(m), price: Number(m.pricePaise) || 0,
    icon: iconFor(m.name), tag: m.isAvailable === false ? 'Sold out' : '', isAvailable: m.isAvailable !== false,
  }));
  const cat = state.posCat;
  const visible = cat === 'All Items' ? products0 : products0.filter((p) => p.cat === cat);
  const products = visible.map((p) => ({ ...p, priceLabel: inr(p.price), hasTag: !!p.tag, addItem: () => add(p) }));

  const cart = state.cart.map((x) => ({ ...x, lineTotal: inr(x.price * x.qty), onInc: () => inc(x.id), onDec: () => dec(x.id) }));
  const sub = state.cart.reduce((acc, x) => acc + x.price * x.qty, 0);
  const empty = cart.length === 0;
  const itemCount = state.cart.reduce((acc, x) => acc + x.qty, 0);
  const subtotal = inr(sub), tax = inr(0), total = inr(sub);
  const chargeMsg = state.chargeMsg || '';

  const pm = state.posMethod || 'cash';
  const mSel = 'display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--accent);background:var(--accent-soft);color:var(--accent-ink);font-family:inherit;font-size:13px;font-weight:700;padding:11px;border-radius:11px;cursor:pointer';
  const mIdle = 'display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;font-size:13px;font-weight:700;padding:11px;border-radius:11px;cursor:pointer';

  const catActive = 'border:1px solid transparent;cursor:pointer;background:var(--ink);color:#fff;font-family:inherit;font-size:12.5px;font-weight:700;padding:8px 16px;border-radius:999px;white-space:nowrap';
  const catIdle = 'border:1px solid var(--border);cursor:pointer;background:var(--card);color:var(--text);font-family:inherit;font-size:12.5px;font-weight:600;padding:8px 16px;border-radius:999px;white-space:nowrap';
  const cstyle = (c: string) => (cat === c ? catActive : catIdle);
  const chips: Array<[string, string]> = [['All Items', 'All Items'], ['Breakfast', 'Breakfast'], ['Mains', 'Mains'], ['Beverages', 'Beverages'], ['Sweets', 'Sweets']];

  return (
    <div style={css('flex:1;display:flex;overflow:hidden;min-height:0')}>
      <section style={css('flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden')}>
        <div style={css('padding:16px 26px 12px;display:flex;gap:8px;overflow-x:auto;flex-shrink:0')}>
          {chips.map(([label, value]) => (
            <button key={value} onClick={() => setPosCat(value)} className="zchip" style={css(cstyle(value))}>{label}</button>
          ))}
        </div>
        <div style={css('flex:1;overflow-y:auto;padding:6px 26px 26px')}>
          <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:14px')}>
            {products.map((p) => (
              <div key={p.id} onClick={p.addItem} className="zcard zprod" style={css('background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;cursor:pointer;display:flex;flex-direction:column;box-shadow:var(--shadow-sm)')}>
                <div style={css('height:88px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;position:relative')}>
                  <span className="ms" style={css('font-size:34px;color:var(--accent-ink)')}>{p.icon}</span>
                  {p.hasTag && <span style={css('position:absolute;top:8px;right:8px;font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--amber);background:var(--card);padding:3px 7px;border-radius:6px;box-shadow:var(--shadow-sm)')}>{p.tag}</span>}
                </div>
                <div style={css('padding:12px 13px 13px;display:flex;flex-direction:column;gap:2px;flex:1')}>
                  <div style={css('font-size:13px;font-weight:700;color:var(--ink);line-height:1.25')}>{p.name}</div>
                  <div style={css('font-size:11.5px;color:var(--muted);font-weight:500')}>{p.cat}</div>
                  <div style={css('display:flex;align-items:center;justify-content:space-between;margin-top:9px')}>
                    <span style={css('font-size:15px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>{p.priceLabel}</span>
                    <span className="ms" style={css('font-size:22px;color:var(--accent)')}>add_circle</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside style={css('width:368px;flex-shrink:0;background:var(--card);border-left:1px solid var(--border);display:flex;flex-direction:column;height:100%;box-shadow:-8px 0 24px -18px rgba(16,24,40,.2)')}>
        <div style={css('padding:18px 20px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between')}>
          <div>
            <div style={css('font-size:16px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>Order #4092</div>
            <div style={css('font-size:12px;color:var(--muted);font-weight:500;margin-top:2px')}>Walk-in · {itemCount} items</div>
          </div>
          <button onClick={clear} className="zbtn" style={css('border:1px solid var(--border);background:var(--card);cursor:pointer;width:34px;height:34px;border-radius:9px;color:var(--muted);display:flex;align-items:center;justify-content:center')}><span className="ms" style={css('font-size:19px')}>delete</span></button>
        </div>

        <div style={css('flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:4px')}>
          {empty && (
            <div style={css('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:50px 20px;text-align:center;height:100%')}>
              <span className="ms" style={css('font-size:42px;color:var(--faint)')}>shopping_cart</span>
              <div style={css('font-size:13.5px;font-weight:700;color:var(--text)')}>Cart is empty</div>
              <div style={css('font-size:12px;color:var(--muted);max-width:180px')}>Tap a product on the left to start building this order.</div>
            </div>
          )}
          {cart.map((line) => (
            <div key={line.id} className="zrow" style={css('display:flex;align-items:center;gap:10px;padding:11px 10px;border-radius:11px')}>
              <div style={css('flex:1;min-width:0')}>
                <div style={css('font-size:13px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{line.name}</div>
                <div style={css('font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{line.note}</div>
              </div>
              <div style={css('display:flex;align-items:center;gap:2px;background:var(--hover);border:1px solid var(--border);border-radius:9px;padding:2px')}>
                <button onClick={line.onDec} className="zstep" style={css('border:none;background:transparent;cursor:pointer;width:26px;height:26px;border-radius:7px;color:var(--muted);display:flex;align-items:center;justify-content:center')}><span className="ms" style={css('font-size:16px')}>remove</span></button>
                <span style={css('min-width:18px;text-align:center;font-size:13px;font-weight:700;color:var(--ink)')}>{line.qty}</span>
                <button onClick={line.onInc} className="zstep" style={css('border:none;background:transparent;cursor:pointer;width:26px;height:26px;border-radius:7px;color:var(--muted);display:flex;align-items:center;justify-content:center')}><span className="ms" style={css('font-size:16px')}>add</span></button>
              </div>
              <div style={css('width:58px;text-align:right;font-size:13px;font-weight:700;color:var(--ink)')}>{line.lineTotal}</div>
            </div>
          ))}
        </div>

        <div style={css('padding:16px 20px 20px;border-top:1px solid var(--border);background:var(--card-soft)')}>
          <div style={css('display:flex;flex-direction:column;gap:8px;margin-bottom:14px')}>
            <div style={css('display:flex;justify-content:space-between;font-size:13px')}><span style={css('color:var(--muted);font-weight:500')}>Subtotal</span><span style={css('color:var(--text);font-weight:600')}>{subtotal}</span></div>
            <div style={css('display:flex;justify-content:space-between;font-size:13px')}><span style={css('color:var(--muted);font-weight:500')}>Taxes</span><span style={css('color:var(--text);font-weight:600')}>{tax}</span></div>
            <div style={css('display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px dashed var(--border)')}><span style={css('font-size:15px;font-weight:800;color:var(--ink)')}>Total</span><span style={css('font-size:20px;font-weight:800;color:var(--ink);letter-spacing:-.02em')}>{total}</span></div>
          </div>
          <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:9px')}>
            <button onClick={() => setPosMethod('cash')} className="zbtn" style={css(pm === 'cash' ? mSel : mIdle)}><span className="ms" style={css('font-size:18px')}>payments</span>Cash</button>
            <button onClick={() => setPosMethod('card')} className="zbtn" style={css(pm === 'card' ? mSel : mIdle)}><span className="ms" style={css('font-size:18px')}>qr_code_2</span>UPI</button>
          </div>
          {chargeMsg && <div style={css('font-size:12px;font-weight:600;color:var(--muted);text-align:center;padding-bottom:8px')}>{chargeMsg}</div>}
          <button onClick={onCharge} className="zbtn" style={css('width:100%;display:flex;align-items:center;justify-content:center;gap:9px;border:none;cursor:pointer;background:var(--ink);color:#fff;font-family:inherit;font-size:15px;font-weight:800;padding:14px;border-radius:12px;letter-spacing:-.01em')}>Charge {total}<span className="ms" style={css('font-size:20px')}>arrow_forward</span></button>
        </div>
      </aside>
    </div>
  );
}
