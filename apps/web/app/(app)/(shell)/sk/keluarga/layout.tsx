/** SK-theme screens (PRD §5.2): Nunito body, Baloo headings, Fredoka buttons; purple navigates, red acts. */
export default function SkLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-sk sk-wrap page-narrow">{children}</div>;
}
