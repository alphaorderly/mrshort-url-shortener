import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { LinkView } from '@/lib/api';
import { LinkRow } from './link-row';

const base: LinkView = {
  id: 7,
  code: 'abc1234',
  originalUrl: 'https://example.com/very/long/path',
  hasPassword: false,
  expiresAt: null,
  expired: false,
  createdAt: null,
  clickCount: 1234,
};

function setup(link: Partial<LinkView> = {}) {
  const onShowQr = vi.fn();
  const onDelete = vi.fn();
  render(
    <MemoryRouter>
      <ul>
        <LinkRow
          link={{ ...base, ...link }}
          baseUrl="https://s.example.com/"
          onShowQr={onShowQr}
          onDelete={onDelete}
        />
      </ul>
    </MemoryRouter>,
  );
  return { onShowQr, onDelete, user: userEvent.setup() };
}

describe('LinkRow', () => {
  it('짧은 주소, 원본 주소, 클릭 수를 보여 준다', () => {
    setup();
    expect(screen.getByText('s.example.com/abc1234')).toBeInTheDocument();
    expect(screen.getByText('example.com/very/long/path')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('통계 링크는 코드를 인코딩해서 연결한다', () => {
    setup({ code: '팀핸드북' });
    expect(screen.getByRole('link', { name: '통계' })).toHaveAttribute(
      'href',
      `/app/stats/${encodeURIComponent('팀핸드북')}`,
    );
  });

  it('비밀번호와 만료 상태를 배지로 보여 준다', () => {
    setup({ hasPassword: true, expiresAt: '2030-01-05T00:00:00Z' });
    expect(screen.getByText('비밀번호')).toBeInTheDocument();
    expect(screen.getByText(/만료$/)).toBeInTheDocument();
  });

  it('만료된 링크는 "만료됨" 으로 표시한다', () => {
    setup({ expiresAt: '2020-01-05T00:00:00Z', expired: true });
    expect(screen.getByText('만료됨')).toBeInTheDocument();
  });

  it('배지가 필요 없는 링크에는 배지 영역을 만들지 않는다', () => {
    setup();
    expect(screen.queryByText('비밀번호')).not.toBeInTheDocument();
    expect(screen.queryByText('만료됨')).not.toBeInTheDocument();
  });

  it('QR 과 삭제 버튼은 어느 링크인지 알 수 있는 이름을 가진다', async () => {
    const { user, onShowQr, onDelete } = setup();

    await user.click(screen.getByRole('button', { name: 's.example.com/abc1234 QR 코드 보기' }));
    expect(onShowQr).toHaveBeenCalledWith(expect.objectContaining({ code: 'abc1234' }));

    await user.click(screen.getByRole('button', { name: 's.example.com/abc1234 삭제' }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ code: 'abc1234' }));
  });
});
