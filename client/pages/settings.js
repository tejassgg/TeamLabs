import { useTheme } from '../context/ThemeContext';
import Head from 'next/head';
import Layout from '../components/Layout';

const Settings = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return (
    <Layout>
      <div className={`max-w-xl mx-auto py-12`}>
        <h2 className="text-2xl font-bold mb-6">Settings</h2>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Theme</h3>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={() => setTheme('light')}
              />
              Light
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => setTheme('dark')}
              />
              Dark
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="system"
                checked={theme === 'system'}
                onChange={() => setTheme('system')}
              />
              System (follows your OS/browser)
            </label>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Current effective theme: </span>
            <span className="font-semibold">{resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1)}</span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings; 