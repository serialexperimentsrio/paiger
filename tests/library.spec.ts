import { expect, test } from '@playwright/test'

// Runs against demo/test.html, served by the demo's Vite dev server
test.beforeEach(async ({ page }) => {
	await page.goto('/test.html')
})

test('modal content can read context from the app', async ({ page }) => {
	await page.click('#open-context')
	await expect(page.locator('#context-value')).toHaveText('from the app')
	await expect(page.getByRole('dialog', { name: 'Context' })).toBeVisible()
})

test('modals lock page scroll, close with ×, and give focus back', async ({ page }) => {
	await page.focus('#open-context')
	await page.keyboard.press('Enter')
	await expect(page.getByRole('dialog')).toBeVisible()
	expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden')

	await page.getByRole('button', { name: 'Close' }).click()
	await expect(page.getByRole('dialog')).toHaveCount(0)
	expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('')
	await expect(page.locator('#open-context')).toBeFocused()
})

test('openPreviousModal walks back through every step, and onClose runs once per modal', async ({ page }) => {
	await page.click('#open-steps')
	await page.getByRole('button', { name: 'Next' }).click()
	await expect(page.getByRole('dialog', { name: 'two' })).toBeVisible()
	// Open a third from outside, then go back twice
	await page.evaluate(() => (document.querySelector('#step-three') as HTMLButtonElement).click())
	await expect(page.getByRole('dialog', { name: 'three' })).toBeVisible()
	await page.evaluate(() => (document.querySelector('#back') as HTMLButtonElement).click())
	await expect(page.getByRole('dialog', { name: 'two' })).toBeVisible()
	await page.evaluate(() => (document.querySelector('#back') as HTMLButtonElement).click())
	await expect(page.getByRole('dialog', { name: 'one' })).toBeVisible()

	await page.keyboard.press('Escape')
	await expect(page.getByRole('dialog')).toHaveCount(0)
	// three and two were left by going back; one closed with Escape
	expect(await page.evaluate(() => (window as unknown as { modalExits: string[] }).modalExits)).toEqual([
		'three',
		'two',
		'one'
	])
})

test('Button only submits a form with type="submit"', async ({ page }) => {
	await page.click('#plain')
	await expect(page.locator('#submits')).toHaveText('0')
	await page.click('#submit')
	await expect(page.locator('#submits')).toHaveText('1')
})

