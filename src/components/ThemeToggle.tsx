import React, { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 从localStorage中获取主题偏好，或使用系统默认
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 当黑暗模式状态改变时更新样式
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // 切换主题
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-colors ${
        isDarkMode
        ? 'bg-gray-700 text-yellow-200 hover:bg-gray-600'
        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      } ${className}`}
      title={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
      aria-label={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
    >
      {isDarkMode 
        ? <SunIcon className="w-5 h-5" /> 
        : <MoonIcon className="w-5 h-5" />
      }
    </button>
  );
};

export default ThemeToggle; 