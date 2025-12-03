'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  href?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'yellow' | 'red';
  description?: string;
}

const colorClasses = {
  blue: {
    gradient: 'from-blue-600/20 to-blue-800/20',
    border: 'border-blue-500/30 hover:border-blue-400/50',
    icon: 'text-blue-400',
    text: 'text-blue-300',
  },
  green: {
    gradient: 'from-green-600/20 to-green-800/20',
    border: 'border-green-500/30 hover:border-green-400/50',
    icon: 'text-green-400',
    text: 'text-green-300',
  },
  orange: {
    gradient: 'from-orange-600/20 to-orange-800/20',
    border: 'border-[#FF9933]/30 hover:border-[#FFAD33]/50',
    icon: 'text-[#FF9933]',
    text: 'text-[#FFAD33]',
  },
  purple: {
    gradient: 'from-purple-600/20 to-purple-800/20',
    border: 'border-purple-500/30 hover:border-purple-400/50',
    icon: 'text-purple-400',
    text: 'text-purple-300',
  },
  yellow: {
    gradient: 'from-yellow-600/20 to-yellow-800/20',
    border: 'border-yellow-500/30 hover:border-yellow-400/50',
    icon: 'text-yellow-400',
    text: 'text-yellow-300',
  },
  red: {
    gradient: 'from-red-600/20 to-red-800/20',
    border: 'border-red-500/30 hover:border-red-400/50',
    icon: 'text-red-400',
    text: 'text-red-300',
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  href,
  color = 'blue',
  description,
}: StatsCardProps) {
  const classes = colorClasses[color];

  const CardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative overflow-hidden rounded-xl p-6
        bg-gradient-to-br ${classes.gradient}
        border ${classes.border}
        backdrop-blur-xl
        transition-all duration-200
        ${href ? 'hover:scale-[1.02] cursor-pointer' : ''}
        group
      `}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg bg-black/20 ${classes.icon}`}>
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <div
              className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="text-3xl font-bold text-zinc-50">
            {value}
          </div>
          <div className={`text-sm font-medium ${classes.text}`}>
            {title}
          </div>
          {description && (
            <div className="text-xs text-zinc-400 mt-1">
              {description}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{CardContent}</Link>;
  }

  return CardContent;
}
