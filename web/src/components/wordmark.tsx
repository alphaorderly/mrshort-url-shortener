/** 서비스 이름. 형광펜으로 그은 듯한 배경이 이 서비스의 로고를 대신한다. */
export function Wordmark({ name }: { name: string }) {
  return (
    <span className="text-lg font-semibold tracking-tight">
      <span className="marker">{name}</span>
    </span>
  );
}
