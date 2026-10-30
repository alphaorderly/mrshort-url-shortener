import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function currentTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  return explicit === 'dark' || explicit === 'light' ? explicit : systemTheme();
}

/** 저장된 선택이 없으면 시스템 설정을 따르고, 한 번 바꾸면 그 선택을 기억한다. */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    if (document.documentElement.dataset.theme) return;
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return;
    const onChange = () => setTheme(systemTheme());
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 저장소를 쓸 수 없어도 현재 화면에는 적용된다.
    }
    setTheme(next);
  }, [theme]);

  return { theme, toggle };
}
