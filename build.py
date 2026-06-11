#!/usr/bin/env python3
"""
Velivance X — inner-page generator.
Reuses the content definitions (AGENTIC, CORE, ARTICLES, SVC_IMG) from
../site/build.py and emits every inner page in the X design language.
index.html is hand-authored and NOT touched by this script.

Run:  python3 build.py
"""
import contextlib
import importlib.util
import io
import os

BASE = os.path.dirname(os.path.abspath(__file__))

# Load content from the corporate-site generator (its import also rebuilds
# the corporate site in place — identical output, harmless).
_spec = importlib.util.spec_from_file_location("sitecontent", os.path.join(BASE, "..", "site", "build.py"))
_mod = importlib.util.module_from_spec(_spec)
with contextlib.redirect_stdout(io.StringIO()):
    _spec.loader.exec_module(_mod)
AGENTIC, CORE, ARTICLES, SVC_IMG = _mod.AGENTIC, _mod.CORE, _mod.ARTICLES, _mod.SVC_IMG

ALL_SERVICES = AGENTIC + CORE
BRAND = "Velivance"

FAVICON = ("data:image/svg+xml,%3Csvg viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E"
           "%3Cpath d='M5 14h9M5 20h6M5 26h9' stroke='%23F1F5F9' stroke-width='2.6' stroke-linecap='round'/%3E"
           "%3Cpath d='M19 10 L30 20 L19 30' stroke='%23F1F5F9' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/%3E"
           "%3Ccircle cx='30' cy='20' r='4.6' fill='%23E97451'/%3E%3C/svg%3E")

MARK = ('<svg class="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">'
        '<path d="M5 14h9M5 20h6M5 26h9" stroke="#F1F5F9" stroke-width="2.6" stroke-linecap="round"/>'
        '<path d="M19 10 L30 20 L19 30" stroke="#F1F5F9" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
        '<circle cx="30" cy="20" r="4.6" fill="#E97451"/></svg>')


def head(p, title, desc):
    return (
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        '<meta name="robots" content="noindex">'  # pre-launch: remove at go-live
        '<title>%s</title><meta name="description" content="%s">'
        '<meta property="og:title" content="%s"><meta property="og:description" content="%s">'
        '<link rel="icon" type="image/svg+xml" href="%s">'
        '<link rel="preconnect" href="https://fonts.googleapis.com">'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        '<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">'
        '<link rel="stylesheet" href="%sassets/css/style.css"></head><body>'
        % (title, desc, title, desc, FAVICON, p)
    )


def header(p, active):
    links = [("services.html", "Services"), ("about.html", "About"), ("partnership.html", "Partnership"),
             ("insights.html", "Insights"), ("contact.html", "Contact")]
    nav = "".join(
        '<a href="%s%s" class="roll"%s><span data-text="%s">%s</span></a>'
        % (p, href, ' style="color:var(--accent-2)"' if active == label else "", label, label)
        for href, label in links)
    return (
        '<div class="cursor" aria-hidden="true"><div class="cursor-dot" id="cDot"></div>'
        '<div class="cursor-ring" id="cRing"><span id="cLabel"></span></div></div>'
        '<header class="hdr is-solid" id="hdr">'
        '<a class="brand" href="%sindex.html" aria-label="Velivance home">%s<span>Velivance</span></a>'
        '<nav class="hdr-nav" aria-label="Site">%s</nav>'
        '<a href="%scontact.html" class="btn btn-solid" data-magnetic>Start a project</a>'
        '</header>' % (p, MARK, nav, p)
    )


def footer(p, cta=True):
    band = (
        '<section class="cta-mini"><div class="wrap">'
        '<p class="tag" style="justify-content:center">Next step</p>'
        '<h2>Move <em class="serif">forward.</em></h2>'
        '<a class="big-btn" href="%scontact.html" data-magnetic><span>Start a project</span><span class="arr">&rarr;</span></a>'
        '</div></section>' % p) if cta else ""
    return (
        band +
        '<footer class="x-foot"><div class="wrap">'
        '<span>&copy; 2026 Velivance &middot; Backed by Avanciers</span>'
        '<span class="f-status"><i></i>Operating across Canada &middot; USA &middot; India</span>'
        '<a class="roll" href="%sindex.html"><span data-text="velivance.com">velivance.com</span></a>'
        '</div></footer>'
        '<div class="grain" aria-hidden="true"></div>'
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>'
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"></script>'
        '<script src="https://unpkg.com/lenis@1.1.14/dist/lenis.min.js"></script>'
        '<script src="%sassets/js/app.js"></script></body></html>' % (p, p)
    )


