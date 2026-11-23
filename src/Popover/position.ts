export type Placement = 'top' | 'bottom' | 'left' | 'right'

export const POPOVER_CONFIG = {
	viewportPadding: 20,
	triggerSpacing: 5,
	animationOffset: {
		small: 10,
		medium: 20
	},
	// Duration comes from --pg-duration-popover
	easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
}

// Where each side ends up once the animation is done
export const TRANSFORMS = {
	top: 'translateY(-100%)',
	bottom: 'none',
	left: 'translateX(-100%) translateY(-50%)',
	right: 'translateY(-50%)'
} as const

// A trigger inside something fixed needs a fixed popover too
export const isInsideFixedContainer = (element: Element): boolean => {
	let current = element.parentElement
	while (current && current !== document.body) {
		const style = window.getComputedStyle(current)
		if (style.position === 'fixed') return true
		current = current.parentElement
	}
	return false
}

export const createPositionStyle = (
	position: Placement,
	rect: DOMRect,
	spacing: number,
	padding: number,
	scrollTop: number,
	scrollLeft: number,
	useFixed: boolean = false,
	popoverSize?: { width: number; height: number },
	matchTriggerWidth: boolean = false
) => {
	const base = {
		position: useFixed ? ('fixed' as const) : ('absolute' as const),
		visibility: 'visible' as const,
		opacity: 1,
		contain: 'layout' as const
	}

	const maxWidth = `calc(100vw - ${padding * 2}px)`
	const triggerWidth = rect.width > 0 ? `${Math.round(rect.width)}px` : 'auto'
	const minHeight = rect.height > 0 ? `${rect.height}px` : 'auto'

	// Absolute positions need the scroll offset, fixed ones don't
	const x = useFixed ? rect.left : rect.left + scrollLeft
	const y = useFixed ? rect.top : rect.top + scrollTop

	const width = popoverSize?.width || 200
	const scrollOffsetX = useFixed ? 0 : scrollLeft

	const centeredLeft = `clamp(${padding + width / 2}px, ${x + rect.width / 2}px, calc(100vw - ${padding}px - ${width / 2}px + ${scrollOffsetX}px))`

	const positions = {
		top: {
			...base,
			left: matchTriggerWidth ? `${Math.round(x)}px` : centeredLeft,
			top: `${y - spacing}px`,
			transform: matchTriggerWidth ? TRANSFORMS.top : `translateX(-50%) ${TRANSFORMS.top}`,
			...(matchTriggerWidth ? { minWidth: triggerWidth } : {}),
			maxWidth
		},
		bottom: {
			...base,
			left: matchTriggerWidth ? `${Math.round(x)}px` : centeredLeft,
			top: `${y + rect.height + spacing}px`,
			transform: matchTriggerWidth ? TRANSFORMS.bottom : 'translateX(-50%)',
			...(matchTriggerWidth ? { minWidth: triggerWidth } : {}),
			maxWidth
		},
		left: {
			...base,
			left: `max(${padding + width}px, ${x - spacing}px)`,
			top: `${y + rect.height / 2}px`,
			transform: TRANSFORMS.left,
			maxWidth,
			minHeight
		},
		right: {
			...base,
			left: `min(${x + rect.width + spacing}px, calc(100vw - ${padding}px - ${width}px + ${scrollOffsetX}px))`,
			top: `${y + rect.height / 2}px`,
			transform: TRANSFORMS.right,
			maxWidth,
			minHeight
		}
	}

	return positions[position]
}

const getAvailableSpace = (triggerRect: DOMRect, padding: number) => ({
	top: triggerRect.top - padding,
	bottom: window.innerHeight - (triggerRect.top + triggerRect.height) - padding,
	left: triggerRect.left - padding,
	right: window.innerWidth - (triggerRect.left + triggerRect.width) - padding
})

const checkPositionFit = (
	position: Placement,
	triggerRect: DOMRect,
	size: { width: number; height: number },
	padding: number,
	scrollTop: number,
	useFixed: boolean
): boolean => {
	const space = getAvailableSpace(triggerRect, padding)
	const { triggerSpacing } = POPOVER_CONFIG

	if (position === 'top' || position === 'bottom') {
		const hasVerticalSpace = space[position] >= size.height + triggerSpacing
		const hasHorizontalSpace =
			triggerRect.left >= padding &&
			triggerRect.right <= window.innerWidth - padding

		return hasVerticalSpace && hasHorizontalSpace
	} else {
		const hasHorizontalSpace = space[position] >= size.width + triggerSpacing

		const centerY = triggerRect.top + triggerRect.height / 2
		const topEdge = centerY - size.height / 2
		const bottomEdge = centerY + size.height / 2

		if (useFixed) {
			return hasHorizontalSpace && topEdge >= padding && bottomEdge <= window.innerHeight - padding
		} else {
			return hasHorizontalSpace && topEdge >= scrollTop + padding
		}
	}
}

export const determinePosition = (
	triggerRect: DOMRect,
	size: { width: number; height: number } | null,
	scrollTop: number,
	useFixed: boolean,
	placement?: Placement,
	autoPlacements?: Placement[]
): Placement => {
	// An explicit side always wins
	if (placement) return placement
	if (!size) return 'bottom'

	const { viewportPadding: padding, triggerSpacing: spacing } = POPOVER_CONFIG

	// Prefer a side where it fits completely, then bottom, top, right, left
	const testPositions: Placement[] = autoPlacements || ['bottom', 'top', 'right', 'left']
	const positionScores: Array<{ position: Placement; score: number; fits: boolean }> = []

	for (const position of testPositions) {
		const fits = checkPositionFit(position, triggerRect, size, padding, scrollTop, useFixed)

		let score = 0
		if (position === 'bottom') score += 1000
		else if (position === 'top') score += 900
		else if (position === 'right') score += 800
		else if (position === 'left') score += 700

		if (fits) score += 500

		const availableSpace = getAvailableSpace(triggerRect, padding)[position]
		const sizeNeeded =
			position === 'bottom' || position === 'top'
				? size.height + spacing
				: size.width + spacing
		score += Math.min(1, sizeNeeded / availableSpace) * 100

		positionScores.push({ position, score, fits })
	}

	positionScores.sort((a, b) => {
		if (a.fits && !b.fits) return -1
		if (!a.fits && b.fits) return 1
		return b.score - a.score
	})

	return positionScores[0]?.position || 'bottom'
}
