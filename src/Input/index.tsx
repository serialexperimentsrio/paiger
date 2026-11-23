import type { ForwardedRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import style from './style.module.css'

// Every native attribute works as usual. Mark a field invalid with
// aria-invalid, and point aria-describedby at the message that explains it.
export type InputProps = InputHTMLAttributes<HTMLInputElement>
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Input = /* @__PURE__ */ forwardRef(function Input(
	{ className, type = 'text', ...rest }: InputProps,
	ref: ForwardedRef<HTMLInputElement>
) {
	return (
		<input
			{...rest}
			ref={ref}
			type={type}
			className={`pg-input ${style.field}${className ? ` ${className}` : ''}`}
		/>
	)
})

export const Textarea = /* @__PURE__ */ forwardRef(function Textarea(
	{ className, ...rest }: TextareaProps,
	ref: ForwardedRef<HTMLTextAreaElement>
) {
	return (
		<textarea
			{...rest}
			ref={ref}
			className={`pg-textarea ${style.field} ${style.textarea}${className ? ` ${className}` : ''}`}
		/>
	)
})
