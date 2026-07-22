import React from 'react';
import Head from 'next/head';
import { useTheme } from '../../context/ThemeContext';
import { FaLaptopCode, FaWrench, FaCogs, FaPlay } from 'react-icons/fa';

const AutomationPage = () => {
  const { theme } = useTheme();

  return (
    <>
      <Head>
        <title>Automation Hub (Experimental) | TeamLabs</title>
      </Head>
      <div className="mx-auto max-w-6xl py-8 px-4">
        {/* Header */}
        <div className="relative mb-12 p-8 rounded-2xl overflow-hidden bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
          <div className="relative z-10">
            <span className="px-3 py-1 rounded-full bg-purple-500/25 border border-purple-500/35 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              Experimental Area
            </span>
            <h1 className="text-4xl font-extrabold mt-4 mb-3 tracking-tight">Automation Hub</h1>
            <p className="text-purple-100 max-w-2xl text-lg font-light leading-relaxed">
              Design, test, and execute custom workflows and rules to automate tasks, sync team updates, and streamline your software delivery pipeline.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl border transition-all duration-300 bg-white border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.01] dark:bg-zinc-900/40 dark:border-zinc-800/85">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
              <FaWrench size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Rule Builder</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
              Create simple Trigger-Condition-Action rules to automate notifications, assign tasks on status changes, or sync releases.
            </p>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Coming Soon</span>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl border transition-all duration-300 bg-white border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.01] dark:bg-zinc-900/40 dark:border-zinc-800/85">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
              <FaCogs size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Webhooks & Integrations</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
              Connect external services to dispatch events directly into your projects, trigger releases, or alert active channels.
            </p>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Coming Soon</span>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl border transition-all duration-300 bg-white border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.01] dark:bg-zinc-900/40 dark:border-zinc-800/85">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
              <FaPlay size={18} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Automated CI/CD Actions</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
              Integrate with GitHub Actions to track pipeline status, auto-complete issues, and publish release summaries.
            </p>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Coming Soon</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default AutomationPage;
