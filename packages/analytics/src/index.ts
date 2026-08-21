/**
 * Placeholder wrapper around a privacy-friendly analytics provider
 * (Plausible or PostHog — not decided yet). No implementation, just the
 * shape every tool page will eventually call into.
 */
export interface Analytics {
  track(eventName: string, props?: Record<string, unknown>): void;
}

export const analytics: Analytics = {
  track(eventName, props) {
    void eventName;
    void props;
    // no-op until a provider is wired up
  },
};
