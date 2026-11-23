import type { CSSProperties, ForwardedRef, KeyboardEvent, ReactNode } from 'react'
import { forwardRef, useId, useRef, useState } from 'react'
import style from './style.module.css'

export interface TabItem {
	key: string
	label: ReactNode
	content: ReactNode
	disabled?: boolean
}

export interface TabsProps {
	items: TabItem[]
	// Controlled: the selected key. Leave it out to let Tabs keep its own.
	value?: string
	// Uncontrolled: the key to start on. Defaults to the first enabled tab.
	defaultValue?: string
	onChange?: (key: string) => void
	// Names the tab list for screen readers, when nothing on the page does
	'aria-label'?: string
	'aria-labelledby'?: string
	className?: string
	style?: CSSProperties
}

// The ARIA tabs pattern: arrow keys move between tabs and select as they go,
// Home and End jump to the ends, and Tab moves on into the panel. Only the
// selected panel is rendered.
export const Tabs = /* @__PURE__ */ forwardRef(function Tabs(
	{
		items,
		value,
		defaultValue,
		onChange,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		className,
		style: customStyle
	}: TabsProps,
	ref: ForwardedRef<HTMLDivElement>
) {
	const id = useId()
	const [ownValue, setOwnValue] = useState(defaultValue ?? items.find((item) => !item.disabled)?.key)
	const current = value ?? ownValue
	const selected = items.findIndex((item) => item.key === current)
	const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

	const select = (index: number) => {
		const key = items[index].key
		setOwnValue(key)
		if (key !== current) onChange?.(key)
	}

	// The next enabled tab in a direction, wrapping round
	const step = (from: number, direction: 1 | -1) => {
		for (let i = 1; i <= items.length; i++) {
			const index = (from + direction * i + items.length) % items.length
			if (!items[index].disabled) return index
		}
		return from
	}

	const handleKeyDown = (e: KeyboardEvent, index: number) => {
		const moves: Record<string, () => number> = {
			ArrowRight: () => step(index, 1),
			ArrowLeft: () => step(index, -1),
			Home: () => step(-1, 1),
			End: () => step(items.length, -1)
		}
		const target = moves[e.key]?.()
		if (target === undefined) return
		e.preventDefault()
		select(target)
		tabRefs.current[target]?.focus()
	}

	// The tab that takes Tab focus: the selected one, or the first enabled
	const focusable = selected >= 0 && !items[selected].disabled ? selected : step(-1, 1)
	const panelId = `${id}-panel`
	const tabId = (index: number) => `${id}-tab-${index}`

	return (
		<div ref={ref} className={`pg-tabs ${style.tabs}${className ? ` ${className}` : ''}`} style={customStyle}>
			<div
				role="tablist"
				aria-label={ariaLabel}
				aria-labelledby={ariaLabelledBy}
				className={`pg-tabs-list ${style.list}`}
			>
				{items.map((item, index) => (
					<button
						key={item.key}
						ref={(el) => {
							tabRefs.current[index] = el
						}}
						type="button"
						role="tab"
						id={tabId(index)}
						aria-selected={index === selected}
						aria-controls={index === selected ? panelId : undefined}
						tabIndex={index === focusable ? 0 : -1}
						disabled={item.disabled}
						className={`pg-tab ${style.tab}`}
						onClick={() => select(index)}
						onKeyDown={(e) => handleKeyDown(e, index)}
					>
						{item.label}
					</button>
				))}
			</div>
			{selected >= 0 && (
				<div
					role="tabpanel"
					id={panelId}
					aria-labelledby={tabId(selected)}
					// Reachable with Tab even when the content has nothing focusable
					tabIndex={0}
					className={`pg-tabs-panel ${style.panel}`}
				>
					{items[selected].content}
				</div>
			)}
		</div>
	)
})
