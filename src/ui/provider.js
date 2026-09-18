// Single AI-provider instance shared across the UI (mock by default; live if env-configured).
import { getProvider } from "../providers";

export const provider = getProvider();
