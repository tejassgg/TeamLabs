import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaChevronRight } from 'react-icons/fa';

const Breadcrumb = ({ type, projectName, teamName }) => {
  const router = useRouter();

  const getBreadcrumbItems = () => {
    switch (type) {
      case 'dashboard':
        return [];
      case 'project':
        return [
          { label: 'Projects', href: '/dashboard/projects' },
          { label: projectName, href: router.asPath }
        ];
      case 'team':
        return [
          { label: 'Teams', href: '/dashboard/teams' },
          { label: teamName, href: router.asPath }
        ];
      case 'kanban':
        return [
          { label: 'Kanban Board', href: router.asPath }
        ];
      case 'profile':
        return [
          { label: 'Profile', href: router.asPath }
        ];
      case 'settings':
        return [
          { label: 'Settings', href: router.asPath }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="container">
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6 h-8">
        <Link 
          href="/dashboard" 
          className={`hover:text-blue-600 transition-colors duration-200 ${
            type === 'dashboard' ? 'text-gray-700 font-medium' : ''
          }`}
        >
          Dashboard
        </Link>
        {getBreadcrumbItems().map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <FaChevronRight className="text-gray-400 w-3 h-3" />
            {index === getBreadcrumbItems().length - 1 ? (
              <span className="text-gray-700 font-medium">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-blue-600 transition-colors duration-200"
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Breadcrumb; 