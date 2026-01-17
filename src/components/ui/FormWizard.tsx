"use client";

import { ReactNode, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  isValid?: boolean;
}

interface FormWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
}

export default function FormWizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Finalizar',
  cancelLabel = 'Cancelar',
  className = ''
}: FormWizardProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (!isLastStep) {
      onStepChange(currentStep + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  const canProceed = currentStepData?.isValid !== false;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Step Indicators */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => index < currentStep && onStepChange(index)}
                  disabled={index > currentStep}
                  className={`flex items-center gap-3 transition-all duration-200 ${
                    index < currentStep ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  aria-label={`Paso ${index + 1}: ${step.title}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {/* Step Number/Check */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all duration-200 ${
                      isCompleted
                        ? 'bg-sky-500 text-white scale-100'
                        : isCurrent
                        ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 ring-4 ring-sky-100 dark:ring-sky-900/30 scale-110'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 scale-90'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                  </div>

                  {/* Step Title (Desktop only) */}
                  <div className="hidden md:flex flex-col items-start">
                    <span
                      className={`text-sm font-medium transition-colors ${
                        isCurrent
                          ? 'text-slate-900 dark:text-white'
                          : isCompleted
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.description && isCurrent && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {step.description}
                      </span>
                    )}
                  </div>
                </button>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2 md:mx-4">
                    <div
                      className={`h-0.5 transition-all duration-500 ${
                        index < currentStep
                          ? 'bg-sky-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Step Title */}
        <div className="md:hidden mt-4 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {currentStepData?.title}
          </h3>
          {currentStepData?.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {currentStepData.description}
            </p>
          )}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {currentStepData?.content}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>

          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Atrás
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : isLastStep ? (
                submitLabel
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            Paso {currentStep + 1} de {steps.length}
          </p>
        </div>
      </div>
    </div>
  );
}
