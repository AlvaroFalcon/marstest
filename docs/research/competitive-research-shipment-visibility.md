# Competitive Research: Shipment Visibility Platforms

## 1. Executive summary

The problem described is a well-established software category. Gartner calls it **Real-Time Transportation Visibility Platforms (RTTVP)**: tools that give location and status insight on orders once they leave the warehouse. The market is mature, and the leading vendors have converged on the same answers to the brief's domain challenges.

Key takeaways:

1. **Normalisation is the foundation, not a feature.** Every serious vendor ingests heterogeneous carrier data (API, EDI, telematics, web crawling, email) and maps it to a small, closed set of standardised milestones. Vizion, for example, reduces 7,000+ raw carrier events to roughly 60–75 standard milestones aligned with the DCSA standard.
2. **Predictive ETA is the core AI use case.** All vendors run ML models on top of carrier data, historical lane performance, AIS vessel positions, weather and port congestion. The best ones show the predicted ETA *alongside* the carrier ETA, never instead of it, and some (Shippeo) even contractually guarantee accuracy.
3. **Management by exception is the operations UX.** The ops view is a prioritised list of shipments at risk (delays, holds, stale data, demurrage), not a full table of all shipments.
4. **Data trust is made visible.** Terminal49's "freshness indicator" (green / yellow / red per container, with manual refresh) is a direct answer to the brief's "stale" and "reliability" requirements.
5. **2025–2026 trend: from visibility to AI agents.** project44, FourKites, Shippeo, Transporeon/Trimble, Flexport and Shipsy have all launched AI agents that resolve exceptions, chase carriers by email or voice, and draft customer updates, with human-in-the-loop controls for consequential actions.
6. **Customer self-service is usually a shareable tracking link or embeddable widget,** scoped strictly to that customer's own shipments.

## 2. Market context

- Gartner defines the RTTVP market as platforms providing real-time location and status of orders after they have left the warehouse. The most recent Magic Quadrant found in this research was published on 24 February 2025; a 2026 edition was not found.
- Vendors evaluated in the 2025 Critical Capabilities report include FourKites, Overhaul, project44, Shippeo, Transporeon and Trucker Tools. The 2024 edition also covered Blume Global and IntelliTrans.
- project44 states it has been a Leader for five consecutive years, placing highest on both axes. Shippeo was named a Leader in 2024 and 2025.
- Gartner's critical capabilities include modal coverage, data quality, usability, integration tooling and carrier networks. **Data quality and carrier network size are the real competitive moats**, which is why vendors talk so much about their networks.

## 3. Vendor overview

| Vendor | Type | Modes | Distinctive approach | Relevance to the brief |
| --- | --- | --- | --- | --- |
| project44 | Enterprise RTTVP / "Decision Intelligence Platform" | All | Multi-agent orchestration; AI voice and messaging agents for carriers | AI agents resolving exceptions; data cleaning |
| FourKites | Enterprise RTTVP / "Intelligent Control Tower" | Road, rail, ocean, air, parcel | Digital twins + named AI "digital workers" (Tracy, Sam) | Track-and-trace agent answering inquiries |
| Shippeo | European RTTVP | FTL, LTL, ocean, parcel | Guaranteed ETA accuracy; combined road + ocean ETA | **Closest match** (European, multimodal, industrial shippers) |
| Transporeon (Trimble) | Transport platform + Visibility Hub | Road, ocean, air | AI ETA; Trimble Arc Agent with human-in-the-loop | Natural-language actions with audit trail |
| Descartes MacroPoint | Road-centric RTTVP | Multimodal, truck focus | Large carrier network; predictive ETA with traffic, weather, driver hours | Manage-by-exception, carrier scorecards |
| Wakeo | European (French) RTTVP | Sea, air, road, rail, parcel | Overseas specialist; AIS-trained route prediction; reliability scores | **Very close match** (industrial shippers like Air Liquide) |
| Portcast | Ocean specialist | Ocean | ML ETA predicting delays 48–72h ahead; explains the reason for delay | Explainable predictions |
| Vizion | Ocean tracking API | Ocean | 7,000+ events → ~75 DCSA-aligned milestones | Normalisation model reference |
| Terminal49 | Ocean / terminal API + dashboard | Ocean, terminal, rail | Holds, fees, last free day; freshness trust indicator | Customs holds; stale-data UX |
| Flexport | Digital forwarder | All | MCP server for customer AI agents; AI HTS code suggestion + broker validation | AI in customs with human validation |
| Raft | AI for forwarders | n/a (documents) | Email and document extraction, human-in-the-loop | Document ingestion from email |

