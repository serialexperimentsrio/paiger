import { useRef, useState, type ComponentType, type ReactNode } from 'react'
import {
	Box,
	Button,
	Checkbox,
	Dropdown,
	Icon,
	IconButton,
	Input,
	Loading,
	ModalBox,
	Panel,
	Popover,
	Radio,
	Select,
	Switch,
	Tabs,
	Textarea,
	ToastBox,
	Tooltip,
	hideModal,
	openPreviousModal,
	setModal,
	setToastLocation,
	setToastVisibility,
	toast,
	type ToastType
} from 'paiger'
import { Notes, type Note } from './notes'
import { Glyph } from './ornaments'

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const Ico = ({ name, size = 18 }: { name: string; size?: number }) => (
	<Icon src={`icons/${name}.svg`} width={size} tint />
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

function Code({ children }: { children: string }) {
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

/** Code block with a label and a copy button */
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

/* Component screens */

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

/** The letter behind each screen */
export const GLYPHS: Record<string, string> = {
	buttons: 'B',
	forms: 'F',
	overlays: 'O',
	menus: 'M',
	surfaces: 'S',
	global: 'G',
	theming: 'T',
	install: 'I'
}

export function CategoryScreens() {
	return CATEGORIES.map((cat, i) => <CategoryScreen key={cat.id} {...cat} flip={i % 2 === 1} />)
}

/**
 * One screen per category: the live component, its name and its props.
 * Every other screen is mirrored.
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

/* Demos */

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
				<Button size="small">Small</Button>
				<Button variant="ghost">Ghost</Button>
				<Button size="large">Large</Button>
			</div>
			<div className="row">
				<Button loading={forced}>{forced ? 'Loading' : 'Idle'}</Button>
				<Switch className="switch" checked={forced} onChange={(e) => setForced(e.target.checked)}>
					<code>loading</code>
				</Switch>
			</div>
		</div>
	)
}

