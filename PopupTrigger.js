// Give delay by default, so that there's time for something within
// the popup to focus after the trigger has been blurred.
const DefaultDelays = {
  in: 10,
  out: 50,
}

class PopupTrigger {
  constructor({
    triggerOnFocus,
    triggerOnHover,
    triggerOnSelect = true,
    closeOnEscape = true,
    delayIn = DefaultDelays.in,
    delayOut = DefaultDelays.out,
  } = {}) {
    this.options = {
      focus: triggerOnFocus,
      hover: triggerOnHover,
      select: triggerOnSelect,
      closeOnEscape,
      delayIn,
      delayOut,
    }

    this._reducerState = {
      selected: false,
      triggerFocusCount: 0,
      popupFocusCount: 0,
      triggerHoverCount: 0,
      popupHoverCount: 0,
    }

    this._timeouts = {
      trigger: {},
      popup: {},
    }
    this.clearTriggerTimeouts()
    this.clearPopupTimeouts()

    this._listeners = []

    this.close = this.close.bind(this)
    this.setTriggerNode = this.setTriggerNode.bind(this)
    this.setPopupNode = this.setPopupNode.bind(this)

    this.handleTriggerTouch = this.handleTriggerTouch.bind(this)
    this.handleTriggerKeyDown = this.handleTriggerKeyDown.bind(this)
    this.handleWindowInteraction = this.handleWindowInteraction.bind(this)
    this.handleWindowKeyDown = this.handleWindowKeyDown.bind(this)

    this.handleTriggerFocusOut = () => this.handleOut('trigger', 'focus')
    this.handleTriggerHoverOut = () => this.handleOut('trigger', 'hover')
    this.handlePopupFocusOut = () => this.handleOut('popup', 'focus')
    this.handlePopupHoverOut = () => this.handleOut('popup', 'hover')

    this.handleTriggerFocusIn = () => this.handleIn('trigger', 'focus')
    this.handleTriggerHoverIn = () => this.handleIn('trigger', 'hover')
    this.handlePopupFocusIn = () => this.handleIn('popup', 'focus')
    this.handlePopupHoverIn = () => this.handleIn('popup', 'hover')
  }

  close() {
    this.clearTriggerTimeouts()
    this.clearPopupTimeouts()

    if (this.triggerNode && document.activeElement === this.triggerNode) {
      this.triggerNode.blur()
    }

    this.dispatch({ type: 'close' })
  }

  setTriggerNode(node) {
    if (node !== this.triggerNode) {
      this.teardownTrigger()
      this.triggerNode = node
      if (node) {
        this.setupTrigger()
      }
      this.dispatch({
        type: 'change_trigger',
        triggerHasFocus: node && document.activeElement === node,
      })
    } else if (!node) {
      this.teardownTrigger()
    }
  }

  setPopupNode(node) {
    if (node !== this.popupNode) {
      this.teardownPopup()
      this.popupNode = node
      this.dispatch({ type: 'change_popup' })

      // Only set up events once the popup becomes active
      if (node && this.getState().active) {
        this.setupPopup()
      }
    } else if (!node) {
      this.teardownPopup()
    }
  }

  dispose() {
    this.teardownPopup()
    this.teardownTrigger()
    this.clearPopupTimeouts()
    this.clearTriggerTimeouts()
  }

  subscribe(listener) {
    this._listeners.push(listener)
    return () => {
      let index = this._listeners.indexOf(listener)
      if (index !== -1) {
        this._listeners.splice(index, 1)
      }
    }
  }

  getState() {
    let state = this._reducerState
    let focusCount = state.triggerFocusCount + state.popupFocusCount
    let hoverCount = state.triggerHoverCount + state.popupHoverCount

    return {
      active:
        hoverCount > 0 ||
        (focusCount > 0 && this.options.focus) ||
        state.selected,
      focused: focusCount > 0,
      hovering: hoverCount > 0,
      selected: !!state.selected,
    }
  }

  // ---

