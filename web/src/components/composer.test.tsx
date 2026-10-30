import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api, ApiError, type LinkView } from '@/lib/api';
import { Composer } from './composer';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    api: { ...actual.api, config: vi.fn(), createLink: vi.fn() },
  };
});

const created: LinkView = {
  id: 1,
  code: 'abc1234',
  originalUrl: 'https://example.com/',
  hasPassword: false,
  expiresAt: null,
  expired: false,
  createdAt: null,
  clickCount: 0,
};

function setup() {
  const onCreated = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Composer onCreated={onCreated} />
    </QueryClientProvider>,
  );
  return { onCreated, user: userEvent.setup() };
}

describe('Composer', () => {
  beforeEach(() => {
    vi.mocked(api.config).mockResolvedValue({ serviceName: 'MrShort' });
    vi.mocked(api.createLink).mockReset();
  });

  it('주소가 비어 있으면 서버를 부르지 않고 안내한다', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: '줄이기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('줄일 주소를 입력하세요.');
    expect(api.createLink).not.toHaveBeenCalled();
  });

  it('프로토콜 없이 붙여 넣으면 https:// 를 붙여 만들고 입력란을 비운다', async () => {
    vi.mocked(api.createLink).mockResolvedValue(created);
    const { user, onCreated } = setup();

    const input = screen.getByLabelText('줄일 주소');
    await user.type(input, 'example.com');
    await user.click(screen.getByRole('button', { name: '줄이기' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created));
    expect(api.createLink).toHaveBeenCalledWith({
      url: 'https://example.com',
      expiresAt: undefined,
      password: undefined,
      code: undefined,
    });
    expect(input).toHaveValue('');
  });

  it('옵션을 켠 항목만 서버로 보낸다', async () => {
    vi.mocked(api.createLink).mockResolvedValue(created);
    const { user } = setup();

    await user.type(screen.getByLabelText('줄일 주소'), 'https://example.com');
    await user.click(screen.getByRole('button', { name: '비밀번호' }));
    await user.click(screen.getByRole('button', { name: '주소 직접 정하기' }));
    await user.type(screen.getByLabelText('링크 비밀번호'), 'secret');
    await user.type(screen.getByLabelText('짧은 주소'), '팀핸드북');
    await user.click(screen.getByRole('button', { name: '줄이기' }));

    await waitFor(() => expect(api.createLink).toHaveBeenCalled());
    expect(api.createLink).toHaveBeenCalledWith({
      url: 'https://example.com',
      expiresAt: undefined,
      password: 'secret',
      code: '팀핸드북',
    });
  });

  it('켠 옵션을 비워 두면 보내지 않고 해당 칸에 안내한다', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('줄일 주소'), 'https://example.com');
    await user.click(screen.getByRole('button', { name: '비밀번호' }));
    await user.click(screen.getByRole('button', { name: '줄이기' }));

    expect(await screen.findByText('링크 비밀번호를 입력하세요.')).toBeInTheDocument();
    expect(api.createLink).not.toHaveBeenCalled();
  });

  it('서버가 오류를 돌려주면 화면에 보여 준다', async () => {
    vi.mocked(api.createLink).mockRejectedValue(new ApiError(409, '이미 사용 중인 주소입니다.'));
    const { user } = setup();
    await user.type(screen.getByLabelText('줄일 주소'), 'https://example.com');
    await user.click(screen.getByRole('button', { name: '줄이기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('이미 사용 중인 주소입니다.');
  });

  it('옵션 버튼은 눌림 상태를 알려 준다', async () => {
    const { user } = setup();
    const toggle = screen.getByRole('button', { name: '만료일' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('만료일', { selector: 'input' })).toBeInTheDocument();
  });
});