test('Select is controlled and submits its value', async ({ page }) => {
	const select = page.getByRole('button', { name: 'Fruit', exact: true })
	await select.click()
	await expect(page.getByRole('listbox')).toBeVisible()
	await expect(page.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true')
	await page.getByRole('option', { name: 'Cherry' }).click()
	await expect(page.locator('#fruit')).toHaveText('cherry')
	await expect(page.locator('input[name="fruit"]')).toHaveValue('cherry')

	await page.click('#reset-fruit')
	await expect(select).toHaveText(/Apple/)
	await expect(page.locator('input[name="fruit"]')).toHaveValue('apple')
})

test('Dropdown is a keyboard menu', async ({ page }) => {
	await page.focus('#menu')
	await page.keyboard.press('Enter')
	await expect(page.getByRole('menu')).toBeVisible()
	await expect(page.getByRole('menuitem', { name: 'Apple' })).toBeFocused()

	await page.keyboard.press('End')
	await expect(page.getByRole('menuitem', { name: 'Cherry' })).toBeFocused()
	await page.keyboard.press('b')
	await expect(page.getByRole('menuitem', { name: 'Banana' })).toBeFocused()
	await page.keyboard.press('Home')
	await expect(page.getByRole('menuitem', { name: 'Apple' })).toBeFocused()

	await page.keyboard.press('Escape')
	await expect(page.getByRole('menu')).toBeHidden()
	await expect(page.locator('#menu')).toBeFocused()
	await expect(page.locator('#menu')).toHaveAttribute('aria-expanded', 'false')
})

test('Popover closes on Escape and returns focus', async ({ page }) => {
	await page.click('#popover')
	await expect(page.locator('#inside')).toBeFocused()
	await page.keyboard.press('Escape')
	await expect(page.locator('#inside')).toBeHidden()
	await expect(page.locator('#popover')).toBeFocused()
})

test('Tooltip shows on keyboard focus and keeps line breaks', async ({ page }) => {
	// Tab in from the control before it, so the focus counts as keyboard focus
	await page.focus('#popover')
	await page.keyboard.press('Tab')
	await expect(page.locator('#tip')).toBeFocused()
	const tooltip = page.getByRole('tooltip')
	await expect(tooltip).toBeVisible()
	await expect(tooltip).toHaveText('Two\nlines')
	await expect(page.locator('#tip')).toHaveAttribute('aria-describedby', /.+/)
})

test('toasts take options, an action and a ×, and can be dismissed by id', async ({ page }) => {
	await page.click('#sticky-toast')
	const sticky = page.locator('.pg-toast', { hasText: 'Sticky' })
	await expect(sticky).toBeVisible()
	await expect(sticky.getByRole('button', { name: 'Undo' })).toBeVisible()
	await expect(sticky.getByRole('button', { name: 'Dismiss' })).toBeVisible()

	await page.click('#dismiss-toast')
	await expect(sticky).toHaveCount(0)

	await page.click('#sticky-toast')
	await page.locator('.pg-toast', { hasText: 'Sticky' }).getByRole('button', { name: 'Undo' }).click()
	await expect(page.locator('.pg-toast', { hasText: 'Undone' })).toBeVisible()
})

test('Panel puts className on its outer element', async ({ page }) => {
	await expect(page.locator('#panel')).toHaveClass(/pg-panel/)
	await expect(page.locator('#panel')).toHaveClass(/outer-class/)
})

test('reduced motion skips the script-driven animations', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' })
	await page.click('#open-context')
	await expect(page.getByRole('dialog')).toBeVisible()
	// CSS animations follow the media query in the stylesheets instead
	const durations = await page.evaluate(() =>
		document
			.getAnimations()
			.filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition))
			.map((a) => (a.effect?.getTiming().duration as number) ?? 0)
	)
	expect(durations.every((d) => d === 0)).toBe(true)
})

test('Escape closes a select inside a modal, not the modal', async ({ page }) => {
	await page.click('#open-select-modal')
	const dialog = page.getByRole('dialog', { name: 'With select' })
	await expect(dialog).toBeVisible()
	await page.getByRole('button', { name: 'Size', exact: true }).click()
	await expect(page.getByRole('listbox')).toBeVisible()

	await page.keyboard.press('Escape')
	await expect(page.getByRole('listbox')).toBeHidden()
	await expect(dialog).toBeVisible()
	await page.keyboard.press('Escape')
	await expect(dialog).toHaveCount(0)
})

test('the modal keeps Tab inside when its last control is a select', async ({ page }) => {
	await page.click('#open-select-modal')
	// First focus skips the select's hidden input
	await expect(page.locator('#modal-first')).toBeFocused()
	await page.getByRole('button', { name: 'Size', exact: true }).focus()
	await page.keyboard.press('Tab')
	await expect(page.locator('#modal-first')).toBeFocused()
})

test('a toast that stays until dismissed still stays after a hover', async ({ page }) => {
	await page.click('#sticky-toast')
	const sticky = page.locator('.pg-toast', { hasText: 'Sticky' })
	await sticky.hover()
	await page.mouse.move(0, 0)
	await page.waitForTimeout(2200)
	await expect(sticky).toBeVisible()
})

test('a tooltip stays inside the window near its left edge', async ({ page }) => {
	await page.hover('#edge-tip')
	const tooltip = page.getByRole('tooltip', { name: /far wider/ })
	await expect(tooltip).toBeVisible()
	await expect.poll(async () => (await tooltip.boundingBox())?.x).toBeGreaterThanOrEqual(0)
})

test('a tooltip inside a popover shows above it', async ({ page }) => {
	await page.click('#popover')
	await page.hover('#inside')
	const tooltip = page.getByRole('tooltip', { name: 'Above the popover' })
	await expect(tooltip).toBeVisible()
	// Both are in the top layer, and the tooltip went in last
	expect(await tooltip.evaluate((el) => el.matches(':popover-open'))).toBe(true)
})