  dispatch(action) {
    let oldState = this.getState()
    let newReducerState = reducer(this._reducerState, action)
    if (newReducerState !== this._reducerState) {
      this._reducerState = newReducerState
      let newState = this.getState()

      // Setup/teardown the popup if it's just been added
      if (newState.active && !oldState.active) {
        this.setupPopup()
      } else if (!newState.active && oldState.active) {
        this.teardownPopup()
      }

      // Only notify changes that matter
      if (
        newState.active !== oldState.active ||
        newState.focused !== oldState.focused ||
        newState.hovering !== oldState.hovering ||
        newState.selected !== oldState.selected
      ) {
        this._listeners.forEach(listener => listener(newState))
      }
    }
  }

  setupTrigger() {
    let node = this.triggerNode

    // Make sure that there's a tabIndex so that
    // the trigger can receive focus.
    if (this.options.focus && !node.tabIndex && node.tabIndex !== 0) {
      node.tabIndex = 0
    }

    if (this.options.select) {
      node.addEventListener('click', this.handleTriggerTouch, false)
      node.addEventListener('touchend', this.handleTriggerTouch, false)
      node.addEventListener('keydown', this.handleTriggerKeyDown, false)
    }

    if (this.options.focus) {
      node.addEventListener('focusin', this.handleTriggerFocusIn, false)
      node.addEventListener('focusout', this.handleTriggerFocusOut, false)
    }

    if (this.options.hover) {
      node.addEventListener('mouseenter', this.handleTriggerHoverIn, false)
      node.addEventListener('mouseleave', this.handleTriggerHoverOut, false)
    }
  }

  teardownTrigger() {
    let node = this.triggerNode
    if (node) {
      if (this.options.select) {
        node.removeEventListener('click', this.handleTriggerTouch, false)
        node.removeEventListener('touchend', this.handleTriggerTouch, false)
        node.removeEventListener('keydown', this.handleTriggerKeyDown, false)
      }

      if (this.options.focus) {
        node.removeEventListener('focusin', this.handleTriggerFocusIn, false)
        node.removeEventListener('focusout', this.handleTriggerFocusOut, false)
      }

      if (this.options.hover) {
        node.removeEventListener('mouseenter', this.handleTriggerHoverIn, false)
        node.removeEventListener(
          'mouseleave',
          this.handleTriggerHoverOut,
          false,
        )
      }

      this.triggerNode = undefined
    }
  }

  setupPopup() {
    let node = this.popupNode
    if (node) {
      if (this.options.select) {
        window.addEventListener('focusin', this.handleWindowInteraction, false)
        window.addEventListener('keydown', this.handleWindowKeyDown, false)
        window.addEventListener('click', this.handleWindowInteraction, false)
        window.addEventListener('touchend', this.handleWindowInteraction, false)
      }

      if (this.options.focus) {
        node.addEventListener('focusin', this.handlePopupFocusIn, false)
        node.addEventListener('focusout', this.handlePopupFocusOut, false)
      }

      if (this.options.hover) {
        node.addEventListener('mouseenter', this.handlePopupHoverIn, false)
        node.addEventListener('mouseleave', this.handlePopupHoverOut, false)
      }
    }
  }

  teardownPopup() {
    let node = this.popupNode
    if (node) {
      if (this.options.select) {
        window.removeEventListener(
          'focusin',
          this.handleWindowInteraction,
          false,
        )
        window.removeEventListener('keydown', this.handleWindowKeyDown, false)
        window.removeEventListener('click', this.handleWindowInteraction, false)
        window.removeEventListener(
          'touchend',
          this.handleWindowInteraction,
          false,
        )
      }

      if (this.options.focus) {
        node.removeEventListener('focusin', this.handlePopupFocusIn, false)
        node.removeEventListener('focusout', this.handlePopupFocusOut, false)
      }

      if (this.options.hover) {
        node.removeEventListener('mouseenter', this.handlePopupHoverIn, false)
        node.removeEventListener('mouseleave', this.handlePopupHoverOut, false)
      }

      this.popupNode = undefined
    }
  }

  handleTriggerTouch() {
    this.dispatch({
      type: 'select',
    })
  }

  handleTriggerKeyDown(event) {
    let form = getForm(event.target)
    if (
      event.key === ' ' ||
      event.key === 'Spacebar' ||
      (!form && event.key === 'Enter')
    ) {
      this.dispatch({
        type: 'select',
      })
    }
  }

