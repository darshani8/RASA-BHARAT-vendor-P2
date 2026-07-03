import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { css } from '../css';
import { THEME_VARS } from '../format';
import type { Route } from '../store';
import { Sidebar, MobileNav } from './Sidebar';
import { Header } from './Header';
import type { HeaderProps } from './Header';

// The themed root + nav + main(header + content) frame shared by every view. THEME_VARS carries
// the light-theme CSS custom properties inline so all descendants inherit them. Below 860px the
// fixed 256px sidebar cannot fit, so the shell stacks vertically behind a MobileNav strip.
export function Shell({ active, header, children }: { active: Route; header: HeaderProps; children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 860px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)');
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // The original dashboard root enabled an extra Manrope character variant ('cv11');
  // every other view used only 'tnum'. Preserve that per-view difference.
  const featureSettings = active === 'dashboard' ? "'tnum' 1,'cv11' 1" : "'tnum' 1";
  return (
    <div style={css(THEME_VARS + ';display:flex;' + (isMobile ? 'flex-direction:column;' : '') + "height:100vh;width:100%;background:var(--canvas);color:var(--text);font-family:'Manrope',system-ui,sans-serif;overflow:hidden;font-feature-settings:" + featureSettings)}>
      {isMobile ? <MobileNav active={active} /> : <Sidebar active={active} />}
      <main style={css('flex:1;display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden')}>
        <Header {...header} />
        {children}
      </main>
    </div>
  );
}
