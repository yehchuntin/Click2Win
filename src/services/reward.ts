/**
 * Represents reward information.
 */
export interface Reward {
  /**
   * The reward amount.
   */
  amount: number;
}

// --- Mock Global State ---
let MOCK_GLOBAL_CLICK_COUNT = 95; // Start near the first reward for testing
// -----------------------


/**
 * Asynchronously retrieves global click count.
 *
 * @returns A promise that resolves to the global click count.
 */
export async function getGlobalClickCount(): Promise<number> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 20));
  console.log(`Getting global click count: ${MOCK_GLOBAL_CLICK_COUNT}`);
  return MOCK_GLOBAL_CLICK_COUNT;
}

/**
 * Asynchronously increments the global click count.
 */
export async function incrementGlobalClickCount(): Promise<void> {
   // Simulate API delay
   await new Promise(resolve => setTimeout(resolve, 25));
   MOCK_GLOBAL_CLICK_COUNT += 1;
   console.log(`Incremented global click count to: ${MOCK_GLOBAL_CLICK_COUNT}`);
  return;
}

/**
 * Resets the global click count (for testing or specific logic).
 */
export async function resetGlobalClickCount(count: number = 0): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 10));
    MOCK_GLOBAL_CLICK_COUNT = count;
    console.log(`Reset global click count to: ${MOCK_GLOBAL_CLICK_COUNT}`);
    return;
}
