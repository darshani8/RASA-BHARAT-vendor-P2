import { css } from '../css';
import { useStore } from '../store';
import { CATEGORY_OPTIONS } from '../format';

export function ItemModal() {
  const { state, closeItemModal, setInvName, setInvPrice, setInvPrep, setInvCat, toggleInvAvail, saveItem } = useStore();
  if (!state.modalOpen) return null;

  const invModalTitle = state.invEditId ? 'Edit item' : 'Add item';
  const invAvailLabel = state.invAvail ? 'Available' : 'Sold out';
  const availToggleStyle = state.invAvail
    ? 'display:inline-flex;align-items:center;gap:8px;cursor:pointer;border:1px solid var(--accent);background:var(--accent-soft);color:var(--accent-ink);font-family:inherit;font-size:13px;font-weight:700;padding:9px 14px;border-radius:10px'
    : 'display:inline-flex;align-items:center;gap:8px;cursor:pointer;border:1px solid var(--border);background:var(--card);color:var(--muted);font-family:inherit;font-size:13px;font-weight:700;padding:9px 14px;border-radius:10px';

  return (
    <div style={css('position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center')}>
      <div onClick={closeItemModal} style={css('position:absolute;inset:0;background:rgba(10,14,19,.55);backdrop-filter:blur(3px);animation:zfade .15s ease')} />
      <div style={css('position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;max-width:520px;background:var(--card);border:1px solid var(--border);border-radius:18px;box-shadow:0 30px 70px -20px rgba(0,0,0,.45);display:flex;flex-direction:column;max-height:90vh;animation:zpop .18s cubic-bezier(.2,.8,.2,1)')}>
        <div style={css('padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between')}>
          <div>
            <div style={css('font-size:17px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>{invModalTitle}</div>
            <div style={css('font-size:12.5px;color:var(--muted);margin-top:2px;font-weight:500')}>Saved live to your menu</div>
          </div>
          <button onClick={closeItemModal} className="zbtn" style={css('border:1px solid var(--border);background:var(--card);cursor:pointer;width:36px;height:36px;border-radius:10px;color:var(--muted);display:flex;align-items:center;justify-content:center')}><span className="ms" style={css('font-size:20px')}>close</span></button>
        </div>
        <div style={css('padding:22px 24px;overflow-y:auto;display:flex;flex-direction:column;gap:16px')}>
          <div style={css('display:flex;flex-direction:column;gap:7px')}><label style={css('font-size:11.5px;font-weight:700;color:var(--text)')}>Item Name</label><input className="zin" value={state.invName} onChange={setInvName} placeholder="e.g. Masala Dosa" /></div>
          <div style={css('display:flex;flex-direction:column;gap:7px')}><label style={css('font-size:11.5px;font-weight:700;color:var(--text)')}>Category</label>
            <select className="zin" value={state.invCat} onChange={setInvCat}>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:14px')}>
            <div style={css('display:flex;flex-direction:column;gap:7px')}><label style={css('font-size:11.5px;font-weight:700;color:var(--text)')}>Price (₹)</label><input className="zin" type="number" value={state.invPrice} onChange={setInvPrice} placeholder="0.00" /></div>
            <div style={css('display:flex;flex-direction:column;gap:7px')}><label style={css('font-size:11.5px;font-weight:700;color:var(--text)')}>Prep Time (mins)</label><input className="zin" type="number" value={state.invPrep} onChange={setInvPrep} placeholder="e.g. 5" /></div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:7px')}><label style={css('font-size:11.5px;font-weight:700;color:var(--text)')}>Availability</label><button onClick={toggleInvAvail} type="button" style={css(availToggleStyle)}><span className="ms" style={css('font-size:18px')}>storefront</span>{invAvailLabel}</button></div>
        </div>
        <div style={css('padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px;background:var(--card-soft)')}>
          <button onClick={closeItemModal} className="zbtn" style={css('border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;font-size:13px;font-weight:700;padding:10px 18px;border-radius:10px;cursor:pointer')}>Cancel</button>
          <button onClick={saveItem} className="zbtn" style={css('border:none;background:var(--ink);color:#fff;font-family:inherit;font-size:13px;font-weight:700;padding:10px 20px;border-radius:10px;cursor:pointer')}>Save Item</button>
        </div>
      </div>
    </div>
  );
}
