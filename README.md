# Archish Chugh Portfolio

Portfolio site for internal audit, internal controls, GRC and fraud investigation roles in the UAE. Live at https://chugharchish-blip.github.io/portfolio/

- `index.html`: home page (core competencies, case studies, experience, skills, contact)
- `case-studies/`: three case study pages
- `downloads/`: PDF versions of the case studies
- `assets/`: styles, scripts, fonts (Manrope, SIL Open Font License) and the link preview image

The site is static and has no build step. To rebuild the PDFs after editing a case study (needs Playwright with Chromium):

```sh
npm i -D playwright && node scripts/build-pdfs.mjs
```

Client names are withheld for confidentiality.
