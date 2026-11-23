import { forwardRef, useState, type ForwardedRef } from 'react'
import { List } from '../Dropdown'
import { Popover } from '../Popover'
import type { Placement } from '../Popover/position'
import style from './style.module.css'

export interface SelectOption {
	value: string
	label: string
}

export interface SelectProps {
	options: SelectOption[]
	// Controlled: the chosen value. Leave it out to let Select keep its own.
	value?: string
	// Uncontrolled: the value to start on. Defaults to the first option.
	defaultValue?: string
	// Return a promise to keep the list open, with the option busy, until it
	// settles; an uncontrolled Select only shows the new value after that
	onChange?: (value: string) => unknown
	// Submits the value with a surrounding <form> under this name
	name?: string
	placement?: Placement
	autoPlacements?: Placement[]
	// On the trigger button, so a <label htmlFor> can point at it
	id?: string
	disabled?: boolean
	className?: string
	style?: React.CSSProperties
	'aria-label'?: string
}

// The ref is the trigger button
export const Select = /* @__PURE__ */ forwardRef(function Select({
	options,
	value,
	defaultValue,
	onChange,
	name,
	placement,
	autoPlacements,
	id,
	disabled,
	className,
	style: customStyle,
	'aria-label': ariaLabel
}: SelectProps, ref: ForwardedRef<HTMLButtonElement>) {
	const [ownValue, setOwnValue] = useState(defaultValue ?? options[0]?.value)
	const current = value ?? ownValue
	const label = options.find((option) => option.value === current)?.label ?? ''

	const pick = async (next: string) => {
		await onChange?.(next)
		setOwnValue(next)
	}

	return (
		<>
			<Popover
				placement={placement}
				autoPlacements={autoPlacements}
				matchTriggerWidth
				content={(close) => (
					<List
						items={options.map((option) => ({ key: option.value, label: option.label }))}
						role="listbox"
						selectedKey={current}
						onPick={pick}
						close={close}
					/>
				)}
			>
				{/* A real button: Enter and Space open it without extra code */}
				<button
					ref={ref}
					id={id}
					type="button"
					disabled={disabled}
					aria-haspopup="listbox"
					aria-label={ariaLabel}
					className={`pg-select ${style.selectTrigger}${className ? ` ${className}` : ''}`}
					style={customStyle}
				>
					<span>{label}</span>
					<span className={`pg-select-arrow ${style.arrow}`} aria-hidden="true">^</span>
				</button>
			</Popover>
			{/* A disabled field isn't submitted, the same as a native <select> */}
			{name && <input type="hidden" name={name} value={current ?? ''} disabled={disabled} />}
		</>
	)
})
