import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Button } from '../../src/components/ui/Button';
import { Modal } from '../../src/components/ui/Modal';
import { SelectField, TextField } from '../../src/components/ui/FormControls';

describe('shared UI primitives', () => {
  it('renders a semantic button with its native disabled behavior', () => {
    const markup = renderToStaticMarkup(<Button disabled>Continue</Button>);

    expect(markup).toContain('<button');
    expect(markup).toContain('type="button"');
    expect(markup).toContain('disabled');
  });

  it('renders an accessible dialog only while open', () => {
    expect(renderToStaticMarkup(<Modal isOpen={false} title="Menu" onClose={() => undefined}>Content</Modal>)).toBe('');

    const markup = renderToStaticMarkup(<Modal isOpen title="Menu" onClose={() => undefined}>Content</Modal>);
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain('aria-label="Close dialog"');
  });

  it('connects form control errors to their labelled inputs', () => {
    const textMarkup = renderToStaticMarkup(<TextField error="Required" id="alias" label="Alias" />);
    const selectMarkup = renderToStaticMarkup(
      <SelectField error="Choose one" id="language" label="Language">
        <option value="id">Indonesia</option>
      </SelectField>,
    );

    expect(textMarkup).toContain('aria-describedby="alias-error"');
    expect(textMarkup).toContain('aria-invalid="true"');
    expect(selectMarkup).toContain('aria-describedby="language-error"');
  });
});
