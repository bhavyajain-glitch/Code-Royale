// src/components/ThemedButton.jsx
import { motion } from 'framer-motion';

export const ThemedButton = ({ children, onClick, className }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95, y: 3, boxShadow: 'none' }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      className={`bg-clash-primary font-clash text-xl text-white uppercase px-8 py-3 rounded-lg border-2 border-clash-gold shadow-clash-button ${className}`}
    >
      {children}
    </motion.button>
  );
};