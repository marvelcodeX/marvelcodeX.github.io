# Niveditha Jayakumar — Portfolio

Personal portfolio of Niveditha Jayakumar, an Information Science and Engineering student who builds AI and cybersecurity tools and writes about technology.

**Live site:** https://marvelcodeX.github.io

## The idea

The site is a library card-catalogue drawer, in burgundy and cream.

- The landing page is a closed folder with tabs: About, Projects, Writing, Resume, GitHub and Contact.
- On screens 900px and wider, a tab pulls its section forward as a card. A tab rail sits above it, always in the same order: About, Projects, Writing, Skills, Exploring, Journey, Contact.
- On phones, and when JavaScript is off, the same sections are an ordinary scrolling page.
- Every section has a deep link (`#writing`, `#journey` and so on) that works in both modes.

## Features

- **Folder hero** with tabs that rise on hover, lift on click and drop in on load. The folder tilts slightly toward the pointer.
- **Drawer navigation** on wide screens. The left and right arrow keys flip between cards, Esc closes the drawer, a thin line on the rail shows scroll progress, and the browser tab title follows the open card.
- **Project shelf**, a horizontally scrolling tray of five projects, each with stack, status, source link and a preview dialog with a real screenshot.
- **Skills index** that can be filtered by project.
- **Journey** as a curved route with perspective cards that light up as you scroll.
- **About** as a terminal window.
- **Light and dark mode.** It follows the system setting, with a toggle in the header that remembers your choice.
- **Accessible by default:** keyboard focus rings, skip link, reduced-motion support, semantic landmarks, and a live region that announces card changes.
- **Link previews and share icons:** favicon, touch icon and a 1200×630 social card.

## Built with

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies.

Fonts come from Google Fonts:
- Spectral for titles
- Atkinson Hyperlegible Next for reading
- Courier Prime for typed catalogue fields
- Covered By Your Grace for the handwritten word

## Run it locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly also works, but a local server is closer to how GitHub Pages serves it.

## Project structure

```
.
├── index.html            the page
├── css/styles.css        all styling: tokens, folder, drawer, sections, dark mode
├── js/main.js            theme, folder tabs and drawer, project shelf, previews, journey route
├── images/
│   ├── projects/         project screenshots used in the previews
│   └── favicon, touch icon and social card
├── Niveditha_Resume.pdf
└── README.md
```

## Deploying

The repository is served by GitHub Pages from the `main` branch root. There is nothing to build. Push to `main` and the site updates within a minute or two. The social card and canonical URL in `index.html` point at `https://marvelcodeX.github.io/`.

## Usage notice

This is a personal project and reflects my own work and design decisions. While you're welcome to explore and take inspiration, please do not copy, reproduce or reuse the code or design directly without permission.
