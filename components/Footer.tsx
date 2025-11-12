import React from 'react';

interface FooterProps {
  onShowPrivacyPolicy: () => void;
  onShowTermsOfService: () => void;
}

const Footer: React.FC<FooterProps> = ({ onShowPrivacyPolicy, onShowTermsOfService }) => {
  return (
    <footer className="mt-16 py-8 border-t border-zinc-800">
      <div className="container mx-auto px-4 text-center text-zinc-500">
        <div className="flex justify-center gap-6 mb-4">
            <a href="#" onClick={(e) => { e.preventDefault(); onShowPrivacyPolicy(); }} className="text-sm text-zinc-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onShowTermsOfService(); }} className="text-sm text-zinc-400 hover:text-white transition-colors">Terms of Service</a>
        </div>
        <p>&copy; {new Date().getFullYear()} Flavor Entertainers. All Rights Reserved.</p>
        <p className="text-xs mt-2">Secure and Professional Entertainment Services in Western Australia.</p>
      </div>
    </footer>
  );
};

export default Footer;