test('Box content does not stack above the rest of the page', async ({ page }) => {
	const box = page.locator('#panel .pg-panel-box')
	expect(await box.evaluate((el) => getComputedStyle(el).isolation)).toBe('isolate')
	expect(await box.locator('p').evaluate((el) => getComputedStyle(el).zIndex)).toBe('auto')
})

test('onOpenChange only reports real changes', async ({ page }) => {
	await expect(page.locator('#open-changes')).toHaveText('')
	await page.click('#popover')
	await expect(page.locator('#open-changes')).toHaveText('true')
	await page.keyboard.press('Escape')
	await expect(page.locator('#open-changes')).toHaveText('true,false')
})

test('typing a space mid-search jumps instead of picking', async ({ page }) => {
	await page.focus('#cities')
	await page.keyboard.press('Enter')
	await expect(page.getByRole('menuitem', { name: 'New Delhi' })).toBeFocused()
	await page.keyboard.type('new y')
	await expect(page.getByRole('menuitem', { name: 'New York' })).toBeFocused()
	await expect(page.getByRole('menu')).toBeVisible()
})

test('a tooltip flips to the other side when there is no room', async ({ page }) => {
	await page.hover('#flip-tip')
	const tooltip = page.getByRole('tooltip', { name: 'Flips below' })
	await expect(tooltip).toBeVisible()
	const trigger = await page.locator('#flip-tip').boundingBox()
	await expect.poll(async () => (await tooltip.boundingBox())?.y).toBeGreaterThan(trigger!.y + trigger!.height)
})

test('popover content only exists while it is open', async ({ page }) => {
	await expect(page.locator('#inside')).toHaveCount(0)
	await page.click('#popover')
	await expect(page.locator('#inside')).toBeVisible()
	await page.keyboard.press('Escape')
	await expect(page.locator('#inside')).toHaveCount(0)
})

test('a controlled popover follows open and asks through onOpenChange', async ({ page }) => {
	const content = page.locator('#controlled-content')
	await expect(content).toHaveCount(0)
	await page.click('#controlled-toggle')
	await expect(content).toBeVisible()
	await page.keyboard.press('Escape')
	await expect(content).toHaveCount(0)
	await page.click('#controlled')
	await expect(content).toBeVisible()
})

test('Select takes an id for its label, and disabled', async ({ page }) => {
	await expect(page.getByLabel('Shirt size')).toBeDisabled()
})

test('labels from the provider replace the built-in text', async ({ page }) => {
	await expect(page.getByRole('status', { name: 'Laden' })).toHaveCount(1)
})

test('a tinted icon takes the text colour', async ({ page }) => {
	const icon = page.getByRole('img', { name: 'Heart' })
	expect(await icon.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 0, 0)')
})

test('the page behind a modal is inert until it closes', async ({ page }) => {
	const behind = () => page.evaluate(() => document.querySelector('#open-context')!.closest('[inert]') !== null)
	await page.click('#open-context')
	await expect(page.getByRole('dialog')).toBeVisible()
	expect(await behind()).toBe(true)
	await page.keyboard.press('Escape')
	await expect(page.getByRole('dialog')).toHaveCount(0)
	expect(await behind()).toBe(false)
	await expect(page.locator('#open-context')).toBeFocused()
})

test('toasts are in the top layer, above open popovers', async ({ page }) => {
	await page.click('#popover')
	await page.click('#sticky-toast')
	const stack = page.locator('.pg-toast-container')
	expect(await stack.evaluate((el) => el.matches(':popover-open'))).toBe(true)
})

test('a pinned tooltip stays by its trigger when that is off screen', async ({ page }) => {
	// Clicked from script, so the page doesn't scroll the trigger into view
	await page.evaluate(() => (document.querySelector('#pin-far') as HTMLButtonElement).click())
	const tooltip = page.getByRole('tooltip', { name: 'Far below' })
	await expect(tooltip).toBeAttached()
	await page.waitForTimeout(400)
	const viewport = page.viewportSize()!
	expect((await tooltip.boundingBox())!.y).toBeGreaterThan(viewport.height)
})

