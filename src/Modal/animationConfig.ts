import { duration } from '../shared'

export const MODAL_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'
// The modal starts out dark and washed out, and clears as it opens
export const MODAL_FILTER = 'contrast(0.4) brightness(0.35)'

// Opening and closing take --pg-duration-modal. Swapping to another modal
// closes the old one much faster, and neither runs with reduced motion.
export const modalDuration = () => duration('--pg-duration-modal', 400)
export const swapDuration = () => Math.min(50, modalDuration())
