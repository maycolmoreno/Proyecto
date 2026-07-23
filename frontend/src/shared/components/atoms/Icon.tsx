export type IconName = 'home' | 'gift' | 'help' | 'swap' | 'chat' | 'mail' | 'user' | 'bell' | 'menu' | 'file';

const paths: Record<IconName, JSX.Element> = {
  home: <path d="M3 10.5 12 3l9 7.5M5.25 9.75V21h13.5V9.75M9 21v-6h6v6" />,
  gift: <path d="M20 12v9H4v-9m8 9V8m-9 0h18v4H3V8Zm9 0H7.5a2.5 2.5 0 1 1 4.5-1.5V8Zm0 0h4.5A2.5 2.5 0 1 0 12 6.5V8Z" />,
  help: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5.25v.01M9.75 9a2.25 2.25 0 1 1 3.6 1.8c-.82.62-1.35 1.08-1.35 2.2" />,
  swap: <path d="m7 7-4 4m0 0 4 4m-4-4h14m0-4 4 4m0 0-4 4m4-4H7" />,
  chat: <path d="M7.5 18.75 3 21l1.25-4.38A8 8 0 1 1 7.5 18.75Z" />,
  mail: <path d="M3 6.75h18v12.5H3V6.75Zm0 .5 9 6.5 9-6.5" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" />,
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  file: <path d="M6 3h8l4 4v14H6V3Zm8 0v5h4M9 12h6m-6 4h6" />,
};

export function Icon({ name, className }: { name: IconName; className?: string }): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
