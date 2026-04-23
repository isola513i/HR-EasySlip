type State = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerConfig {
  failureThreshold: number;
  cooldownMs: number;
}

export class CircuitBreaker {
  private state: State = "CLOSED";
  private consecutiveFailures = 0;
  private openedAt: number | null = null;

  constructor(private config: CircuitBreakerConfig) {}

  isOpen(): boolean {
    if (this.state === "CLOSED") return false;

    if (this.state === "OPEN" && this.openedAt) {
      // Check if cooldown has expired → transition to HALF_OPEN
      if (Date.now() - this.openedAt > this.config.cooldownMs) {
        this.state = "HALF_OPEN";
        return false; // allow one request through
      }
    }

    // OPEN and not yet cooled down
    if (this.state === "OPEN") return true;

    // HALF_OPEN: allow request through
    return false;
  }

  onSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = "CLOSED";
    this.openedAt = null;
  }

  onFailure(): void {
    this.consecutiveFailures++;

    if (this.state === "HALF_OPEN") {
      // Test request failed → back to OPEN, reset timer
      this.state = "OPEN";
      this.openedAt = Date.now();
      return;
    }

    if (this.consecutiveFailures >= this.config.failureThreshold) {
      this.state = "OPEN";
      this.openedAt = Date.now();
    }
  }
}

export const resendCircuit = new CircuitBreaker({
  failureThreshold: 5,
  cooldownMs: 5 * 60_000,
});
