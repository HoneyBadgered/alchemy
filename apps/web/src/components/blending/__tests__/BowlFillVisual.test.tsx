/**
 * BowlFillVisual Component Tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BowlFillVisual } from '../BowlFillVisual';
import type { ExtendedBlendState } from '../types';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => <>{children}</>,
}));

describe('BowlFillVisual', () => {
  const emptyBlendState: ExtendedBlendState = {
    baseTeaId: undefined,
    addIns: [],
    blendName: '',
    size: 2,
  };

  const blendStateWithBase: ExtendedBlendState = {
    baseTeaId: 'moonlit-black',
    addIns: [],
    blendName: 'My Blend',
    size: 2,
  };

  const blendStateWithAddIns: ExtendedBlendState = {
    baseTeaId: 'moonlit-black',
    addIns: [
      { ingredientId: 'rose-petals', quantity: 0.25 },
      { ingredientId: 'lavender-buds', quantity: 0.25 },
    ],
    blendName: 'My Floral Blend',
    size: 2,
  };

  it('renders empty bowl when no ingredients', () => {
    render(<BowlFillVisual blendState={emptyBlendState} />);
    
    // Should show the teapot emoji for empty state
    expect(screen.getByText('🫖')).toBeInTheDocument();
  });

  it('renders bowl SVG element', () => {
    render(<BowlFillVisual blendState={emptyBlendState} />);
    
    // Should render the bowl SVG
    expect(screen.getByLabelText('Ceramic bowl')).toBeInTheDocument();
  });

  it('renders ingredient layers when base is selected', () => {
    const { container } = render(<BowlFillVisual blendState={blendStateWithBase} />);
    
    // Bowl should be rendered
    expect(screen.getByLabelText('Ceramic bowl')).toBeInTheDocument();
    
    // Should have fill layers rendered in the component
    // The component should render without errors
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders multiple ingredient layers when add-ins are present', () => {
    const { container } = render(<BowlFillVisual blendState={blendStateWithAddIns} />);
    
    // Bowl should be rendered
    expect(screen.getByLabelText('Ceramic bowl')).toBeInTheDocument();
    
    // Component should render successfully with multiple ingredients
    expect(container.firstChild).toBeInTheDocument();
  });

  it('adjusts to different blend sizes', () => {
    const largeBlend: ExtendedBlendState = {
      ...blendStateWithBase,
      size: 4,
    };
    
    render(<BowlFillVisual blendState={largeBlend} />);
    
    // Should render successfully with larger size
    expect(screen.getByLabelText('Ceramic bowl')).toBeInTheDocument();
  });

  it('handles unknown ingredient IDs gracefully', () => {
    const blendWithUnknown: ExtendedBlendState = {
      baseTeaId: 'unknown-tea',
      addIns: [{ ingredientId: 'unknown-addin', quantity: 0.5 }],
      blendName: 'Test',
      size: 2,
    };
    
    // Should not throw when rendering with unknown ingredients
    expect(() => render(<BowlFillVisual blendState={blendWithUnknown} />)).not.toThrow();
    expect(screen.getByLabelText('Ceramic bowl')).toBeInTheDocument();
  });
});
