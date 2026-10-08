# Project architecture

- Store initial savings on the personal savings goal, separately from contributions, so an opening balance never becomes a proof-backed deposit.
- Calculate monthly savings in a database trigger and mirror the formula in a tested frontend utility so saved goals and previews agree.