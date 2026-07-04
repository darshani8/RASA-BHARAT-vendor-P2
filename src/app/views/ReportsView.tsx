import { css } from '../css';
import { useStore } from '../store';
import { matches } from '../format';

// Wired to GET /ratings/vendor/:vendorId/reviews (vendor token; own vendor only). That endpoint
// returns only submitted reviews — no customer name, order items or amount — so the card only
// shows what the backend actually gives us: the order token, when it was left, the star rating
// and the comment (or an honest "no comment" note). "Request Review" / "Reply to customer" had
// no backend behind them and only flipped local state, so they're gone entirely.
export function ReportsView() {
  const { state, setFilter, setSort } = useStore();
  const all = state.reviews;
  let list = all.filter((o) => matches(o, state.filter));
  if (state.sort === 'highest') list = [...list].sort((a, b) => b.stars - a.stars);
  else if (state.sort === 'lowest') list = [...list].sort((a, b) => a.stars - b.stars);
  else list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const reviews = list.map((o) => {
    const stars = [0, 1, 2, 3, 4].map((i) => ({ color: i < o.stars ? 'var(--amber)' : 'var(--border-strong)' }));
    return {
      ...o,
      num: o.queueToken || o.orderNumber,
      dateLabel: new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      stars,
      ratingLabel: o.stars.toFixed(1),
    };
  });

  const rs = state.ratingSummary;
  const avgLabel = rs && rs.averageStars != null ? rs.averageStars.toFixed(1) : '—';
  const countLabel = rs ? String(rs.count) : '—';
  const countAll = all.length;
  const countGood = all.filter((o) => o.stars >= 4).length;
  const countAvg = all.filter((o) => o.stars === 3).length;
  const countBad = all.filter((o) => o.stars <= 2).length;
  const chip = 'display:inline-flex;align-items:center;gap:7px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;font-size:13px;font-weight:700;padding:8px 13px;border-radius:10px;cursor:pointer;white-space:nowrap;';
  const chipSel = 'display:inline-flex;align-items:center;gap:7px;border:1px solid var(--ink);background:var(--ink);color:#fff;font-family:inherit;font-size:13px;font-weight:700;padding:8px 13px;border-radius:10px;cursor:pointer;white-space:nowrap;';
  const cs = (f: string) => (state.filter === f ? chipSel : chip);
  const bIdle = 'display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:6px;background:var(--hover);color:var(--muted);font-size:11px;font-weight:800;';
  const bSel = 'display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:6px;background:rgba(255,255,255,.18);color:#fff;font-size:11px;font-weight:800;';
  const bs = (f: string) => (state.filter === f ? bSel : bIdle);

  return (
    <div style={css('flex:1;overflow-y:auto;padding:26px 28px 40px')}>
      <div style={css('max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:18px')}>

        <div>
          <h1 style={css('font-size:24px;font-weight:800;color:var(--ink);letter-spacing:-.025em;line-height:1.1')}>Customer Reports</h1>
          <p style={css('font-size:13.5px;color:var(--muted);margin-top:5px;font-weight:500')}>Ratings and comments customers have left on your orders.</p>
        </div>

        <section style={css('display:grid;grid-template-columns:repeat(2,1fr);gap:16px')}>
          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad)')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}><span style={css('font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)')}>Avg Rating</span><span className="ms" style={css('font-size:20px;color:var(--amber)')}>star</span></div>
            <div style={css('display:flex;align-items:baseline;gap:6px;margin-top:14px')}><span style={css('font-size:32px;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1')}>{avgLabel}</span><span style={css('font-size:13px;color:var(--faint);font-weight:600')}>/ 5.0</span></div>
            <div style={css('font-size:11.5px;color:var(--faint);font-weight:500;margin-top:12px')}>Across {countLabel} reviews</div>
          </div>
          <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad)')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between')}><span style={css('font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)')}>Reviews Collected</span><span className="ms" style={css('font-size:20px;color:var(--accent)')}>reviews</span></div>
            <div style={css('font-size:32px;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1;margin-top:14px')}>{countLabel}</div>
            <div style={css('font-size:11.5px;color:var(--faint);font-weight:500;margin-top:12px')}>Verified customer ratings</div>
          </div>
        </section>

        <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:16px 18px;display:flex;flex-direction:column;gap:14px')}>
          <div style={css('display:flex;align-items:center;justify-content:space-between;gap:12px')}>
            <span style={css('font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)')}>Filter by rating</span>
            <div style={css('display:flex;align-items:center;gap:9px')}>
              <span style={css('font-size:11.5px;font-weight:700;color:var(--faint)')}>Sort</span>
              <div style={css('position:relative;display:flex;align-items:center')}>
                <select onChange={(e) => setSort(e.target.value)} value={state.sort} style={css("appearance:none;-webkit-appearance:none;border:1px solid var(--border);background:var(--card-soft);color:var(--ink);font-family:inherit;font-size:12.5px;font-weight:700;padding:8px 32px 8px 12px;border-radius:9px;outline:none;cursor:pointer")}>
                  <option value="recent">Most recent</option>
                  <option value="highest">Highest rated</option>
                  <option value="lowest">Lowest rated</option>
                </select>
                <span className="ms" style={css('position:absolute;right:8px;font-size:18px;color:var(--muted);pointer-events:none')}>unfold_more</span>
              </div>
            </div>
          </div>
          <div style={css('display:flex;gap:9px;flex-wrap:wrap')}>
            <button onClick={() => setFilter('all')} className="zbtn" style={css(cs('all'))}>All<span style={css(bs('all'))}>{countAll}</span></button>
            <button onClick={() => setFilter('good')} className="zbtn" style={css(cs('good'))}><span className="ms" style={css("font-size:17px;color:var(--amber);font-variation-settings:'FILL' 1")}>star</span>Good<span style={css('font-size:11px;font-weight:700;opacity:.6;letter-spacing:.02em')}>4–5★</span><span style={css(bs('good'))}>{countGood}</span></button>
            <button onClick={() => setFilter('average')} className="zbtn" style={css(cs('average'))}><span className="ms" style={css("font-size:17px;color:var(--amber);font-variation-settings:'FILL' 1")}>star_half</span>Average<span style={css('font-size:11px;font-weight:700;opacity:.6;letter-spacing:.02em')}>3★</span><span style={css(bs('average'))}>{countAvg}</span></button>
            <button onClick={() => setFilter('bad')} className="zbtn" style={css(cs('bad'))}><span className="ms" style={css('font-size:17px;color:var(--faint)')}>star_border</span>Poor<span style={css('font-size:11px;font-weight:700;opacity:.6;letter-spacing:.02em')}>1–2★</span><span style={css(bs('bad'))}>{countBad}</span></button>
          </div>
        </div>

        <section style={css('display:flex;flex-direction:column;gap:14px')}>
          {reviews.map((o) => (
            <div key={o.id} className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:var(--pad);display:grid;grid-template-columns:220px 1fr;gap:24px;align-items:start')}>
              <div style={css('display:flex;flex-direction:column;gap:9px;border-right:1px solid var(--border);padding-right:24px')}>
                <div style={css('display:flex;align-items:center;gap:10px')}>
                  <div style={css('width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;background:linear-gradient(145deg,#3A4250,#1B2027)')}><span className="ms" style={css('font-size:20px')}>confirmation_number</span></div>
                  <div style={css('min-width:0')}><div style={css('font-size:14px;font-weight:800;color:var(--ink);letter-spacing:-.01em')}>{o.num}</div><div style={css('font-size:11.5px;color:var(--muted);font-weight:600')}>{o.dateLabel}</div></div>
                </div>
              </div>

              <div style={css('display:flex;flex-direction:column;gap:12px;min-height:64px')}>
                <div style={css('display:flex;align-items:center;gap:10px')}>
                  <div style={css('display:flex;gap:2px')}>
                    {o.stars.map((s, i) => <span key={i} className="ms" style={css("font-size:18px;color:" + s.color + ";font-variation-settings:'FILL' 1")}>star</span>)}
                  </div>
                  <span style={css('font-size:12.5px;font-weight:700;color:var(--ink)')}>{o.ratingLabel}</span>
                </div>
                {o.comment ? (
                  <p style={css('font-size:13px;color:var(--text);font-weight:500;line-height:1.6;font-style:italic')}>“{o.comment}”</p>
                ) : (
                  <p style={css('font-size:12.5px;color:var(--muted);font-weight:500')}>No comment left.</p>
                )}
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="zcard" style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);padding:48px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center')}>
              {countAll === 0 ? (
                <>
                  {/* The aggregate rating (cards above) is real; the per-order review endpoint may
                      not be deployed yet or simply has no reviews yet — explain that instead of
                      leaving a silent blank list. */}
                  <span className="ms" style={css('font-size:38px;color:var(--faint)')}>rate_review</span>
                  <div style={css('font-size:14px;font-weight:800;color:var(--ink)')}>No reviews yet</div>
                  <div style={css('font-size:12.5px;color:var(--muted);font-weight:500;max-width:420px')}>The cards above show your live aggregate rating. Individual reviews will appear here once customers leave them.</div>
                </>
              ) : (
                <>
                  <span className="ms" style={css('font-size:38px;color:var(--faint)')}>filter_alt_off</span>
                  <div style={css('font-size:14px;font-weight:800;color:var(--ink)')}>No reviews match this filter</div>
                  <div style={css('font-size:12.5px;color:var(--muted);font-weight:500')}>Try a different rating band.</div>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
