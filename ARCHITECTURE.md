# Architecture

## The four contexts

A Chrome extension is several isolated JavaScript worlds; Layr uses four,
each with its own entry point in `src/`:

```
page (MAIN world)          content-main.ts      sees window.dataLayer, no chrome APIs
  │ window.postMessage
isolated content script    content-isolated.ts  bridges the page to the extension
  │ chrome.runtime.sendMessage
background service worker  background.ts        buffers events per tab, survives nothing
  │ chrome.runtime.Port
side panel                 sidepanel.ts         renders the log for its window's active tab
```

`content-main.ts` patches `dataLayer.push` and relays every push (existing and
new) out of the page. The isolated script forwards them to the background,
which keeps a ring buffer per tab and broadcasts live events to every
connected panel. A panel tracks the active tab of its own window and asks the
background for exactly the buffer it wants.

All message shapes live in `src/protocol/messages.ts` — the single contract
compiled into all four bundles, with type guards at every boundary.

## MV3 realities the design encodes

- **The service worker dies after ~30s idle.** The buffer is persisted to
  `chrome.storage.session` and rehydrated on start; every handler awaits a
  `#ready` gate before touching it.
- **Ports die with the worker.** The panel reconnects on disconnect and
  re-requests the current tab's buffer.
- **Full reloads must clear the log.** The MAIN-world script runs at
  `document_start` on every full (re)load and its NAVIGATE message drops the
  tab's stale buffer.
- **Panels are per-window.** Each panel resolves its own window id once and
  ignores tab activity (and stale messages) from anywhere else.

## Layers

Each layer imports only downward; `chrome` appears only in `platform/chrome/`
and the entry points.

| Layer           | Contents                                                                                |
| --------------- | --------------------------------------------------------------------------------------- |
| `src/protocol/` | Message contract shared by all contexts                                                 |
| `src/core/`     | Pure logic: `Entry`, `Log`, `FilterState`, `EventBuffer`, `DataLayerObserver`, `Signal` |
| `src/platform/` | Browser access behind interfaces: `chrome/` implementations, `mock/` test doubles       |
| `src/app/`      | Orchestration: `BackgroundApp`, `PanelApp`, `PageApp`                                   |
| `src/ui/`       | Views subscribing to core stores: `PanelView`, `EntryView`, `FilterView`                |

Conventions:

- **Constructor assigns, `start()`/`mount()` wires.** No side effects in
  constructors; entries call `new App(platform).start()` synchronously so MV3
  still sees listeners registered on worker startup.
- **State flows one way.** Views subscribe to `Signal`-based stores and emit
  intents (`onClear`, `setQuery`); nothing outside `ui/` touches the DOM,
  nothing inside it mutates a store directly.
- **Entries are composition roots.** They construct a platform, the app, and
  the views, and contain no logic of their own.

## Testing

`core/` is tested as plain functions and classes. `app/` is tested against
the `platform/mock/` doubles — `MockPort` reproduces chrome's port semantics
(disconnect fires on the opposite end, posting on a dead port throws), so
scenarios like worker restart, port reconnect and stale-reset dropping run
entirely in memory. `ui/` is tested with happy-dom. Run with `npm test`.
