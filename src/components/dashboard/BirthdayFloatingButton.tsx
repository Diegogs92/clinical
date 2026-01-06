'use client';

import { useState, useMemo } from 'react';
import { Patient } from '@/types';
import { parseISO, startOfDay, endOfDay, addDays, isSameDay, isAfter, isBefore, differenceInYears, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cake } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import IconWithBadge from '@/components/ui/IconWithBadge';

interface BirthdayFloatingButtonProps {
  patients: Patient[];
}

export default function BirthdayFloatingButton({ patients }: BirthdayFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const now = new Date();

  const upcomingBirthdays = useMemo(() => {
    const today = startOfDay(now);
    const next7Days = endOfDay(addDays(now, 7));

    return patients
      .filter(patient => patient.birthDate)
      .map(patient => {
        const birthDate = parseISO(patient.birthDate!);
        const currentYear = now.getFullYear();
        const birthdayThisYear = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        const age = differenceInYears(now, birthDate);

        return {
          patient,
          birthday: birthdayThisYear,
          age: age,
          isToday: isSameDay(birthdayThisYear, today),
        };
      })
      .filter(({ birthday }) =>
        (isSameDay(birthday, today) || (isAfter(birthday, today) && isBefore(birthday, next7Days)))
      )
      .sort((a, b) => a.birthday.getTime() - b.birthday.getTime());
  }, [patients, now]);

  if (upcomingBirthdays.length === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-6 bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-200 hover:scale-105 active:scale-100 z-50 flex items-center gap-3 group"
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        aria-label="Ver cumpleaños próximos"
      >
        <IconWithBadge
          icon={Cake}
          badge={upcomingBirthdays.length}
          color="bg-white"
          iconClassName="w-6 h-6"
          badgeClassName="!text-pink-600 !border-pink-500"
        />
        <span className="font-semibold hidden group-hover:inline-block animate-fade-in">
          Cumpleaños
        </span>
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={`🎂 Cumpleaños Próximos (${upcomingBirthdays.length})`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-elegant-600 dark:text-elegant-300">
            Próximos cumpleaños en los siguientes 7 días
          </p>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {upcomingBirthdays.map(({ patient, birthday, age, isToday }) => (
              <div
                key={patient.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isToday
                    ? 'bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 border-pink-400 dark:border-pink-600 shadow-lg'
                    : 'bg-white dark:bg-elegant-800 border-elegant-200 dark:border-elegant-700 hover:border-pink-300 dark:hover:border-pink-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🎂</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg text-elegant-900 dark:text-white truncate">
                          {patient.lastName}, {patient.firstName}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <p className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                            {isToday ? (
                              '¡Hoy es su cumpleaños!'
                            ) : (
                              format(birthday, "d 'de' MMMM", { locale: es })
                            )}
                          </p>
                          <span className="text-elegant-400 dark:text-elegant-500">•</span>
                          <p className="text-sm text-elegant-600 dark:text-elegant-300">
                            Cumple {age} años
                          </p>
                        </div>
                        {patient.phone && (
                          <p className="text-xs text-elegant-500 dark:text-elegant-400 mt-2">
                            📱 {patient.phone}
                          </p>
                        )}
                      </div>

                      {patient.phone && (
                        <a
                          href={`https://wa.me/${patient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Feliz cumpleaños ${patient.firstName}! 🎂🎉`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary text-sm px-4 py-2 whitespace-nowrap flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                          <span>📱</span>
                          <span>Enviar saludos</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
