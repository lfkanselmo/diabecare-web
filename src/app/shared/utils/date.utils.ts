export function toLocalDateString(date: Date): string {
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function toLocalIso(date: Date): string {
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function nowAsLocalIso(): string {
    return toLocalIso(new Date());
}

export function daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

export function formatDateRangeLabel(from: Date, to: Date, lang: string): string {
    const locale = lang === 'en' ? 'en-US' : 'es-CO';
    return `${from.toLocaleDateString(locale)} — ${to.toLocaleDateString(locale)}`;
}