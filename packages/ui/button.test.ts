import { describe, it, expect } from 'vitest';

// Example utility function for testing
function createButton(text: string) {
  return {
    text,
    type: 'button',
    disabled: false,
  };
}

describe('Button Utils', () => {
  it('creates a button with correct text', () => {
    const button = createButton('Click me');
    expect(button.text).toBe('Click me');
    expect(button.type).toBe('button');
    expect(button.disabled).toBe(false);
  });

  it('creates multiple buttons', () => {
    const buttons = ['Save', 'Cancel', 'Submit'].map(createButton);
    expect(buttons).toHaveLength(3);
    expect(buttons[0].text).toBe('Save');
  });
});
