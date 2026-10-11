# Session 7: Building for Failures

## 1. Header

- **Title:** Building for Failures. Deck title "Building for Failures".
- **Date:** Friday 2026-09-25. Slide 4 prints "Today" under the assignment row of 25th Sep, Friday, and `date` confirms that 2026-09-25 is a Friday.
- **Subtitle, in the instructor words:** "Timeouts, retries, backoff, circuit breakers, and what a video player does when the network lies to it."
- **Agenda line:** "One discipline: fail on purpose."
- **Written:** 2026-10-09, from the complete 37-page deck. First version. No lesson page uses these IDs yet.
- **Next artifact:** a digest page, `s07-digest`, before the quiz of Monday 2026-10-12. The `core` rows of section 3 are its checklist (`docs/PEDAGOGY.md` section 3, rule 1).

**Sources used**

| Path | What it gives | Trust |
|---|---|---|
| `sources/session-07/slides.txt` | 37 PDF pages, complete, from `pdftotext -layout` | high |
| `cn-at-scaler/lesson1/01_echo_server.c` | the server that slide 7 reprints | high |
| `cn-at-scaler/lesson1/05_sigpipe_client.c` | the client that slide 8 reprints | high |
| RFC 9110, RFC 6585, RFC 5861, RFC 9111, RFC 5789 from rfc-editor.org | the checks in sections 6 and 7 | high |
| Fastly blog "Summary of June 8 outage", 8 June 2021 | the three numbers of slide 31 | high |
| AWS Architecture Blog, Marc Brooker, 4 March 2015 | the full-jitter credit of slide 21 | high |

**Source gaps.** The instructor repo has no `lesson7` folder, so no code backs sections 2 to 6 of this class. No transcript and no AI notes exist. The slides name four outside sources that the repo does not hold: an internal retry-taxonomy review, three mindmaps ("no point in retrying", "how do we retry", "network issues", "codec/DRM fallback", "stream issue"), the 96-mode player taxonomy, and a Fastly postmortem "linked in notes". Nobody has the notes. So the case-study claims rest on the slide text alone.

**Checks run for this file (2026-10-09).**
- The backoff series of slide 21 recomputed by hand and in Python: ceiling delays 0.2, 0.4, 0.8 and 1.6 s, and a total sleep ceiling of 3.0 s.
- The cap of 8.0 s first binds at attempt 6, so it never binds with `max_attempts=5`.
- A 4-million-draw simulation of the full-jitter schedule: a client makes 4.05 calls in the first second, on average.
- Both `lesson1` files read and compared with the slide reprints. The client port differs.
- Every named source checked against the RFC text or the original page. See section 6.
- `date -d` run for each course date of slide 4.

**Confidence.** High on the deck content and on every outside reference. Medium on the case study, because the deck condenses a taxonomy that this repo does not hold. Low on nothing.

## 2. The session in one paragraph

A remote call is not a function call. It can fail at six different places, and only one of those places means "the server tried and failed". So the class teaches one move: name the failure before you choose the response. A 404 and a 503 both arrive as a number, but one says "never" and the other says "not now". Get that wrong in the cheap direction and you give up on work that would have worked. Get it wrong in the expensive direction and you hammer a sick server until it dies, then hammer it again the second it recovers. The repair is small and exact: classify, back off with real randomness, cap the attempts, and cap the failures per dependency with a circuit breaker. Then the class turns the lens around. A video player makes hundreds of requests on one timeline that a human watches, so for a player the right answer is often not a retry at all. It is a different CDN, a lower bitrate, or a stale copy. What survives an outage is not the request. It is a system that can answer with something worse than the ideal.

## 3. Claim inventory

Core count: 94 of 223.

