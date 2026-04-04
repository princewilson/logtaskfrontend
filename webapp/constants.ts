export const CLERK_SIGN_IN_FALLBACK_REDIRECT_URL = `http://${window.location.host}/index.html#/home`;
export const CLERK_AFTER_SIGNOUT_URL = `http://${window.location.host}/index.html`;

export let API_BASE_URL = "http://localhost:3000"; // fallback default

export async function initConfig(): Promise<void> {
    try {
        const response = await fetch("config.json");
        const config = await response.json();
        if (config.apiBaseUrl) {
            API_BASE_URL = config.apiBaseUrl;
        }
    } catch {
        console.warn("Could not load config.json, using default API URL.");
    }
}
