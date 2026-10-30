import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BarChart } from './bar-chart';

const data = [
  { date: '2026-10-28', count: 0 },
  { date: '2026-10-29', count: 3 },
  { date: '2026-10-30', count: 9 },
];

describe('BarChart', () => {
  it('스크린 리더용 표에 모든 날짜를 담는다', () => {
    render(<BarChart data={data} />);
    const table = screen.getByRole('table', { name: '일별 클릭 수' });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(4);
    expect(within(rows[3]).getByText('9')).toBeInTheDocument();
  });

  it('기본으로 가장 많았던 날을 알려 준다', () => {
    render(<BarChart data={data} />);
    expect(screen.getByText(/가장 많았던 날은 10월 30일, 9회/)).toBeInTheDocument();
  });

  it('막대를 가리키면 그 날의 값을 보여 준다', async () => {
    const user = userEvent.setup();
    const { container } = render(<BarChart data={data} />);
    const columns = container.querySelectorAll('[role="img"] > div');
    await user.hover(columns[1]);
    expect(screen.getByText('3회 클릭')).toBeInTheDocument();
  });

  it('클릭이 전혀 없으면 그렇게 알려 준다', () => {
    render(<BarChart data={data.map((day) => ({ ...day, count: 0 }))} />);
    expect(screen.getByText('이 기간에는 클릭이 없습니다.')).toBeInTheDocument();
  });
});
