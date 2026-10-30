import { useState } from 'react';
import { cn } from '@/lib/cn';
import { formatDayKey } from '@/lib/format';

export interface DayCount {
  date: string;
  count: number;
}

/**
 * 일별 클릭 수 막대그래프. 마우스를 올리거나 눌러서 날짜별 값을 읽을 수 있고,
 * 스크린 리더에는 같은 내용을 표로 제공한다.
 */
export function BarChart({ data }: { data: DayCount[] }) {
  const [active, setActive] = useState<number | null>(null);

  const max = Math.max(...data.map((day) => day.count), 0);
  const peak = data.reduce<DayCount | null>(
    (best, day) => (day.count > (best?.count ?? 0) ? day : best),
    null,
  );
  const shown = active !== null ? data[active] : null;

  return (
    <figure>
      <div
        role="img"
        aria-label={`최근 ${data.length}일 일별 클릭 수 막대그래프. 같은 내용을 담은 표가 아래에 있습니다.`}
        className="flex h-40 items-end gap-[3px] border-b border-line-strong"
        onPointerLeave={() => setActive(null)}
      >
        {data.map((day, index) => (
          <div
            key={day.date}
            className="flex h-full flex-1 items-end"
            onPointerEnter={() => setActive(index)}
            onClick={() => setActive(index)}
          >
            <div
              className={cn(
                'w-full rounded-t-[3px] transition-opacity',
                day.count === 0 ? 'h-0.5 bg-line-strong' : 'bg-ink',
                active !== null && active !== index && 'opacity-35',
              )}
              style={
                day.count > 0
                  ? { height: `${Math.max(4, (day.count / max) * 100)}%` }
                  : undefined
              }
            />
          </div>
        ))}
      </div>

      <figcaption className="mt-2 flex justify-between text-sm text-muted">
        <span>{formatDayKey(data[0].date)}</span>
        <span>{formatDayKey(data[data.length - 1].date)}</span>
      </figcaption>

      <p className="tabular mt-3 min-h-6 text-sm" aria-hidden>
        {shown ? (
          <>
            <strong className="font-semibold">{formatDayKey(shown.date)}</strong>{' '}
            <span className="text-muted">{shown.count}회 클릭</span>
          </>
        ) : peak ? (
          <span className="text-muted">
            가장 많았던 날은 {formatDayKey(peak.date)}, {peak.count}회입니다.
          </span>
        ) : (
          <span className="text-muted">이 기간에는 클릭이 없습니다.</span>
        )}
      </p>

      <table className="sr-only">
        <caption>일별 클릭 수</caption>
        <thead>
          <tr>
            <th scope="col">날짜</th>
            <th scope="col">클릭 수</th>
          </tr>
        </thead>
        <tbody>
          {data.map((day) => (
            <tr key={day.date}>
              <th scope="row">{formatDayKey(day.date)}</th>
              <td>{day.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
