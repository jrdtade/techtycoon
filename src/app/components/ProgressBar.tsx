export function ProgressBar({ value, tone }: { value: number; tone?: 'good' | 'accent' }) {
  return (
    <div className="progress">
      <div className={`progress-fill ${tone ?? 'accent'}`} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}