  handleIn(property, trigger) {
    let timeouts = this._timeouts[property][trigger]
    let afterDelay = () => {
      timeouts.in = undefined
      if (timeouts.out !== undefined) {
        clearTimeout(timeouts.out)
      }
      this.dispatch({
        type: `${trigger}_${property}`,
        direction: 'in',
      })
    }

    // We never want to delay handling a movement of focus into the popup
    // itself, as it could cause the trigger to close during the transition.
    if (this.options.delayIn === 0 || property === 'popup') {
      afterDelay()
    } else {
      timeouts.in = setTimeout(afterDelay, this.options.delayIn)
    }
  }

  handleOut(property, trigger) {
    let timeouts = this._timeouts[property][trigger]
    let afterDelay = () => {
      timeouts.out = undefined
      this.dispatch({
        type: `${trigger}_${property}`,
        direction: 'out',
      })
    }
    if (timeouts.in !== undefined) {
      // If focus is lost before the in timeout completes, then cancel
      // immediately.
      clearTimeout(timeouts.in)
    } else {
      timeouts.out = setTimeout(afterDelay, this.options.delayOut)
    }
  }

  handleWindowKeyDown(event) {
    if (event.key === 'Escape' && this.options.closeOnEscape) {
      this.dispatch({
        type: 'close',
      })
    }
  }
  handleWindowInteraction(event) {
    let node = event.target
    if (
      !(
        (this.popupNode && this.popupNode.contains(node)) ||
        (this.triggerNode && this.triggerNode.contains(node))
      )
    ) {
      this.dispatch({
        type: 'close',
      })
    }
  }

  clearTriggerTimeouts() {
    let { focus = {}, hover = {} } = this._timeouts.trigger
    this.clearTimeouts(focus, hover)
    this._timeouts.trigger = { focus: {}, hover: {} }
  }
  clearPopupTimeouts() {
    let { focus = {}, hover = {} } = this._timeouts.popup
    this.clearTimeouts(focus, hover)
    this._timeouts.popup = { focus: {}, hover: {} }
  }
  clearTimeouts(focus, hover) {
    if (focus.in !== undefined) {
      clearTimeout(focus.in)
    }
    if (focus.out !== undefined) {
      clearTimeout(focus.out)
    }
    if (hover.in !== undefined) {
      clearTimeout(hover.in)
    }
    if (hover.out !== undefined) {
      clearTimeout(hover.out)
    }
  }
}

function getForm(node) {
  while (node) {
    if (node.type === 'form') {
      return node
    }
    node = node.parentNode
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'change_trigger':
      return {
        triggerFocusCount: action.triggerHasFocus ? 1 : 0,
        selected: action.triggerHasFocus ? state.selected : false,
        triggerHoverCount: 0,
        popupFocusCount: 0,
        popupHoverCount: 0,
      }

    case 'change_popup':
      return {
        ...state,
        popupFocusCount: 0,
        popupHoverCount: 0,
      }

    case 'select':
      return {
        ...state,
        selected: true,
      }

    case 'close':
      return {
        selected: false,
        triggerFocusCount: 0,
        triggerHoverCount: 0,
        popupFocusCount: 0,
        popupHoverCount: 0,
      }

    case 'focus_trigger':
      return {
        ...state,
        selected: !action.deselect && state.selected,
        triggerFocusCount: Math.max(
          0,
          state.triggerFocusCount + (action.direction === 'in' ? 1 : -1),
        ),
      }

    case 'focus_popup':
      return {
        ...state,
        selected: !action.deselect && state.selected,
        popupFocusCount: Math.max(
          0,
          state.popupFocusCount + (action.direction === 'in' ? 1 : -1),
        ),
      }

    case 'hover_trigger':
      return {
        ...state,
        triggerHoverCount: Math.max(
          0,
          state.triggerHoverCount + (action.direction === 'in' ? 1 : -1),
        ),
      }

    case 'hover_popup':
      return {
        ...state,
        popupHoverCount: Math.max(
          0,
          state.popupHoverCount + (action.direction === 'in' ? 1 : -1),
        ),
      }

    default:
      return state
  }
}

module.exports = PopupTrigger
module.exports.DefaultDelays = DefaultDelays
module.exports.PopupTrigger = PopupTrigger
