# Project architecture

- Store initial savings on the personal savings goal, separately from contributions, so an opening balance never becomes a proof-backed deposit.
- Calculate monthly savings from initial savings plus actual completed/late contributions, dividing the residual by months after the latest reference month within the original timeframe (minimum divisor one); mirror the goal trigger in a tested frontend utility and refresh it on contribution changes so saved goals and previews agree.