test('error toasts are announced as alerts', async ({ page }) => {
	await page.click('#error-toast')
	await expect(page.getByRole('alert')).toHaveText('It broke')
})

test('Escape hides a hovered tooltip', async ({ page }) => {
	await page.hover('#tip')
	const tooltip = page.getByRole('tooltip', { name: /Two/ })
	await expect(tooltip).toBeVisible()
	await page.keyboard.press('Escape')
	await expect(tooltip).toHaveCount(0)
})

test('a modal keeps the Box corner icon in its place', async ({ page }) => {
	await page.click('#open-icon-modal')
	const modal = page.getByRole('dialog', { name: 'With icon' })
	await expect(modal).toBeVisible()
	await page.waitForTimeout(600)
	const box = (await modal.boundingBox())!
	const icon = (await modal.locator('.pg-box-icon').boundingBox())!
	// Box puts it towards the right, not in the middle like the content
	expect(icon.x + icon.width / 2).toBeGreaterThan(box.x + box.width * 0.55)
})

test.describe('on a touch screen', () => {
	test.use({ hasTouch: true })

	test('tapping a trigger does not open its tooltip', async ({ page }) => {
		await page.tap('#tip')
		await page.waitForTimeout(400)
		await expect(page.getByRole('tooltip', { name: /Two/ })).toHaveCount(0)
	})
})

test('Input and Textarea pass native attributes through', async ({ page }) => {
	const input = page.getByLabel('Email', { exact: true })
	await expect(input).toHaveAttribute('type', 'email')
	await expect(input).toHaveAttribute('aria-invalid', 'true')
	await expect(input).toHaveValue('ada@')
	await expect(page.getByLabel('Notes')).toHaveAttribute('rows', '3')
})

test('Checkbox shows the mixed state and toggles from its label', async ({ page }) => {
	const box = page.getByRole('checkbox', { name: 'All' })
	expect(await box.evaluate((el) => (el as HTMLInputElement).indeterminate)).toBe(true)
	await page.getByText('All', { exact: true }).click()
	await expect(box).toBeChecked()
	expect(await box.evaluate((el) => (el as HTMLInputElement).indeterminate)).toBe(false)
})

test('radios with one name move with the arrow keys', async ({ page }) => {
	await page.getByRole('radio', { name: 'Small' }).focus()
	await page.keyboard.press('ArrowDown')
	await expect(page.getByRole('radio', { name: 'Large' })).toBeChecked()
	await expect(page.getByRole('radio', { name: 'Large' })).toBeFocused()
})

test('Switch is announced as a switch and toggles with Space', async ({ page }) => {
	const toggle = page.getByRole('switch', { name: 'Wi-Fi' })
	await expect(toggle).not.toBeChecked()
	await toggle.click()
	await expect(toggle).toBeChecked()
	await page.keyboard.press('Space')
	await expect(toggle).not.toBeChecked()
})

test('Tabs follow the keyboard pattern and skip disabled tabs', async ({ page }) => {
	const list = page.getByRole('tablist', { name: 'Sections' })
	const alpha = list.getByRole('tab', { name: 'Alpha' })
	const gamma = list.getByRole('tab', { name: 'Gamma' })
	await expect(alpha).toHaveAttribute('aria-selected', 'true')
	await expect(page.getByRole('tabpanel', { name: 'Alpha' })).toHaveText('First panel')

	await alpha.focus()
	await page.keyboard.press('ArrowRight')
	await expect(gamma).toBeFocused()
	await expect(gamma).toHaveAttribute('aria-selected', 'true')
	await expect(page.getByRole('tabpanel', { name: 'Gamma' })).toHaveText('Third panel')

	// Wraps round, and Home and End jump to the ends
	await page.keyboard.press('ArrowRight')
	await expect(alpha).toBeFocused()
	await page.keyboard.press('End')
	await expect(gamma).toBeFocused()
	await page.keyboard.press('Home')
	await expect(alpha).toBeFocused()

	// Only the selected tab is in the Tab order, then the panel
	await page.keyboard.press('Tab')
	await expect(page.getByRole('tabpanel')).toBeFocused()
})
