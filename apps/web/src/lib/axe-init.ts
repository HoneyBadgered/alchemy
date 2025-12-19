/**
 * Axe-core React Integration for Development
 * Runs automated accessibility tests in development mode only
 * Logs violations to the console for immediate feedback
 */

import React from 'react';

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000, {
      rules: [
        {
          id: 'color-contrast',
          enabled: true,
        },
        {
          id: 'landmark-one-main',
          enabled: true,
        },
        {
          id: 'region',
          enabled: true,
        },
      ],
    });
  }).catch((error) => {
    console.warn('Failed to load axe-core:', error);
  });
}

// For ReactDOM import
import ReactDOM from 'react-dom/client';

export {};
