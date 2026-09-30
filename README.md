# Archish Chugh Portfolio

A static portfolio site for internal audit, risk and forensic roles in the UAE. It has no build step: open `index.html` in a browser, or host the folder on any static host (for example GitHub Pages).

- `index.html`: home, sectors, about, case studies, skills, recommendations, contact
- `case-studies/`: 3 case study pages
- `downloads/`: PDF versions of the case studies
- `docs/content-outline.md`: content outline and the list of items to confirm

To rebuild the PDFs after editing a case study (needs Playwright with Chromium):

```sh
npm i -D playwright && node scripts/build-pdfs.mjs
```

Fonts (IBM Plex, SIL Open Font License) are self-hosted in `assets/fonts`.

Publishing and LinkedIn steps are in `docs/share-on-linkedin.md`.
