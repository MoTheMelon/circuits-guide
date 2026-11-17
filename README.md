# Circuits Field Guide

Interactive reference for circuit fundamentals and components: formulas, schematic symbols, and live simulations with sliders, one topic per page.

**Live site: <https://mothemelon.github.io/circuits-guide/>**

Plain static HTML/CSS/JS. No framework, no build step, no dependencies. Open `index.html` in a browser and it works.

## Run locally

Double-click `index.html`, or serve the folder:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Publishing

The site is served by GitHub Pages from the `main` branch, root folder. Every push to `main` redeploys it to <https://mothemelon.github.io/circuits-guide/>, usually within a minute.

`.nojekyll` is included so GitHub serves every file as-is.

## Single-file version

```sh
python3 tools/bundle.py        # writes dist/circuits-guide.html
```

This inlines every page into one HTML file and switches between pages using the URL hash (`#mosfet`). It's handy for sharing one file or publishing as a Claude artifact. `dist/` is generated, so don't edit it by hand.

## Layout

```
index.html                  home page (topic cards are generated from topics.js)
topics/<id>.html            one page per topic, content inside <article class="topic">
assets/css/style.css        all styles (light + dark theme)
assets/js/engine.js         helpers, schematic-symbol library, plotting, simulation framework
assets/js/topics.js         topic list: order, group, title, card icon + blurb
assets/js/sims/*.js         simulations, one file per group
assets/js/app.js            header, menu drawer, home cards, prev/next, routing
tools/bundle.py             builds dist/circuits-guide.html
```

See `CLAUDE.md` for how to add topics and simulations.
