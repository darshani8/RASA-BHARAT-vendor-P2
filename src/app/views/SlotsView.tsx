import { useEffect, useMemo, useState } from 'react';
import { css } from '../css';
import { useStore } from '../store';
import { ZenithAPI } from '../../api';

// Slots Management (#/slots), reached from Inventory. Implements the "Create Slot" design with
// row-based pickers: each ＋ adds ANOTHER dropdown row under the previous one (－ appears only
// once there is a row to remove), so a slot can bundle several dishes/combos. Slot definitions
// are stored per vendor in localStorage (a vendor-side planning tool); Confirm ALSO pushes the
// duration/capacity to the backend park-order rules (PUT /slots/config) so customer-facing slot
// windows follow the latest confirmed slot. Layout is fluid (auto-fit grid + wrapping summary +
// h-scrolling table) so the page works on phones as well as the desktop dashboard.
type SlotEntry = { id: string; name: string };
// A slot holds N mains; each MAIN carries its OWN combos ("Biryani + Chicken Kabab, Chicken
// Chilli"), so a combo always belongs to a specific main dish.
type SlotMain = { dish: SlotEntry; combos: SlotEntry[] };
type VendorSlot = {
  id: string;
  mains: SlotMain[];
  durationMinutes: number;
  totalDish: number;
  createdAt: string;
};

const DURATIONS = [
  { minutes: 30, label: '30 Minutes' },
  { minutes: 60, label: '1 Hour' },
  { minutes: 90, label: '1.5 Hours' },
  { minutes: 120, label: '2 Hours' },
];

const storageKey = (vendorId: string) => 'rasa.slots.' + vendorId;

// Older builds stored flat dish/combo lists (or single dishId fields) — normalise everything
// into the mains shape, attaching legacy combos to the first main.
function loadSlots(vendorId: string): VendorSlot[] {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(vendorId)) || '[]') as Array<
      VendorSlot & {
        dishes?: SlotEntry[];
        combos?: SlotEntry[];
        dishId?: string;
        dishName?: string;
        comboId?: string | null;
        comboName?: string | null;
      }
    >;
    return raw.map((s) => {
      if (s.mains) return { id: s.id, mains: s.mains, durationMinutes: s.durationMinutes, totalDish: s.totalDish, createdAt: s.createdAt };
      const dishes = s.dishes || (s.dishId ? [{ id: s.dishId, name: s.dishName || '' }] : []);
      const combos = s.combos || (s.comboId ? [{ id: s.comboId, name: s.comboName || '' }] : []);
      const mains = dishes.map((d, i) => ({ dish: d, combos: i === 0 ? combos : [] }));
      return { id: s.id, mains, durationMinutes: s.durationMinutes, totalDish: s.totalDish, createdAt: s.createdAt };
    });
  } catch {
    return [];
  }
}

