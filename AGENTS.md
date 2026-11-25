# Project architecture

- Load annual company cash flow in a separate paginated, context-scoped query and aggregate integer cents by reconciliation reference month; this preserves monthly behavior and prevents omitted rows or rounding drift.
- Persist hosted payment-link sessions and correlate provider-verified paid charges with them; confirm access and payment records atomically using a canonical charge key so recurring invoice/order notifications cannot duplicate activation.

- Store initial savings on the personal savings goal, separately from contributions, so an opening balance never becomes a proof-backed deposit.
- Calculate monthly savings from initial savings plus actual completed/late contributions, dividing the residual by months after the latest reference month within the original timeframe (minimum divisor one); mirror the goal trigger in a tested frontend utility and refresh it on contribution changes so saved goals and previews agree.