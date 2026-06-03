# Zoho Store — Agentic Revenue Platform
### Executive Summary

*(Detailed version: "Agentic Revenue Platform — Build Plan")*

---

## Page 1 — The case

### The problem
A decade of SaaS has solved **access** to information. We can already see every customer's purchases, renewals, payments, support history, and product usage. What we have *not* solved is **judgment** — at any moment, across millions of accounts:

- Which customer needs attention?
- Why?
- What is the single best action to take?
- Which action creates the highest business impact?

Today that judgment is made by static rules and scattered campaigns, which means customers are either over-contacted (five emails, an SMS, and a WhatsApp in one week) or quietly missed.

### Why now
As data volume grows, **attention becomes the limiting resource** — for customers and for our own teams. The next generation of software won't win on storing information; it will win on allocating attention and executing the next best action. Zoho's data advantage exists today and is matchable if we wait.

```
Past      →  Systems of Record
Current   →  Systems of Analysis
Future    →  Systems of Attention
Future+   →  Systems of Action
```

### The vision
A decision layer on top of the data we already hold, that determines and executes the **single best revenue action per customer** across the lifecycle — with guardrails and a learning loop so it improves over time.

```
Customer 360  →  Business 360  →  Decision Intelligence  →  Next Best Action  →  Outcome Learning
```

### Why Zoho
Most vendors see one slice of the customer — CRM sees sales, billing sees payments, support sees tickets. Zoho can combine Store, CRM, Books, Desk, Projects, People, Payroll, Analytics, Payments, and Marketing under one roof. That makes this not just **Customer Intelligence** but **Business Intelligence** — and a decision platform a single-domain vendor structurally cannot build.

---

## Page 2 — The plan

### Architecture
The data foundation (**Account 360**) is already in place, so we start at the decision layer, not the data layer.

```
Account 360 (built)  →  Scores  →  Agents  →  NBA Engine  →  Policy  →  Capacity + Comms Budget  →  Execution  →  Outcome Store  →  Learning
```

The key principle: **the agents are not the brain.** Each agent is a narrow service that recommends an action with the numbers behind it (probability, ARR at stake, cost). The brain is the **NBA Engine** (ranks by expected value), the **Policy Engine** (hard guardrails), and the **Outcome + Learning loop** (proves and improves). This design scales to 20–30 agents without conflicting customer experiences.

### Roadmap
| Phase | Focus | Deliverables |
|---|---|---|
| 1 (~3 mo) | Foundation + first agent | Shared scoring (heuristics), NBA Engine v1, Outcome Store, Policy Engine, **Revenue Recovery Agent** |
| 2 (~3 mo) | Orchestration + second agent | **Cancellation Rescue Agent**, Capacity Engine, Communication Budget Engine |
| 3 (~3 mo) | Expansion | **Bundle Economics Agent**, Next Best Product, Renewal Optimization |
| 4 | Intelligence | ML scoring, LLM recommendations, autonomous optimization (within policy) |

We lead with **Revenue Recovery** because it has the cleanest proof: clear trigger (payment failed), clear result (recovered or not), few confounds, feedback in days.

### Expected impact
| Pillar | Levers | Measured by |
|---|---|---|
| New ARR | Trial conversion, faster activation | Conversion %, time to first purchase, activation rate |
| Expansion ARR | Cross-sell, bundle adoption, wallet | Cross-sell ARR, bundle adoption, wallet utilization |
| Retained ARR | Renewal, recovery, churn prevention | Renewal %, recovery %, churn reduction |
| Efficiency | One well-chosen touch; attention allocated to highest-value accounts | NBA acceptance %, human task utilization, ARR influenced |

Every agent launches with a **holdout group**, so impact is reported as *causal lift vs. control* — not renewals the platform merely rode along with.

---

### One line
> The data foundation is built. What we're building is the decision layer on top of it — and starting with Revenue Recovery, where the ROI is fastest and the proof is cleanest.
