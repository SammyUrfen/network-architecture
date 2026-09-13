// Content strings in quiz files and in MDX props mark code with backticks,
// as in "`Content-Length: 219`". This renders those parts as <code>.
export interface Props {
  text: string;
}

export default function Inline({ text }: Props) {
  return <>{text.split('`').map((part, i) => (i % 2 === 1 ? <code key={i}>{part}</code> : part))}</>;
}
