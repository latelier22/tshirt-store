/** TV mode: render titles immediately without one animation layer per word. */
export default function AnimatedWords({ text, className }: {
  text: string; className?: string; delay?: number;
}) {
  return <span className={className}>{text}</span>;
}
