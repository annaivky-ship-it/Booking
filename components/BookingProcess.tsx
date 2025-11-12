import React, { useState, useMemo, useEffect } from 'react';
import Confetti from 'react-confetti';
import type { Performer, Booking, BookingStatus, DoNotServeEntry, Communication, Service } from '../types';
import { allServices } from '../data/mockData';
import { DEPOSIT_PERCENTAGE } from '../constants';
import InputField from './InputField';
import BookingCostCalculator from './BookingCostCalculator';
import BookingConfirmationDialog from './BookingConfirmationDialog';
import PayIDSimulationModal from './PayIDSimulationModal';
import { ArrowLeft, User, Mail, Phone, Calendar, Clock, MapPin, PartyPopper, UploadCloud, ShieldCheck, Send, ListChecks, Info, AlertTriangle, ShieldX, CheckCircle, ChevronDown, FileText, LoaderCircle, Users as UsersIcon, Shield } from 'lucide-react';

export interface BookingFormState {
  fullName: string;
  email: string;
  mobile: string;
  eventDate: string;
  eventTime: string;
  eventAddress: string;
  eventType: string;
  duration: string;
  numberOfGuests: string;
  selectedServices: string[];
  idDocument: File | null;
  client_message: string;
}

interface BookingProcessProps {
  performers: Performer[];
  onBack: () => void;
  onBookingSubmitted: () => void;
  bookings: Booking[];
  onUpdateBookingStatus?: (bookingId: string, status: BookingStatus) => Promise<void>;
  onBookingRequest: (formState: BookingFormState, performers: Performer[]) => Promise<{success: boolean; message: string; bookingIds?: string[]}>;
  doNotServeList: DoNotServeEntry[];
  addCommunication: (commData: Omit<Communication, 'id' | 'created_at' | 'read'>) => Promise<void>;
  onShowPrivacyPolicy: () => void;
  onShowTermsOfService: () => void;
  initialSelectedServices?: string[];
}

type BookingStage = 'form' | 'performer_acceptance_pending' | 'vetting_pending' | 'deposit_pending' | 'deposit_confirmation_pending' | 'confirmed' | 'rejected';


const eventTypes = ['Bucks Party', 'Birthday Party', 'Corporate Event', 'Hens Party', 'Private Gathering', 'Other'];

interface FileUploadFieldProps {
  file: File | null;
  setFile: (f: File | null) => void;
  id: string;
  label: string;
  accept: string;
  error?: string;
}

// Custom hook for window dimensions
const useWindowSize = () => {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
};

const FileUploadField: React.FC<FileUploadFieldProps> = ({ file, setFile, id, label, accept, error }) => {
    const [internalError, setInternalError] = useState('');
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
                setInternalError('File size must be under 5MB.');
                setFile(null);
            } else {
                setInternalError('');
                setFile(selectedFile);
            }
        }
    };

    const displayError = internalError || error;

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-zinc-300 mb-2">{label}</label>
            <div className={`mt-2 flex justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors ${displayError ? 'border-red-500 bg-red-900/10' : 'border-zinc-700 bg-zinc-900/50 hover:border-orange-500'}`}>
                <div className="text-center">
                    <UploadCloud className={`mx-auto h-12 w-12 ${displayError ? 'text-red-400' : 'text-zinc-500'}`} />
                    <div className="mt-4 flex text-sm leading-6 text-zinc-400">
                        <label htmlFor={id} className="relative cursor-pointer rounded-md font-semibold text-orange-500 hover:text-orange-400">
                            <span>Upload a file</span>
                            <input id={id} name={id} type="file" className="sr-only" onChange={handleFileChange} accept={accept} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs leading-5 text-zinc-500">PNG, JPG, PDF up to 5MB</p>
                    {file && <p className="text-sm mt-2 text-green-400 font-semibold">{file.name}</p>}
                    {displayError && <p className="text-sm mt-2 text-red-400 font-medium animate-fade-in">{displayError}</p>}
                </div>
            </div>
        </div>
    );
};

const ErrorDisplay = ({ message }: { message: string | null }) => message ? (
    <div className="p-4 mb-6 text-sm text-red-200 bg-red-900/50 rounded-lg border border-red-500 flex items-start gap-3 animate-fade-in" role="alert">
        <AlertTriangle className="h-5 w-5 mt-0.5 text-red-400 flex-shrink-0" />
        <div>
            <span className="font-bold">Please check the form:</span> {message}
        </div>
    </div>
) : null;

