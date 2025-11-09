import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-background">ApnaGhar</span>
                <span className="text-xs text-background/70 -mt-1">Trusted Real Estate</span>
              </div>
            </div>
            <p className="text-background/70 mb-4 max-w-md">
              Revolutionizing real estate with blockchain-verified transparency, 
              real-time construction tracking, and secure fractional ownership.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-background/70" />
                <span className="text-background/70">contact@apnaghar.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-background/70" />
                <span className="text-background/70">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-background/70" />
                <span className="text-background/70">Mumbai, Maharashtra, India</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-background mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-background/70 hover:text-background transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/explore-projects" className="text-background/70 hover:text-background transition-colors">
                  Explore Projects
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-background/70 hover:text-background transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-background/70 hover:text-background transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-background mb-4">Services</h3>
            <ul className="space-y-2">
              <li className="text-background/70">Blockchain Verification</li>
              <li className="text-background/70">Construction Tracking</li>
              <li className="text-background/70">Fractional Ownership</li>
              <li className="text-background/70">Investment Advisory</li>
            </ul>
          </div>
        </div>

        <hr className="border-background/20 my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-background/70 text-sm">
            © 2024 ApnaGhar. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-background/70 hover:text-background text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-background/70 hover:text-background text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;