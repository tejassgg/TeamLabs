# CustomDropdown Component

A comprehensive, theme-aware dropdown component that matches the current UI styling and can be used throughout the system.

## Features

- 🎨 **Theme Support**: Automatically adapts to light/dark themes
- 🔍 **Search Functionality**: Built-in search with customizable placeholder
- 🎭 **Multiple Variants**: Default, outlined, and filled styles
- 📏 **Flexible Sizing**: Small, medium, and large sizes
- 🖼️ **Icon Support**: Left and right icons with customizable positioning
- ✨ **Custom Rendering**: Custom option and selected value rendering
- ♿ **Accessibility**: Keyboard navigation and ARIA attributes
- 📱 **Responsive**: Mobile-friendly with touch optimizations
- 🎯 **Error States**: Built-in error handling and validation
- 🔧 **Highly Configurable**: Extensive props for customization

## Basic Usage

```jsx
import CustomDropdown from '../components/CustomDropdown';

const MyComponent = () => {
  const [selectedValue, setSelectedValue] = useState('');

  const options = [
    { value: 'option1', label: 'Option 1', icon: <FaUser /> },
    { value: 'option2', label: 'Option 2', icon: <FaCog /> },
    { value: 'option3', label: 'Option 3', icon: <FaBell /> }
  ];

  return (
    <CustomDropdown
      value={selectedValue}
      onChange={setSelectedValue}
      options={options}
      placeholder="Select an option"
      label="Choose Option"
    />
  );
};
```

## Props

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `any` | - | Current selected value |
| `onChange` | `function` | - | Callback when selection changes |
| `options` | `array` | `[]` | Array of options to display |

### Display Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `'Select an option'` | Placeholder text when no option is selected |
| `label` | `string` | - | Label above the dropdown |
| `helpText` | `string` | - | Help text below the dropdown |
| `icon` | `ReactNode` | - | Icon to show on the left side |
| `rightIcon` | `ReactNode` | - | Custom icon to show on the right side |

### Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'outlined' \| 'filled'` | `'default'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the dropdown |
| `width` | `string` | `'w-full'` | Width CSS class |
| `className` | `string` | - | Additional CSS classes |

### Functionality Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `disabled` | `boolean` | `false` | Whether the dropdown is disabled |
| `required` | `boolean` | `false` | Whether the field is required |
| `showSearch` | `boolean` | `false` | Enable search functionality |
| `searchPlaceholder` | `string` | `'Search...'` | Search input placeholder |
| `maxHeight` | `string` | `'max-h-60'` | Maximum height for options list |

### Custom Rendering Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `renderOption` | `function` | - | Custom function to render each option |
| `renderSelected` | `function` | - | Custom function to render selected value |

### Validation Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `error` | `boolean` | `false` | Show error state |
| `errorMessage` | `string` | - | Error message to display |

## Option Format

The component supports both simple and complex option formats:

### Simple Format
```jsx
const simpleOptions = ['Option 1', 'Option 2', 'Option 3'];
```

### Complex Format
```jsx
const complexOptions = [
  {
    value: 'user1',
    label: 'John Doe',
    icon: <FaUser />,
    description: 'Frontend Developer'
  },
  {
    value: 'user2',
    label: 'Jane Smith',
    icon: <FaCog />,
    description: 'Backend Developer'
  }
];
```

## Variants

### Default Variant
```jsx
<CustomDropdown
  variant="default"
  options={options}
  // ... other props
/>
```

### Outlined Variant
```jsx
<CustomDropdown
  variant="outlined"
  options={options}
  // ... other props
/>
```

### Filled Variant
```jsx
<CustomDropdown
  variant="filled"
  options={options}
  // ... other props
/>
```

## Sizes

### Small
```jsx
<CustomDropdown
  size="sm"
  options={options}
  // ... other props
/>
```

### Medium (Default)
```jsx
<CustomDropdown
  size="md"
  options={options}
  // ... other props
/>
```

### Large
```jsx
<CustomDropdown
  size="lg"
  options={options}
  // ... other props
/>
```

## Search Functionality

Enable search with the `showSearch` prop:

```jsx
<CustomDropdown
  showSearch={true}
  searchPlaceholder="Type to search..."
  options={options}
  // ... other props
/>
```