interface StatusScreenProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  bgColor: string;
  buttonText: string;
  onButtonClick: () => void;
}
    
const StatusScreen: React.FC<StatusScreenProps> = ({ icon: Icon, title, children, bgColor, buttonText, onButtonClick }) => (
  <div className={`flex flex-col items-center justify-center min-h-[60vh] text-center p-4 animate-fade-in ${bgColor}`}>
    <div className="bg-black/40 backdrop-blur-md p-8 sm:p-12 rounded-2xl border border-white/10 shadow-2xl max-w-2xl w-full">
        <Icon className="mx-auto h-20 w-20 text-orange-400 mb-6" />
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{title}</h2>
        <div className="text-zinc-300 mt-2 mb-8 max-w-lg mx-auto leading-relaxed">
          {children}
        </div>
        <button onClick={onButtonClick} className="btn-primary px-8 py-3 text-lg">
            {buttonText}
        </button>
    </div>
  </div>
);


const wizardSteps = [
    { id: 1, name: 'Client Details', icon: User },
    { id: 2, name: 'Event Details', icon: Calendar },
    { id: 3, name: 'Services', icon: ListChecks },
    { id: 4, name: 'Confirm & Submit', icon: ShieldCheck },
];

const ProgressIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => (
    <nav aria-label="Progress">
        <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0 mb-10">
            {wizardSteps.map((step, index) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                    <li key={step.name} className="md:flex-1">
                        <div className={`group flex flex-col border-l-4 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0 ${isCompleted ? 'border-orange-500' : isCurrent ? 'border-orange-500' : 'border-zinc-700'}`}>
                            <span className={`text-sm font-medium transition-colors ${isCompleted ? 'text-orange-400' : isCurrent ? 'text-orange-400' : 'text-zinc-400'}`}>
                                Step {step.id}
                            </span>
                            <span className="text-sm font-medium text-white">{step.name}</span>
                        </div>
                    </li>
                );
            })}
        </ol>
    </nav>
);


