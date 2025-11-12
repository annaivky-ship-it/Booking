import React, { useState } from 'react';
import { LoaderCircle, CheckCircle, Shield, Building2, X } from 'lucide-react';
import { PAY_ID_NAME, PAY_ID_EMAIL } from '../constants';

interface PayIDSimulationModalProps {
  amount: number;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

const PayIDSimulationModal: React.FC<PayIDSimulationModalProps> = ({ amount, onPaymentSuccess, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const handlePay = () => {
    setStatus('processing');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500); // Show success message before closing
    }, 2000); // Simulate processing time
  };

  const Content = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center text-center h-48">
            <LoaderCircle className="h-16 w-16 animate-spin text-orange-500" />
            <p className="mt-4 text-zinc-300 font-semibold">Processing Payment...</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center text-center h-48">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="mt-4 text-zinc-100 font-semibold text-xl">Payment Successful!</p>
            <p className="text-zinc-400">Your booking will be updated shortly.</p>
          </div>
        );
      case 'idle':
      default:
        return (
          <>
            <div className="text-center mb-6">
              <p className="text-zinc-400">You are about to pay</p>
              <p className="text-4xl font-bold text-white my-2">${amount.toFixed(2)}</p>
              <p className="text-zinc-400">to</p>
            </div>
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-700 flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-orange-500/20 text-orange-400 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6" />
                </div>
                <div>
                    <p className="font-semibold text-white">{PAY_ID_NAME}</p>
                    <p className="text-sm text-zinc-400">{PAY_ID_EMAIL}</p>
                </div>
            </div>
            <button onClick={handlePay} className="btn-primary w-full text-lg flex items-center justify-center gap-2">
              <Shield className="h-5 w-5" />
              Confirm & Pay
            </button>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="card-base !p-8 !bg-zinc-900 max-w-sm w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
            <X className="h-6 w-6" />
        </button>
        <Content />
      </div>
    </div>
  );
};

export default PayIDSimulationModal;
