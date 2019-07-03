const { useCallback, useState, useEffect, useMemo, useRef } = require('react')
const PopupTrigger = require('./PopupTrigger')

// Debounce nulling out the popup container to get around issues caused by
// other badly handling refs, and causing `null` refs to be passed in.
const UnsetPopupDebounce = 500

function usePopupTrigger(options = {}) {
  let triggerRef = useRef()
  if (!triggerRef.current) {
    triggerRef.current = new PopupTrigger(options)
  }
  let trigger = triggerRef.current

  let [state, setState] = useState(trigger.getState())

  let debounceRef = useRef()

  useEffect(() => {
    trigger.subscribe(setState)
    return () => trigger.dispose()
  }, [trigger])

  let popupRef = useCallback(
    node => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }

      if (node !== null) {
        trigger.setPopupNode(node)
      } else {
        debounceRef.current = setTimeout(() => {
          trigger.setPopupNode(null)
        }, UnsetPopupDebounce)
      }
    },
    [trigger],
  )

  return useMemo(
    function() {
      return {
        ...state,
        close: trigger.close,
        ref: trigger.setTriggerNode,
        popupRef: popupRef,
      }
    },
    [state, trigger, popupRef],
  )
}

module.exports = usePopupTrigger