"Slide N" is page N of the PDF, never the number in the slide footer. The deck
cross-references itself by footer number, and the two differ. Footer `N/32`
maps to PDF page N+3 for footers 2 and 3, and to PDF page N+5 from footer 4
onward, because the two code slides (PDF 7 and 8) carry no footer. Section 7
item 2 lists every internal reference and its PDF page.

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S07-C01 | The class covers timeouts, retries, backoff, circuit breakers and one video player. | `slide 1` | story |
| S07-C02 | The subtitle says the network lies to the player. | `slide 1` | story |
| S07-C03 | The Session 5 calculator assignment was due before this class. | `slide 2` | detail |
| S07-C04 | The slide repeats the hard part: find where one request ends. | `slide 2` | detail |
| S07-C05 | The binary HTTP project runs in pairs, and only the spec crosses between them. | `slide 3` | detail |
| S07-C06 | A receiver that meets an unknown frame type must skip it cleanly. | `slide 3` | detail |
| S07-C07 | Quiz 1 ran on Monday 21 September. Quiz 2 is Monday 12 October. | `slide 4` | story |
| S07-C08 | The assignment is due Friday 25 September, the day of this class. | `slide 4` | story |
| S07-C09 | The project is due 8 October. | `slide 4` | story |
| S07-C10 | The deck map puts "Building for failures" in week 7 of 8. | `slide 5` | story |
| S07-C11 | The deck map puts "Streaming video at large scale" in week 8. | `slide 5` | story |
| S07-C12 | The class teaches one discipline: fail on purpose. | `slide 6` | core |
| S07-C13 | Six sections: taxonomy, the definition, when, how, the player, systems. | `slide 6` | detail |
| S07-C14 | The instructor builds the retry loop live with the class. | `slide 6` | story |
| S07-C15 | The class 1 echo server returns the bytes you send, one time, then closes. | `slide 7`, `lesson1/01_echo_server.c` | detail |
| S07-C16 | That server binds port 2026 and calls listen with a backlog of 1. | `slide 7`, `lesson1/01_echo_server.c` lines 10-12 | detail |
| S07-C17 | A linger option of 1 and 0 makes close send RST instead of FIN. | `slide 8`, `lesson1/05_sigpipe_client.c` lines 15-17 | core |
| S07-C18 | Slide 8 prints port 8080. The repo file uses 2026, the echo server port. | `slide 8`, `lesson1/05_sigpipe_client.c` line 10 | correction |
| S07-C19 | Every failure of this class sits on the timeline of one request. | `slide 9` | core |
| S07-C20 | One request has six places to fail, in this order. | `slide 10` | detail |
| S07-C21 | The six: DNS, TCP handshake, TLS handshake, request write, server work, response read. | `slide 10` | core |
| S07-C22 | DNS turns a name into an IP address. The handshake is SYN, SYN-ACK, ACK. | `slide 10` | detail |
| S07-C23 | The TLS stage carries the certificate and the key exchange. | `slide 10` | detail |
| S07-C24 | Stage 4 is the moment your bytes leave your socket. | `slide 10` | detail |
| S07-C25 | Stage 5 is the server problem, and it becomes your problem too. | `slide 10` | detail |
| S07-C26 | Stage 6 is bytes that arrive, or bytes that stop arriving. | `slide 10` | detail |
| S07-C27 | Nothing fails generically. The stage decides whether a retry can help. | `slide 10` | core |
| S07-C28 | A DNS timeout and a read timeout both write "timeout" in your logs. | `slide 10` | core |
| S07-C29 | They are completely different problems. One never reached a server. | `slide 10` | correction |
| S07-C30 | The other reached a server that may have half-done the work. | `slide 10` | core |
| S07-C31 | Session 5 taught what each status class means. | `slide 11` | detail |
| S07-C32 | This class adds one question to every status: will a second try differ? | `slide 11` | core |
| S07-C33 | 1xx is interim. Keep listening. A retry does not apply. | `slide 11` | detail |
| S07-C34 | 2xx means the server did the thing. No retry is needed. | `slide 11` | detail |
| S07-C35 | 3xx says ask again somewhere else, maybe with a different method. Retry depends. | `slide 11` | core |
| S07-C36 | 4xx means the server refuses those same bytes every time. Usually no retry. | `slide 11` | core |
| S07-C37 | 5xx means the server admits that it failed. Usually retry. | `slide 11` | core |
| S07-C38 | A 5xx says nothing about whether the server changed anything. | `slide 11` | correction |
| S07-C39 | "Will anything be different next time?" is the entire retry decision. | `slide 11` | core |
| S07-C40 | The retry definition separates a disciplined system from one that decays under load. | `slide 12` | detail |
| S07-C41 | A retry is the exact same step again, with nothing changed. | `slide 13` | core |
| S07-C42 | Same method, same body, same headers that matter. | `slide 13` | detail |
| S07-C43 | A retry bets that the same action gives a different result. | `slide 13` | core |
| S07-C44 | The bet rests on a belief that the failure was transient. | `slide 13` | detail |
| S07-C45 | Three transient causes: a network blink, a brief overload, an unhealthy backend. | `slide 13` | core |
| S07-C46 | A token refresh plus the same call is a different request, not a retry. | `slide 13` | correction |
| S07-C47 | The new Authorization header answers information the server just gave you. | `slide 13` | detail |
| S07-C48 | Auth that fails outright needs a different credential, not another attempt. | `slide 13` | core |
| S07-C49 | The test: with nothing changed and only a wait, is attempt 2 identical? | `slide 13` | core |
| S07-C50 | A new token, a different endpoint or an altered payload means you are handling. | `slide 13` | core |
| S07-C51 | Classify by nature and severity before you touch a retry counter. | `slide 14` | core |
| S07-C52 | Four questions classify a failure. | `slide 15` | detail |
| S07-C53 | Q1: did it fail before a connection existed, or after? | `slide 15` | detail |
| S07-C54 | Q2: a 5xx says "I failed". A 4xx says "you failed". | `slide 15` | core |
| S07-C55 | Q3: idempotent means the same effect however many times it runs. | `slide 15` | core |
| S07-C56 | Q4: will a 200 ms wait change anything, or is the resource really gone? | `slide 15` | core |
| S07-C57 | Five cases give no point to a retry. | `slide 16` | detail |
| S07-C58 | A 404 resource that does not exist now will not exist 200 ms from now. | `slide 16` | core |
| S07-C59 | The 404 rule has one named exception, the CDN propagation case of slide 27. | `slide 16` | detail |
| S07-C60 | A failure before the handshake finished never reached a server at all. | `slide 16` | core |
| S07-C61 | So nothing about "the server" failed, and the same broken path burns time twice. | `slide 16` | detail |
| S07-C62 | A geo-block refuses by policy, not by accident. No retry changes geography. | `slide 16` | core |
| S07-C63 | A preflight failure means the client already refused the real request. | `slide 16` | core |
| S07-C64 | CORS and mixed content are the named cases. The real request never left. | `slide 16` | detail |
| S07-C65 | Auth failure is not "do not handle it". Handle it with a token refresh. | `slide 16` | correction |
| S07-C66 | Two families deserve a retry: the server admits fault, or the environment shifted. | `slide 17` | core |
| S07-C67 | The retryable 5xx codes on the slide are 500, 502, 503 and 504. | `slide 17` | core |
| S07-C68 | A connection timeout means you never got a socket. Retry. | `slide 17` | core |
| S07-C69 | A read timeout means you had a socket, then it went quiet. Retry. | `slide 17` | core |
| S07-C70 | A DNS server with no answer at all is retryable. "No record" is not. | `slide 17` | core |
| S07-C71 | A network switch mid-flight, such as 4G to 5G, is retryable. | `slide 17` | core |
| S07-C72 | A CDN edge or load balancer that momentarily refuses is retryable. | `slide 17` | detail |
| S07-C73 | A cache miss is retryable, because an upstream fetch repopulates the cache. | `slide 17` | detail |
| S07-C74 | A TLS handshake failure on an otherwise-healthy host is retryable. | `slide 17` | detail |
| S07-C75 | Idempotency decides whether a blind retry is even safe. | `slide 18` | detail |
| S07-C76 | GET, PUT and DELETE are idempotent, so a blind retry is safe. | `slide 18` | core |
| S07-C77 | Reading twice changes nothing. Setting X twice still gives X. | `slide 18` | detail |
| S07-C78 | Already gone stays already gone, so a second DELETE costs nothing. | `slide 18` | detail |
| S07-C79 | POST is not idempotent. Charging the card twice means two charges. | `slide 18` | core |
| S07-C80 | Retry a POST after a timeout only with an idempotency key. | `slide 18` | core |
| S07-C81 | With no response you do not know whether the server finished the work. | `slide 18` | core |
| S07-C82 | A blind retry of a non-idempotent action can double-execute. | `slide 18` | detail |
| S07-C83 | The fix is not "do not retry". The fix lets the server recognise attempt 2. | `slide 18` | correction |
| S07-C84 | The client sends an idempotency key. The server checks it and deduplicates. | `slide 18` | core |
| S07-C85 | The slide cites RFC 9110 section 9.2, back to Session 5. | `slide 18` | detail |
| S07-C86 | The mechanics section covers count, backoff, jitter and the circuit breaker. | `slide 19` | detail |
| S07-C87 | The first loop everyone writes catches the timeout and continues at once, forever. | `slide 20` | core |
| S07-C88 | With no max count a permanently-down dependency becomes an infinite loop. | `slide 20` | core |
| S07-C89 | With no delay every client hammers the upstream at wire speed. | `slide 20` | core |
| S07-C90 | With no coordination every retry loop fires on the same tick after recovery. | `slide 20` | core |
| S07-C91 | That is the thundering herd. It can re-crash a server that just came back up. | `slide 20` | core |
| S07-C92 | The live loop takes max_attempts 5, base 0.2 s and cap 8.0 s. | `slide 21` | core |
| S07-C93 | The delay is min(cap, base times 2 to the attempt), then uniform(0, delay). | `slide 21` | core |
| S07-C94 | On the last attempt the loop raises instead of sleeping. | `slide 21` | detail |
| S07-C95 | Three knobs, three jobs: max attempts, exponential growth, full jitter. | `slide 21` | detail |
| S07-C96 | Max attempts caps total damage. A dead dependency fails in seconds, not forever. | `slide 21` | detail |
| S07-C97 | Exponential growth spaces retries out, so load on the upstream decays. | `slide 21` | core |
| S07-C98 | Full jitter decorrelates clients. | `slide 21` | core |
| S07-C99 | Full jitter is uniform(0, delay), not the delay plus or minus a little. | `slide 21` | correction |
| S07-C100 | Without jitter every client computes the same delay and retries in lockstep. | `slide 21` | core |
| S07-C101 | That lockstep is the same herd, only delayed. | `slide 21` | detail |
| S07-C102 | The slide credits full jitter to AWS, 2015. | `slide 21` | story |
| S07-C103 | Some servers name the wait. Then use their number. | `slide 22` | detail |
| S07-C104 | A 429 means a rate limit. The server is fine. You ask too fast. | `slide 22` | core |
| S07-C105 | Honor Retry-After. Do not add your own backoff on top of it. | `slide 22` | correction |
| S07-C106 | A 503 often carries Retry-After during maintenance or load shedding. | `slide 22` | core |
| S07-C107 | Trust the header over your own backoff curve. | `slide 22` | detail |
| S07-C108 | A 408 means the server gave up waiting for you to finish sending. | `slide 22` | detail |
| S07-C109 | A 408 retry is fine. Nothing about the request itself got rejected. | `slide 22` | core |
| S07-C110 | Connection limits and 5 or 10 second interval caps exist for this reason. | `slide 22` | detail |
| S07-C111 | Clients that ignore Retry-After can still overwhelm a server together. | `slide 22` | detail |
| S07-C112 | A server that hands you a number knows its own load better than your curve. | `slide 22` | detail |
| S07-C113 | A circuit breaker stops you asking a question you already know the answer to. | `slide 23` | detail |
| S07-C114 | CLOSED: requests flow through normally, and the breaker counts failures. | `slide 23` | core |
| S07-C115 | OPEN: the failure threshold broke, so requests fail instantly and locally. | `slide 23` | core |
| S07-C116 | In OPEN the client attempts no call at all. | `slide 23` | detail |
| S07-C117 | HALF-OPEN: after a cooldown, one probe request goes through. | `slide 23` | core |
| S07-C118 | A probe success closes the breaker. A probe failure opens it again. | `slide 23` | core |
| S07-C119 | Backoff protects an upstream from one client. A breaker protects it from a fleet. | `slide 23` | core |
| S07-C120 | A breaker also saves the caller the full timeout cost of every doomed call. | `slide 23` | detail |
| S07-C121 | A breaker is the max-retry idea one level up: cap failures per dependency. | `slide 23` | correction |
| S07-C122 | A breaker remembers that verdict for a while. | `slide 23` | detail |
| S07-C123 | The slide credits the pattern to Nygard, "Release It!" (2007). | `slide 23` | story |
| S07-C124 | The case study condenses a production taxonomy of 96 player failure modes. | `slides 6, 24` | story |
| S07-C125 | The case study runs from DNS to DRM to iOS ResetMedia. | `slide 6` | story |
| S07-C126 | An API client fails visibly: an exception, or a 5xx in a log. | `slide 25` | detail |
| S07-C127 | A player fails silently: a frozen frame, or a spinner the user stares at. | `slide 25` | core |
| S07-C128 | One play session makes hundreds of requests: manifest, key, dozens of segments. | `slide 25` | core |
| S07-C129 | Each request type gets its own retry policy on one user-visible timeline. | `slide 25` | detail |
| S07-C130 | Some player failures are not network failures at all. | `slide 25` | core |
| S07-C131 | A DRM key denial, an unsupported codec and a decoder crash are the examples. | `slide 25` | detail |
| S07-C132 | The right answer is often a different stream, not a retry. | `slide 25` | core |
| S07-C133 | The retry budget is human. A viewer takes seconds of rebuffering, not minutes. | `slide 25` | core |
| S07-C134 | A player often has a fallback CDN with a different hostname to try. | `slide 26` | detail |
| S07-C135 | Timeouts differ by request type. A manifest and a segment get different budgets. | `slide 26` | detail |
| S07-C136 | A network switch can change the IP mid-download. The request is dead, not slow. | `slide 26` | core |
| S07-C137 | With wifi off the buffer keeps playing, so the retry waits for a low buffer. | `slide 26` | detail |
| S07-C138 | A multi-CDN player switches CDN instead of retrying the same dead edge. | `slide 26` | core |
| S07-C139 | A 404 on a live segment can have a real cause. | `slide 27` | correction |
| S07-C140 | The origin may still encode it, or the CDN may not have finished propagating. | `slide 27` | detail |
| S07-C141 | That segment will exist in a few hundred milliseconds. | `slide 27` | detail |
| S07-C142 | The fix is a short bounded retry: 2 or 3 attempts, a small fixed delay. | `slide 27` | core |
| S07-C143 | That retry belongs to live-edge segment requests and nowhere else. | `slide 27` | core |
| S07-C144 | A 404 on an on-demand asset still means give up. | `slide 27` | core |
| S07-C145 | Real deployments add codes outside the registry: 419, 474 and 475. | `slide 27` | story |
| S07-C146 | A 419 marks token or session expiry. Handle it like auth, not as a retry. | `slide 27` | detail |
| S07-C147 | 474 and 475 appeared when a retried segment returned a mismatched partial result. | `slide 27` | detail |
| S07-C148 | The lesson is not the numbers. Your own codes need the same discipline. | `slide 27` | core |
| S07-C149 | Document what each private code means and whether it is retryable. | `slide 27` | detail |
| S07-C150 | Sometimes the answer is a fallback, not a retry. | `slide 28` | correction |
| S07-C151 | A denied DRM key and an unsupported codec are not transient, so both need a fallback. | `slide 28` | core |
| S07-C152 | Fall back to a lower DRM security level, or to a different key system. | `slide 28` | detail |
| S07-C153 | L1 and L3 name the DRM security levels on the slide. | `slide 28` | detail |
| S07-C154 | Fall back to an alternate codec rendition in the manifest. | `slide 28` | detail |
| S07-C155 | If the DASH manifest fails, some players fall back to an HLS rendition. | `slide 28` | detail |
| S07-C156 | A child manifest, segment or init failure is retryable in the network sense. | `slide 28` | detail |
| S07-C157 | A repeated failure escalates to a fatal coded error, such as 8018 or 8022. | `slide 28` | detail |
| S07-C158 | An ad failure or timeout falls back to content, not to a retried ad. | `slide 28` | detail |
| S07-C159 | The user time budget for an ad failure is near zero. | `slide 28` | detail |
| S07-C160 | iOS ResetMedia destroys and rebuilds the whole AVPlayer pipeline. | `slide 28` | detail |
| S07-C161 | That failure lives in device media state, not in a request at all. | `slide 28` | core |
| S07-C162 | Retry an entitlement check that times out. Do not retry a clean "not entitled". | `slide 29` | core |
| S07-C163 | There the HTTP layer succeeded and the business layer made a decision. | `slide 29` | detail |
| S07-C164 | The response body, not only the status code, can carry a signal. | `slide 29` | core |
| S07-C165 | Two examples: "degraded, use lower bitrate" and "maintenance, try again in N minutes". | `slide 29` | detail |
| S07-C166 | Sections 3 and 4 classified with transport signals: status code and timeout type. | `slide 29` | detail |
| S07-C167 | A mature retry policy reads application-layer signals too. | `slide 29` | core |
| S07-C168 | What survives is not the request. It is the system. | `slide 30` | core |
| S07-C169 | Fastly: 85% of its network returned errors on 8 June 2021. | `slide 31` | measured |
| S07-C170 | Fastly took about 1 minute to detect the fault. | `slide 31` | measured |
| S07-C171 | Fastly took 49 minutes to reach 95% recovered. | `slide 31` | measured |
| S07-C172 | The Session 6 closing question comes back here. | `slide 31` | detail |
| S07-C173 | Today's edge survives a dead origin, because a cache can serve a stale hit. | `slide 31` | core |
| S07-C174 | The new question: what happens when the edge or a whole region dies? | `slide 31` | core |
| S07-C175 | The stale-if-error directive (RFC 5861) points the same idea the other way. | `slide 31` | core |
| S07-C176 | The cache keeps serving its last good copy when it cannot reach the origin. | `slide 31` | detail |
| S07-C177 | stale-if-error is not a retry. It serves known-stale data instead of nothing. | `slide 31` | correction |
| S07-C178 | A system that can answer with slightly-wrong data survives more outages. | `slide 31` | core |
| S07-C179 | A system that demands perfectly-fresh-or-nothing does not. | `slide 31` | detail |
| S07-C180 | Failover: a breaker trips OPEN on the primary and routes to a backup. | `slide 32` | core |
| S07-C181 | The backup can be a different region, a different provider or a different CDN. | `slide 32` | detail |
| S07-C182 | The client stops asking a dead dependency and asks someone else. | `slide 32` | detail |
| S07-C183 | A feature flag turns off the expensive part with no deploy, in seconds. | `slide 32` | core |
| S07-C184 | A flag can disable recommendations or personalization to protect playback. | `slide 32` | detail |
| S07-C185 | Graceful degradation answers smaller, not "no". | `slide 32` | core |
| S07-C186 | Examples: a lower bitrate, cached recommendations, a slightly stale price. | `slide 32` | detail |
| S07-C187 | Every case study of the class has one lever: the buffer, stale-if-error, a DRM tier. | `slide 32` | detail |
| S07-C188 | Recovery is the most dangerous moment of an incident, not the failure. | `slide 33` | correction |
| S07-C189 | Every client that was retrying, backing off or waiting now tries again. | `slide 33` | core |
| S07-C190 | They all started failing at the same moment, so their backoff schedules line up. | `slide 33` | core |
| S07-C191 | The recovering service runs at 1% of capacity while it warms caches. | `slide 33` | detail |
| S07-C192 | It gets close to 100% of normal traffic in its first reachable second. | `slide 33` | detail |
| S07-C193 | So it can fall right back over. | `slide 33` | detail |
| S07-C194 | Three mitigations: jitter, staggered half-open probes, slow start on the server. | `slide 33` | core |
| S07-C195 | Slow start means the server accepts traffic at a ramped rate, not at full rate. | `slide 33` | detail |
| S07-C196 | One flowchart covers every failure of the class, in five steps. | `slide 34` | core |
| S07-C197 | Step 1, classify: where did it fail, 5xx or 4xx, idempotent? | `slide 34` | core |
| S07-C198 | Step 2, structural: 404, geo-block, preflight, bad auth. Stop and handle. | `slide 34` | core |
| S07-C199 | Step 3, transient: back off with full jitter, cap attempts, honor Retry-After. | `slide 34` | core |
| S07-C200 | Step 4, dependency level: repeated failures trip a breaker, so you fail fast. | `slide 34` | core |
| S07-C201 | Step 5, no good answer left: fail over, degrade, or serve stale. | `slide 34` | core |
| S07-C202 | Anything but nothing. | `slide 34` | detail |
| S07-C203 | The task before Session 8: wrap a flaky client in a policy you write yourself. | `slide 35` | detail |
| S07-C204 | Take a client you already have, such as the Session 5 calculator client. | `slide 35` | detail |
| S07-C205 | The wrapper must classify retryable against not retryable, by this class rules. | `slide 35` | core |
| S07-C206 | It must back off with full jitter, capped at a max attempt count. | `slide 35` | core |
| S07-C207 | It must honor a Retry-After header when the server sends one. | `slide 35` | core |
| S07-C208 | It must open a circuit after N consecutive failures to one dependency, then fail fast. | `slide 35` | core |
| S07-C209 | You also write a server that misbehaves on command. | `slide 35` | detail |
| S07-C210 | Three routes: /sometimes-500, /always-503-with-retry-after, /always-down. | `slide 35` | detail |
| S07-C211 | /sometimes-500 fails a configurable fraction of the time. | `slide 35` | detail |
| S07-C212 | Hand in the wrapper, the test server, and a log or plot of request timestamps. | `slide 35` | detail |
| S07-C213 | The plot shows the backoff curve, the circuit opening, and the circuit closing. | `slide 35` | detail |
| S07-C214 | Session 6 asked for the same kind of evidence. | `slide 35` | story |
| S07-C215 | Homework: five items, do at least one. | `slide 36` | detail |
| S07-C216 | Homework 5 is the one to do if you do only one. | `slide 36` | detail |
| S07-C217 | Week 8 puts this retry policy inside a real video pipeline. | `slide 37` | story |
| S07-C218 | Week 8 covers adaptive bitrate, segment prefetch and the Session 6 CDN material. | `slide 37` | story |
| S07-C219 | In week 8, DRM tiers, multi-CDN switching and manifest fallback become the design. | `slide 37` | story |
| S07-C220 | The player case study of today was a preview of week 8. | `slide 37` | story |
| S07-C221 | Every fallback of this class answers with something worse than the ideal. | `slide 37` | core |
| S07-C222 | The closing question: when does "worse" stop being acceptable, and who decides? | `slide 37` | core |
| S07-C223 | Slide 37 calls week 8 "the last one". | `slide 37` | story |

## 4. Instructor questions

| ID | The question | Model answer outline |
|---|---|---|
| S07-Q01 | Assignment: the calculator that stays on the line, restated on slide 2, due today. | Graded. No model answer. Module `s05-m12-assignment-prep` holds the checklist, the test plan and the hint ladder. |
| S07-Q02 | Project: HTTP, in binary, restated on slide 3, due 8 October. | Graded. No model answer. Module `s05-m13-project-studio` holds the design questions and the spec checklist. |
| S07-Q03 | HTTP/2 chose 24 / 8 / 8 / 31 bits for its frame header. Why? (slide 3) | The same question as S05-Q03. Graded context, so the answer stays in `s05-m13-project-studio`. |
| S07-Q04 | Session 5 taught what a status means. Does the status tell you whether a second try changes the outcome? (slide 11) | Only in part. A 4xx says the server refuses those bytes every time, so a second try with the same bytes fails again. A 5xx says the server failed and says nothing about side effects. 408 and 429 are 4xx and still retryable, so the class, not the digit, decides. |
| S07-Q05 | If you changed nothing about the request and only waited, is attempt 2 identical to attempt 1? (slide 13) | Yes means a retry. No means handling. A new token, a different endpoint or an altered payload all make it a new request, and new code must own it. |
| S07-Q06 | You did not get a response. Did the server finish the work? (slide 18) | You cannot know. The response may have died after the server committed. For an idempotent method that does not matter. For a POST it does, so send an idempotency key and let the server deduplicate. |
| S07-Q07 | Build the retry loop with the class: count, backoff, jitter, breaker. (slide 21) | The deck gives the result on slide 21. Section 6 adds the arithmetic: ceiling delays 0.2, 0.4, 0.8 and 1.6 s, a 3.0 s sleep ceiling, and a cap of 8.0 s that never binds at 5 attempts. |
| S07-Q08 | What does a circuit breaker reach that backoff cannot? (slide 23) | Backoff is per client and per request. It cannot stop 10,000 clients each politely making their first call to a dead service. A breaker caps failures per dependency, remembers the verdict for a cooldown, and saves every caller the full timeout. |
| S07-Q09 | Your system invents its own status codes. What do they owe a caller? (slide 27) | The same two facts an RFC code gives: what the condition means, and whether a retry can change it. 419, 474 and 475 are real examples of codes with no registry entry, so each deployment must write the contract down. |
| S07-Q10 | The edge survives a dead origin. What does your system do when the edge, or a whole region, dies? (slide 31, carried from Session 6) | Three answers, in increasing cost. Serve stale with stale-if-error, so a cache answers without the origin. Fail over to a second provider or region, which needs the client to treat a provider as one dependency with one breaker. Degrade, so the answer gets smaller rather than absent. |
| S07-Q11 | Things to try before Session 8: wrap a flaky client in a resilient-call policy and prove it survives. (slide 35) | Not graded work. Module `s07-m08-build-the-wrapper` holds the requirement checklist, the test plan and the hint ladder. No solution. |
| S07-Q12 | Homework 1: simulate 1,000 clients against a rate-limited server. Count requests in the first second under the naive loop and under backoff with jitter. Explain the gap. (slide 36) | A model, not a measurement, so state the failure time T. Naive loop: each client makes 1/T calls each second, so 1,000 clients make 1000/T. At T = 5 ms that is 200,000. Backoff, no jitter: calls land at 0, 0.2, 0.6 and 1.4 s, so 3 calls per client reach the first second, as 3 spikes of 1,000. Backoff with full jitter: a 4-million-draw simulation gives 4.05 calls per client, about 4,050 requests, spread smoothly. The honest gap is two orders of magnitude against the naive loop, from the cap and the delay. Jitter slightly raises the total and cuts the peak. |
| S07-Q13 | Homework 2: pick three items of the player case study that are not retries. Say what each one is instead, using the slide 13 definition. (slide 36) | Candidates: a DRM fallback to a lower security level (a different request), a codec fallback to another rendition (a different resource), a CDN switch (a different host), an ad failure falling back to content (a different decision), iOS ResetMedia (a device action, not a request), a token refresh after 419 (a different credential). |
| S07-Q14 | Homework 3: design an idempotency key scheme for a POST endpoint. Where does the server store seen keys, and for how long? (slide 36) | Store the key with a fingerprint of the request and the saved response. Write the key record in the same transaction as the side effect, or a crash between the two loses the dedupe. The lifetime must outlive the whole client retry window, so it must exceed the backoff ceiling plus the longest client timeout. Real services keep 24 hours. A key that returns with a different fingerprint is a client bug, so answer 422, not the old response. |
| S07-Q15 | Homework 4: map the Fastly postmortem onto the five-step framework. Which step would have shortened the 49 minutes? (slide 36) | The honest answer is step 5 only. Steps 1 to 4 live in the client, and the failing component was the edge itself, so there was no healthy backend for a breaker to protect. A stale copy (stale-if-error) or a second CDN (failover) changes what the user saw. Timeline from the Fastly blog, all UTC: 09:47 onset, 09:48 detected, 10:27 cause found, 10:36 recovery starts, 12:35 mitigated. The 49 minutes runs 09:47 to 10:36. |
| S07-Q16 | Homework 5, the one to do if you do only one: add classify, backoff, jitter and a cap to a real client you use daily, then break something on purpose. (slide 36) | Answer: needs a run. Kill the wifi or block the port, then watch the client recover instead of hang. The evidence is the timestamp log of the attempts. |
| S07-Q17 | Every fallback today answers with something worse than the ideal. When does "worse" stop being acceptable, and who decides? (slide 37) | Open. An outline: the owner of the number the user cares about decides, and the decision needs a written threshold before the incident. A stale price is acceptable for a catalogue page and not for a trade. A lower bitrate is acceptable for a film and not for a medical scan. Section 7 records this for the Session 8 page. |

