import * as quoteService from "../modules/quotes/quote.service.js";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export function startQuoteRefreshJob() {
  void quoteService.refreshQuote().catch((error) => {
    console.error("Quote refresh failed", error);
  });

  return setInterval(() => {
    void quoteService.refreshQuote().catch((error) => {
      console.error("Quote refresh failed", error);
    });
  }, TWELVE_HOURS_MS);
}
