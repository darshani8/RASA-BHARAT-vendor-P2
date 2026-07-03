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
type VendorSlot = {
  id: string;
  dishes: SlotEntry[];
  combos: SlotEntry[];
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

// Older builds stored single dishId/dishName fields — normalise them into the list shape.
function loadSlots(vendorId: string): VendorSlot[] {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(vendorId)) || '[]') as Array<
      VendorSlot & { dishId?: string; dishName?: string; comboId?: string | null; comboName?: string | null }
    >;
    return raw.map((s) => ({
      id: s.id,
      dishes: s.dishes || (s.dishId ? [{ id: s.dishId, name: s.dishName || '' }] : []),
      combos: s.combos || (s.comboId ? [{ id: s.comboId, name: s.comboName || '' }] : []),
      durationMinutes: s.durationMinutes,
      totalDish: s.totalDish,
      createdAt: s.createdAt,
    }));
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
  // Row-based pickers: one dropdown per entry. Dishes start with a single row (filled once the
  // menu loads); combos start with a single optional "None" row.
  const [dishIds, setDishIds] = useState<string[]>(['']);
  const [comboIds, setComboIds] = useState<string[]>(['']);
  const [durationIdx, setDurationIdx] = useState(3);
  const [totalDish, setTotalDish] = useState(4);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (menu.length > 0 && dishIds.length === 1 && dishIds[0] === '') setDishIds([menu[0].id]);
  }, [menu, dishIds]);

  useEffect(() => {
    if (vendorId) localStorage.setItem(storageKey(vendorId), JSON.stringify(slots));
  }, [slots, vendorId]);

  const nameOf = (id: string) => menu.find((m) => m.id === id)?.name || '';
  const duration = DURATIONS[durationIdx] || DURATIONS[3];

  // ＋ adds another dropdown row below the previous one; － (only shown when removable) drops the
  // last row. The first dish row is required, the first combo row can stay "None".
  const addDishRow = () => setDishIds((rows) => [...rows, menu[0]?.id || '']);
  const removeDishRow = () => setDishIds((rows) => (rows.length > 1 ? rows.slice(0, -1) : rows));
  const setDishAt = (i: number, v: string) => setDishIds((rows) => rows.map((r, j) => (j === i ? v : r)));
  const addComboRow = () => setComboIds((rows) => [...rows, '']);
  const removeComboRow = () => setComboIds((rows) => (rows.length > 1 ? rows.slice(0, -1) : rows));
  const setComboAt = (i: number, v: string) => setComboIds((rows) => rows.map((r, j) => (j === i ? v : r)));

  const resetForm = () => {
    setEditingId(null);
    setDishIds([menu[0]?.id || '']);
    setComboIds(['']);
    setDurationIdx(3);
    setTotalDish(4);
  };

  const confirm = () => {
    const dishes = dishIds.filter(Boolean).map((id) => ({ id, name: nameOf(id) }));
    const combos = comboIds.filter(Boolean).map((id) => ({ id, name: nameOf(id) }));
    if (dishes.length === 0) {
      setNotice('Pick at least one dish — add menu items in Inventory if the list is empty.');
      return;
    }
    const slot: VendorSlot = {
      id: editingId || api.uuid(),
      dishes,
      combos,
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
    setDishIds(s.dishes.length > 0 ? s.dishes.map((d) => d.id) : [menu[0]?.id || '']);
    setComboIds(s.combos.length > 0 ? s.combos.map((c) => c.id) : ['']);
    setDurationIdx(Math.max(0, DURATIONS.findIndex((d) => d.minutes === s.durationMinutes)));
    setTotalDish(s.totalDish);
    setNotice('Editing slot — change the fields and press Confirm to save.');
  };
  const deleteSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) resetForm();
  };

  const summary = useMemo(() => {
    const dishes = dishIds.filter(Boolean).map(nameOf).filter(Boolean);
    const combos = comboIds.filter(Boolean).map(nameOf).filter(Boolean);
    return {
      dish: dishes.length > 0 ? dishes.join(', ') : '—',
      combo: combos.length > 0 ? combos.join(', ') : 'None',
      duration: duration.label,
      total: totalDish + (totalDish === 1 ? ' Dish' : ' Dishes'),
    };
  }, [dishIds, comboIds, duration, totalDish, menu]);

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
            <div>
              <div style={css('display:flex;align-items:center;justify-content:space-between;gap:8px')}>
                <div style={css(fieldLabel)}><span style={css(chip('var(--accent-soft)', 'var(--accent)'))}><span className="ms" style={css('font-size:20px')}>room_service</span></span>Dish Name</div>
                <div style={css('display:flex;gap:8px')}>
                  <button onClick={addDishRow} title="Add another dish" style={css(stepBtn('plus'))}>＋</button>
                  {dishIds.length > 1 && <button onClick={removeDishRow} title="Remove last dish" style={css(stepBtn('minus'))}>−</button>}
                </div>
              </div>
              <div style={css('display:flex;flex-direction:column;gap:9px;margin-top:13px')}>
                {dishIds.map((id, i) => (
                  <select key={i} value={id} onChange={(e) => setDishAt(i, e.target.value)} style={css(selectStyle)}>
                    {menu.length === 0 && <option value="">No menu items</option>}
                    {menu.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                ))}
              </div>
            </div>

            <div>
              <div style={css('display:flex;align-items:center;justify-content:space-between;gap:8px')}>
                <div style={css(fieldLabel)}><span style={css(chip('rgba(124,58,237,.10)', '#7C3AED'))}><span className="ms" style={css('font-size:20px')}>redeem</span></span>Extra Combo</div>
                <div style={css('display:flex;gap:8px')}>
                  <button onClick={addComboRow} title="Add another combo" style={css(stepBtn('plus'))}>＋</button>
                  {comboIds.length > 1 && <button onClick={removeComboRow} title="Remove last combo" style={css(stepBtn('minus'))}>−</button>}
                </div>
              </div>
              <div style={css('display:flex;flex-direction:column;gap:9px;margin-top:13px')}>
                {comboIds.map((id, i) => (
                  <select key={i} value={id} onChange={(e) => setComboAt(i, e.target.value)} style={css(selectStyle)}>
                    <option value="">None</option>
                    {menu.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
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
              Click <b style={css('color:#2F8F4E')}>+</b> to add another dish or combo row (<b style={css('color:var(--neg)')}>−</b> removes it). Then click <b style={css('color:var(--neg)')}>Confirm</b> to create your slot.
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
                  <div style={css('padding:14px 18px;font-size:13.5px;font-weight:800;color:var(--ink)')}>{sl.dishes.map((d) => d.name).join(', ') || '—'}</div>
                  <div style={css('padding:14px 18px;font-size:13px;font-weight:600;color:var(--text)')}>{sl.combos.map((c) => c.name).join(', ') || '—'}</div>
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
