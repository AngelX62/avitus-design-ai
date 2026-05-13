import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        ink: "hsl(var(--ink))",
        ivory: "hsl(var(--ivory))",
        stone: "hsl(var(--stone))",
        sand: "hsl(var(--sand))",
        pine: "hsl(var(--pine))",
        "pine-foreground": "hsl(var(--pine-foreground))",
        moss: "hsl(var(--moss))",
        "moss-soft": "hsl(var(--moss-soft))",
        sage: {
          DEFAULT: "hsl(var(--sage))",
          soft: "hsl(var(--sage-soft))",
          deep: "hsl(var(--sage-deep))",
          glow: "hsl(var(--sage-glow))",
        },
        attn: {
          DEFAULT: "hsl(var(--attn))",
          soft: "hsl(var(--attn-soft))",
          rule: "hsl(var(--attn-rule))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        rest: "var(--shadow-rest)",
        hover: "var(--shadow-hover)",
        focus: "var(--shadow-focus)",
        attention: "var(--shadow-attention)",
        "inner-highlight": "var(--inner-highlight)",
        "rest-lit": "var(--inner-highlight), var(--shadow-rest)",
        "hover-lit": "var(--inner-highlight), var(--shadow-hover)",
        "attention-lit": "var(--inner-highlight), var(--shadow-attention)",
      },
      backgroundImage: {
        hairline:
          "linear-gradient(90deg, transparent, hsl(var(--border)) 18%, hsl(var(--border)) 82%, transparent)",
        "sage-glow":
          "radial-gradient(circle at 50% 0%, hsl(var(--sage-glow) / 0.18), transparent 70%)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "orb-rotate": {
          to: { transform: "rotate(360deg)" },
        },
        "orb-bloom": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--pine) / 0.42)" },
          "100%": { boxShadow: "0 0 0 var(--orb-bloom-size, 14px) hsl(var(--pine) / 0)" },
        },
        "orb-ripple": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--stone) / 0.45)" },
          "100%": { boxShadow: "0 0 0 var(--orb-bloom-size, 16px) hsl(var(--stone) / 0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "orb-rotate-idle": "orb-rotate 32s linear infinite",
        "orb-rotate-think": "orb-rotate 7s linear infinite",
        "orb-bloom": "orb-bloom 220ms ease-out",
        "orb-ripple": "orb-ripple 260ms ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
