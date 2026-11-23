// Things the tests need that the demo doesn't show: context inside a modal,
// buttons and a select inside a form, modal history, and so on
import { createContext, useContext, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
	Button,
	Checkbox,
	Dropdown,
	Icon,
	Input,
	Loading,
	ModalBox,
	Panel,
	Popover,
	PaigerProvider,
	Radio,
	Select,
	Switch,
	Tabs,
	Textarea,
	Tooltip,
	dismissToast,
	openPreviousModal,
	setModal,
	toast
} from 'paiger'

const Theme = createContext('missing')
const exits: string[] = []
;(window as unknown as { modalExits: string[] }).modalExits = exits

function ReadsContext() {
	return <p id="context-value">{useContext(Theme)}</p>
}

// Its last control is a Select, whose list stays mounted while closed
const withSelect = () =>
	setModal(
		<ModalBox title="With select" closeButton={false}>
			<Button id="modal-first">First</Button>
			<Select
				name="size"
				aria-label="Size"
				options={[
					{ value: 's', label: 'Small' },
					{ value: 'l', label: 'Large' }
				]}
			/>
		</ModalBox>
	)

const step = (name: string, next?: string) =>
	setModal(
		<ModalBox title={name}>{next && <Button onClick={() => step(next)}>Next</Button>}</ModalBox>,
		() => exits.push(name)
	)

function Page() {
	const [submits, setSubmits] = useState(0)
	const [fruit, setFruit] = useState('apple')
	const [lastToast, setLastToast] = useState('')
	const [openChanges, setOpenChanges] = useState<boolean[]>([])
	const [controlledOpen, setControlledOpen] = useState(false)
	const [farPinned, setFarPinned] = useState(false)

	return (
		<main style={{ padding: 40, display: 'grid', gap: 16, justifyItems: 'start', height: '200vh' }}>
			<Button id="open-context" onClick={() => setModal(<ModalBox title="Context"><ReadsContext /></ModalBox>)}>
				Context modal
			</Button>
			<Button id="open-steps" onClick={() => step('one', 'two')}>
				Steps
			</Button>
			<Button id="step-three" onClick={() => step('three')}>
				Step three
			</Button>
			<Button id="back" onClick={openPreviousModal}>
				Back
			</Button>
			<Button id="open-select-modal" onClick={withSelect}>
				Modal with a select
			</Button>
			<Button
				id="open-icon-modal"
				onClick={() =>
					setModal(
						<ModalBox title="With icon" icon="icons/bowl.svg">
							<p>Body</p>
						</ModalBox>
					)
				}
			>
				Modal with an icon
			</Button>

			<form
				id="form"
				onSubmit={(e) => {
					e.preventDefault()
					setSubmits((n) => n + 1)
				}}
			>
				<Button id="plain" onClick={() => {}}>
					Plain
				</Button>
				<Button id="submit" type="submit" onClick={() => {}}>
					Submit
				</Button>
				<Select
					name="fruit"
					aria-label="Fruit"
					value={fruit}
					onChange={setFruit}
					options={[
						{ value: 'apple', label: 'Apple' },
						{ value: 'banana', label: 'Banana' },
						{ value: 'cherry', label: 'Cherry' }
					]}
				/>
				<output id="submits">{submits}</output>
			</form>
			<Button id="reset-fruit" onClick={() => setFruit('apple')}>
				Reset fruit
			</Button>
			<output id="fruit">{fruit}</output>

			<Dropdown
				items={['Apple', 'Banana', 'Cherry'].map((label) => ({ key: label, label, onSelect: () => toast(label) }))}
			>
				<Button id="menu">Menu</Button>
			</Dropdown>

			<Dropdown items={['New Delhi', 'New York', 'Newark'].map((label) => ({ key: label, label, onSelect: () => {} }))}>
				<Button id="cities">Cities</Button>
			</Dropdown>

			<Popover
				onOpenChange={(open) => setOpenChanges((list) => [...list, open])}
				content={
					<Tooltip content="Above the popover">
						<Button id="inside">Inside</Button>
					</Tooltip>
				}
			>
				<Button id="popover">Popover</Button>
			</Popover>
			<output id="open-changes">{openChanges.join(',')}</output>


			<Tooltip content={'Two\nlines'}>
				<Button id="tip">Tip</Button>
			</Tooltip>

			<Button
				id="sticky-toast"
				onClick={() =>
					setLastToast(toast('Sticky', { duration: Infinity, action: { label: 'Undo', onClick: () => toast('Undone') } }))
				}
			>
				Sticky toast
			</Button>
			<Button id="dismiss-toast" onClick={() => dismissToast(lastToast)}>
				Dismiss it
			</Button>
			<Button id="error-toast" onClick={() => toast('It broke', 'error')}>
				Error toast
			</Button>

			<Popover open={controlledOpen} onOpenChange={setControlledOpen} content={<p id="controlled-content">Controlled</p>}>
				<Button id="controlled">Controlled</Button>
			</Popover>
			<Button id="controlled-toggle" onClick={() => setControlledOpen(true)}>
				Open it from outside
			</Button>

			<label htmlFor="shirt">Shirt size</label>
			<Select id="shirt" disabled options={[{ value: 'm', label: 'Medium' }]} />

			<Loading />
			<span style={{ color: 'rgb(255, 0, 0)' }}>
				<Icon id="tinted" src="icons/heart.svg" alt="Heart" tint />
			</span>

			<Input id="email" type="email" aria-invalid defaultValue="ada@" aria-label="Email" />
			<Textarea id="notes" rows={3} aria-label="Notes" />
			<Checkbox id="all" indeterminate>
				All
			</Checkbox>
			<Radio name="size" value="s" defaultChecked>
				Small
			</Radio>
			<Radio name="size" value="l">
				Large
			</Radio>
			<Switch>Wi-Fi</Switch>
			<Tabs
				aria-label="Sections"
				items={[
					{ key: 'a', label: 'Alpha', content: 'First panel' },
					{ key: 'b', label: 'Beta', content: 'Second panel', disabled: true },
					{ key: 'c', label: 'Gamma', content: 'Third panel' }
				]}
			/>

			<Panel id="panel" className="outer-class" title="Panel">
				<p>Body</p>
			</Panel>

			{/* Pinned open, far below the fold, once the button asks for it */}
			<Button id="pin-far" onClick={() => setFarPinned(true)}>
				Pin the far tooltip
			</Button>
			<div style={{ position: 'absolute', right: 40, top: '180vh' }}>
				<Tooltip placement="left" content="Far below" open={farPinned || undefined}>
					<Button id="far-tip">Far</Button>
				</Tooltip>
			</div>

			{/* Fixed at the top, so a tooltip asked to go above has to flip below */}
			<div style={{ position: 'fixed', top: 0, right: 0 }}>
				<Tooltip placement="top" content="Flips below">
					<Button id="flip-tip">Flip</Button>
				</Tooltip>
			</div>

			{/* Against the left edge, with a tooltip wider than the room beside it */}
			<div style={{ position: 'absolute', left: 0, top: '150vh' }}>
				<Tooltip placement="top" content="A tooltip far wider than the space to its left">
					<Button id="edge-tip">Edge</Button>
				</Tooltip>
			</div>
		</main>
	)
}

createRoot(document.getElementById('root')!).render(
	<Theme.Provider value="from the app">
		<PaigerProvider labels={{ loading: 'Laden' }}>
			<Page />
		</PaigerProvider>
	</Theme.Provider>
)
