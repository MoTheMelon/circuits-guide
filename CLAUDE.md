# CLAUDE.md — Circuits Field Guide

Static multi-page site (GitHub Pages). Vanilla JS, no build step, no npm. Every page loads the same scripts as classic `<script>` tags in this order: `engine.js`, `topics.js`, `sims/*.js`, `app.js`. Top-level `const`s are shared across those files, so names must be unique site-wide.

## Common tasks

### Add a topic page
1. Add an entry to `assets/js/topics.js` at the position it should appear: `{"id","g"(group),"t"(title),"s"(icon symbol key from SYM in engine.js),"d"(one-line blurb)}`. Keep it valid JSON inside the array, because `tools/bundle.py` parses it.
2. Copy an existing `topics/*.html`. Change `<title>`, `data-page` on `<body>`, and `data-id` on `<article>`, then replace the article content. Start the content with `<h1>`. The breadcrumb, prev/next links and footer are injected by `app.js`, so don't add them by hand.
3. To add a new script file, add its `<script>` tag to **every** HTML page, `index.html` included, because the bundler reads the order from there.

### Add a simulation
In the right `assets/js/sims/<group>.js`:
```js
sim('my-id', [
  {k:'V', t:'r', l:'Supply', min:0, max:12, step:0.1, v:5, u:'V'},    // slider (log:1 for log scale; f:v=>label to format)
  {k:'mode', t:'seg', l:'Mode', o:[['a','A'],['b','B']], v:'a'},       // segmented buttons (values are strings)
  {k:'on', t:'tog', l:'Enabled', v:true},                              // switch
  {k:'ty', t:'sel', l:'Type', o:[['x','X'],['y','Y']], v:'x'},         // dropdown
  {k:'R', t:'r', l:'R', min:10, max:1e5, log:1, v:1000, u:'Ω', show:st=>st.on}  // conditional control
], (st, mem) => ({
  sch: S(w, h, svgString),           // schematic (optional)
  x: '<div>…</div>',                 // extra HTML under the schematic (optional)
  ro: [['Label', eng(value,'A'), 'ok'|'warn'|'bad'|'']],   // readout tiles
  p: [{x:[0,1], y:[0,5], xlog:0, xl:'x label', yl:'y label', xf, yf,
       s:[{p:[[x,y],…], c:VC, n:'legend', d:'6 4', w:2}],      // series
       vl:[{x, l, c}], hl:[{y, l, c, left, below}], dots:[{x, y, c, l}], h:220}],
  n: 'note under the plots'
}));
```
Then put `<div data-sim="my-id"></div>` in the topic page. `mem` persists between updates; it's used for hysteresis, for example.

### Draw schematics (engine.js)
- `C(type, x1,y1, x2,y2, label, opts)` draws a two-terminal part between two points, leads included. Types are the keys of `BODY`: `R Riec C Cp Cv L D Z SK LED bat bat2 V AC I SW PB F LAMP M LDR TH COIL SOL BUZ XTAL SPK`. Opts: `{flip, ld (label distance), on, col, core}`.
  - Polarity: for `bat`, `V`, `Cp` the **first point is +**. For diodes, the first point is the anode.
  - Labels use `\n` for a second line; the second line renders muted.
- `W([x,y],…)` draws a wire. `F(points, current)` draws an animated current-flow overlay; speed scales with |current|, and a negative value reverses it.
- `Dt` junction dot, `Tm` open terminal, `Gd` ground, `Rl(x,y,label)` supply rail, `T(x,y,text,anchor,class)` text (`nv` red/voltage, `iv` blue/current, `vv` muted).
- Multi-pin parts: `BJT(cx,cy,{p})`, `FET(cx,cy,{p,bd})`, `OA(cx,cy,{swap})`, `ICB(x,y,w,h,title,pins,{ty})`. Their pin coordinates are documented above each function.
- Symbol cards: `<div data-syms="R,C,NMOS"></div>`, with keys from `SYM`.

### Content conventions
- Formulas: `<div class="eqs"><div class="eq"><div class="f">…</div><div class="c">caption</div></div></div>`. Use `<var>` for variables and `<span class="fr"><span>num</span><span>den</span></span>` for fractions.
- Notes: `<div class="tip"><b>Title.</b><p>…</p></div>`. Requirement lists: `<ul class="req"><li><b>Title</b>text</li></ul>`.
- Link to another topic: `<a href="solenoid.html" data-topic="solenoid">`. `app.js` rewrites it for the bundle.
- Phone-friendly tables: `<table class="stack">`.
- Colours are CSS variables: `--v` voltage/red, `--i` current/blue, `--aux` teal, `--warn`. Both light and dark themes must stay readable.

## Check your work
- Open a few pages via `file://` and check the browser console for errors.
- `python3 tools/bundle.py` should run cleanly, and `dist/circuits-guide.html` should route with `#<id>`.
- Simulations use idealized models (square-law MOSFET, Shockley diode, ideal op-amp, 1/d³ magnet field). Keep them physically sane and say so when they simplify.