## 4. Vendor profiles

### 4.1 project44

- **Positioning:** Rebranded its Movement platform as a "Decision Intelligence Platform" organised in layers: Connect, See, Act, Automate.
- **Data ingestion:** API-first with "hard" APIs (direct carrier integrations) and "soft" APIs (AI voice and messaging agents that contact carriers who have no API). AI agents clean, structure and harmonise incoming data.
- **AI agents:** October 2025 launch of Multi-Agent Orchestration, with specialised agents that detect problems, fix data quality and automate workflows; the company reports up to 30% improvement in carrier data quality. In April 2026 it launched a portfolio of agents covering procurement, disruption response and carrier onboarding. Each agent's "skill" combines a narrow task, validated data and a semantic layer explaining what the data means.
- **Collaboration:** Agents can involve stakeholders by email without them needing platform access; the company claims 40%+ faster resolution.
- **Takeaway for us:** Agents should be narrow and task-specific, grounded in validated data. Pulling external parties in via email (no login) is a strong pattern for the "contact the operator" action.

### 4.2 FourKites

- **Positioning:** Launched an "Intelligent Control Tower" in January 2025 combining real-time visibility, continuously updated digital twins (orders, shipments, inventory, assets) and a digital workforce of AI agents.
- **AI agents:** "Tracy" (track and trace) answers shipment inquiries, mitigates exceptions and keeps data accurate across systems; "Sam" handles supplier collaboration. FourKites claims these automate up to 80% of routine tasks. Unilever is a cited co-development customer.
- **Scale:** Network of 1.1M+ carriers; around 3.2M supply chain events per day used for agent training.
- **Takeaway for us:** The "answer shipment inquiries automatically" agent maps directly to the brief's customer objective of knowing status *without calling anyone*.

### 4.3 Shippeo

- **Positioning:** Paris-based multimodal visibility leader, a Gartner Leader in 2024 and 2025. Customers include many European industrial groups (Renault, Saint-Gobain, Siemens Energy, AkzoNobel). It is a visibility layer that sits beside a TMS, not a TMS itself.
- **Data ingestion:** Integrates with 1,000+ TMS, telematics and ELD systems; uses EDI, API and web crawling for ocean milestones. A free driver mobile app fills gaps when a carrier has no API or telematics.
- **Normalisation:** Standardised milestones down to SKU and handling-unit level.
- **Predictive ETA:** Proprietary ML ETA, with contractual guarantees on accuracy (road up to 24h before delivery, ocean up to 30 days before discharge), as well as on onboarding speed and tracking rates. Offers a **combined road and ocean ETA** for multi-leg shipments, which is exactly the brief's road → port → vessel → port → road scenario.
- **UX:** Colour-coded map of at-risk deliveries, saved filtered views, and **shareable tracking links** for stakeholders without a Shippeo account.
- **AI:** Launched "Shippeo AI", a library of agents. One of the first is a "talk to my data" agent that helps users understand data quality issues such as incomplete tracking. It uses a "workflow-backed agents" design that combines AI flexibility with structured processes for reliability.
- **Takeaway for us:** The single best reference. Combined multimodal ETA, guaranteed data quality, shareable links for customers, and AI that explains *data gaps* rather than hiding them.

### 4.4 Transporeon (Trimble)

- **Positioning:** Transport platform with 158,000 carriers and 1,400+ shippers; its Visibility Hub covers road, ocean and air with AI-generated ETAs.
- **Data control:** Carriers manage data sharing permissions through the Trimble Trust Center; visibility can extend to subcontractors.
- **AI:** Trimble Arc Agent (launched August 2026) lets users retrieve, update and act on transport data through natural language, with enterprise guardrails, **human-in-the-loop confirmation** for sensitive tasks and explainable, auditable decisions.
- **Takeaway for us:** A good model for how to present AI actions: show the proposal, require confirmation, keep an audit trail.

