# Step 1 Execution Plan

## Scope

Implement only the minimum flow slice:

1. Project switch
2. World switch
3. RawPour capture
4. Wake-up re-entry

## Acceptance Criteria

- User can identify project switch area in <= 10 seconds.
- User can switch to a world in <= 2 interactions.
- User can paste a long unprocessed block and save it.
- Wake note updates after drop and is visible without extra navigation.
- Data remains after refresh (local persistence).

## Test Script (Manual)

1. Open app at `http://127.0.0.1:5181/`.
2. Switch between Project A and Project E.
3. In Project E, switch to another world charm.
4. Paste a long mixed paragraph into tray.
5. Set mode `RawPour`, zone `Pocket`, click `Drop now`.
6. Verify item appears in scoped drop list.
7. Verify wake note reflects latest touch and next motion.
8. Refresh the page and verify the new drop still exists.

## Out of Scope

- AI auto-classification
- integration with existing app
- auth, sync, collaboration
