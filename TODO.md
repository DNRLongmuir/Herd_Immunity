# Herd Immunity project TODO

This list records the agreed classroom rules and the work needed to bring the application into line with them. The facilitator-led manual game is the primary experience. Auto-play is a separate introductory demonstration and should remain behaviourally unchanged unless a confirmed bug requires discussion.

## 1. Correct the underlying game model

- [ ] Separate a student's identity from their physical grid position.
  - A displayed number identifies the student.
  - Epidemiological state belongs to that student, not to a grid cell.
  - Moving or shuffling a student must move their current state and relevant history with them.
- [ ] Add an explicit record of whether an infected student is still permitted to transmit.
- [ ] Define round-scoped state clearly so a new round gives every student a fresh allocation without altering rewards secured in completed rounds.
- [ ] Preserve the existing manual SIR outcome rules:
  - Successful exposure: susceptible becomes infected.
  - Failed exposure: susceptible becomes immune, keeps their tokens and cannot be challenged again that round.
  - An infected student normally attempts to infect every eligible neighbour and does not recover during the round.
- [ ] Update manual SI behaviour to use the "pass the mask" rule:
  - An infectious student retains transmission permission after a failed attempt.
  - Their first successful transmission consumes that permission.
  - The successfully infected target receives transmission permission.
  - Previously infected students remain visibly infected but cannot transmit again.
- [ ] Decide and document the state of a target after a failed SI attempt before implementing that transition.

## 2. Enforce contacts while preserving facilitator freedom

- [ ] Enforce orthogonal adjacency by default in manual infection mode: up, down, left and right.
- [ ] Clearly indicate which targets are eligible after an infectious source is selected.
- [ ] Add a facilitator override that permits a non-adjacent target for one transmission attempt.
  - Present this as a lightweight exception, not another permanent epidemiological mode.
  - Reset the override after the attempt or when the selected source is cleared.
- [ ] Prevent self-targeting under the baseline adjacency rule.
- [ ] Add optional periodic/infinite boundaries for advanced rounds, connecting top to bottom and left to right.
- [ ] Ensure adjacency checks, highlighting, arrows and exported history all use the same boundary rule.

## 3. Restore student-number randomisation correctly

- [x] Restore a shuffle/randomise-numbers action.
- [x] Preserve each student's state when their number moves to a new position.
- [ ] Preserve any state needed for SI transmission permission when shuffling.
- [ ] Ensure infection history continues to identify the correct students after a shuffle.
- [x] Restrict shuffling to setup/between-round use before infection history exists.
- [ ] Make the current arrangement clear enough for students to locate their new positions quickly.

## 4. Represent rounds and the token economy

- [ ] Add an explicit start/end-round workflow without turning the interface into a collection of rigid modes.
- [ ] Represent the fresh pool of two susceptibility tokens allocated to each student each round.
- [ ] Record infection as the loss of both susceptibility tokens for that round.
- [ ] Record a resisted exposure as immunity for the remainder of the round, with both tokens secured.
- [ ] Represent vaccination as exchanging two susceptibility tokens for one vaccination token.
- [ ] Confirm and document the lolly value of a vaccination token and the exact loss caused by vaccine failure.
- [ ] Keep rewards secured in completed rounds separate from the next round's new token pool.
- [ ] Provide a simple facilitator-facing round summary suitable for allocating lollies.

## 5. Support advanced classroom rules

- [ ] Allow the facilitator to record the die rule used for a round, without automating manual outcomes:
  - Baseline: infection on 1–3; safe on 4–6.
  - High transmissibility: infection on 1–4; safe on 5–6.
- [ ] Support imperfect vaccination in manual play:
  - An exposed vaccinated student may roll.
  - A roll of 1 causes vaccine failure under the described workshop rule.
  - Record the resulting token loss and epidemiological state consistently.
- [ ] Display active round rules clearly but unobtrusively for a projected classroom screen.
- [ ] Leave room for facilitator-created exceptions and narrative variations.
- [ ] Keep observed reproduction-number calculations as a possible later enhancement; do not implement them in the first pass.

## 6. Preserve and clarify auto-play