### 4.5 Descartes MacroPoint

- **Positioning:** Road-centric visibility platform for shippers, brokers and 3PLs; long-standing pioneer of B2B truck tracking (acquired by Descartes for $107M).
- **Approach:** Replace manual "check calls" with automated tracking; manage by exception by automatically flagging loads needing attention; automated carrier scorecards.
- **Predictive ETA:** Accounts for truck-specific routing, estimated driver hours of service, weather and traffic. Geofence alerts.
- **Takeaway for us:** Carrier performance scorecards are a useful secondary feature for ops (which operator is reliable on which lane).

### 4.6 Wakeo

- **Positioning:** French SaaS (founded 2016) specialised in overseas multimodal flows for industrial shippers and forwarders (Air Liquide, Faurecia, Gefco). Explicitly markets moving the supply chain "from reactive to predictive" and managing by exception.
- **Approach:** Consolidates all transport providers into one platform; ML-based predictive ETAs with alerts to ops teams. "Trusted Routes" provides reliability scoring and disruption alerts. Uses satellite and historical AIS data (via Spire Maritime) to train route prediction and detect route deviations.
- **Coverage claims:** 97% of shipping lines, 94% road, 97% airlines, 98% parcel. Road depth was strengthened through the Veroo acquisition.
- **Integration:** API and webhooks push standardised ETA and tracking updates into TMS/ERP.
- **Caveat (from third-party review):** ETA accuracy still depends on upstream carrier data quality.
- **Takeaway for us:** Nearly identical target customer to the brief. Reliability scores per route are a nice touch for showing confidence.

### 4.7 Portcast

- **Positioning:** Ocean freight specialist with predictive ETAs, exception alerts and an "AI-powered command center".
- **Predictive ETA:** ML combining AIS, carrier EDI and historical port performance; claims to predict delays 48–72 hours before carriers report them, and ETAs typically about 30% better than carrier ETAs even 2–4 weeks out. Uses 70+ data sources.
- **Explainability:** The system detects risks **and explains the main reason for the delay** (weather, congestion, strikes) so teams can communicate proactively.
- **Exceptions:** Alerts for delays, rollovers and detention/demurrage.
- **Takeaway for us:** Always show *why* an ETA changed, not just the new date. This is the cleanest pattern for "distinguish confirmed data from estimation".

### 4.8 Vizion

- **Positioning:** Ocean container tracking API for teams embedding tracking in their own systems (plus a lightweight "BoxTrack" app).
- **Normalisation:** Collects events via API, EDI, AIS and crawling, then translates 7,000+ unique carrier events into about 60–75 standardised milestones codified to DCSA guidance. Changelogs show ongoing per-carrier standardisation work (holds, gate in/out, discharge).
- **Delivery:** Push-based webhooks; track by container, bill of lading or booking number.
- **Takeaway for us:** Concrete evidence that a **closed milestone catalogue** with a raw → normalised mapping is the industry pattern. Our prototype should show both.

### 4.9 Terminal49

- **Positioning:** Container visibility and risk management for importers, forwarders and brokers (North America focus; ocean, terminal and rail only).
- **Normalisation:** Collects and normalises events from terminals, carriers and ports into a consistent data model; 30+ webhook event types; timestamps in UTC with the IANA timezone.
- **Customs and holds:** Shows active holds (customs, freight, USDA, line and others) and fees, plus the last free day before demurrage. A "Containers at risk" view lists what needs action.
- **Freshness Trust Indicator:** Each container shows a coloured freshness icon and timestamp; red means no update for more than 12 hours. Users can trigger a manual refresh from the indicator.
- **Customer portal:** Embeddable widget that resolves only shipments already tracked in the account (strict scoping).
- **Takeaway for us:** The freshness indicator is the most direct, copyable answer to the brief's "stale" status and reliability challenge.

### 4.10 Flexport

