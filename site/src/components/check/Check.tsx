import Question, { type SupportedItem } from './Question';
import type { TaughtIn } from './taught';
import './check.css';

export interface Props {
  item: SupportedItem;
  /** The statement of each misconception ID in the item. */
  misconceptions: Record<string, string>;
  /** The link to the place that taught the item, shown with the grade. */
  taughtIn?: TaughtIn;
}

export default function Check({ item, misconceptions, taughtIn }: Props) {
  return (
    <section class="chk" aria-label="Check">
      <p class="chk-kind">Check</p>
      <Question item={item} misconceptions={misconceptions} name={`check-${item.id}`} mode="graded" taughtIn={taughtIn} />
    </section>
  );
}
