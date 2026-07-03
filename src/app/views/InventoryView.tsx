import { css } from '../css';
import { useStore } from '../store';
import { inr, iconFor } from '../format';
import { ItemModal } from './ItemModal';

export function InventoryView() {
  const { state, itemCategory, openAddItem, openEditItem, deleteItem, toggleItemAvail, setInvCatFilter } = useStore();
  const all = (state.menu || []).map((m) => {
    const avail = m.isAvailable !== false;
    return {
      id: m.id, name: m.name, category: itemCategory(m), priceLabel: inr(m.pricePaise),
      prep: m.prepMinutes != null ? m.prepMinutes + ' min' : '—',
      availLabel: avail ? 'Available' : 'Sold out',
      availStyle: 'display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;' + (avail ? 'color:var(--accent-ink);background:var(--accent-soft)' : 'color:var(--neg);background:var(--neg-soft)'),
      toggleLabel: avail ? 'Sold out' : 'Available',
      icon: iconFor(m.name),
      onEdit: () => openEditItem(m),
      onDelete: () => deleteItem(m.id),
      onToggle: () => toggleItemAvail(m),
    };
  });
  const filter = state.invCatFilter || 'All';
  const items = filter === 'All' ? all : all.filter((i) => i.category === filter);
  const invCount = filter === 'All' ? String(all.length) + ' items on your menu' : String(items.length) + ' in ' + filter;
  const grid = 'grid-template-columns:2fr 130px 120px 90px 130px 150px';

  return (
    <>
      <div style={css('flex:1;overflow-y:auto;padding:26px 28px 40px')}>
        <div style={css('max-width:1240px;margin:0 auto;display:flex;flex-direction:column;gap:18px')}>

          <section style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:16px')}>
            <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:18px 20px;display:flex;align-items:center;gap:14px')}>
              <div style={css('width:42px;height:42px;border-radius:11px;background:var(--hover);display:flex;align-items:center;justify-content:center')}><span className="ms" style={css('font-size:22px;color:var(--text)')}>category</span></div>
              <div><div style={css('font-size:24px;font-weight:800;color:var(--ink);letter-spacing:-.02em;line-height:1')}>48</div><div style={css('font-size:11.5px;font-weight:600;color:var(--muted);margin-top:3px')}>Total SKUs</div></div>
            </div>
            <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:18px 20px;display:flex;align-items:center;gap:14px')}>
              <div style={css('width:42px;height:42px;border-radius:11px;background:var(--amber-soft);display:flex;align-items:center;justify-content:center')}><span className="ms" style={css('font-size:22px;color:var(--amber)')}>warning</span></div>
              <div><div style={css('font-size:24px;font-weight:800;color:var(--ink);letter-spacing:-.02em;line-height:1')}>6</div><div style={css('font-size:11.5px;font-weight:600;color:var(--muted);margin-top:3px')}>Low Stock</div></div>
            </div>
            <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:18px 20px;display:flex;align-items:center;gap:14px')}>
              <div style={css('width:42px;height:42px;border-radius:11px;background:var(--neg-soft);display:flex;align-items:center;justify-content:center')}><span className="ms" style={css('font-size:22px;color:var(--neg)')}>error</span></div>
              <div><div style={css('font-size:24px;font-weight:800;color:var(--ink);letter-spacing:-.02em;line-height:1')}>2</div><div style={css('font-size:11.5px;font-weight:600;color:var(--muted);margin-top:3px')}>Critical / Out</div></div>
            </div>
          </section>

          <section className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);overflow:hidden')}>
            <div style={css('padding:16px var(--pad);display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--border);flex-wrap:wrap')}>
              <div style={css('flex:1;min-width:240px;max-width:380px;position:relative')}>
                <span className="ms" style={css('position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:19px;color:var(--faint)')}>search</span>
                <input placeholder="Search inventory…" style={css('width:100%;border:1px solid var(--border);background:var(--card-soft);color:var(--text);font-family:inherit;font-size:13px;border-radius:10px;padding:9px 12px 9px 40px;outline:none')} />
              </div>
              <select onChange={setInvCatFilter} value={state.invCatFilter} className="zin" style={css('width:auto;cursor:pointer;font-weight:600;padding:9px 14px')}>
                <option value="All">All Categories</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Mains">Mains</option>
                <option value="Beverages">Beverages</option>
                <option value="Sweets">Sweets</option>
                <option value="Other">Other</option>
              </select>
              <button onClick={openAddItem} className="zbtn" style={css('margin-left:auto;display:flex;align-items:center;gap:7px;border:none;cursor:pointer;background:var(--ink);color:#fff;font-family:inherit;font-size:12.5px;font-weight:700;padding:9px 16px;border-radius:10px')}><span className="ms" style={css('font-size:18px')}>add</span>Add Item</button>
            </div>
            <div style={css('display:grid;' + grid + ';background:var(--card-soft);border-bottom:1px solid var(--border)')}>
              <div style={css('padding:11px var(--pad);font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Item</div>
              <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Category</div>
              <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);text-align:right')}>Price</div>
              <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);text-align:right')}>Prep</div>
              <div style={css('padding:11px 16px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>Status</div>
              <div style={css('padding:11px var(--pad)')} />
            </div>
            {items.length === 0 && <div style={css('padding:48px 20px;text-align:center;color:var(--muted);font-size:13px;font-weight:600')}>No menu items yet. Click “Add Item” to create your first.</div>}
            {items.map((m) => (
              <div key={m.id} className="zrow" style={css('display:grid;' + grid + ';align-items:center;border-top:1px solid var(--border)')}>
                <div style={css('padding:13px var(--pad);display:flex;align-items:center;gap:10px')}><span className="ms" style={css('font-size:20px;color:var(--accent-ink)')}>{m.icon}</span><span style={css('font-size:13px;font-weight:700;color:var(--ink)')}>{m.name}</span></div>
                <div style={css('padding:13px 16px')}><span style={css('font-size:11px;font-weight:700;color:var(--text);background:var(--hover);padding:3px 10px;border-radius:999px')}>{m.category}</span></div>
                <div style={css('padding:13px 16px;font-size:13px;font-weight:700;color:var(--ink);text-align:right')}>{m.priceLabel}</div>
                <div style={css('padding:13px 16px;font-size:12.5px;color:var(--muted);text-align:right')}>{m.prep}</div>
                <div style={css('padding:13px 16px')}><span style={css(m.availStyle)}>{m.availLabel}</span></div>
                <div style={css('padding:13px var(--pad);text-align:right;display:flex;gap:6px;justify-content:flex-end')}>
                  <button onClick={m.onToggle} title={m.toggleLabel} className="zbtn" style={css('border:1px solid var(--border);background:var(--card);cursor:pointer;width:32px;height:32px;border-radius:8px;color:var(--muted);display:inline-flex;align-items:center;justify-content:center')}><span className="ms" style={css('font-size:18px')}>visibility</span></button>
                  <button onClick={m.onEdit} title="Edit" className="zbtn" style={css('border:1px solid var(--border);background:var(--card);cursor:pointer;width:32px;height:32px;border-radius:8px;color:var(--muted);display:inline-flex;align-items:center;justify-content:center')}><span className="ms" style={css('font-size:18px')}>edit</span></button>
                  <button onClick={m.onDelete} title="Delete" className="zbtn" style={css('border:1px solid var(--border);background:var(--card);cursor:pointer;width:32px;height:32px;border-radius:8px;color:var(--neg);display:inline-flex;align-items:center;justify-content:center')}><span className="ms" style={css('font-size:18px')}>delete</span></button>
                </div>
              </div>
            ))}
            <div style={css('padding:14px var(--pad);display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border)')}>
              <span style={css('font-size:12px;color:var(--muted);font-weight:600')}>{invCount}</span>
            </div>
          </section>
        </div>
      </div>
      <ItemModal />
    </>
  );
}
