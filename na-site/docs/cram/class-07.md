# Class 7 cram sheet: Building for Failures

Every key fact of the class, in the order the instructor taught it.
This file is a fallback for the quiz on 2026-10-12. The fast read at `/s07/digest/`
teaches the same facts with pictures and questions.

Source: `docs/curriculum/session-07.md`, 223 facts in total, 110 of them here.
A slide number is a page of the PDF.

| # | ID | Fact | Slide | Kind |
|---|---|---|---|---|
| 1 | S07-C12 | The class teaches one discipline: fail on purpose. | `slide 6` | core |
| 2 | S07-C17 | A linger option of 1 and 0 makes close send RST instead of FIN. | `slide 8`, `lesson1/05_sigpipe_client.c` lines 15-17 | core |
| 3 | S07-C18 | Slide 8 prints port 8080. The repo file uses 2026, the echo server port. | `slide 8`, `lesson1/05_sigpipe_client.c` line 10 | correction |
| 4 | S07-C19 | Every failure of this class sits on the timeline of one request. | `slide 9` | core |
| 5 | S07-C21 | The six: DNS, TCP handshake, TLS handshake, request write, server work, response read. | `slide 10` | core |
| 6 | S07-C27 | Nothing fails generically. The stage decides whether a retry can help. | `slide 10` | core |
| 7 | S07-C28 | A DNS timeout and a read timeout both write "timeout" in your logs. | `slide 10` | core |
| 8 | S07-C29 | They are completely different problems. One never reached a server. | `slide 10` | correction |
| 9 | S07-C30 | The other reached a server that may have half-done the work. | `slide 10` | core |
| 10 | S07-C32 | This class adds one question to every status: will a second try differ? | `slide 11` | core |
| 11 | S07-C35 | 3xx says ask again somewhere else, maybe with a different method. Retry depends. | `slide 11` | core |
| 12 | S07-C36 | 4xx means the server refuses those same bytes every time. Usually no retry. | `slide 11` | core |
| 13 | S07-C37 | 5xx means the server admits that it failed. Usually retry. | `slide 11` | core |
| 14 | S07-C38 | A 5xx says nothing about whether the server changed anything. | `slide 11` | correction |
| 15 | S07-C39 | "Will anything be different next time?" is the entire retry decision. | `slide 11` | core |
| 16 | S07-C41 | A retry is the exact same step again, with nothing changed. | `slide 13` | core |
| 17 | S07-C43 | A retry bets that the same action gives a different result. | `slide 13` | core |
| 18 | S07-C45 | Three transient causes: a network blink, a brief overload, an unhealthy backend. | `slide 13` | core |
| 19 | S07-C46 | A token refresh plus the same call is a different request, not a retry. | `slide 13` | correction |
| 20 | S07-C48 | Auth that fails outright needs a different credential, not another attempt. | `slide 13` | core |
| 21 | S07-C49 | The test: with nothing changed and only a wait, is attempt 2 identical? | `slide 13` | core |
| 22 | S07-C50 | A new token, a different endpoint or an altered payload means you are handling. | `slide 13` | core |
| 23 | S07-C51 | Classify by nature and severity before you touch a retry counter. | `slide 14` | core |
| 24 | S07-C54 | Q2: a 5xx says "I failed". A 4xx says "you failed". | `slide 15` | core |
| 25 | S07-C55 | Q3: idempotent means the same effect however many times it runs. | `slide 15` | core |
| 26 | S07-C56 | Q4: will a 200 ms wait change anything, or is the resource really gone? | `slide 15` | core |
| 27 | S07-C58 | A 404 resource that does not exist now will not exist 200 ms from now. | `slide 16` | core |
| 28 | S07-C60 | A failure before the handshake finished never reached a server at all. | `slide 16` | core |
| 29 | S07-C62 | A geo-block refuses by policy, not by accident. No retry changes geography. | `slide 16` | core |
| 30 | S07-C63 | A preflight failure means the client already refused the real request. | `slide 16` | core |
| 31 | S07-C65 | Auth failure is not "do not handle it". Handle it with a token refresh. | `slide 16` | correction |
| 32 | S07-C66 | Two families deserve a retry: the server admits fault, or the environment shifted. | `slide 17` | core |
| 33 | S07-C67 | The retryable 5xx codes on the slide are 500, 502, 503 and 504. | `slide 17` | core |
| 34 | S07-C68 | A connection timeout means you never got a socket. Retry. | `slide 17` | core |
| 35 | S07-C69 | A read timeout means you had a socket, then it went quiet. Retry. | `slide 17` | core |
| 36 | S07-C70 | A DNS server with no answer at all is retryable. "No record" is not. | `slide 17` | core |
| 37 | S07-C71 | A network switch mid-flight, such as 4G to 5G, is retryable. | `slide 17` | core |
| 38 | S07-C76 | GET, PUT and DELETE are idempotent, so a blind retry is safe. | `slide 18` | core |
| 39 | S07-C79 | POST is not idempotent. Charging the card twice means two charges. | `slide 18` | core |
| 40 | S07-C80 | Retry a POST after a timeout only with an idempotency key. | `slide 18` | core |
| 41 | S07-C81 | With no response you do not know whether the server finished the work. | `slide 18` | core |
| 42 | S07-C83 | The fix is not "do not retry". The fix lets the server recognise attempt 2. | `slide 18` | correction |
| 43 | S07-C84 | The client sends an idempotency key. The server checks it and deduplicates. | `slide 18` | core |
| 44 | S07-C87 | The first loop everyone writes catches the timeout and continues at once, forever. | `slide 20` | core |
| 45 | S07-C88 | With no max count a permanently-down dependency becomes an infinite loop. | `slide 20` | core |
| 46 | S07-C89 | With no delay every client hammers the upstream at wire speed. | `slide 20` | core |
| 47 | S07-C90 | With no coordination every retry loop fires on the same tick after recovery. | `slide 20` | core |
| 48 | S07-C91 | That is the thundering herd. It can re-crash a server that just came back up. | `slide 20` | core |
| 49 | S07-C92 | The live loop takes max_attempts 5, base 0.2 s and cap 8.0 s. | `slide 21` | core |
| 50 | S07-C93 | The delay is min(cap, base times 2 to the attempt), then uniform(0, delay). | `slide 21` | core |
| 51 | S07-C97 | Exponential growth spaces retries out, so load on the upstream decays. | `slide 21` | core |
| 52 | S07-C98 | Full jitter decorrelates clients. | `slide 21` | core |
| 53 | S07-C99 | Full jitter is uniform(0, delay), not the delay plus or minus a little. | `slide 21` | correction |
| 54 | S07-C100 | Without jitter every client computes the same delay and retries in lockstep. | `slide 21` | core |
| 55 | S07-C104 | A 429 means a rate limit. The server is fine. You ask too fast. | `slide 22` | core |
| 56 | S07-C105 | Honor Retry-After. Do not add your own backoff on top of it. | `slide 22` | correction |
| 57 | S07-C106 | A 503 often carries Retry-After during maintenance or load shedding. | `slide 22` | core |
| 58 | S07-C109 | A 408 retry is fine. Nothing about the request itself got rejected. | `slide 22` | core |
| 59 | S07-C114 | CLOSED: requests flow through normally, and the breaker counts failures. | `slide 23` | core |
| 60 | S07-C115 | OPEN: the failure threshold broke, so requests fail instantly and locally. | `slide 23` | core |
| 61 | S07-C117 | HALF-OPEN: after a cooldown, one probe request goes through. | `slide 23` | core |
| 62 | S07-C118 | A probe success closes the breaker. A probe failure opens it again. | `slide 23` | core |
| 63 | S07-C119 | Backoff protects an upstream from one client. A breaker protects it from a fleet. | `slide 23` | core |
| 64 | S07-C121 | A breaker is the max-retry idea one level up: cap failures per dependency. | `slide 23` | correction |
| 65 | S07-C127 | A player fails silently: a frozen frame, or a spinner the user stares at. | `slide 25` | core |
| 66 | S07-C128 | One play session makes hundreds of requests: manifest, key, dozens of segments. | `slide 25` | core |
| 67 | S07-C130 | Some player failures are not network failures at all. | `slide 25` | core |
| 68 | S07-C132 | The right answer is often a different stream, not a retry. | `slide 25` | core |
| 69 | S07-C133 | The retry budget is human. A viewer takes seconds of rebuffering, not minutes. | `slide 25` | core |
| 70 | S07-C136 | A network switch can change the IP mid-download. The request is dead, not slow. | `slide 26` | core |
| 71 | S07-C138 | A multi-CDN player switches CDN instead of retrying the same dead edge. | `slide 26` | core |
| 72 | S07-C139 | A 404 on a live segment can have a real cause. | `slide 27` | correction |
| 73 | S07-C142 | The fix is a short bounded retry: 2 or 3 attempts, a small fixed delay. | `slide 27` | core |
| 74 | S07-C143 | That retry belongs to live-edge segment requests and nowhere else. | `slide 27` | core |
| 75 | S07-C144 | A 404 on an on-demand asset still means give up. | `slide 27` | core |
| 76 | S07-C148 | The lesson is not the numbers. Your own codes need the same discipline. | `slide 27` | core |
| 77 | S07-C150 | Sometimes the answer is a fallback, not a retry. | `slide 28` | correction |
| 78 | S07-C151 | A denied DRM key and an unsupported codec are not transient, so both need a fallback. | `slide 28` | core |
| 79 | S07-C161 | That failure lives in device media state, not in a request at all. | `slide 28` | core |
| 80 | S07-C162 | Retry an entitlement check that times out. Do not retry a clean "not entitled". | `slide 29` | core |
| 81 | S07-C164 | The response body, not only the status code, can carry a signal. | `slide 29` | core |
| 82 | S07-C167 | A mature retry policy reads application-layer signals too. | `slide 29` | core |
| 83 | S07-C168 | What survives is not the request. It is the system. | `slide 30` | core |
| 84 | S07-C169 | Fastly: 85% of its network returned errors on 8 June 2021. | `slide 31` | measured |
| 85 | S07-C170 | Fastly took about 1 minute to detect the fault. | `slide 31` | measured |
| 86 | S07-C171 | Fastly took 49 minutes to reach 95% recovered. | `slide 31` | measured |
| 87 | S07-C173 | Today's edge survives a dead origin, because a cache can serve a stale hit. | `slide 31` | core |
| 88 | S07-C174 | The new question: what happens when the edge or a whole region dies? | `slide 31` | core |
| 89 | S07-C175 | The stale-if-error directive (RFC 5861) points the same idea the other way. | `slide 31` | core |
| 90 | S07-C177 | stale-if-error is not a retry. It serves known-stale data instead of nothing. | `slide 31` | correction |
| 91 | S07-C178 | A system that can answer with slightly-wrong data survives more outages. | `slide 31` | core |
| 92 | S07-C180 | Failover: a breaker trips OPEN on the primary and routes to a backup. | `slide 32` | core |
| 93 | S07-C183 | A feature flag turns off the expensive part with no deploy, in seconds. | `slide 32` | core |
| 94 | S07-C185 | Graceful degradation answers smaller, not "no". | `slide 32` | core |
| 95 | S07-C188 | Recovery is the most dangerous moment of an incident, not the failure. | `slide 33` | correction |
| 96 | S07-C189 | Every client that was retrying, backing off or waiting now tries again. | `slide 33` | core |
| 97 | S07-C190 | They all started failing at the same moment, so their backoff schedules line up. | `slide 33` | core |
| 98 | S07-C194 | Three mitigations: jitter, staggered half-open probes, slow start on the server. | `slide 33` | core |
| 99 | S07-C196 | One flowchart covers every failure of the class, in five steps. | `slide 34` | core |
| 100 | S07-C197 | Step 1, classify: where did it fail, 5xx or 4xx, idempotent? | `slide 34` | core |
| 101 | S07-C198 | Step 2, structural: 404, geo-block, preflight, bad auth. Stop and handle. | `slide 34` | core |
| 102 | S07-C199 | Step 3, transient: back off with full jitter, cap attempts, honor Retry-After. | `slide 34` | core |
| 103 | S07-C200 | Step 4, dependency level: repeated failures trip a breaker, so you fail fast. | `slide 34` | core |
| 104 | S07-C201 | Step 5, no good answer left: fail over, degrade, or serve stale. | `slide 34` | core |
| 105 | S07-C205 | The wrapper must classify retryable against not retryable, by this class rules. | `slide 35` | core |
| 106 | S07-C206 | It must back off with full jitter, capped at a max attempt count. | `slide 35` | core |
| 107 | S07-C207 | It must honor a Retry-After header when the server sends one. | `slide 35` | core |
| 108 | S07-C208 | It must open a circuit after N consecutive failures to one dependency, then fail fast. | `slide 35` | core |
| 109 | S07-C221 | Every fallback of this class answers with something worse than the ideal. | `slide 37` | core |
| 110 | S07-C222 | The closing question: when does "worse" stop being acceptable, and who decides? | `slide 37` | core |