## 5. Modules

Eight modules, 167 minutes in total. Module 8 is new. The `README.md` table
lists seven for Session 7, and section 7 item 1 records the reason for the
eighth.

### s07-m01-failure-taxonomy

- **Title:** Six places to fail, and one new question for every status. **Minutes:** 20.
- **Big idea:** A request does not fail generically. It fails at one named stage, and the stage plus the status code decides whether a second try can change anything.
- **Covers:** S07-C12, S07-C13, S07-C14, S07-C15, S07-C16, S07-C17, S07-C18, S07-C19, S07-C20, S07-C21, S07-C22, S07-C23, S07-C24, S07-C25, S07-C26, S07-C27, S07-C28, S07-C29, S07-C30, S07-C31, S07-C32, S07-C33, S07-C34, S07-C35, S07-C36, S07-C37, S07-C38, S07-C39.
- **Prereqs:** s01-m01-seven-syscalls, s01-m03-signals-sigpipe, s01-m05-byte-order-dns, s01-m07-see-the-bytes-tls, s02-m04-tcp-lifecycle, s05-m01-http10.
- **Threads:** T-network-not-function.

**Pretest.**
1. Your log says "timeout". How many different failures can write that word? *Answer: at least two. One never reached a server. One reached a server and lost the answer.*
2. A call returns 500. Did the server change any data? *Answer: you cannot tell. A 500 says the server failed, not what it did first.*
3. A call returns 404. Will the same call work in 200 ms? *Answer: almost never. The resource is not there.*

**Rung 1, the picture.** You post a letter to a friend in another town. Six things must work. The address book must give the right street. The post office must accept the letter. The seal must hold. The van must leave with it. Your friend must read it and write back. The reply must reach your letterbox. Now a week passes and no reply comes. "No reply" is one word for six very different stories. In one story the address book was wrong, so the letter never left your town. In another your friend read it, acted on it, and the reply burned in a sorting fire. Posting the same letter again is a fine idea in the first story and a terrible idea in the second. *Where the analogy breaks:* a letter leaves a paper trail, and a lost TCP response leaves none. Your program only knows that nothing came back.

**Rung 2, how it works.**
1. The client turns a name into an IP address. The resolver can time out, or it can answer "no such name".
2. The client opens TCP: SYN, SYN-ACK, ACK. A dead host or a full backlog kills this step.
3. The client runs the TLS handshake. A bad certificate or a clock skew kills this step.
4. The client writes the request bytes. The socket can break here, and the peer can send RST.
5. The server does the work. It can succeed, fail, or half-succeed.
6. The client reads the response. The bytes arrive, or they stop arriving.
7. The stage sets the question. Steps 1 to 3 never reached a server, so no server failed. Step 5 and step 6 may hide finished work.

**Rung 3, the real thing.** Slide 10 draws the six stages as one arrow. Slide 11 adds the retry column to the five status classes of Session 5. The class 1 code shows stage 6 breaking on purpose. `lesson1/01_echo_server.c` reads one buffer and writes it back, then closes (lines 14 to 20). `lesson1/05_sigpipe_client.c` sets a linger option of `{1, 0}` and closes, so the kernel sends RST in place of FIN (lines 15 to 17). A peer that gets RST sees the connection die with no clean end. That is stage 6 with no information about stage 5. Note the mismatch: slide 8 prints port 8080, and the repo file uses 2026, which is the port the echo server binds.

**Rung 4, exam depth.**
- *Why the stage matters more than the exception type.* Two code paths can raise the same `TimeoutError`. A connect timeout proves no server saw the request. A read timeout proves a server saw it. Only the second one can leave half-done work (S07-C28, S07-C30).
- *What a 5xx really tells you.* It tells you the server knows it failed. It does not tell you whether the server wrote a row, sent an email or charged a card first (S07-C38).
- *What if you only log "request failed"?* You lose the stage, so every later decision guesses. The cheap fix is to log the stage name with every failure.
- *Why 4xx is "usually not" and not "never".* The deck itself names two retryable 4xx codes on slide 22: 408 and 429. The class of the code is a prior, not a rule.
- *Exam prompts.* (1) A payment POST times out while reading the response. Name what you do and why. *Model answer: you cannot tell whether the charge happened, so do not blindly retry. Send the retry with the same idempotency key, or ask the server for the state of that key.* (2) Why is a connect timeout cheaper to handle than a read timeout? *Model answer: a connect timeout proves no server work started, so a plain retry is safe.*

**Misconceptions.**
- S07-M01: "A timeout is a timeout." Wrong: a DNS timeout never reached a server, and a read timeout reached one that may have half-done the work. Distractor in checks 1 and 2.
- S07-M02: "A 5xx proves the server changed nothing." Wrong: it admits a failure and stays silent about side effects. Distractor in check 3.
- S07-M03: "A 4xx and a 5xx are both errors, so treat them alike." Wrong: a 4xx blames your bytes, a 5xx blames the server. Distractor in check 3.
- S07-M04: "One retry policy fits every failure." Wrong: the stage decides whether a retry can help at all. Distractor in check 4.

**Diagrams.** (1) Static: the six-stage arrow of slide 10, with a label on each stage and a note on what a failure there proves. Actors: client, resolver, server. (2) Static: the five status classes against one column, "will a second try differ?". (3) Step-by-step: the same request failing at stage 2 and then at stage 6, side by side, so the learner sees that the log line is identical.

**Interactives.** *Failure stage classifier* (P1). One interactive for modules 1, 3 and 7. Inputs: a failure description in plain words, such as "the name did not resolve" or "the body stopped halfway". The learner drops it on one of the six stages. The learner sees what that stage proves about the server, and whether half-done work is possible. The learner discovers that only stages 4 to 6 can hide finished work.

**Predict, observe, explain.** Command: `gcc -o /tmp/echo sources/cn-at-scaler/lesson1/01_echo_server.c && /tmp/echo &` then a client that writes and aborts. Predict: does the server see a clean end of file or an error? Observe: with the linger option set, the peer gets RST, so a read fails with "connection reset by peer" in place of returning zero bytes. No slide captures it, so the lesson page must run it or mark it as a planned capture. Note the port: the repo client uses 2026, so it matches the echo server with no edit.

- **Worked example.** A log holds three lines: "DNS timeout", "connect timeout", "read timeout after 200 bytes". Stage, server reached, half-done work possible: stage 1, no, no. Stage 2, no, no. Stage 6, yes, yes.
- **Faded example.** A log line says "TLS handshake failed". Stage ____. Server reached ____. Half-done work possible ____. *(Stage 3. No. No.)*
- **Your turn.** A log line says "502 from the gateway". *(Stage 5 or 6. A server answered, so the upstream may have done the work. Half-done work is possible.)*

**Checks.**
1. `mcq`: which failure can leave half-finished work on the server? Answer: a read timeout after the request went out. Distractor: a DNS timeout (S07-M01). Distractor: a connect timeout (S07-M01). Distractor: a preflight refusal (S07-M01). Feedback: only a request that reached the server can leave work behind.
2. `multi`: which stages prove that no server saw your request? Answer: DNS lookup, TCP handshake, TLS handshake. Distractor: request write (S07-M01). Distractor: response read (S07-M01). Feedback: the first three stages finish before any server reads a byte.
3. `mcq`: a call returns 500. What does that tell you about your data? Answer: nothing. Distractor: the server changed nothing (S07-M02). Distractor: the server changed everything (S07-M02). Distractor: the same as a 400 would tell you (S07-M03). Feedback: a 5xx admits a failure and stays silent about side effects.
4. `recall`: name the six stages of one request, in order. Answer: DNS, TCP handshake, TLS handshake, request write, server work, response read. Feedback: every failure of this class sits on that line (S07-M04).
5. `predict`: a client sets a linger option of `{1, 0}` and closes. What does the peer get? Answer: RST. Distractor: FIN (S07-M01). Distractor: nothing at all (S07-M01). Feedback: an abortive close replaces the orderly end with a reset.

**Review cards.**
- Q: Name the six places one request can fail. A: DNS, TCP handshake, TLS handshake, request write, server work, response read.
- Q: Which failures prove that no server saw the request? A: Any failure before the handshake finished.
- Q: What does a 5xx tell you about side effects? A: Nothing. It only admits that the server failed.
- Q: What does a 4xx tell you about a second try with the same bytes? A: The server will refuse them again.
- Q: What one question does this class add to every status code? A: Will anything be different next time?
- Q: What makes close send RST in place of FIN? A: A linger option of `{1, 0}`.

### s07-m02-retry-definitions

- **Title:** A retry is the same request. Anything else is handling. **Minutes:** 15.
- **Big idea:** A retry means the identical request again. A token refresh, a new endpoint or a changed payload is a different request, and different code must own it.
- **Covers:** S07-C40, S07-C41, S07-C42, S07-C43, S07-C44, S07-C45, S07-C46, S07-C47, S07-C48, S07-C49, S07-C50.
- **Prereqs:** s07-m01-failure-taxonomy, s05-m01-http10.
- **Threads:** T-network-not-function.

**Pretest.**
1. Your call returns 401. You fetch a new token and call again. Is that a retry? *Answer: no. The Authorization header changed, so the request changed.*
2. What do you bet on when you retry? *Answer: that the failure was transient, so the same action gives a different result.*

**Rung 1, the picture.** A vending machine eats your coin and gives nothing. You press the same button again. That is a retry: same coin slot, same button, same hope that the jam cleared. Now say the screen reads "card expired". You take out a different card and tap. That is not a retry. You answered what the machine told you, with a new input. People call both "trying again", and the machine treats them as two completely different events. *Where the analogy breaks:* the machine tells you which case you are in. A network usually does not, so your code must classify first.

**Rung 2, how it works.**
1. Capture the request once: method, path, headers that matter, body.
2. Call. On a failure, ask one question: did anything about the request change?
3. If nothing changed and you only waited, the second attempt is a retry.
4. If a token, an endpoint or a payload changed, the second attempt is a new request. Give it its own path in the code.
5. A retry needs a transient cause to be worth anything: a network blink, a brief overload, or a load balancer that picked an unhealthy backend.

**Rung 3, the real thing.** Slide 13 puts the two cases side by side under the headings "RETRY" and "NOT A RETRY". The named non-retry is a token refresh followed by a re-send. The slide calls it "responding to information the server just gave you". The slide also closes the auth case: a credential that fails outright needs a different credential, not another attempt with the old one. The slide test reads, in short: with nothing changed and only a wait, is attempt 2 identical to attempt 1?

**Rung 4, exam depth.**
- *Why the definition earns its slide.* A code base that calls both cases "retry" grows one function with a flag, then two flags. The flags hide the fact that one path is safe to repeat and one path is a state machine.
- *Why a refresh is not free.* A refresh that runs inside a retry loop can hammer the token endpoint when the credential is simply wrong. The slide says a retry does not fix an outright auth failure (S07-C48).
- *What if the server changes the payload for you?* A 307 or 308 sends the same method and body to a new URL, so the bytes stay and the destination changes. Treat it as a redirect, not a retry. See section 6.
- *Exam prompts.* (1) A gateway returns 401 with `WWW-Authenticate`. Your client refreshes and re-sends. Classify the second call. *Model answer: a new request, because the Authorization header differs. The retry rules of this class do not apply to it.* (2) Name one risk of calling a refresh a retry. *Model answer: a retry counter then hides a credential that is wrong, so the client loops against the token endpoint.*

**Misconceptions.**
- S07-M05: "A token refresh plus a re-send is a retry." Wrong: the new Authorization header makes it a different request. Distractor in checks 1 and 2.
- S07-M06: "A retry means try again somehow." Wrong: it means the identical request, with only a wait between. Distractor in check 2.
- S07-M07: "An auth failure needs one more attempt with the same credential." Wrong: the same credential gives the same refusal. Distractor in check 3.

**Diagrams.** (1) Static: the two-column split of slide 13, retry against handling, with the test question under both. (2) Step-by-step: one request captured, then two branches. Branch A waits and resends the same bytes. Branch B rebuilds the request with a new header.

