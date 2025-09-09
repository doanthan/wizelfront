// Custom styles for react-select components
export const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '36px', // Match h-9 from button size="sm"
    backgroundColor: state.isDisabled ? '#f3f4f6' : 'white',
    borderColor: state.isFocused ? '#60A5FA' : '#e5e7eb', // Gray border to match standard style
    borderWidth: '1px',
    borderRadius: '0.375rem', // Match rounded-md
    boxShadow: state.isFocused ? '0 0 0 2px rgba(96, 165, 250, 0.5)' : 'none',
    transition: 'all 0.2s',
    '&:hover': {
      borderColor: state.isFocused ? '#60A5FA' : '#d1d5db'
    }
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    borderRadius: '0.375rem',
    marginTop: '4px',
    zIndex: 50
  }),
  menuList: (provided) => ({
    ...provided,
    padding: '4px'
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected 
      ? '#60A5FA' 
      : state.isFocused 
        ? '#E0F2FE' 
        : 'transparent',
    color: state.isSelected ? 'white' : '#1f2937',
    padding: '8px 12px',
    cursor: 'pointer',
    position: 'relative',
    '&:active': {
      backgroundColor: state.isSelected ? '#3B82F6' : '#BFDBFE'
    },
    '&::before': state.isSelected ? {
      content: '"✓"',
      position: 'absolute',
      right: '12px',
      color: 'white',
      fontWeight: 'bold'
    } : {}
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#E0F2FE',
    borderRadius: '4px'
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#1e40af',
    fontSize: '0.75rem', // text-xs to match button
    paddingLeft: '6px',
    paddingRight: '3px'
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#1e40af',
    '&:hover': {
      backgroundColor: '#BFDBFE',
      color: '#1e3a8a'
    }
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#6b7280', // text-gray-600 to match standard select
    fontSize: '0.75rem' // text-xs to match button
  }),
  input: (provided) => ({
    ...provided,
    color: '#111827', // text-gray-900 to match standard select
    fontSize: '0.75rem' // text-xs to match button
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#111827', // text-gray-900 to match standard select
    fontSize: '0.75rem' // text-xs to match button
  }),
  indicatorSeparator: (provided) => ({
    ...provided,
    backgroundColor: '#d1d5db'
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? '#60A5FA' : '#6b7280',
    padding: '6px',
    '&:hover': {
      color: '#60A5FA'
    }
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: '#6b7280',
    padding: '6px',
    '&:hover': {
      color: '#ef4444'
    }
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '2px 6px',
    fontSize: '0.75rem' // text-xs to match button
  }),
  group: (provided) => ({
    ...provided,
    paddingTop: '8px',
    paddingBottom: '8px'
  }),
  groupHeading: (provided) => ({
    ...provided,
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#6b7280',
    paddingLeft: '12px',
    paddingRight: '12px',
    marginBottom: '4px'
  })
}

// Dark mode variant
export const selectStylesDark = {
  ...selectStyles,
  control: (provided, state) => ({
    ...selectStyles.control(provided, state),
    backgroundColor: state.isDisabled ? '#374151' : '#030712', // dark:bg-gray-950
    borderColor: state.isFocused ? '#60A5FA' : '#374151', // dark:border-gray-700
    boxShadow: state.isFocused ? '0 0 0 2px #60A5FA, 0 0 0 4px rgba(96, 165, 250, 0.2)' : 'none'
  }),
  menu: (provided) => ({
    ...selectStyles.menu(provided),
    backgroundColor: '#030712', // dark:bg-gray-950
    border: '1px solid #374151' // dark:border-gray-700
  }),
  option: (provided, state) => ({
    ...selectStyles.option(provided, state),
    backgroundColor: state.isSelected 
      ? '#60A5FA' 
      : state.isFocused 
        ? '#374151' 
        : 'transparent',
    color: state.isSelected ? 'white' : '#e5e7eb'
  }),
  multiValue: (provided) => ({
    ...selectStyles.multiValue(provided),
    backgroundColor: '#374151'
  }),
  multiValueLabel: (provided) => ({
    ...selectStyles.multiValueLabel(provided),
    color: '#93c5fd'
  }),
  multiValueRemove: (provided) => ({
    ...selectStyles.multiValueRemove(provided),
    color: '#93c5fd',
    '&:hover': {
      backgroundColor: '#4b5563',
      color: '#dbeafe'
    }
  }),
  placeholder: (provided) => ({
    ...selectStyles.placeholder(provided),
    color: '#9ca3af'
  }),
  input: (provided) => ({
    ...selectStyles.input(provided),
    color: '#e5e7eb'
  }),
  singleValue: (provided) => ({
    ...selectStyles.singleValue(provided),
    color: '#e5e7eb'
  }),
  indicatorSeparator: (provided) => ({
    ...selectStyles.indicatorSeparator(provided),
    backgroundColor: '#4b5563'
  }),
  dropdownIndicator: (provided, state) => ({
    ...selectStyles.dropdownIndicator(provided, state),
    color: state.isFocused ? '#60A5FA' : '#9ca3af'
  }),
  clearIndicator: (provided) => ({
    ...selectStyles.clearIndicator(provided),
    color: '#9ca3af'
  }),
  groupHeading: (provided) => ({
    ...selectStyles.groupHeading(provided),
    color: '#9ca3af'
  })
}