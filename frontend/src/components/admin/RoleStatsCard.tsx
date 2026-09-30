import React from 'react';

interface RoleStatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
}

const colorClasses = {
  blue: 'bg-forest-500',
  green: 'bg-forest-500',
  purple: 'bg-terracotta-500',
  orange: 'bg-ochre-500',
  red: 'bg-terracotta-500',
  yellow: 'bg-ochre-500',
};

const iconBgClasses = {
  blue: 'bg-forest-100',
  green: 'bg-forest-100',
  purple: 'bg-terracotta-100',
  orange: 'bg-ochre-100',
  red: 'bg-terracotta-100',
  yellow: 'bg-ochre-100',
};

const iconTextClasses = {
  blue: 'text-forest-600',
  green: 'text-forest-600',
  purple: 'text-terracotta-600',
  orange: 'text-ochre-600',
  red: 'text-terracotta-600',
  yellow: 'text-ochre-600',
};

export default function RoleStatsCard({ title, value, icon: Icon, color }: RoleStatsCardProps) {
  return (
    <div className="bg-white rounded-md shadow p-6 border border-border/60">
      <div className="flex items-center">
        <div className={`p-3 rounded-md ${iconBgClasses[color]}`}>
          <Icon className={`w-6 h-6 ${iconTextClasses[color]}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-stone">{title}</p>
          <p className="text-2xl font-bold text-charcoal">{value}</p>
        </div>
      </div>
    </div>
  );
}

