# popup-trigger

**A utility for triggering and closing popups.**

Work
s great for tooltips, popup menus, dropdown selects, etc.

Available in two flavors:

- [React Hook](#react-hook)
- [Vanilla JS](#vanilla-js)


How it works
------------

Whenever the trigger is focused, hovered over or selected, `trigger.active` will become true. It will then stay true until the user moves the cursor or focus out of the trigger *and* out of the container.


React Hook
----------

```js
import usePopupTrigger from 'popup-trigger/hook'

function MyComponent() {
  let trigger = usePopupTrigger({
    hover: true,  // Popup on hover
    focus: true,  // Popup on focus
    select: true, // Popup on touch/click the trigger,
                  // or on enter/spacebar while the trigger is focused.
  })

  return (
    <>
      <button ref={trigger.ref}>Trigger!</button>
      {
        trigger.active &&
        <div ref={trigger.popupRef}>
          <a href="https://frontarm.com"></a>
        </div>
      }
    </>
  )
}
```

Combine with [react-popper](http://npmjs.com/package/react-popper) and [portals](https://reactjs.org/docs/portals.html) for all your popup needs!


Vanilla JS
----------

```js
import PopupTrigger from 'popup-trigger'

let trigger = new PopupTrigger({
  hover: true,  // Popup on hover
  focus: true,  // Popup on focus
  select: true, // Popup on touch/click the trigger,
                // or on enter/spacebar while the trigger is focused.
})

trigger.setTriggerNode(/* ... */)
trigger.setPopupNode(/* ... */)

trigger.getState() // { active, focused, hovering, selected }
trigger.subscribe(({ active, focused, hovering, selected ) => {})
trigger.dispose() // Clean up afterwards

trigger.close() // Close the popup imperatively
```
