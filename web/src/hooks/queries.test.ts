import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { clearUserData, queryKeys } from './queries';

describe('clearUserData', () => {
  it('로그인 상태와 설정은 남기고 사용자 데이터 캐시만 지운다', () => {
    const client = new QueryClient();
    client.setQueryData(queryKeys.me, null);
    client.setQueryData(queryKeys.config, { serviceName: 'MrShort' });
    client.setQueryData(queryKeys.links, [{ code: 'abc' }]);
    client.setQueryData(queryKeys.stats('abc'), { total: 3 });
    client.setQueryData(['invite', 'token'], true);

    clearUserData(client);

    expect(client.getQueryData(queryKeys.me)).toBeNull();
    expect(client.getQueryState(queryKeys.me)).toBeDefined();
    expect(client.getQueryData(queryKeys.config)).toEqual({ serviceName: 'MrShort' });
    expect(client.getQueryData(queryKeys.links)).toBeUndefined();
    expect(client.getQueryData(queryKeys.stats('abc'))).toBeUndefined();
    expect(client.getQueryData(['invite', 'token'])).toBeUndefined();
  });
});
