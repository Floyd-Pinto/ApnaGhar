import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, User, Settings, Moon, Sun, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LoginDialog from './LoginDialog';
import RegisterDialog from './RegisterDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Update sliding indicator on route change
  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return;
      
      const activeLink = navRef.current.querySelector('a[data-active="true"]') as HTMLElement;
      const indicator = navRef.current.querySelector('.nav-indicator') as HTMLElement;
      
      if (activeLink && indicator) {
        const navRect = navRef.current.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();
        indicator.style.width = `${linkRect.width}px`;
        indicator.style.transform = `translateX(${linkRect.left - navRect.left}px)`;
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(updateIndicator, 0);
  }, [location.pathname, isAuthenticated]);

  return (
    <header className="frosted-nav sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-all duration-300">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ApnaGhar</span>
              <span className="text-[10px] text-muted-foreground -mt-1 uppercase tracking-wider font-medium">Verified Properties</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-2 relative" ref={navRef}>
            {/* Sliding indicator */}
            <div 
              className="nav-indicator absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-out rounded-full"
              style={{ width: 0, transform: 'translateX(0)' }}
            />
            
            <Link 
              to="/" 
              data-active={isActivePath('/') && location.pathname === '/'}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 relative ${
                isActivePath('/') && location.pathname === '/'
                  ? 'text-primary'
                  : 'text-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-white/10'
              }`}
            >
              Home
            </Link>
            {isAuthenticated && (
              <>
                <Link 
                  to="/explore-projects"
                  data-active={isActivePath('/explore-projects')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 relative ${
                    isActivePath('/explore-projects')
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-white/10'
                  }`}
                >
                  Explore Projects
                </Link>
                <Link 
                  to={user?.role === 'builder' ? '/dashboard/builder' : '/dashboard/buyer'}
                  data-active={isActivePath('/dashboard')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 relative ${
                    isActivePath('/dashboard')
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-white/10'
                  }`}
                >
                  My Dashboard
                </Link>
              </>
            )}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9 rounded-xl"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      ApnaGhar
                    </span>
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-8 flex flex-col space-y-4">
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 text-base font-semibold rounded-xl transition-all duration-300 ${
                      isActivePath('/') && location.pathname === '/'
                        ? 'text-primary bg-primary/10'
                        : 'text-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-white/10'
                    }`}
                  >
                    Home
                  </Link>

                  {isAuthenticated && (
                    <>
                      <Link
                        to="/explore-projects"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-4 py-3 text-base font-semibold rounded-xl transition-all duration-300 ${
                          isActivePath('/explore-projects')
                            ? 'text-primary bg-primary/10'
                            : 'text-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-white/10'
                        }`}
                      >
                        Explore Projects
                      </Link>
                      <Link
                        to={user?.role === 'builder' ? '/dashboard/builder' : '/dashboard/buyer'}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-4 py-3 text-base font-semibold rounded-xl transition-all duration-300 ${
                          isActivePath('/dashboard')
                            ? 'text-primary bg-primary/10'
                            : 'text-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-white/10'
                        }`}
                      >
                        My Dashboard
                      </Link>
                    </>
                  )}

                  <div className="border-t pt-4 mt-4">
                    {isAuthenticated ? (
                      <div className="space-y-4">
                        <div className="px-4 py-2">
                          <div className="flex items-center space-x-3 mb-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback className="text-sm bg-primary text-white">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-semibold">
                                {user?.first_name} {user?.last_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user?.email}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Link
                          to="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 text-base rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-all"
                        >
                          <User className="h-5 w-5" />
                          <span>My Profile</span>
                        </Link>
                        
                        <Link
                          to="/settings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 text-base rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-all"
                        >
                          <Settings className="h-5 w-5" />
                          <span>Settings</span>
                        </Link>
                        
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleLogout();
                          }}
                        >
                          <LogOut className="h-5 w-5 mr-3" />
                          <span>Logout</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setLoginDialogOpen(true);
                          }}
                        >
                          Login
                        </Button>
                        <Button
                          variant="cta"
                          className="w-full"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setRegisterDialogOpen(true);
                          }}
                        >
                          Sign Up
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl"
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
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden sm:inline-flex h-9 px-4 text-sm" 
                  onClick={() => setLoginDialogOpen(true)}
                >
                  Login
                </Button>
                <Button 
                  variant="cta" 
                  size="sm" 
                  className="h-9 px-4 text-sm font-semibold" 
                  onClick={() => setRegisterDialogOpen(true)}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <LoginDialog 
        open={loginDialogOpen} 
        onOpenChange={setLoginDialogOpen}
        onSwitchToRegister={() => {
          setLoginDialogOpen(false);
          setRegisterDialogOpen(true);
        }}
      />
      
      <RegisterDialog 
        open={registerDialogOpen} 
        onOpenChange={setRegisterDialogOpen}
        onSwitchToLogin={() => {
          setRegisterDialogOpen(false);
          setLoginDialogOpen(true);
        }}
      />
    </header>
  );
};

export default Header;