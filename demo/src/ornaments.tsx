// Hand-drawn ornaments for the eyecatch frame. Everything strokes in
// currentColor, so the frame colour comes from CSS.

// Points of an n-pointed star, alternating outer and inner radius
const star = (cx: number, cy: number, n: number, outer: number, inner: number, turn = 0) =>
	Array.from({ length: n * 2 }, (_, i) => {
		const r = i % 2 ? inner : outer
		const a = ((i * Math.PI) / n) + turn - Math.PI / 2
		return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`
	}).join(' ')

/** A rice grain: a slim ellipse turned to `deg` */
const Grain = ({ x, y, deg, rx = 1.6, ry = 3.6 }: { x: number; y: number; deg: number; rx?: number; ry?: number }) => (
	<ellipse cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${deg} ${x} ${y})`} fill="currentColor" stroke="none" />
)

// One half of a corner's scrollwork, drawn along the top edge. The other half
// is the same group mirrored across the diagonal.
const HALF = (
	<>
		{/* The frame line itself is the .edge elements, which run into the medallion */}
		{/* Volute inside the frame, under the line */}
		<path d="M42 31C54 31 58 42 70 42C79 42 82 34 76 31.5C72 30 68.5 33 71 36" />
		{/* Tail sweeping back up toward the line, ending in a leaf */}
		<path d="M70 42C84 42 92 32 108 31" />
		<path d="M108 31C113 28 118 29 122 31C118 33 113 34 108 31Z" fill="currentColor" />
		{/* Curl outside the frame, above the line */}
		<path d="M50 24C52 15 62 11 68 15C72 18 70 23 66 22" />
		<circle cx="79" cy="18" r="1.5" fill="currentColor" stroke="none" />
		{/* Small hook further along */}
		<path d="M86 24C88 28 94 29 96 26" />
		{/* Counter-scroll tucked under the volute */}
		<path d="M48 38C46 46 52 52 58 50C62 48.6 62 44 58.5 44" />
		{/* Leaf dropping off the tail */}
		<path d="M92 36.5C93 41 96 44 100 45C99 41 96 38 92 36.5Z" fill="currentColor" />
		{/* Beads trailing off past the leaf */}
		<circle cx="129" cy="31" r="1.1" fill="currentColor" stroke="none" />
		<circle cx="135" cy="31" r="0.8" fill="currentColor" stroke="none" />
	</>
)

/**
 * The beaded medallion: a ring of beads, two circles, an eight-point star and
 * a rice grain. `thin` is the stroke width of the inner circle and star.
 */
function Medallion({ x, y, thin }: { x: number; y: number; thin: number }) {
	return (
		<>
			{Array.from({ length: 20 }, (_, i) => {
				const a = (i / 20) * Math.PI * 2
				return <circle key={i} cx={x + 16.5 * Math.cos(a)} cy={y + 16.5 * Math.sin(a)} r="0.75" fill="currentColor" stroke="none" />
			})}
			<circle cx={x} cy={y} r="13" />
			<circle cx={x} cy={y} r="9.5" strokeWidth={thin} />
			<polygon points={star(x, y, 8, 9.5, 4.2)} strokeWidth={thin} strokeLinejoin="round" />
			<Grain x={x} y={y} deg={45} />
		</>
	)
}

/** One corner of the frame. The frame line sits at (24, 24) in its 160 unit box. */
export function Corner({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 160 160" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
			<g>{HALF}</g>
			<g transform="matrix(0 1 1 0 0 0)">{HALF}</g>

			<Medallion x={30} y={30} thin={1} />
		</svg>
	)
}

/** A large outlined kanji set vertically behind a card's stage */
export function Glyph({ text }: { text: string }) {
	return (
		<span className="glyph" aria-hidden="true" style={{ '--n': [...text].length } as React.CSSProperties}>
			{text}
		</span>
	)
}

/** The fixed frame: four corners joined by straight edges */
export function Frame() {
	return (
		<div className="frame" aria-hidden="true">
			<Corner className="corner tl" />
			<Corner className="corner tr" />
			<Corner className="corner bl" />
			<Corner className="corner br" />
			<i className="edge top" />
			<i className="edge bottom" />
			<i className="edge left" />
			<i className="edge right" />
		</div>
	)
}

/** The corner medallion at full size, faint behind the title */
export function Sigil({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="0.4" aria-hidden="true">
			<Medallion x={18} y={18} thin={0.28} />
		</svg>
	)
}
