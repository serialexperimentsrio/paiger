import React, { useRef, useState } from 'react'
import { Popover } from '../Popover'
import type { Placement } from '../Popover/position'
import style from './style.module.css'
import sweep from '../sweep.module.css'

type ListItem = { key: string; label: string }

// The list inside Dropdown (a menu of actions) and Select (a listbox of
// choices). Arrow keys, Home and End move, typing jumps to a matching label,
// and Enter or Space picks. An async onPick shows the busy sweep on that item.
export function List({
	items,
	role,
	selectedKey,
	onPick,
	close
}: {
	items: ListItem[]
	role: 'menu' | 'listbox'
	selectedKey?: string
	onPick: (key: string) => unknown
	close: () => void
}) {
	const selectedIndex = Math.max(0, items.findIndex((item) => item.key === selectedKey))
	const [loadingIndex, setLoadingIndex] = useState<number>()
	const [focusedIndex, setFocusedIndex] = useState(selectedIndex)
	const itemRefs = useRef<(HTMLDivElement | null)[]>([])
	const typed = useRef({ text: '', at: 0 })

	const move = (index: number) => {
		setFocusedIndex(index)
		itemRefs.current[index]?.focus()
	}

	const pick = async (index: number) => {
		if (loadingIndex != null) return
		setLoadingIndex(index)
		try {
			await onPick(items[index].key)
			close()
		} finally {
			setLoadingIndex(undefined)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
		const last = items.length - 1
		const target = {
			ArrowDown: Math.min(index + 1, last),
			ArrowUp: Math.max(index - 1, 0),
			Home: 0,
			End: last
		}[e.key]
		// Mid-search, a space is part of the text, e.g. "new york"
		const now = Date.now()
		const searching = now - typed.current.at < 500 && typed.current.text !== ''
		if (target !== undefined) {
			e.preventDefault()
			move(target)
		} else if (e.key === 'Enter' || (e.key === ' ' && !searching)) {
			e.preventDefault()
			pick(index)
		} else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
			// Letters typed in quick succession build up a prefix to jump to
			e.preventDefault()
			typed.current.text = (searching ? typed.current.text : '') + e.key.toLowerCase()
			typed.current.at = now
			const match = items.findIndex((item) => item.label.toLowerCase().startsWith(typed.current.text))
			if (match >= 0) move(match)
		}
	}

	return (
		<div className={`pg-dropdown ${style.dropdown}`} role={role}>
			{items.map((item, index) => {
				const loading = loadingIndex === index
				return (
					<div
						key={item.key}
						ref={(el) => {
							itemRefs.current[index] = el
						}}
						className={`pg-dropdown-item ${sweep.sweep}${loading ? ` ${sweep.active}` : ''}`}
						data-loading={loading || undefined}
						role={role === 'menu' ? 'menuitem' : 'option'}
						aria-selected={role === 'listbox' ? item.key === selectedKey : undefined}
						aria-busy={loading || undefined}
						tabIndex={focusedIndex === index ? 0 : -1}
						style={{ pointerEvents: loadingIndex != null ? 'none' : undefined }}
						onClick={() => pick(index)}
						onKeyDown={(e) => handleKeyDown(e, index)}
					>
						{/* While one item works, it stays readable and the rest fade back */}
						<span style={{ opacity: loadingIndex == null ? 1 : loading ? 0.7 : 0.4 }}>{item.label}</span>
					</div>
				)
			})}
		</div>
	)
}

export interface DropdownItem {
	key: string
	label: string
	// Return a promise to keep the menu open, with the item busy, until it settles
	onSelect: () => unknown
}

export interface DropdownProps {
	// The trigger. It needs to accept a ref.
	children: React.ReactElement
	items: DropdownItem[]
	placement?: Placement
	autoPlacements?: Placement[]
	onOpenChange?: (open: boolean) => void
}

export function Dropdown({ children, items, placement, autoPlacements, onOpenChange }: DropdownProps) {
	return (
		<Popover
			placement={placement}
			autoPlacements={autoPlacements}
			onOpenChange={onOpenChange}
			matchTriggerWidth
			content={(close) => (
				<List
					items={items}
					role="menu"
					onPick={(key) => items.find((item) => item.key === key)?.onSelect()}
					close={close}
				/>
			)}
		>
			{React.cloneElement(children as React.ReactElement<Record<string, unknown>>, { 'aria-haspopup': 'menu' })}
		</Popover>
	)
}
