export const Logo = ({ size = 24, withWordmark = false }: { size?: number; withWordmark?: boolean }) => (
  <div className="flex items-baseline gap-2.5 leading-none" style={{ minHeight: size }}>
    <span className="text-[18px] font-medium tracking-[-0.02em] text-foreground">
      AVITUS<span className="text-accent">.</span>
    </span>
    {withWordmark && (
      <span className="text-[10px] tracking-[0.18em] uppercase text-graphite">Studio OS</span>
    )}
  </div>
);
