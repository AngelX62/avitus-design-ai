import logo from "@/assets/avitus-logo.png";

export const Logo = ({ size = 26, withWordmark = false }: { size?: number; withWordmark?: boolean }) => (
  <div className="flex items-center gap-2.5">
    <img src={logo} alt="Avitus" width={size} height={size} className="object-contain" />
    {withWordmark && (
      <span className="font-serif text-[26px] tracking-[0.02em] text-ink leading-none">Avitus</span>
    )}
  </div>
);