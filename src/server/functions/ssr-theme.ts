import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

const storageKey = "vite-ui-theme";

const ThemeSchema = z.union([
  z.literal("dark"),
  z.literal("light"),
  z.literal("system"),
]);

export type Theme = z.infer<typeof ThemeSchema>;

export const getSSRTheme = createServerFn().handler(
  async () => (getCookie(storageKey) || "light") as Theme,
);

export const setSSRTheme = createServerFn({ method: "POST" })
  .inputValidator(ThemeSchema)
  .handler(async ({ data }) => {
    setCookie(storageKey, data);
  });