const BookingProcess: React.FC<BookingProcessProps> = ({ performers, onBack, onBookingSubmitted, bookings, onUpdateBookingStatus, onBookingRequest, doNotServeList, addCommunication, onShowPrivacyPolicy, onShowTermsOfService, initialSelectedServices = [] }) => {
    const { width, height } = useWindowSize();
    const [stage, setStage] = useState<BookingStage>('form');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [form, setForm] = useState<BookingFormState>({
        fullName: '', email: '', mobile: '', eventDate: '', eventTime: '', eventAddress: '', eventType: '', duration: '2', numberOfGuests: '', selectedServices: initialSelectedServices, idDocument: null, client_message: ''
    });
    const [bookingIds, setBookingIds] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [isVerifiedBooker, setIsVerifiedBooker] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isPayIdModalOpen, setIsPayIdModalOpen] = useState(false);

    useEffect(() => {
      const checkVerifiedBooker = () => {
        if(!form.email && !form.mobile) return setIsVerifiedBooker(false);
        const hasConfirmedBooking = bookings.some(b => 
          b.status === 'confirmed' && (
            (form.email && b.client_email.toLowerCase() === form.email.toLowerCase()) ||
            (form.mobile && b.client_phone.replace(/\s+/g, '') === form.mobile.replace(/\s+/g, ''))
          )
        );
        setIsVerifiedBooker(hasConfirmedBooking);
      };
      const debounceTimer = setTimeout(checkVerifiedBooker, 500);
      return () => clearTimeout(debounceTimer);
    }, [form.email, form.mobile, bookings]);

    useEffect(() => {
        if (!bookings || bookingIds.length === 0) return;

        const currentBooking = bookings.find(b => b.id === bookingIds[0]);
        if (!currentBooking) return;

        const currentStatus = currentBooking.status;
        
        if (currentStatus === 'pending_performer_acceptance' && stage !== 'performer_acceptance_pending') {
            setStage('performer_acceptance_pending');
        } else if (currentStatus === 'pending_vetting' && stage !== 'vetting_pending') {
            setStage('vetting_pending');
        } else if (currentStatus === 'deposit_pending' && stage !== 'deposit_pending') {
            setStage('deposit_pending');
        } else if (currentStatus === 'pending_deposit_confirmation' && stage !== 'deposit_confirmation_pending') {
            setStage('deposit_confirmation_pending');
        } else if (currentStatus === 'confirmed' && stage !== 'confirmed') {
            setStage('confirmed');
        } else if (currentStatus === 'rejected' && stage !== 'rejected') {
            setStage('rejected');
        }
    }, [bookings, bookingIds, stage]);

    const todayStr = useMemo(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        // Clear specific field error on change
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    const handleServiceChange = (serviceId: string) => {
        setForm(prev => {
            const selectedServices = prev.selectedServices.includes(serviceId)
                ? prev.selectedServices.filter(s => s !== serviceId)
                : [...prev.selectedServices, serviceId];
            return { ...prev, selectedServices };
        });
        if (fieldErrors.selectedServices) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.selectedServices;
                return newErrors;
            });
        }
    };
    
    const availableServices = useMemo(() => {
      const uniqueServiceIds = [...new Set(performers.flatMap(p => p.service_ids))];
      return allServices.filter(s => uniqueServiceIds.includes(s.id));
    }, [performers]);

    const servicesByCategory = useMemo(() => {
        return availableServices.reduce((acc, service) => {
          (acc[service.category] = acc[service.category] || []).push(service);
          return acc;
        }, {} as Record<string, Service[]>);
    }, [availableServices]);

    const { totalCost, depositAmount } = useMemo(() => {
        if (form.selectedServices.length === 0 || performers.length === 0) return { totalCost: 0, depositAmount: 0 };
        
        const durationNum = Number(form.duration) || 0;
        let hourlyCost = 0;
        let flatCost = 0;

        form.selectedServices.forEach(serviceId => {
            const service = allServices.find(s => s.id === serviceId);
            if (!service) return;

            if (service.rate_type === 'flat') {
                flatCost += service.rate;
            } else if (service.rate_type === 'per_hour') {
                const hours = Math.max(durationNum, service.min_duration_hours || 0);
                hourlyCost += service.rate * hours;
            }
        });
        
        const calculatedTotal = (hourlyCost * performers.length) + flatCost;
        return { totalCost: calculatedTotal, depositAmount: calculatedTotal * DEPOSIT_PERCENTAGE };
    }, [form.selectedServices, form.duration, performers.length]);
    
    const validateStep = (step: number): boolean => {
        const errors: Record<string, string> = {};
        
        switch (step) {
            case 1:
                if (!form.fullName.trim()) {
                    errors.fullName = "Full name is required.";
                }
                if (!form.email.trim()) {
                    errors.email = "Email address is required.";
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                    errors.email = "Please provide a valid email address.";
                }
                if (!form.mobile.trim()) {
                    errors.mobile = "Mobile number is required.";
                } else if (!/^(\+614|04)\d{8}$/.test(form.mobile.replace(/\s+/g, ''))) {
                    errors.mobile = "Please provide a valid Australian mobile (e.g., 0412 345 678).";
                }
                break;

            case 2:
                if (!form.eventDate) {
                    errors.eventDate = "Event date is required.";
                } else {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    // Correctly parse YYYY-MM-DD in local time
                    const [y, m, d] = form.eventDate.split('-').map(Number);
                    const selectedDate = new Date(y, m - 1, d);
                    
                    if (selectedDate < today) {
                        errors.eventDate = "Event date cannot be in the past.";
                    }
                }
                
                if (!form.eventTime) {
                    errors.eventTime = "Event time is required.";
                }
                
                if (!form.duration) {
                    errors.duration = "Duration is required.";
                } else if (Number(form.duration) <= 0) {
                    errors.duration = "Duration must be a positive number of hours.";
                }
                
                if (!form.numberOfGuests) {
                    errors.numberOfGuests = "Guest count is required.";
                } else if (Number(form.numberOfGuests) <= 0) {
                    errors.numberOfGuests = "Number of guests must be a positive number.";
                }
                
                if (!form.eventAddress.trim()) {
                    errors.eventAddress = "Event address is required.";
                }
                
                if (!form.eventType) {
                    errors.eventType = "Please select an event type.";
                }
                break;

            case 3:
                if (form.selectedServices.length === 0) {
                    errors.selectedServices = "Please select at least one service to proceed.";
                } else {
                    // Check min duration
                    const currentDuration = Number(form.duration) || 0;
                    const selectedServiceObjects = allServices.filter(s => form.selectedServices.includes(s.id));
                    
                    for (const service of selectedServiceObjects) {
                        if (service.min_duration_hours && currentDuration < service.min_duration_hours) {
                            errors.selectedServices = `The service "${service.name}" requires a minimum duration of ${service.min_duration_hours} hours. You selected ${currentDuration} hours. Please go back to Step 2 to increase duration.`;
                            break;
                        }
                    }
                }
                break;
            
            case 4:
                const idDocumentRequired = !isVerifiedBooker;
                if (idDocumentRequired && !form.idDocument) {
                    errors.idDocument = "As a new client, you must upload a form of government-issued ID.";
                }
                if (!agreedTerms) {
                    errors.terms = "You must agree to the Terms & Conditions and Privacy Policy.";
                }
                break;
        }

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            setError("Please fix the errors highlighted below.");
            return false;
        }
        setError(null);
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const handleConfirmAndSubmit = async () => {
        if (!validateStep(4)) {
            setIsConfirmDialogOpen(false);
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const result = await onBookingRequest(form, performers);
            if (result.success && result.bookingIds) {
                setBookingIds(result.bookingIds);
                setStage('performer_acceptance_pending');
            } else {
                throw new Error(result.message);
            }
        } catch(err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during submission.';
            setError(errorMessage);
            setCurrentStep(1);
        } finally {
            setIsSubmitting(false);
            setIsConfirmDialogOpen(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep(4)) {
            setIsConfirmDialogOpen(true);
        }
    };
    
    const handlePaymentSuccess = async () => {
        setIsPayIdModalOpen(false);
        setIsSubmitting(true);
        try {
            if (onUpdateBookingStatus) {
                await Promise.all(bookingIds.map(id => onUpdateBookingStatus(id, 'pending_deposit_confirmation')));
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Please try again or contact support.';
            setError(`Failed to confirm payment: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const renderStepContent = () => {
        return (
            <div key={currentStep} className="animate-fade-in">
                {currentStep === 1 && (
                    <div className="space-y-6 card-base !p-6 !bg-zinc-950/50">
                         <h3 className="text-xl font-semibold text-orange-400 border-b border-zinc-700 pb-3 mb-4">Your Details</h3>
                         <InputField icon={<User />} type="text" name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} required error={fieldErrors.fullName} />
                         <InputField icon={<Mail />} type="email" name="email" placeholder="Email Address" value={form.email} onChange={handleChange} required error={fieldErrors.email} />
                         <InputField icon={<Phone />} type="tel" name="mobile" placeholder="Mobile (e.g., 0412 345 678)" value={form.mobile} onChange={handleChange} required error={fieldErrors.mobile} />
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-6 card-base !p-6 !bg-zinc-950/50">
                         <h3 className="text-xl font-semibold text-orange-400 border-b border-zinc-700 pb-3 mb-4">Event Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField icon={<Calendar />} type="date" name="eventDate" value={form.eventDate} onChange={handleChange} required min={todayStr} error={fieldErrors.eventDate} />
                            <InputField icon={<Clock />} type="time" name="eventTime" value={form.eventTime} onChange={handleChange} required error={fieldErrors.eventTime} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField icon={<Clock />} type="number" name="duration" placeholder="Duration (hours)" value={form.duration} onChange={handleChange} required min="1" error={fieldErrors.duration} />
                            <InputField icon={<UsersIcon />} type="number" name="numberOfGuests" placeholder="Number of Guests" value={form.numberOfGuests} onChange={handleChange} required min="1" error={fieldErrors.numberOfGuests} />
                        </div>
                        <InputField icon={<MapPin />} type="text" name="eventAddress" placeholder="Event Address" value={form.eventAddress} onChange={handleChange} required error={fieldErrors.eventAddress} />
                        <div className="relative">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500"><PartyPopper /></div>
                                <select name="eventType" value={form.eventType} onChange={handleChange} required className={`input-base input-with-icon appearance-none ${fieldErrors.eventType ? '!border-red-500 focus:!border-red-500' : ''}`}>
                                    <option value="" disabled>Select Event Type</option>
                                    {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 pointer-events-none" />
                            </div>
                            {fieldErrors.eventType && <p className="mt-1.5 text-xs text-red-400 font-medium pl-1 animate-fade-in">{fieldErrors.eventType}</p>}
                        </div>
                        <div className="relative">
                            <FileText className="absolute left-4 top-4 h-5 w-5 text-zinc-500" />
                            <textarea
                                name="client_message"
                                placeholder="Message / Special Requests (optional)"
                                value={form.client_message}
                                onChange={handleChange}
                                className="input-base input-with-icon h-24 resize-y"
                            />
                        </div>
                    </div>
                )}
                
                {currentStep === 3 && (
                    <div className="space-y-4 card-base !p-6 !bg-zinc-950/50">
                        <h3 className="text-xl font-semibold text-orange-400 border-b border-zinc-700 pb-3 mb-4 flex items-center gap-2">
                            <ListChecks className="h-6 w-6" /> Select Services
                        </h3>
                        {fieldErrors.selectedServices && (
                             <div className="p-3 mb-2 text-sm text-red-200 bg-red-900/30 rounded-lg border border-red-500/50 flex items-center gap-2 animate-fade-in">
                                <AlertTriangle className="h-4 w-4" />
                                {fieldErrors.selectedServices}
                             </div>
                        )}
                        {Object.entries(servicesByCategory).map(([category, services]) => (
                            <div key={category}>
                                <h4 className="font-semibold text-zinc-200 mt-4 mb-2">{category}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {services.map(service => (
                                    <label key={service.id} className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${form.selectedServices.includes(service.id) ? 'bg-zinc-800 border-orange-500/50' : 'bg-zinc-900 border-zinc-700/50 hover:bg-zinc-800/70'}`}>
                                        <input
                                        type="checkbox"
                                        checked={form.selectedServices.includes(service.id)}
                                        onChange={() => handleServiceChange(service.id)}
                                        className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-orange-600 focus:ring-orange-500"
                                        />
                                        <div className="ml-3 text-sm">
                                            <span className="font-medium text-white">{service.name}</span>
                                            <p className="text-zinc-400">{service.description}</p>
                                            <p className="text-orange-400 font-semibold mt-1">
                                                ${service.rate} {service.rate_type === 'per_hour' ? '/hr' : 'flat rate'}
                                            </p>
                                        </div>
                                    </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {currentStep === 4 && (
                    <div className="card-base !p-6 !bg-zinc-950/50">
                        <h3 className="text-xl font-semibold text-orange-400 border-b border-zinc-700 pb-3 mb-6">Verification & Agreement</h3>
                        {isVerifiedBooker ? (
                           <div className="p-4 text-center text-green-200 bg-green-900/30 rounded-lg border border-green-500 flex items-center justify-center gap-3">
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-medium">Welcome back! As a verified client, you can skip the ID upload.</span>
                           </div>
                        ) : (
                           <FileUploadField
                              file={form.idDocument}
                              setFile={(f) => {
                                  setForm(prev => ({ ...prev, idDocument: f }));
                                  if(fieldErrors.idDocument) {
                                      setFieldErrors(prev => { const n = {...prev}; delete n.idDocument; return n; });
                                  }
                              }}
                              id="idUpload"
                              label="Upload Government-Issued ID"
                              accept="image/png, image/jpeg, application/pdf"
                              error={fieldErrors.idDocument}
                           />
                        )}
                        <div className="mt-6">
                            <label htmlFor="terms-check-booking" className={`flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200 border ${fieldErrors.terms ? 'border-red-500 bg-red-900/10' : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700/70 hover:border-zinc-600'}`}>
                                <div className="relative h-6 w-6 flex-shrink-0">
                                <input 
                                    id="terms-check-booking" 
                                    type="checkbox" 
                                    checked={agreedTerms} 
                                    onChange={(e) => {
                                        setAgreedTerms(e.target.checked);
                                        if (e.target.checked && fieldErrors.terms) {
                                            setFieldErrors(prev => { const n = {...prev}; delete n.terms; return n; });
                                        }
                                    }} 
                                    className="appearance-none h-6 w-6 rounded-md border-2 border-zinc-600 bg-zinc-900 checked:bg-orange-500 checked:border-orange-500 transition-all" 
                                />
                                {agreedTerms && <CheckCircle className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none" />}
                                </div>
                                <div className="ml-4">
                                    <span className="text-zinc-200">
                                    I have read and agree to the{' '}
                                    <a href="#" onClick={(e) => { e.preventDefault(); onShowTermsOfService(); }} className="underline text-orange-400 hover:text-orange-300">Terms &amp; Conditions</a>
                                    {' and '}
                                    <a href="#" onClick={(e) => { e.preventDefault(); onShowPrivacyPolicy(); }} className="underline text-orange-400 hover:text-orange-300">Privacy Policy</a>.
                                    </span>
                                    {fieldErrors.terms && <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.terms}</p>}
                                </div>
                            </label>
                        </div>
                    </div>
                )}

            </div>
        )
    }

    
    if (stage === 'performer_acceptance_pending') {
        return (
            <StatusScreen icon={Send} title="Request Sent!" buttonText="Back to Gallery" onButtonClick={onBack} bgColor="bg-gradient-to-br from-purple-900/30 to-zinc-900">
                <p>Your request has been sent to <strong>{performers.map(p => p.name).join(', ')}</strong>. We are awaiting their response and will notify you of any updates.</p>
                <div className="bg-purple-900/40 p-4 rounded-lg border border-purple-600/50 mt-6 text-sm">
                    <h3 className="font-bold text-purple-300 flex items-center justify-center gap-2"><Info/> DEMO INSTRUCTIONS</h3>
                    <p className="text-purple-200/80 mt-2">A message has been simulated on the Performer's phone. In the demo popup, click <strong>'Accept'</strong> to proceed to the next stage.</p>
                </div>
            </StatusScreen>
        )
    }

    if (stage === 'vetting_pending') {
        return (
             <StatusScreen icon={ShieldCheck} title="Performer Accepted!" buttonText="Back to Gallery" onButtonClick={onBack} bgColor="bg-gradient-to-br from-yellow-900/30 to-zinc-900">
                 <p><strong>{performers.map(p => p.name).join(', ')}</strong> has accepted your request! It's now with our admin team for final review and vetting.</p>
                 <div className="bg-yellow-900/40 p-4 rounded-lg border border-yellow-600/50 mt-6 text-sm">
                    <h3 className="font-bold text-yellow-300 flex items-center justify-center gap-2"><Info/> DEMO INSTRUCTIONS</h3>
                    <p className="text-yellow-200/80 mt-2">To continue, switch to the <strong>Admin View</strong>. Find this booking and click 'Approve Vetting'. Then, switch back to the <strong>User View</strong> to see this screen update.</p>
                </div>
             </StatusScreen>
        )
    }

    if (stage === 'deposit_confirmation_pending') {
        return (
             <StatusScreen icon={Send} title="Receipt Submitted!" buttonText="Back to Gallery" onButtonClick={onBack} bgColor="bg-gradient-to-br from-blue-900/30 to-zinc-900">
                <p>Your deposit receipt is being confirmed by our administration team. You will receive a final confirmation shortly.</p>
                 <div className="bg-blue-900/40 p-4 rounded-lg border border-blue-600/50 mt-6 text-sm">
                    <h3 className="font-bold text-blue-300 flex items-center justify-center gap-2"><Info/> DEMO INSTRUCTIONS</h3>
                    <p className="text-blue-200/80 mt-2">Switch to the <strong>Admin View</strong> again. Find this booking and click 'Confirm Deposit'. Then, switch back to the <strong>User View</strong> to see the final confirmation.</p>
                </div>
             </StatusScreen>
        )
    }
    
    if (stage === 'rejected') {
        return (
            <StatusScreen icon={ShieldX} title="Booking Rejected" buttonText="Return to Gallery" onButtonClick={onBookingSubmitted} bgColor="bg-gradient-to-br from-red-900/30 to-zinc-900">
                <p>Unfortunately, your booking application for <strong>{performers.map(p => p.name).join(', ')}</strong> has been rejected.</p>
            </StatusScreen>
        )
    }

    if (stage === 'confirmed') {
        return (
            <>
                <Confetti
                    width={width}
                    height={height}
                    recycle={false}
                    numberOfPieces={400}
                    gravity={0.1}
                />
                <StatusScreen icon={CheckCircle} title="Booking Confirmed!" buttonText="Return to Gallery" onButtonClick={onBookingSubmitted} bgColor="bg-gradient-to-br from-green-900/30 to-zinc-900">
                    <p>Your booking with <strong>{performers.map(p => p.name).join(', ')}</strong> is confirmed! We have received your deposit and sent a confirmation email to {form.email}.</p>
                </StatusScreen>
            </>
        )
    }

    if (stage === 'deposit_pending') {
        return (
            <div className="animate-fade-in max-w-3xl mx-auto">
                <div className="card-base !p-0 !bg-transparent !border-0">
                    <div className="p-4 mb-6 text-green-200 bg-green-900/30 rounded-lg border border-green-500 text-center">
                        <span className="font-medium">Application Approved!</span> Your initial application has been vetted and approved. Please pay the deposit to confirm the booking.
                    </div>
                    <div className="card-base !p-8 sm:!p-10 !bg-zinc-900/70 text-center">
                        <ErrorDisplay message={error} />
                        <h2 className="text-3xl font-bold text-white mb-2">Deposit Required</h2>
                        <p className="text-zinc-300 mb-6">To confirm your booking with <strong>{performers.map(p => p.name).join(', ')}</strong>, please pay the {DEPOSIT_PERCENTAGE * 100}% deposit of <strong className="text-orange-400 font-bold">${depositAmount.toFixed(2)}</strong>.</p>
                        <p className="text-zinc-400 mb-8 text-sm max-w-md mx-auto">This demonstration uses a simulated PayID payment. Click the button below to open the payment modal and confirm your deposit.</p>
                        
                        <button 
                            onClick={() => setIsPayIdModalOpen(true)}
                            disabled={isSubmitting}
                            className="btn-primary w-full sm:w-auto py-4 px-10 text-lg flex items-center justify-center gap-3 mx-auto"
                        >
                           {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
                           {isSubmitting ? 'Processing...' : `Pay Deposit Now`}
                        </button>
                    </div>
                </div>
                 {isPayIdModalOpen && (
                    <PayIDSimulationModal 
                        amount={depositAmount}
                        onClose={() => setIsPayIdModalOpen(false)}
                        onPaymentSuccess={handlePaymentSuccess}
                    />
                )}
            </div>
        )
    }

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="mb-8 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2">
                <ArrowLeft className="h-5 w-5" />
                Back
            </button>
            <form onSubmit={handleSubmit} className="card-base !p-0 sm:!p-0 !bg-transparent !border-0 max-w-4xl mx-auto">
                 <div className="card-base !p-8 sm:!p-10 !bg-zinc-900/70 space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white">Booking Application For:</h2>
                        <p className="text-orange-400 text-xl font-semibold">{performers.map(p => p.name).join(', ')}</p>
                    </div>

                    <ProgressIndicator currentStep={currentStep} />
                    
                    <ErrorDisplay message={error} />
                    
                    {renderStepContent()}
                     
                    {(currentStep === 3 || currentStep === 4) && (
                        <BookingCostCalculator
                            selectedServices={form.selectedServices}
                            durationHours={form.duration}
                            performers={performers}
                            className="mt-8"
                        />
                    )}

                    <div className="mt-8 flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button 
                            type="button" 
                            onClick={handlePrev} 
                            className={`w-full rounded-lg bg-zinc-700 px-6 py-3 font-semibold text-white transition-all duration-300 hover:bg-zinc-600 sm:w-auto ${currentStep === 1 ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
                        >
                            Back
                        </button>
                       {currentStep < 4 ? (
                          <button type="button" onClick={handleNext} className="btn-primary w-full px-8 py-3 text-lg sm:w-auto">
                              Next
                          </button>
                       ) : (
                          <button type="submit" disabled={isSubmitting} className="btn-primary flex w-full items-center justify-center gap-3 px-6 py-3 text-lg sm:w-auto">
                              {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
                              {isSubmitting ? 'Submitting...' : 'Submit Booking Application'}
                          </button>
                       )}
                    </div>

                 </div>
            </form>
            {isConfirmDialogOpen && (
                <BookingConfirmationDialog
                    isOpen={isConfirmDialogOpen}
                    onClose={() => setIsConfirmDialogOpen(false)}
                    onConfirm={handleConfirmAndSubmit}
                    isLoading={isSubmitting}
                    bookingDetails={{
                        performers: performers,
                        eventDate: form.eventDate,
                        eventTime: form.eventTime,
                        eventAddress: form.eventAddress,
                        selectedServices: form.selectedServices.map(id => allServices.find(s => s.id === id)?.name || id),
                        totalCost: totalCost,
                        depositAmount: depositAmount
                    }}
                />
            )}
        </div>
    );
};

export default BookingProcess;