import { createContext, useEffect, useLayoutEffect, version, type ReactElement, type Ref } from 'react'

// Text that only screen readers hear. PaigerProvider's `labels` replaces it,
// e.g. to translate it.
export const DEFAULT_LABELS = {
	// The × on a modal
	close: 'Close',
	// The × on a toast
	dismiss: 'Dismiss',
	loading: 'Loading'
}
export type PaigerLabels = typeof DEFAULT_LABELS
export const LabelsContext = createContext<PaigerLabels>(DEFAULT_LABELS)

// Everything that can take keyboard focus, for focus traps and first focus
const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// The focusable elements that are on screen. A closed popover keeps its
// content mounted but hidden, and that mustn't count.
export const focusables = (root: Element) =>
	[...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0)

// Length of a script-driven animation, in ms. It comes from a --pg-duration-*
// variable so themes can change it, and it's 0 when the user asks for reduced
// motion (CSS media queries can't reach the Web Animations API).
export const duration = (variable: string, fallback: number): number => {
	if (typeof window === 'undefined') return fallback
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0
	const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
	const amount = parseFloat(value)
	if (Number.isNaN(amount)) return fallback
	return value.endsWith('ms') ? amount : amount * 1000
}

// The ref a child element was given. React 19 keeps it in props; React 18
// keeps it on the element, and React 19 warns if you read it there.
const reactMajor = parseInt(version, 10)
export const refOf = <T>(element: ReactElement): Ref<T> | undefined =>
	reactMajor >= 19
		? (element.props as { ref?: Ref<T> }).ref
		: (element as unknown as { ref?: Ref<T> }).ref

export const setRef = <T>(ref: Ref<T> | undefined, node: T | null) => {
	if (typeof ref === 'function') ref(node)
	else if (ref) (ref as { current: T | null }).current = node
}

// The modal and toast hosts register in a layout effect, which runs before
// any useEffect in the app, so a modal or toast opened on mount still finds
// them. Plain useEffect on the server, where layout effects warn in React 18.
export const useHostEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect
