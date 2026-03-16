import {
  useCallback,
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
} from 'react';
import { User } from '../types/user';
import { USERS } from '../consts/users';
import { getCaretCoordinates  } from '../libs/get-caret-coordinates';
import styles from './textarea.module.scss';
import { State } from '../types/state';

const INITIAL_STATE: State = {
  active: false,
  query: '',
  startIndex: -1,
  position: { top: 0, left: 0 },
};

function filterUsers(query: string): User[] {
  const q = query.toLowerCase();
  return USERS.filter(
    (user) =>
      user.username.toLowerCase().includes(q) ||
      user.fullName.toLowerCase().includes(q)
  );
}


export const MentionTextarea = () => {
  const [text, setText] = useState('');
  const [mention, setMention] = useState<State>(INITIAL_STATE);
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const filtered = mention.active ? filterUsers(mention.query) : [];

  const closeMention = useCallback(() => {
    setMention(INITIAL_STATE);
    setActiveIndex(0);
  }, []);

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const cursor = ta.selectionStart;
    const value = ta.value;
    setText(value);

    let atIndex = -1;
    for (let i = cursor - 1; i >= 0; i--) {
      if (value[i] === '@') { atIndex = i; break; }
      if (value[i] === ' ' || value[i] === '\n') break;
    }

    if (atIndex !== -1) {
      const query = value.slice(atIndex + 1, cursor);
      const coords = getCaretCoordinates(ta, atIndex);
      const lineHeight = parseInt(window.getComputedStyle(ta).lineHeight) || 20;

      setMention({
        active: true,
        query,
        startIndex: atIndex,
        position: {
          top:  coords.top  + lineHeight + 4,
          left: coords.left,
        },
      });
      setActiveIndex(0);
    } else {
      closeMention();
    }
  }, [closeMention]);

  const selectUser = useCallback(
    (user: User) => {
      const ta = textareaRef.current;
      if (!ta) return;

      const cursor = ta.selectionStart;
      const before = text.slice(0, mention.startIndex);
      const after = text.slice(cursor);
      const inserted = `@${user.username} `;
      const newText = before + inserted + after;

      setText(newText);
      closeMention();

      requestAnimationFrame(() => {
        const newPos = before.length + inserted.length;
        ta.focus();
        ta.setSelectionRange(newPos, newPos);
      });
    },
    [text, mention.startIndex, closeMention]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!mention.active || filtered.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectUser(filtered[activeIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeMention();
      }
    },
    [mention.active, filtered, activeIndex, selectUser, closeMention]
  );

  useEffect(() => {
    if (!dropdownRef.current) return;
    const items = dropdownRef.current.querySelectorAll('li');
    items[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !textareaRef.current?.contains(e.target as Node)
      ) {
        closeMention();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [closeMention]);

  return (
    <div className={styles.wrapper}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
            setTimeout(closeMention, 150);
          }
        }}
        placeholder="Введите сообщение... используйте @ для упоминания"
        rows={5}
        spellCheck={false}
      />

      {mention.active && filtered.length > 0 && (
        <ul
          ref={dropdownRef}
          className={styles.dropdown}
          style={{ top: mention.position.top, left: mention.position.left }}
          role="listbox"
        >
          {filtered.map((user, idx) => (
            <li
              key={user.id}
              className={`${styles.item} ${idx === activeIndex ? styles.active : ''}`}
              onMouseDown={(e) => { e.preventDefault(); selectUser(user); }}
              onMouseEnter={() => setActiveIndex(idx)}
              role="option"
              aria-selected={idx === activeIndex}
            >
              <span className={styles.avatar}>{user.avatar}</span>
              <span className={styles.info}>
                <span className={styles.name}>{user.fullName}</span>
                <span className={styles.username}>@{user.username}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {mention.active && filtered.length === 0 && (
        <div
          className={styles.empty}
          style={{ top: mention.position.top, left: mention.position.left }}
        >
          Никого не найдено
        </div>
      )}

      <div className={styles.hint}>
        <kbd>↑↓</kbd> навигация&ensp;·&ensp;<kbd>Enter</kbd> выбор&ensp;·&ensp;<kbd>Esc</kbd> закрыть
      </div>
    </div>
  );
};
