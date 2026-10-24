import { formatDate } from '../../sim';
import { useGame } from '../store';

export function EventLog() {
  const log = useGame((s) => s.game!.log);
  const entries = log.slice(-60).reverse();
  return (
    <section className="panel event-log">
      <h2>News & events</h2>
      <ul>
        {entries.map((e) => (
          <li key={e.seq} className={`log-${e.kind} ${e.important ? 'important' : ''}`}>
            <span className="log-date">{formatDate(e.week)}</span>
            <span className="log-text">{e.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
