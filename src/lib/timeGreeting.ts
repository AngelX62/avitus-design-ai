export type TimeGreeting = "Good morning" | "Good afternoon" | "Good evening";

export const getBrowserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
};

export const getHourInTimeZone = (date: Date, timeZone?: string) => {
  if (!timeZone) return date.getHours();

  try {
    const hourPart = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .find((part) => part.type === "hour");

    const hour = Number.parseInt(hourPart?.value ?? "", 10);
    return Number.isFinite(hour) ? hour : date.getHours();
  } catch {
    return date.getHours();
  }
};

export const getTimeGreeting = (date = new Date(), timeZone = getBrowserTimeZone()): TimeGreeting => {
  const hour = getHourInTimeZone(date, timeZone);
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};