- **Positioning:** Digital freight forwarder with its own platform.
- **AI:** Launched a Model Context Protocol (MCP) server so customers' own AI assistants can track shipments, surface exceptions and customs holds, search rates and book freight. Requests are handled by Flexport's internal agents (reported at 21M tasks per year). Agents read booking emails and update vessel changes, while **human experts handle exceptions**.
- **Customs AI:** Suggests HTS tariff codes in seconds, which customers can then send to a licensed customs broker for validation.
- **Disruption layer:** An AI-curated feed that monitors news for events that may affect shipments.
- **Takeaway for us:** AI proposes, human validates, especially in customs. A news/disruption feed is a possible future feature.

### 4.11 Raft (formerly Vector.ai)

- **Positioning:** AI automation platform for freight forwarders and customs brokers.
- **Approach:** Ingests emails and attachments (PDF, Excel, Word, images) and extracts structured data from bills of lading, invoices and certificates; validates it against master data, identifies missing data, and shows a preview before submission. Integrates with existing TMS/ERP (e.g. CargoWise).
- **Human-in-the-loop:** Explicitly positioned as human-centric; the CEO acknowledges that exception handling and disputes still need human judgement.
- **Takeaway for us:** The brief says tracking today lives in "email and phone calls". Email/document ingestion with AI extraction is the production answer for operators without APIs.

## 5. Industry standard: DCSA Track & Trace

- The Digital Container Shipping Association (Maersk, MSC, Hapag-Lloyd and others) defines a common language for container visibility events.
- Version 2.2 (current public version) has three entities with their own events: **Shipment** events (booking, transport document), **Transport** events (vessel, barge, truck and rail arrivals and departures) and **Equipment** events (container load, discharge, gate in/out). Example codes: LOAD, DEPA, ARRI, DISC.
- Version 3.0.0 (published 30 September 2026) adds IoT and reefer events and clearer handling of corrected or withdrawn events. Public release is planned for the second half of 2027.
- Practical advice from industry commentators: store both the time an event *occurred* and the time it was *received*, and decide which reference (booking, container, BL) to match on.
- **Takeaway for us:** Base the normalised status model on DCSA concepts for the sea legs, and keep a "corrected event" concept in the data model.

## 6. Solution patterns mapped to the brief

| Brief challenge | Pattern used in the market | Who does it |
| --- | --- | --- |
| Heterogeneous operators and status vocabularies | Raw event stored + mapped to a closed catalogue of standard milestones; per-carrier mapping rules; AI to clean and harmonise | Vizion, Terminal49, project44, Shippeo |
| Operators without APIs | Driver mobile app; AI voice/email agents; email and document extraction | Shippeo, project44, Raft |
| Multimodal and international | Shipment split into legs; combined road + ocean ETA; customs holds as first-class status | Shippeo, Wakeo, Terminal49 |
| Multi-site | Filtered/saved views per site; data sharing permissions per party | Shippeo, Transporeon |
| Freshness / real time | Webhooks when available, polling otherwise; freshness indicator per shipment; manual refresh | Terminal49, Vizion |
| Reliability: never invent | Show carrier ETA vs predicted ETA; explain reason for delay; contractual accuracy guarantees; human confirmation for actions | Portcast, Shippeo, Transporeon |
| Customer self-service | Shareable tracking links and embeddable widgets scoped to the customer's shipments; proactive alerts | Shippeo, Terminal49 |
| Ops: manage by exception | At-risk lists, colour-coded maps, risk alerts (delay, hold, LFD, stale) | MacroPoint, Terminal49, Portcast |
| Ops: propose next action | AI agents that draft emails, chase carriers, answer inquiries, with approval steps | project44, FourKites, Transporeon, Flexport |

## 7. Implications for the prototype

What to borrow, roughly in order of value for the 8-hour test:

1. **Raw vs normalised event view** (Vizion/Terminal49 pattern) to demonstrate normalisation explicitly.
2. **Two ETAs side by side**: "Carrier ETA (confirmed)" and "Predicted ETA (estimated, confidence X)" with a one-line reason for any change (Portcast pattern).
3. **Freshness indicator** on every shipment card and row (Terminal49 pattern).
4. **Combined multimodal timeline** by leg, with customs as an explicit stage (Shippeo/Terminal49).
5. **Exception inbox** ordered by impact, with a recommended action and a draft the user approves (project44/FourKites/Transporeon pattern, human-in-the-loop).
6. **Shareable read-only tracking link** for the customer role (Shippeo pattern).
7. **"Contact operator" by email without platform access** as the action type (project44 pattern).