**Interactives.** *Retry or handling?* (P1). Inputs: a pair of attempts shown as two request blocks with the differences marked. The learner answers retry or handling. The learner sees which field changed, and the class rule that applies. The learner discovers that a single changed header moves the case out of retry.

**Predict, observe, explain.** No slide captures this. Planned capture: a local server that answers 401 once, then 200 with a fresh token. Predict: how many of the two client calls carry the same Authorization header? Observe: zero, so neither call is a retry of the other.

- **Worked example.** Attempt 1: `POST /pay`, `Authorization: Bearer A`, body `{"id":7}`. Attempt 2: `POST /pay`, `Authorization: Bearer B`, same body. Verdict: handling. Changed field: Authorization.
- **Faded example.** Attempt 1: `GET /v1/users`, header `X-Trace: 11`. Attempt 2: `GET /v1/users`, header `X-Trace: 12`. Verdict: ____. Changed field: ____. *(Retry. Only a trace header changed, and it is not a header that matters to the result.)*
- **Your turn.** Attempt 1: `GET /a?page=1`. Attempt 2: `GET /a?page=2`. *(Handling, or rather a new request. The path changed, so nothing about this is a retry.)*

**Checks.**
1. `mcq`: a client gets 401, refreshes the token, and re-sends. What is the second call? Answer: a different request. Distractor: a retry with a longer delay (S07-M05). Distractor: a retry, because the path is the same (S07-M05). Feedback: a changed Authorization header changes the request.
2. `mcq`: what single test separates a retry from handling? Answer: with nothing changed and only a wait, is attempt 2 identical? Distractor: did the status code change (S07-M06). Distractor: did the delay grow (S07-M06). Distractor: did the server answer faster (S07-M06). Feedback: the test looks at the request, not at the response.
3. `mcq`: a credential is simply wrong. What does a retry buy you? Answer: nothing. Distractor: a second chance if the server was busy (S07-M07). Distractor: a fresh token (S07-M05). Feedback: the same credential gives the same refusal, so a different credential is the only fix.
4. `multi`: which three transient causes does the slide name? Answer: a network blink, a brief server overload, a load balancer that picked an unhealthy backend. Distractor: an expired token (S07-M05). Distractor: a missing resource (S07-M06). Feedback: all three clear on their own, which is what makes the same action worth repeating.

**Review cards.**
- Q: Define a retry in one sentence. A: The exact same step again, with nothing changed.
- Q: Which three fields must stay the same for a second attempt to count as a retry? A: Method, body, and the headers that matter.
- Q: Is a token refresh plus a re-send a retry? A: No. The Authorization header changed, so it is a new request.
- Q: What does a retry bet on? A: That the failure was transient.
- Q: Name the three transient causes on slide 13. A: A network blink, a brief overload, an unhealthy backend behind a load balancer.
- Q: What fixes an outright auth failure? A: A different credential, not another attempt.

### s07-m03-when-to-retry

- **Title:** Classify first: four questions, two lists, one table. **Minutes:** 25.
- **Big idea:** Four questions sort a failure into retry, handle or stop, and the idempotency question decides whether a blind retry is safe at all.
- **Covers:** S07-C51, S07-C52, S07-C53, S07-C54, S07-C55, S07-C56, S07-C57, S07-C58, S07-C59, S07-C60, S07-C61, S07-C62, S07-C63, S07-C64, S07-C65, S07-C66, S07-C67, S07-C68, S07-C69, S07-C70, S07-C71, S07-C72, S07-C73, S07-C74, S07-C75, S07-C76, S07-C77, S07-C78, S07-C79, S07-C80, S07-C81, S07-C82, S07-C83, S07-C84, S07-C85.
- **Prereqs:** s07-m02-retry-definitions, s05-m05-rfcs-and-smuggling, s05-m12-assignment-prep, s06-m02-what-a-cdn-is.
- **Threads:** T-network-not-function, T-name-in-message.

**Pretest.**
1. Your call returns 404. Retry? *Answer: no. The resource is not there, and 200 ms will not create it.*
2. Your DELETE times out. Retry? *Answer: yes. A second DELETE of a gone resource changes nothing.*
3. Your payment POST times out. Retry? *Answer: only with an idempotency key, or you risk two charges.*

**Rung 1, the picture.** A hospital front desk gets a call that cuts off mid-sentence. The clerk asks four questions before calling back. Did the caller reach us at all, or did the line die while dialling? Did we say we could not help, or did the caller ask for the wrong thing? If we already acted, would acting twice hurt? Will waiting a minute change anything? The answers sort the call into three trays: call back, do something different, or drop it. The dangerous tray is the third question, because "give the patient the dose" twice is not the same as "read the chart" twice. *Where the analogy breaks:* the clerk can look up the chart and see whether the dose went in. A client with a dead socket cannot look up anything, which is exactly why the idempotency key exists.

**Rung 2, how it works.**
1. Ask where it failed. Before a connection existed, or after?
2. Ask who admits fault. A 5xx says "I failed". A 4xx says "you failed".
3. Ask whether the action is idempotent. Does the same effect hold however many times it runs?
4. Ask whether the cause is transient or structural. Will a 200 ms wait change anything, or is the resource really gone?
5. Five answers mean stop: 404, a failure before the handshake finished, a geo-block, a preflight refusal, and an outright auth failure. The last one gets a refresh, not a retry.
6. Two families mean retry: the server admits fault, or the environment shifted under you.
7. If the action is not idempotent and you got no response, send an idempotency key so the server can recognise attempt 2.

**Rung 3, the real thing.** Slide 15 gives the four questions. Slide 16 gives the five no-retry cases. Slide 17 gives the two retryable families, with eight named members. Slide 18 gives the method table and cites RFC 9110 section 9.2, a Session 5 callback. The RFC text behind that citation is tighter than the slide. RFC 9110 section 9.2.2 says PUT, DELETE and the safe methods are idempotent, and that an idempotent request "can be repeated automatically if a communication failure occurs before the client is able to read the server's response". The same section adds two limits the slide does not show: "A proxy MUST NOT automatically retry non-idempotent requests", and "A client SHOULD NOT automatically retry a failed automatic retry". Section 6 lists both.

**Rung 4, exam depth.**
- *Why idempotency is a property of intent, not of code.* RFC 9110 section 9.2.2 says the property "only applies to what has been requested by the user". A server stays free to log, to keep a revision history, or to bill per call. So "GET is idempotent" never promises that the server does nothing (section 6).
- *Why 4xx carries two exceptions.* The deck names 408 and 429 on slide 22, and both are 4xx and both are retryable. 425 Too Early is a third case that the deck does not name (section 6). So read the code, not the class.
- *Why 5xx is "usually", not "always".* 501 Not Implemented and 505 HTTP Version Not Supported are permanent facts about the server. A retry of either one changes nothing (section 6).
- *The POST fix, in full.* The key must reach the server with the request, and the server must store the key next to the effect, in one transaction. A key stored after the effect loses the dedupe when the process dies between the two writes. See S07-Q14.
- *What if you cannot add a key?* Two fallbacks. Make the operation naturally idempotent, for example `PUT /orders/{client-generated-id}`. Or read the state back before retrying, which RFC 9110 section 9.2.2 calls detecting that "the original request was never applied".
- *Exam prompts.* (1) Name two 4xx codes a client should retry, and why each one is different from 404. *Model answer: 408, because the server gave up waiting and rejected nothing about the request. 429, because the server is healthy and only asks you to slow down. A 404 is a statement about the resource.* (2) Your client retries a DNS failure and never succeeds. What did you fail to classify? *Model answer: the difference between no answer at all, which is retryable, and a negative answer that says the name does not exist.*

**Misconceptions.**
- S07-M08: "Every 4xx is final." Wrong: 408 and 429 are 4xx and both deserve a retry. Distractor in checks 1 and 2.
- S07-M09: "A DNS failure means the name does not exist." Wrong: a resolver with no answer at all is a different, retryable failure. Distractor in check 3.
- S07-M10: "A POST must never be retried." Wrong: with an idempotency key the server can recognise attempt 2. Distractor in check 4.
- S07-M11: "GET is safe to retry because the server cannot change anything." Wrong: idempotency covers the intended effect, not logging or billing. Distractor in check 5.
- S07-M12: "A preflight failure means retry the real request." Wrong: the client already refused, so the real request never left. Distractor in check 1.
- S07-M13: "An idempotent method is safe to retry without limit." Wrong: RFC 9110 section 9.2.2 says a client should not automatically retry a failed automatic retry, and a proxy must not auto-retry a non-idempotent request. Beyond the slides. Distractor in check 6.

**Diagrams.** (1) Static: the four questions as a four-row decision strip, with the answer of each row feeding the next. (2) Static: two facing lists, no-retry and retry, from slides 16 and 17. (3) Step-by-step: a POST that times out, shown twice. Once blind, which charges twice. Once with a key, which the server matches and answers from its store.

**Interactives.** (1) *Classify before you act* (P1). Inputs: a failure card with a status code or a timeout type, plus the method. The learner picks retry, handle or stop. The learner sees the deciding question and the rule. The learner discovers that 408 and 429 break the "4xx means stop" habit. (2) *Idempotency key walkthrough* (P2). Inputs: a key, a request fingerprint, a server store. The learner replays the same POST with and without a key. The learner sees one charge against two.

**Predict, observe, explain.** Command: `curl -s -o /dev/null -w '%{http_code}\n' -X POST https://example.com/` against a route that allows only GET. Predict: which status, and is it retryable? Observe: a 4xx that no retry fixes. No slide captures it. A lesson page may use the Session 5 calculator rows instead, where `POST /add` answers 405 (S05-C07).

- **Worked example.** Four failures, classified. `GET /img.png` returns 404: stop. `PUT /cfg` times out while reading: retry, blindly, because PUT is idempotent. `POST /charge` times out while reading: retry only with a key. A geo-block returns 403: stop, and change nothing.
- **Faded example.** `DELETE /session/9` returns 503 with `Retry-After: 2`. Decision: ____. Delay: ____. *(Retry, and wait 2 s. DELETE is idempotent, and the server named the wait.)*
- **Your turn.** A CORS preflight fails before the real `POST /orders`. *(Stop. The real request never left, so there is nothing to retry. Fix the server CORS policy.)*

**Checks.**
1. `multi`: which of these say stop, not retry? Answer: 404, a geo-block, a failed CORS preflight. Distractor: 408 (S07-M08). Distractor: 503 (S07-M08). Distractor: a read timeout (S07-M12). Feedback: each stop case is a decision against you, not an accident.
2. `mcq`: a server answers 429. What do you do? Answer: wait the time it named, then retry. Distractor: stop, because 429 is a 4xx (S07-M08). Distractor: retry at once, because the server is healthy (S07-M08). Distractor: add your own exponential delay on top of the header (S07-M17). Feedback: the server is fine and only asks you to slow down.
3. `mcq`: your resolver returns nothing at all, three times. Retry? Answer: yes. Distractor: no, the name does not exist (S07-M09). Distractor: no, because nothing before the handshake is retryable (S07-M09). Feedback: no answer and a negative answer are different failures.
4. `mcq`: a payment POST times out while reading the response. What is the safe move? Answer: retry with the same idempotency key. Distractor: retry blindly, because POST is a write (S07-M10). Distractor: never retry a POST (S07-M10). Distractor: retry with a new idempotency key (S07-M10). Feedback: a new key tells the server that this is new work, so it charges again.
5. `mcq`: which statement about GET is exactly right? Answer: repeating it does not change the intended effect. Distractor: repeating it cannot change anything on the server (S07-M11). Distractor: repeating it is free (S07-M11). Distractor: GET is idempotent only over HTTPS (S07-M11). Feedback: a server may still log or bill, and the RFC calls that safe.
6. `mcq`: your automatic retry of a PUT also fails. What does RFC 9110 advise? Answer: do not automatically retry that failed retry. Distractor: retry until the max count (S07-M13). Distractor: switch to POST (S07-M10). Distractor: let the proxy retry instead (S07-M13). Feedback: the RFC caps automatic retries and forbids proxy auto-retry of non-idempotent requests.

**Review cards.**
- Q: Name the four classifying questions in order. A: Where did it fail, who admits fault, is it idempotent, is it transient?
- Q: Name the five cases with no point in retrying. A: 404, a failure before the handshake, a geo-block, a preflight refusal, an outright auth failure.
- Q: Which three methods does slide 18 call safe to retry blindly? A: GET, PUT and DELETE.
- Q: Why is a blind POST retry dangerous? A: Charging the card twice means two charges.
- Q: What makes a POST retry safe? A: An idempotency key that the server checks and deduplicates.
- Q: Which two 4xx codes does the deck call retryable? A: 408 and 429.
- Q: Which DNS failure is retryable? A: No answer at all, not a negative answer.
- Q: Which four 5xx codes does slide 17 list as retryable? A: 500, 502, 503 and 504.

### s07-m04-retry-mechanics

- **Title:** Three knobs, then one level up: the circuit breaker. **Minutes:** 25.
- **Big idea:** A cap, an exponential delay and real randomness turn a dangerous loop into a safe one, and a circuit breaker moves the cap from one request to one dependency.
- **Covers:** S07-C86, S07-C87, S07-C88, S07-C89, S07-C90, S07-C91, S07-C92, S07-C93, S07-C94, S07-C95, S07-C96, S07-C97, S07-C98, S07-C99, S07-C100, S07-C101, S07-C102, S07-C103, S07-C104, S07-C105, S07-C106, S07-C107, S07-C108, S07-C109, S07-C110, S07-C111, S07-C112, S07-C113, S07-C114, S07-C115, S07-C116, S07-C117, S07-C118, S07-C119, S07-C120, S07-C121, S07-C122, S07-C123.
- **Prereqs:** s07-m03-when-to-retry, s03-m07-limits.
- **Threads:** T-network-not-function, T-fix-causes-next, T-where-state-goes.

**Pretest.**
1. `while True: try: call() except Timeout: continue`. Name the three dangers. *Answer: no cap, no delay, no coordination across clients.*
2. Ten thousand clients all back off exponentially with the same base. When do they retry? *Answer: at the same instant, because they all compute the same delay.*
3. A dependency has been down for an hour. What should your 10,000 clients cost it? *Answer: almost nothing. A circuit breaker should stop the calls before they leave.*

**Rung 1, the picture.** A school bell rings and 600 children run at one door. The door holds 2 at a time. Three fixes exist, and each one does a different job. Tell each child to try at most 5 times, so nobody stands there until dark. Tell each child to wait longer after each failed push, so the crowd thins. Then give each child a different random wait, or they all push again on the same beat and nothing changes. The fourth fix is not about the children. A teacher at the door says "this door is broken, use the other one", and nobody even walks up to it until the teacher checks again. *Where the analogy breaks:* a child sees the crowd. A client sees only its own failure, which is why the random wait is the only coordination it gets for free.

