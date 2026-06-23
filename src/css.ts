export const CSS = `
.layr *, .layr *::before, .layr *::after { box-sizing: border-box; }
.layr {
  position: fixed;
  z-index: 2147483647;
  width: 420px;
  height: 520px;
  background: #1d1f21;
  color: #e2e4e3;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 13px;
  line-height: 1.5;
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0,0,0,.35), 0 0 0 1px #373b41;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.layr__toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  background: #282a2e;
  border-bottom: 1px solid #373b41;
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
}
.layr__toolbar:active { cursor: grabbing; }
.layr__brand {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  font-size: 12px;
  color: #81a2be;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: .01em;
}
.layr__icon { display: block; flex-shrink: 0; }
.layr__filter {
  flex: 1;
  min-width: 0;
  background: #1d1f21;
  color: #e2e4e3;
  border: 1px solid #373b41;
  border-radius: 5px;
  padding: 3px 8px;
  font: inherit;
  font-size: 12px;
  outline: none;
}
.layr__filter:focus { border-color: #81a2be; }
.layr__filter::placeholder { color: #4d5057; }
.layr__count { font-size: 11px; color: #c5c8c6; white-space: nowrap; flex-shrink: 0; }
.layr__btn {
  background: #282a2e;
  color: #969896;
  border: 1px solid #373b41;
  border-radius: 5px;
  padding: 3px 9px;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1.5;
  white-space: nowrap;
}
.layr__btn:hover { background: #373b41; color: #c5c8c6; border-color: #4d5057; }
.layr__btn--close { padding: 3px 7px; font-size: 13px; }
.layr__log {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0;
}
.layr__log::-webkit-scrollbar { width: 6px; }
.layr__log::-webkit-scrollbar-track { background: transparent; }
.layr__log::-webkit-scrollbar-thumb { background: #373b41; border-radius: 3px; }
.layr__entry { border-bottom: 1px solid #282a2e; }
.layr__entry[hidden] { display: none; }
.layr__summary {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding: 6px 10px;
  cursor: pointer;
  list-style: none;
  user-select: none;
  outline: none;
}
.layr__summary::-webkit-details-marker { display: none; }
.layr__summary::marker { content: ''; }
.layr__summary:hover { background: #282a2e; }
.layr__order { color: #969896; font-size: 11px; min-width: 20px; text-align: right; flex-shrink: 0; }
.layr__event { flex: 1; color: #81a2be; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.layr__time { color: #969896; font-size: 11px; white-space: nowrap; flex-shrink: 0; }
.layr__body { padding: 0 10px 8px; position: relative; }
.layr__pre {
  margin: 0;
  padding: 8px 10px;
  background: #282a2e;
  border-radius: 5px;
  overflow: auto;
  max-height: 260px;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 11px;
  border: 1px solid #373b41;
}
.layr__pre::-webkit-scrollbar { width: 4px; height: 4px; }
.layr__pre::-webkit-scrollbar-thumb { background: #373b41; border-radius: 2px; }
.layr__pre code { color: #e2e4e3; font: inherit; white-space: pre; }
.layr__btn--copy { position: absolute; top: 8px; right: 18px; }
.layr mark { background: #81a2be; color: #1d1f21; border-radius: 2px; }
.layr__resize { position: absolute; bottom: 0; right: 0; width: 18px; height: 18px; cursor: nwse-resize; }
.layr__resize::after {
  content: '';
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 7px;
  height: 7px;
  border-right: 2px solid #373b41;
  border-bottom: 2px solid #373b41;
}
`;
