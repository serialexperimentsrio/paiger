import { useEffect, useRef, useState } from 'react'
import { Box, Button, IconButton, Loading, Select, Tooltip, isModalOpen, toast } from 'paiger'
import pkg from '../../package.json'
import { Frame, Glyph, Mark } from './ornaments'
import { CategoryScreens, FACES, GLYPHS, Ico, Plate, SCREENS, Screen, copy, sleep } from './sections'
import { PRESETS, applyTheme, toCss, type PresetName, type Rgba, type Theme } from './themes'

const GITHUB = 'https://github.com/serialexperimentsrio/paiger'
const NPM = 'https://www.npmjs.com/package/paiger'
const PRESET_NAMES = Object.keys(PRESETS) as PresetName[]
const ORDER = ['top', ...SCREENS.map((s) => s.id)]

const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

const isTyping = (t: EventTarget | null) =>
	t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

export default function App() {
	const [theme, setTheme] = useState<Theme>(PRESETS.Light)
	const [preset, setPreset] = useState<PresetName | 'Custom'>('Light')
	const [active, setActive] = useState('top')

	useEffect(() => applyTheme(theme), [theme])

	useEffect(() => {
		// Whichever screen crosses the middle of the viewport is the active one.
		// A zero-height line works even for screens taller than the viewport.
		const spy = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => {
					// Lets CSS play a screen's entrance each time it comes into view
					e.target.toggleAttribute('data-active', e.isIntersecting)
					if (e.isIntersecting) setActive(e.target.id)
				}),
			{ rootMargin: '-50% 0px -50% 0px' }
		)
		document.querySelectorAll('main > section').forEach((el) => spy.observe(el))

		// The browser tried to jump to #hash before React rendered it, so try again
		if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' })
		return () => spy.disconnect()
	}, [])

	// Q / E step through the screens; Enter starts from the title screen
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.ctrlKey || e.metaKey || e.altKey || isModalOpen() || isTyping(e.target)) return
			const i = ORDER.indexOf(active)
			const key = e.key.toLowerCase()
			if (key === 'q' && i > 0) goTo(ORDER[i - 1])
			else if (key === 'e' && i < ORDER.length - 1) goTo(ORDER[i + 1])
			else if (e.key === 'Enter' && active === 'top' && e.target === document.body) goTo('buttons')
		}
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [active])

	const pickPreset = (name: PresetName) => {
		setPreset(name)
		setTheme(PRESETS[name])
	}
	const edit = (patch: Partial<Theme>) => {
		setPreset('Custom')
		setTheme((t) => ({ ...t, ...patch }))
	}

	return (
		<>
			<a className="skip" href="#buttons">
				Skip to components
			</a>
			<div className="backdrop" data-screen={active} aria-hidden="true" />
			<div className="grain-overlay" aria-hidden="true" />
			<Frame />
			<a className="lockup" href="#top" data-hidden={active === 'top' || undefined} aria-label="Paiger, back to the title">
				<Mark />
			</a>
			<main>
				<Title />
				<CategoryScreens />
				<ThemeScreen theme={theme} preset={preset} onPreset={pickPreset} onEdit={edit} />
				<Install />
			</main>
			<Chapters active={active} />
		</>
	)
}

/* Chapter list */