- [ ] Leave the current auto-play interaction and intended behaviour unchanged:
  - It is an introductory demonstration separate from the manually facilitated game.
  - It seeds one initial infection when necessary.
  - It spreads only through orthogonal neighbours.
  - Each eligible exposure has a 50% infection outcome and a 50% immune/recovered outcome.
- [ ] Isolate auto-play rules from changes to manual SI, manual override, periodic boundaries and advanced-round configuration.
- [ ] Add regression checks confirming manual-game changes do not alter auto-play.

## 7. Repair history, undo, sessions and exports

- [ ] Make event history distinguish a successful infection, resisted exposure, vaccine failure, seeding and facilitator override.
- [ ] Ensure undo reverses exactly one event and restores the corresponding state, transmission permission, token result and time-series entry.
- [ ] Prevent cancelled dialogs from being recorded as failed transmission events.
- [ ] Ensure setup edits and round events cannot desynchronise history from the time series.
- [ ] Decide whether a new named session should begin with a fresh grid, then make the behaviour explicit.
- [ ] Include student identity, position, round rules, token results, vaccine settings and relevant override use in JSON exports.
- [ ] Verify PNG exports correctly show shuffled numbers, states, arrows and periodic-boundary transmissions.
- [ ] Review localStorage data shape and provide a safe migration or fallback if it changes.

## 8. Refresh the classroom interface

- [ ] Reduce reliance on rows of mode buttons and create more visual space around the grid.
- [ ] Keep the interface playful and facilitator-friendly rather than presenting it as a technical simulator dashboard.
- [ ] Make current source, eligible targets and the student holding SI transmission permission visually obvious.
- [ ] Retain large projector-readable text, distinct colours and strong arrow visibility.
- [ ] Check colour contrast and ensure states are distinguishable without colour alone.
- [ ] Make advanced options available without crowding the normal round workflow.
- [ ] Use classroom language consistently: student number, exposure, resisted infection, vaccinated, infected, immune and round.

## 9. Bug-check pass

- [ ] Establish a reproducible baseline by installing locked dependencies and running build, lint and type-check commands.
- [ ] Add focused automated tests for state transitions and contact eligibility before restructuring the interface.
- [ ] Test manual SIR transitions, including multiple infectious neighbours and immune targets.
- [ ] Test the SI "pass the mask" rule, especially repeated failures followed by one success.
- [ ] Test ordinary edges, corners, periodic edges, self-targeting and the one-attempt distance override.
- [ ] Test shuffling on every grid size and verify student state and identity remain paired.
- [ ] Test seeding against susceptible, vaccinated, immune and already infected students; correct unintended eligibility.
- [ ] Test vaccination efficacy behaviour and confirm displayed values match what the application actually enforces or records.
- [ ] Test undo after every event type and after events that do not change state.
- [ ] Test time-series counts against the grid after setup edits, manual attempts, undo, reset, model changes and round changes.
- [ ] Test session creation, multiple games, page reload, localStorage recovery and JSON export.
- [ ] Test rapid clicks, cancelled dialogs, stopping auto-play mid-delay and React Strict Mode for duplicate events.
- [ ] Test PNG export in light and dark themes on 4x4, 5x5 and 6x6 grids.
- [ ] Check keyboard use, focus handling, screen-reader labels and projector-scale layouts.
- [ ] Remove or reconcile unused/superseded code only after behaviour is covered:
  - `TimeSeriesViewer.tsx`
  - the unused canvas exporter path
  - unused state fields and duplicated counting helpers
- [ ] Reconcile the README with the final classroom rules, actual file structure, colours, controls and export behaviour.
- [ ] Add or correct missing project metadata, including the README's reference to an absent licence file.

## Suggested implementation order

1. Document current behaviour with tests and reproduce known history/undo/session bugs.
2. Separate student identity from grid position.
3. Implement adjacency, the one-attempt override and correct shuffling.
4. Implement SI transmission permission and round-scoped state.
5. Add periodic boundaries, advanced-round rules and token accounting.
6. Refresh the interface around the settled workflow.
7. Complete export/session migration, accessibility checks and documentation.
8. Run the full bug-check and classroom rehearsal pass.