**Rung 2, how it works.**
1. Catch only the failures you classified as retryable in module 3.
2. Count the attempts and stop at the cap. A dead dependency then fails in seconds.
3. Compute an exponential ceiling: `base` times 2 to the attempt number, clamped by `cap`.
4. Draw the real delay uniformly between zero and that ceiling. That is full jitter.
5. If the server sent `Retry-After`, use its number and skip your own curve.
6. Count failures per dependency, not per request. Over the threshold, open the circuit.
7. While open, fail at once and locally. After a cooldown, let exactly one probe through.
8. A probe success closes the circuit. A probe failure opens it again.

**Rung 3, the real thing.** Slide 20 shows the dangerous loop in four lines. Slide 21 shows the safe one, with `max_attempts=5`, `base=0.2` and `cap=8.0`, and it credits full jitter to AWS, 2015. The original is Marc Brooker, "Exponential Backoff And Jitter", AWS Architecture Blog, 4 March 2015. The post gives three variants, and full jitter is the one that draws the whole delay at random. Slide 22 gives the three codes that carry or deserve a server-set wait: 429, 503 and 408. Slide 23 gives the three breaker states and credits Nygard, "Release It!", Pragmatic Bookshelf, 2007.

**The arithmetic of slide 21, redone.** The loop sleeps after attempts 0, 1, 2 and 3, and raises on attempt 4.

| Attempt | `base * 2**attempt` | After the cap | Full-jitter mean |
|---|---|---|---|
| 0 | 0.2 s | 0.2 s | 0.1 s |
| 1 | 0.4 s | 0.4 s | 0.2 s |
| 2 | 0.8 s | 0.8 s | 0.4 s |
| 3 | 1.6 s | 1.6 s | 0.8 s |
| 4 | 3.2 s | no sleep, the loop raises | none |

So the sleep ceiling of the whole policy is 3.0 s, and the full-jitter mean is
1.5 s. The `cap=8.0` value never applies here, because `0.2 * 2**attempt`
first passes 8.0 at attempt 6. With `max_attempts=5` the cap is dead code.

**Rung 4, exam depth.**
- *Why full jitter, not "plus or minus a bit".* A delay of `d ± 10%` keeps every client inside a 20% window around the same instant, so the herd arrives as a slightly wider spike. `uniform(0, d)` spreads them over the whole interval (S07-C99, S07-C100).
- *What jitter costs and what it buys.* It does not cut the total request count. In the first second, 1,000 clients on the no-jitter schedule make 3 calls each, as 3 spikes of 1,000. On the full-jitter schedule a 4-million-draw simulation gives 4.05 calls each, so about 4,050 calls, spread smoothly. Jitter buys a lower peak, not a lower total. Our analysis, not the instructor's. See S07-Q12.
- *Where the state lives.* A retry counter lives in one call. A breaker verdict lives next to the dependency and outlives the call, so every caller shares it. In one process that is a field. Across a fleet it is a shared store, and then the verdict itself can go stale.
- *Why the breaker is "the same idea one level up".* Max attempts caps damage per request. A breaker caps failures per dependency and remembers the verdict for a cooldown (S07-C121).
- *What if every client probes at the same time?* The half-open probes become a small herd of their own. Slide 33 names the fix: stagger them.
- *Trade-off table.*

| Control | Protects | Cost when wrong |
|---|---|---|
| Max attempts | the caller, from waiting forever | too low gives up on a blink |
| Exponential delay | the upstream, from steady load | too long breaks the human budget |
| Full jitter | the upstream, from a synchronized peak | none worth naming |
| `Retry-After` | the upstream, by its own number | ignoring it defeats rate limiting |
| Circuit breaker | the upstream, from a whole fleet | a tight threshold opens on noise |

- *Exam prompts.* (1) With `base=0.2`, `cap=8.0` and `max_attempts=5`, what is the longest the policy can sleep? *Model answer: 3.0 s, the sum of 0.2, 0.4, 0.8 and 1.6. The cap never applies.* (2) Backoff is in place and the upstream still falls over when it recovers. Name the missing control. *Model answer: jitter, or a circuit breaker with staggered probes, because the clients are synchronized.*

**Misconceptions.**
- S07-M14: "Jitter means the delay plus or minus a little." Wrong: full jitter draws uniformly between zero and the delay. Distractor in checks 1 and 2.
- S07-M15: "Exponential backoff alone stops a thundering herd." Wrong: with no jitter every client computes the same delay. Distractor in check 2.
- S07-M16: "A circuit breaker is only a retry cap with a new name." Wrong: it caps failures per dependency and remembers the verdict. Distractor in check 4.
- S07-M17: "Add your own backoff on top of `Retry-After`." Wrong: the server number already prices its own load. Distractor in check 3.
- S07-M18: "The `cap=8.0` value bounds the wait in the slide 21 loop." Wrong: with 5 attempts the sleep ceiling is 3.0 s and the cap never binds. Our arithmetic. Distractor in check 5.
- S07-M19: "In OPEN the breaker still calls the upstream quietly." Wrong: no call leaves. Only the half-open probe goes out. Distractor in check 4.

**Diagrams.** (1) Static: the four-line dangerous loop, with the three missing controls labelled. (2) Animation: a timeline of 20 clients, with a toggle for no jitter and full jitter, showing spikes against a spread. (3) Step-by-step: the three breaker states as a cycle, CLOSED to OPEN to HALF-OPEN, with the condition on each arrow.

**Interactives.** (1) *Backoff and jitter playground* (P1). Inputs: `base`, `cap`, `max_attempts`, client count, jitter mode (none, full). The learner sees each client attempt as a dot on a timeline, plus the peak requests per 100 ms. The learner discovers that jitter cuts the peak and barely moves the total. *Simulator spec:* a pure function. `ceiling(k) = min(cap, base * 2**k)`. `delay(k) = ceiling(k)` with no jitter, or `U(0, ceiling(k))` with full jitter. Sleeps run for `k` in `0 .. max_attempts-2`. Test vectors: with `base=0.2`, `cap=8.0`, `max_attempts=5`, the ceilings are 0.2, 0.4, 0.8, 1.6 and the sum is 3.0. With `base=0.1`, `cap=2.0`, `max_attempts=7`, the ceilings are 0.1, 0.2, 0.4, 0.8, 1.6, 2.0 and the sum is 5.1. (2) *Circuit breaker state machine* (P1). Inputs: a failure stream, a threshold, a cooldown. The learner clicks requests through and watches the state. The learner discovers that OPEN costs the upstream nothing and costs the caller nothing either.

**Predict, observe, explain.** Command: the backoff playground with 1,000 clients, jitter off, then on. Predict: which setting sends more total requests in the first second? Observe: full jitter sends slightly more, and its peak is far lower. This is a model, not a capture. No slide measures it.

- **Worked example.** `base=0.2`, `cap=8.0`, `max_attempts=5`. Ceilings: 0.2, 0.4, 0.8, 1.6. Sleep ceiling: 3.0 s. Full-jitter mean: 1.5 s. First capped attempt: none, because the cap binds only from attempt 6.
- **Faded example.** `base=0.5`, `cap=8.0`, `max_attempts=6`. Ceilings: ____. Sleep ceiling: ____. Full-jitter mean: ____. *(0.5, 1.0, 2.0, 4.0, 8.0. 15.5 s. 7.75 s.)*
- **Your turn.** `base=0.1`, `cap=2.0`, `max_attempts=7`. *(Ceilings 0.1, 0.2, 0.4, 0.8, 1.6, 2.0. Sleep ceiling 5.1 s. Mean 2.55 s. The cap first binds at attempt 5, where 3.2 s becomes 2.0 s.)*

**Checks.**
1. `numeric`: `base=0.2`, `cap=8.0`, `max_attempts=5`. What is the longest total sleep, in seconds? Answer: 3.0. Distractor: 8.0 (S07-M18). Distractor: 6.2 (S07-M18: the attempt 4 ceiling added). Feedback: the loop sleeps four times, and the cap never binds.
2. `mcq`: ten thousand clients use exponential backoff with no jitter. What happens when the upstream recovers? Answer: they all retry on the same tick. Distractor: they spread out, because the delays grow (S07-M15). Distractor: they spread out, because each client started at a different time (S07-M15). Distractor: the cap staggers them (S07-M14). Feedback: the same formula with the same inputs gives the same delay.
3. `mcq`: a server answers 503 with `Retry-After: 30`. Your curve says 0.8 s. What do you wait? Answer: 30 s. Distractor: 0.8 s, because your curve is yours (S07-M17). Distractor: 30.8 s (S07-M17). Distractor: 0.8 s now and 30 s next time (S07-M17). Feedback: a server that hands you a number prices its own load.
4. `multi`: what does a circuit breaker do that a retry cap does not? Answer: it counts failures per dependency, it remembers the verdict for a cooldown, and it saves the caller the timeout cost. Distractor: it retries in the background while open (S07-M19). Distractor: it caps attempts inside one request (S07-M16). Feedback: the cap lives per request, and the verdict lives per dependency.
5. `spot-bug`: a reviewer says "the `cap=8.0` protects us, the worst case is 8 s". What is wrong? Answer: the cap never applies at 5 attempts, and the real sleep ceiling is 3.0 s. Distractor: nothing, 8 s is right (S07-M18). Distractor: the worst case is 40 s, 5 times the cap (S07-M18). Feedback: `0.2 * 2**attempt` first passes 8.0 at attempt 6.
6. `order`: put the breaker transitions in order from a healthy start. Answer: CLOSED, OPEN, HALF-OPEN, CLOSED. Feedback: a probe success closes it, and a probe failure sends it back to OPEN.

**Review cards.**
- Q: Name the three dangers of the naive retry loop. A: No max count, no delay, no coordination across clients.
- Q: Give the full-jitter delay formula. A: `uniform(0, min(cap, base * 2**attempt))`.
- Q: What is the sleep ceiling of the slide 21 loop? A: 3.0 s, from 0.2 plus 0.4 plus 0.8 plus 1.6.
- Q: When does `cap=8.0` first bind with `base=0.2`? A: At attempt 6, so never with 5 attempts.
- Q: What does full jitter buy, and what does it not buy? A: A lower peak. It does not lower the total request count.
- Q: Name the three circuit breaker states. A: CLOSED, OPEN, HALF-OPEN.
- Q: What happens in OPEN? A: Requests fail instantly and locally, and no call leaves.
- Q: What does the half-open probe do? A: One request goes through. Success closes the breaker, failure reopens it.
- Q: Which three status codes mean "the server named your wait" or "the server rejected nothing"? A: 429, 503 and 408.
- Q: Who gets credit for the circuit breaker, and for full jitter? A: Nygard, "Release It!" (2007), and AWS (2015).

### s07-m05-player-case-study

- **Title:** A video player: when the right answer is a different source. **Minutes:** 22.
- **Big idea:** On a timeline a human watches, many failures need a different source or a smaller answer, not the same request again.
- **Covers:** S07-C124, S07-C125, S07-C126, S07-C127, S07-C128, S07-C129, S07-C130, S07-C131, S07-C132, S07-C133, S07-C134, S07-C135, S07-C136, S07-C137, S07-C138, S07-C139, S07-C140, S07-C141, S07-C142, S07-C143, S07-C144, S07-C145, S07-C146, S07-C147, S07-C148, S07-C149, S07-C150, S07-C151, S07-C152, S07-C153, S07-C154, S07-C155, S07-C156, S07-C157, S07-C158, S07-C159, S07-C160, S07-C161, S07-C162, S07-C163, S07-C164, S07-C165, S07-C166, S07-C167.
- **Prereqs:** s07-m03-when-to-retry, s07-m04-retry-mechanics, s06-m02-what-a-cdn-is, s06-m03-caching-defaults.
- **Threads:** T-network-not-function, T-deployed-reality.

**Pretest.**
1. An API client hits a failure. How does a developer find out? *Answer: an exception, or a 5xx in a log.*
2. A player hits a failure. How does the user find out? *Answer: a frozen frame, or a spinner.*
3. A play session fetches a manifest, a key and 200 segments. How many retry policies does that need? *Answer: more than one. Each request type has its own budget.*

**Rung 1, the picture.** A cinema runs a film from reels that arrive one by one from a depot. The projectionist has about four seconds of slack before the screen goes dark, because a little film sits in the loop. If a reel is late, asking the depot again may work. If the depot says "that reel does not exist yet, we are still printing it", asking again in half a second is right. If the projector cannot read this film format at all, asking again a hundred times changes nothing, and the fix is a different print. And if the lamp fails, no reel helps. You rebuild the projector. *Where the analogy breaks:* a projectionist can see the audience and the loop. A player can see only its own buffer, so its whole retry budget is a guess about human patience.

**Rung 2, how it works.**
1. Classify as in module 3, then ask one more question: is another source available?
2. Give each request type its own timeout and its own attempt count. A manifest and a segment do not share a budget.
3. For the newest live segment, allow a short bounded retry: 2 or 3 attempts with a small fixed delay.
4. For every other 404, stop.
5. For a DRM denial or an unsupported codec, switch: a lower security level, a different key system, another codec rendition.
6. For a dead CDN edge, switch CDN. Do not retry the same host.
7. For a failure in device media state, rebuild the pipeline.
8. Read the response body too. It can say "degraded" or "try again in N minutes".

**Rung 3, the real thing.** Slides 24 to 29 condense a production taxonomy of 96 player failure modes. Slide 26 maps five network failures to a player answer. Slide 27 gives the one 404 exception and three codes with no registry entry: 419, 474 and 475. Slide 28 gives six cases where the answer is a fallback, with two fatal player error numbers, 8018 and 8022. Slide 29 moves the signal from the status line into the response body. None of this sits in the instructor repo, so every claim here cites the slide alone.

**Rung 4, exam depth.**
- *Why silent failure changes the engineering.* An API client can afford a long correct backoff, because a log line is the only victim. A player cannot, because a spinner is the victim (S07-C127, S07-C133).
- *Why the live edge is special.* A live stream writes its newest segment while a client asks for it. The 404 is a race, not a verdict (S07-C139, S07-C140). The deck is careful: that bounded retry belongs to live-edge segment requests and nowhere else (S07-C143).
- *Why a private code needs a contract.* 419, 474 and 475 are not in the IANA registry. A caller cannot guess whether they are retryable, so every deployment must write it down, the same way the deck wrote down 5xx (S07-C148).
- *Switch against retry, in one line.* Retry asks the same source again. Switch asks a different source. A multi-CDN player uses switch where a single-CDN client would retry (S07-C138).
- *What if a fallback is worse but silent?* A lower DRM tier may mean a lower resolution, and the user sees it. Section 7 records the closing question of slide 37 about that trade.
- *Exam prompts.* (1) A segment request returns 404 at the live edge, and your general rule says stop. What do you ship? *Model answer: a narrow exception for live-edge segment requests only: 2 or 3 attempts with a small fixed delay, and the general rule everywhere else.* (2) Why is a DRM denial not a retry case? *Model answer: the same license request returns the same denial. Only a different security level or key system changes the answer.*

