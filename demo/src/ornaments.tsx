import { useId } from 'react'

// Frame ornaments. Everything strokes in currentColor, so CSS sets the colour.

// Points of an n-pointed star, alternating outer and inner radius
const star = (cx: number, cy: number, n: number, outer: number, inner: number, turn = 0) =>
	Array.from({ length: n * 2 }, (_, i) => {
		const r = i % 2 ? inner : outer
		const a = ((i * Math.PI) / n) + turn - Math.PI / 2
		return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`
	}).join(' ')

// One half of a corner's scrollwork, drawn along the top edge. The other half
// is the same group mirrored across the diagonal.
const HALF = (
	<>
		{/* The frame line itself is the .edge elements, which run into the medallion */}
		{/* Inner curl, under the line */}
		<path d="M42 31C54 31 58 42 70 42C79 42 82 34 76 31.5C72 30 68.5 33 71 36" />
		{/* Tail, ending in a leaf */}
		<path d="M70 42C84 42 92 32 108 31" />
		<path d="M108 31C113 28 118 29 122 31C118 33 113 34 108 31Z" fill="currentColor" />
		{/* Outer curl, above the line */}
		<path d="M50 24C52 15 62 11 68 15C72 18 70 23 66 22" />
		<circle cx="79" cy="18" r="1.5" fill="currentColor" stroke="none" />
		{/* Hook */}
		<path d="M86 24C88 28 94 29 96 26" />
		{/* Small curl under the inner curl */}
		<path d="M48 38C46 46 52 52 58 50C62 48.6 62 44 58.5 44" />
		{/* Leaf */}
		<path d="M92 36.5C93 41 96 44 100 45C99 41 96 38 92 36.5Z" fill="currentColor" />
		{/* Dots */}
		<circle cx="129" cy="31" r="1.1" fill="currentColor" stroke="none" />
		<circle cx="135" cy="31" r="0.8" fill="currentColor" stroke="none" />
	</>
)

/**
 * Corner medallion: a ring of dots, two circles, an eight-point star and a
 * quatrefoil. `thin` is the stroke width of the inner circle and star.
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
			{[0, 90, 180, 270].map((deg) => (
				<circle key={deg} cx={x + 1.6 * Math.cos((deg * Math.PI) / 180)} cy={y + 1.6 * Math.sin((deg * Math.PI) / 180)} r="1.6" strokeWidth={thin} />
			))}
		</>
	)
}

/** One corner of the frame. The frame line sits at (24, 24) in its 160 unit box. */
function Corner({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 160 160" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
			<g>{HALF}</g>
			<g transform="matrix(0 1 1 0 0 0)">{HALF}</g>

			<Medallion x={30} y={30} thin={1} />
		</svg>
	)
}

/** Initial behind a screen's component */
export function Glyph({ text }: { text: string }) {
	return (
		<span className="glyph" aria-hidden="true">
			{text}
		</span>
	)
}

// In thousandths of an em from the P's top left: the P's capitals run from
// 126 to the baseline at 876, and its tail to 1050
const FRAME = 'M-150 0C159 -240 467 240 776 0V1020C467 1260 159 780 -150 1020Z'

// UnifrakturCook's P and a in the same units, to cut the frame back from the letters
const PA = 'M74 1047Q112 937 124 751L24 715L129 615Q129 593 129 518Q129 442 123 282Q97 270 71 258Q45 246 20 233L104 126Q237 166 296 184Q295 200 294 215Q293 231 292 246L440 126Q606 252 606 425Q606 443 604 462Q584 659 430 861L273 805Q278 883 292 910Q212 959 74 1047ZM435 714Q496 714 496 622Q496 543 465 460Q435 377 383 330Q363 311 343 311Q313 311 284 355Q274 516 271 640L432 714Q434 714 435 714ZM651 505L842 351L1058 452Q1020 485 1019 526L1017 688Q1017 705 1034 726Q1052 747 1067 759L969 861L893 783Q866 805 838 824Q810 842 788 862Q715 834 651 777Q669 754 672 710L671 563Q671 561 671 559Q671 530 651 505ZM895 509L819 468Q791 510 791 543L791 663Q791 700 804 715Q815 731 824 744Q834 757 855 763L895 734L895 509Z'

/** The wordmark, with a frame behind the P. The frame stops short of the letters where they meet. */
export const Mark = () => {
	const id = useId()
	return (
		<span className="mark">
			<span className="mark-p">
				<svg viewBox="0 0 1000 1000" aria-hidden="true">
					<mask id={id} maskUnits="userSpaceOnUse" x="-400" y="-400" width="1800" height="1900">
						<rect x="-400" y="-400" width="1800" height="1900" fill="white" />
						<path d={PA} fill="black" stroke="black" strokeWidth="70" strokeLinejoin="round" />
					</mask>
					<path d={FRAME} mask={`url(#${id})`} vectorEffect="non-scaling-stroke" />
				</svg>
				P
			</span>
			aiger
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
