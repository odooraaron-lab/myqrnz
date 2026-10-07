export function PageHead({ title, intro, actions }: { title: string; intro?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-semiwide text-[clamp(1.6rem,3vw,2.1rem)]">{title}</h1>
        {intro && <p className="mt-2 max-w-[62ch] text-ink-soft">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
