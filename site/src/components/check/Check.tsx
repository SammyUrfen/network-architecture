import Question, { type SupportedItem } from './Question';
import './check.css';

export interface Props {
  item: SupportedItem;
  /** The statement of each misconception ID in the item. */
  misconceptions: Record<string, string>;
}

export default function Check({ item, misconceptions }: Props) {
  return (
    <section class="chk" aria-label="Check">
      <p class="chk-kind">Check</p>
      <Question item={item} misconceptions={misconceptions} name={`check-${item.id}`} mode="graded" />
    </section>
  );
}
