# Session 1: fixture

## 3. Claim inventory

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S01-C01 | TCP delivers a byte stream with no message edges. | `slide 1` | core |
| S01-C02 | A read can return part of a message, or parts of two. | `slide 2` | core |
| S01-C03 | One read of 10 bytes, two sends, loopback, the instructor's laptop. | `slide 3` | measured |

Not a claim: S01-C09 in a sentence.

## 5. Modules

### s01-m01-alpha

**Misconceptions.**
- S01-M01: "One read() returns one whole message." Wrong: a read returns the bytes that wait. Distractor in check 1.
- S01-M02 (from s01-m00): "TCP sends each write() as one packet." Distractor in check 1.
- S01-M01 appears again in check 2.
- S01-M03 and S01-M01 appear again: a reference names an ID, it does not define it.

### s01-m01-alpha, not a heading the verifier reads
