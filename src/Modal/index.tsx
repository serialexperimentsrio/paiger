import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { focusables, useHostEffect } from '../shared'
import { modalDuration, swapDuration } from './animationConfig'
import style from './style.module.css'

type Entry = { content: React.ReactNode; onClose?: () => void }

// Only one modal is on screen at a time. These describe it; <ModalHost>
// (inside <PaigerProvider>) draws it and resets them when it unmounts.
let open: Entry | undefined // the modal that is open, or opening
let history: Entry[] = [] // what openPreviousModal() goes back through
let rendered: React.ReactNode // what the host draws: lags behind during animations
let active = false // the backdrop is up and the modal is in, not mid-close
let swapping = false
let closeAnimation: ((swap: boolean) => void) | undefined
let timer: number | undefined
// Bumped on every change, so timers from an older one know they're stale
let generation = 0
let keyCount = 0
let update: (() => void) | undefined
// What had focus before the first modal opened; it gets focus back at the end
let returnFocus: Element | null = null

export const registerCloseAnimation = (animate: (swap: boolean) => void) => {
	closeAnimation = animate
}

export const isModalTransitioning = () => swapping

export const isModalOpen = () => open !== undefined

const hostReady = () => {
	if (update) return true
	console.error('paiger: modals need <PaigerProvider> mounted somewhere in your app')
	return false
}

const present = (entry: Entry) => {
	clearTimeout(timer)
	const current = ++generation
	// A fresh key makes React remount, so the open animation plays even when
	// the same component is shown twice in a row
	const content = React.isValidElement(entry.content)
		? React.cloneElement(entry.content, { key: `modal-${++keyCount}` })
		: entry.content

	// Nothing on screen yet, so just show it
	if (!active && !swapping) {
		rendered = content
		active = true
		update?.()
		return
	}

	// Something is showing: close it quickly, then bring in the new one
	swapping = true
	closeAnimation?.(true)
	active = false
	update?.()
	timer = window.setTimeout(() => {
		if (current !== generation) return
		rendered = undefined
		update?.()
		// Give the old one a frame to unmount
		timer = window.setTimeout(() => {
			if (current !== generation) return
			rendered = content
			active = true
			swapping = false
			update?.()
		}, 16)
	}, swapDuration())
}

// onClose runs once, when the modal is gone for good: closed, left with
// openPreviousModal(), or dropped from the history when the modals close.
// Being replaced by another modal only moves it into the history.
export const setModal = (content: React.ReactNode, onClose?: () => void) => {
	if (!hostReady()) return
	if (open) {
		history.push(open)
	} else {
		returnFocus = document.activeElement
	}
	open = { content, onClose }
	present(open)
}

export const openPreviousModal = () => {
	if (!hostReady()) return
	const previous = history.pop()
	if (!previous) return
	open?.onClose?.()
	open = previous
	present(previous)
}

export const hideModal = () => {
	if (!open) return
	// The open one first, then the history from newest to oldest
	const closing = [open, ...history.reverse()]
	open = undefined
	history = []
	closing.forEach((entry) => entry.onClose?.())

	clearTimeout(timer)
	const current = ++generation
	swapping = false
	active = false
	closeAnimation?.(false)
	update?.()

	// Keep the content around until the close animation is done, or it would
	// just vanish
	timer = window.setTimeout(() => {
		if (current !== generation) return
		rendered = undefined
		update?.()
	}, modalDuration())
}

export function ModalHost() {
	const [, forceUpdate] = useState(0)
	const [mounted, setMounted] = useState(false)
	const dialogRef = useRef<HTMLDivElement>(null)
	const backdropRef = useRef<HTMLDivElement>(null)
	const isOpen = open !== undefined

	useHostEffect(() => {
		setMounted(true)
		update = () => forceUpdate((n) => n + 1)
		return () => {
			// Start clean next time, e.g. between tests
			clearTimeout(timer)
			generation++
			update = undefined
			open = undefined
			history = []
			rendered = undefined
			active = swapping = false
			closeAnimation = undefined
			returnFocus = null
		}
	}, [])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!active) return
			// A popover inside the modal handles its own Escape and marks it handled
			if (e.key === 'Escape' && !e.defaultPrevented) hideModal()

			// Keep Tab inside the dialog
			if (e.key === 'Tab' && dialogRef.current) {
				const focusable = focusables(dialogRef.current)
				if (focusable.length === 0) return
				const first = focusable[0]
				const last = focusable[focusable.length - 1]
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault()
					last.focus()
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault()
					first.focus()
				}
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [])

	// While any modal is open (swaps included): make the page behind it inert,
	// so neither clicks, Tab nor a screen reader can reach it, stop it from
	// scrolling, and give focus back to whatever had it once it closes.
	// (Each ModalBox moves focus in by itself.)
	useEffect(() => {
		if (!isOpen) return
		// Everything else at the top of <body>, except toasts, which stay usable
		const madeInert = [...document.body.children].filter(
			(el) =>
				el !== backdropRef.current &&
				el !== dialogRef.current &&
				!el.matches('.pg-toast-container, script, style') &&
				!el.hasAttribute('inert')
		)
		madeInert.forEach((el) => el.setAttribute('inert', ''))

		const root = document.documentElement
		const { overflow, scrollbarGutter } = root.style
		// If the page has a scrollbar, keep its space, so nothing shifts sideways
		if (window.innerWidth > root.clientWidth) root.style.scrollbarGutter = 'stable'
		root.style.overflow = 'hidden'
		return () => {
			madeInert.forEach((el) => el.removeAttribute('inert'))
			root.style.overflow = overflow
			root.style.scrollbarGutter = scrollbarGutter
			if (returnFocus instanceof HTMLElement) returnFocus.focus()
			returnFocus = null
		}
	}, [isOpen])

	if (!mounted) return null

	return createPortal(
		<>
			<div
				ref={backdropRef}
				onClick={hideModal}
				className={`pg-modal-backdrop ${style.modalBackdrop} ${active ? style.active : ''}`}
				data-active={active || undefined}
			/>
			<div ref={dialogRef} style={{ display: 'contents' }}>
				{rendered}
			</div>
		</>,
		document.body
	)
}
