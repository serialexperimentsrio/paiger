export const setupObservers = (
	triggerElement: HTMLElement,
	popoverContentElement: HTMLElement | null,
	updatePosition: () => void
) => {
	// Bunch up resize and scroll events into one update
	let updateTimeout: number | undefined
	const debouncedUpdate = () => {
		if (updateTimeout) clearTimeout(updateTimeout)
		updateTimeout = window.setTimeout(updatePosition, 8)
	}

	const targetResizeObserver = new ResizeObserver(debouncedUpdate)
	const popoverResizeObserver = new ResizeObserver(debouncedUpdate)

	// Watch a few ancestors too: they can move the trigger without resizing it
	targetResizeObserver.observe(triggerElement)
	let currentElement = triggerElement.parentElement
	let depth = 0
	while (currentElement && currentElement !== document.body && depth < 5) {
		targetResizeObserver.observe(currentElement)
		currentElement = currentElement.parentElement
		depth++
	}

	if (popoverContentElement) {
		popoverResizeObserver.observe(popoverContentElement)
	}

	// Follow the trigger when it scrolls inside a container
	const scrollableParents: Element[] = []
	let scrollParent = triggerElement.parentElement
	while (scrollParent && scrollParent !== document.documentElement) {
		const { overflow, overflowX, overflowY } = window.getComputedStyle(scrollParent)
		if (/auto|scroll/.test(`${overflow} ${overflowX} ${overflowY}`)) {
			scrollableParents.push(scrollParent)
			scrollParent.addEventListener('scroll', debouncedUpdate, { passive: true })
		}
		scrollParent = scrollParent.parentElement
	}

	document.addEventListener('scroll', debouncedUpdate, { passive: true })

	// Class and style changes nearby can move the trigger as well
	const mutationObserver = new MutationObserver(() => {
		requestAnimationFrame(debouncedUpdate)
	})

	const observeTarget = triggerElement.parentElement || document.body
	mutationObserver.observe(observeTarget, {
		attributes: true,
		attributeFilter: ['style', 'class', 'transform'],
		childList: true,
		subtree: true
	})

	window.addEventListener('resize', debouncedUpdate)

	return () => {
		targetResizeObserver.disconnect()
		popoverResizeObserver.disconnect()
		mutationObserver.disconnect()
		window.removeEventListener('resize', debouncedUpdate)
		document.removeEventListener('scroll', debouncedUpdate)

		for (const parent of scrollableParents) {
			parent.removeEventListener('scroll', debouncedUpdate)
		}

		if (updateTimeout) clearTimeout(updateTimeout)
	}
}