What to mention only in the write-up (out of prototype scope): carrier scorecards, disruption news feed, document extraction from email, MCP/agent API access, emissions tracking.

Differentiation angle for the write-up: the big platforms are built for global enterprises with huge carrier networks. A tailored internal tool for one manufacturer can win on **fit**: its own sites, its own ERP orders, its own customer communications, and a simpler, more honest UI about data confidence.

## 8. Limitations of this research

- Based on public vendor websites, press releases, analyst abstracts and third-party directories; most performance figures (accuracy, % automated, time saved) are **vendor claims** and were not independently verified.
- The full Gartner reports are paywalled; only abstracts and vendor-published summaries were used.
- No hands-on product trials were performed.

## Sources

- [Gartner – Magic Quadrant for RTTVP (24 Feb 2025)](https://www.gartner.com/doc/6204087)
- [Gartner – Critical Capabilities for RTTVP (2025)](https://www.gartner.com/doc/6204287)
- [Gartner – Magic Quadrant for RTTVP (2024)](https://www.gartner.com/en/documents/5298863)
- [Gartner Peer Insights – RTTVP market definition](https://www.gartner.com/reviews/market/real-time-transportation-visibility-platforms/compare/descartes-macropoint-vs-transporeon)
- [project44 – Gartner Leader page](https://project44.com/?p=62363)
- [project44 – AI agent portfolio at decision44 (Apr 2026)](https://www.project44.com/press-releases/project44-launches-ai-agent-portfolio-at-decision44-built-on-a-decade-of-context-skills-and-orchestration/)
- [project44 – Multi-Agent Orchestration (Oct 2025)](https://www.project44.com/?p=73357)
- [project44 – Q3 growth and AI agents](https://www.project44.com/press-releases/project44-accelerates-growth-with-40-increase-in-new-arr-in-q3-now-achieving-operational-cash-flow-breakeven/)
- [project44 – FY26 results and context-fueled AI](https://www.project44.com/?p=76429)
- [FreightWaves – project44 Movement Decision Intelligence](https://www.freightwaves.com/?p=537068)
- [SDCExec – project44 Decision Intelligence layers](https://www.sdcexec.com/software-technology/supply-chain-visibility/news/22943344/project44-project44-launches-decision-intelligence-to-help-companies-efficiently-automate-supply-chains)
- [Sacra – FourKites profile](https://sacra.com/research/fourkites)
- [BusinessWire – FourKites Intelligent Control Tower (Jan 2025)](https://www.businesswire.com/news/home/20250115083404/en)
- [FBJ – FourKites digital workers Tracy and Sam](https://fbj-online.com/?p=51606)
- [Toolradar – FourKites overview](https://toolradar.com/logo/fourkites)
- [Shippeo – Multimodal visibility network](https://www.shippeo.com/en/network/multimodal-visibility-network)
- [Shippeo – Shipper visibility and predictive ETA](https://www.shippeo.com/solutions/shippers-visibility)
- [Shippeo – Real-time tracking](https://www.shippeo.com/visibility/real-time-visibility)
- [Built In Chicago – Shippeo company profile](https://www.builtinchicago.org/company/shippeo)
- [DC Velocity – Shippeo ETA accuracy and guarantees](https://dcvelocity.com/articles/54460-shippeo-s-shipment-tracking-eta-accuracy-leaps-forward-with-a-giant-32-improvement)
- [BusinessWire – Shippeo Gartner Leader 2025](https://www.businesswire.com/news/home/20250227846230/en/Shippeo-Named-a-Leader-in-the-2025-Gartner-Magic-Quadrant-for-Real-Time-Transportation-Visibility-Platforms-for-Second-Consecutive-Year)
- [Theodo – Shippeo AI agents case study](https://www.theodo.com/en-fr/client-stories/shippeo-agents-ia-trajectoire-agent-as-a-service)
- [European Purpose – Shippeo overview](https://europeanpurpose.com/tool/shippeo)
- [Transporeon – Home and AI solutions](https://transporeon.com/)
- [Transporeon – Visibility Hub](https://www.transporeon.com/discover-transporeon-visibility-hub)
- [IT Supply Chain – Transporeon agent-ready portfolio and Trimble Arc Agent](https://itsupplychain.com/transporeon-unveils-agent-ready-portfolio-to-turn-manual-logistics-into-connected-autonomous-workflows/)
- [Trimble – Freight Visibility 2026 brochure](https://transportation.trimble.com/_default_upload_bucket/brochure/Brochure%20Overview/pdfs/Freight-Visibility_2026_solution-overview.pdf)
- [SAP Store – Descartes MacroPoint](https://www.sap.com/korea/products/scm/partners/the-descartes-systems-group-inc-descartes-macropoint.html)
- [DC Velocity – Descartes acquires MacroPoint](https://www.dcvelocity.com/articles/29087-descartes-acquires-macropoint-to-expand-role-in-truck-visibility-market)
- [Euro-Stack – Wakeo](https://euro-stack.com/solutions/wakeo)
- [Spire Maritime – Wakeo case study](https://spire.com/?p=15649)
- [RFP.wiki – Wakeo review](https://www.rfp.wiki/vendors/wakeo)
- [Wakeo – Series A announcement](https://wakeo.co/blog/wakeo-announces-11-million-in-series-a-funding-led-by-promus-ventures-and-360-capital)
- [Portcast – Ocean freight visibility](https://www.portcast.io/ocean-freight-visibility)
- [Portcast – Predictive visibility](https://www.portcast.io/predictive-visibility)
- [Siemens Xcelerator – Portcast listing](https://www.siemens.com/en-gb/products/portcast-io-portcast/)
- [Vizion – Container tracking API](https://www.vizionapi.com/searates-alternative)
- [G2 – Vizion description](https://www.g2.com/products/vizion/discuss)
- [Vizion – API changelog (Jan 2024)](https://docs.vizionapi.com/changelog/2024-01-20)
- [Terminal49 – Bill of lading tracking](https://terminal49.com/bill-of-lading-tracking)
- [Terminal49 – Holds and fees definitions](https://help.terminal49.com/articles/7161097937-hold-and-fees-types-their-definitions)
- [Terminal49 – Containers at risk](https://help.terminal49.com/articles/1980719496-containers-at-risk)
- [Terminal49 – Tracking Trust Indicator launch](https://terminal49.com/blog/tracking-trust-indicator)
- [Terminal49 – Freshness indicator help article](https://help.terminal49.com/articles/4864117973-understanding-data-freshness-indicators-and-manual-refresh)
- [Terminal49 – Migration docs (SeaRates)](https://terminal49.com/docs/migrate/searates)
- [FreightWaves – Flexport MCP server](https://freightwaves.com/news/flexport-mcp-server-ai-agents-freight-booking)
- [SupplyChain247 – Flexport AI assistants](https://www.supplychain247.com/article/flexport-ai-assistants-freight-booking-tracking/logistics)
- [Raft – Customs declarations](https://www.raft.ai/solutions/customs)
- [G2 – Raft description](https://www.g2.com/products/raft/discuss)
- [Air Cargo Week – Raft interview](https://aircargoweek.com/automating-the-freight-forwarding-journey/)
- [EQS News – Shipsy AgentFleet](https://eqs-news.com/news/corporate/shipsy-launches-agentfleet-an-ai-workforce-for-logistics-operations/d24ca3f2-b093-48e3-bb54-39b159f839c0_en)
- [DCSA – Track & Trace API](https://developer.dcsa.org/explore-apis/track-and-trace)
- [AJOT – DCSA Track & Trace 3.0.0](https://www.ajot.com/news/dcsa-publishes-track-trace-3.0.0-expanding-standard-to-cover-iot-and-reefer-visibility)
- [Tradlinx – What DCSA T&T standardises](https://blogs.tradlinx.com/track-trace-standards-in-ocean-freight-what-dcsa-actually-standardizes-and-what-remains-messy/)
- [Tradlinx – DCSA T&T 3.0 changes and event codes](https://blogs.tradlinx.com/when-container-timestamps-conflict-what-dcsa-track-trace-3-0-changes/)
