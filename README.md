# Runner Upgrade Prototype

This is a lightweight browser prototype for a runner game where the player collects upgrades, grows stronger, and earns a reward at the finish line. It is designed to quickly validate the gameplay loop before building a full iOS/Android app.

## How to Run

```bash
cd prototype
python -m http.server 8000
```

Then open <http://localhost:8000> in your browser (mobile or desktop).

## Controls

- **Drag** left/right on the canvas (mobile or desktop).
- **Arrow keys** on desktop.
- Collect green upgrades to grow and earn coins.
- Avoid red obstacles to keep your strength above zero.

## Prototype Goals

- Validate the core upgrade runner loop.
- Demonstrate growth/strength feedback.
- Provide a simple end-of-run reward formula.

## Next Steps (when ready)

- Swap placeholder shapes for theme art.
- Introduce cosmetic shop using coins.
- Add ads + reward multipliers.
- Port to a mobile engine (Unity, Godot, Defold).
