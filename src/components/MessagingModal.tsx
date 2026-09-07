import React from 'react';
import { MessagingSystem } from './MessagingSystem';

export const MessagingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 font-arabic animate-fadeIn">
      <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl">
        <MessagingSystem embeddedMode={false} onCloseModal={onClose} />
      </div>
    </div>
  );
};
