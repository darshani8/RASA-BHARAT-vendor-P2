import type { ReactNode } from 'react';
import { css } from '../css';
import { THEME_VARS } from '../format';
import type { Route } from '../store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { HeaderProps } from './Header';

// The themed root + sidebar + main(header + content) frame shared by every view.
// THEME_VARS carries the exact light-theme CSS custom properties inline, so all
// descendants inherit them (same as the original per-view root <div>).
export function Shell({ active, header, children }: { active: Route; header: HeaderProps; children: ReactNode }) {
  // The original dashboard root enabled an extra Manrope character variant ('cv11');
  // every other view used only 'tnum'. Preserve that per-view difference.
  const featureSettings = active === 'dashboard' ? "'tnum' 1,'cv11' 1" : "'tnum' 1";
  return (
    <div style={css(THEME_VARS + ";display:flex;height:100vh;width:100%;background:var(--canvas);color:var(--text);font-family:'Manrope',system-ui,sans-serif;overflow:hidden;font-feature-settings:" + featureSettings)}>
      <Sidebar active={active} />
      <main style={css('flex:1;display:flex;flex-direction:column;min-width:0;height:100vh;overflow:hidden')}>
        <Header {...header} />
        {children}
      </main>
    </div>
  );
}