export function SlotsView() {
  const { state } = useStore();
  const api = ZenithAPI;
  const vendorId = api.getVendorId() || '';
  const menu = state.menu || [];

  const [slots, setSlots] = useState<VendorSlot[]>(() => (vendorId ? loadSlots(vendorId) : []));
  const [editingId, setEditingId] = useState<string | null>(null);
  // One row per MAIN: the main's dish dropdown plus that main's own combo dropdowns.
  const [mains, setMains] = useState<Array<{ dishId: string; comboIds: string[] }>>([
    { dishId: '', comboIds: [] },
  ]);
  const [durationIdx, setDurationIdx] = useState(3);
  const [totalDish, setTotalDish] = useState(4);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (menu.length > 0 && mains.length === 1 && mains[0].dishId === '' && mains[0].comboIds.length === 0) {
      setMains([{ dishId: menu[0].id, comboIds: [] }]);
    }
  }, [menu, mains]);

  useEffect(() => {
    if (vendorId) localStorage.setItem(storageKey(vendorId), JSON.stringify(slots));
  }, [slots, vendorId]);

  const nameOf = (id: string) => menu.find((m) => m.id === id)?.name || '';

  // Options grouped by food category (Veg / Non-veg / Breakfast / ...) so the pickers integrate
  // with the same categories the Inventory item form uses.
  const menuByCategory = useMemo(() => {
    const groups = new Map<string, typeof menu>();
    for (const m of menu) {
      const cat = m.category || 'Other';
      const list = groups.get(cat) || [];
      list.push(m);
      groups.set(cat, list);
    }
    return [...groups.entries()];
  }, [menu]);
  const duration = DURATIONS[durationIdx] || DURATIONS[3];

  // ＋ Main adds another main block; each main has its own ＋ Combo that appends a combo dropdown
  // UNDER that main. － only shows when there is something to remove.
  const addMain = () => setMains((rows) => [...rows, { dishId: menu[0]?.id || '', comboIds: [] }]);
  const removeMain = () => setMains((rows) => (rows.length > 1 ? rows.slice(0, -1) : rows));
  const setMainDish = (i: number, v: string) =>
    setMains((rows) => rows.map((r, j) => (j === i ? { ...r, dishId: v } : r)));
  const addCombo = (i: number) =>
    setMains((rows) => rows.map((r, j) => (j === i ? { ...r, comboIds: [...r.comboIds, ''] } : r)));
  const removeCombo = (i: number) =>
    setMains((rows) => rows.map((r, j) => (j === i ? { ...r, comboIds: r.comboIds.slice(0, -1) } : r)));
  const setCombo = (i: number, k: number, v: string) =>
    setMains((rows) => rows.map((r, j) => (j === i ? { ...r, comboIds: r.comboIds.map((c, m) => (m === k ? v : c)) } : r)));

  const resetForm = () => {
    setEditingId(null);
    setMains([{ dishId: menu[0]?.id || '', comboIds: [] }]);
    setDurationIdx(3);
    setTotalDish(4);
  };

  const confirm = () => {
    const shaped: SlotMain[] = mains
      .filter((m) => m.dishId)
      .map((m) => ({
        dish: { id: m.dishId, name: nameOf(m.dishId) },
        combos: m.comboIds.filter(Boolean).map((id) => ({ id, name: nameOf(id) })),
      }));
    if (shaped.length === 0) {
      setNotice('Pick at least one main dish — add menu items in Inventory if the list is empty.');
      return;
    }
    const slot: VendorSlot = {
      id: editingId || api.uuid(),
      mains: shaped,
      durationMinutes: duration.minutes,
      totalDish,
      createdAt: new Date().toISOString(),
    };
    setSlots((prev) => (editingId ? prev.map((s) => (s.id === editingId ? slot : s)) : [slot, ...prev]));
    if (vendorId) {
      void api
        .setSlotConfig({ vendorId, slotMinutes: duration.minutes, capacityPerSlot: totalDish, lookaheadMinutes: 480, enabled: true })
        .then(() => setNotice((editingId ? 'Slot updated' : 'Slot created') + ' — live park-order windows now follow it.'))
        .catch(() => setNotice((editingId ? 'Slot updated' : 'Slot created') + ' locally; live window sync failed (will apply on next confirm).'));
    } else {
      setNotice(editingId ? 'Slot updated.' : 'Slot created.');
    }
    resetForm();
  };

  const editSlot = (s: VendorSlot) => {
    setEditingId(s.id);
    setMains(
      s.mains.length > 0
        ? s.mains.map((m) => ({ dishId: m.dish.id, comboIds: m.combos.map((c) => c.id) }))
        : [{ dishId: menu[0]?.id || '', comboIds: [] }]
    );
    setDurationIdx(Math.max(0, DURATIONS.findIndex((d) => d.minutes === s.durationMinutes)));
    setTotalDish(s.totalDish);
    setNotice('Editing slot — change the fields and press Confirm to save.');
  };
  const deleteSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) resetForm();
  };

  const summary = useMemo(() => {
    const parts = mains
      .filter((m) => m.dishId)
      .map((m) => {
        const combos = m.comboIds.filter(Boolean).map(nameOf).filter(Boolean);
        return nameOf(m.dishId) + (combos.length > 0 ? ' + ' + combos.join(', ') : '');
      });
    const comboCount = mains.reduce((n, m) => n + m.comboIds.filter(Boolean).length, 0);
    return {
      dish: parts.length > 0 ? parts.join(' · ') : '—',
      combo: comboCount === 0 ? 'None' : comboCount + (comboCount === 1 ? ' combo' : ' combos'),
      duration: duration.label,
      total: totalDish + (totalDish === 1 ? ' Dish' : ' Dishes'),
    };
  }, [mains, duration, totalDish, menu]);

  // ── styles (mock-faithful, fluid) ───────────────────────────────────────────
  const fieldLabel = 'display:flex;align-items:center;gap:10px;font-size:14px;font-weight:800;color:var(--ink)';
  const chip = (bg: string, color: string) =>
    'width:38px;height:38px;border-radius:50%;background:' + bg + ';display:flex;align-items:center;justify-content:center;color:' + color + ';flex-shrink:0';
  const selectStyle =
    'appearance:auto;font-family:inherit;font-size:13.5px;font-weight:600;color:var(--ink);background:var(--card);border:1px solid var(--border-strong);border-radius:12px;padding:12px 14px;flex:1;min-width:0;cursor:pointer';
  const stepBtn = (kind: 'plus' | 'minus') =>
    'width:32px;height:32px;border-radius:50%;border:none;cursor:pointer;font-size:17px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;' +
    (kind === 'plus' ? 'background:rgba(47,143,78,.14);color:#2F8F4E' : 'background:var(--neg-soft);color:var(--neg)');
  const summaryCell = 'display:flex;align-items:center;gap:10px;padding:6px 12px;min-width:150px';
  const summaryTitle = 'font-size:11px;font-weight:600;color:var(--muted)';
  const summaryValue = 'font-size:13px;font-weight:800;color:var(--ink);overflow-wrap:anywhere';
  const tableGrid = 'grid-template-columns:1.4fr 1.4fr 130px 100px 170px';

  return (
    <div style={css('flex:1;overflow-y:auto;padding:20px 16px 40px')}>
      <div style={css('max-width:1240px;margin:0 auto;display:flex;flex-direction:column;gap:18px')}>
        <div style={css('display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap')}>
          <div>
            <h1 style={css('font-size:24px;font-weight:800;color:var(--ink);letter-spacing:-.025em;line-height:1.1')}>Slots Management</h1>
            <p style={css('font-size:13.5px;color:var(--muted);margin-top:5px;font-weight:500')}>Create pickup slots for parked orders — dish, combo, duration and capacity.</p>
          </div>
          <button onClick={resetForm} className="zbtn" style={css('display:flex;align-items:center;gap:8px;border:none;cursor:pointer;background:var(--accent);color:#fff;font-family:inherit;font-size:14px;font-weight:800;padding:13px 22px;border-radius:12px;box-shadow:0 8px 20px -6px rgba(125,21,53,.5)')}>
            <span className="ms" style={css('font-size:19px')}>calendar_month</span>Create Slot
          </button>
        </div>

        <section className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:20px 18px')}>
          <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:20px;align-items:start')}>
            <div style={css('grid-column:1 / -1')}>
              <div style={css('display:flex;align-items:center;justify-content:space-between;gap:8px')}>
                <div style={css(fieldLabel)}><span style={css(chip('var(--accent-soft)', 'var(--accent)'))}><span className="ms" style={css('font-size:20px')}>room_service</span></span>Mains &amp; Combos</div>
                <div style={css('display:flex;gap:8px;align-items:center')}>
                  <span style={css('font-size:11px;font-weight:700;color:var(--muted)')}>Main</span>
                  <button onClick={addMain} title="Add another main dish" style={css(stepBtn('plus'))}>＋</button>
                  {mains.length > 1 && <button onClick={removeMain} title="Remove last main" style={css(stepBtn('minus'))}>−</button>}
                </div>
              </div>
              <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;margin-top:13px')}>
                {mains.map((mn, i) => (
                  <div key={i} style={css('border:1px solid var(--border);border-radius:14px;padding:12px;background:var(--card-soft)')}>
                    <div style={css('font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px')}>Main #{i + 1}</div>
                    <select value={mn.dishId} onChange={(e) => setMainDish(i, e.target.value)} style={css(selectStyle + ';width:100%')}>
                      {menu.length === 0 && <option value="">No menu items</option>}
                      {menuByCategory.map(([cat, items]) => (
                        <optgroup key={cat} label={cat}>
                          {items.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <div style={css('display:flex;align-items:center;justify-content:space-between;margin-top:11px')}>
                      <span style={css('display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:#7C3AED')}><span className="ms" style={css('font-size:16px')}>redeem</span>Combos for this main</span>
                      <div style={css('display:flex;gap:7px')}>
                        <button onClick={() => addCombo(i)} title="Add a combo to this main" style={css(stepBtn('plus'))}>＋</button>
                        {mn.comboIds.length > 0 && <button onClick={() => removeCombo(i)} title="Remove last combo" style={css(stepBtn('minus'))}>−</button>}
                      </div>
                    </div>
                    {mn.comboIds.length === 0 && (
                      <div style={css('font-size:11.5px;color:var(--faint);font-weight:600;margin-top:8px')}>No combos — tap ＋ to attach one.</div>
                    )}
                    <div style={css('display:flex;flex-direction:column;gap:8px;margin-top:8px')}>
                      {mn.comboIds.map((cid, k) => (
                        <select key={k} value={cid} onChange={(e) => setCombo(i, k, e.target.value)} style={css(selectStyle + ';width:100%')}>
                          <option value="">Choose combo…</option>
                          {menuByCategory.map(([cat, items]) => (
                            <optgroup key={cat} label={cat}>
                              {items.filter((m) => m.id !== mn.dishId).map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={css(fieldLabel)}><span style={css(chip('rgba(37,99,235,.10)', '#2563EB'))}><span className="ms" style={css('font-size:20px')}>schedule</span></span>Select Duration</div>
              <div style={css('display:flex;margin-top:13px')}>
                <select value={durationIdx} onChange={(e) => setDurationIdx(Number(e.target.value))} style={css(selectStyle)}>
                  {DURATIONS.map((d, i) => (
                    <option key={d.minutes} value={i}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div style={css(fieldLabel)}><span style={css(chip('var(--amber-soft)', 'var(--amber)'))}><span className="ms" style={css('font-size:20px')}>restaurant</span></span>Total Dish</div>
              <div style={css('display:flex;align-items:center;gap:10px;margin-top:13px')}>
                <div style={css('display:flex;align-items:center;gap:8px;border:1px solid var(--border-strong);border-radius:12px;padding:9px 14px;flex:1;max-width:160px')}>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={totalDish}
                    onChange={(e) => setTotalDish(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
                    style={css('border:none;outline:none;width:56px;font-family:inherit;font-size:16px;font-weight:800;color:var(--ink);background:transparent')}
                  />
                  <span className="ms" style={css('font-size:19px;color:var(--muted)')}>group</span>
                </div>
                <button onClick={confirm} className="zbtn" style={css('display:flex;align-items:center;gap:7px;border:none;cursor:pointer;background:var(--amber);color:#fff;font-family:inherit;font-size:14px;font-weight:800;padding:12px 20px;border-radius:12px;box-shadow:0 8px 20px -6px rgba(183,121,31,.45)')}>
                  <span className="ms" style={css('font-size:18px')}>check</span>{editingId ? 'Save' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>

          <div style={css('border-top:1px dashed var(--border-strong);margin:20px 0 0')} />

          <div style={css('display:flex;flex-wrap:wrap;gap:6px;background:rgba(37,99,235,.05);border-radius:12px;padding:12px 6px;margin-top:18px;align-items:center')}>
            <div style={css(summaryCell + ';min-width:220px')}>
              <span style={css(chip('rgba(37,99,235,.10)', '#2563EB'))}><span className="ms" style={css('font-size:20px')}>calendar_month</span></span>
              <div>
                <div style={css('font-size:14px;font-weight:800;color:#2563EB')}>Slot Summary</div>
                <div style={css('font-size:11px;color:var(--muted);font-weight:500')}>Review your slot details before confirming</div>
              </div>
            </div>
            <div style={css(summaryCell)}>
              <span style={css(chip('var(--accent-soft)', 'var(--accent)'))}><span className="ms" style={css('font-size:18px')}>room_service</span></span>
              <div><div style={css(summaryTitle)}>Dish</div><div style={css(summaryValue)}>{summary.dish}</div></div>
            </div>
            <div style={css(summaryCell)}>
              <span style={css(chip('rgba(124,58,237,.10)', '#7C3AED'))}><span className="ms" style={css('font-size:18px')}>redeem</span></span>
              <div><div style={css(summaryTitle)}>Extra Combo</div><div style={css(summaryValue)}>{summary.combo}</div></div>
            </div>
            <div style={css(summaryCell)}>
              <span style={css(chip('rgba(37,99,235,.10)', '#2563EB'))}><span className="ms" style={css('font-size:18px')}>schedule</span></span>
              <div><div style={css(summaryTitle)}>Duration</div><div style={css(summaryValue)}>{summary.duration}</div></div>
            </div>
            <div style={css(summaryCell)}>
              <span style={css(chip('var(--amber-soft)', 'var(--amber)'))}><span className="ms" style={css('font-size:18px')}>restaurant</span></span>
              <div><div style={css(summaryTitle)}>Total Dish</div><div style={css(summaryValue)}>{summary.total}</div></div>
            </div>
          </div>

          <div style={css('display:flex;align-items:center;gap:9px;background:var(--neg-soft);border-radius:12px;padding:13px 16px;margin-top:16px')}>
            <span className="ms" style={css('font-size:18px;color:var(--neg)')}>info</span>
            <span style={css('font-size:13px;color:var(--text);font-weight:500')}>
              Each <b>Main</b> holds its own combos: <b style={css('color:#2F8F4E')}>+</b> adds a main or a combo under it (<b style={css('color:var(--neg)')}>−</b> removes). Then click <b style={css('color:var(--neg)')}>Confirm</b> to create your slot.
            </span>
          </div>
          {notice && <div style={css('margin-top:12px;font-size:12.5px;font-weight:700;color:var(--accent-ink)')}>{notice}</div>}
        </section>

        <section className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);overflow:hidden')}>
          <div style={css('padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between')}>
            <div style={css('font-size:14px;font-weight:800;color:var(--ink)')}>Your slots</div>
            <div style={css('font-size:12px;color:var(--muted);font-weight:600')}>{slots.length} created</div>
          </div>
          <div style={css('overflow-x:auto')}>
            <div style={css('min-width:720px')}>
              <div style={css('display:grid;' + tableGrid + ';background:var(--card-soft);border-bottom:1px solid var(--border)')}>
                {['Dish', 'Extra Combo', 'Duration', 'Total Dish', ''].map((h, i) => (
                  <div key={i} style={css('padding:11px 18px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)')}>{h}</div>
                ))}
              </div>
              {slots.length === 0 && (
                <div style={css('padding:42px 20px;text-align:center;color:var(--muted);font-size:13px;font-weight:600')}>No slots yet — configure one above and press Confirm.</div>
              )}
              {slots.map((sl) => (
                <div key={sl.id} className="zrow" style={css('display:grid;' + tableGrid + ';align-items:center;border-top:1px solid var(--border)')}>
                  <div style={css('padding:14px 18px;font-size:13.5px;font-weight:800;color:var(--ink)')}>{sl.mains.map((m) => m.dish.name).join(', ') || '—'}</div>
                  <div style={css('padding:14px 18px;font-size:13px;font-weight:600;color:var(--text)')}>{sl.mains.map((m) => (m.combos.length > 0 ? m.dish.name.split(' ')[0] + ': ' + m.combos.map((c) => c.name).join(', ') : null)).filter(Boolean).join(' · ') || '—'}</div>
                  <div style={css('padding:14px 18px;font-size:13px;font-weight:700;color:var(--text)')}>{(DURATIONS.find((d) => d.minutes === sl.durationMinutes) || { label: sl.durationMinutes + ' min' }).label}</div>
                  <div style={css('padding:14px 18px;font-size:13px;font-weight:800;color:var(--ink)')}>{sl.totalDish}</div>
                  <div style={css('padding:14px 18px;display:flex;gap:8px;justify-content:flex-end')}>
                    <button onClick={() => editSlot(sl)} className="zbtn" style={css('display:inline-flex;align-items:center;gap:5px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;font-size:11.5px;font-weight:700;padding:6px 12px;border-radius:8px;cursor:pointer')}><span className="ms" style={css('font-size:15px')}>edit</span>Edit</button>
                    <button onClick={() => deleteSlot(sl.id)} className="zbtn" style={css('display:inline-flex;align-items:center;gap:5px;border:1px solid var(--border);background:var(--card);color:var(--neg);font-family:inherit;font-size:11.5px;font-weight:700;padding:6px 12px;border-radius:8px;cursor:pointer')}><span className="ms" style={css('font-size:15px')}>delete</span>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
