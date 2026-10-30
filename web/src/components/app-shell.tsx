import { LogOut, Moon, Sun } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/wordmark';
import { useConfig, useLogout } from '@/hooks/queries';
import { cn } from '@/lib/cn';
import { useTheme } from '@/lib/theme';

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex h-10 items-center text-sm',
    isActive
      ? 'font-semibold text-ink underline decoration-2 underline-offset-[10px]'
      : 'text-muted hover:text-ink',
  );

/** 로그인한 사용자의 화면 틀: 상단 메뉴와 본문 */
export function AppShell() {
  const { data: config } = useConfig();
  const { theme, toggle } = useTheme();
  const logout = useLogout();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-field focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        본문으로 건너뛰기
      </a>
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 sm:px-6">
          <Link to="/app">
            <Wordmark name={config?.serviceName ?? 'MrShort'} />
          </Link>
          <nav aria-label="주 메뉴" className="flex gap-5">
            <NavLink to="/app" end className={navClass}>
              링크
            </NavLink>
            <NavLink to="/app/account" className={navClass}>
              계정
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={theme === 'dark' ? '라이트 모드로 바꾸기' : '다크 모드로 바꾸기'}
            >
              {theme === 'dark' ? (
                <Sun className="size-5" aria-hidden />
              ) : (
                <Moon className="size-5" aria-hidden />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="size-4" aria-hidden />
              로그아웃
            </Button>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:px-6">
        <Outlet />
      </main>
    </>
  );
}
