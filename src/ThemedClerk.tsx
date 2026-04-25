import { ClerkProvider, useAuth } from "@clerk/react";
import { dark } from "@clerk/themes";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import App from "./App.tsx";
import { useTheme } from "./ThemeContext";

type Props = { convex: ConvexReactClient; publishableKey: string };

/**
 * Binds Clerk appearance to app theme; must render inside `ThemeProvider`.
 */
export function ThemedClerk({ convex, publishableKey }: Props) {
  const { theme } = useTheme();
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
