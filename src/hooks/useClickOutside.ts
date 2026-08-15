import { useEffect, RefObject } from "react";

/**
 * Fires `callback` when a pointer event occurs outside the element
 * referenced by `ref`. Attach `ref` to the container you want to guard
 * (e.g. a dropdown panel, an accordion wrapper, a modal panel).
 *
 * @param ref - RefObject pointing at the element to watch.
 * @param callback - Invoked when a mousedown/touchstart happens outside `ref.current`.
 * @param enabled - Optional flag to conditionally attach the listener
 *                  (e.g. only while a dropdown is open). Defaults to true.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  callback: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;

      const target = event.target as Node;
      if (!el.contains(target)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, callback, enabled]);
}