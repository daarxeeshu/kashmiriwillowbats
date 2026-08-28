import { repairProcessSteps } from "@/data/bat-doctor";

/* ── How a repair actually goes ────────────────────────────────────────────────────
 *
 * Server component. Four steps from `repairProcessSteps`, and the reason it sits between
 * the diagnosis and the closing band is trust: a customer is about to post a bat they
 * paid for to strangers, and the thing that makes that feel reasonable is knowing what
 * happens to it while it is out of their hands.
 *
 * Deliberately no imagery. There is no workshop photography in this project and §6 says
 * not to invent any — four numbered statements set in the site's own type read as
 * confident, whereas four stock photographs of someone else's workshop would read as
 * exactly what they are. */

export function RepairProcess() {
  return (
    <section
      aria-labelledby="bd-process-heading"
      className="section-padding border-t border-border"
    >
      <div className="container-main">
        <div className="max-w-2xl">
          <p className="eyebrow">The process</p>
          <h2
            id="bd-process-heading"
            className="mt-3 font-serif text-[clamp(1.75rem,6vw,2.75rem)] font-semibold leading-tight text-white"
          >
            How your bat gets its life back
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-white/50">
            Every bat follows the same four stages, and you hear from us at the second one
            — before any work is committed to.
          </p>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border sm:grid-cols-2 lg:grid-cols-4">
          {repairProcessSteps.map((stage) => (
            <li
              key={stage.number}
              className="bg-[linear-gradient(160deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-6 lg:p-7"
            >
              <span className="block font-mono text-[12px] tracking-[0.14em] text-expert/80">
                {stage.number}
              </span>
              <h3 className="mt-4 text-[16px] font-semibold uppercase tracking-[0.06em] text-white">
                {stage.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/50">
                {stage.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
