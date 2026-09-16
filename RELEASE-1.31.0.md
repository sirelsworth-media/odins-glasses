# Odin’s Glasses 1.31.0 – Nocturne and faster data startup

Nocturne adds a third, modern dark appearance alongside Classic and Aurora.
It uses deep navy surfaces, violet and cyan accents, high-contrast controls,
and dark cards across all nine areas. The selected appearance persists across
application restarts.

Monster, item, MVP, and skill source data now keep a validated local last-good
copy. A fresh copy is read directly on later starts. An expired copy remains
immediately usable while the application refreshes it in the background. Cache
writes use a temporary file and atomic rename so interrupted updates do not
replace a working data file. Authored monster portraits also use lazy loading
and asynchronous decoding.

The deterministic performance check reads a synthetic catalog of 489 monsters
and 4,584 items from the persistent cache 30 times. The measured P95 is 4.9 ms
on the current Windows x64 test computer. The hidden Electron cold-start result
remains about 15.7 seconds, so process startup still needs separate profiling.

Validation: TypeScript, all unit checks including persistent-cache recovery,
production renderer build, performance check, and the 9-tab Electron UI test
pass. The UI test verifies Classic, Aurora, and Nocturne persistence and checks
Nocturne at 900 and 1360 pixels.
