import { motion } from 'framer-motion';

export const ThemedPanel = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-clash-primary border-4 border-clash-secondary/50 rounded-lg shadow-clash-panel p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
};