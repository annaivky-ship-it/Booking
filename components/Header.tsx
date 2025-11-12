
import React from 'react';
import { Search } from 'lucide-react';

interface HeaderProps {
  children?: React.ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ children, searchQuery, onSearchChange }) => {
  return (
    <header className="bg-black/30 backdrop-blur-lg sticky top-0 z-50 border-b border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <a href="/" className="flex flex-col items-start cursor-pointer no-underline group">
            <div className="flex items-center">
                <span className="font-logo-main text-2xl sm:text-3xl tracking-wider text-white group-hover:text-orange-400 transition-colors duration-300">FLAV</span>
                <span className="text-2xl sm:text-3xl mx-[-0.15em] relative transform group-hover:scale-110 transition-transform duration-300" style={{top: "-0.05em"}}>🍑</span>
                <span className="font-logo-main text-2xl sm:text-3xl tracking-wider text-white group-hover:text-orange-400 transition-colors duration-300">R</span>
            </div>
            <span className="font-logo-sub text-sm sm:text-base text-zinc-500 -mt-1 ml-1 tracking-wide group-hover:text-zinc-300 transition-colors duration-300">entertainers</span>
          </a>
          <nav className="flex items-center gap-2">
             <div className="relative hidden md:block mr-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search performers..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="input-base !w-48 sm:!w-52 !pl-10 !py-2 !bg-zinc-800/80 focus:!bg-zinc-800 transition-all duration-300 focus:!w-64 sm:focus:!w-72"
                    aria-label="Search for performers by name, tagline, or service"
                />
            </div>
            {children}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
