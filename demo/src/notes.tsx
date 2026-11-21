import { useLayoutEffect, useRef, useState } from 'react'

/**
 * A callout on the stage: a hairline from part of the live component to the
 * prop it demonstrates, like the labelled plates of an old field guide.
 * `at` is a selector inside the stage, `i` picks among its matches.
 */
export type Note = { at: string; i?: number; label: string; side: 'top' | 'bottom' | 'left' | 'right' }

type Mark = { key: string; label: string; side: Note['side']; points: [number, number][]; lx: number; ly: number }

// Distance from the subject's edge to a label, and the step that moves a
// label clear of its neighbour on the same side
const GAP = 46
const STEP = 24
// Courier Prime at 12.5px is about 7.5px per character
const width = (s: string) => s.length * 7.5 + 8

/** Draws `notes` around the element just before it (the demo's root) */
export function Notes({ notes }: { notes: Note[] }) {
	const ref = useRef<HTMLDivElement>(null)
	const [marks, setMarks] = useState<Mark[]>([])

	useLayoutEffect(() => {
		const layer = ref.current
		const host = layer?.parentElement
		const subject = layer?.previousElementSibling
		if (!layer || !host || !subject) return

		let frame = 0
		const measure = () => {
			cancelAnimationFrame(frame)
			frame = requestAnimationFrame(() => {
				const o = host.getBoundingClientRect()
				const rel = (r: DOMRect) => ({ l: r.left - o.left, t: r.top - o.top, r: r.right - o.left, b: r.bottom - o.top })
				const u = rel(subject.getBoundingClientRect())
				const out: (Mark & { w: number })[] = []

				notes.forEach((n, k) => {
					const el = host.querySelectorAll(n.at)[n.i ?? 0]
					if (!el) return
					const t = rel(el.getBoundingClientRect())
					const cx = (t.l + t.r) / 2
					const cy = (t.t + t.b) / 2
					const w = width(n.label)
					const same = out.filter((m) => m.side === n.side)

					if (n.side === 'top' || n.side === 'bottom') {
						const dir = n.side === 'top' ? -1 : 1
						let ly = (n.side === 'top' ? u.t : u.b) + dir * GAP
						// Step outward while this label would overlap one already placed
						while (same.some((m) => Math.abs(m.lx - cx) < (m.w + w) / 2 + 10 && Math.abs(m.ly - ly) < STEP)) ly += dir * STEP
						const y0 = n.side === 'top' ? t.t : t.b
						out.push({ key: `${k}`, label: n.label, side: n.side, w, lx: cx, ly, points: [[cx, y0], [cx, ly - dir * 6]] })
					} else {
						const dir = n.side === 'left' ? -1 : 1
						const lx = (n.side === 'left' ? u.l : u.r) + dir * GAP
						let ly = cy
						while (same.some((m) => Math.abs(m.ly - ly) < STEP - 4)) ly += STEP
						const x0 = n.side === 'left' ? t.l : t.r
						const knee = lx - dir * 16
						out.push({ key: `${k}`, label: n.label, side: n.side, w, lx, ly, points: [[x0, cy], [knee, cy], [lx - dir * 6, ly]] })
					}
				})
				setMarks(out)
			})
		}

		measure()
		const ro = new ResizeObserver(measure)
		ro.observe(host)
		ro.observe(subject)
		// The demo changes shape as it's used (a new card, a pinned tooltip)
		const mo = new MutationObserver(measure)
		mo.observe(subject, { subtree: true, childList: true, characterData: true })
		// The stage scales in on arrival; measure again once it settles
		host.addEventListener('animationend', measure)
		window.addEventListener('resize', measure)
		return () => {
			cancelAnimationFrame(frame)
			ro.disconnect()
			mo.disconnect()
			host.removeEventListener('animationend', measure)
			window.removeEventListener('resize', measure)
		}
	}, [notes])

	return (
		<div className="notes" ref={ref} aria-hidden="true">
			<svg>
				{marks.map((m) => {
					const [x, y] = m.points[0]
					return (
						<g key={m.key}>
							<polyline points={m.points.map((p) => p.join(',')).join(' ')} />
							<rect x={x - 2.5} y={y - 2.5} width="5" height="5" transform={`rotate(45 ${x} ${y})`} />
						</g>
					)
				})}
			</svg>
			{marks.map((m) => (
				<span key={m.key} className={`note note-${m.side}`} style={{ left: m.lx, top: m.ly }}>
					{m.label}
				</span>
			))}
		</div>
	)
}
