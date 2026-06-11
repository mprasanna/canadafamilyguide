/* ============================================================
   ZOHO ONE — OPERATING LAYER
   Shared data model — single source of truth for all screens
   All screens import window.ZOL from this file.
   ============================================================ */

window.ZOL = {

  /* ── Company / user ─────────────────────────────────────── */
  user: { name: 'Mark Francis', initials: 'MF', role: 'Chief Executive Officer' },
  date: 'Tuesday, 3 June 2026',
  time: '7:02 AM',

  /* ── Five CEO mental models ──────────────────────────────── */
  mentalModels: [
    { id:'growth',    label:'Growth',    icon:'📈', color:'#C8841C', q:'Will we hit our number?',           signal:'Revenue Risk Signal' },
    { id:'customers', label:'Customers', icon:'🏢', color:'#D14343', q:'Who is at risk right now?',          signal:'Churn Signal' },
    { id:'execution', label:'Execution', icon:'⚙️', color:'#6E5BD0', q:'Can the organisation deliver?',     signal:'Delivery Risk Signal' },
    { id:'people',    label:'People',    icon:'👥', color:'#2D6FB8', q:'Do we have capacity?',               signal:'Capacity Signal' },
    { id:'cash',      label:'Cash',      icon:'💰', color:'#1F8A5B', q:'Are we financially healthy?',       signal:'Cash Signal' },
  ],

  /* ── Business graph chain ─────────────────────────────────── */
  graphChain: ['Lead','Deal','Invoice','Payment','Support','Renewal'],

  graphNodes: [
    { id:'customer', label:'Customer',  sub:'ABC Manufacturing',  icon:'◉', color:'#2D6FB8', app:'CRM',
      rows:[['Account owner','Mark Francis'],['Segment','Strategic · mid-market'],['Health score','38 / 100'],['Lifetime value','$540K']],
      note:'Flagged across 3 of 6 nodes in the chain. No single app can see all three flags.' },
    { id:'deal',     label:'Deal',      sub:'Q2 Expansion',        icon:'◈', color:'#C8841C', app:'CRM',
      rows:[['Value','$120K ARR'],['Stage','Negotiation'],['Last activity','16 days ago'],['Close date','21 Jun 2026']],
      note:'No CRM activity for 16 days — past the 14-day threshold. Books does not know this deal is stalled.' },
    { id:'invoice',  label:'Invoice',   sub:'#INV-4821',           icon:'▤', color:'#D14343', app:'Books',
      rows:[['Amount','$45K'],['Issued','12 Apr 2026'],['Status','Overdue 34 days'],['Terms','Net 30']],
      note:'Books does not know this invoice is tied to a deal currently in negotiation.' },
    { id:'payment',  label:'Payment',   sub:'Outstanding',         icon:'◎', color:'#D14343', app:'Books',
      rows:[['Received','$0 of $45K'],['Last reminder','9 days ago'],['Method','Bank transfer'],['Risk','High']],
      note:'Collections paused pending renewal call — but Books cannot see the renewal date.' },
    { id:'support',  label:'Support',   sub:'3 escalations',       icon:'◉', color:'#D14343', app:'Desk',
      rows:[['Open tickets','7'],['Escalated','3'],['Ticket trend','+40% MoM'],['SLA','1 breached']],
      note:'Desk does not know the renewal is 18 days away. That context lives in Subscriptions.' },
    { id:'renewal',  label:'Renewal',   sub:'in 18 days',          icon:'↻', color:'#6E5BD0', app:'Subscriptions',
      rows:[['Renews','21 Jun 2026'],['ARR','$120K'],['Likelihood','At risk'],['Exec contact','45 days ago']],
      note:'Subscriptions does not know about the overdue invoice or the 3 escalated tickets.' },
  ],

  /* ── Five compound signals ────────────────────────────────── */
  signals: {
    revenue: {
      id:'revenue', name:'Revenue Risk', color:'#C8841C', bg:'#FBF3E3',
      conf:92, status:'ACTIVE', stage:'Investigating',
      impact:'Protect $120K ARR', account:'ABC Manufacturing',
      sources:['CRM','Books','Desk'],
      summary:'A deal has gone quiet while its invoice is overdue and a support ticket has escalated — three application boundaries crossed at once.',
      inputs:[
        { src:'CRM',   obs:'No deal activity in 16 days',     thr:'fires at 14 days', weight:35 },
        { src:'Books', obs:'Invoice overdue by 34 days',       thr:'fires at 30 days', weight:40 },
        { src:'Desk',  obs:'Escalated ticket · SLA breached',  thr:'any escalation',   weight:25 },
      ],
      trend:[20,22,21,24,28,30,34,38,45,52,60,68,78,88],
      built:'building for 3 weeks',
      nearMiss:[
        { account:'Meridian Logistics', score:64 },
        { account:'Halcyon Retail',     score:55 },
        { account:'Crestline SaaS',     score:38 },
      ],
    },
    churn: {
      id:'churn', name:'Churn Risk', color:'#D14343', bg:'#FBECEC',
      conf:88, status:'ACTIVE', stage:'In Progress',
      impact:'$120K ARR · intervention required', account:'ABC Manufacturing',
      sources:['Usage','Desk','Subscriptions'],
      summary:'Login activity has collapsed as ticket volume spikes — and the renewal lands inside the danger window.',
      inputs:[
        { src:'Usage',         obs:'No product login in 21 days',         thr:'fires at 21 days', weight:30 },
        { src:'Desk',          obs:'Ticket volume +40% month-over-month',  thr:'fires at +40%',    weight:35 },
        { src:'Subscriptions', obs:'Renewal in 18 days',                   thr:'window 60 days',   weight:35 },
      ],
      trend:[15,18,20,19,24,30,38,44,52,61,70,76,82,88],
      built:'building for 2 weeks',
      nearMiss:[
        { account:'Vertex Pharma',  score:61 },
        { account:'Solara Energy',  score:52 },
        { account:'Northwind Foods',score:34 },
      ],
    },
    delivery: {
      id:'delivery', name:'Delivery Risk', color:'#6E5BD0', bg:'#EFEBFA',
      conf:84, status:'ACTIVE', stage:'Assigned',
      impact:'Project Alpha · executive attention', account:'ABC Manufacturing',
      sources:['Projects','People','Recruit'],
      summary:'A milestone is slipping while the delivery pod is over-utilised and a key role stays unfilled.',
      inputs:[
        { src:'Projects', obs:'Milestone slipping 8 days',   thr:'fires at 7 days',  weight:40 },
        { src:'People',   obs:'Team utilisation at 92%',     thr:'fires at 90%',     weight:35 },
        { src:'Recruit',  obs:'Key role open 32 days',       thr:'fires at 30 days', weight:25 },
      ],
      trend:[30,32,35,34,40,46,50,55,60,66,72,76,80,84],
      built:'building for 4 weeks',
      nearMiss:[
        { account:'Project Helix · Vertex', score:66 },
        { account:'Project Orbit · Solara', score:49 },
      ],
    },
    cash: {
      id:'cash', name:'Cash Risk', color:'#1F8A6D', bg:'#E6F4EF',
      conf:76, status:'WATCH', stage:'Detected',
      impact:'$45K · finance action', account:'ABC Manufacturing',
      sources:['Books','Expense','Analytics'],
      summary:'A strategic receivable is aging past policy while approvals queue — though runway stays above the floor.',
      inputs:[
        { src:'Books',     obs:'Receivable overdue 48 days (strategic)', thr:'fires at 45 days',    weight:40 },
        { src:'Expense',   obs:'8 approvals pending above threshold',    thr:'queue threshold',      weight:30 },
        { src:'Analytics', obs:'Runway forecast 88 days',                thr:'fires below 60 days',  weight:30 },
      ],
      trend:[40,42,44,46,48,52,55,58,62,65,70,72,74,76],
      built:'building for 5 weeks',
      nearMiss:[
        { account:'Solara Energy',  score:58 },
        { account:'Kestrel Media',  score:41 },
      ],
    },
    capacity: {
      id:'capacity', name:'Capacity Risk', color:'#2D6FB8', bg:'#E8F1FA',
      conf:71, status:'WATCH', stage:'Detected',
      impact:'Hiring priority escalated', account:'Company-wide',
      sources:['People','Recruit','Projects'],
      summary:'Sustained over-utilisation, open critical roles, and falling goal completion point to a capacity ceiling.',
      inputs:[
        { src:'People',  obs:'Utilisation above 85% for 2+ weeks',    thr:'fires at 85%',   weight:35 },
        { src:'Recruit', obs:'2 critical roles open simultaneously',   thr:'fires at 2 roles',weight:35 },
        { src:'People',  obs:'Goal completion at 58%',                 thr:'fires below 60%',weight:30 },
      ],
      trend:[35,36,38,40,42,45,48,52,55,60,64,67,69,71],
      built:'building for 6 weeks',
      nearMiss:[
        { account:'Design pod',   score:63 },
        { account:'Support pod',  score:47 },
      ],
    },
  },

  signalOrder: ['revenue','churn','delivery','cash','capacity'],

  signalLifecycle: ['Detected','Investigating','Assigned','In Progress','Resolved'],

  /* ── CEO brief rows ───────────────────────────────────────── */
  briefRows: [
    { id:'growth',    label:'Growth',    color:'#C8841C', status:'WATCH',    metric:'3 deals',  detail:'at risk above $50K · pipeline at 1.1× coverage (target 1.5×)',  trend:[8,7,7,6,6,5,5,4,4,3], drillId:'growth' },
    { id:'customers', label:'Customers', color:'#D14343', status:'AT RISK',  metric:'$120K',    detail:'ABC Manufacturing churn signal active · ARR at risk',            trend:[2,2,3,3,4,5,6,7,9,12], drillId:'customers' },
    { id:'execution', label:'Execution', color:'#6E5BD0', status:'WATCH',    metric:'8 days',   detail:'Project Alpha slipping · implementation team at 92% utilisation', trend:[1,2,2,3,4,5,6,7,7,8], drillId:'execution' },
    { id:'people',    label:'People',    color:'#2D6FB8', status:'WATCH',    metric:'45 days',  detail:'VP Sales role open · delivery risk signal triggered',             trend:[10,15,20,25,30,33,38,40,43,45], drillId:'people' },
    { id:'cash',      label:'Cash',      color:'#1F8A5B', status:'HEALTHY',  metric:'90 days',  detail:'$45K overdue (strategic) · 8 approvals pending · runway healthy', trend:[88,89,90,91,90,92,91,90,90,90], drillId:'cash' },
  ],

  /* ── Drill-down data ──────────────────────────────────────── */
  drills: {
    growth: {
      accent:'#C8841C', sources:['CRM','Books','Analytics'],
      signalLabel:'Revenue Risk Signal · 92% confidence',
      signalTitle:'3 deals at risk above $50K',
      signalSub:'Pipeline coverage at 1.1× against a 1.5× target — and the largest at-risk deal also carries an overdue invoice.',
      kpis:[
        { label:'Pipeline coverage', value:'1.1×',  sub:'target 1.5×',      accent:'#C8841C', trend:[1.5,1.4,1.35,1.25,1.18,1.1] },
        { label:'Forecast accuracy', value:'78%',   sub:'down from 86%',    accent:'#C8841C', trend:[86,85,83,81,80,78] },
        { label:'Deals at risk',     value:'$242K', sub:'across 3 deals',   accent:'#D14343', trend:[60,90,120,160,200,242] },
        { label:'Quota attainment',  value:'82%',   sub:'13 days left',     accent:'#1F8A5B', trend:[60,66,71,75,79,82] },
      ],
      primary:{ title:'At-risk deals', rows:[
        { name:'ABC Manufacturing', meta:'Negotiation · no CRM activity 16d · invoice overdue 34d', value:'$120K', tag:'Revenue Risk', tagColor:'#D14343' },
        { name:'Meridian Logistics',meta:'Proposal · slipping 2 weeks past close date',             value:'$68K',  tag:'Watch',         tagColor:'#C8841C' },
        { name:'Halcyon Retail',    meta:'Negotiation · single-threaded contact',                   value:'$54K',  tag:'Watch',         tagColor:'#C8841C' },
      ]},
      secondary:{ title:'Expansion opportunities', rows:[
        { name:'Northwind Foods', meta:'Usage +40% MoM · upsell ready', value:'+$45K' },
        { name:'Crestline SaaS',  meta:'Seat expansion signal active',  value:'+$28K' },
      ]},
    },
    customers: {
      accent:'#D14343', sources:['CRM','Desk','Subscriptions'],
      signalLabel:'Churn Signal · intervention required',
      signalTitle:'ABC Manufacturing — $120K ARR at risk',
      signalSub:'No product login in 21 days, ticket volume up 40% month-over-month, and renewal lands in 18 days.',
      kpis:[
        { label:'Accounts at risk',  value:'4',     sub:'of 86 active',      accent:'#D14343', trend:[1,1,2,3,3,4] },
        { label:'Avg health score',  value:'72',    sub:'down 8 pts MoM',    accent:'#C8841C', trend:[80,79,77,75,74,72] },
        { label:'Open escalations',  value:'7',     sub:'3 on one account',  accent:'#D14343', trend:[2,3,3,5,6,7] },
        { label:'Renewals < 60d',    value:'$340K', sub:'across 5 accounts', accent:'#2D6FB8', trend:[120,180,220,280,310,340] },
      ],
      primary:{ title:'At-risk accounts', rows:[
        { name:'ABC Manufacturing', meta:'Health 38 · 3 escalations · renewal in 18d', value:'$120K', tag:'Churn', tagColor:'#D14343' },
        { name:'Vertex Pharma',     meta:'Health 54 · logins down 60%',                value:'$96K',  tag:'Watch', tagColor:'#C8841C' },
        { name:'Solara Energy',     meta:'Health 61 · 2 open escalations',             value:'$74K',  tag:'Watch', tagColor:'#C8841C' },
      ]},
      secondary:{ title:'Renewals this quarter', rows:[
        { name:'ABC Manufacturing', meta:'Renews 21 Jun · at risk',  value:'$120K' },
        { name:'Meridian Logistics',meta:'Renews 04 Jul · on track', value:'$88K' },
      ]},
    },
    execution: {
      accent:'#6E5BD0', sources:['Projects','People','Recruit'],
      signalLabel:'Delivery Risk Signal · executive attention',
      signalTitle:'Project Alpha slipping 8 days',
      signalSub:'A milestone is slipping while the implementation team runs at 92% utilisation and a key role has been open 30+ days.',
      kpis:[
        { label:'Projects at risk',    value:'2',   sub:'of 14 active',         accent:'#6E5BD0', trend:[0,1,1,1,2,2] },
        { label:'Milestones delayed',  value:'4',   sub:'avg slip 8 days',      accent:'#D14343', trend:[1,1,2,3,3,4] },
        { label:'Team utilisation',    value:'92%', sub:'over 85% threshold',   accent:'#D14343', trend:[80,83,86,88,90,92] },
        { label:'Resource conflicts',  value:'3',   sub:'2 people double-booked',accent:'#C8841C',trend:[0,1,1,2,2,3] },
      ],
      primary:{ title:'Projects at risk', rows:[
        { name:'Project Alpha — ABC Mfg', meta:'Milestone slipping 8d · team at 92%', value:'8d late', tag:'Delivery Risk', tagColor:'#6E5BD0' },
        { name:'Project Helix — Vertex',  meta:'Dependency blocked · resource conflict',value:'3d late',tag:'Watch',          tagColor:'#C8841C' },
      ]},
      secondary:{ title:'Resource conflicts', rows:[
        { name:'Priya N. (Lead Eng)',    meta:'Booked across 2 critical projects', value:'118%' },
        { name:'Implementation pod',     meta:'Open senior role 32 days',         value:'2 roles' },
      ]},
    },
    people: {
      accent:'#2D6FB8', sources:['People','Recruit','Projects'],
      signalLabel:'Capacity Signal · hiring priority escalated',
      signalTitle:'VP Sales role open 45 days',
      signalSub:'Utilisation has held above 85% for over two weeks, two critical roles are open, and goal completion has dipped below 60%.',
      kpis:[
        { label:'Team utilisation',    value:'88%',    sub:'over 85% 2+ weeks',   accent:'#D14343', trend:[78,81,84,86,87,88] },
        { label:'Open critical roles', value:'2',      sub:'VP Sales · Lead Eng',  accent:'#C8841C', trend:[0,1,1,1,2,2] },
        { label:'Goal completion',     value:'58%',    sub:'below 60% target',     accent:'#C8841C', trend:[72,69,66,63,60,58] },
        { label:'Attrition risk',      value:'Medium', sub:'2 flight-risk ICs',    accent:'#C8841C', trend:[1,1,2,2,2,3] },
      ],
      primary:{ title:'Hiring gaps', rows:[
        { name:'VP Sales',                  meta:'Open 45 days · blocking pipeline coverage', value:'45d', tag:'Capacity', tagColor:'#2D6FB8' },
        { name:'Lead Engineer — Delivery',  meta:'Open 32 days · blocking Project Alpha',     value:'32d', tag:'Watch',    tagColor:'#C8841C' },
      ]},
      secondary:{ title:'Utilisation by team', rows:[
        { name:'Implementation',    meta:'Sustained over threshold', value:'92%' },
        { name:'Customer Success',  meta:'Rising with churn workload',value:'87%' },
      ]},
    },
    cash: {
      accent:'#1F8A6D', sources:['Books','Expense','Analytics'],
      signalLabel:'Cash Signal · runway healthy',
      signalTitle:'$45K overdue · 8 approvals pending',
      signalSub:'A strategic account\'s receivable is overdue beyond 45 days and approvals are queuing — but the 90-day runway forecast remains healthy.',
      kpis:[
        { label:'Overdue AR',        value:'$45K', sub:'strategic account',      accent:'#C8841C', trend:[10,18,26,34,40,45] },
        { label:'Approvals pending', value:'8',    sub:'$62K queued',             accent:'#C8841C', trend:[2,3,4,5,6,8] },
        { label:'Cash runway',       value:'90d',  sub:'above 60d floor',         accent:'#1F8A5B', trend:[96,95,93,92,91,90] },
        { label:'Expense flags',     value:'2',    sub:'above policy threshold',  accent:'#C8841C', trend:[0,0,1,1,1,2] },
      ],
      primary:{ title:'AR aging', rows:[
        { name:'ABC Manufacturing', meta:'Invoice overdue 34 days · strategic', value:'$45K', tag:'Cash Risk', tagColor:'#C8841C' },
        { name:'Solara Energy',     meta:'Overdue 12 days · follow-up sent',    value:'$18K', tag:'Watch',     tagColor:'#C8841C' },
      ]},
      secondary:{ title:'Pending approvals', rows:[
        { name:'Q3 marketing spend', meta:'Awaiting CEO sign-off',     value:'$24K' },
        { name:'Contractor renewal', meta:'Above policy threshold',    value:'$18K' },
      ]},
    },
  },

  /* ── Recommendations ──────────────────────────────────────── */
  recommendations: [
    { id:'abc',    priority:'HIGH',   pColor:'#D14343', title:'Call ABC Manufacturing today',
      rationale:'Revenue Risk and Churn signals converge on one account — three escalations, an overdue invoice, and a renewal in 18 days.',
      signals:['Revenue Risk','Churn'], impact:'Protect $120K ARR', conf:92, action:'Schedule exec call + loop in CSM' },
    { id:'alpha',  priority:'HIGH',   pColor:'#D14343', title:'Escalate Project Alpha delivery risk',
      rationale:'A milestone is slipping 8 days while the pod runs at 92% — left alone this becomes an SLA breach on a strategic account.',
      signals:['Delivery Risk'], impact:'Prevent SLA breach', conf:84, action:'Escalate to delivery lead' },
    { id:'budget', priority:'MEDIUM', pColor:'#C8841C', title:'Approve Q3 marketing budget',
      rationale:'Pipeline coverage at 1.1× — demand-gen spend is the fastest lever to close the gap before quarter end.',
      signals:['Cash'], impact:'Unblock pipeline generation', conf:80, action:'Approve $24K spend' },
    { id:'vp',     priority:'MEDIUM', pColor:'#C8841C', title:'Open VP Sales backfill',
      rationale:'A role open 45 days is now the binding constraint on pipeline coverage and forecast accuracy.',
      signals:['Capacity'], impact:'Restore pipeline coverage', conf:71, action:'Approve req + brief recruiter' },
  ],

  /* ── Approval queue ───────────────────────────────────────── */
  approvals: [
    { id:'call',      title:'Call ABC Manufacturing', impact:'$120K ARR', type:'Action',
      context:'Revenue Risk + Churn signal converge. Renewal in 18 days.',
      ifIgnored:['Renewal likelihood: At risk','$120K ARR: Exposed','Open escalations: 3 unowned','Exec contact: 45 days ago'],
      ifApproved:['Renewal likelihood: Secured','$120K ARR: Protected','Open escalations: CSM engaged','Exec contact: Today'],
    },
    { id:'budget',    title:'Q3 marketing budget', impact:'$24K', type:'Finance',
      context:'Pipeline coverage at 1.1×. Demand-gen needed before quarter close.' },
    { id:'contractor',title:'Contractor renewal', impact:'$18K', type:'Finance',
      context:'Above policy threshold. Requires CEO sign-off.' },
    { id:'vpreq',     title:'VP Sales requisition', impact:'Headcount', type:'HR',
      context:'Role open 45 days. Delivery risk active.' },
  ],

  /* ── Delegations ──────────────────────────────────────────── */
  delegations: [
    { id:'abc',   title:'Call ABC Manufacturing', impact:'$120K ARR', options:['VP Sales','Cust. Success'] },
    { id:'alpha', title:'Project Alpha escalation', impact:'SLA risk',  options:['Delivery Lead','CTO'] },
    { id:'vp',    title:'VP Sales backfill',       impact:'Pipeline',   options:['Head of HR','COO'] },
  ],

  /* ── Outcomes ─────────────────────────────────────────────── */
  outcomes: [
    { signal:'Churn Risk',    action:'Executive call — Mark Francis called ABC Manufacturing',
      result:'Renewal secured', value:'$120K ARR protected', color:'#1F8A5B', resolved:true,
      timeline:[
        { t:'7:00 AM', e:'Churn signal fired — confidence 88%' },
        { t:'7:04 AM', e:'Brief delivered via Cliq and mobile' },
        { t:'7:09 AM', e:'CEO approved executive call' },
        { t:'9:30 AM', e:'Call made — CSM looped in' },
        { t:'2:15 PM', e:'Renewal commitment received' },
        { t:'2:16 PM', e:'Signal resolved — ARR protected' },
      ]},
    { signal:'Cash Risk',     action:'Invoice follow-up delegated to Finance Manager',
      result:'$45K collected', value:'AR aging normalised', color:'#1F8A5B', resolved:true,
      timeline:[
        { t:'7:00 AM', e:'Cash signal in brief' },
        { t:'7:10 AM', e:'Delegated to Finance Manager' },
        { t:'11:00 AM',e:'Collection call made' },
        { t:'3:00 PM', e:'Payment confirmed' },
      ]},
    { signal:'Delivery Risk', action:'Project Alpha escalated to delivery lead',
      result:'Resource conflict resolved', value:'Milestone back on track', color:'#C8841C', resolved:false,
      timeline:[
        { t:'7:00 AM', e:'Delivery Risk signal in brief' },
        { t:'7:08 AM', e:'Escalated via Cliq' },
        { t:'9:00 AM', e:'Delivery lead assigned second engineer' },
        { t:'In progress', e:'Milestone recovery underway' },
      ]},
  ],

  /* ── What Changed data ────────────────────────────────────── */
  whatChanged: {
    today: {
      summary:'3 signals escalated · 1 eased · 1 steady since yesterday',
      items:[
        { name:'Churn Risk',    color:'#D14343', dir:'up',   delta:'+12', text:'ABC Manufacturing crossed the firing threshold overnight — renewal now inside 18 days.',    trend:[70,72,74,76,82,88] },
        { name:'Revenue Risk',  color:'#C8841C', dir:'up',   delta:'+8',  text:'ABC invoice aged past 30 days, compounding the stalled deal.',                              trend:[72,74,78,82,85,88] },
        { name:'Delivery Risk', color:'#6E5BD0', dir:'up',   delta:'+4',  text:'Project Alpha milestone slipped another 2 days; pod still at 92%.',                        trend:[76,78,79,81,83,84] },
        { name:'Cash Risk',     color:'#1F8A6D', dir:'flat', delta:'0',   text:'Runway forecast unchanged at 90 days; approvals queue holding.',                            trend:[76,76,75,76,76,76] },
        { name:'Capacity Risk', color:'#2D6FB8', dir:'down', delta:'−3',  text:'A contractor onboarded — implementation utilisation eased slightly.',                       trend:[74,73,73,72,71,71] },
      ],
    },
    week: {
      summary:'Churn and Revenue trended up all week · Capacity improving',
      items:[
        { name:'Churn Risk',    color:'#D14343', dir:'up',   delta:'+34', text:'Built steadily over 7 days as logins fell and tickets climbed.',      trend:[54,58,64,70,76,82,88] },
        { name:'Revenue Risk',  color:'#C8841C', dir:'up',   delta:'+22', text:'Deal went quiet midweek; invoice aging accelerated the rise.',         trend:[66,68,72,76,80,84,88] },
        { name:'Delivery Risk', color:'#6E5BD0', dir:'up',   delta:'+14', text:'Slip widened from 4 to 8 days across the sprint.',                    trend:[70,72,74,77,80,82,84] },
        { name:'Cash Risk',     color:'#1F8A6D', dir:'up',   delta:'+6',  text:'Receivable aged into the watch band; runway still healthy.',           trend:[70,71,72,73,74,75,76] },
        { name:'Capacity Risk', color:'#2D6FB8', dir:'down', delta:'−8',  text:'Utilisation easing as the open role moves through hiring.',            trend:[79,78,76,74,73,72,71] },
      ],
    },
    month: {
      summary:'Churn is the dominant 30-day mover · all others within band',
      items:[
        { name:'Churn Risk',    color:'#D14343', dir:'up', delta:'+58', text:'From dormant to critical over the month — the clearest trajectory.',    trend:[30,38,46,54,64,74,82,88] },
        { name:'Revenue Risk',  color:'#C8841C', dir:'up', delta:'+40', text:'Tracked the deal cooling and the invoice aging across 30 days.',         trend:[48,54,60,66,72,78,84,88] },
        { name:'Delivery Risk', color:'#6E5BD0', dir:'up', delta:'+30', text:'Rose as utilisation stayed high and the role stayed open.',              trend:[54,58,62,68,72,77,81,84] },
        { name:'Cash Risk',     color:'#1F8A6D', dir:'up', delta:'+18', text:'Gradual climb with receivable aging; below action threshold.',           trend:[58,62,65,68,70,72,74,76] },
        { name:'Capacity Risk', color:'#2D6FB8', dir:'up', delta:'+12', text:'Net up over the month though improving in the last week.',               trend:[59,62,65,67,69,70,71,71] },
      ],
    },
  },

  /* ── Signal thresholds (configurable) ───────────────────────*/
  thresholdDefaults: {
    inactive:   14,
    overdue:    30,
    util:       90,
    ticketJump: 40,
    renewal:    60,
    runway:     60,
  },

  thresholdRules: [
    { key:'inactive',    label:'Deal inactivity',           signal:'Revenue Risk',     unit:' days', min:7,  max:30 },
    { key:'overdue',     label:'Invoice overdue',           signal:'Revenue · Cash',   unit:' days', min:15, max:60 },
    { key:'util',        label:'Team utilisation ceiling',  signal:'Delivery · Capacity',unit:'%',  min:75, max:100 },
    { key:'ticketJump',  label:'Ticket volume jump',        signal:'Churn Risk',       unit:'%',     min:20, max:80 },
    { key:'renewal',     label:'Renewal window',            signal:'Churn Risk',       unit:' days', min:30, max:90 },
    { key:'runway',      label:'Cash runway floor',         signal:'Cash Risk',        unit:' days', min:30, max:90 },
  ],

  /* ── Success metrics ──────────────────────────────────────── */
  metrics: [
    { label:'Brief open rate',       value:'80%', target:'80%', trend:[22,31,40,52,61,68,75,80], color:'#2D6FB8', unit:'%' },
    { label:'Approval in-brief',     value:'35%', target:'35%', trend:[4,8,12,18,24,28,32,35],   color:'#6E5BD0', unit:'%' },
    { label:'Daily active leaders',  value:'70%', target:'70%', trend:[15,24,32,42,51,58,65,70], color:'#C8841C', unit:'%' },
    { label:'Decision time',         value:'−50%',target:'−50%',trend:[5,10,18,26,34,40,46,50],  color:'#1F8A5B', unit:'%' },
    { label:'App switching',         value:'−40%',target:'−40%',trend:[4,8,14,20,27,32,37,40],   color:'#D14343', unit:'%' },
  ],

  /* ── Architecture layers ──────────────────────────────────── */
  archLayers: [
    { kind:'apps',    label:'Application layer',    sub:'CRM · Books · Desk · Projects · People · Expense · Recruit',  color:'#2D6FB8', conns:['CRM','Books','Desk','Projects','People'] },
    { kind:'graph',   label:'Business graph',        sub:'Lead → Deal → Invoice → Payment → Support → Renewal',         color:'#6E5BD0' },
    { kind:'signal',  label:'Business signal engine',sub:'Revenue Risk · Churn · Delivery · Cash · Capacity',           color:'#C8841C' },
    { kind:'layer',   label:'Operating layer',        sub:'Role Engine · Brief Generator · Recommendation Engine',       color:'#E0432F' },
    { kind:'action',  label:'Action and execution',   sub:'Approve · Delegate · Defer · Workflow trigger',               color:'#1F8A5B' },
    { kind:'outcome', label:'Business outcomes',       sub:'Renewals secured · Risk resolved · ARR protected',            color:'#1F8A5B' },
  ],

  archConnections: [
    { from:'CRM',      status:'synced 2 min ago',  color:'#1F8A5B' },
    { from:'Books',    status:'synced 5 min ago',  color:'#1F8A5B' },
    { from:'Desk',     status:'synced 1 min ago',  color:'#1F8A5B' },
    { from:'Projects', status:'synced 3 min ago',  color:'#1F8A5B' },
    { from:'People',   status:'synced 4 min ago',  color:'#1F8A5B' },
  ],

  /* ── Data flow steps ──────────────────────────────────────── */
  dataFlow: [
    { step:1, label:'Application event fires',    sub:'CRM deal goes quiet · Books invoice ages · Desk ticket escalates', color:'#2D6FB8' },
    { step:2, label:'Event bus receives',          sub:'Entity ID · timestamp · event type · source application',         color:'#6E5BD0' },
    { step:3, label:'Signal processor evaluates', sub:'Queries related entities · applies weighted scoring per signal',   color:'#C8841C' },
    { step:4, label:'Signal store writes',         sub:'Signal type · confidence score · inputs · impact value',          color:'#C8841C' },
    { step:5, label:'Recommendation engine',       sub:'Reads active signals · matches rules · generates ranked actions', color:'#E0432F' },
    { step:6, label:'Brief generator assembles',  sub:'Top signals per mental model · top recommendation · approvals',    color:'#E0432F' },
    { step:7, label:'Delivery layer pushes',       sub:'Cliq · mobile push · email · 7:00 AM scheduled',                 color:'#1F8A5B' },
    { step:8, label:'User action',                 sub:'Approve · delegate · defer — written back to source application', color:'#1F8A5B' },
    { step:9, label:'Outcome tracker monitors',   sub:'Did the risk resolve? Signal history updated.',                    color:'#1F8A5B' },
  ],

  /* ── Maturity model ───────────────────────────────────────── */
  maturity: [
    { phase:1, label:'Daily Operating Brief', sub:'Deliverable in weeks. One brief. Five signals. One action.', color:'#2D6FB8',  status:'Launch' },
    { phase:2, label:'Operating Layer',        sub:'Role cascade. Recommendation engine. Calendar intelligence.', color:'#6E5BD0', status:'Phase 2' },
    { phase:3, label:'Business Signal Engine', sub:'Cross-app compound intelligence. Action execution. Learning.', color:'#C8841C',status:'Phase 3' },
    { phase:4, label:'Business Operating System',sub:'The platform mid-market companies use to understand and grow.',color:'#E0432F',status:'Endgame' },
  ],

  /* ── Role cascade ─────────────────────────────────────────── */
  roles: {
    vpsales: {
      name:'Sarah Chen', role:'VP Sales', initials:'SC',
      accent:'#C8841C', bg:'#FBF3E3',
      frame:'Growth — Will we hit the number?',
      signal:'Revenue Risk Signal · pipeline coverage',
      sources:'CRM + Books + Analytics',
      focus:'Pipeline health, deal risks, team performance, quota attainment',
      diff:'Sees Growth and Revenue signals only. No People, Cash, or Execution signals.',
      kpis:[
        { label:'Pipeline coverage', value:'1.1×', sub:'target 1.5×', trend:[1.5,1.4,1.35,1.25,1.18,1.1] },
        { label:'Forecast accuracy', value:'78%',  sub:'down from 86%', trend:[86,85,83,81,80,78] },
        { label:'Team quota',        value:'82%',  sub:'13 days left',  trend:[60,66,71,75,79,82] },
        { label:'Deals at risk',     value:'$242K',sub:'3 deals',       trend:[60,90,120,160,200,242] },
      ],
      rec:{ title:'Call ABC Manufacturing', sub:'Revenue Risk + Churn converge. Renewal in 18 days.', impact:'Protect $120K ARR' },
    },
    cfo: {
      name:'Priya Nair', role:'Chief Financial Officer', initials:'PN',
      accent:'#1F8A5B', bg:'#E6F4EF',
      frame:'Cash — Are we financially healthy?',
      signal:'Cash Signal · approval queue',
      sources:'Books + Expense + Analytics',
      focus:'Collections, approvals, cashflow, budget vs actuals',
      diff:'Sees Cash signals and approval queue only. Revenue signals shown in summary only.',
      kpis:[
        { label:'Overdue AR',       value:'$45K', sub:'strategic account', trend:[10,18,26,34,40,45] },
        { label:'Approvals pending',value:'8',    sub:'$62K queued',       trend:[2,3,4,5,6,8] },
        { label:'Cash runway',      value:'90d',  sub:'above 60d floor',   trend:[96,95,93,92,91,90] },
        { label:'Expense flags',    value:'2',    sub:'above threshold',   trend:[0,0,1,1,1,2] },
      ],
      rec:{ title:'Resolve ABC Manufacturing AR', sub:'$45K overdue 34 days. Strategic account. Renewal pending.', impact:'Protect cash position' },
    },
  },

  /* ── Meeting prep data ────────────────────────────────────── */
  meetingPrep: {
    title:'ABC Manufacturing — Customer Review',
    time:'2:00 PM · Tuesday 3 June 2026',
    tiles:[
      { label:'Health score', value:'38', sub:'down 22 pts in 30 days', color:'#D14343' },
      { label:'Open tickets', value:'7',  sub:'3 escalated · 1 SLA breach', color:'#D14343' },
      { label:'Overdue invoice',value:'$45K',sub:'#INV-4821 · 34 days late', color:'#C8841C' },
      { label:'Renewal',       value:'18 days',sub:'$120K ARR · at risk', color:'#6E5BD0' },
    ],
    talkingPoints:[
      'Lead with the escalations — acknowledge the 3 open tickets before they raise them.',
      'Have finance ready to discuss the overdue invoice as part of the renewal package.',
      'Frame the renewal as a partnership reset, not a transaction.',
    ],
  },

  /* ── Cliq / mobile brief lines ────────────────────────────── */
  cliqBrief:[
    { icon:'▲', label:'Growth',    text:'3 deals at risk · pipeline 1.1×', color:'#C8841C' },
    { icon:'⚠', label:'Customers', text:'ABC Mfg churn active · $120K',    color:'#D14343' },
    { icon:'■', label:'Execution', text:'Project Alpha slipping 8 days',   color:'#6E5BD0' },
    { icon:'●', label:'People',    text:'VP Sales role open 45 days',      color:'#2D6FB8' },
    { icon:'$', label:'Cash',      text:'$45K overdue · runway 90d',       color:'#1F8A5B' },
  ],

  /* ── Spark helper ─────────────────────────────────────────── */
  spark(values, w=120, h=30, pad=3) {
    const min=Math.min(...values), max=Math.max(...values), range=(max-min)||1, n=values.length;
    return values.map((v,i)=>{
      const x=pad+(i/(n-1))*(w-2*pad);
      const y=(h-pad)-((v-min)/range)*(h-2*pad);
      return x.toFixed(1)+','+y.toFixed(1);
    }).join(' ');
  },
};
