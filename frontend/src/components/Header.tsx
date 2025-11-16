import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, User, Settings, Moon, Sun, Menu, X, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LoginDialog from './LoginDialog';
import RegisterDialog from './RegisterDialog';
import NotificationBell from './NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header className={`fixed top-0 left-0 right-0 z-50 w-full overflow-x-hidden transition-all duration-300 ${
      isScrolled 
        ? 'frosted-nav' 
        : 'bg-background border-b border-border'
    }`}>
      <div className="container mx-auto px-4 max-w-full">
        <div className="flex items-center justify-between gap-4 h-16 max-w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-all duration-300 flex-shrink-0">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ApnaGhar</span>
              <span className="text-[10px] text-muted-foreground -mt-1 uppercase tracking-wider font-medium">Verified Properties</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-2 relative" ref={navRef}>
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
            </div>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Mobile Menu */}
            <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9 rounded-xl"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[92vw] max-w-[400px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mb-4">
                  <DialogTitle className="flex items-center gap-2 text-center justify-center">
                    <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      ApnaGhar
                    </span>
                  </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col space-y-2 w-full max-w-full">
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 w-full ${
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
                        className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 w-full ${
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
                        className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 w-full ${
                          isActivePath('/dashboard')
                            ? 'text-primary bg-primary/10'
                            : 'text-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-white/10'
                        }`}
                      >
                        My Dashboard
                      </Link>
                    </>
                  )}

                  <div className="border-t pt-3 mt-3 w-full">
                    {isAuthenticated ? (
                      <div className="space-y-2 w-full">
                        <div className="px-2 sm:px-3 py-2 bg-muted/30 rounded-lg mb-3 w-full">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback className="text-xs bg-primary text-white">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs sm:text-sm font-semibold truncate">
                                {user?.first_name} {user?.last_name}
                              </div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                {user?.email}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Link
                          to="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-all w-full"
                        >
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span>My Profile</span>
                        </Link>
                        
                        <Link
                          to="/settings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-all w-full"
                        >
                          <Settings className="h-4 w-4 flex-shrink-0" />
                          <span>Settings</span>
                        </Link>
                        
                        <Link
                          to="/support"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-all w-full"
                        >
                          <MessageSquare className="h-4 w-4 flex-shrink-0" />
                          <span>Support</span>
                        </Link>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start h-10 text-xs sm:text-sm mt-2"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleLogout();
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          <span>Logout</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-10 text-xs sm:text-sm"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setLoginDialogOpen(true);
                          }}
                        >
                          Login
                        </Button>
                        <Button
                          variant="cta"
                          size="sm"
                          className="w-full h-10 text-xs sm:text-sm"
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
              </DialogContent>
            </Dialog>

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

            {/* Notification Bell - Only show when authenticated */}
            {isAuthenticated && <NotificationBell />}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 sm:w-auto sm:px-3 p-0 sm:p-2 rounded-xl">
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="text-xs bg-primary text-white">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium ml-2">
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
                  <DropdownMenuItem asChild>
                    <Link to="/support" className="flex items-center space-x-2 cursor-pointer">
                      <MessageSquare className="h-4 w-4" />
                      <span>Support</span>
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