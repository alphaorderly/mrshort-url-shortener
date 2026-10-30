import { useEffect } from 'react';
import { useConfig } from '@/hooks/queries';

/** 탭 제목을 "페이지 이름 - 서비스 이름" 으로 맞춘다. */
export function usePageTitle(title: string): void {
  const { data } = useConfig();
  const serviceName = data?.serviceName ?? 'MrShort';

  useEffect(() => {
    document.title = `${title} - ${serviceName}`;
  }, [title, serviceName]);
}
