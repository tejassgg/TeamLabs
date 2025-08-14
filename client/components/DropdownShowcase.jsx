import { useState } from 'react';
import CustomDropdown from './CustomDropdown';
import { 
  FaUser, 
  FaCog, 
  FaBell, 
  FaHome, 
  FaSearch, 
  FaStar, 
  FaHeart, 
  FaBookmark,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';

const DropdownShowcase = () => {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSearch, setSelectedSearch] = useState('');

  // Sample data for different dropdown types
  const users = [
    { value: 'user1', label: 'John Doe', icon: <FaUser className="w-4 h-4" />, description: 'Frontend Developer' },
    { value: 'user2', label: 'Jane Smith', icon: <FaUser className="w-4 h-4" />, description: 'Backend Developer' },
    { value: 'user3', label: 'Mike Johnson', icon: <FaUser className="w-4 h-4" />, description: 'UI/UX Designer' },
    { value: 'user4', label: 'Sarah Wilson', icon: <FaUser className="w-4 h-4" />, description: 'Project Manager' }
  ];

  const statuses = [
    { value: 'active', label: 'Active', icon: <FaCheck className="w-4 h-4 text-green-500" /> },
    { value: 'pending', label: 'Pending', icon: <FaClock className="w-4 h-4 text-yellow-500" /> },
    { value: 'completed', label: 'Completed', icon: <FaCheck className="w-4 h-4 text-blue-500" /> },
    { value: 'cancelled', label: 'Cancelled', icon: <FaTimes className="w-4 h-4 text-red-500" /> }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority', icon: <FaInfoCircle className="w-4 h-4 text-blue-500" /> },
    { value: 'medium', label: 'Medium Priority', icon: <FaExclamationTriangle className="w-4 h-4 text-yellow-500" /> },
    { value: 'high', label: 'High Priority', icon: <FaExclamationTriangle className="w-4 h-4 text-red-500" /> }
  ];

  const categories = [
    { value: 'feature', label: 'Feature Request', icon: <FaStar className="w-4 h-4 text-yellow-500" /> },
    { value: 'bug', label: 'Bug Report', icon: <FaTimes className="w-4 h-4 text-red-500" /> },
    { value: 'improvement', label: 'Improvement', icon: <FaCog className="w-4 h-4 text-blue-500" /> },
    { value: 'documentation', label: 'Documentation', icon: <FaBookmark className="w-4 h-4 text-green-500" /> }
  ];

  const searchOptions = [
    { value: 'option1', label: 'Advanced Search Option 1', icon: <FaSearch className="w-4 h-4" />, description: 'This is a detailed description of option 1' },
    { value: 'option2', label: 'Advanced Search Option 2', icon: <FaSearch className="w-4 h-4" />, description: 'This is a detailed description of option 2' },
    { value: 'option3', label: 'Advanced Search Option 3', icon: <FaSearch className="w-4 h-4" />, description: 'This is a detailed description of option 3' },
    { value: 'option4', label: 'Advanced Search Option 4', icon: <FaSearch className="w-4 h-4" />, description: 'This is a detailed description of option 4' }
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Custom Dropdown Showcase
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          A comprehensive dropdown component with multiple variants and features
        </p>
      </div>

      {/* Basic Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Dropdown</h3>
          <CustomDropdown
            value={selectedUser}
            onChange={setSelectedUser}
            options={users}
            placeholder="Select a user"
            label="User Selection"
            helpText="Choose a user from the list"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">With Icons</h3>
          <CustomDropdown
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={statuses}
            placeholder="Select status"
            label="Status"
            icon={<FaBell className="w-4 h-4" />}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">With Descriptions</h3>
          <CustomDropdown
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={categories}
            placeholder="Select category"
            label="Category"
            icon={<FaBookmark className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Variant Showcase */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Dropdown Variants</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Default Variant</h4>
            <CustomDropdown
              value={selectedPriority}
              onChange={setSelectedPriority}
              options={priorities}
              placeholder="Select priority"
              variant="default"
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Outlined Variant</h4>
            <CustomDropdown
              value={selectedPriority}
              onChange={setSelectedPriority}
              options={priorities}
              placeholder="Select priority"
              variant="outlined"
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Filled Variant</h4>
            <CustomDropdown
              value={selectedPriority}
              onChange={setSelectedPriority}
              options={priorities}
              placeholder="Select priority"
              variant="filled"
            />
          </div>
        </div>
      </div>

      {/* Size Showcase */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Dropdown Sizes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Small Size</h4>
            <CustomDropdown
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statuses}
              placeholder="Select status"
              size="sm"
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Medium Size</h4>
            <CustomDropdown
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statuses}
              placeholder="Select status"
              size="md"
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Large Size</h4>
            <CustomDropdown
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statuses}
              placeholder="Select status"
              size="lg"
            />
          </div>
        </div>
      </div>

      {/* Search Dropdown */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Search Dropdown</h3>
        <CustomDropdown
          value={selectedSearch}
          onChange={setSelectedSearch}
          options={searchOptions}
          placeholder="Search options..."
          showSearch={true}
          searchPlaceholder="Type to search..."
          icon={<FaSearch className="w-4 h-4" />}
          label="Search Options"
          helpText="Use the search to filter options quickly"
          width="w-full max-w-2xl"
        />
      </div>

      {/* Custom Rendering */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Custom Rendering</h3>
        <CustomDropdown
          value={selectedUser}
          onChange={setSelectedUser}
          options={users}
          placeholder="Select a user"
          label="Custom User Display"
          renderSelected={(option) => (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {option?.label?.charAt(0)}
              </div>
              <span>{option?.label}</span>
            </div>
          )}
          renderOption={(option) => (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {option.label.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
              </div>
            </div>
          )}
        />
      </div>

      {/* Error States */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Error States</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CustomDropdown
            value=""
            onChange={() => {}}
            options={[]}
            placeholder="No options available"
            label="Empty Options"
            error={true}
            errorMessage="No options are currently available"
          />
          
          <CustomDropdown
            value=""
            onChange={() => {}}
            options={users}
            placeholder="Select a user"
            label="Required Field"
            required={true}
            error={true}
            errorMessage="This field is required"
          />
        </div>
      </div>

      {/* Disabled State */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Disabled State</h3>
        <CustomDropdown
          value={selectedUser}
          onChange={setSelectedUser}
          options={users}
          placeholder="Select a user"
          label="Disabled Dropdown"
          disabled={true}
          helpText="This dropdown is currently disabled"
        />
      </div>

      {/* Width Variations */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Width Variations</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CustomDropdown
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={statuses}
            placeholder="Select status"
            width="w-32"
            size="sm"
          />
          
          <CustomDropdown
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={statuses}
            placeholder="Select status"
            width="w-48"
          />
          
          <CustomDropdown
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={statuses}
            placeholder="Select status"
            width="w-64"
          />
          
          <CustomDropdown
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={statuses}
            placeholder="Select status"
            width="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default DropdownShowcase;