def px_hero(p, crumb_html, tag, title_html, lead, img):
    return (
        '<section class="px-hero">'
        '<div class="px-bg" aria-hidden="true"><img src="%sassets/img/%s.webp" alt=""></div>'
        '<div class="wrap"><span class="crumb">%s</span>'
        '<p class="tag" data-hero-fade>%s</p><h1 data-hero-fade>%s</h1>'
        '<p class="sub" data-hero-fade>%s</p></div></section>' % (p, img, crumb_html, tag, title_html, lead)
    )


def mini_card(p, s):
    return (
        '<a class="mini" href="%sservices/%s.html"><div class="mm"><img src="%sassets/img/%s.webp" alt="" loading="lazy"></div>'
        '<div class="mb"><span class="mono">%s</span><h3>%s</h3><p>%s</p></div></a>'
        % (p, s["slug"], p, SVC_IMG.get(s["slug"], "hero"), s.get("tag", "Core"), s["name"], s["nav"]))


def service_page(s):
    p = "../"
    others = [x for x in ALL_SERVICES if x["slug"] != s["slug"]][:3]
    checks = "".join("<li>%s</li>" % d for d in s["deliver"])
    impact = "".join("<li>%s</li>" % i for i in s["impact"])
    steps = "".join(
        '<div class="st"><span class="mono">PHASE 0%d</span><h3>%s</h3><p>%s</p></div>' % (i + 1, n, d)
        for i, (n, d) in enumerate(s["steps"]))
    related = "".join(mini_card(p, x) for x in others)
    crumb = '<a href="%sindex.html">Home</a> / <a href="%sservices.html">Services</a> / %s' % (p, p, s["name"])
    name_parts = s["name"].rsplit(" ", 1)
    title_html = '%s <em class="serif">%s</em>' % (name_parts[0], name_parts[1]) if len(name_parts) == 2 else s["name"]
    body = (
        px_hero(p, crumb, s["eyebrow"], title_html, s["intro"], SVC_IMG.get(s["slug"], "hero")) +
        '<section class="px-section"><div class="wrap"><div class="two-col" data-reveal>'
        '<div><p class="tag">What\'s included</p><h2>What we <em class="serif">deliver.</em></h2>'
        '<ul class="checks">%s</ul></div>'
        '<div class="impact"><h3>Business impact</h3><ul>%s</ul></div>'
        '</div></div></section>'
        '<section class="px-section alt"><div class="wrap"><div class="px-head" data-reveal>'
        '<p class="tag">How we work</p><h2>A clear path to <em class="serif">value.</em></h2></div>'
        '<div class="steps-row" data-reveal>%s</div></div></section>'
        '<section class="px-section"><div class="wrap"><div class="px-head" data-reveal>'
        '<p class="tag">Related</p><h2>Keep <em class="serif">exploring.</em></h2></div>'
        '<div class="minis" data-reveal>%s</div></div></section>'
        % (checks, impact, steps, related)
    )
    return body


def services_index():
    p = ""
    ag = "".join(mini_card(p, s) for s in AGENTIC)
    co = "".join(mini_card(p, s) for s in CORE)
    crumb = '<a href="index.html">Home</a> / Services'
    return (
        px_hero(p, crumb, "Services", 'Everything it takes to be <em class="serif">AI-first.</em>',
                "Ten focused services across agentic AI and core Google technology — each scoped to a measurable outcome, each a step toward an AI-first operating model.", "agentic-ai") +
        '<section class="px-section"><div class="wrap"><div class="px-head" data-reveal>'
        '<p class="tag">Agentic AI</p><h2>AI that does the <em class="serif">work.</em></h2></div>'
        '<div class="minis" data-reveal>%s</div></div></section>'
        '<section class="px-section alt"><div class="wrap"><div class="px-head" data-reveal>'
        '<p class="tag">Core services</p><h2>The <em class="serif">foundation.</em></h2></div>'
        '<div class="minis" data-reveal>%s</div></div></section>' % (ag, co)
    )


