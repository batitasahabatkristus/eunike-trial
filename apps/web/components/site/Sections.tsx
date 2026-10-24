import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import { routes, type Locale } from "@/lib/routes";
import { SITE_LINKS } from "@/lib/site";
import { ContactForm } from "@/components/site/ContactForm";

const A = (f: string) => `/assets/site/${f}`;

/** F-03: real destinations. Eureka and HS4Life keep the contact anchor until their own sites are confirmed (OPEN Q-15). */
const ministryHref = (key: string, locale: Locale) =>
  ({ sk: routes.skRegister, counseling: routes.counseling, events: routes.events } as Record<string, string>)[key] ?? `/${locale}#contact`;

const MINISTRY_IMG: Record<string, string> = { sk: "sahabat-kristus.jpg", eureka: "eureka-school.jpg", hs4life: "hs4life.jpg", counseling: "counseling.jpg", events: "seminar.jpg" };
const MINISTRY_CLASS: Record<string, string> = { sk: " ministry-card-large", events: " ministry-card-wide" };
const MINISTRY_DELAY = ["", " reveal-delay-1", "", " reveal-delay-1", ""];
const STORY_IMG = ["community.jpg", "parent-child.jpg", "training.jpg", "seminar.jpg"];
const STORY_CLASS = [" story-photo-wide", " story-photo-tall", "", ""];
const STORY_DELAY = ["", " reveal-delay-1", "", " reveal-delay-1"];
const BELIEF = ["purple", "pink", "lilac", "peach"];

export function Hero({ m, locale }: { m: Messages["hero"]; locale: Locale }) {
  return (
    <section className="hero" id="top">
      <div className="hero-pattern pattern-dots" aria-hidden="true" />
      <div className="hero-loop hero-loop-one" aria-hidden="true" />
      <div className="hero-loop hero-loop-two" aria-hidden="true" />
      <div className="container hero-grid">
        <div className="hero-copy reveal">
          <div className="eyebrow"><span className="eyebrow-dot" /> {m.eyebrow}</div>
          <p className="script-note">{m.script}</p>
          <h1>{m.title}<span>{m.titleAccent}</span></h1>
          <p className="hero-lead">{m.lead}</p>
          <div className="hero-actions">
            <a className="button button-primary" href={`/${locale}#ministries`}>{m.ctaPrimary} <span aria-hidden="true">→</span></a>
            <a className="button button-ghost" href={`/${locale}#about`}>{m.ctaSecondary}</a>
          </div>
          <div className="verse-card">
            <span className="verse-mark">“</span>
            <p>{m.verse}</p>
            <strong>{m.verseRef}</strong>
          </div>
        </div>
        <div className="hero-visual reveal reveal-delay-1">
          <div className="hero-photo hero-photo-main">
            <Image src={A("hero-family.jpg")} alt={m.altMain} fill sizes="(max-width: 840px) 94vw, 520px" priority />
          </div>
          <div className="hero-photo hero-photo-small">
            <Image src={A("parent-child.jpg")} alt={m.altSmall} fill sizes="(max-width: 840px) 40vw, 230px" />
          </div>
          <div className="hero-logo-orbit">
            <Image src={A("eunike-mark.png")} alt="" width={118} height={83} style={{ height: "auto" }} aria-hidden="true" />
          </div>
          <div className="hero-badge">
            <span>{m.badgeTop}</span>
            <strong>{m.badgeYear}</strong>
            <small>{m.badgeBottom}</small>
          </div>
          <svg className="hero-wave" viewBox="0 0 260 125" fill="none" aria-hidden="true">
            <path d="M5 74C48 22 72 119 115 66C156 15 184 105 255 43" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M6 90C49 38 73 135 116 82C157 31 185 121 256 59" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity=".7" />
            <path d="M7 106C50 54 74 151 117 98C158 47 186 137 257 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity=".42" />
          </svg>
        </div>
      </div>
    </section>
  );
}

export function Ribbon({ items }: { items: string[] }) {
  return (
    <section className="values-ribbon" aria-label="Yayasan Eunike">
      <div className="container values-ribbon-inner">
        {items.map((t, i) => (<Fragment key={t}>{i > 0 ? <i /> : null}<span>{t}</span></Fragment>))}
      </div>
    </section>
  );
}

