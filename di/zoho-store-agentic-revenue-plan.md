# Zoho Store — Agentic Revenue Platform
### Build Plan (starting from Account 360)

---

## 1. Where we're starting from

We are not starting from zero. Zoho Store already has most of the foundational data layer — the part that usually takes longest and sinks these projects. **Account 360 already gives us:**

- Unified customer / account profile
- Real-time purchase, renewal, payment, invoice, and subscription-lifecycle events
- Wallet balances
- Product, partner, and AM ownership
- Support interactions

In data terms we likely have *more* customer context than most SaaS companies. So this plan starts **above** the data layer, not at it.

The real gaps are not data — they are decisioning:

- No shared scoring layer (health, churn, expansion, payment-risk, fraud)
- No Next Best Action (NBA) engine to decide *what* to do per customer
- No Outcome Store to record what happened after we acted
- No orchestration or capacity-aware prioritization
- No attribution framework to prove lift

The work ahead is building the **brain** on top of the data we already have.

---

## 2. The core design decision

The most important principle: **the agents are not the brain.**

Each agent is a narrow recommendation service. It answers one question — *"What action would I recommend for this customer?"* — and returns it with the numbers behind it (probability of success, ARR at stake, cost). It does **not** decide how important it is.

The brain is the layer above the agents:

- **NBA Engine** — ranks all recommendations by expected value and picks the best action.
- **Policy Engine** — enforces hard limits so no action ever breaks a business rule.
- **Outcome Store + Learning loop** — records results and makes every future decision smarter.

This is the design that still works when Zoho Store has 20–30 revenue agents running at once.

---

## 3. The architecture

```
Account 360                    (already built)
   ↓
Feature Store + Shared Scores  (health, churn, expansion, payment-risk, fraud)
   ↓
Agents                         (Recovery, Cancellation, Bundle, … — recommendation only)
   ↓
NBA Engine                     (ranks by expected value)
   ↓
Policy Engine                  (hard guardrails)
   ↓
Capacity + Communication Budget (respects human and customer limits)
   ↓
Execution                      (email, WhatsApp, SMS, in-product, AM/partner tasks, wallet, discounts)
   ↓
Outcome Store                  (offer sent → viewed → accepted → renewed / churned)
   ↓
Learning loop                  (refines scores and probabilities over time)
```

---

## 4. How a decision actually works

A customer has a renewal due in 10 days, a failed payment, dropping usage, and has just visited the cancellation page. Several agents respond:

| Agent | Recommendation | Success prob. | ARR at risk | Cost |
|---|---|---|---|---|
| Recovery | Retry payment | 85% | $2,400 | $5 |
| Cancellation | Offer monthly plan | 42% | $2,400 | $100 |
| Renewal | Send reminder | — | $2,400 | low |
| Cross-sell | Offer Analytics | low | — | low |

The NBA Engine computes expected value for each (probability × value − cost), the Policy Engine removes anything that breaks a rule (e.g. no cross-sell to an at-risk account), and only the top action executes. The customer gets **one well-chosen touch** instead of five emails, two SMS, and a WhatsApp on the same day.

---

## 5. Roadmap

We build the brain first, then add agents one at a time — each with a clean success metric and a built-in control group.

**Phase 1 (~3 months) — Foundation + first agent**
- Shared scoring (start with heuristics, not ML)
- NBA Engine v1 (expected-value ranking)
- Outcome Store
- Policy Engine
- **Revenue Recovery Agent**

Recovery is first because it has the cleanest attribution in the portfolio: a clear event (payment failed), a clear result (recovered or not), few confounds, and feedback in days.

**Phase 2 (~3 months) — Orchestration + second agent**
- **Cancellation Rescue Agent**
- Capacity Engine (respect AM / retention / partner limits)
- Communication Budget Engine (one well-chosen touch per customer)

The NBA Engine's real arbitration logic gets exercised here, once two agents start competing for the same customer.

**Phase 3 (~3 months) — Expansion**
- **Bundle Economics Agent** — Zoho's unique advantage. No competitor can compute "Zoho One is cheaper" across CRM, Desk, Projects, Analytics, Books, People, and WorkDrive.
- Next Best Product / Expansion Agent
- Renewal Optimization Agent

**Phase 4 — Intelligence**
- ML-based scoring, replacing heuristics now that the Outcome Store holds real data
- LLM-powered, personalized recommendations
- Move toward autonomous optimization, always within Policy limits

