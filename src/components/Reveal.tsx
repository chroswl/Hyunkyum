import { useAppearance } from '../contexts/AppearanceContext';
import React, { ReactNode } from 'react';
import { motion } from 'motion/react';

interface RevealProps {
  children: ReactNode;
  width?: string;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  staggerChildren?: number;
}

export default function Reveal({
  children,
  width = 'w-full',
  delay = 0,
  duration = 0.85,
  y = 30,
  x = 0,
  staggerChildren
}: RevealProps) {
  const { appearance } = useAppearance();
  
  if (!appearance.animation.enabled) {
    return <div className={width}>{children}</div>;
  }

  const animStyle = appearance.animation.style;
  const animSpeedMultiplier = appearance.animation.speed === 'fast' ? 0.5 : appearance.animation.speed === 'slow' ? 1.5 : 1;
  const actualDuration = duration * animSpeedMultiplier;
  const actualY = animStyle === 'fade' || animStyle === 'none' ? 0 : y;

  if (staggerChildren !== undefined) {
    // Parent container that staggers children
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerChildren,
          delayChildren: delay,
        }
      }
    };

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className={width}
      >
        {children}
      </motion.div>
    );
  }

  // Individual item animation
  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: actualY,
      x: x
    },
    visible: { 
      opacity: 1, 
      y: 0,
      x: 0,
      transition: { 
        duration: actualDuration, 
        ease: [0.16, 1, 0.3, 1], // Luxury cubic bezier easing
        delay: delay 
      } 
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={width}
    >
      {children}
    </motion.div>
  );
}

// Companion component for items within a staggered parent Reveal
export function RevealItem({
  children,
  y = 30,
  x = 0,
  duration = 0.85
}: {
  children: ReactNode;
  y?: number;
  x?: number;
  duration?: number;
}) {
  const { appearance } = useAppearance();

  if (!appearance.animation.enabled) {
    return <div className="w-full">{children}</div>;
  }

  const animStyle = appearance.animation.style;
  const animSpeedMultiplier = appearance.animation.speed === 'fast' ? 0.5 : appearance.animation.speed === 'slow' ? 1.5 : 1;
  const actualDuration = duration * animSpeedMultiplier;
  const actualY = animStyle === 'fade' || animStyle === 'none' ? 0 : y;

  const itemVariants = {
    hidden: { opacity: 0, y: actualY, x },
    visible: { 
      opacity: 1, 
      y: 0, 
      x: 0,
      transition: {
        duration: actualDuration,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <motion.div variants={itemVariants} className="w-full">
      {children}
    </motion.div>
  );
}
