import { Route, Routes } from 'react-router';
import { RequireAuth } from '@/components/require-auth';
import { AccountPage } from '@/pages/account';
import { DashboardPage } from '@/pages/dashboard';
import { LoginPage } from '@/pages/login';
import { NotFoundPage } from '@/pages/not-found';
import { RegisterPage } from '@/pages/register';
import { StatsPage } from '@/pages/stats';
import { UnlockPage } from '@/pages/unlock';

export function App() {
  return (
    <Routes>
      <Route path="/~/login" element={<LoginPage />} />
      <Route path="/~/register/:token" element={<RegisterPage />} />
      <Route path="/~/unlock/:code" element={<UnlockPage />} />
      <Route path="/~" element={<RequireAuth />}>
        <Route index element={<DashboardPage />} />
        <Route path="stats/:code" element={<StatsPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>
      {/* 서버가 존재하지 않는 짧은 주소에도 이 앱을 404 로 내려 주므로 어디서든 이 화면이 뜬다. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