def about_page():
    p = ""
    crumb = '<a href="index.html">Home</a> / About'
    return (
        px_hero(p, crumb, "About us", 'Operators building the <em class="serif">AI-first</em> enterprise.',
                "Velivance is a Google-first AI, data and cloud transformation firm — launched and backed by Avanciers, with a singular focus on turning Google technology into measurable business outcomes.", "about") +
        '<section class="px-section"><div class="wrap"><div class="two-col" data-reveal>'
        '<div><p class="tag">Our story</p><h2>Specialist by <em class="serif">design.</em></h2>'
        '<p class="sub" style="margin-bottom:18px">The market is full of generalists juggling three clouds. We chose the opposite path: go deep on Google. As a Certified Google Cloud Partner, we pair that focus with a decade of enterprise delivery from our parent, Avanciers.</p>'
        '<p class="sub">The name carries the mandate: <em class="serif">velox</em> &mdash; Latin for swift &mdash; joined with advance. Move fast, move forward &mdash; securely.</p></div>'
        '<div class="impact"><h3>What we believe</h3><ul>'
        '<li>Specialization beats breadth</li><li>Agents should act, not just answer</li>'
        '<li>Every engagement has a measurable result</li><li>AI must be secure and governed</li>'
        '<li>Prove it on ourselves first</li></ul></div></div></div></section>'
        '<section class="px-section alt"><div class="wrap"><div class="px-head" data-reveal>'
        '<p class="tag">Leadership</p><h2>Operators who have <em class="serif">built</em> this before.</h2></div>'
        '<div class="team" data-reveal>'
        '<div class="member vet"><div class="av">&#9733;</div><h3>[Industry Veteran]</h3><p class="role">Chairman &amp; Strategic Advisor</p><p>Three decades scaling enterprise technology businesses. Bio to confirm.</p></div>'
        '<div class="member"><div class="av">VW</div><h3>Vik Wahi</h3><p class="role">Co-Founder &amp; CEO</p><p>Co-founder of Avanciers. Builds the data, AI and analytics systems that prove the model before it ships to clients.</p></div>'
        '<div class="member"><div class="av">AW</div><h3>Adi Wahi</h3><p class="role">Co-Founder</p><p>Co-founder of Avanciers. Leads partnerships and the Google-first go-to-market across North America.</p></div>'
        '</div></div></section>'
        '<section class="px-section"><div class="wrap"><div class="two-col" data-reveal>'
        '<div><p class="tag">Backed by Avanciers</p><h2>A startup\'s focus. An established firm\'s <em class="serif">backbone.</em></h2>'
        '<p class="sub" style="margin-bottom:22px">Avanciers is a women-owned global talent and technology firm operating since 2014 across Canada, the USA, Mexico and India, serving Big-4 and Tier-1 enterprises.</p>'
        '<div class="creds"><span class="cred">Certified Google Cloud Partner (Strategic)</span>'
        '<span class="cred">Certified Salesforce Partner</span><span class="cred">Women-owned &amp; diversity-certified</span>'
        '<span class="cred">OECM Supplier Partner</span><span class="cred">ISO 27001 &middot; ISO 42001 &middot; SOC 2 &middot; GDPR &mdash; in progress</span></div></div>'
        '<div class="impact"><h3>Trusted by leading enterprises &amp; system integrators</h3>'
        '<div class="logos-row"><span>Deloitte</span><span>Wipro</span><span>Infosys</span><span>Cognizant</span>'
        '<span>Tech Mahindra</span><span>Mphasis</span><span>Sonata</span><span>ABB</span></div>'
        '<p style="font-size:.84rem;color:var(--muted-2);margin:20px 0 0">4 entities &middot; 350+ families supported through our consultant network.</p>'
        '</div></div></div></section>'
    )