---

## 6. Principles we commit to from day one

These separate a real decisioning platform from automation with extra steps:

1. **Expected value, not fixed priorities.** No hardcoded "priority 95." Agents return probability, value, and cost; the NBA Engine does the math.
2. **Heuristics first, learning always on.** Phase 1 probabilities come from historical base rates — but the Outcome Store is wired in from the *same* sprint, so those numbers improve instead of staying guessed.
3. **Holdouts from launch.** Every agent reserves a small control group that receives no intervention, so we can prove causal lift. "The customer renewed" is not the same as "the agent saved them."
4. **Policy gates protect the business.** Hard limits (max discount, max wallet, one save offer per year) can never be overridden by EV math. Softer logic ("don't cross-sell a churning account") lives inside the scoring.
5. **Respect human capacity.** The system never generates more tasks than the team can act on. If 5,000 accounts need attention and there are 50 AM slots, it picks the best 50.

---

### One-line summary for leadership

> The data foundation (Account 360) is already in place. What we're building is the decision layer on top of it — an NBA Engine that turns customer signals into the single best revenue action per customer, with guardrails and a learning loop — starting with Revenue Recovery, where the ROI is fastest and the proof is cleanest.

---

## 7. Why Zoho is uniquely positioned

Most vendors operate with only one slice of the customer picture:

| Vendor type | Typical view |
|---|---|
| CRM vendor | Sales data |
| Billing vendor | Payment data |
| Support vendor | Ticket data |
| Analytics vendor | Reporting data |

Zoho can combine all of them — Store, CRM, Books, Desk, Projects, People, Payroll, Analytics, and Marketing Automation — under one roof.

That enables not just **Customer Intelligence** but **Business Intelligence**. The platform can understand:

- Product adoption
- Revenue growth
- Payment behavior
- Employee growth
- Operational maturity
- Customer engagement

The result is a **Decision Intelligence Platform** capable of recommending the Next Best Action across the entire customer lifecycle — something a single-domain vendor structurally cannot build.

---

## 8. From Customer 360 to Business 360

The platform isn't only a Store roadmap — it's a step on a larger path:

```
Systems of Record
        ↓
Customer 360
        ↓
Business 360
        ↓
Decision Intelligence
        ↓
Next Best Action
        ↓
Outcome Learning
```

Each layer answers a bigger question:

- **Customer 360** — *What do we know about this customer?*
- **Business 360** — *What do we know about this customer's business?*
- **Decision Intelligence** — *What should happen next?*

This reframes the effort from "Store automation" to a decision layer that understands the customer's whole business.

---

## 9. Success metrics for leadership

Leadership will ask: *how do we know this is working?* The platform is measured on revenue outcomes, platform efficiency, and learning.

**New ARR**
- Trial conversion rate
- Time to first purchase
- Activation rate

**Expansion ARR**
- Cross-sell ARR
- Bundle adoption rate
- Wallet utilization

**Retained ARR**
- Renewal rate
- Revenue recovery rate
- Churn reduction

**Platform metrics**
- NBA recommendation acceptance %
- Human task utilization %
- Communication efficiency
- ARR influenced by the platform

**Learning metrics**
- Agent lift vs. holdout
- Prediction accuracy
- Cost per ARR saved

Together these make the proposal measurable from day one — and the *Learning metrics* in particular are what let us prove the platform is causing the lift, not just riding it.

---

## 10. Why now?

Over the last decade, SaaS platforms became excellent systems of record. Customers can already see their purchases, renewals, payments, support interactions, product usage, and financial data.

The challenge is no longer **access** to information. It is **judgment**:

- Which customer needs attention?
- Why do they need attention?
- What action should be taken?
- Which action creates the highest business impact?

As data volume keeps growing, **attention becomes the limiting resource.** The next generation of software won't compete on storing information — it will compete on helping people allocate attention and execute the next best action.

Zoho is uniquely positioned to lead this transition because it already holds customer, financial, operational, product, and payment intelligence across the entire business lifecycle. Most vendors see only one slice of the customer; Zoho can see the business as a whole. That data advantage exists today — the opportunity is to act on it before it is matched.

```
Past        →   Systems of Record
Current     →   Systems of Analysis
Future      →   Systems of Attention
Future+     →   Systems of Action
```

This platform is how Zoho moves from systems of record to systems of action.
