export const COMPONENTS = {
    client: { color: "magenta", dark: "cyan", name: "React", shortcut: "r" },
    api: { color: "blue", dark: "white", name: "API", shortcut: "a" },
    core: { color: "cyan", dark: "cyan", name: "Core", shortcut: "c" },
    multiplayer: {
        color: "green",
        dark: "green",
        name: "Multiplayer",
        shortcut: "m",
    },
    files: { color: "yellow", dark: "yellow", name: "Files", shortcut: "f" },
    types: { color: "magenta", dark: "cyan", name: "Types", shortcut: "t" },
    db: {
        color: "gray",
        dark: "white",
        name: "Database",
        shortcut: "d",
        hide: true,
    },
    npm: {
        color: "gray",
        dark: "white",
        name: "npm install",
        shortcut: "n",
        hide: true,
    },
    rust: {
        color: "gray",
        dark: "white",
        name: "rustup upgrade",
        shortcut: "r",
        hide: true,
    },
    postgres: {
        color: "gray",
        dark: "white",
        name: "Postgres",
    },
    redis: {
        color: "gray",
        dark: "white",
        name: "Redis",
    },
};
export const SPACE = "     ";
export const DONE = "✓";
export const BROKEN = "✗";
export const KILLED = "☠";
export const ANIMATE_STATUS = ["◐", "◓", "◑", "◒"];
export const WATCH = "👀";
export const NO_LOGS = "🙈"; // AI picked this awesome character
export const ANIMATION_INTERVAL = 100;
