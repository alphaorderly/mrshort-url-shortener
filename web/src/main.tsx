import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Toaster } from 'sonner';
import { App } from './app';
import { clearUserData, queryKeys } from './hooks/queries';
import './index.css';
import { ApiError, setUnauthorizedHandler } from './lib/api';
import { useTheme } from './lib/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // 4xx 는 다시 시도해도 같은 결과이므로 바로 보여 준다.
      retry: (count, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        count < 2,
    },
  },
});

// 세션이 만료되면 어떤 요청이든 로그인 상태를 지워서 로그인 화면으로 보낸다.
setUnauthorizedHandler(() => {
  queryClient.setQueryData(queryKeys.me, null);
  clearUserData(queryClient);
});

function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="bottom-center"
      toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }}
    />
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <ThemedToaster />
    </QueryClientProvider>
  </StrictMode>,
);