function Chapters({ active }: { active: string }) {
	const list = useRef<HTMLUListElement>(null)

	// Where the list scrolls sideways (narrow screens), keep the current chapter in view
	useEffect(() => {
		const ul = list.current
		const a = ul?.querySelector<HTMLElement>('[aria-current]')
		if (ul && a) ul.scrollTo({ left: a.offsetLeft - (ul.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' })
	}, [active])

	return (
		<nav className="chapters" aria-label="Screens">
			<kbd>Q</kbd>
			<ul ref={list}>
				{SCREENS.map((s) => (
					<li key={s.id}>
						<a href={`#${s.id}`} aria-current={active === s.id ? 'true' : undefined}>
							{s.name}
						</a>
					</li>
				))}
			</ul>
			<kbd>E</kbd>
		</nav>
	)
}

/* Title */

const MENU: { label: string; href: string; external?: boolean }[] = [
	{ label: 'Components', href: '#buttons' },
	{ label: 'Theme', href: '#theming' },
	{ label: 'Install', href: '#install' },
	{ label: 'Source', href: GITHUB, external: true }
]

function Title() {
	return (
		<section id="top" className="screen title" aria-labelledby="title-heading">
			<div className="title-copy">
			<h1 id="title-heading" className="wordmark">
				<Mark />
			</h1>
			<p className="meta">
				React component library <i aria-hidden="true">◆</i> v{pkg.version} <i aria-hidden="true">◆</i> {pkg.license}
			</p>
			<div className="cmd">
				<code>npm install paiger</code>
				<button className="link-btn" onClick={() => copy('npm install paiger')}>
					Copy
				</button>
			</div>
			<nav className="title-menu" aria-label="Title menu">
				{MENU.map((m) => (
					<a key={m.label} href={m.href} {...(m.external ? { target: '_blank', rel: 'noreferrer' } : {})}>
						{m.label}
					</a>
				))}
			</nav>
			</div>
		</section>
	)
}

/* Theme */

function ColorRow({
	name,
	value,
	onChange
}: {
	name: string
	value: string | Rgba
	onChange: (v: string | Rgba) => void
}) {
	const hex = typeof value === 'string' ? value : value.hex
	const id = `tok-${name}`
	return (
		<div className="tok">
			<span className="tok-swatch" style={{ background: hex }}>
				<input
					id={id}
					type="color"
					value={hex}
					onChange={(e) => onChange(typeof value === 'string' ? e.target.value : { ...value, hex: e.target.value })}
				/>
			</span>
			<label htmlFor={id}>--pg-color-{name}</label>
			{typeof value === 'string' ? (
				<code className="tok-val">{hex}</code>
			) : (
				<input
					className="range"
					type="range"
					min={0}
					max={1}
					step={0.01}
					value={value.a}
					aria-label={`${name} opacity`}
					style={{ '--fill': `${value.a * 100}%` } as React.CSSProperties}
					onChange={(e) => onChange({ ...value, a: +e.target.value })}
				/>
			)}
		</div>
	)
}

function SizeRow({ token, value, max, onChange }: { token: string; value: number; max: number; onChange: (v: number) => void }) {
	return (
		<div className="tok">
			<code className="tok-num">{value}px</code>
			<label htmlFor={`tok${token}`}>{token}</label>
			<input
				id={`tok${token}`}
				className="range"
				type="range"
				min={0}
				max={max}
				step={1}
				value={value}
				style={{ '--fill': `${(value / max) * 100}%` } as React.CSSProperties}
				onChange={(e) => onChange(+e.target.value)}
			/>
		</div>
	)
}

function ThemeScreen({
	theme,
	preset,
	onPreset,
	onEdit
}: {
	theme: Theme
	preset: PresetName | 'Custom'
	onPreset: (p: PresetName) => void
	onEdit: (patch: Partial<Theme>) => void
}) {
	const colorKeys = ['main', 'accent', 'bright', 'dim', 'danger', 'warning', 'success', 'backdrop'] as const

	return (
		<Screen id="theming" title="Theme" className="card flip theming">
			<header className="head">
				<h2 className="name">Theme</h2>
				<p className="kind">CSS custom properties</p>
				<div className="tabs" role="group" aria-label="Presets">
					{PRESET_NAMES.map((name) => (
						<button key={name} className="tab" aria-pressed={preset === name} onClick={() => onPreset(name)}>
							{name}
						</button>
					))}
					{preset === 'Custom' && <span className="tab is-custom">Custom</span>}
				</div>
			</header>

			<div className="stage">
				<Glyph text={GLYPHS.theming} />
				<div className="stage-inner specimen">
					<div className="row">
						<Button onClick={() => sleep(1200)}>Button</Button>
						<Button danger>Danger</Button>
						<Button disabled>Disabled</Button>
					</div>
					<div className="row">
						<Select
							aria-label="Typeface"
							options={FACES.slice(0, 3).map((f) => ({ value: f.key, label: f.name }))}
						/>
						<Box className="specimen-box">
							<p>Bright text</p>
							<p className="dim">
								Loading <Loading />
							</p>
						</Box>
					</div>
					<div className="row">
						<Tooltip content="Favourite" placement="top">
							<IconButton aria-label="Favourite" onClick={() => sleep(900)}>
								<Ico name="heart" />
							</IconButton>
						</Tooltip>
						<Tooltip content="Delete" placement="top">
							<IconButton aria-label="Delete" danger onClick={() => sleep(900)}>
								<Ico name="trash" />
							</IconButton>
						</Tooltip>
					</div>
					<div className="row">
						{(['success', 'warning', 'error'] as const).map((t) => (
							<Button key={t} onClick={() => toast(`A ${t} toast`, t)}>
								{t}
							</Button>
						))}
					</div>
				</div>
			</div>

			<div className="body tokens">
				{colorKeys.map((k) => (
					<ColorRow key={k} name={k} value={theme[k]} onChange={(v) => onEdit({ [k]: v } as Partial<Theme>)} />
				))}
				<SizeRow token="--pg-border-width" value={theme.border} max={6} onChange={(border) => onEdit({ border })} />
				<SizeRow token="--pg-radius" value={theme.radius} max={16} onChange={(radius) => onEdit({ radius })} />
			</div>

			<div className="usage">
				<Plate label={`${preset} theme`} code={toCss(theme)} />
			</div>
		</Screen>
	)
}

/* Install */

function Install() {
	return (
		<Screen id="install" title="Install" className="card install">
			<header className="head">
				<h2 className="name">Install</h2>
				<p className="kind">v{pkg.version}</p>
			</header>

			<div className="stage">
				<Glyph text={GLYPHS.install} />
				<ol className="steps">
					<li>
						<Plate label="Add the package" code="npm install paiger" />
					</li>
					<li>
						<Plate
							label="Set up once, at the root"
							code={`import 'paiger/styles.css'\nimport { PaigerProvider } from 'paiger'\n\n<PaigerProvider>\n  <App />\n</PaigerProvider>`}
						/>
					</li>
				</ol>
			</div>

			<div className="body">
				<h3 className="label">Requirements</h3>
				<dl className="props">
					<div>
						<dt>react</dt>
						<dd>{pkg.peerDependencies.react}</dd>
					</div>
					<div>
						<dt>Chrome</dt>
						<dd>114+</dd>
					</div>
					<div>
						<dt>Safari</dt>
						<dd>17+</dd>
					</div>
					<div>
						<dt>Firefox</dt>
						<dd>125+</dd>
					</div>
				</dl>
				<p className="desc">Uses the Web Animations API and the Popover API without polyfills.</p>
				<h3 className="label">Links</h3>
				<nav className="links" aria-label="Project links">
					<a href={GITHUB} target="_blank" rel="noreferrer">
						GitHub
					</a>
					<a href={NPM} target="_blank" rel="noreferrer">
						npm
					</a>
					<a href="#top">Title</a>
				</nav>
				<p className="credits">
					© 2026 {pkg.author} <i aria-hidden="true">◆</i> {pkg.license}
				</p>
			</div>
		</Screen>
	)
}
