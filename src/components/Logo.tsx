import logo from "@/assets/avitus-logo.png";

export const Logo = ({ size = 28, withWordmark = false }: { size?: number; withWordmark?: boolean }) => (
  <div className="flex items-center gap-2.5">
    <img src={logo} alt="Avitus" width={size} height={size} className="object-contain" />
    {withWordmark && (
      <span className="font-serif text-xl tracking-wider text-ink">Avitus</span>
    )}
  </div>
);