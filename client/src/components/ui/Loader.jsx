import { motion } from 'framer-motion';

const Loader = ({ message = 'Loading...', size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8', md: 'w-16 h-16', lg: 'w-24 h-24' };
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-6">
      <div className="relative w-64 h-20 overflow-hidden">
        <div className="absolute bottom-0 w-full h-4 bg-gray-700 rounded" />
        <div className="absolute bottom-[6px] h-1 flex gap-4" style={{ animation: 'roadScroll 1s linear infinite', width: '200%' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-10 h-1 bg-gray-500 rounded flex-shrink-0" />
          ))}
        </div>
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
          animate={{ x: [-5, 5, -5], rotate: [-2, 2, -2] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="60" height="40" viewBox="0 0 60 40" fill="none">
            <circle cx="12" cy="30" r="9" stroke="#3b82f6" strokeWidth="2" fill="none" />
            <motion.circle cx="12" cy="30" r="5" stroke="#3b82f6" strokeWidth="1.5" fill="none" style={{ transformOrigin: '12px 30px' }} animate={{ rotate: 360 }} transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }} />
            <circle cx="48" cy="30" r="9" stroke="#3b82f6" strokeWidth="2" fill="none" />
            <motion.circle cx="48" cy="30" r="5" stroke="#3b82f6" strokeWidth="1.5" fill="none" style={{ transformOrigin: '48px 30px' }} animate={{ rotate: 360 }} transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }} />
            <line x1="12" y1="30" x2="30" y2="12" stroke="#60a5fa" strokeWidth="2" />
            <line x1="30" y1="12" x2="48" y2="30" stroke="#60a5fa" strokeWidth="2" />
            <line x1="12" y1="30" x2="35" y2="18" stroke="#60a5fa" strokeWidth="2" />
            <line x1="35" y1="18" x2="48" y2="30" stroke="#60a5fa" strokeWidth="1.5" />
            <line x1="45" y1="12" x2="52" y2="12" stroke="#93c5fd" strokeWidth="2" />
            <line x1="45" y1="10" x2="45" y2="18" stroke="#93c5fd" strokeWidth="2" />
            <line x1="26" y1="9" x2="34" y2="9" stroke="#93c5fd" strokeWidth="2" />
            <line x1="30" y1="9" x2="30" y2="12" stroke="#93c5fd" strokeWidth="1.5" />
            <circle cx="34" cy="6" r="4" fill="#3b82f6" />
            <line x1="34" y1="10" x2="34" y2="18" stroke="#60a5fa" strokeWidth="2" />
            <line x1="34" y1="13" x2="28" y2="11" stroke="#60a5fa" strokeWidth="1.5" />
          </svg>
        </motion.div>
      </div>
      <div className={`relative ${sizes[size]}`}>
        <div className="absolute inset-0 rounded-full border-4 border-blue-900" />
        <motion.div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
        <div className="absolute inset-2 rounded-full bg-slate-950 flex items-center justify-center">
          <span className="text-blue-400 font-bold text-xs tracking-wider">SR</span>
        </div>
      </div>
      <motion.p className="text-gray-400 text-sm" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
        {message}
      </motion.p>
    </div>
  );
};

export const FullPageLoader = ({ message }) => (
  <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-4">
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="text-3xl font-extrabold gradient-text mb-4">
        SmartRoute
      </motion.div>
      <Loader message={message} size="lg" />
    </div>
  </div>
);

export default Loader;
