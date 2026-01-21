import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface TutorialSlide {
  title: string;
  content: string;
  icon: JSX.Element;
}

const tutorialSlides: TutorialSlide[] = [
  {
    title: "Welcome to Orderline",
    content: "Orderline helps ADHD brains stay focused by limiting active tasks to just 3 at a time.",
    icon: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto">
        <circle cx="50" cy="50" r="40" fill="#3b82f6" stroke="#1e40af" strokeWidth="2"/>
        <path d="M35 45 L45 55 L65 35" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    title: "Active, Hold, and Backlog",
    content: "Active tasks (max 3) are what you work on now. Hold tasks (max 3) are paused. Everything else goes in Backlog.",
    icon: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto">
        <rect x="10" y="15" width="25" height="20" rx="3" fill="#10b981" stroke="#059669" strokeWidth="1"/>
        <rect x="40" y="15" width="25" height="20" rx="3" fill="#f59e0b" stroke="#d97706" strokeWidth="1"/>
        <rect x="70" y="15" width="25" height="20" rx="3" fill="#6b7280" stroke="#4b5563" strokeWidth="1"/>
        <text x="22" y="28" textAnchor="middle" fontSize="8" fill="white">ACT</text>
        <text x="52" y="28" textAnchor="middle" fontSize="8" fill="white">HOLD</text>
        <text x="82" y="28" textAnchor="middle" fontSize="8" fill="white">LOG</text>
        <circle cx="22" cy="50" r="8" fill="#10b981"/>
        <circle cx="22" cy="70" r="8" fill="#10b981"/>
        <circle cx="52" cy="50" r="8" fill="#f59e0b"/>
        <circle cx="82" cy="50" r="8" fill="#6b7280"/>
        <circle cx="82" cy="65" r="8" fill="#6b7280"/>
        <circle cx="82" cy="80" r="8" fill="#6b7280"/>
      </svg>
    )
  },
  {
    title: "Complete Top Task Only",
    content: "You can only complete the task at the top of your Active list. This keeps you focused on priorities.",
    icon: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto">
        <rect x="20" y="20" width="60" height="12" rx="2" fill="#10b981" stroke="#059669" strokeWidth="1"/>
        <rect x="20" y="40" width="60" height="12" rx="2" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1"/>
        <rect x="20" y="60" width="60" height="12" rx="2" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1"/>
        <path d="M10 23 L15 28 L10 33" stroke="#10b981" strokeWidth="2" fill="none"/>
        <circle cx="73" cy="26" r="3" fill="#10b981"/>
        <path d="M70 23 L76 29" stroke="white" strokeWidth="1"/>
        <path d="M76 23 L70 29" stroke="white" strokeWidth="1"/>
      </svg>
    )
  },
  {
    title: "Using Hold Wisely",
    content: "Move active tasks to Hold when you need to pause them. Limited to 3 to prevent overwhelm.",
    icon: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto">
        <rect x="15" y="25" width="30" height="50" rx="5" fill="#3b82f6" stroke="#1e40af" strokeWidth="2"/>
        <rect x="55" y="25" width="30" height="50" rx="5" fill="#f59e0b" stroke="#d97706" strokeWidth="2"/>
        <path d="M45 35 L55 50 L45 65" stroke="#6b7280" strokeWidth="3" fill="none"/>
        <circle cx="30" cy="40" r="4" fill="white"/>
        <circle cx="30" cy="50" r="4" fill="white"/>
        <circle cx="30" cy="60" r="4" fill="white"/>
        <rect x="62" y="37" width="16" height="3" fill="white"/>
        <rect x="62" y="47" width="16" height="3" fill="white"/>
      </svg>
    )
  },
  {
    title: "Schedule for Later",
    content: "Set future dates on tasks to automatically move them to Active when the time comes.",
    icon: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto">
        <rect x="25" y="20" width="50" height="60" rx="5" fill="white" stroke="#6b7280" strokeWidth="2"/>
        <rect x="25" y="20" width="50" height="15" fill="#3b82f6"/>
        <circle cx="35" cy="15" r="2" fill="#6b7280"/>
        <circle cx="65" cy="15" r="2" fill="#6b7280"/>
        <text x="50" y="45" textAnchor="middle" fontSize="12" fill="#1f2937">15</text>
        <circle cx="50" cy="60" r="8" fill="#10b981"/>
        <path d="M46 58 L49 61 L54 56" stroke="white" strokeWidth="2" fill="none"/>
      </svg>
    )
  },
  {
    title: "Track Your Progress",
    content: "See completed tasks for today and view your full weekly calendar to stay motivated.",
    icon: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto">
        <rect x="20" y="25" width="60" height="50" rx="5" fill="white" stroke="#6b7280" strokeWidth="2"/>
        <rect x="20" y="25" width="60" height="12" fill="#3b82f6"/>
        <circle cx="30" cy="20" r="2" fill="#6b7280"/>
        <circle cx="70" cy="20" r="2" fill="#6b7280"/>
        <circle cx="35" cy="50" r="4" fill="#10b981"/>
        <circle cx="50" cy="50" r="4" fill="#10b981"/>
        <circle cx="65" cy="50" r="4" fill="#e5e7eb"/>
        <circle cx="35" cy="60" r="4" fill="#10b981"/>
        <circle cx="50" cy="60" r="4" fill="#e5e7eb"/>
        <circle cx="65" cy="60" r="4" fill="#e5e7eb"/>
        <text x="50" y="32" textAnchor="middle" fontSize="8" fill="white">PROGRESS</text>
      </svg>
    )
  },
  {
    title: "Stay Consistent",
    content: "Small, daily progress beats overwhelming sprints. Orderline keeps you moving without burning out.",
    icon: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto">
        <path d="M20 70 Q35 50 50 60 T80 40" stroke="#3b82f6" strokeWidth="3" fill="none"/>
        <circle cx="20" cy="70" r="4" fill="#10b981"/>
        <circle cx="35" cy="58" r="4" fill="#10b981"/>
        <circle cx="50" cy="60" r="4" fill="#10b981"/>
        <circle cx="65" cy="52" r="4" fill="#10b981"/>
        <circle cx="80" cy="40" r="4" fill="#f59e0b"/>
        <path d="M75 35 L85 30 L80 45" stroke="#f59e0b" strokeWidth="2" fill="none"/>
      </svg>
    )
  }
];

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [, setHasSeenTutorial] = useLocalStorage('orderline-has-seen-tutorial', false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      } else if (e.key === 'ArrowRight' && currentSlide < tutorialSlides.length - 1) {
        setCurrentSlide(currentSlide + 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    modalRef.current?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlide, onClose]);

  // Reset to first slide when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentTutorialSlide = tutorialSlides[currentSlide];
  const isLastSlide = currentSlide === tutorialSlides.length - 1;

  const handleClose = () => {
    setHasSeenTutorial(true);
    onClose();
  };

  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToNextSlide = () => {
    if (currentSlide < tutorialSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6 relative focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close tutorial"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="text-center mb-6">
          <div className="mb-4">
            {currentTutorialSlide.icon}
          </div>
          <h2 id="tutorial-title" className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
            {currentTutorialSlide.title}
          </h2>
          <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            {currentTutorialSlide.content}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center space-x-2 mb-6">
          {tutorialSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={goToPrevSlide}
            disabled={currentSlide === 0}
            className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
              currentSlide === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentSlide + 1} of {tutorialSlides.length}
          </span>

          {isLastSlide ? (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
            >
              Got it!
            </button>
          ) : (
            <button
              onClick={goToNextSlide}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Next slide"
            >
              <span className="text-sm">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}