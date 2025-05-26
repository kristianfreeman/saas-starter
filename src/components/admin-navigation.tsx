import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BarChart3,
  Activity,
  FileText,
  Settings,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminNavigationProps {
  currentPath?: string;
}

const navItems = [
  { 
    name: 'Overview', 
    href: '/admin', 
    icon: LayoutDashboard,
    exact: true 
  },
  { 
    name: 'Users', 
    href: '/admin/users', 
    icon: Users 
  },
  { 
    name: 'Subscriptions', 
    href: '/admin/subscriptions', 
    icon: CreditCard 
  },
  { 
    name: 'Analytics', 
    href: '/admin/analytics', 
    icon: BarChart3 
  },
  { 
    name: 'System Health', 
    href: '/admin/health', 
    icon: Activity 
  },
  { 
    name: 'Audit Logs', 
    href: '/admin/audit', 
    icon: FileText 
  },
  { 
    name: 'Settings', 
    href: '/admin/settings', 
    icon: Settings 
  },
];

export function AdminNavigation({ currentPath = '/admin' }: AdminNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return currentPath === href;
    }
    return currentPath.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">Admin Panel</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navItems.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={cn(
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                          isActive(item.href, item.exact)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-6 w-6 shrink-0',
                            isActive(item.href, item.exact)
                              ? 'text-primary'
                              : 'text-muted-foreground group-hover:text-foreground'
                          )}
                        />
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <a
                  href="/dashboard"
                  className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <LayoutDashboard className="h-6 w-6 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  Back to Dashboard
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-background px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="-m-2.5 p-2.5 lg:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open sidebar</span>
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold">Admin</span>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="relative z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="-m-2.5 p-2.5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                  <span className="sr-only">Close sidebar</span>
                </Button>
              </div>
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  <span className="text-xl font-semibold">Admin Panel</span>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navItems.map((item) => (
                          <li key={item.name}>
                            <a
                              href={item.href}
                              className={cn(
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                                isActive(item.href, item.exact)
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              )}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <item.icon
                                className={cn(
                                  'h-6 w-6 shrink-0',
                                  isActive(item.href, item.exact)
                                    ? 'text-primary'
                                    : 'text-muted-foreground group-hover:text-foreground'
                                )}
                              />
                              {item.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                    <li className="mt-auto">
                      <a
                        href="/dashboard"
                        className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <LayoutDashboard className="h-6 w-6 shrink-0 text-muted-foreground group-hover:text-foreground" />
                        Back to Dashboard
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}