import React, { useEffect, FC, ReactNode } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

interface FadeInSectionProps {
  children: ReactNode;
  className?: string;
}

const FadeInSection: FC<FadeInSectionProps> = ({
  children,
  className = "",
}) => {
  const controls = useAnimation();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  useEffect(() => {
    if (isInView) {
      controls.start({
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          ease: "easeOut",
        },
      });
    }
  }, [controls, isInView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
      className={className}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
};

export default FadeInSection;
