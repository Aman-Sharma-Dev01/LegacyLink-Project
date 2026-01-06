import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ variant = 'icon' }) => {
  const { theme, isDark, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme();

  // Simple icon toggle
  if (variant === 'icon') {
    return (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isDark ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </motion.div>
      </motion.button>
    );
  }

  // Dropdown variant with all options
  if (variant === 'dropdown') {
    return (
      <div className="relative group">
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
          {isDark ? (
            <Moon className="w-5 h-5 text-blue-400" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-500" />
          )}
          <span className="text-sm dark:text-slate-200">Theme</span>
        </button>
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <button
            onClick={setLightTheme}
            className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-t-lg ${
              theme === 'light' ? 'text-linkedin-blue' : 'dark:text-slate-200'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Light</span>
          </button>
          <button
            onClick={setDarkTheme}
            className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 ${
              theme === 'dark' ? 'text-linkedin-blue' : 'dark:text-slate-200'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dark</span>
          </button>
          <button
            onClick={setSystemTheme}
            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-b-lg dark:text-slate-200"
          >
            <Monitor className="w-4 h-4" />
            <span>System</span>
          </button>
        </div>
      </div>
    );
  }

  // Switch variant
  return (
    <div className="flex items-center gap-3">
      <Sun className={`w-4 h-4 ${!isDark ? 'text-yellow-500' : 'text-gray-400'}`} />
      <button
        onClick={toggleTheme}
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
          isDark ? 'bg-linkedin-blue' : 'bg-gray-300'
        }`}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
          animate={{ left: isDark ? '28px' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
      <Moon className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-gray-400'}`} />
    </div>
  );
};

export default ThemeToggle;
