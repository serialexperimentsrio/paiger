export type Rgba = { hex: string; a: number }

export type Theme = {
	main: string
	accent: string
	bright: string
	dim: string
	danger: Rgba
	warning: Rgba
	success: Rgba
	backdrop: Rgba
	border: number
	radius: number
	shadow: string
}

export type PresetName = 'Light' | 'Dark'

export const PRESETS: Record<PresetName, Theme> = {
	// Parchment and ink, with a hard offset shadow like a cel shadow
	Light: {
		main: '#f4ecdc',
		accent: '#2b1f17',
		bright: '#241a13',
		dim: '#7b6a58',
		danger: { hex: '#b3261e', a: 0.55 },
		warning: { hex: '#d9a21b', a: 0.35 },
		success: { hex: '#3f8f5a', a: 0.3 },
		backdrop: { hex: '#120c08', a: 0.55 },
		border: 2,
		radius: 0,
		shadow: '4px 4px 0 rgba(20, 12, 8, 0.55)'
	},
	Dark: {
		main: '#1c1714',
		accent: '#e8dcc4',
		bright: '#f3ead8',
		dim: '#a69886',
		danger: { hex: '#ff6b5b', a: 0.3 },
		warning: { hex: '#f2c14e', a: 0.28 },
		success: { hex: '#6fcf8f', a: 0.25 },
		backdrop: { hex: '#000000', a: 0.6 },
		border: 2,
		radius: 0,
		shadow: '4px 4px 0 rgba(0, 0, 0, 0.6)'
	}
}

const rgba = ({ hex, a }: Rgba) => {
	const n = parseInt(hex.slice(1), 16)
	return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${+a.toFixed(2)})`
}

/** The ricebowl custom properties for a theme, in the order of tokens.css */
export const rbVars = (t: Theme): [string, string][] => [
	['--rb-color-main', t.main],
	['--rb-color-accent', t.accent],
	['--rb-color-bright', t.bright],
	['--rb-color-dim', t.dim],
	['--rb-color-danger', rgba(t.danger)],
	['--rb-color-warning', rgba(t.warning)],
	['--rb-color-success', rgba(t.success)],
	['--rb-color-backdrop', rgba(t.backdrop)],
	['--rb-border-width', `${t.border}px`],
	['--rb-radius', `${t.radius}px`],
	['--rb-shadow', t.shadow]
]

export const toCss = (t: Theme) =>
	`:root {\n${rbVars(t)
		.map(([k, v]) => `  ${k}: ${v};`)
		.join('\n')}\n}`

// Light surfaces have dark text; the demo's white line icons need inverting there
export const isLight = (t: Theme) => {
	const n = parseInt(t.main.slice(1), 16)
	const lum = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)
	return lum > 140
}

export const applyTheme = (t: Theme) => {
	const root = document.documentElement.style
	for (const [k, v] of rbVars(t)) root.setProperty(k, v)
	root.setProperty('--icon-filter', isLight(t) ? 'invert(1)' : 'none')
	// Hovered buttons swap to the accent colour, so their icons flip too
	root.setProperty('--icon-filter-hover', isLight(t) ? 'none' : 'invert(1)')
}
