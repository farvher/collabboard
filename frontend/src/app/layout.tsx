import type { Metadata } from "next";
import { ToastContainer } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "CollabBoard",
  description: "Collaborative diagramming and mind mapping tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  var dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (dark) document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] transition-theme">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
