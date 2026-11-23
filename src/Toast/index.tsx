import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useHostEffect } from '../shared'
import { ToastBox, type ToastAction, type ToastType } from './ToastBox'
import style from './style.module.css'

export interface ToastOptions {
	type?: ToastType
	// How long it stays up, in ms. Infinity keeps it until it's dismissed.
	duration?: number
	action?: ToastAction
}

type Entry = { id: string; message: ReactNode; closing: boolean } & Required<Pick<ToastOptions, 'type' | 'duration'>> &
	Pick<ToastOptions, 'action'>

const DEFAULT_DURATION = 2500
// The fade, then the stack closing up behind it
const FADE_MS = 350
const COLLAPSE_MS = 250
// After the mouse leaves, wait this long before fading again
const RESUME_MS = 1500

// The toasts on screen and where they go. <ToastHost> (inside
// <PaigerProvider>) draws them and resets this when it unmounts.
let toasts: Entry[] = []
let x: 'left' | 'right' = 'right'
let y: 'top' | 'bottom' = 'bottom'
let hidden = false
let update: (() => void) | undefined
const removals = new Map<string, ReturnType<typeof setTimeout>>()

let idCount = 0
const generateId = () => `toast-${++idCount}`

const change = (id: string, closing: boolean) => {
	toasts = toasts.map((t) => (t.id === id ? { ...t, closing } : t))
	update?.()
}

// Starts the fade; the toast is gone once the slot has closed up
const close = (id: string) => {
	if (removals.has(id) || !toasts.some((t) => t.id === id)) return
	change(id, true)
	removals.set(
		id,
		setTimeout(() => {
			removals.delete(id)
			toasts = toasts.filter((t) => t.id !== id)
			update?.()
		}, FADE_MS + COLLAPSE_MS)
	)
}

// Hovering a fading toast brings it back
const reopen = (id: string) => {
	clearTimeout(removals.get(id))
	if (!removals.delete(id)) return
	change(id, false)
}

export const toast = (message: ReactNode, options?: ToastType | ToastOptions): string => {
	// Nothing to do on the server
	if (typeof document === 'undefined') return ''
	if (!update) {
		console.error('paiger: toast() needs <PaigerProvider> mounted somewhere in your app')
		return ''
	}
	const { type = 'default', duration = DEFAULT_DURATION, action } =
		typeof options === 'string' ? { type: options } : (options ?? {})
	const id = generateId()
	toasts = [...toasts, { id, message, type, duration, action, closing: false }]
	update()
	return id
}

export const dismissToast = (id: string) => close(id)

export const setToastLocation = (newX: 'left' | 'right', newY: 'top' | 'bottom') => {
	x = newX
	y = newY
	update?.()
}

export const setToastVisibility = (visible: boolean) => {
	hidden = !visible
	update?.()
}

// One toast: closes itself when its time is up, and waits while hovered
function ToastItem({ entry }: { entry: Entry }) {
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

	const closeIn = (ms: number) => {
		clearTimeout(timer.current)
		if (Number.isFinite(ms)) timer.current = setTimeout(() => close(entry.id), ms)
	}

	// Mount only, or every re-render would restart the clock
	useEffect(() => {
		closeIn(entry.duration)
		return () => clearTimeout(timer.current)
	}, [])

	const pause = () => {
		clearTimeout(timer.current)
		reopen(entry.id)
	}
	// Once neither hovered nor focused. A toast that stays until dismissed
	// stays that way.
	const resume = (slot: HTMLElement) => {
		if (slot.matches(':hover') || slot.contains(document.activeElement)) return
		closeIn(Number.isFinite(entry.duration) ? Math.min(entry.duration, RESUME_MS) : Infinity)
	}

	return (
		// Waits while hovered, or while focus is on its action or ×
		<div
			className={style.slot}
			data-closing={entry.closing || undefined}
			onMouseEnter={pause}
			onMouseLeave={(e) => resume(e.currentTarget)}
			onFocus={pause}
			onBlur={(e) => {
				if (!e.currentTarget.contains(e.relatedTarget)) resume(e.currentTarget)
			}}
		>
			<div>
				<ToastBox
					// Errors interrupt; everything else waits its turn in the polite stack
					role={entry.type === 'error' ? 'alert' : undefined}
					type={entry.type}
					onDismiss={() => close(entry.id)}
					action={
						entry.action && {
							label: entry.action.label,
							onClick: () => {
								close(entry.id)
								return entry.action?.onClick()
							}
						}
					}
				>
					{entry.message}
				</ToastBox>
			</div>
		</div>
	)
}

export function ToastHost() {
	const [, forceUpdate] = useState(0)
	const [mounted, setMounted] = useState(false)
	const stackRef = useRef<HTMLDivElement>(null)
	const newest = toasts.length > 0 ? toasts[toasts.length - 1].id : ''

	// The stack is a popover, for the top layer, where a later popover would
	// cover it. Showing it again brings it to the front, so each new toast
	// lands above whatever is open.
	useEffect(() => {
		const stack = stackRef.current
		if (!stack) return
		if (stack.matches(':popover-open')) stack.hidePopover()
		stack.showPopover()
	}, [mounted, newest])

	useHostEffect(() => {
		setMounted(true)
		update = () => forceUpdate((n) => n + 1)
		return () => {
			// Start clean next time, e.g. between tests
			update = undefined
			removals.forEach(clearTimeout)
			removals.clear()
			toasts = []
		}
	}, [])

	if (!mounted) return null

	return createPortal(
		<div
			ref={stackRef}
			popover="manual"
			className={`pg-toast-container ${style.stack}`}
			role="status"
			aria-live="polite"
			data-x={x}
			data-y={y}
			style={
				{
					display: hidden ? 'none' : undefined,
					'--pg-toast-fade': `${FADE_MS}ms`,
					'--pg-toast-collapse': `${COLLAPSE_MS}ms`
				} as CSSProperties
			}
		>
			{toasts.map((entry) => (
				<ToastItem key={entry.id} entry={entry} />
			))}
		</div>,
		document.body
	)
}