def partnership_page():
    p = ""
    crumb = '<a href="index.html">Home</a> / Partnership'
    gproducts = [("Gemini", "Agents & generative AI"), ("Vertex AI", "Model platform & MLOps"),
                 ("BigQuery", "Data warehouse & analytics"), ("Looker", "BI & decision intelligence"),
                 ("Google Workspace", "Productivity & collaboration"), ("Cloud Run", "Serverless applications"),
                 ("Firebase", "App & product platform"), ("Maps Platform", "Location intelligence")]
    gp = "".join('<div class="gchip"><b>%s</b><span>%s</span></div>' % (n, d) for n, d in gproducts)
    return (
        px_hero(p, crumb, "The Google advantage", 'A Certified Google Cloud <em class="serif">Partner.</em>',
                "We concentrate on one ecosystem so you get depth, not breadth — and the benefits of Google's partner programs on every engagement.", "platform") +
        '<section class="px-section"><div class="wrap"><div class="props" data-reveal>'
        '<div class="prop"><h3>Co-sell &amp; funding</h3><p>Access to Google co-sell motions and funded proofs-of-concept that lower the cost of getting started.</p></div>'
        '<div class="prop"><h3>Marketplace</h3><p>Procure our solutions through Google Cloud Marketplace, drawing down committed spend.</p></div>'
        '<div class="prop"><h3>Certified expertise</h3><p>Engineers certified across Google Cloud, data and AI &mdash; kept current as the platform evolves.</p></div>'
        '<div class="prop"><h3>Early access</h3><p>Hands-on with the latest Gemini, Vertex AI and Workspace capabilities as they ship.</p></div>'
        '</div></div></section>'
        '<section class="px-section alt"><div class="wrap"><div class="px-head" data-reveal>'
        '<p class="tag">The stack</p><h2>Every layer of the AI-first <em class="serif">enterprise.</em></h2></div>'
        '<div class="gchips" data-reveal>%s</div></div></section>' % gp
    )


def insights_index():
    p = ""
    crumb = '<a href="index.html">Home</a> / Insights'
    imgmap = {"enterprise-ai-agents-from-pilot-to-production": "insight-pilot",
              "we-ran-our-own-company-on-google": "insight-google"}
    cards = "".join(
        '<a class="mini" href="insights/%s.html"><div class="mm"><img src="assets/img/%s.webp" alt="" loading="lazy"></div>'
        '<div class="mb"><span class="mono">%s</span><h3>%s</h3><p>%s</p></div></a>'
        % (a["slug"], imgmap.get(a["slug"], "insight-pilot"), a["kind"].upper(), a["title"], a["dek"]) for a in ARTICLES)
    cards += ('<div class="mini"><div class="mm"><img src="assets/img/insight-data.webp" alt="" loading="lazy"></div>'
              '<div class="mb"><span class="mono">PLAYBOOK &middot; SOON</span><h3>Your BigQuery + Looker decision foundation</h3>'
              '<p>A practical sequence for turning scattered data into decisions leaders trust.</p></div></div>')
    return (
        px_hero(p, crumb, "Insights", 'Ideas on AI-first <em class="serif">business.</em>',
                "Practical points of view on building, governing and scaling AI on Google — written for operators, not hype.", "insight-pilot") +
        '<section class="px-section"><div class="wrap"><div class="posts" data-reveal>%s</div></div></section>' % cards
    )


def article_page(a):
    p = "../"
    imgmap = {"enterprise-ai-agents-from-pilot-to-production": "insight-pilot",
              "we-ran-our-own-company-on-google": "insight-google"}
    crumb = '<a href="%sindex.html">Home</a> / <a href="%sinsights.html">Insights</a> / %s' % (p, p, a["kind"])
    metrics = ""
    if a.get("metrics"):
        metrics = '<div class="art-metrics">%s</div>' % "".join(
            '<div><div class="m">%s</div><div class="l">%s</div></div>' % (m, l) for m, l in a["metrics"])
    body_html = "".join(a["body"]).replace('class="callout"', 'class="callout"')
    return (
        px_hero(p, crumb, "%s · %s · %s" % (a["kind"], a["topic"], a["date"]), a["title"], a["dek"],
                imgmap.get(a["slug"], "insight-pilot")) +
        '<section class="px-section"><div class="wrap">%s<div class="prose" data-reveal>%s</div>'
        '<p style="margin-top:46px"><a class="btn btn-line" href="%sinsights.html" data-magnetic>&larr; All insights</a></p>'
        '</div></section>' % (metrics, body_html, p)
    )


