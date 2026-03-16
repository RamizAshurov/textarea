export const getCaretCoordinates = (
  textarea: HTMLTextAreaElement,
  position: number
): { top: number; left: number } => {
  const mirror = document.createElement('div');
  const style = window.getComputedStyle(textarea);

  const props: (keyof CSSStyleDeclaration)[] = [
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight',
    'letterSpacing', 'paddingTop', 'paddingRight',
    'paddingBottom', 'paddingLeft', 'borderTopWidth',
    'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'boxSizing', 'whiteSpace', 'wordBreak', 'overflowWrap',
  ];

  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.top = '-9999px';
  mirror.style.left = '-9999px';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordBreak = 'break-word';
  mirror.style.width = textarea.clientWidth + 'px';
  mirror.style.pointerEvents = 'none';

  props.forEach((p) => {
    mirror.style[p as any] = style[p as any];
  });

  document.body.appendChild(mirror);

  const before = document.createTextNode(textarea.value.substring(0, position));
  const caret = document.createElement('span');
  caret.textContent = '|';
  mirror.appendChild(before);
  mirror.appendChild(caret);

  const rect       = textarea.getBoundingClientRect();
  const caretRect  = caret.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();

  document.body.removeChild(mirror);

  return {
    top:  caretRect.top  - mirrorRect.top  + rect.top  - textarea.scrollTop,
    left: caretRect.left - mirrorRect.left + rect.left,
  };
}