import killPort from "kill-port";
import { exec, spawn, } from "node:child_process";
import treeKill from "tree-kill";
import { destroyScreen } from "./terminal.js";
export class Control {
    cli;
    ui;
    quitting = false;
    api;
    types;
    core;
    client;
    multiplayer;
    files;
    db;
    npm;
    rust;
    signals = {};
    status = {
        client: false,
        api: false,
        core: false,
        multiplayer: false,
        files: false,
        types: false,
        db: false,
        npm: false,
        postgres: false,
        redis: false,
    };
    constructor(cli) {
        this.cli = cli;
        this.isRedisRunning().then((running) => {
            this.ui.print("redis", "checking whether redis is running...");
            if (running === "not found") {
                this.status.redis = "killed"; // use killed to indicate that redis-cli was not found
                this.ui.print("redis", "redis-cli not found", "red");
            }
            else if (running === true) {
                this.status.redis = true;
                this.ui.print("redis", "is running", "green");
            }
            else {
                this.status.redis = "error";
                this.ui.print("redis", "is NOT running!", "red");
            }
        });
        this.isPostgresRunning().then((running) => {
            this.ui.print("redis", "checking whether postgres is running...");
            if (running === "not found") {
                this.status.postgres = "killed"; // use killed to indicate that redis-cli was not found
                this.ui.print("postgres", "pg_isready not found", "red");
            }
            else if (running === true) {
                this.status.postgres = true;
                this.ui.print("postgres", "is running", "green");
            }
            else {
                this.status.postgres = "error";
                this.ui.print("postgres", "is NOT running!", "red");
            }
        });
    }
    async quit() {
        if (this.quitting)
            return;
        this.quitting = true;
        this.ui.quit();
        await Promise.all([
            this.kill("api"),
            this.kill("types"),
            this.kill("core"),
            this.kill("client"),
            this.kill("multiplayer"),
            this.kill("files"),
        ]);
        destroyScreen();
        process.exit(0);
    }
    handleResponse(name, data, options, successCallback) {
        const response = data.toString();
        if (Array.isArray(options.success)
            ? options.success.some((s) => response.includes(s))
            : response.includes(options.success)) {
            this.status[name] = true;
            if (successCallback) {
                successCallback();
            }
        }
        else if (Array.isArray(options.error)
            ? options.error.some((s) => response.includes(s))
            : response.includes(options.error)) {
            this.status[name] = "error";
        }
        else if (Array.isArray(options.start)
            ? options.start.some((s) => response.includes(s))
            : response.includes(options.start)) {
            this.status[name] = false;
        }
    }
    async runApi() {
        if (this.quitting)
            return;
        this.status.api = false;
        await this.kill("api");
        try {
            this.ui.print("api", "killing port 8000 to ensure it's really good and dead...");
            await killPort(8000);
            // need to ignore the error if there is no process running on port 8000
        }
        catch (e) { }
        this.ui.print("api");
        this.signals.api = new AbortController();
        this.api = spawn("npm", [
            "run",
            this.cli.options.api ? "start" : "start-no-watch",
            "--workspace=quadratic-api",
        ], { signal: this.signals.api.signal });
        this.ui.printOutput("api", (data) => this.handleResponse("api", data, {
            success: "Server running on port",
            error: "npm ERR!",
            start: "> quadratic-api",
        }));
    }
    async restartApi() {
        this.cli.options.api = !this.cli.options.api;
        this.runApi();
    }
    async runTypes(restart) {
        this.ui.print("types");
        this.status.types = false;
        await this.kill("types");
        if (this.cli.options.skipTypes && !restart) {
            this.runCore();
        }
        else {
            this.types = spawn("npm", ["run", "build:wasm:types"]);
            this.ui.printOutput("types", (data) => {
                this.handleResponse("types", data, {
                    success: "Running ",
                    error: "error:",
                    start: ["Compiling", "> quadratic"],
                });
            });
            this.types.on("exit", () => {
                if (!restart) {
                    this.runCore();
                }
                this.types = undefined;
                this.ui.print("types", "completed.");
            });
        }
    }
    async restartTypes() {
        this.runTypes(true);
    }
    async runClient() {
        if (this.quitting)
            return;
        this.status.client = false;
        this.ui.print("client");
        await this.kill("client");
        this.signals.client = new AbortController();
        // clean the node_modules/.vite directory to avoid client errors
        const clean = exec("rm -rf quadratic-client/node_modules/.vite");
        clean.on("close", () => {
            this.client = spawn("npm", ["start", "--workspace=quadratic-client"], {
                signal: this.signals.client.signal,
            });
            this.ui.printOutput("client", (data) => {
                this.handleResponse("client", data, {
                    success: "Found 0 errors.",
                    error: ["ERROR(", "npm ERR!"],
                    start: "> quadratic-client@",
                });
                if (data.includes("Killed: 9")) {
                    this.ui.print("client", "React failed to run. Trying again...", "red");
                    this.runClient();
                }
            });
        });
    }
    togglePerf() {
        this.cli.options.perf = !this.cli.options.perf;
        this.restartCore();
    }
    async runCore(restart) {
        if (this.quitting)
            return;
        this.status.core = false;
        this.ui.print("core");
        await this.kill("core");
        this.signals.core = new AbortController();
        if (this.cli.options.core) {
            this.core = spawn("npm", [
                "run",
                this.cli.options.perf
                    ? "watch:wasm:perf:javascript"
                    : "watch:wasm:javascript",
            ], { signal: this.signals.core.signal });
            let firstRun = true;
            this.ui.printOutput("core", (data) => this.handleResponse("core", data, {
                success: "[Finished running. Exit status: 0",
                error: "error[",
                start: ["> quadratic", "[Running "],
            }, () => {
                if (!restart && firstRun) {
                    firstRun = false;
                    this.runNpmInstall();
                    if (this.status.multiplayer !== "killed" && !this.multiplayer) {
                        this.runMultiplayer();
                    }
                    else {
                        this.runFiles();
                    }
                }
            }));
        }
        else {
            this.core = spawn("npm", [
                "run",
                this.cli.options.perf
                    ? "build:wasm:perf:javascript"
                    : "build:wasm:javascript",
            ], { signal: this.signals.core.signal });
            this.ui.printOutput("core", (data) => this.handleResponse("core", data, {
                success: "Your wasm pkg is ready to publish",
                error: "error[",
                start: "[Running ",
            }));
            this.core.on("exit", () => {
                if (!restart) {
                    this.core = undefined;
                    this.runNpmInstall();
                    if (this.status.multiplayer !== "killed") {
                        this.runMultiplayer();
                    }
                    else {
                        this.runFiles();
                    }
                }
            });
        }
    }
    kill(name) {
        if (!this[name])
            return;
        this.ui.print(name, "killing...");
        return new Promise((resolve) => {
            this[name].stdout?.pause();
            this[name].stderr?.pause();
            treeKill(this[name].pid, (error) => {
                if (error) {
                    this.ui.print(name, "failed to kill", "red");
                }
                else {
                    this.ui.print(name, "successfully killed");
                    resolve(undefined);
                }
            });
        });
    }
    async killMultiplayer() {
        if (this.status.multiplayer === "killed") {
            this.status.multiplayer = false;
            this.ui.print("multiplayer", "resurrecting...");
            this.runMultiplayer(true);
        }
        else {
            if (this.multiplayer) {
                await this.kill("multiplayer");
                this.ui.print("multiplayer", "killed", "red");
            }
            this.status.multiplayer = "killed";
        }
    }
    async restartCore() {
        this.cli.options.core = !this.cli.options.core;
        this.runCore(true);
    }
    async runMultiplayer(restart) {
        if (this.quitting)
            return;
        if (this.status.multiplayer === "killed")
            return;
        this.status.multiplayer = false;
        await this.kill("multiplayer");
        try {
            this.ui.print("multiplayer", "killing port 3001 to ensure it's really good and dead...");
            await killPort(3001);
            // need to ignore the error if there is no process running on port 3001
        }
        catch (e) { }
        this.signals.multiplayer = new AbortController();
        this.ui.print("multiplayer");
        this.multiplayer = spawn("cargo", this.cli.options.multiplayer ? ["watch", "-x", "'run'"] : ["run"], {
            signal: this.signals.multiplayer.signal,
            cwd: "quadratic-multiplayer",
            env: { ...process.env, RUST_LOG: "info" },
        });
        this.ui.printOutput("multiplayer", (data) => this.handleResponse("multiplayer", data, {
            success: "listening on",
            error: "error[",
            start: "    Compiling",
        }, () => {
            if (!restart) {
                this.runFiles();
            }
        }));
    }
    async restartMultiplayer() {
        this.cli.options.multiplayer = !this.cli.options.multiplayer;
        if (this.multiplayer) {
            this.runMultiplayer(true);
        }
    }
    async runFiles() {
        if (this.quitting)
            return;
        if (this.status.files === "killed")
            return;
        this.status.files = false;
        this.ui.print("files");
        await this.kill("files");
        this.signals.files = new AbortController();
        this.files = spawn("cargo", this.cli.options.files ? ["watch", "-x", "'run'"] : ["run"], {
            signal: this.signals.files.signal,
            cwd: "quadratic-files",
            env: { ...process.env, RUST_LOG: "info" },
        });
        this.ui.printOutput("files", (data) => {
            this.handleResponse("files", data, {
                success: "listening on",
                error: ["error[", "npm ERR!"],
                start: "    Compiling",
            });
        });
    }
    async restartFiles() {
        this.cli.options.files = !this.cli.options.files;
        if (this.files) {
            this.runFiles();
        }
    }
    async killFiles() {
        if (this.status.files === "killed") {
            this.status.files = false;
            this.ui.print("files", "restarting...");
            this.runFiles();
        }
        else {
            if (this.files) {
                await this.kill("files");
                this.ui.print("files", "killed", "red");
            }
            this.status.files = "killed";
        }
    }
    async runDb() {
        if (this.quitting)
            return;
        this.ui.print("db", "checking migration...");
        this.status.db = false;
        await this.kill("db");
        this.db = spawn("npm", [
            "run",
            "prisma:migrate",
            "--workspace=quadratic-api",
        ]);
        this.ui.printOutput("db");
        this.db.once("exit", (code) => {
            if (code === 0) {
                this.ui.print("db", "migration completed");
                this.status.db = true;
            }
            else {
                this.ui.print("db", "failed");
                this.status.db = "error";
            }
            this.runApi();
        });
    }
    runNpmInstall() {
        if (this.quitting)
            return;
        this.ui.print("npm", "installing...");
        this.npm = spawn("npm", ["install"]);
        this.npm.on("close", (code) => {
            if (code === 0) {
                this.ui.print("npm", "installation completed");
                this.status.npm = true;
            }
            else {
                this.ui.print("npm", "installation failed");
                this.status.npm = "error";
            }
            this.runClient();
        });
    }
    runRust() {
        if (this.quitting)
            return;
        this.ui.print("rust", "upgrading...");
        this.rust = spawn("rustup", ["upgrade"]);
        this.rust.on("close", (code) => {
            if (code === 0) {
                this.ui.print("rust", "completed");
                this.status.rust = true;
            }
            else {
                this.ui.print("rust", "failed");
                this.status.rust = "error";
            }
            this.runTypes();
        });
    }
    isRedisRunning() {
        return new Promise((resolve) => {
            if (this.quitting)
                resolve(false);
            const redis = spawn("redis-cli", ["ping"]);
            redis.on("error", (e) => {
                if (e.code === "ENOENT") {
                    resolve("not found");
                }
            });
            redis.on("close", (code) => {
                resolve(code === 0);
            });
        });
    }
    isPostgresRunning() {
        return new Promise((resolve) => {
            if (this.quitting)
                resolve(false);
            const postgres = spawn("pg_isready");
            postgres.on("error", (e) => {
                if (e.code === "ENOENT") {
                    resolve("not found");
                }
            });
            postgres.on("close", (code) => {
                resolve(code === 0);
            });
        });
    }
    async start(ui) {
        exec("rm -rf quadratic-client/src/quadratic-core");
        this.ui = ui;
        this.runRust();
        this.runDb();
    }
}
