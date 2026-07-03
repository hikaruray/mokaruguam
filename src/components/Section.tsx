// Shared section shell: eyebrow + heading + sub-copy, consistent spacing.

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
      {children}
    </div>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-1.5 mb-2 text-2xl font-bold sm:text-3xl">{children}</h2>
  );
}

export function Sub({ children }: { children: React.ReactNode }) {
  return <p className="max-w-2xl text-muted">{children}</p>;
}
