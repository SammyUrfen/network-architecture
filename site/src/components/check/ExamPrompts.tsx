import Reveal from './Reveal';
import './check.css';

export interface Props {
  /** 2 or 3 exam-style prompts at rung 4 depth, each with its model answer. */
  prompts: Array<{ prompt: string; model: string }>;
}

export default function ExamPrompts({ prompts }: Props) {
  return (
    <section class="chk" aria-label="How it shows up in a question">
      <p class="chk-kind">How it shows up in a question</p>
      <p class="chk-note">Answer each prompt as you would in the exam. Then compare with the model answer.</p>
      <ol class="chk-list">
        {prompts.map((prompt, i) => (
          <li key={i}>
            <Reveal prompt={prompt.prompt} model={prompt.model} />
          </li>
        ))}
      </ol>
    </section>
  );
}
