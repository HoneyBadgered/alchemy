/**
 * Axe-core accessibility checker for development
 * Only runs in development mode to catch a11y violations
 */

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('@axe-core/react').then((axe) => {
    import('react').then((React) => {
      import('react-dom').then((ReactDOM) => {
        axe.default(React, ReactDOM, 1000, {
          // Configure rules
          rules: [
            {
              id: 'color-contrast',
              enabled: true,
            },
            {
              id: 'link-name',
              enabled: true,
            },
            {
              id: 'button-name',
              enabled: true,
            },
            {
              id: 'image-alt',
              enabled: true,
            },
            {
              id: 'label',
              enabled: true,
            },
            {
              id: 'list',
              enabled: true,
            },
            {
              id: 'listitem',
              enabled: true,
            },
          ],
        });
      });
    });
  });
}

export {};
