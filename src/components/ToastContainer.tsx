"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import type { ToastType } from '@/hooks/useToast';

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

const icons = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
};

const colors = {
  success: { bg: 'rgba(16,185,129,0.95)', border: 'rgba(16,185,129,0.3)' },
  error:   { bg: 'rgba(239,68,68,0.95)',  border: 'rgba(239,68,68,0.3)' },
  info:    { bg: 'rgba(59,130,246,0.95)', border: 'rgba(59,130,246,0.3)' },
};

export default function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: number) => void;
}) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      pointerEvents: 'none',
    }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              background: colors[toast.type].bg,
              border: `1px solid ${colors[toast.type].border}`,
              borderRadius: '12px',
              padding: '0.85rem 1.25rem',
              color: '#fff',
              fontWeight: 500,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              pointerEvents: 'all',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              maxWidth: '380px',
            }}
          >
            {icons[toast.type]}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '2px', display: 'flex' }}
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
