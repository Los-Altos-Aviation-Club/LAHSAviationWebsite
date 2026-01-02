import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white py-12 px-6 border-t border-gray-100">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-xs text-secondary font-medium flex flex-col gap-2 md:gap-1 text-center md:text-left">
          <p>&copy; {new Date().getFullYear()} LAHS Aviation Club. All rights reserved.</p>
          <p className="opacity-70">Website created by Manxuan Zhang</p>
        </div>
        
        <div className="flex gap-6">
          <a href="#" className="text-xs text-secondary hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="text-xs text-secondary hover:text-primary transition-colors">Terms of Use</a>
          <a href="#" className="text-xs text-secondary hover:text-primary transition-colors">Site Map</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;