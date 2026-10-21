import { STATUS_META } from '../lib/constants';

export default function StatusPill({ status, label }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return <span className={`pill pill-${meta.color}`}><i className="status-dot"/>{label || meta.label}</span>;
}