def contact_page():
    p = ""
    crumb = '<a href="index.html">Home</a> / Contact'
    return (
        px_hero(p, crumb, "Talk to us", 'Let\'s scope your first <em class="serif">win.</em>',
                "Tell us the workflow, decision or migration you want to tackle. We'll come back with a focused, fixed-scope way to start — usually a 4–6 week pilot.", "consultant") +
        '<section class="px-section"><div class="wrap"><div class="contact-grid" data-reveal>'
        '<div>'
        '<div class="ci"><div class="ic">&#9993;</div><div><h3>Email</h3><p><a href="mailto:hello@velivance.com">hello@velivance.com</a></p></div></div>'
        '<div class="ci"><div class="ic">&#9201;</div><div><h3>Response time</h3><p>We reply within one business day.</p></div></div>'
        '<div class="ci"><div class="ic">&#127757;</div><div><h3>Where we operate</h3><p>Through Avanciers &mdash; Canada, USA, Mexico and India.</p></div></div>'
        '</div>'
        '<form class="form-x" data-mailto-form novalidate><h3>Start a project</h3>'
        '<div class="fx"><label for="name">Name</label><input id="name" name="name" type="text" required placeholder="Your name"></div>'
        '<div class="fx"><label for="email">Work email</label><input id="email" name="email" type="email" required placeholder="you@company.com"></div>'
        '<div class="fx"><label for="company">Company</label><input id="company" name="company" type="text" placeholder="Company name"></div>'
        '<div class="fx"><label for="interest">I\'m interested in</label><select id="interest" name="interest">'
        '<option>Enterprise AI agents</option><option>Data &amp; decision intelligence</option>'
        '<option>Google Cloud migration</option><option>Workspace + Gemini rollout</option>'
        '<option>Not sure yet &mdash; let\'s talk</option></select></div>'
        '<div class="fx"><label for="msg">What do you want to tackle first?</label>'
        '<textarea id="msg" name="msg" rows="3" placeholder="A sentence is plenty."></textarea></div>'
        '<button type="submit" class="btn btn-solid">Compose email &rarr;</button>'
        '<p class="form-note">Submits via your email app to hello@velivance.com. No data is stored on this site.</p>'
        '</form></div></div></section>'
    )


def privacy_page():
    p = ""
    crumb = '<a href="index.html">Home</a> / Legal'
    return (
        px_hero(p, crumb, "Legal", 'Privacy, cookies &amp; <em class="serif">terms.</em>',
                "Plain-language placeholders pending counsel review before public launch.", "core-services") +
        '<section class="px-section"><div class="wrap"><div class="prose" data-reveal>'
        '<h2>Privacy</h2><p>This site does not set tracking cookies and does not store form submissions &mdash; the contact form composes an email in your own mail client. If you email us, we use your details only to respond to your inquiry.</p>'
        '<h2>Cookies</h2><p>No analytics or advertising cookies are used on this site.</p>'
        '<h2>Terms</h2><p>Content is provided for general information about Velivance services and is offered without warranty. Trademarks and product names (including Google, Google Cloud, Gemini, BigQuery and Looker) belong to their respective owners.</p>'
        '<p>Questions? <a href="contact.html">Contact us</a>.</p>'
        '</div></div></section>'
    )


def write(path, title, desc, body, active, cta=True):
    p = "../" * path.count("/")
    html = head(p, title, desc) + header(p, active) + "<main>" + body + "</main>" + footer(p, cta)
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full) or BASE, exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(html)
    return path


pages = []
pages.append(write("services.html", "Services — %s" % BRAND,
                   "Ten focused services across agentic AI and core Google technology.", services_index(), "Services"))
for s in ALL_SERVICES:
    pages.append(write("services/%s.html" % s["slug"], "%s — %s" % (s["name"], BRAND),
                       s["intro"][:155], service_page(s), "Services"))
pages.append(write("about.html", "About — %s" % BRAND,
                   "Operators building the AI-first enterprise. Launched and backed by Avanciers.", about_page(), "About"))
pages.append(write("partnership.html", "Partnership — %s" % BRAND,
                   "A Certified Google Cloud Partner — co-sell, funded POCs and Marketplace access.", partnership_page(), "Partnership"))
pages.append(write("insights.html", "Insights — %s" % BRAND,
                   "Practical points of view on building, governing and scaling AI on Google.", insights_index(), "Insights"))
for a in ARTICLES:
    pages.append(write("insights/%s.html" % a["slug"], "%s — %s" % (a["title"], BRAND),
                       a["dek"][:155], article_page(a), "Insights"))
pages.append(write("contact.html", "Contact — %s" % BRAND,
                   "Talk to us about building your AI-first business on Google.", contact_page(), "Contact", cta=False))
pages.append(write("privacy.html", "Legal — %s" % BRAND,
                   "Privacy, cookies and terms for the Velivance website.", privacy_page(), ""))

print("Generated %d inner pages (+ index.html hand-authored):" % len(pages))
for pg in pages:
    print("  ", pg)
