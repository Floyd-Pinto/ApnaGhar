import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, User, Settings, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="p-1.5 bg-primary rounded">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-primary">ApnaGhar</span>
              <span className="text-[10px] text-muted-foreground -mt-1 uppercase tracking-wide">Verified Properties</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center">
            {/* base and active classes */}
            {/** We keep spacing with px on links and add small vertical separators between the three main items. */}
            {(() => {
              const base = 'px-4 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded transition-colors';
              const active = 'text-orange-500 font-semibold border-b-2 border-orange-400';
              return (
                <>
                  <Link to="/" className={`${base} ${isActive('/') ? active : ''}`}>
                    Home
                  </Link>

                  {isAuthenticated && (
                    <>
                      {/* small orange vertical separator between Home and Explore Projects */}
                      <span className="hidden md:inline-block w-px h-5 bg-orange-400 mx-2" aria-hidden />

                      <Link to="/explore-projects" className={`${base} ${isActive('/explore-projects') ? active : ''}`}>
                        Explore Projects
                      </Link>

                      {/* separator between Explore Projects and My Dashboard */}
                      <span className="hidden md:inline-block w-px h-5 bg-orange-400 mx-2" aria-hidden />

                      <Link
                        to={user?.role === 'builder' ? '/dashboard/builder' : '/dashboard/buyer'}
                        className={`${base} ${isActive('/dashboard') ? active : ''}`}
                      >
                        My Dashboard
                      </Link>

                      {/* if builder, keep a subtle separator then Post Property */}
                      {user?.role === 'builder' && (
                        <>
                          <span className="hidden md:inline-block w-px h-5 bg-slate-200 mx-2" aria-hidden />
                          <Link to="/projects" className={`${base} ${isActive('/projects') ? active : ''}`}>
                            Post Property
                          </Link>
                        </>
                      )}
                    </>
                  )}
                </>
              );
            })()}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 h-9">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="text-xs bg-primary text-white">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.first_name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2">
                    <div className="text-sm font-semibold">
                      {user?.first_name} {user?.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user?.email}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center space-x-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      to={user?.role === 'builder' ? '/dashboard/builder' : '/dashboard/buyer'} 
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Shield className="h-4 w-4" />
                      <span>My Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center space-x-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex h-9 text-sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary-hover h-9 text-sm font-semibold" asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;