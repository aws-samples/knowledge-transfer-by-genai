import create from "zustand";

type Theme = "dark" | "light" | "system";

type ThemeStore = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const useTheme = create<ThemeStore>((set) => ({
  theme: (localStorage.getItem("vite-ui-theme") as Theme) || "system",
  setTheme: (theme: Theme) => {
    localStorage.setItem("vite-ui-theme", theme);
    set({ theme });

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  },
}));

export default useTheme;
