export function JpShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="[font-family:var(--font-dm-sans),'Noto Sans JP',sans-serif]">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap"
      />
      {children}
    </div>
  );
}
