'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function NavigationLink({ href, children, className }: NavigationLinkProps) {
  const pathname = usePathname();
  
  // Special handling for root dashboard to avoid matching sub-routes
  const isActive = href === '/dashboard' 
    ? pathname === '/dashboard'
    : pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={cn(
        'text-sm transition-colors relative',
        isActive
          ? 'text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {children}
      {isActive && (
        <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary" />
      )}
    </Link>
  );
}