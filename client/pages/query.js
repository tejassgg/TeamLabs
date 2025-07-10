import { FaRegLightbulb } from 'react-icons/fa';
import { useThemeClasses } from '../components/kanbanUtils';

export default function Query() {
  const getThemeClasses = useThemeClasses();
  return (
    <div className={getThemeClasses(
      'min-h-screen flex flex-col items-center justify-center bg-white',
      'dark:bg-[#18181b]'
    )}>
      <div className="flex flex-col items-center justify-center p-8 rounded-xl shadow-md">
        <FaRegLightbulb className={getThemeClasses('text-yellow-400 mb-4', 'dark:text-yellow-300')} size={64} />
        <h1 className={getThemeClasses('text-3xl font-bold mb-2 text-gray-900', 'dark:text-gray-100')}>Query Board Coming Soon</h1>
        <p className={getThemeClasses('text-lg text-gray-600 mb-6', 'dark:text-gray-400')}>We are working hard to bring you this feature. Stay tuned!</p>
        <a href="/dashboard" className={getThemeClasses(
          'px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium shadow hover:from-blue-600 hover:to-purple-600 transition-all',
          'dark:from-blue-700 dark:to-purple-700 dark:hover:from-blue-800 dark:hover:to-purple-800'
        )}>
          Back to Dashboard
        </a>
      </div>
    </div>
  );
} 