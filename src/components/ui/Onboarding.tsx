"use client";

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  image?: string;
  targetElement?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
  storageKey?: string;
  className?: string;
}

export default function Onboarding({
  steps,
  onComplete,
  onSkip,
  storageKey = 'dentify-onboarding-completed',
  className = ''
}: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if onboarding has been completed
    const hasCompleted = localStorage.getItem(storageKey);
    if (!hasCompleted) {
      setIsVisible(true);
    }
  }, [storageKey]);

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    if (onSkip) onSkip();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />

      {/* Spotlight on target element */}
      {step.targetElement && (
        <div
          className="fixed z-[51] pointer-events-none"
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
            borderRadius: '12px'
          }}
        />
      )}

      {/* Onboarding Card */}
      <div className={`fixed z-[52] ${className}`}>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors z-10"
              aria-label="Saltar tutorial"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image or Icon */}
            {step.image ? (
              <div className="w-full h-48 bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : step.icon ? (
              <div className="w-full h-48 bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  {step.icon}
                </div>
              </div>
            ) : null}

            {/* Content */}
            <div className="p-8">
              {/* Progress Indicators */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'w-8 bg-sky-500'
                        : index < currentStep
                        ? 'w-2 bg-sky-300'
                        : 'w-2 bg-slate-200 dark:bg-slate-700'
                    }`}
                    aria-label={`Ir al paso ${index + 1}`}
                  />
                ))}
              </div>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-center">
                {step.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-center leading-relaxed">
                {step.description}
              </p>

              {/* Step Counter */}
              <p className="text-sm text-slate-500 dark:text-slate-500 text-center mt-4">
                Paso {currentStep + 1} de {steps.length}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4 px-8 pb-8">
              {!isFirstStep ? (
                <button
                  onClick={handlePrevious}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
              ) : (
                <button
                  onClick={handleSkip}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Saltar
                </button>
              )}

              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-lg transition-all duration-200 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30"
              >
                {isLastStep ? (
                  <>
                    <Check className="w-4 h-4" />
                    Comenzar
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
