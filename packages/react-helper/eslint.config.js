import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    react: true,
  },
  {
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
)