## Custom Rendering

### Custom Option Rendering
```jsx
<CustomDropdown
  renderOption={(option) => (
    <div className="flex items-center gap-3">
      <img src={option.avatar} className="w-8 h-8 rounded-full" />
      <div>
        <div className="font-medium">{option.name}</div>
        <div className="text-sm text-gray-500">{option.role}</div>
      </div>
    </div>
  )}
  options={options}
  // ... other props
/>
```

### Custom Selected Value Rendering
```jsx
<CustomDropdown
  renderSelected={(option) => (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
        {option?.name?.charAt(0)}
      </div>
      <span>{option?.name}</span>
    </div>
  )}
  options={options}
  // ... other props
/>
```

## Error States

```jsx
<CustomDropdown
  error={true}
  errorMessage="This field is required"
  options={options}
  // ... other props
/>
```

## Disabled State

```jsx
<CustomDropdown
  disabled={true}
  options={options}
  // ... other props
/>
```

## Width Customization

```jsx
// Fixed widths
<CustomDropdown width="w-32" />  // 8rem
<CustomDropdown width="w-48" />  // 12rem
<CustomDropdown width="w-64" />  // 16rem

// Responsive widths
<CustomDropdown width="w-full md:w-64" />

// Custom width
<CustomDropdown width="w-[200px]" />
```

## Examples

### Basic User Selection
```jsx
<CustomDropdown
  value={selectedUser}
  onChange={setSelectedUser}
  options={users}
  placeholder="Select a user"
  label="User"
  icon={<FaUser />}
  required
/>
```

### Status Filter with Icons
```jsx
<CustomDropdown
  value={statusFilter}
  onChange={setStatusFilter}
  options={[
    { value: 'active', label: 'Active', icon: <FaCheck className="text-green-500" /> },
    { value: 'pending', label: 'Pending', icon: <FaClock className="text-yellow-500" /> },
    { value: 'completed', label: 'Completed', icon: <FaCheck className="text-blue-500" /> }
  ]}
  placeholder="Filter by status"
  variant="outlined"
  size="sm"
/>
```

### Searchable Dropdown
```jsx
<CustomDropdown
  value={selectedItem}
  onChange={setSelectedItem}
  options={items}
  placeholder="Search items..."
  showSearch={true}
  searchPlaceholder="Type to search..."
  icon={<FaSearch />}
  label="Search Items"
  helpText="Use the search to find items quickly"
/>
```

### Custom Styled Dropdown
```jsx
<CustomDropdown
  value={selectedValue}
  onChange={setSelectedValue}
  options={options}
  placeholder="Choose option"
  variant="filled"
  size="lg"
  width="w-80"
  className="shadow-lg"
/>
```

## Styling

The component automatically adapts to the current theme using the `useTheme` hook. It includes:

- **Light Theme**: White backgrounds, gray borders, dark text
- **Dark Theme**: Dark backgrounds (`#232323`), gray borders, light text
- **Hover States**: Subtle background changes on hover
- **Focus States**: Blue ring focus indicators
- **Transitions**: Smooth animations for all state changes

## Accessibility

- **Keyboard Navigation**: Enter/Space to open, Escape to close
- **ARIA Attributes**: Proper `aria-haspopup`, `aria-expanded`, `aria-labelledby`
- **Screen Reader Support**: Proper labeling and descriptions
- **Focus Management**: Automatic focus handling

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- React 16.8+ (hooks support required)
- Tailwind CSS for styling

## Dependencies

- React (hooks)
- Tailwind CSS
- React Icons (for examples)

## Migration from Native Select

Replace native `<select>` elements:

```jsx
// Before
<select value={value} onChange={handleChange}>
  <option value="">Select option</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>

// After
<CustomDropdown
  value={value}
  onChange={handleChange}
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' }
  ]}
  placeholder="Select option"
/>
```

## Best Practices

1. **Always provide labels** for better accessibility
2. **Use icons sparingly** to avoid visual clutter
3. **Keep option text concise** for better readability
4. **Provide help text** for complex selections
5. **Use appropriate variants** for different contexts
6. **Test keyboard navigation** for accessibility compliance
7. **Consider search for long option lists** (10+ items)
8. **Use consistent sizing** within the same form/interface
