import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color = 'bg-gray-100 text-gray-600', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${color} ${className}`}>
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  map?: Record<string, { label: string; color: string }>;
}

export function StatusBadge({ status, map = {} }: StatusBadgeProps) {
  const config = map[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return <Badge color={config.color}>{config.label}</Badge>;
}
