import { motion } from 'framer-motion';

// A reusable styled panel with a subtle entrance animation
export const ThemedPanel = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-clash-primary border-4 border-clash-gold/30 rounded-lg shadow-clash-panel p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
};

// A reusable styled button with hover and tap animations
export const ThemedButton = ({ children, onClick, className, ...props }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95, y: 3, boxShadow: 'none' }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      className={`bg-clash-primary font-clash text-xl text-white uppercase px-8 py-3 rounded-lg border-2 border-clash-gold shadow-clash-button ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};