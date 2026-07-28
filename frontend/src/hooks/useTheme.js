import { useApp } from '../context/AppContext.jsx';

export function useTheme() {
  const { darkMode, toggleDarkMode } = useApp();
  return { darkMode, toggleDarkMode };
}
