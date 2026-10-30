import { Link } from 'react-router';
import { PublicLayout } from '@/components/public-layout';
import { buttonVariants } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/use-page-title';

export function NotFoundPage() {
  usePageTitle('찾을 수 없음');

  return (
    <PublicLayout>
      <h1 className="text-4xl font-semibold">링크를 찾을 수 없습니다</h1>
      <p className="mt-3 text-muted">
        주소가 잘못됐거나, 링크가 삭제됐거나, 만료됐을 수 있습니다. 링크를 보낸 사람에게
        주소를 다시 확인해 달라고 요청하세요.
      </p>
      <Link to="/~" className={buttonVariants({ variant: 'secondary' }) + ' mt-8'}>
        홈으로
      </Link>
    </PublicLayout>
  );
}
