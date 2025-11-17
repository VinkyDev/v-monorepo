import React from 'react'
import { withSuspense } from 'react-helper'
import { retryLoadWithFallBack } from 'utils'

export const AppLazy = withSuspense(React.lazy(() =>
  retryLoadWithFallBack({
    fn: async () => await import('./App'),
  }),
))
