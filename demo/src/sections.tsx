import { useRef, useState, type ComponentType, type ReactNode } from 'react'
import {
	Box,
	Button,
	Dropdown,
	Icon,
	IconButton,
	Loading,
	ModalBox,
	Panel,
	Popover,
	Select,
	ToastBox,
	Tooltip,
	hideModal,
	openPreviousModal,
	setModal,
	setToastLocation,
	setToastVisibility,
	toast,
	type ToastType
} from 'ricebowl'
import { Notes, type Note } from './notes'
import { Glyph } from './ornaments'

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const Ico = ({ name, size = 18 }: { name: string; size?: number }) => (
	<Icon src={`icons/${name}.svg`} width={size} className="ico" alt="" />
)

export const copy = async (text: string, label = 'Copied to clipboard') => {
	try {
		await navigator.clipboard.writeText(text)
		toast(label, 'success')
	} catch {
		toast('Clipboard is blocked here', 'error')
	}
}

// Tiny highlighter: comments, strings, JSX tags and a few keywords
const TOKEN = /(\/\/.*$)|('[^']*'|"[^"]*")|(<\/?[A-Za-z]+|\/?>)|\b(await|async|const|import|from|return)\b/gm

export function Code({ children }: { children: string }) {
	const parts: ReactNode[] = []
	let last = 0
	for (const m of children.matchAll(TOKEN)) {
		parts.push(children.slice(last, m.index))
		const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 't' : 'k'
		parts.push(
			<span key={m.index} className={`tok-${cls}`}>
				{m[0]}
			</span>
		)
		last = m.index + m[0].length
	}
	parts.push(children.slice(last))
	return (
		<pre className="code">
			<code>{parts}</code>
		</pre>
	)
}

/** A code plate with a label and a copy button */
export function Plate({ label, code }: { label: string; code: string }) {
	return (
		<div className="plate">
			<div className="plate-bar">
				<h3 className="label">{label}</h3>
				<button className="link-btn" onClick={() => copy(code, 'Code copied')}>
					Copy
				</button>
			</div>
			<Code>{code}</Code>
		</div>
	)
}

export function Screen({
	id,
	title,
	children,
	className = ''
}: {
	id: string
	title: string
	children: ReactNode
	className?: string
}) {
	return (
		<section id={id} className={`screen ${className}`} aria-label={title}>
			{children}
		</section>
	)
}

/* ───────── Component cards ───────── */

type Item = {
	key: string
	name: string
	kind: 'Component' | 'Function'
	desc: string
	traits: string[]
	props: [string, string][]
	code: string
	/** Callouts tying parts of the live demo to their props */
	notes?: Note[]
	Demo: ComponentType
}

type Category = {
	id: string
	title: string
	items: Item[]
}

/** The kanji behind each card: button, layer, menu, surface, whole, colour, install */
export const GLYPHS: Record<string, string> = {
	buttons: '釦',
	overlays: '層',
	menus: '献立',
	surfaces: '面',
	global: '全',
	theming: '彩',
	install: '導入'
}

export function CategoryScreens() {
	return CATEGORIES.map((cat, i) => <CategoryScreen key={cat.id} {...cat} flip={i % 2 === 1} />)
}

/**
 * One eyecatch card per category: the live component on the stage, its name
 * in the corner, and the reference beside it. Every other card is mirrored.
 */
