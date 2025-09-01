import React, { useState } from 'react';
import { Button } from './button';
import { Menu, X, Home, User, Settings, FileText, Download } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface MobileNavProps {
  currentPath?: string;
  showUserMenu?: boolean;
}

export function MobileNav({ currentPath, showUserMenu = false }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navigationItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: User },
    { path: '/claimant-form', label: 'Claimant Info', icon: FileText },
    { path: '/download-report', label: 'Download Report', icon: Download },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="md:hidden">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMenu}
        className="p-2"
        aria-label="Toggle mobile menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleMenu}
          />
          
          {/* Mobile Menu Content */}
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMenu}
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <nav className="p-4">
              <div className="space-y-2">
                {navigationItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={toggleMenu}
                    className={`mobile-nav-item flex items-center space-x-3 rounded-md ${
                      currentPath === path ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
              
              {showUserMenu && (
                <div className="mt-6 pt-6 border-t">
                  <div className="space-y-2">
                    <Link
                      to="/edit-profile"
                      onClick={toggleMenu}
                      className="mobile-nav-item flex items-center space-x-3 rounded-md text-gray-700"
                    >
                      <Settings className="h-5 w-5" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        localStorage.clear();
                        navigate('/');
                        toggleMenu();
                      }}
                      className="mobile-nav-item flex items-center space-x-3 rounded-md text-red-600 w-full text-left"
                    >
                      <User className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

export default MobileNav;
