import logo from "@/assets/avitus-logo.png";
import logoWhite from "@/assets/avitus-logo-white.png";

export const Logo = ({ size = 28, withWordmark = false }: { size?: number; withWordmark?: boolean }) => (
  <div className="flex items-center gap-2.5">
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <img
        src={logo}
        alt="Avitus"
        width={size}
        height={size}
        className="h-full w-full object-contain transition-opacity duration-200 dark:opacity-0"
      />
      <img
        src={logoWhite}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="absolute inset-0 h-full w-full scale-[1.92] object-contain opacity-0 transition-opacity duration-200 dark:opacity-100"
      />
    </span>
    {withWordmark && (
      <span className="font-serif text-xl tracking-wider text-pine">Avitus</span>
    )}
  </div>
);
