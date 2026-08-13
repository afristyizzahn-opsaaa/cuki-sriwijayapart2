import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Dice } from '../../src/components/game/Dice';

describe('board-game dice presentation', () => {
  it('renders an interactive dice before a result is resolved', () => {
    const markup = renderToStaticMarkup(<Dice disabled={false} isRolling={false} value={null} onRoll={() => undefined} />);

    expect(markup).toContain('aria-label="Roll dice"');
    expect(markup).not.toContain('disabled=""');
  });

  it('keeps the resolved result visible and announces rolling feedback', () => {
    const resultMarkup = renderToStaticMarkup(<Dice disabled={false} isRolling={false} value={4} onRoll={() => undefined} />);
    const rollingMarkup = renderToStaticMarkup(<Dice disabled={false} isRolling value={4} onRoll={() => undefined} />);

    expect(resultMarkup).toContain('current value 4');
    expect(rollingMarkup).toContain('Dice rolling');
    expect(rollingMarkup).toContain('Rolling');
  });
});
