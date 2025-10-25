'use client';

import { memo } from 'react';

interface NumberProps {
  value: number | string;
  className?: string;
  color?: 'green' | 'red' | 'neutral';
  animate?: boolean;
}

export const Number = memo(function Number({
  value,
  className = '',
  color = 'neutral',
  animate = false,
}: NumberProps) {
  const colorClass = {
    green: 'text-green-500',
    red: 'text-red-500',
    neutral: 'text-foreground',
  }[color];

  const animationClass = animate
    ? color === 'green'
      ? 'animate-tick-up'
      : color === 'red'
      ? 'animate-tick-down'
      : ''
    : '';

  return (
    <span className={`font-mono tabular-nums ${colorClass} ${animationClass} ${className}`}>
      {value}
    </span>
  );
});