function CategoryScreen({ id, title, items, flip }: Category & { flip: boolean }) {
	const [sel, setSel] = useState(0)
	const item = items[sel]
	const { Demo } = item

	const onTabKey = (e: React.KeyboardEvent, i: number) => {
		const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
		if (!step) return
		e.preventDefault()
		const j = (i + step + items.length) % items.length
		setSel(j)
		document.getElementById(`${id}-tab-${items[j].key}`)?.focus()
	}

	return (
		<Screen id={id} title={title} className={`card${flip ? ' flip' : ''}`}>
			<header className="head">
				<h2 className="name" key={item.key}>
					{item.name}
				</h2>
				<p className="kind">{item.kind}</p>
				<div className="tabs" role="tablist" aria-label={`${title} components`}>
					{items.map((it, i) => (
						<button
							key={it.key}
							role="tab"
							id={`${id}-tab-${it.key}`}
							aria-selected={i === sel}
							aria-controls={`${id}-panel`}
							tabIndex={i === sel ? 0 : -1}
							className="tab"
							onClick={() => setSel(i)}
							onKeyDown={(e) => onTabKey(e, i)}
						>
							{it.name}
						</button>
					))}
				</div>
			</header>

			<div className="stage" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${item.key}`}>
				<Glyph text={GLYPHS[id]} />
				<div className="stage-inner" key={item.key}>
					<Demo />
					{item.notes && <Notes notes={item.notes} />}
				</div>
			</div>

			<div className="body" key={item.key}>
				<p className="desc">{item.desc}</p>
				<ul className="traits">
					{item.traits.map((t) => (
						<li key={t}>{t}</li>
					))}
				</ul>
				<h3 className="label">{item.kind === 'Function' ? 'API' : 'Props'}</h3>
				<dl className="props">
					{item.props.map(([k, v]) => (
						<div key={k}>
							<dt>{k}</dt>
							<dd>{v}</dd>
						</div>
					))}
				</dl>
			</div>

			<div className="usage" key={`${item.key}-usage`}>
				<Plate label="Usage" code={item.code} />
			</div>
		</Screen>
	)
}

/* ───────── Demos ───────── */

function ButtonDemo() {
	const [forced, setForced] = useState(false)
	return (
		<div className="stack">
			<div className="row">
				<Button
					onClick={async () => {
						await sleep(1800)
						toast('Saved.', 'success')
					}}
				>
					Save
				</Button>
				<Button
					danger
					onClick={async () => {
						await sleep(1200)
						toast('Deleted.', 'warning')
					}}
				>
					Delete
				</Button>
				<Button disabled>Unavailable</Button>
			</div>
			<div className="row">
				<Button forceLoading={forced}>{forced ? 'Loading' : 'Idle'}</Button>
				<label className="switch">
					<input type="checkbox" checked={forced} onChange={(e) => setForced(e.target.checked)} />
					<span aria-hidden="true" />
					<code>forceLoading</code>
				</label>
			</div>
		</div>
	)
}

function IconButtonDemo() {
	const [liked, setLiked] = useState(false)
	return (
		<div className="toolbar">
			<Tooltip text={liked ? 'Unfavourite' : 'Favourite'} above>
				<IconButton
					aria-label="Favourite"
					aria-pressed={liked}
					className={liked ? 'is-on' : ''}
					onClick={() => {
						setLiked(!liked)
						toast(liked ? 'Removed from favourites' : 'Added to favourites')
					}}
				>
					<Ico name="heart" />
				</IconButton>
			</Tooltip>
			<Tooltip text="Copy link" above>
				<IconButton aria-label="Copy link" onClick={() => copy(location.href, 'Link copied')}>
					<Ico name="share" />
				</IconButton>
			</Tooltip>
			<Tooltip text="Download" above>
				<IconButton
					aria-label="Download"
					onClick={async () => {
						await sleep(1400)
						toast('report.pdf downloaded', 'info')
					}}
				>
					<Ico name="download" />
				</IconButton>
			</Tooltip>
			<span className="toolbar-gap" />
			<Tooltip text="Delete" above>
				<IconButton
					aria-label="Delete"
					danger
					onClick={async () => {
						await sleep(900)
						toast('Deleted', 'warning')
					}}
				>
					<Ico name="trash" />
				</IconButton>
			</Tooltip>
		</div>
	)
}

function IconDemo() {
	return (
		<div className="sizes">
			{[16, 24, 32, 48].map((s) => (
				<figure key={s}>
					<Ico name="layers" size={s} />
					<figcaption>{s}px</figcaption>
				</figure>
			))}
		</div>
	)
}

/** All four directions pinned open at once, with forceShow on a switch */
function TooltipDemo() {
	const [pinned, setPinned] = useState(true)
	return (
		<div className="tips">
			<Tooltip text="above" above forceShow={pinned}>
				<Button className="t-n">Up</Button>
			</Tooltip>
			<Tooltip text="left" left forceShow={pinned}>
				<Button className="t-w">Left</Button>
			</Tooltip>
			<label className="switch t-c">
				<input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
				<span aria-hidden="true" />
				<code>forceShow</code>
			</label>
			<Tooltip text="right" right forceShow={pinned}>
				<Button className="t-e">Right</Button>
			</Tooltip>
			<Tooltip text="below (default)" forceShow={pinned}>
				<Button className="t-s">Down</Button>
			</Tooltip>
		</div>
	)
}

function PopoverDemo() {
	const [pos, setPos] = useState({ x: 50, y: 38 })
	const fieldRef = useRef<HTMLDivElement>(null)
	const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null)
	const closeRef = useRef<() => void>(() => {})

	// Listen on window instead of using pointer capture, which would send the
	// final click somewhere other than the Popover trigger
	const onPointerDown = (e: React.PointerEvent) => {
		const d = { dx: e.clientX, dy: e.clientY, moved: false }
		drag.current = d
		const move = (ev: PointerEvent) => {
			const field = fieldRef.current
			if (!field) return
			if (!d.moved && Math.abs(ev.clientX - d.dx) + Math.abs(ev.clientY - d.dy) > 4) {
				d.moved = true
				closeRef.current()
			}
			if (!d.moved) return
			const r = field.getBoundingClientRect()
			setPos({
				x: Math.min(85, Math.max(15, ((ev.clientX - r.left) / r.width) * 100)),
				// Stop above the direction buttons along the bottom edge
				y: Math.min(74, Math.max(8, ((ev.clientY - r.top) / r.height) * 100))
			})
		}
		const up = () => {
			window.removeEventListener('pointermove', move)
			window.removeEventListener('pointerup', up)
			// Clear it after the click that follows has been swallowed
			setTimeout(() => (drag.current = null))
		}
		window.addEventListener('pointermove', move)
		window.addEventListener('pointerup', up)
	}

	return (
		<div className="field" ref={fieldRef}>
			{/* Crosshairs and a readout follow the chip across the ruled chart */}
			<i className="cross cross-x" style={{ left: `${pos.x}%` }} aria-hidden="true" />
			<i className="cross cross-y" style={{ top: `${pos.y}%` }} aria-hidden="true" />
			<span className="readout" aria-hidden="true">
				x {Math.round(pos.x)}% · y {Math.round(pos.y)}%
			</span>
			<div
				className="drag"
				style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
				onPointerDown={onPointerDown}
				// A drag ends in a click; don't let that toggle the popover
				onClickCapture={(e) => drag.current?.moved && e.stopPropagation()}
			>
				<Popover
					content={(close) => {
						closeRef.current = close
						return (
							<Box className="pop-card">
								<p>Opened on the side with the most room.</p>
								<Button onClick={close}>Close</Button>
							</Box>
						)
					}}
				>
					<Button className="drag-chip">
						<Ico name="cursor" size={16} /> Drag me, then click
					</Button>
				</Popover>
			</div>
			<div className="field-dirs">
				{(['above', 'below', 'left', 'right'] as const).map((d) => (
					<Popover
						key={d}
						above={d === 'above'}
						below={d === 'below'}
						left={d === 'left'}
						right={d === 'right'}
						content={<Box className="pop-card pop-small">{d}</Box>}
					>
						<Button>{d}</Button>
					</Popover>
				))}
			</div>
		</div>
	)
}

function DropdownDemo() {
	const exportAs = (fmt: string) => async () => {
		await sleep(900)
		toast(`Exported export.${fmt}`, 'success')
	}
	return (
		<div className="row">
			<Dropdown
				items={[
					{ key: 'png', label: 'Export as PNG', onPick: exportAs('png') },
					{ key: 'svg', label: 'Export as SVG', onPick: exportAs('svg') },
					{ key: 'pdf', label: 'Export as PDF', onPick: exportAs('pdf') },
					{ key: 'link', label: 'Copy link', onPick: () => copy(location.href, 'Link copied') }
				]}
			>
				<Button className="w-wide">Export</Button>
			</Dropdown>
			<Dropdown
				above
				items={[
					{ key: 'd', label: 'Duplicate', onPick: () => toast('Duplicated') },
					{ key: 'r', label: 'Rename', onPick: () => toast('Renamed', 'info') },
					{ key: 'a', label: 'Archive', onPick: () => toast('Archived', 'warning') }
				]}
			>
				<Button className="w-wide">Opens above</Button>
			</Dropdown>
		</div>
	)
}

export const FACES = [
	{ key: 'garamond', name: 'Garamond', origin: 'Paris, FR', year: '1530s', cls: 'Old-style', note: 'Open counters and a calm, calligraphic rhythm.' },
	{ key: 'caslon', name: 'Caslon', origin: 'London, UK', year: '1720s', cls: 'Old-style', note: 'Sturdy and plain, made for long reading.' },
	{ key: 'baskerville', name: 'Baskerville', origin: 'Birmingham, UK', year: '1757', cls: 'Transitional', note: 'Sharper contrast and rounder letters.' },
	{ key: 'didot', name: 'Didot', origin: 'Paris, FR', year: '1784', cls: 'Didone', note: 'High contrast, cut for smooth paper.' },
	{ key: 'bodoni', name: 'Bodoni', origin: 'Parma, IT', year: '1798', cls: 'Didone', note: 'Hairline serifs against heavy stems.' }
]

function SelectDemo() {
	const [face, setFace] = useState(FACES[0])
	return (
		<div className="faces">
			<Select
				options={FACES.map((g, i) => ({
					key: g.key,
					name: g.name,
					default: i === 0,
					onPick: async () => {
						await sleep(450)
						setFace(g)
					}
				}))}
			/>
			<Box className="face-card" key={face.key}>
				<h4>{face.name}</h4>
				<p>{face.note}</p>
				<dl>
					<div>
						<dt>Origin</dt>
						<dd>{face.origin}</dd>
					</div>
					<div>
						<dt>Year</dt>
						<dd>{face.year}</dd>
					</div>
					<div>
						<dt>Class</dt>
						<dd>{face.cls}</dd>
					</div>
				</dl>
			</Box>
		</div>
	)
}

function BoxDemo() {
	return (
		<Box icon="icons/bowl.svg" className="bowl-box">
			<h4>Ricebowl</h4>
			<p>React component library</p>
		</Box>
	)
}

function PanelDemo() {
	return (
		<div className="surface-card">
			<Panel
				title="Storage"
				titleExtra={
					<Tooltip text="Add item" left>
						<IconButton aria-label="Add item" className="tiny" onClick={() => toast('Added a folder', 'success')}>
							<Ico name="plus" size={14} />
						</IconButton>
					</Tooltip>
				}
			>
				<ul className="storage">
					{[
						['Documents', '2.0 GB'],
						['Photos', '0.8 GB'],
						['Archive', '0.3 GB']
					].map(([n, w]) => (
						<li key={n}>
							<span>{n}</span>
							<span className="dim">{w}</span>
						</li>
					))}
				</ul>
			</Panel>
		</div>
	)
}

function LoadingDemo() {
	return (
		<div className="split">
			<Box className="load-box">
				<Loading />
			</Box>
			<Box className="load-box">
				<p>
					Loading <Loading inline />
				</p>
			</Box>
		</div>
	)
}

function KeysModal() {
	return (
		<ModalBox className="modal">
			<h2>Keyboard</h2>
			<table className="facts">
				<tbody>
					{[
						['Close', 'Esc'],
						['Next control', 'Tab'],
						['Previous control', 'Shift + Tab']
					].map(([k, v]) => (
						<tr key={k}>
							<th>{k}</th>
							<td>{v}</td>
						</tr>
					))}
				</tbody>
			</table>
			<div className="row">
				<Button onClick={openPreviousModal}>Back</Button>
				<Button onClick={hideModal}>Close</Button>
			</div>
		</ModalBox>
	)
}

function SettingsModal() {
	return (
		<ModalBox className="modal">
			<h2>Settings</h2>
			<p className="modal-copy">
				Opening another modal from here replaces this one. <code>openPreviousModal()</code> brings it back.
			</p>
			<div className="row">
				<Button onClick={() => setModal(<KeysModal />)}>Keyboard</Button>
				<Button onClick={hideModal}>Close</Button>
			</div>
		</ModalBox>
	)
}

function RenameModal() {
	const [name, setName] = useState('')
	return (
		<ModalBox className="modal">
			<h2>Rename</h2>
			<form className="rename-form" onSubmit={(e) => e.preventDefault()}>
				<label htmlFor="rename-name">Name</label>
				<input id="rename-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
				<Button
					type="submit"
					disabled={!name.trim()}
					onClick={async () => {
						await sleep(1100)
						hideModal()
						toast(`Renamed to ${name.trim()}`, 'success')
					}}
				>
					Save
				</Button>
			</form>
		</ModalBox>
	)
}

function ModalDemo() {
	return (
		<div className="row">
			<Button onClick={() => setModal(<SettingsModal />, () => toast('Closed with Escape or the backdrop'))}>Open modal</Button>
			<Button onClick={() => setModal(<RenameModal />)}>Open a form</Button>
		</div>
	)
}

const TYPES: { type: ToastType; text: string }[] = [
	{ type: 'default', text: 'Draft saved.' },
	{ type: 'info', text: 'A new version is available.' },
	{ type: 'success', text: 'Upload complete.' },
	{ type: 'warning', text: 'Storage is almost full.' },
	{ type: 'error', text: 'Connection lost.' }
]

// The furthest setTimeout can go (about 24 days). Any later and it fires straight away.
const NEVER = new Date(Date.now() + 2 ** 31 - 1)

// Outside the component so the choice survives switching tabs
let toastCorner = 'right bottom'
let toastsVisible = true

function ToastDemo() {
	const [corner, setCorner] = useState(toastCorner)
	const [visible, setVisible] = useState(toastsVisible)

	const place = (x: 'left' | 'right', y: 'top' | 'bottom') => {
		setToastLocation(x, y)
		setCorner((toastCorner = `${x} ${y}`))
		toast(`Toasts now appear ${y} ${x}`, 'info')
	}

	return (
		<div className="toasts">
			<div className="toast-controls">
				<div className="row">
					{TYPES.map((t) => (
						<Button key={t.type} onClick={() => toast(t.text, t.type)}>
							{t.type}
						</Button>
					))}
				</div>
				<div className="row">
					<div className="corners" role="group" aria-label="Toast position">
						{(['top', 'bottom'] as const).flatMap((y) =>
							(['left', 'right'] as const).map((x) => (
								<button
									key={x + y}
									className={corner === `${x} ${y}` ? 'on' : ''}
									aria-label={`${y} ${x}`}
									aria-pressed={corner === `${x} ${y}`}
									onClick={() => place(x, y)}
								/>
							))
						)}
					</div>
					<label className="switch">
						<input
							type="checkbox"
							checked={visible}
							onChange={(e) => {
								setVisible((toastsVisible = e.target.checked))
								setToastVisibility(e.target.checked)
							}}
						/>
						<span aria-hidden="true" />
						Visible
					</label>
				</div>
			</div>
			<div className="toast-gallery" aria-hidden="true">
				{TYPES.slice(1).map((t) => (
					<ToastBox key={t.type} id={t.type} text={t.text} type={t.type} closeAt={NEVER} closing={false} height={0} />
				))}
			</div>
		</div>
	)
}

/* ───────── Screens ───────── */

export const CATEGORIES: Category[] = [
	{
		id: 'buttons',
		title: 'Buttons',
		items: [
		{
			key: 'button',
			name: 'Button',
			kind: 'Component',
			desc: 'Pass an async onClick and the button shows a scanning border until it resolves. Clicks during loading are ignored.',
			traits: ['Async onClick', 'Sets aria-busy while loading', 'Keeps focus while loading', 'Forwards ref'],
			props: [
				['onClick', '() => Promise | void'],
				['danger', 'boolean'],
				['disabled', 'boolean'],
				['forceLoading', 'boolean']
			],
			code: `<Button onClick={async () => {
  await save(draft)
}}>
  Save
</Button>`,
			notes: [
				{ at: '.row:first-child .rb-button', i: 0, label: 'onClick: async', side: 'top' },
				{ at: '.row:first-child .rb-button', i: 1, label: 'danger', side: 'top' },
				{ at: '.row:first-child .rb-button', i: 2, label: 'disabled', side: 'top' },
				{ at: '.row:last-child .rb-button', label: 'forceLoading', side: 'left' }
			],
			Demo: ButtonDemo
		},
		{
			key: 'iconbutton',
			name: 'IconButton',
			kind: 'Component',
			desc: 'A compact Button wrapped around a single Icon. Supports everything Button does, including async clicks.',
			traits: ['Async onClick', 'Pairs with Tooltip for a label'],
			props: [
				['children', '<Icon />'],
				['…', 'all Button props']
			],
			code: `<IconButton aria-label="Favourite" onClick={save}>
  <Icon src="/heart.svg" />
</IconButton>`,
			notes: [
				{ at: '.rb-icon-button', i: 0, label: 'aria-pressed', side: 'top' },
				{ at: '.rb-icon-button', i: 1, label: 'children: <Icon />', side: 'bottom' },
				{ at: '.rb-icon-button', i: 2, label: 'onClick: async', side: 'top' },
				{ at: '.rb-icon-button', i: 3, label: 'danger', side: 'bottom' }
			],
			Demo: IconButtonDemo
		},
		{
			key: 'icon',
			name: 'Icon',
			kind: 'Component',
			desc: "An image icon that can't be dragged or selected. Give it one dimension and it stays square.",
			traits: ['16px by default', 'Not draggable', 'Forwards ref'],
			props: [
				['src', 'string'],
				['width', 'number'],
				['height', 'number']
			],
			code: `<Icon src="/layers.svg" width={24} />`,
			notes: [
				{ at: '.rb-icon', i: 0, label: 'width={16}', side: 'top' },
				{ at: '.rb-icon', i: 3, label: 'width={48}', side: 'top' }
			],
			Demo: IconDemo
		}
		]
	},
	{
		id: 'overlays',
		title: 'Overlays',
		items: [
		{
			key: 'tooltip',
			name: 'Tooltip',
			kind: 'Component',
			desc: 'Unfolds from its trigger, below by default or in any of the other three directions. Hides while the page scrolls.',
			traits: ['Four directions', 'Rendered in a portal', 'Hides on scroll', 'Sets aria-describedby'],
			props: [
				['text', 'string'],
				['above · left · right', 'boolean'],
				['forceShow', 'boolean'],
				['forceHide', 'boolean']
			],
			code: `<Tooltip text="Copy link" right>
  <Button>Hover me</Button>
</Tooltip>`,
			Demo: TooltipDemo
		},
		{
			key: 'popover',
			name: 'Popover',
			kind: 'Component',
			desc: 'Measures itself before opening, then opens on the side with the most room. Drag the chip toward an edge and click it.',
			traits: ['Smart positioning', 'Uses the Popover API', 'Follows its trigger on scroll and resize', 'Closes on outside click'],
			props: [
				['content', 'node | (close) => node'],
				['above · below · left · right', 'boolean'],
				['smartPositions', 'PopoverPosition[]'],
				['matchTriggerWidth', 'boolean'],
				['defaultOpen', 'boolean'],
				['onOpenChange', '(open) => void']
			],
			code: `<Popover content={(close) => (
  <Box>… <Button onClick={close}>Done</Button></Box>
)}>
  <Button>Open</Button>
</Popover>`,
			Demo: PopoverDemo
		}
		]
	},
	{
		id: 'menus',
		title: 'Menus',
		items: [
		{
			key: 'dropdown',
			name: 'Dropdown',
			kind: 'Component',
			desc: 'A menu as wide as its trigger. Async items show a loading state, and the menu closes once they finish.',
			traits: ['Async items', 'Arrow keys and Escape', 'Matches trigger width'],
			props: [
				['items', '{ key, label, onPick }[]'],
				['above', 'boolean'],
				['smartPositions', 'PopoverPosition[]'],
				['onOpenChange', '(open) => void']
			],
			code: `<Dropdown items={[
  { key: 'pdf', label: 'Export as PDF',
    onPick: async () => await render() },
]}>
  <Button>Export</Button>
</Dropdown>`,
			notes: [
				{ at: '.rb-button', i: 0, label: 'items', side: 'top' },
				{ at: '.rb-button', i: 1, label: 'above', side: 'bottom' }
			],
			Demo: DropdownDemo
		},
		{
			key: 'select',
			name: 'Select',
			kind: 'Component',
			desc: 'A combobox on top of Dropdown. The shown choice only changes after an async onPick resolves.',
			traits: ['Async onPick', 'Opens with Enter or Space', 'combobox role'],
			props: [
				['options', '{ key, name, onPick?, default? }[]'],
				['above', 'boolean'],
				['smartPositions', 'PopoverPosition[]']
			],
			code: `<Select options={fonts.map((f) => ({
  key: f.key,
  name: f.name,
  onPick: async () => setFont(await load(f.key)),
}))} />`,
			notes: [
				{ at: '.rb-select', label: 'options', side: 'left' },
				{ at: '.face-card', label: 'onPick', side: 'right' }
			],
			Demo: SelectDemo
		}
		]
	},
	{
		id: 'surfaces',
		title: 'Surfaces',
		items: [
		{
			key: 'box',
			name: 'Box',
			kind: 'Component',
			desc: 'The base surface. Takes an optional background image and a large faded corner icon.',
			traits: ['Background image', 'Corner icon', 'Custom image component, e.g. next/image'],
			props: [
				['image', 'string'],
				['icon', 'string'],
				['imageComponent', 'ComponentType']
			],
			code: `<Box icon="/bowl.svg">
  <h4>Ricebowl</h4>
</Box>`,
			notes: [
				{ at: '.rb-box-icon', label: 'icon', side: 'right' },
				{ at: 'h4', label: 'children', side: 'left' }
			],
			Demo: BoxDemo
		},
		{
			key: 'panel',
			name: 'Panel',
			kind: 'Component',
			desc: 'A Box with a title row above it. The title row has room on the right for actions.',
			traits: ['Title row', 'Title actions', 'Accepts Box props'],
			props: [
				['title', 'string'],
				['titleExtra', 'ReactNode']
			],
			code: `<Panel title="Storage" titleExtra={<IconButton>…</IconButton>}>
  …
</Panel>`,
			notes: [
				{ at: '.rb-panel-title', label: 'title', side: 'left' },
				{ at: '.rb-panel-title .rb-icon-button', label: 'titleExtra', side: 'right' },
				{ at: '.storage', label: 'children', side: 'left' }
			],
			Demo: PanelDemo
		},
		{
			key: 'loading',
			name: 'Loading',
			kind: 'Component',
			desc: 'Three pulsing dots. Centred in the nearest positioned parent by default, or inline with text.',
			traits: ['Centred or inline', 'role="status"'],
			props: [
				['inline', 'boolean'],
				['className', 'string'],
				['style', 'CSSProperties']
			],
			code: `<Box style={{ height: 120 }}>
  <Loading />
</Box>

<p>Loading <Loading inline /></p>`,
			notes: [
				{ at: '.rb-loading', i: 0, label: '<Loading />', side: 'top' },
				{ at: '.rb-loading', i: 1, label: 'inline', side: 'top' }
			],
			Demo: LoadingDemo
		}
		]
	},
	{
		id: 'global',
		title: 'Global',
		items: [
		{
			key: 'modal',
			name: 'Modal',
			kind: 'Function',
			desc: 'One modal at a time. Opening a second one swaps it in, and openPreviousModal() goes back.',
			traits: ['Traps focus', 'Escape and backdrop close', 'Returns focus on close', 'Remembers the previous modal'],
			props: [
				['setModal', '(node, onClose?) => void'],
				['hideModal', '() => void'],
				['openPreviousModal', '() => void'],
				['<ModalBox>', 'icon · image · className']
			],
			code: `setModal(
  <ModalBox>
    <h2>Settings</h2>
  </ModalBox>,
  () => toast('Closed')
)`,
			notes: [
				{ at: '.rb-button', i: 0, label: 'setModal(node, onClose)', side: 'top' },
				{ at: '.rb-button', i: 1, label: 'setModal(node)', side: 'bottom' }
			],
			Demo: ModalDemo
		},
		{
			key: 'toast',
			name: 'Toast',
			kind: 'Function',
			desc: 'Toasts stack in a corner of your choice, pause while hovered and fade out after a few seconds.',
			traits: ['Stacks', 'Pauses on hover', 'Any corner', 'Five types'],
			props: [
				['toast', '(text, type?) => void'],
				['setToastLocation', '(x, y) => void'],
				['setToastVisibility', '(visible) => void'],
				['<ToastBox>', 'the toast itself']
			],
			code: `import { toast } from 'ricebowl'

toast('Upload complete.', 'success')
setToastLocation('left', 'top')`,
			notes: [
				{ at: '.toast-controls .row', i: 0, label: 'toast(text, type)', side: 'top' },
				{ at: '.corners', label: 'setToastLocation', side: 'bottom' },
				{ at: '.toast-gallery', label: '<ToastBox type>', side: 'top' }
			],
			Demo: ToastDemo
		}
		]
	}
]

export const SCREENS = [
	...CATEGORIES.map((c) => ({ id: c.id, name: c.title })),
	{ id: 'theming', name: 'Theme' },
	{ id: 'install', name: 'Install' }
]
