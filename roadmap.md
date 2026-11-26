# Annual cash flow

- [x] Add an annual view with reconciled months in columns and preserved centers, subgroups, and categories.
- [x] Verify annual totals, hierarchy, category filters and CSV export with five calculation tests and desktop/mobile browser fixtures; keep monthly rendering separate and unchanged.
- [ ] Verify the annual flow with a real signed-in account (blocked by external unmanaged authentication).

# Checkout audit — paused by user

- [ ] Resume checkout configuration and live-payment verification only when the user requests it.

# Savings goals

- [x] Recalculate remaining monthly installments after actual contributions, including extra deposits and deletions.
- [x] Test extra deposits, repeated deposits in one month, and completed targets (15 tests passed).
- [x] Store initial saved amount and calculate the monthly remainder.
- [x] Add the field and include initial savings in progress and totals.
- [x] Run calculation tests and verify the database calculation definition.
- [ ] Verify authenticated creation through the UI (blocked by external unmanaged authentication).
# Banco do Brasil statement

- [x] Read the Banco do Brasil statement using Lançamento for description and Valor for amount, identifying rows by date, time and document number.
- [x] Leave out BB Rende Fácil movements and every "Saldo" line (Saldo Anterior, Saldo do dia) so the balance is not duplicated.
- [ ] Verify the filtered import through the reconciliation screen with a real account.
