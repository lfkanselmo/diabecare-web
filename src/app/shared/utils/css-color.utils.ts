export function getCssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function getCssColor(name: string, fallback: string): string {
    const value = getCssVar(name);
    return value.length > 0 ? value : fallback;
}