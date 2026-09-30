# Portfolio content outline and review list

Site for **Archish Chugh**, a Risk & Compliance and Investigations professional (EY), aimed at internal audit, risk and forensic roles in the UAE. All facts come from the CV. As requested, **no client names are used**. Each client is described by industry.

Clients are described by industry and type only, for example "bank-led lending consortium", "low-cost carrier" and "national examination and recruitment bodies".

EY (employer) and Vintage Home Fashions (own business) are named.

---

## 1. Site map

| Section | Purpose | Key content |
|---|---|---|
| **Home** (`index.html#home`) | 10-second pitch | Headline "I follow the money until the controls make sense again". Summary. Results table: ₹347 cr, 25%, vendor network shut down, ₹70 L |
| **Focus areas** | Target roles | Internal audit, internal controls, GRC, fraud investigations, each with evidence from engagements |
| **About** | Career story | Founder → Analyst → Senior Analyst. Four highlight figures. Timeline |
| **Case studies** | Proof | 3 case study cards plus "Also delivered" (aviation, public sector, automotive) |
| **Skills & tools** | Fit for UAE roles | Capability bars, tools, frameworks, India→UAE regulator table, CIA in progress |
| **Contact** | Conversion | Email, LinkedIn, links to the PDFs |

## 2. Case study drafts (summary)

### A. Lending consortium fraud investigation (`case-studies/banking-consortium-fraud-investigation.html`)
- **Challenge:** a borrower in insolvency proceedings (IBC/CIRP). The lenders suspected loan money had been diverted to promoter-linked companies.
- **Method, 7 steps:** hypotheses → entity universe (registry research) → one transaction dataset → end-use testing against sanction letters (CEO, CTO and director draws) → trade substance → SEBI and IAS 24 disclosure check → evidence pack.
- **Exhibit:** schematic fund-flow map of 13 entities (borrower, 4 group companies, 5 conduits, 3 end-use entities).
- **Findings:** diversion, undisclosed related parties, fake purchases and billing, circular flows. ₹347 cr exposure analysed.
- **Control weaknesses:** end-use monitoring, related-party identification, trade substance, early-warning signals, board oversight.
- **UAE angle:** CBUAE early-warning and end-use controls, UAE bankruptcy law, trade-based money laundering.

### B. National health insurance risk review (`case-studies/national-health-insurance-audit.html`)
- **Approach, 5 steps:** planning and risk ranking → analytics on the full claims population → fieldwork → root cause → reporting.
- **Exhibits:** planning-stage risk heat map (qualitative) and a 6-stage money trail from enrolment to procurement.
- **Schemes:** ghost patients and dummy registrations, director-linked false billing, undisclosed referral payments to ambulance drivers, procurement kickbacks, shell companies and a fake vendor network (**later shut down**).
- **UAE angle:** DHA and DoH Abu Dhabi health insurance fraud controls, insurer and TPA audit.

### C. Audit analytics & automation (`case-studies/audit-analytics-automation.html`)
- **Problem:** data preparation was using up too much of the fieldwork budget.
- **Exhibits:** 6-node n8n pipeline (trigger → ingest → standardise → reconcile → flag exceptions → Power BI refresh), a star-schema data model, and an indexed bar chart (100 → 75, **25% faster**).
- **Example:** reconciliations for the aviation engagements (counter sales vs agent records, collections vs books).
- **Adoption:** a live pilot, walkthroughs for managers, written notes, and rules improved from feedback.

## 3. Decisions made

- Positioning: internal audit, internal controls, GRC and fraud investigations.
- Recommendations section removed until real, approved quotes are available.
- SQL removed from tools. CIA not mentioned.
- All placeholder figures removed. Only figures from the CV are used.

### Figures added (from your answers)
- Banking: over ₹200 crore identified as diverted. The count of control weaknesses is left out.
- Health insurance: hundreds of suspect claims and ghost-patient registrations flagged
- Analytics: the workflows have been used on 2–3 engagements

## 4. Files

- `index.html`: main site
- `case-studies/*.html`: the 3 case study pages
- `downloads/*.pdf`: PDFs of the case studies, built with `node scripts/build-pdfs.mjs`
- `assets/site.css`, `assets/site.js`: shared styles (including print styles for the PDFs) and behaviour
