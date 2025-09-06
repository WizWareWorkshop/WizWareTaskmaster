// Function to generate a list of distinct HSL colors
export function generateColors(count: number): string[] {
    const colors: string[] = [];
    const saturation = 70;
    const lightness = 50;
    
    for (let i = 0; i < count; i++) {
        const hue = (i * (360 / (count + 1))) % 360;
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    
    return colors;
}
