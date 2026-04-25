import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import "./index.css";
import { ThemeProvider } from "./ThemeContext";
import { ThemedClerk } from "./ThemedClerk";

const url = import.meta.env.VITE_CONVEX_URL;
if (!url) {
  throw new Error("Set VITE_CONVEX_URL in .env (your Convex URL).");
}
const clerkPublishable = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!clerkPublishable) {
  throw new Error(
    "Set VITE_CLERK_PUBLISHABLE_KEY in .env (Clerk Dashboard → API keys).",
  );
}
if (clerkPublishable.startsWith("sk_")) {
  throw new Error(
    "VITE_CLERK_PUBLISHABLE_KEY is the Secret key (sk_...). Use the Publishable key (pk_test_ or pk_live_) from Clerk → API keys — not the secret.",
  );
}
if (!clerkPublishable.startsWith("pk_")) {
  throw new Error(
    "VITE_CLERK_PUBLISHABLE_KEY should start with pk_ (Clerk → API keys → Publishable key).",
  );
}
const convex = new ConvexReactClient(url);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ThemedClerk convex={convex} publishableKey={clerkPublishable} />
    </ThemeProvider>
  </StrictMode>,
);
