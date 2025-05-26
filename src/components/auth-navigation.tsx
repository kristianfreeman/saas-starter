import { useState } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/hooks';

interface NavigationProps {
  currentPath?: string;
  isAuthenticated?: boolean;
  userEmail?: string;
}

const publicNavItems = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'About', href: '/about' },
];

const authNavItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Profile', href: '/profile' },
  { name: 'Billing', href: '/billing' },
];

export function AuthNavigation({ currentPath = '/', isAuthenticated, userEmail }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useAuth();
  
  const navItems = isAuthenticated ? authNavItems : publicNavItems;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <a href={isAuthenticated ? '/dashboard' : '/'} className="mr-6 flex items-center space-x-2">
            <span className="font-bold sm:inline-block">
              SaaS Starter
            </span>
          </a>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  currentPath === item.href
                    ? 'text-foreground'
                    : 'text-foreground/60'
                )}
              >
                {item.name}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                    <User className="mr-2 h-4 w-4" />
                    {userEmail}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href="/profile">Profile</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/settings">Settings</a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                  <a href="/auth/login">Log in</a>
                </Button>
                <Button size="sm" asChild className="hidden md:inline-flex">
                  <a href="/auth/register">Sign up</a>
                </Button>
              </>
            )}
          </nav>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-3 pb-3 pt-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  currentPath === item.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground/60'
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="border-t pt-4 pb-3 space-y-1">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {userEmail}
                  </div>
                  <a
                    href="/settings"
                    className="block rounded-md px-3 py-2 text-base font-medium text-foreground/60 hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    Settings
                  </a>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-foreground/60 hover:bg-accent hover:text-accent-foreground"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/auth/login"
                    className="block rounded-md px-3 py-2 text-base font-medium text-foreground/60 hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    Log in
                  </a>
                  <a
                    href="/auth/register"
                    className="block rounded-md px-3 py-2 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign up
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}