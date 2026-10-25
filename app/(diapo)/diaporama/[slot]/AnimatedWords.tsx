"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Word reveals finish early enough to leave the slide readable. */
export default function AnimatedWords({ text, className, delay = 0 }: {
  text: string; className?: string; delay?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.trim().split(/\s+/);
  return <span className={className} aria-label={text}>
    {words.map((word, index) => <span key={`${index}-${word}`}
      aria-hidden="true" style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: ".12em", marginBottom: "-.12em", marginRight: ".22em" }}>
      <motion.span style={{ display: "inline-block" }}
        initial={{ y: reduced ? 0 : "110%", rotate: reduced ? 0 : 5, opacity: 0 }}
        animate={{ y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: reduced ? .15 : .65, delay: reduced ? 0 : delay + Math.min(index * .065, .65), ease: [.22, 1, .36, 1] }}>
        {word}
      </motion.span>
    </span>)}
  </span>;
}
