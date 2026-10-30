import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { api, type CreateLinkInput } from '@/lib/api';

export const queryKeys = {
  config: ['config'] as const,
  me: ['me'] as const,
  links: ['links'] as const,
  stats: (code: string) => ['stats', code] as const,
};

/**
 * 로그아웃하거나 세션이 끝났을 때, 그 사용자의 링크·통계 같은 캐시를 지운다.
 * 같은 브라우저에서 다음 사람이 로그인했을 때 이전 사람의 데이터가 잠깐이라도 보이지 않게 하기 위해서다.
 * 로그인 상태(me)와 공개 설정(config)은 화면이 계속 쓰므로 남겨 둔다.
 */
export function clearUserData(client: QueryClient): void {
  const keep: readonly unknown[] = [queryKeys.me[0], queryKeys.config[0]];
  client.removeQueries({ predicate: (query) => !keep.includes(query.queryKey[0]) });
}

export function useConfig() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: api.config,
    staleTime: Infinity,
  });
}

/** 로그인하지 않았으면 data 가 null 이다. */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: api.me,
    staleTime: 60_000,
    retry: false,
  });
}

export function useLinks() {
  return useQuery({ queryKey: queryKeys.links, queryFn: api.links });
}

export function useLinkStats(code: string) {
  return useQuery({
    queryKey: queryKeys.stats(code),
    queryFn: () => api.linkStats(code),
    retry: false,
  });
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { username: string; password: string }) =>
      api.login(input.username, input.password),
    onSuccess: (user) => client.setQueryData(queryKeys.me, user),
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      client.setQueryData(queryKeys.me, null);
      clearUserData(client);
    },
  });
}

export function useRegister() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.register,
    onSuccess: (user) => client.setQueryData(queryKeys.me, user),
  });
}

export function useCreateLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLinkInput) => api.createLink(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.links }),
  });
}

export function useDeleteLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.deleteLink(code),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.links }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      api.changePassword(input.currentPassword, input.newPassword),
  });
}

export function useCreateInvite() {
  return useMutation({ mutationFn: api.createInvite });
}