**Misconceptions.**
- S07-M20: "A 404 always means stop." Wrong: a live stream newest segment can 404 while the origin still encodes it. Distractor in checks 1 and 2.
- S07-M21: "The bounded live-edge retry is a good default everywhere." Wrong: it belongs to live-edge segment requests only. Distractor in check 2.
- S07-M22: "Retry anything the network layer calls retryable." Wrong: a DRM denial and an unsupported codec need a fallback. Distractor in check 3.
- S07-M23: "A 419 means retry after a wait." Wrong: it marks token or session expiry, so handle it like auth. Distractor in check 4.
- S07-M24: "Only the status code carries the retry signal." Wrong: the response body can say "degraded" or "try again in N minutes". Distractor in check 5.
- S07-M25: "Every player failure is a network failure." Wrong: iOS ResetMedia answers a failure in device media state, not in a request. Distractor in check 3.

**Diagrams.** (1) Static: one play session as a timeline, with the manifest, the key and the segments marked, and a different budget on each. (2) Static: the switch-against-retry table from slide 26. (3) Step-by-step: a live-edge 404 that becomes a 200 on attempt 2, next to an on-demand 404 that stays 404.

**Interactives.** *Player failure triage* (P1). Inputs: a failure card from the case study, such as "DRM key denied", "CDN edge not responding", "segment 404 at the live edge", "codec unsupported", "ad timeout". The learner picks retry, switch, fall back, or rebuild. The learner sees the reason and the time budget. The learner discovers that most of the hardest cards are not retry cards.

**Predict, observe, explain.** No slide captures a run, and no code exists. Planned capture: `ffprobe` against an HLS playlist, then a request for a segment index past the live edge. Predict: does the newest segment exist? Observe: a 404 on the index past the edge, and a 200 a moment later. Mark this as a planned capture until someone runs it.

- **Worked example.** Five cards, triaged. "DNS server not responding": retry, or switch CDN. "Read timeout on a segment": retry, with the segment budget. "CDN edge not responding": switch CDN. "DRM key denied": fall back to a lower tier. "iOS media state broken": rebuild the pipeline.
- **Faded example.** "Master DASH manifest fails." Answer: ____. Why: ____. *(Fall back to an HLS rendition of the same content. Retrying DASH repeats the same failure.)*
- **Your turn.** "Ad request times out after 3 s." *(Fall back to content. The user budget for an ad failure is near zero, so no retry is worth the wait.)*

**Checks.**
1. `mcq`: a player asks for the newest live segment and gets 404. What is right? Answer: 2 or 3 attempts with a small fixed delay. Distractor: stop, because 404 means gone (S07-M20). Distractor: full exponential backoff with 5 attempts (S07-M21). Distractor: switch CDN at once (S07-M20). Feedback: the origin may still be encoding it, so the segment exists in a moment.
2. `mcq`: where does that bounded retry belong? Answer: live-edge segment requests only. Distractor: every 404 in the player (S07-M21). Distractor: every segment request (S07-M21). Distractor: every manifest request (S07-M21). Feedback: an on-demand 404 still means give up.
3. `multi`: which failures need a fallback rather than a retry? Answer: a denied DRM key, an unsupported codec, a broken device media state. Distractor: a read timeout on a segment (S07-M22). Distractor: a 503 from the edge (S07-M22). Feedback: none of the three clears on its own, so the same request returns the same answer.
4. `mcq`: your player gets 419 from its own backend. What do you do? Answer: handle it like auth, with a refresh. Distractor: retry with backoff (S07-M23). Distractor: stop, it is not in the RFC (S07-M23). Distractor: switch CDN (S07-M23). Feedback: 419 marks token or session expiry.
5. `mcq`: a 200 response body says "degraded, use lower bitrate". What should the player read? Answer: both the status and the body. Distractor: the status only, a 200 means proceed (S07-M24). Distractor: the body only (S07-M24). Distractor: neither, wait for a 5xx (S07-M24). Feedback: the application layer can say more than the status line can.

**Review cards.**
- Q: How does a player failure look to a user? A: A frozen frame, or a spinner.
- Q: How many requests does one play session make? A: Hundreds: a manifest, a key, and dozens of segments.
- Q: What is the one named 404 exception? A: The newest segment of a live stream.
- Q: What is the fix for a live-edge 404? A: 2 or 3 attempts with a small fixed delay, for live-edge segments only.
- Q: Which three player failures need a fallback, not a retry? A: A denied DRM key, an unsupported codec, a broken device media state.
- Q: What does a multi-CDN player do when an edge stops answering? A: It switches CDN rather than retrying the same one.
- Q: What do 419, 474 and 475 have in common? A: No registry entry, so each deployment must document them.
- Q: What is the player retry budget made of? A: Human patience: seconds of rebuffering, not minutes.

### s07-m06-systems-that-survive

- **Title:** Answer with something worse, and survive the recovery. **Minutes:** 20.
- **Big idea:** A system that can answer with slightly-wrong data survives outages that a perfect-or-nothing system does not, and the most dangerous moment is the recovery.
- **Covers:** S07-C168, S07-C169, S07-C170, S07-C171, S07-C172, S07-C173, S07-C174, S07-C175, S07-C176, S07-C177, S07-C178, S07-C179, S07-C180, S07-C181, S07-C182, S07-C183, S07-C184, S07-C185, S07-C186, S07-C187, S07-C188, S07-C189, S07-C190, S07-C191, S07-C192, S07-C193, S07-C194, S07-C195.
- **Prereqs:** s07-m04-retry-mechanics, s06-m03-caching-defaults, s06-m05-cache-bugs, s03-m06-stateless-servers.
- **Threads:** T-network-not-function, T-fix-causes-next.

**Pretest.**
1. Your origin dies and your CDN keeps serving. Which directive makes that legal? *Answer: stale-if-error, from RFC 5861.*
2. A dependency comes back after an hour. What is the traffic shape in the first second? *Answer: close to normal traffic, against a server at a fraction of capacity.*
3. Name one answer that is worse than the ideal and better than nothing. *Answer: a lower bitrate, a stale price, or cached recommendations.*

**Rung 1, the picture.** A town has one bakery and the oven breaks. A shop with no plan puts up a "closed" sign. A shop with a plan sells yesterday's bread, marked as yesterday's, and most people buy it. When the oven comes back, a worse problem starts. Everyone who walked away in the morning comes back in the same ten minutes, and the oven is still warming up. The fix is not more bread. It is to let people in at a steady rate, and to tell them different times to return. *Where the analogy breaks:* bread has a visible date and a stale cache does not, unless the cache says so. RFC 5861 asks a cache to stay visibly stale, with a non-zero `Age`.

**Rung 2, how it works.**
1. Decide, before the incident, which answers may be worse than the ideal.
2. Let the cache keep its last good copy when it cannot reach the origin. That is stale-if-error.
3. Route around a dead primary when a breaker opens on it: a second region, provider or CDN.
4. Keep a flag that disables an expensive feature with no deploy, so load leaves the critical path in seconds.
5. Degrade instead of refusing: a lower bitrate, cached recommendations, a slightly stale price.
6. Plan the recovery. Keep jitter on. Stagger the half-open probes. Ramp the server up instead of opening it at full rate.

**Rung 3, the real thing.** Slide 31 carries three numbers from the Fastly outage of 8 June 2021 and cites stale-if-error (RFC 5861). Slide 32 gives the three system-level levers. Slide 33 gives the recovery problem and three mitigations. The Fastly numbers check out against the company blog of the same day.

**Numbers, with their conditions.**

| Number | What it measures | Conditions |
|---|---|---|
| 85% | the share of the Fastly network returning errors | global, 8 June 2021, from Fastly's own blog |
| about 1 minute | onset 09:47 UTC to detection 09:48 UTC | Fastly monitoring, their timeline |
| 49 minutes | onset 09:47 UTC to 95% of the network normal, 10:36 UTC | Fastly's own measure of recovery, not full mitigation |
| 2 h 48 min | onset 09:47 UTC to "incident mitigated" 12:35 UTC | the same timeline, the number the slide does not show |
| 1% capacity, 100% traffic | the recovery mismatch | illustrative on the slide, with no machine and no measurement |

**Rung 4, exam depth.**
- *Why stale-if-error is not a retry.* It changes the answer, not the attempt. The cache decides to serve a known-stale copy rather than nothing (S07-C177). RFC 5861 section 4 scopes "an error" to 500, 502, 503 and 504.
- *Why the recovery is worse than the failure.* The clients synchronized during the outage, because they all started failing at the same moment. The server is cold, so its capacity is low exactly when demand peaks (S07-C188, S07-C190).
- *Why a flag beats a deploy.* A deploy takes minutes and carries risk. A flag takes seconds and carries none, which is why it is the only lever usable during an incident (S07-C183).
- *What if your fallback is also down?* Then you are back at step 5 of the synthesis with nothing left, and the honest answer is a user-visible error with a real message. Name that path in the design.
- *What the 49 minutes does not prove.* It is a vendor recovery number. It says nothing about what any customer saw, and it says nothing about full mitigation, which took 2 h 48 min. Our check, not the slide.
- *Exam prompts.* (1) Your edge provider has a global outage. Which of the five synthesis steps can your client-side code use? *Model answer: only step 5. Steps 1 to 4 need a healthy path to protect, and there is none, so the answer is a stale copy, a second provider, or a smaller answer.* (2) You add jitter and the recovering service still falls over. Name two more mitigations. *Model answer: stagger the half-open probes across clients, and ramp the server acceptance rate instead of opening at full capacity.*

**Misconceptions.**
- S07-M26: "stale-if-error is a kind of retry." Wrong: it serves known-stale data instead of nothing. Distractor in check 1.
- S07-M27: "The failure is the most dangerous moment of an incident." Wrong: the recovery is. Distractor in checks 2 and 3.
- S07-M28: "A feature flag needs a deploy." Wrong: a flag works in seconds, and that is the point. Distractor in check 4.
- S07-M29: "A breaker in OPEN means a total outage for the caller." Wrong: the caller routes to a backup, or degrades. Distractor in check 4.
- S07-M30: "Fastly fixed the whole 8 June 2021 outage in 49 minutes." Wrong: 49 minutes got the network to 95%. Mitigation finished at 12:35 UTC, 2 h 48 min after onset. Our check. Distractor in check 5.

**Diagrams.** (1) Static: the Fastly timeline as a bar, with onset, detection, 95% recovered and mitigated marked. (2) Static: the three levers of slide 32 as three columns, each with one real example. (3) Animation: the recovery spike. A server capacity curve ramping from 1%, against a demand spike at 100%, with and without jitter and staggered probes.

**Interactives.** *The second outage* (P1). Inputs: client count, jitter on or off, probe staggering on or off, server ramp rate. The learner sees whether the recovering service holds or falls over again. The learner discovers that jitter alone is not always enough. *Simulator spec:* a pure function over discrete 100 ms ticks. Demand at tick t is the number of clients whose backoff expires in that tick. Server capacity at tick t is `min(1, ramp * t)` of normal. A tick where demand exceeds capacity re-opens the outage. Keep it a model, and label it one.

**Predict, observe, explain.** No command exists, because no code backs this class. Planned capture: run the Session 7 wrapper of module 8 against `/always-down`, with 50 concurrent clients, then let the server recover. Predict: do the circuit breakers probe together or apart? Observe: together, unless the probe time carries jitter too.

- **Worked example.** The Fastly timeline, in elapsed minutes from onset at 09:47 UTC. Detection 09:48 is 1 minute. 95% normal at 10:36 is 49 minutes. Majority recovered at 11:00 is 73 minutes. Mitigated at 12:35 is 168 minutes, which is 2 h 48 min.
- **Faded example.** The status post went up at 09:58 UTC. Elapsed from onset: ____ minutes. The cause was found at 10:27. Elapsed: ____ minutes. *(11. 40.)*
- **Your turn.** A service has 20,000 clients, all with the slide 21 policy and no jitter. The service returns at t = 0. How many requests land in the first instant? *(20,000. Every client computed the same delay, so they all arrive together.)*

**Checks.**
1. `mcq`: your origin is unreachable and your CDN keeps answering with an old copy. What made that legal? Answer: the stale-if-error directive. Distractor: a retry inside the CDN (S07-M26). Distractor: a circuit breaker at the edge (S07-M26). Distractor: a 304 from the origin (S07-M26). Feedback: RFC 5861 lets a cache serve a stale copy when the origin errors.
2. `mcq`: which moment of an incident is the most dangerous? Answer: the moment the dependency comes back. Distractor: the moment it fails (S07-M27). Distractor: the moment the first alert fires (S07-M27). Distractor: the moment the fix deploys (S07-M27). Feedback: the clients are synchronized and the server is cold.
3. `multi`: which three mitigations does slide 33 name for the recovery spike? Answer: jitter, staggered half-open probes, server slow start. Distractor: a longer timeout (S07-M27). Distractor: more retry attempts (S07-M27). Feedback: all three spread demand or ramp supply.
4. `mcq`: a breaker opens on your primary payment provider. What should the caller do? Answer: route to a backup, or degrade the feature. Distractor: show an error page, there is nothing left (S07-M29). Distractor: keep calling quietly in the background (S07-M29). Distractor: deploy a fix (S07-M28). Feedback: OPEN means stop asking that dependency, not stop answering the user.
5. `numeric`: Fastly's onset was 09:47 UTC and mitigation finished at 12:35 UTC. How many minutes is that? Answer: 168. Distractor: 49 (S07-M30). Distractor: 73 (S07-M30). Feedback: the 49 minutes measures 95% recovered, not full mitigation.

**Review cards.**
- Q: What does stale-if-error do, and which RFC defines it? A: It lets a cache serve its last good copy on an origin error. RFC 5861.
- Q: Is stale-if-error a retry? A: No. It changes the answer, not the attempt.
- Q: Name the three system-level levers of slide 32. A: Failover, feature flags, graceful degradation.
- Q: Why is a feature flag the incident lever? A: It needs no deploy, so it works in seconds.
- Q: What is the most dangerous moment of an incident? A: The recovery.
- Q: Why do clients synchronize during an outage? A: They all started failing at the same moment, so their backoff schedules line up.
- Q: Name the three recovery mitigations. A: Jitter, staggered half-open probes, server slow start.
- Q: What three numbers does slide 31 give? A: 85% of the Fastly network erroring, about 1 minute to detect, 49 minutes to 95% recovered, on 8 June 2021.
- Q: What does the 49 minutes not cover? A: Full mitigation, which took 2 h 48 min.

### s07-m07-synthesis

- **Title:** One chain of five steps, and the question it leaves open. **Minutes:** 15.
- **Big idea:** Five steps in order decide every failure of the class, and each step runs only when the step above it found no answer.
- **Covers:** S07-C196, S07-C197, S07-C198, S07-C199, S07-C200, S07-C201, S07-C202, S07-C217, S07-C218, S07-C219, S07-C220, S07-C221, S07-C222, S07-C223.
- **Prereqs:** s07-m01-failure-taxonomy, s07-m02-retry-definitions, s07-m03-when-to-retry, s07-m04-retry-mechanics, s07-m05-player-case-study, s07-m06-systems-that-survive.
- **Threads:** T-network-not-function.

