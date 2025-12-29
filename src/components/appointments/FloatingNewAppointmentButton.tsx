'use client';

import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import AppointmentForm from '@/components/appointments/AppointmentForm';

export default function FloatingNewAppointmentButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 bg-gradient-to-br from-primary to-primary-light hover:from-primary-dark hover:to-primary text-white rounded-full p-4 shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:scale-105 active:scale-100 z-50 flex items-center gap-3 group"
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        aria-label="Nuevo turno"
      >
        <CalendarPlus className="w-6 h-6" />
        <span className="font-semibold hidden group-hover:inline-block animate-fade-in">
          Nuevo Turno
        </span>
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Nuevo Turno"
        maxWidth="max-w-4xl"
      >
        <AppointmentForm
          onCreated={() => {
            setIsOpen(false);
          }}
          onCancel={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}
