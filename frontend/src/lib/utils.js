import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status) {
  const colors = {
    active: 'text-accent-success bg-accent-success/10',
    pending: 'text-accent-warning bg-accent-warning/10',
    suspended: 'text-accent-error bg-accent-error/10',
    cancelled: 'text-text-muted bg-text-muted/10',
    paid: 'text-accent-success bg-accent-success/10',
    unpaid: 'text-accent-warning bg-accent-warning/10',
    overdue: 'text-accent-error bg-accent-error/10',
    open: 'text-primary bg-primary/10',
    closed: 'text-text-muted bg-text-muted/10',
    resolved: 'text-accent-success bg-accent-success/10',
  };
  return colors[status?.toLowerCase()] || 'text-text-secondary bg-text-secondary/10';
}

export function getPriorityColor(priority) {
  const colors = {
    low: 'text-text-secondary bg-text-secondary/10',
    medium: 'text-accent-warning bg-accent-warning/10',
    high: 'text-accent-error bg-accent-error/10',
    urgent: 'text-accent-error bg-accent-error/20 border border-accent-error/50',
  };
  return colors[priority?.toLowerCase()] || 'text-text-secondary bg-text-secondary/10';
}