**Pretest.**
1. You classified a failure as structural. Do you reach the backoff step? *Answer: no. Step 2 stops the chain.*
2. Your breaker is open and you have no backup. Which step are you on? *Answer: step 5, and the answer must be something worse than the ideal.*

**Rung 1, the picture.** A doctor in an emergency room runs a fixed order. First, what is wrong. Second, is it something nothing can change right now, such as a missing limb. If so, stop treating it as an emergency and start treating it as a fact. Third, if it will pass, give time and a measured dose, not every dose at once. Fourth, if this patient keeps coming back with the same thing, stop treating the symptom and change the plan. Fifth, when nothing cures it, make the patient comfortable. Nobody skips to step five first, and nobody stays on step three forever. *Where the analogy breaks:* a doctor gets new information at every step. A client often gets none, so the chain runs on classification, not on observation.

**Rung 2, how it works.**
1. Classify. Where did it fail? Did the server admit fault or refuse you? Is the action idempotent?
2. Structural? A 404, a geo-block, a preflight refusal or a bad credential ends the chain. Handle it, do not retry it.
3. Transient? Back off with full jitter, cap the attempts, and honor `Retry-After` when the server sends one.
4. Dependency level? Repeated failures trip a breaker, so later calls fail fast and cost nothing.
5. No good answer left? Fail over, degrade, or serve stale. Anything but nothing.

**Rung 3, the real thing.** Slide 34 draws the five steps as one column with arrows down. Slide 37 closes the class: week 8 puts this policy inside a real video pipeline, and the closing question asks when "worse" stops being acceptable, and who decides.

**Rung 4, exam depth.**
- *Why the order matters.* Step 3 is the expensive step. A structural failure that reaches step 3 burns the full backoff ceiling for nothing, and a human waits through it.
- *Why step 4 is not step 3 with a bigger number.* Step 3 counts attempts inside one request. Step 4 counts failures across every request to one dependency, and it remembers.
- *Why step 5 exists at all.* Steps 1 to 4 all assume a healthy path somewhere. When there is none, the only remaining choice is the quality of the answer (S07-C221).
- *Where each module lands on the chain.* Module 1 and module 3 own step 1 and step 2. Module 4 owns step 3 and step 4. Module 5 adds a per-source variant of step 5. Module 6 owns step 5 at system scale.
- *Exam prompts.* (1) Walk a timed-out payment POST through all five steps. *Model answer: step 1, stage 6, 5xx or no response, not idempotent. Step 2, not structural. Step 3, retry with the same idempotency key, backoff with jitter, capped. Step 4, repeated failures open the breaker on the payment provider. Step 5, degrade: queue the payment and tell the user, or route to a second provider.* (2) Which step did a client skip, if a 404 costs it 3 seconds of backoff? *Model answer: step 2. It never classified the failure as structural.*

**Misconceptions.**
- S07-M31: "The five steps are five independent choices." Wrong: it is a chain, and each step runs only when the step above found no answer. Distractor in checks 1 and 2.
- S07-M32: "Step 5 is a failure of engineering." Wrong: a worse answer beats no answer, and the class calls it the thing that survives. Distractor in check 3.
- S07-M16 and S07-M18 appear again in checks 2 and 4.

**Diagrams.** (1) Static: the five-step column of slide 34, with each step labelled by the module that teaches it. (2) Step-by-step: one failure walking the chain, with the exit point highlighted for a 404, a 503 and a dead provider.

**Interactives.** *The five-step walker* (P1). Inputs: a failure card, reused from module 1 and module 3. The learner steps the chain one step at a time and sees where the card exits. The learner discovers that most cards exit at step 2 or step 3, and that only a dead dependency reaches step 5.

**Predict, observe, explain.** No command. Planned capture: the module 8 wrapper logging the step it took for each failure, against the three misbehaving routes of slide 35.

- **Worked example.** `GET /missing.png` returns 404. Step 1: stage 5, client refused, idempotent. Step 2: structural, so stop. Steps 3 to 5 never run. Cost: one request.
- **Faded example.** `GET /report` returns 503 with `Retry-After: 5`, twice, then succeeds. Exit step: ____. Total wait: ____. *(Step 3. 10 s, because the header number replaces the curve both times.)*
- **Your turn.** Your only payment provider has been returning 500 for ten minutes, and your breaker is open. *(Step 5. Fail over to a second provider, or degrade: accept the order and settle later, and tell the user.)*

**Checks.**
1. `order`: put the five steps in the order the class gives them. Answer: classify, structural stop, transient retry, dependency breaker, no answer left. Feedback: each step runs only when the step above it found no answer (S07-M31).
2. `mcq`: a 404 costs your client 3 s of backoff. Which step did it skip? Answer: step 2, the structural stop. Distractor: step 1, classify (S07-M31). Distractor: step 4, the breaker (S07-M31). Distractor: none, 3 s is the correct ceiling (S07-M18). Feedback: a structural failure must leave the chain before the retry step.
3. `mcq`: every path is dead and your breaker is open. What does step 5 ask for? Answer: a worse answer, such as stale data or a lower quality. Distractor: a longer backoff (S07-M31). Distractor: an error page, because engineering failed (S07-M32). Distractor: a higher attempt cap (S07-M31). Feedback: anything but nothing.
4. `mcq`: which step counts failures across many requests? Answer: step 4. Distractor: step 3 (S07-M16). Distractor: step 1 (S07-M31). Distractor: step 5 (S07-M31). Feedback: step 3 counts attempts inside one request.

**Review cards.**
- Q: Name the five steps of the synthesis chain, in order. A: Classify, structural stop, transient retry, dependency breaker, no answer left.
- Q: What ends the chain at step 2? A: A 404, a geo-block, a preflight refusal, or a bad credential.
- Q: What does step 3 require? A: Backoff with full jitter, a cap on attempts, and `Retry-After` when given.
- Q: What does step 4 count, and what does step 3 count? A: Step 4 counts failures per dependency. Step 3 counts attempts per request.
- Q: What are the three answers of step 5? A: Fail over, degrade gracefully, or serve stale.
- Q: What is the closing question of the class? A: When does "worse" stop being acceptable, and who decides?

### s07-m08-build-the-wrapper

- **Title:** Build it: a resilient-call wrapper, and the plot that proves it. **Minutes:** 25.
- **Big idea:** A policy is only real when a timestamp plot shows the backoff curve, the circuit opening, and the circuit closing again.
- **Covers:** S07-C203, S07-C204, S07-C205, S07-C206, S07-C207, S07-C208, S07-C209, S07-C210, S07-C211, S07-C212, S07-C213, S07-C214, S07-C215, S07-C216.
- **Prereqs:** s07-m03-when-to-retry, s07-m04-retry-mechanics, s07-m07-synthesis, s01-m04-clients, s05-m12-assignment-prep.
- **Threads:** T-network-not-function, T-honest-benchmarks.
- **Integrity note.** Slide 35 is a "things to try" task, due before Session 8. It is not graded work. Rule 4 of `CLAUDE.md` names the graded set: the calculator assignment, the binary HTTP project, and the real quiz questions. So this page gives the requirement checklist, a test plan and a hint ladder, and no solution code. Section 7 records the judgement.

**Pretest.**
1. Your wrapper retries a 404. Which requirement did you miss? *Answer: the classify step. A 404 is structural.*
2. Your plot shows five requests at exactly 0.0, 0.2, 0.6 and 1.4 seconds. Which knob is off? *Answer: jitter. Those are the bare ceilings.*

**Rung 1, the picture.** A driving instructor does not ask whether you know the rules. The instructor takes you to a quiet road, pulls the handbrake at a random moment, and watches what you do. A test server that fails on command is that quiet road. The plot of your request times is the dashcam.

**Rung 2, how it works.** These are the requirements, not an order of code steps.
1. The wrapper classifies the failure as retryable or not, by the rules of module 3.
2. It backs off with full jitter and stops at a max attempt count.
3. It honors a `Retry-After` header when the server sends one.
4. It opens a circuit after N consecutive failures to the same dependency, and fails fast while the circuit is open.
5. The test server can misbehave on command on three routes.
6. The deliverable is the wrapper, the test server, and a log or plot of request timestamps under each failure mode.

**Rung 3, the real thing.**

| # | Requirement from slide 35 | Expected evidence |
|---|---|---|
| 1 | classify retryable against not retryable | a 404 costs one request, a 503 costs several |
| 2 | full jitter, capped at a max attempt count | gaps that differ across clients, and a hard stop |
| 3 | honor `Retry-After` | the gap matches the header, not your curve |
| 4 | open a circuit after N consecutive failures | calls after the Nth return at once, with no network time |
| 5 | fail fast while open | the elapsed time per call drops to near zero |
| 6 | route `/sometimes-500` | fails a configurable fraction of the time |
| 7 | route `/always-503-with-retry-after` | every answer carries the header |
| 8 | route `/always-down` | enough consecutive failures to trip the circuit |
| 9 | the plot | the backoff curve, the circuit opening, and the circuit closing again |

**Test plan** (run against your own wrapper and your own server).
1. Point the wrapper at `/sometimes-500` with a 50% failure rate and 200 calls. Expect most calls to succeed within the cap, and a few to exhaust it.
2. Point it at a route that returns 404. Expect exactly one request on the wire.
3. Point it at `/always-503-with-retry-after` with `Retry-After: 2`. Expect gaps near 2 s, not near your ceilings.
4. Point it at `/always-down`. Expect N network calls, then calls that return with no network time.
5. Let `/always-down` start answering 200. Expect one probe, then normal traffic.
6. Run 50 clients at `/always-down` at once. Expect the probes to cluster, unless you jittered the probe time too.
7. Plot every request timestamp per mode. The curve, the flat region and the restart must all be visible.

**Hint ladder.** Open one hint at a time.
1. Write down the five steps of module 7 on paper. Which step owns each requirement of slide 35?
2. Which of the failures in your test server are structural, and which are transient? What does your code do differently for each?
3. Run the same 200 calls twice and plot both. Do the two plots look alike? What would make them differ?
4. The server told you to wait 2 seconds. Where in your code does that number win over your own?
5. Your circuit counter lives somewhere. Does a second call to the same host see the same counter?
6. After the circuit opens, how long is one call? Measure it, do not reason about it.
7. Fifty clients, one dead host. When the host returns, how many probes arrive, and in what window?
Hints 2 to 7 are questions, not instructions, so that the ladder read end to end does not become a design.

**Diagrams.** (1) Static: the nine requirement rows of rung 3 as a checklist, each one next to the evidence that proves it. (2) Static: one finished plot, annotated: the growing gaps, the flat fail-fast region, and the single probe that restarts traffic. The lesson page draws a sample plot from the module 4 simulator, never from a learner solution.

**Rung 4, exam depth.**
- *Why the plot is the deliverable.* A policy with a bug still runs. Only the timestamps show a missing jitter draw, a cap that never fires, or a circuit that never closes (`T-honest-benchmarks`).
- *What the plot must not hide.* A single client cannot show the herd. Run many clients, or the jitter requirement proves nothing.
- *Where the state lives.* The attempt counter is per call. The circuit counter is per dependency, and it must outlive the call. That choice is the whole difference between requirement 2 and requirement 4.
- *Exam prompt.* Your wrapper passes every test and the upstream still falls over on recovery. Name the missing piece. *Model answer: the half-open probes are not staggered, so every client probes at once.*

**Interactives.** *Read the plot* (P1). Inputs: four prepared timestamp plots, one per failure mode, three correct and one broken. The learner names which requirement each plot proves, and which one the broken plot fails. The learner discovers that the shape, not the code, is the proof. No interactive builds the wrapper, so no page shows a solution.

**Predict, observe, explain.** Command: the module 4 backoff playground at `base=0.2`, `cap=8.0`, `max_attempts=5`, jitter off, then on, with 50 clients. Predict: which run looks like the plot your wrapper must produce? Observe: the jittered run, because the gaps differ across clients. No slide captures a run of this task.

- **Worked example.** A plot of one client against `/always-503-with-retry-after` with `Retry-After: 2`. Request times: 0.0, 2.0, 4.0, 6.0 s, then a stop. Reading: requirement 3 holds, because the gaps match the header and not the 0.2, 0.4, 0.8 ceilings. Requirement 2 holds, because the client stopped at the cap.
- **Faded example.** A plot against `/always-down` with N = 3. Network calls: ____. Calls after that with near-zero elapsed time: ____. *(3. Every later call, until the cooldown ends.)*
- **Your turn.** A plot shows 50 clients all making their second request inside a 5 ms window. *(Jitter is missing, or the probe time carries no jitter. All 50 computed the same delay.)*

**Misconceptions.**
- S07-M33: "One client is enough to prove the jitter works." Wrong: jitter spreads clients apart, so a single client shows nothing. Distractor in check 2.
- S07-M17, S07-M18, S07-M20 and S07-M31 appear again in checks 1 and 3.

**Checks.**
1. `mcq`: your plot shows 5 requests at 0.0, 0.2, 0.6 and 1.4 s for every client. Which requirement failed? Answer: full jitter. Distractor: the max attempt cap (S07-M18). Distractor: the classify step (S07-M31). Distractor: `Retry-After` (S07-M17). Feedback: those gaps are the bare ceilings, so no random draw happened.
2. `mcq`: how do you prove the jitter requirement? Answer: plot many clients and show their gaps differ. Distractor: plot one client over many runs (S07-M33). Distractor: print the formula (S07-M33). Distractor: show the total request count fell (S07-M33). Feedback: jitter decorrelates clients, so the proof needs more than one.
3. `mcq`: your 404 test shows 5 requests on the wire. Which step is missing? Answer: step 2, the structural stop. Distractor: step 3, the backoff (S07-M31). Distractor: step 4, the breaker (S07-M31). Distractor: nothing, 5 is the cap (S07-M20). Feedback: a structural failure must end the chain at one request.

**Review cards.**
- Q: What four things must the slide 35 wrapper do? A: Classify, back off with full jitter and a cap, honor `Retry-After`, and open a circuit.
- Q: Name the three routes of the test server. A: `/sometimes-500`, `/always-503-with-retry-after`, `/always-down`.
- Q: What is the deliverable? A: The wrapper, the test server, and a log or plot of request timestamps.
- Q: What three features must the plot show? A: The backoff curve, the circuit opening, and the circuit closing again.
- Q: Why does a one-client plot not prove jitter? A: Jitter spreads clients apart, so the proof needs many clients.

## 6. Beyond the slides

Every row holds a fact that a lesson page of this session needs, and that the
deck does not state. A page that shows one of these rows carries the "beyond
the slides" badge. The RFC rows come from the RFC text, read on 2026-10-10.