export function About({ m, locale }: { m: Messages["about"]; locale: Locale }) {
  return (
    <section className="section about-section" id="about">
      <div className="container">
        <div className="section-heading reveal">
          <div><span className="kicker">{m.kicker}</span><h2>{m.title}<em>{m.titleEm}</em></h2></div>
          <p>{m.lead}</p>
        </div>
        <div className="about-grid">
          <article className="about-feature reveal">
            <div className="about-feature-copy">
              <span className="mini-label">{m.label}</span>
              <h3>{m.featureTitle}</h3>
              <p>{m.featureBody}</p>
              <a href={`/${locale}#journey`} className="text-link">{m.featureLink} <span>↗</span></a>
            </div>
            <div className="about-feature-art" aria-hidden="true">
              <div className="heart-line" />
              <Image src={A("eunike-mark.png")} alt="" width={140} height={98} style={{ height: "auto" }} />
            </div>
          </article>
          <div className="belief-cards reveal reveal-delay-1">
            {m.beliefs.map((b, i) => (
              <article key={b.title} className={`belief-card belief-${BELIEF[i]}`}>
                <span className="belief-number">{String(i + 1).padStart(2, "0")}</span>
                <h3>{b.title}</h3>
                <p>{b.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Vision({ m }: { m: Messages["vision"] }) {
  return (
    <section className="section vision-section">
      <div className="container vision-grid">
        <div className="vision-photo reveal">
          <Image src={A("family-faith.jpg")} alt={m.alt} fill sizes="(max-width: 840px) 92vw, 460px" />
          <div className="photo-sticker">
            <span className="sticker-script">{m.script}</span>
            <strong>{m.sticker[0]}<br />{m.sticker[1]}</strong>
          </div>
        </div>
        <div className="vision-copy reveal reveal-delay-1">
          <span className="kicker">{m.kicker}</span>
          <h2>{m.title}</h2>
          <p className="vision-lead">{m.lead}</p>
          <div className="mission-list">
            {m.missions.map((t, i) => (<div className="mission-item" key={t}><span>{String(i + 1).padStart(2, "0")}</span><p>{t}</p></div>))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Ministries({ m, locale }: { m: Messages["ministries"]; locale: Locale }) {
  return (
    <section className="section ministries-section" id="ministries">
      <div className="container">
        <div className="section-heading section-heading-light reveal">
          <div><span className="kicker kicker-light">{m.kicker}</span><h2>{m.title}<em>{m.titleEm}</em></h2></div>
          <p>{m.lead}</p>
        </div>
        <div className="ministry-grid">
          {m.items.map((it, i) => (
            <article key={it.key} className={`ministry-card${MINISTRY_CLASS[it.key] ?? ""} reveal${MINISTRY_DELAY[i]}`}>
              <div className="ministry-image">
                <Image src={A(MINISTRY_IMG[it.key])} alt={it.alt} fill sizes={it.key === "sk" ? "(max-width: 840px) 100vw, 620px" : "(max-width: 840px) 100vw, 380px"} />
              </div>
              <div className="ministry-content">
                <span className="program-label">{it.label}</span>
                <h3>{it.title}</h3>
                <p>{it.body}</p>
                <Link href={ministryHref(it.key, locale)} className="card-link">{it.cta} <span>→</span></Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const ICONS = [
  "M8 12h8M4 7h6v10H4zM14 5h6v14h-6z",
  "M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z",
  "M12 3v18M3 12h18M6 6l12 12M18 6 6 18",
];

export function Ecosystem({ m }: { m: Messages["ecosystem"] }) {
  return (
    <section className="section ecosystem-section">
      <div className="ecosystem-pattern pattern-dots" aria-hidden="true" />
      <div className="container">
        <div className="section-heading reveal">
          <div><span className="kicker">{m.kicker}</span><h2>{m.title}<em>{m.titleEm}</em></h2></div>
          <p>{m.lead}<Link className="portal-link" href={routes.login}>{m.portalLink} →</Link></p>
        </div>
        <div className="ecosystem-grid">
          {m.items.map((it, i) => (
            <article key={it.title} className={`ecosystem-card${i === 1 ? " ecosystem-card-pink" : ""} reveal${i ? ` reveal-delay-${i}` : ""}`}>
              <div className="line-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={ICONS[i]} /></svg></div>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <h3>{it.title}</h3>
              <p>{it.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Journey({ m }: { m: Messages["journey"] }) {
  return (
    <section className="section journey-section" id="journey">
      <div className="container">
        <div className="journey-intro reveal">
          <span className="kicker">{m.kicker}</span>
          <h2>{m.title}<em>{m.titleEm}</em></h2>
          <p>{m.lead}</p>
        </div>
        <div className="journey-track reveal">
          <div className="journey-line" aria-hidden="true" />
          {m.steps.map((s, i) => (
            <article className="journey-step" key={s.title}>
              <div className="journey-dot">{String(i + 1).padStart(2, "0")}</div>
              <span>{s.tag}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Stories({ m }: { m: Messages["stories"] }) {
  return (
    <section className="section stories-section" id="stories">
      <div className="container">
        <div className="section-heading reveal">
          <div><span className="kicker">{m.kicker}</span><h2>{m.title}<em>{m.titleEm}</em></h2></div>
          <p>{m.lead}</p>
        </div>
        <div className="story-collage">
          {m.items.map((it, i) => (
            <figure key={it.title} className={`story-photo${STORY_CLASS[i]} reveal${STORY_DELAY[i]}`}>
              <Image src={A(STORY_IMG[i])} alt={it.alt} fill sizes={i === 0 ? "(max-width: 840px) 100vw, 700px" : "(max-width: 840px) 50vw, 380px"} />
              <figcaption><strong>{it.title}</strong><span>{it.caption}</span></figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Partner({ m, locale }: { m: Messages["partner"]; locale: Locale }) {
  const bank = process.env.NEXT_PUBLIC_GIVING_ACCOUNT; // F-13 / Q-07: shown only once Eunike supplies it
  return (
    <section className="section partner-section" id="partner">
      <div className="container partner-panel reveal">
        <div className="partner-copy">
          <span className="kicker kicker-light">{m.kicker}</span>
          <h2>{m.title}</h2>
          <p>{m.lead}</p>
          {bank ? <p><strong>{m.bankLabel}:</strong> {bank}</p> : null}
          <div className="partner-actions">
            <a className="button button-white" href={`/${locale}#contact`}>{m.cta} <span aria-hidden="true">→</span></a>
            <a className="partner-link" href={`/${locale}#ministries`}>{m.link}</a>
          </div>
        </div>
        <div className="partner-principles">
          {m.principles.map((p) => (<div className="principle-card" key={p.title}><strong>{p.title}</strong><span>{p.body}</span></div>))}
        </div>
      </div>
    </section>
  );
}

export function Contact({ m, locale }: { m: Messages["contact"]; locale: Locale }) {
  const L = SITE_LINKS;
  return (
    <section className="contact-section" id="contact">
      <div className="container contact-grid">
        <div className="contact-brand reveal">
          <Image src={A("eunike-logo.png")} alt={m.logoAlt} width={270} height={302} style={{ height: "auto" }} />
          <p className="contact-tagline">{m.tagline}</p>
        </div>
        <div className="contact-cta reveal reveal-delay-1">
          <span className="kicker">{m.kicker}</span>
          <h2>{m.title}</h2>
          <p>{m.lead}</p>
          <div className="contact-links">
            <a href={`mailto:${L.email}`}>{L.email} <span>↗</span></a>
            <a href={L.website} target="_blank" rel="noreferrer">{L.websiteLabel} <span>↗</span></a>
            <a href={`tel:${L.phone}`}>{L.phoneLabel} <span>↗</span></a>
            <a href={L.instagram} target="_blank" rel="noreferrer">{L.instagramLabel} <span>↗</span></a>
          </div>
          <ContactForm locale={locale} m={m.form} />
        </div>
      </div>
    </section>
  );
}

export function Footer({ m, locale }: { m: Messages["footer"]; locale: Locale }) {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <span>© {new Date().getFullYear()} {m.copy}</span>
        <span>{m.tagline}</span>
        <ul>
          <li><Link href={`/${locale}/privasi`}>{m.privacy}</Link></li>
          <li><Link href={`/${locale}/syarat`}>{m.terms}</Link></li>
          <li><a href="#top">{m.top}</a></li>
        </ul>
      </div>
    </footer>
  );
}
