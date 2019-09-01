export interface PopupTriggerOptions {
    triggerOnFocus?: boolean;
    triggerOnHover?: boolean;
    triggerOnSelect?: boolean;
    closeOnEscape?: boolean;
    delayIn?: number;
    delayOut?: number;
}
export interface PopupTriggerSnapshot {
    active: boolean;
    focused: boolean;
    hovering: boolean;
    selected: boolean;
    close: () => void;
    ref: (element: HTMLElement) => void;
    popupRef: (element: HTMLElement) => void;
}
export declare function usePopupTrigger(options?: PopupTriggerOptions): {
    close: () => void;
    ref: (node: HTMLElement | null) => void;
    popupRef: (node: any) => void;
    active: boolean;
    focused: boolean;
    hovering: boolean;
    selected: boolean;
};
export default usePopupTrigger;
