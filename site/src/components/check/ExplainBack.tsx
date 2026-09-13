import Reveal from './Reveal';
import './check.css';

export interface Props {
  /** A "why" question from rung 4. */
  prompt: string;
  model: string;
}

export default function ExplainBack({ prompt, model }: Props) {
  return (
    <section class="chk" aria-label="Explain it back">
      <p class="chk-kind">Explain it back</p>
      <Reveal prompt={prompt} model={model} />
    </section>
  );
}
