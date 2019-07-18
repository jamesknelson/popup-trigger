import React from 'react'
import { render, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import usePopupTrigger from '../src/hook'

function TestComponent() {
  let trigger = usePopupTrigger({
    triggerOnFocus: true,
    triggerOnHover: true,
    triggerOnSelect: true,
  })

  return (
    <div data-testid="trigger" ref={trigger.ref}>
      {trigger.active ? 'active' : 'inactive'}
    </div>
  )
}

afterEach(cleanup)

describe('hook', () => {
  test("doesn't break when rendered", async () => {
    let { getByTestId } = render(<TestComponent />)

    expect(getByTestId('trigger')).toHaveTextContent('inactive')
  })

  test('goes active on click', async () => {
    let { getByTestId } = render(<TestComponent />)

    fireEvent.click(getByTestId('trigger'))

    expect(getByTestId('trigger')).toHaveTextContent('active')
  })

  test('goes active on focus', async () => {
    let { getByTestId } = render(<TestComponent />)

    fireEvent.focus(getByTestId('trigger'))

    expect(getByTestId('trigger')).toHaveTextContent('active')
  })
})
