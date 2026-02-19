import { X } from 'lucide-react'

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="flex min-h-screen items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Panel */}
        <div
          className="relative z-10 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-[#1e2a3a] max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#1e2a3a]">
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#1a2236] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal
