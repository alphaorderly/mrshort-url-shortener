import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type CreateLinkInput } from '@/lib/api';

export const queryKeys = {
  config: ['config'] as const,
  me: ['me'] as const,
  links: ['links'] as const,
  stats: (code: string) => ['stats', code] as const,
};

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
      client.removeQueries({ queryKey: queryKeys.links });
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