| Fact | Reference |
|---|---|
| Idempotency covers only what the user asked for. A server stays free to log each call, to keep a revision history, or to add other side effects. So "GET is idempotent" never promises that the server does nothing. | RFC 9110 §9.2.2 |
| Two limits the method table does not show. "A proxy MUST NOT automatically retry non-idempotent requests." "A client SHOULD NOT automatically retry a failed automatic retry." | RFC 9110 §9.2.2 |
| A client SHOULD NOT auto-retry a non-idempotent method. Two exceptions exist: the client knows the semantics are idempotent anyway, or the client can detect that the first request never applied. The second exception is the read-back fallback when no idempotency key exists. | RFC 9110 §9.2.2 |
| A 404 does not say whether the absence is temporary or permanent. 410 Gone is the code for a permanent one. A 404 is also heuristically cacheable, so a CDN can store it. The live-edge exception of slide 27 therefore has an RFC basis. | RFC 9110 §15.5.5, §15.5.11 |
| On a 408 the RFC says that a client with a request still in transit "MAY repeat that request". RFC 9110 dropped the older advice to send the close option with a 408. | RFC 9110 §15.5.9, RFC 7231 §6.5.7 |
| A 503 only MAY carry Retry-After. The RFC adds a note: an overloaded server does not have to send 503, because some servers simply refuse the connection. So a client cannot wait for a 503 to learn about overload. | RFC 9110 §15.6.4 |
| Retry-After holds an HTTP-date or a count of seconds. RFC 9110 defines it for a 503 and for any 3xx. It does not define it for a 429. | RFC 9110 §10.2.3 |
| 429 Too Many Requests is not in RFC 9110. RFC 6585 defines it, says the response MAY carry Retry-After, and adds that a cache MUST NOT store a 429. | RFC 6585 §4 |
| 501 and 505 are permanent statements about the server. A retry of either one changes nothing, so "5xx means usually retry" has two named exceptions outside the deck. | RFC 9110 §15.6.2, §15.6.6 |
| 425 Too Early is a third retryable 4xx, next to the 408 and 429 of slide 22. A user agent SHOULD retry it automatically, and the retry MUST NOT travel in early data. | RFC 8470 §5.2 |
| A client MUST treat an unknown status code as the x00 code of its class. The RFC example is 471, which a client reads as a 400. So a generic client reads the 419, 474 and 475 of slide 27 as "stop", and only a player that knows the contract can do better. | RFC 9110 §15 |
| A client SHOULD treat a status code outside 100 to 599 as a 5xx. The player numbers 8018 and 8022 of slide 28 are not HTTP status codes at all. | RFC 9110 §15 |
| A 307 keeps the method, because a user agent MUST NOT change it. A 301 or a 302 may turn a POST into a GET, because early clients did that first. This is why slide 13 calls a redirect handling, not a retry. | RFC 9110 §15.4.8, §15.4 |
| A client that pipelines SHOULD retry the unanswered requests after a connection closes. It MUST NOT pipeline again at once on the new connection, because the lost error response can die a second time. | RFC 9112 §9.3.2 |
| An abrupt close can destroy the last response. The reset packet can erase the unread input buffer of the client before its parser reads it. Careful servers close in stages for this reason. | RFC 9112 §9.6 |
| socket(7) does not document the reset that a zero linger time causes. The references for the slide 8 behaviour are Stevens and the kernel close path. | Stevens, UNIX Network Programming, volume 1, 3rd edition, §7.5. Linux `net/ipv4/tcp.c`, `tcp_close()` |
| Linux retransmits the SYN six times by default, so a connect with no timeout of your own can block for about 127 seconds. An established connection gives up after 15 retransmissions, which is 13 to 30 minutes. Stage 2 and stage 6 of slide 10 therefore have OS-set clocks. | tcp(7), `tcp_syn_retries`, `tcp_retries2`. Read on Linux 7.1.8, 2026-10-10 |
| The stub resolver already retried before your code saw a DNS failure. The defaults are a 5-second timeout and 2 attempts for each name server. | resolv.conf(5), RES_TIMEOUT, RES_DFLRETRY |
| A resolver MAY cache a server failure for up to five minutes, against one query tuple. So an immediate retry after a DNS failure can read a cached failure, not a fresh query. | RFC 2308 §7.1 |
| stale-if-error scopes "an error" to a 500, 502, 503 or 504. Its value sets the upper limit of staleness, and a copy staler than that SHOULD NOT answer. Slide 31 gives the directive without the bound. | RFC 5861 §4 |
| RFC 5861 asks a stale answer to stay visible, with a non-zero Age field and a Warning field. RFC 9111 then obsoleted Warning, because caches did not add it. So the Age field is the only visible mark left. | RFC 5861 §4, RFC 9111 §5.5 |
| A conforming HLS client learns about a new segment only when it reloads the media playlist, and the reload rate has a floor of one target duration. So the live-edge 404 of slide 27 means the playlist at that edge ran ahead of the segment at that edge. | RFC 8216 §6.2.2, §6.3.4 |
| The full Fastly timeline, 8 June 2021, all UTC: 09:47 onset, 09:48 detected, 10:27 cause found, 10:36 at 95 per cent normal, 11:00 majority recovered, 12:35 mitigated. A deploy of 12 May carried the bug, and a customer configuration change triggered it. Slide 31 shows only the first three numbers. | Fastly blog, "Summary of June 8 outage", 8 June 2021 |
| The original post gives three jitter variants: full jitter, equal jitter and decorrelated jitter. Slide 21 teaches the first one and does not name the other two. | Marc Brooker, "Exponential Backoff And Jitter", AWS Architecture Blog, 4 March 2015 |
| A production breaker counts over a window, not a bare N. Envoy ejects a host after 5 consecutive 5xx by default, sweeps every 10 s, and ejects at most 10 per cent of a cluster. | envoyproxy.io, outlier detection API v3 defaults. Read 2026-10-10 |
| A breaker cooldown can grow by itself. Envoy multiplies its 30-second base ejection time by the number of times it already ejected that host. Slide 23 gives one flat cooldown. | envoyproxy.io, outlier detection API v3, `base_ejection_time` |
| curl retries nothing by default. With `--retry` it treats a timeout and the codes 408, 429, 500, 502, 503, 504, 522 and 524 as transient. It waits 1 second, doubles the wait to a 10-minute ceiling, and adds no jitter. A widely used client ships the slide 20 danger in a tamer form. | `curl` 8.18.0 man page, `--retry`. Read 2026-10-10 |
| RFC 9110 defines no idempotency key field. The de facto contract comes from Stripe: the server saves the status and body of the first request, keys may go after 24 hours, and a key reused with other parameters gives an idempotency error, not the saved response. | docs.stripe.com, "Idempotent requests". Read 2026-10-10 |
| The circuit breaker comes from the stability patterns chapter of "Release It!", next to Timeouts and Bulkheads. Nobody checked a page number for this file, so a lesson page cites the chapter, not a page. | Nygard, "Release It!", Pragmatic Bookshelf, 2007. See section 7 item 13 |
| DRM levels: Widevine L1 keeps the keys and the media handling inside the trusted execution environment of the device. L3 runs in software with no such environment, and studios then cap the resolution. So the L1 to L3 fallback of slide 28 trades picture quality for playback. | Google Widevine DRM architecture overview. Not re-read for this file, see section 7 item 13 |
| Retries multiply down a call chain. Three attempts at each of three layers can reach 27 calls at the bottom. The arithmetic is ours. The AWS answer is one retrying layer plus a retry budget. | Our arithmetic. Amazon Builders' Library, "Timeouts, retries, and backoff with jitter". Not re-fetched, see section 7 item 13 |

## 7. Open questions

1. **The date of the class, and the clash about week 7.** This class ran on Friday 2026-09-25. Slide 4 prints "Today" under the assignment row of 25th Sep, Friday. `date -d` confirms every weekday on that slide: 21 September and 12 October are Mondays, 25 September is a Friday, and 8 October is a Thursday, which the slide leaves unnamed. Slide 5 puts "Building for failures" in week 7 and "Streaming video at large scale" in week 8. `na-site/CLAUDE.md` still lists week 7 as "Economics of cloud tech" and week 8 as "Building for failures" on Friday 2026-10-02, and it calls that table the official one. `docs/curriculum/README.md` already follows the decks. Confirm the order on the course platform, then correct one of the two files. This task may not touch either file.
2. **Footer numbers against PDF pages.** The deck prints `N / 32` and gives no footer to the two code pages, 7 and 8. So PDF page = footer + 3 for footers 2 and 3, and PDF page = footer + 5 from footer 4 onward. Every internal reference of the deck uses the footer number. The full list, checked one by one:

   | On PDF page | The deck says | It means PDF page |
   |---|---|---|
   | 11 | "from slide 9 onward" | 14 |
   | 16 | "the CDN-propagation exception, slide 22" | 27 |
   | 16 | "a token refresh ... not a retry (slide 8)" | 13 |
   | 27 | "General rule from slide 11" | 16 |
   | 32 | "A circuit breaker (slide 18)" | 23 |
   | 33 | the callback line, "slide 16", on jitter at fleet scale | 21 |
   | 33 | "jitter (already have it, slide 16)" | 21 |
   | 36 | "the naive retry loop (slide 15)" | 20 |
   | 36 | "the backoff+jitter version (slide 16)" | 21 |
   | 36 | "the definition from slide 8" | 13 |
   | 36 | "the five-step framework (slide 29)" | 34 |

   Each target is correct under that scheme, so no cross-reference of the deck is broken. Lesson pages use PDF numbers only.
3. **Three changes that `docs/curriculum/README.md` needs.** This task edits one file, so nobody made them yet. (1) Add `s07-m08-build-the-wrapper` (35) to the Session 7 row. (2) Raise "the same 85 modules" to 86. (3) Widen the `s07-m01-failure-taxonomy` range from 9-11 to 6-11, because m01 teaches the agenda of slide 6 and both code pages, 7 and 8.
4. **Two proposed threads.** `T-worse-not-nothing`: a system that can answer with something worse than the ideal survives an outage that a perfect-or-nothing system does not. It runs through the stale hit of Session 6, every fallback of this class, and the adaptive bitrate of Session 8. `T-herd-on-recovery`: clients that fail together retry together, so the recovery needs randomness, staggering and a ramp. Session 6 previewed it (S06-C267) and Session 7 teaches it. Both need a row in the README thread table before a module lists them. Until then the modules list only existing threads.
5. **The status of the task on slide 35.** Our reading is practice, not graded work. For that reading: the title of the slide reads "Things to try", slide 4 names one assignment submission and it is the Session 5 calculator, and the grading scheme carries one assignment at 20 per cent. Against it: the footer label of slide 35 reads "ASSIGNMENT", the slide says "the same kind of evidence Session 6's assignment asked for", and the Session 6 deck labels its own weekly task "07 · ASSIGNMENT ... Due before Session 7". So the deck uses one word for two different things. Ask the instructor whether the weekly task carries marks. Either answer keeps `s07-m08-build-the-wrapper` legal, because the module gives a requirement checklist, a test plan and a hint ladder of questions, and no solution. If the answer is "graded", add the `Graded. No model answer.` form to S07-Q11 and leave the page as it is.
6. **Slide text that looks wrong.**
   - Slide 8 prints port 8080. The repo client uses 2026, which is the port the echo server binds. The printed pair cannot connect (S07-C18).
   - Slides 7 and 8 both carry the label "01 · the server", although page 8 holds the client. Their right-hand numbers, 05 and 13, match no numbering scheme in the deck.
   - Slide 4 prints "21th Sep".
   - Slide 35 carries the footer label of an assignment. See item 5.
7. **The cap that never binds.** Slide 21 sets `cap=8.0` with `max_attempts=5`. The ceiling `0.2 * 2**attempt` first passes 8.0 at attempt 6, so the cap is dead code and the sleep ceiling is 3.0 s. Ask whether he meant a larger attempt count or a smaller cap. m04 teaches the arithmetic, and S07-M18 carries the misconception.
8. **"Cache not found" as a retryable failure.** Slide 17 lists it under "the environment shifted under you". A cache miss normally produces an upstream fetch, not an error that the caller sees. Ask which failure he meant: a cache node that stopped answering, or an error from a cache tier. m03 keeps the claim as the slide gives it (S07-C73).
9. **Four sources that nobody has.** The callbacks name material outside this repo: an internal retry-taxonomy review (slide 13), four mindmaps ("no point in retrying" on 16, "how do we retry" on 22, "network issues" on 26, "codec/DRM fallback" and "stream issue" on 28), the 96-mode player taxonomy (slides 24 to 29), and a Fastly postmortem "linked in notes" (slide 36). Ask for the notes. Until they arrive, every case-study claim rests on the slide text, and the header says so.
10. **The player numbers.** Ask which player produced the taxonomy, and what the fatal codes 8018 and 8022 mean in it. Ask whether 474 and 475 come from a CDN or from the player itself. A lesson page must not guess, because the deck itself says that the numbers are not the lesson.
11. **Numbers with no measurement.** Slide 33 gives "1% of capacity against 100% of traffic" with no machine and no run, so m06 marks it illustrative. Slide 31 gives 49 minutes, which is the vendor measure of 95 per cent recovered, and the deck does not show the 2 h 48 min to full mitigation (section 6). Keep both framings on any page that shows the numbers.
12. **Homework 1 needs one more number.** The question asks for the total requests in the first second, and the answer depends on how long each failed call takes. S07-Q12 states that time and answers for 5 ms. Ask what he assumed, because the naive number moves with it.
13. **Three references that nobody re-opened.** Section 6 marks them. The page of the Circuit Breaker pattern in "Release It!" is unchecked, so a page cites the chapter. The Widevine architecture page did not render as text for an automated read on 2026-10-10. The Amazon Builders' Library article answered 301 for the same read. A lesson page that shows one of those three rows needs a human check first.
14. **Quiz 2 scope.** Quiz 2 runs on Monday 2026-10-12, after class 8. So it can cover classes 6, 7 and 8. The digest `s07-digest` must land before it. Ask which sessions the quiz covers.
15. **No instructor code for this class.** The clone has no `lesson7` folder. Every predict-observe-explain block here is either a Session 1 command or a planned capture, and each module says which. Ask whether code will appear. If it does, m04 and m08 want it first.
16. **The closing question stays open.** S07-C222 and S07-Q17 ask when "worse" stops being acceptable, and who decides. Slide 37 leaves it for week 8, so the Session 8 file must pick it up and the `s07-m07-synthesis` page must point forward, not answer it.
17. **The Session 6 hand-over landed.** Session 6 slide 38 named four items for this week: stale-if-error, the Fastly 49 minutes with retry and timeout and breaker logic, failover, and the thundering herd on recovery (S06-C267). All four sit in `s07-m06-systems-that-survive`, and the mechanics sit in m04. Nothing from that preview is missing.
18. **No transcript.** Nobody can tell which stories and numbers the instructor stressed aloud, so the inventory keeps all 223 claims. The quiz scope stays a guess until he says more.

