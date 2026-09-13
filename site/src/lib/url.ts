// Every internal link goes through here, so a change of `base` in
// astro.config.mjs changes no page (docs/PLAN.md section 9).
const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** A site path, such as `review/` or `favicon.svg`, joined to the base. */
export const href = (path = '') => base + path.replace(/^\//, '');

/** `s01-m08-framing` lives at `s01/m08-framing/`. */
export const moduleParams = (id: string) => ({ session: id.slice(0, 3), module: id.slice(4) });

export const moduleHref = (id: string) => {
  const { session, module } = moduleParams(id);
  return href(`${session}/${module}/`);
};

export const sessionHref = (n: number) => href(`s${String(n).padStart(2, '0')}/`);

/** A calendar date from the content, as YYYY-MM-DD. YAML dates load as UTC midnight. */
export const day = (d: Date) => d.toISOString().slice(0, 10);
