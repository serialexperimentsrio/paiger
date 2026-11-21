import type { ComponentProps, ReactElement } from 'react'
import { Button } from '../Button'
import type { Icon } from '../Icon'
import style from './style.module.css'

export const IconButton = (
	props: ComponentProps<typeof Button> & {
		children: ReactElement<ComponentProps<typeof Icon>>
	}
) => {
	return (
		<Button
			{...props}
			className={`rb-icon-button ${style.button} ${props.className ?? ''}`}
		>
			{props.children}
		</Button>
	)
}
