import { toneForState } from '../lib/status';

export function StatusBadge({ state }: { state: string }) {
  return <span className={`badge badge--${toneForState(state)}`}>{state}</span>;
}
