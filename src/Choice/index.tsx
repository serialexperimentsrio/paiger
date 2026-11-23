import type { ForwardedRef, InputHTMLAttributes, ReactNode } from 'react'
import { forwardRef, useEffect, useRef } from 'react'
import { setRef } from '../shared'
import style from './style.module.css'

// Checkbox, Radio and Switch are native inputs, restyled. Forms, labels,
// keyboard (Space, and arrow keys between radios of one name) and screen
// readers all work as they do for plain inputs.
//
// The children are the label: the wrapping <label> makes all of it clickable.
// className and style go on that <label>; every other prop and the ref go on
// the <input>.
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
	children?: ReactNode
	// The "some of them" state, e.g. for a "select all" box. Screen readers
	// announce it as mixed.
	indeterminate?: boolean
}

export type RadioProps = Omit<CheckboxProps, 'indeterminate'>
export type SwitchProps = Omit<CheckboxProps, 'indeterminate'>

type Kind = 'checkbox' | 'radio' | 'switch'

function choice(kind: Kind, name: string) {
	const Choice = forwardRef(function Choice(
		{ children, indeterminate, className, style: customStyle, ...rest }: CheckboxProps,
		ref: ForwardedRef<HTMLInputElement>
	) {
		const input = useRef<HTMLInputElement | null>(null)

		// Only exists as a DOM property, not an attribute
		useEffect(() => {
			if (input.current) input.current.indeterminate = Boolean(indeterminate)
		}, [indeterminate])

		return (
			<label
				className={`pg-${kind} ${style.choice}${className ? ` ${className}` : ''}`}
				style={customStyle}
			>
				<input
					{...rest}
					ref={(node) => {
						input.current = node
						setRef(ref, node)
					}}
					type={kind === 'radio' ? 'radio' : 'checkbox'}
					// A switch is a checkbox that says on and off instead of checked
					role={kind === 'switch' ? 'switch' : undefined}
					className={`pg-${kind}-input ${style.control} ${style[kind]}`}
				/>
				{children != null && <span className={`pg-${kind}-label`}>{children}</span>}
			</label>
		)
	})
	Choice.displayName = name
	return Choice
}

export const Checkbox = /* @__PURE__ */ choice('checkbox', 'Checkbox')
export const Radio = /* @__PURE__ */ choice('radio', 'Radio') as React.ForwardRefExoticComponent<
	RadioProps & React.RefAttributes<HTMLInputElement>
>
export const Switch = /* @__PURE__ */ choice('switch', 'Switch') as React.ForwardRefExoticComponent<
	SwitchProps & React.RefAttributes<HTMLInputElement>
>
