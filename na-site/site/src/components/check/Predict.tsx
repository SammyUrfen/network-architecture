import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import Question, { type SupportedItem } from './Question';
import Reveal from './Reveal';
import type { TaughtIn } from './taught';
import './check.css';

export interface Props {
  /** A predict item. */
  item: SupportedItem;
  /** The statement of each misconception ID in the item. */
  misconceptions: Record<string, string>;
  /** The observed result, such as a terminal capture. It stays hidden until the learner commits a prediction. */
  children?: ComponentChildren;
  /** The link to the place that taught the item, shown with the grade. */
  taughtIn?: TaughtIn;
}

export default function Predict({ item, misconceptions, children, taughtIn }: Props) {
  const [done, setDone] = useState(false);
  return (
    <section class="chk" aria-label="Predict, observe, explain">
      <p class="chk-kind">Predict, then observe</p>
      <Question item={item} misconceptions={misconceptions} name={`predict-${item.id}`} mode="graded" hideExplanation taughtIn={taughtIn} onDone={() => setDone(true)} />
      <div class="chk-observe" hidden={!done}>
        {children}
      </div>
      {done && <Reveal prompt="Why was your prediction right or wrong? Explain it in your own words." model={item.explanation} modelLabel="What explains it." />}
    </section>
  );
}
