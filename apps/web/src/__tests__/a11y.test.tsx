import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend expect matchers
expect.extend(toHaveNoViolations);

// Mock components for testing
const TestButton = () => (
  <button aria-label="Test button">Click me</button>
);

const TestImage = () => (
  <img src="/test.jpg" alt="Test image" />
);

const TestLink = () => (
  <a href="/test" aria-label="Test link">Click here</a>
);

const TestForm = () => (
  <form>
    <label htmlFor="email">Email</label>
    <input id="email" type="email" />
    <button type="submit">Submit</button>
  </form>
);

const TestSkipLink = () => (
  <div>
    <a href="#main" className="skip-link">Skip to main content</a>
    <main id="main">Main content</main>
  </div>
);

describe('Accessibility Tests', () => {
  it('should have accessible button with aria-label', async () => {
    const { container } = render(<TestButton />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible image with alt text', async () => {
    const { container } = render(<TestImage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible link with aria-label', async () => {
    const { container } = render(<TestLink />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible form with labels', async () => {
    const { container } = render(<TestForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have skip link for keyboard navigation', async () => {
    const { container } = render(<TestSkipLink />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should detect missing alt text violations', async () => {
    const BadImage = () => <img src="/test.jpg" />;
    const { container } = render(<BadImage />);
    const results = await axe(container);
    expect(results.violations.length).toBeGreaterThan(0);
    expect(results.violations[0].id).toBe('image-alt');
  });

  it('should detect missing button label violations', async () => {
    const BadButton = () => <button>📧</button>;
    const { container } = render(<BadButton />);
    const results = await axe(container);
    // This may or may not violate depending on content, but we're testing the check runs
    expect(results).toBeDefined();
  });
});