function IconButtonDemo() {
	const [liked, setLiked] = useState(false)
	return (
		<div className="toolbar">
			<Tooltip content={liked ? 'Unfavourite' : 'Favourite'} placement="top">
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
			<Tooltip content="Copy link" placement="top">
				<IconButton aria-label="Copy link" onClick={() => copy(location.href, 'Link copied')}>
					<Ico name="share" />
				</IconButton>
			</Tooltip>
			<Tooltip content="Download" placement="top">
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
			<Tooltip content="Delete" placement="top">
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

/** All four sides pinned open at once, with `open` on a switch */
function TooltipDemo() {
	const [pinned, setPinned] = useState(true)
	// Unpinned, they go back to showing on hover and focus
	const open = pinned || undefined
	return (
		<div className="tips">
			<Tooltip content="top" placement="top" open={open}>
				<Button className="t-n">Up</Button>
			</Tooltip>
			<Tooltip content="left" placement="left" open={open}>
				<Button className="t-w">Left</Button>
			</Tooltip>
			<Switch className="switch t-c" checked={pinned} onChange={(e) => setPinned(e.target.checked)}>
				<code>open</code>
			</Switch>
			<Tooltip content="right" placement="right" open={open}>
				<Button className="t-e">Right</Button>
			</Tooltip>
			<Tooltip content="bottom (default)" open={open}>
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
			{/* Crosshairs and coordinates follow the chip */}
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
				{(['top', 'bottom', 'left', 'right'] as const).map((d) => (
					<Popover key={d} placement={d} content={<Box className="pop-card pop-small">{d}</Box>}>
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
					{ key: 'png', label: 'Export as PNG', onSelect: exportAs('png') },
					{ key: 'svg', label: 'Export as SVG', onSelect: exportAs('svg') },
					{ key: 'pdf', label: 'Export as PDF', onSelect: exportAs('pdf') },
					{ key: 'link', label: 'Copy link', onSelect: () => copy(location.href, 'Link copied') }
				]}
			>
				<Button className="w-wide">Export</Button>
			</Dropdown>
			<Dropdown
				placement="top"
				items={[
					{ key: 'd', label: 'Duplicate', onSelect: () => toast('Duplicated') },
					{ key: 'r', label: 'Rename', onSelect: () => toast('Renamed', 'info') },
					{
						key: 'a',
						label: 'Archive',
						onSelect: () => toast('Archived', { type: 'warning', action: { label: 'Undo', onClick: () => toast('Restored') } })
					}
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
				aria-label="Typeface"
				options={FACES.map((f) => ({ value: f.key, label: f.name }))}
				value={face.key}
				onChange={async (key) => {
					await sleep(450)
					setFace(FACES.find((f) => f.key === key)!)
				}}
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

function InputDemo() {
	const [email, setEmail] = useState('ada@example')
	const invalid = email !== '' && !/^\S+@\S+\.\S+$/.test(email)
	return (
		<Box className="form-card">
			<label htmlFor="demo-name">Name</label>
			<Input id="demo-name" placeholder="Ada Lovelace" autoComplete="off" />
			<label htmlFor="demo-email">Email</label>
			<Input
				id="demo-email"
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				aria-invalid={invalid}
				aria-describedby="demo-email-error"
				autoComplete="off"
			/>
			<p id="demo-email-error" className="form-hint">
				{invalid ? 'Enter an address like name@example.com.' : ''}
			</p>
			<label htmlFor="demo-locked">Account</label>
			<Input id="demo-locked" defaultValue="ada-1815" disabled />
		</Box>
	)
}

function TextareaDemo() {
	const [text, setText] = useState('')
	return (
		<Box className="form-card">
			<label htmlFor="demo-message">Message</label>
			<Textarea
				id="demo-message"
				rows={4}
				maxLength={200}
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder="What would you like to say?"
				aria-describedby="demo-message-count"
			/>
			<p id="demo-message-count" className="form-hint">
				{text.length} / 200
			</p>
		</Box>
	)
}

const FOLDERS = ['Photos', 'Documents', 'Music']

function CheckboxDemo() {
	const [picked, setPicked] = useState<string[]>(['Photos'])
	const all = picked.length === FOLDERS.length
	return (
		<Box className="form-card">
			<fieldset>
				<legend>Back up</legend>
				<Checkbox
					checked={all}
					indeterminate={picked.length > 0 && !all}
					onChange={(e) => setPicked(e.target.checked ? FOLDERS : [])}
				>
					Everything
				</Checkbox>
				<div className="form-nested">
					{FOLDERS.map((f) => (
						<Checkbox
							key={f}
							checked={picked.includes(f)}
							onChange={(e) => setPicked(e.target.checked ? [...picked, f] : picked.filter((p) => p !== f))}
						>
							{f}
						</Checkbox>
					))}
				</div>
				<Checkbox disabled>System files</Checkbox>
			</fieldset>
		</Box>
	)
}

function RadioDemo() {
	return (
		<Box className="form-card">
			<fieldset>
				<legend>Delivery</legend>
				<Radio name="demo-delivery" value="standard" defaultChecked>
					Standard, 3 to 5 days
				</Radio>
				<Radio name="demo-delivery" value="express">
					Express, next day
				</Radio>
				<Radio name="demo-delivery" value="collect" disabled>
					Collect in store
				</Radio>
			</fieldset>
		</Box>
	)
}

function SwitchDemo() {
	return (
		<Box className="form-card settings">
			<Switch defaultChecked>Notifications</Switch>
			<Switch>Auto-save</Switch>
			<Switch defaultChecked disabled>
				Sync
			</Switch>
		</Box>
	)
}

function TabsDemo() {
	return (
		<Box className="form-card tabs-card">
			<Tabs
				aria-label="Product"
				items={[
					{ key: 'overview', label: 'Overview', content: <p>A cast-iron teapot that holds 0.8 litres.</p> },
					{ key: 'specs', label: 'Specs', content: <p>Iron, enamel inside. 1.4 kg. Made in Morioka.</p> },
					{ key: 'reviews', label: 'Reviews', content: <p>4.8 out of 5, from 212 reviews.</p> },
					{ key: 'archive', label: 'Archive', content: null, disabled: true }
				]}
			/>
		</Box>
	)
}

function BoxDemo() {
	return (
		<Box icon="icons/bowl.svg" className="bowl-box">
			<h4>Paiger</h4>
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
					<Tooltip content="Add item" placement="left">
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
				<Loading center />
			</Box>
			<Box className="load-box">
				<p>
					Loading <Loading />
				</p>
			</Box>
		</div>
	)
}

function KeysModal() {
	return (
		<ModalBox className="modal" title="Keyboard">
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
			</div>
		</ModalBox>
	)
}

function SettingsModal() {
	return (
		<ModalBox className="modal" title="Settings">
			<p className="modal-copy">
				Opening another modal from here replaces this one. <code>openPreviousModal()</code> brings it back.
			</p>
			<div className="row">
				<Button onClick={() => setModal(<KeysModal />)}>Keyboard</Button>
			</div>
		</ModalBox>
	)
}

function RenameModal() {
	const [name, setName] = useState('')
	return (
		<ModalBox className="modal" title="Rename">
			<form className="rename-form" onSubmit={(e) => e.preventDefault()}>
				<label htmlFor="rename-name">Name</label>
				<Input id="rename-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
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
			<Button onClick={() => setModal(<SettingsModal />, () => toast('Settings closed'))}>Open modal</Button>
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
					<Switch
						className="switch"
						checked={visible}
						onChange={(e) => {
							setVisible((toastsVisible = e.target.checked))
							setToastVisibility(e.target.checked)
						}}
					>
						Visible
					</Switch>
				</div>
			</div>
			<div className="toast-gallery" aria-hidden="true">
				{TYPES.slice(1).map((t) => (
					<ToastBox key={t.type} type={t.type}>
						{t.text}
					</ToastBox>
				))}
			</div>
		</div>
	)
}

/* Screens */

const CATEGORIES: Category[] = [
	{
		id: 'buttons',
		title: 'Buttons',
		items: [
		{
			key: 'button',
			name: 'Button',
			kind: 'Component',
			desc: 'Return a promise from onClick and a light sweeps the border until it settles. Clicks during loading are ignored, and it only submits a form with type="submit".',
			traits: ['Async onClick', 'Sets aria-busy while loading', 'Keeps focus while loading', 'Forwards ref'],
			props: [
				['onClick', '(event) => Promise | void'],
				['loading', 'boolean'],
				['danger', 'boolean'],
				['size', "'small' | 'medium' | 'large'"],
				['variant', "'solid' | 'ghost'"]
			],
			code: `<Button onClick={async () => {
  await save(draft)
}}>
  Save
</Button>`,
			notes: [
				{ at: '.row:first-child .pg-button', i: 0, label: 'onClick: async', side: 'top' },
				{ at: '.row:first-child .pg-button', i: 1, label: 'danger', side: 'top' },
				{ at: '.row:first-child .pg-button', i: 2, label: 'disabled', side: 'top' },
				{ at: '.row:nth-child(2) .pg-button', i: 0, label: 'size="small"', side: 'left' },
				{ at: '.row:nth-child(2) .pg-button', i: 2, label: 'size="large"', side: 'right' },
				{ at: '.row:last-child .pg-button', label: 'loading', side: 'left' }
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
				['…', 'Button props except size']
			],
			code: `<IconButton aria-label="Favourite" onClick={save}>
  <Icon src="/heart.svg" />
</IconButton>`,
			notes: [
				{ at: '.pg-icon-button', i: 0, label: 'aria-pressed', side: 'top' },
				{ at: '.pg-icon-button', i: 1, label: 'children: <Icon />', side: 'bottom' },
				{ at: '.pg-icon-button', i: 2, label: 'onClick: async', side: 'top' },
				{ at: '.pg-icon-button', i: 3, label: 'danger', side: 'bottom' }
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
				['height', 'number'],
				['tint', 'boolean']
			],
			code: `<Icon src="/layers.svg" width={24} tint />`,
			notes: [
				{ at: '.pg-icon', i: 0, label: 'width={16}', side: 'top' },
				{ at: '.pg-icon', i: 3, label: 'width={48}', side: 'top' }
			],
			Demo: IconDemo
		}
		]
	},
	{
		id: 'forms',
		title: 'Forms',
		items: [
		{
			key: 'input',
			name: 'Input',
			kind: 'Component',
			desc: 'A single-line text field that takes every attribute a native input does. Mark it invalid with aria-invalid, and point aria-describedby at the message that says why.',
			traits: ['Native input', 'aria-invalid styling', 'Forwards ref'],
			props: [
				['type', 'string'],
				['aria-invalid', 'boolean'],
				['aria-describedby', 'string'],
				['…', 'every <input> attribute']
			],
			code: `<label htmlFor="email">Email</label>
<Input
  id="email"
  type="email"
  aria-invalid={!valid}
  aria-describedby="email-error"
/>`,
			notes: [
				{ at: '.pg-input', i: 1, label: 'aria-invalid', side: 'right' },
				{ at: '.pg-input', i: 2, label: 'disabled', side: 'right' }
			],
			Demo: InputDemo
		},
		{
			key: 'textarea',
			name: 'Textarea',
			kind: 'Component',
			desc: 'A multi-line text field that resizes vertically. Everything else is the native textarea.',
			traits: ['Native textarea', 'Resizes vertically', 'Forwards ref'],
			props: [
				['rows', 'number'],
				['maxLength', 'number'],
				['…', 'every <textarea> attribute']
			],
			code: `<Textarea rows={4} maxLength={200} />`,
			notes: [{ at: '.pg-textarea', label: 'rows={4}', side: 'right' }],
			Demo: TextareaDemo
		},
		{
			key: 'checkbox',
			name: 'Checkbox',
			kind: 'Component',
			desc: 'A native checkbox, restyled. Its children are the label, and indeterminate shows the mixed state of a box that stands for several others.',
			traits: ['Native input', 'Indeterminate', 'Label from children', 'Forwards ref'],
			props: [
				['checked · defaultChecked', 'boolean'],
				['indeterminate', 'boolean'],
				['onChange', '(event) => void'],
				['children', 'ReactNode']
			],
			code: `<Checkbox
  checked={all}
  indeterminate={some}
  onChange={(e) => setAll(e.target.checked)}
>
  Everything
</Checkbox>`,
			notes: [
				{ at: '.pg-checkbox-input', i: 0, label: 'indeterminate', side: 'left' },
				{ at: '.pg-checkbox-input', i: 4, label: 'disabled', side: 'left' }
			],
			Demo: CheckboxDemo
		},
		{
			key: 'radio',
			name: 'Radio',
			kind: 'Component',
			desc: 'A native radio button, restyled. Radios that share a name are one group, and arrow keys move between them. A fieldset and legend name the group.',
			traits: ['Native input', 'Arrow keys within a group', 'Forwards ref'],
			props: [
				['name', 'string'],
				['value', 'string'],
				['checked · defaultChecked', 'boolean'],
				['children', 'ReactNode']
			],
			code: `<fieldset>
  <legend>Delivery</legend>
  <Radio name="delivery" value="standard" defaultChecked>
    Standard
  </Radio>
  <Radio name="delivery" value="express">Express</Radio>
</fieldset>`,
			notes: [
				{ at: '.pg-radio-input', i: 0, label: 'name="demo-delivery"', side: 'left' },
				{ at: '.pg-radio-input', i: 2, label: 'disabled', side: 'left' }
			],
			Demo: RadioDemo
		},
		{
			key: 'switch',
			name: 'Switch',
			kind: 'Component',
			desc: 'An on and off control that screen readers announce as a switch. Use it for settings that apply straight away, and Checkbox in forms that are submitted.',
			traits: ['role="switch"', 'Native input', 'Forwards ref'],
			props: [
				['checked · defaultChecked', 'boolean'],
				['onChange', '(event) => void'],
				['children', 'ReactNode']
			],
			code: `<Switch checked={on} onChange={(e) => setOn(e.target.checked)}>
  Notifications
</Switch>`,
			notes: [
				{ at: '.pg-switch-input', i: 0, label: 'checked', side: 'right' },
				{ at: '.pg-switch-input', i: 2, label: 'disabled', side: 'right' }
			],
			Demo: SwitchDemo
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
			desc: 'Unfolds from its trigger on hover or keyboard focus, below by default or on any other side. Hides while the page scrolls.',
			traits: ['Four sides', 'Shows on keyboard focus', 'Wraps long content', 'Sets aria-describedby'],
			props: [
				['content', 'ReactNode'],
				['placement', "'top' | 'bottom' | 'left' | 'right'"],
				['open', 'boolean']
			],
			code: `<Tooltip content="Copy link" placement="right">
  <Button>Hover me</Button>
</Tooltip>`,
			Demo: TooltipDemo
		},
		{
			key: 'popover',
			name: 'Popover',
			kind: 'Component',
			desc: 'Measures itself before opening, then opens on the side with the most room. Drag the chip toward an edge and click it.',
			traits: ['Smart positioning', 'Uses the Popover API', 'Follows its trigger', 'Escape and outside click close', 'Moves focus in and back'],
			props: [
				['content', 'node | (close) => node'],
				['open · defaultOpen', 'boolean'],
				['placement', 'Placement'],
				['autoPlacements', 'Placement[]'],
				['closeOnClickOutside', 'boolean'],
				['matchTriggerWidth', 'boolean'],
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
			desc: 'A menu as wide as its trigger. An async item sweeps its border while it runs, and the menu closes once it finishes.',
			traits: ['Async items', 'Arrows, Home, End, type to jump', 'menu role', 'Matches trigger width'],
			props: [
				['items', '{ key, label, onSelect }[]'],
				['placement', 'Placement'],
				['autoPlacements', 'Placement[]'],
				['onOpenChange', '(open) => void']
			],
			code: `<Dropdown items={[
  { key: 'pdf', label: 'Export as PDF',
    onSelect: async () => await render() },
]}>
  <Button>Export</Button>
</Dropdown>`,
			notes: [
				{ at: '.pg-button', i: 0, label: 'items', side: 'top' },
				{ at: '.pg-button', i: 1, label: 'placement="top"', side: 'bottom' }
			],
			Demo: DropdownDemo
		},
		{
			key: 'select',
			name: 'Select',
			kind: 'Component',
			desc: 'Pick one value from a list. Controlled or not, and an async onChange keeps the list open until it settles.',
			traits: ['Controlled or uncontrolled', 'Async onChange', 'Submits with forms via name', 'listbox role'],
			props: [
				['options', '{ value, label }[]'],
				['value · defaultValue', 'string'],
				['onChange', '(value) => Promise | void'],
				['name', 'string'],
				['disabled', 'boolean'],
				['placement', 'Placement']
			],
			code: `<Select
  options={fonts.map((f) => ({ value: f.key, label: f.name }))}
  value={font}
  onChange={async (key) => setFont(await load(key))}
/>`,
			notes: [
				{ at: '.pg-select', label: 'options', side: 'left' },
				{ at: '.face-card', label: 'onChange', side: 'right' }
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
  <h4>Paiger</h4>
</Box>`,
			notes: [
				{ at: '.pg-box-icon', label: 'icon', side: 'right' },
				{ at: 'h4', label: 'children', side: 'left' }
			],
			Demo: BoxDemo
		},
		{
			key: 'panel',
			name: 'Panel',
			kind: 'Component',
			desc: 'A Box with a title row above it. The title row has room on the right for actions.',
			traits: ['Title row', 'Title actions', 'Forwards ref'],
			props: [
				['title', 'ReactNode'],
				['titleExtra', 'ReactNode'],
				['className', 'string']
			],
			code: `<Panel title="Storage" titleExtra={<IconButton>…</IconButton>}>
  …
</Panel>`,
			notes: [
				{ at: '.pg-panel-title', label: 'title', side: 'left' },
				{ at: '.pg-panel-title .pg-icon-button', label: 'titleExtra', side: 'right' },
				{ at: '.storage', label: 'children', side: 'left' }
			],
			Demo: PanelDemo
		},
		{
			key: 'tabs',
			name: 'Tabs',
			kind: 'Component',
			desc: 'Switches between panels of content. Arrow keys move between tabs and select as they go, and only the selected panel is rendered.',
			traits: ['Arrows, Home, End', 'tablist role', 'Controlled or uncontrolled', 'Disabled tabs'],
			props: [
				['items', '{ key, label, content, disabled? }[]'],
				['value · defaultValue', 'string'],
				['onChange', '(key) => void'],
				['aria-label', 'string']
			],
			code: `<Tabs
  aria-label="Product"
  items={[
    { key: 'overview', label: 'Overview', content: <Overview /> },
    { key: 'specs', label: 'Specs', content: <Specs /> },
  ]}
/>`,
			notes: [
				{ at: '.pg-tabs-list', label: 'items', side: 'top' },
				{ at: '.pg-tab', i: 3, label: 'disabled', side: 'right' },
				{ at: '.pg-tabs-panel', label: 'content', side: 'left' }
			],
			Demo: TabsDemo
		},
		{
			key: 'loading',
			name: 'Loading',
			kind: 'Component',
			desc: 'Three dots in a travelling wave. Sits inline with text, or centred in the nearest positioned parent.',
			traits: ['Inline or centred', 'Size, gap and speed tokens', 'role="status"'],
			props: [
				['center', 'boolean'],
				['className', 'string'],
				['style', 'CSSProperties']
			],
			code: `<Box style={{ height: 120 }}>
  <Loading center />
</Box>

<p>Loading <Loading /></p>`,
			notes: [
				{ at: '.pg-loading', i: 0, label: 'center', side: 'top' },
				{ at: '.pg-loading', i: 1, label: '<Loading />', side: 'top' }
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
			desc: 'One modal at a time, rendered inside your app so it can use your context. Opening another swaps it in, and openPreviousModal() goes back a step at a time.',
			traits: ['Traps focus', 'Locks page scroll', 'Escape, backdrop and × close', 'Returns focus on close', 'Full back history'],
			props: [
				['setModal', '(node, onClose?) => void'],
				['hideModal', '() => void'],
				['openPreviousModal', '() => void'],
				['isModalOpen', '() => boolean'],
				['<ModalBox>', 'title · closeButton · icon · image']
			],
			code: `setModal(
  <ModalBox title="Settings">…</ModalBox>,
  () => toast('Closed')
)`,
			notes: [
				{ at: '.pg-button', i: 0, label: 'setModal(node, onClose)', side: 'top' },
				{ at: '.pg-button', i: 1, label: 'setModal(node)', side: 'bottom' }
			],
			Demo: ModalDemo
		},
		{
			key: 'toast',
			name: 'Toast',
			kind: 'Function',
			desc: 'Toasts stack in a corner of your choice, pause while hovered and fade out after a few seconds. Each can carry an action, and has a × to dismiss it.',
			traits: ['Stacks', 'Pauses on hover', 'Actions', 'Any corner', 'Five types'],
			props: [
				['toast', '(node, type | options?) => id'],
				['options', '{ type, duration, action }'],
				['dismissToast', '(id) => void'],
				['setToastLocation', '(x, y) => void'],
				['<ToastBox>', 'a toast that stays put']
			],
			code: `toast('Archived.', {
  type: 'warning',
  action: { label: 'Undo', onClick: restore },
})`,
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
