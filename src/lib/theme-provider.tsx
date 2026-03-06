import { useRouter } from "@tanstack/react-router";
import { createContext, type PropsWithChildren, useContext } from "react";
import { setSSRTheme, type Theme } from "@/server/functions/ssr-theme";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initState);

type ThemeProviderProps = PropsWithChildren<{
  theme: Theme;
}>;

export function ThemeProvider({
  theme,
  children,
  ...props
}: ThemeProviderProps) {
  const router = useRouter();

  function setTheme(theme: Theme) {
    // Update the theme cookie on the server
    // and invalidate the router to make sure the new theme is rendered server-side
    setSSRTheme({ data: theme }).then(() => router.invalidate());
  }

  return (
    <ThemeProviderContext.Provider {...props} value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
