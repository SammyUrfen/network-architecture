# Session 6: (Ab)using CDNs

## 1. Header

- **Title:** (Ab)using CDNs. Week 6 of 8.
- **Date:** Friday 2026-09-18.
- **Subtitle, in the instructor words:** "Someone else's computers, closer to your users - and everything they can do while the traffic is passing through."
- **Deck shape:** 38 PDF pages. Pages 1 to 7 open the class. Then seven numbered sections: 01 Physics (8 to 11), 02 What it is (12 to 15), 03 Caching (16 to 21), 04 Faster bytes (22 to 24), 05 Not speed (25 to 29), 06 Cloudflare (30 to 32), 07 Closing (33 to 38).
- **Written:** 2026-10-10, from the complete deck and the complete companion lab.

**Sources used**

| Path | What it gives | Trust |
|---|---|---|
| `sources/session-06/slides.txt` | 38 PDF pages, complete, from `pdftotext -layout` | high |
| `sources/session-06/slides.pdf` | the deck itself, for the slide viewer | high |
| `cn-at-scaler/lesson6/cdn-lab/README.md` | the file map, the number summary, and the honest "does not model" list | high |
| `cn-at-scaler/lesson6/cdn-lab/bench/01_physics.py` to `07_ratelimit.py` | every measured number on the slides | high |
| `cn-at-scaler/lesson6/cdn-lab/edge/edge.py` | the cache state machine, the pool, the WAF hook, the ESI assembly | high |
| `cn-at-scaler/lesson6/cdn-lab/edge/waf.py`, `ratelimit.py`, `jwtlite.py` | five WAF rules, five rate-limit algorithms, HS256 tokens | high |
| `cn-at-scaler/lesson6/cdn-lab/origin/origin.py` | the deliberately naive origin behind the poisoning and gateway demos | high |
| `cn-at-scaler/lesson6/cdn-lab/demos/*.sh` | `cache`, `esi`, `waf`, `gateway`, `poison`, `failover` | high |
| `cn-at-scaler/lesson6/cdn-lab/cloudflare/` | `no-account.sh`, `INSTRUCTOR.md`, two Workers for workerd | high |
| `cn-at-scaler/lesson6/cdn-lab/tools/laggy.py`, `echo_server.py`, `mint_jwt.py` | the distance proxy, the tunnel echo, the token minter | high |

**Source gaps.**

1. No transcript and no AI revision notes exist for Session 6. We know what the slides say. We do not know what the instructor said around them.
2. The slides quote a "source doc" three times (pages 22, 24, 25). That document is not in `sources/`. The quoted lines are short, so the claims stand, but the original wording of the course outline is not available.
3. Page 9 is a Session 5 slide, "06 · QUIC · THE ROUND TRIPS". It carries Session 5 numbers from `05-http3/handshake_race.py`. It is almost certainly a left-over paste, not new Session 6 content. See section 7.
4. The dashboard demos on page 31 need a Cloudflare account. We cannot verify a free-plan limit from here without a browser. The limits come from the slide and from `cloudflare/INSTRUCTOR.md`.
5. The class 6 assignment is on page 36. It is graded, so this file gives requirements and a hint ladder only.

**Checks run for this file (2026-10-10).** Three benches ran on this Linux machine, with no network:

| Command | What came out | Slide agreement |
|---|---|---|
| `python3 bench/01_physics.py` | light in fibre 204,218 km/s, 4.90 ms per 1000 km one way. Mumbai to Chennai floor 10 ms against a 23 ms ping. Mumbai to Washington floor 126 ms. Hollow-core 47% faster. | exact |
| `python3 bench/07_ratelimit.py` | fixed window 200, sliding log 100, sliding estimate 104, token bucket 109, leaky bucket burst=0 gives 10 and refuses 97% of page loads | exact |
| `python3 bench/06_consistent_hash.py` | modulo moves 90.9%, one point per server moves 3.3% at 2.93x imbalance, 160 points moves 8.2% at 1.14x | exact |

The ESI percentage was read from the code, not re-run. `bench/04_esi_bytes.py` starts an origin and two edge processes on ports 9150, 8150 and 8151, and the lab needs `./setup.sh` to build its private CA first. The arithmetic checks out from the printed numbers: 3,984,200 bytes to 83,454 bytes is a drop of 97.906%, which the slide rounds to 98%. The bytes to users move from 3,992,400 to 3,994,793, a rise of 0.0599%, which the slide rounds to +0.1%. See section 7 for three small places where the lab and the slide differ.

**Confidence.** High on the deck, high on the lab, medium on two things. The deck is complete and clean. Every measured number traces to a named script, and the three benches that need no network reproduce exactly. Medium on the live-Internet numbers of pages 15, 28 and 30, because they depend on the day and the network. Medium on page 9, which looks like a slide from the wrong deck.

## 2. The session in one paragraph

Weeks 1 to 5 made one origin fast. This week puts a network in front of it, and the first reason is physics. Light in glass travels about 204,000 km per second, so a round trip from Mumbai to Virginia costs about 126 ms before your code runs, and no faster CPU removes it. A CDN is the answer: a reverse proxy, the same nginx from Session 4, rented in more than 300 cities. It buys back two different things. It keeps warm connections to your origin, which saves handshakes, and when it can cache, it deletes the origin round trip altogether. The second half of the class is the part that surprises people. All your traffic already passes through the edge, so the edge became the firewall, the rate limiter, the flood absorber, the authentication point, and now a place to run your code. The bill for that leverage is trust, concentration and lock-in. A working engineer meets every piece of this: a cache status header that explains a stale page, a cache key that lets one attacker poison a page for everyone, a rate limit that lets twice its limit through in one second, and one vendor outage that takes 85% of a network down at once.

## 3. Claim inventory

Claim count: 268. Core count: 91.

Lab paths in the Source column are short. `bench/01_physics.py` means
`cn-at-scaler/lesson6/cdn-lab/bench/01_physics.py`. The same holds for
`edge/`, `origin/`, `demos/`, `tools/`, `lib/` and `cloudflare/`.

### Block A. The opening, pages 1 to 7

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S06-C01 | A CDN is somebody else's computers, placed closer to your users. The title adds the second half: everything those computers can do while your traffic passes through them. | `slide 1` | core |
| S06-C02 | `curl -s https://www.cloudflare.com/cdn-cgi/trace` prints a `colo` line. That line names the building that answered you. | `slide 1`, `cloudflare/no-account.sh` | detail |
| S06-C03 | The deck names six providers: Akamai, CloudFront, Fastly, Google, Broadpeak and Cloudflare. It names six techniques: SSI, ESI, Railgun, BBR and anycast. | `slide 1` | story |
| S06-C04 | The course outline lists week 7 as Building for failures and week 8 as Streaming video at large scale. | `slides 2, 6` | story |
| S06-C05 | Weeks 1 to 5 made one origin fast. Week 6 puts a network in front of it. | `slide 6` | core |
| S06-C06 | Today the machine stops being yours. That is the instructor framing of the week. | `slide 6` | story |
| S06-C07 | The assignment of class 5 is still open: a calculator server on one socket, due before Session 7. Session 5 owns the requirements. See `S05-C04` to `S05-C11`. | `slide 3` | detail |
| S06-C08 | The course project is still "HTTP, in binary", in pairs, one server and one client. Session 5 owns the requirements. See `S05-C12` to `S05-C22`. | `slide 4` | detail |
| S06-C09 | Quiz 1 falls on Monday 21 September. Binayak announces the timing. | `slide 5` | story |
| S06-C10 | The assignment submission falls on Friday 25 September, during class time. Quiz 2 falls on the same day. | `slide 5` | story |
| S06-C11 | The agenda is six questions about a box in the middle: why the edge exists, what a CDN is, caching, moving bytes faster, everything that is not speed, and Cloudflare by hand. | `slide 7` | core |
| S06-C12 | Section 1 states the reason the edge exists in one line: the speed of light is a fixed budget, and your origin spends all of it. | `slide 7` | detail |
| S06-C13 | Section 2 states what a CDN is in one line: a reverse proxy, the nginx of Session 4, rented in more than 300 cities. | `slide 7` | detail |
| S06-C14 | Section 5 states the shift: a CDN also brings a WAF, rate limiting, DDoS absorption, an API gateway, and the trust you hand over. | `slide 7` | detail |

### Block B. 01 Physics, pages 8 to 11

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S06-C15 | Light in a vacuum travels 299,792 km/s. The bench constant is 299,792.458 km/s. | `slide 8`, `bench/01_physics.py` | detail |
| S06-C16 | Glass slows light. The fibre group index is 1.468 near 1550 nm, so light in fibre travels 204,218 km/s. | `slide 8`, `bench/01_physics.py` | core |
| S06-C17 | 204,218 km/s is 4.90 ms per 1000 km, one way. Reproduced on this machine on 2026-10-10. | `slide 8`, `bench/01_physics.py` | measured |
| S06-C18 | Mumbai to Chennai is 1,033 km on the great circle. The round-trip floor in straight glass is 10 ms. | `slide 8`, `bench/01_physics.py` | measured |
| S06-C19 | The real ping Mumbai to Chennai is 23 ms, from WonderNetwork, 8 to 17 September 2026. That is 2.3 times the floor. | `slide 8`, `bench/01_physics.py` | measured |
| S06-C20 | Mumbai to Ashburn, us-east-1, is 12,847 km. The round-trip floor is 126 ms. You cannot go under it. | `slide 8`, `bench/01_physics.py` | core |
| S06-C21 | Hollow-core fibre has an index near 1.0003, so it would be 47% faster than glass. Microsoft started deploying it in September 2025. It is not on your path today. | `slide 8` | story |
| S06-C22 | TLS 1.3 needs three round trips to the first byte on a new connection. At 126 ms that is about 380 ms of waiting. | `slide 8` | core |
| S06-C23 | No faster CPU removes the propagation delay. It is the one number you cannot optimise. | `slide 8` | detail |
| S06-C24 | The bench also prints the measured stretch factor for each city. Singapore is 3.3 times closer than Washington and only 1.3 times faster, so the gap is routing, not physics. | `bench/01_physics.py` | measured |
| S06-C25 | Singla et al., HotNets 2014, put the median Internet stretch at 3.2 times the speed-of-light latency. | `bench/01_physics.py` | detail |
| S06-C26 | Distance charges you twice: once in latency, and again in loss. | `slide 10` | core |
| S06-C27 | Akamai measured in 2010: under 100 miles gives 1.6 ms RTT, 0.6% loss and 44 Mbps. A 4 GB download takes 12 minutes. | `slide 10`, `bench/01_physics.py` | measured |
| S06-C28 | 500 to 1,000 miles gives 16 ms, 0.7% and 4 Mbps. A 4 GB download takes 2.2 hours. | `slide 10` | measured |
| S06-C29 | About 3,000 miles gives 48 ms, 1.0% and 1 Mbps. A 4 GB download takes 8.2 hours. | `slide 10` | measured |
| S06-C30 | About 6,000 miles gives 96 ms, 1.4% and 0.4 Mbps. A 4 GB download takes 20 hours. | `slide 10` | measured |
| S06-C31 | The Mathis formula says throughput is about MSS divided by RTT times the square root of the loss rate. Mathis et al., 1997. | `slide 10`, `bench/01_physics.py` | core |
| S06-C32 | The far edge is 110 times slower, not 60 times further. The bench reproduces 110x measured against 91.7x from the model. | `slide 10`, `bench/01_physics.py` | measured |
| S06-C33 | One TCP flow cannot fill a long path. That is why HTTP/2 multiplexing and BBR both exist. | `slide 10` | detail |
| S06-C34 | The split-path model is you, 10 ms to a Mumbai edge, then 194 ms to a Washington origin. Direct is 204 ms. Every hop uses TLS 1.3. | `slide 11`, `bench/02_split_tcp.py` | core |
| S06-C35 | Direct to the origin on a new connection gives 621 ms to the first byte, 3.0 round trips, for dynamic content. | `slide 11`, `bench/02_split_tcp.py` | measured |
| S06-C36 | Direct to the origin on a kept-alive connection gives 208 ms, 1.0 round trip. | `slide 11`, `bench/02_split_tcp.py` | measured |
| S06-C37 | An edge with no origin pool gives 625 ms, 3.1 round trips. It is only a longer proxy, and it is slower than direct. | `slide 11`, `bench/02_split_tcp.py` | measured |
| S06-C38 | An edge with a warm origin pool and a new user connection gives 233 ms, 1.1 round trips. | `slide 11`, `bench/02_split_tcp.py` | measured |
| S06-C39 | An edge with a warm pool and a kept-alive user connection gives 209 ms, about the same as direct. | `slide 11`, `bench/02_split_tcp.py` | measured |
| S06-C40 | An edge cache hit on a static asset gives 34 ms, 0.2 round trips. The origin is never touched. | `slide 11`, `bench/02_split_tcp.py` | measured |
| S06-C41 | An edge cache hit on a kept-alive connection gives 11 ms, 0.1 round trips. | `slide 11`, `bench/02_split_tcp.py` | measured |
| S06-C42 | Those seven numbers are the median of five runs, with simulated delay from `tools/laggy.py`. The tool delays each chunk and never drops a packet. | `bench/02_split_tcp.py`, `tools/laggy.py` | measured |
| S06-C43 | A cache miss through the edge is no faster than going direct, and sometimes slower. | `slide 11` | core |
| S06-C44 | The edge earns its place two ways. It keeps warm connections to your origin, which saves handshakes. When it can cache, it deletes the origin round trip, 194 ms to 0. | `slide 11` | core |
| S06-C45 | The headline of the slide states the split plainly: the edge saves handshakes for free, and only the cache saves the round trip. | `slide 11` | detail |
| S06-C46 | Page 9 of the deck is a Session 5 slide about the QUIC handshake. It belongs to `s05-m10-quic-handshakes`. Session 6 does not teach it again. | `slide 9` | correction |

### Block C. 02 What a CDN is, pages 12 to 15

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S06-C47 | A CDN is Session 4's reverse proxy, rented in more than 300 cities. Nothing in the architecture is new. | `slide 12` | core |
| S06-C48 | The path has three parts: you, an edge point of presence about 10 ms away, and your origin at the end of one long controlled leg. | `slide 12` | detail |
| S06-C49 | An edge point of presence does three jobs on the slide diagram: cache, TLS termination and WAF. | `slide 12` | detail |
| S06-C50 | The reverse proxy is nginx from Session 4. The caching is `proxy_cache` from Session 4. The pool is `upstream keepalive` from Session 3. | `slide 12` | core |
| S06-C51 | Anycast puts one IP address in every city. That is Session 2's addressing, put to work. | `slide 12` | core |
| S06-C52 | Squid did reverse-proxy caching in 1996. A CDN is that idea multiplied by geography and sold as a service. | `slide 12` | story |
| S06-C53 | Geography adds three things: the edge is near the user so the 3-RTT handshake is cheap, the CDN owns both ends of the long leg, and a shield layer lets many edges share one origin fetch. | `slide 12` | detail |
| S06-C54 | The founding question of a CDN is which cache holds which URL. Get it wrong and every capacity upgrade is a cold cache. | `slide 13` | core |
| S06-C55 | With `hash(url) % N`, adding an eleventh cache to ten moves 90.9% of 100,000 URLs. Reproduced on this machine on 2026-10-10. | `slide 13`, `bench/06_consistent_hash.py` | measured |
| S06-C56 | Modulo hashing spreads load evenly, 1.02 times the mean on the busiest server. Even load is not the problem. The problem is the churn. | `slide 13`, `bench/06_consistent_hash.py` | measured |
| S06-C57 | A capacity upgrade under modulo hashing becomes a near-total cache flush, and a stampede on your origin at the worst moment. | `slide 13` | core |
| S06-C58 | Consistent hashing with one point per server moves only 3.3% of URLs, but the busiest server carries 2.93 times the mean. | `slide 13`, `bench/06_consistent_hash.py` | measured |
| S06-C59 | Consistent hashing with 160 points per server moves 8.2% of URLs, and the busiest server carries only 1.14 times the mean. | `slide 13`, `bench/06_consistent_hash.py` | measured |
| S06-C60 | The ideal move for ten caches plus one is one in eleven, which is 9.1%. The 160-point result of 8.2% sits at that ideal. | `bench/06_consistent_hash.py` | detail |
| S06-C61 | Virtual points trade a little extra movement for a lot of load balance. The one-point row shows the cost of leaving them out. | `bench/06_consistent_hash.py` | detail |
| S06-C62 | Consistent hashing comes from Karger, Lehman, Leighton, Levine, Lewin and Panigrahy, STOC 1997. Akamai was founded on that paper. | `slide 13` | story |
| S06-C63 | nginx ships consistent hashing as `hash $request_uri consistent`, with 160 points per server weight, compatible with ketama. | `slide 13` | detail |
| S06-C64 | The same idea recurs: choose an owner with no central registry. Distributed hash tables, sharded caches and CDN caches all do it. | `slide 13` | detail |
| S06-C65 | Akamai, born 1998, runs its own "ghost" edge servers, invented ESI in 2001, and went from FastTCP to BBR. | `slide 14` | story |
| S06-C66 | Amazon CloudFront, born 2008, runs on AWS edge locations and has used BBR to viewers since 2019, for up to 22% more throughput. | `slide 14` | story |
| S06-C67 | Fastly, born 2011, is a heavily modified Varnish plus H2O, and it is known for instant purge. H2O comes from Kazuho Oku. | `slide 14` | story |
| S06-C68 | Google Media CDN, opened in 2022, is YouTube's edge. It uses QUIC and BBR everywhere. | `slide 14` | story |
| S06-C69 | Broadpeak is an operator and telco CDN for streaming, and it also runs on GKE. Session 8 returns to it. | `slide 14` | story |
| S06-C70 | Cloudflare, born 2010, ran nginx plus LuaJIT as FL1, then moved the customer edge to Rust on Oxy as FL2 in October 2025, for 10 ms less latency and 25% more throughput. | `slide 14` | story |
| S06-C71 | Cloudflare moved its origin-facing proxy to Pingora in 2022. That is the same "outgrow your proxy" story Sessions 3 and 4 left as a thread. | `slide 14` | detail |
| S06-C72 | Apache, HAProxy, Varnish and nginx, the reverse proxies of the scaling weeks, are what most CDNs were built on. The software layer is Sessions 3 and 4. | `slide 14` | detail |
| S06-C73 | Every Cloudflare-proxied site answers `/cdn-cgi/trace`. The reply lists the client IP, the colo, the HTTP version, the TLS version and the key exchange. | `slide 15`, `cloudflare/no-account.sh` | core |
| S06-C74 | A colo is an IATA airport code. BOM is Mumbai, DEL Delhi, MAA Chennai, SIN Singapore, LHR London, IAD Ashburn. | `slide 15` | core |
| S06-C75 | BGP anycast chooses the colo, not you. The CDN tells you which building your packets reached. | `slide 15` | core |
| S06-C76 | `dig +short CHAOS TXT id.server @1.1.1.1` names the resolver instance that answered. On the slide it answers "BOM". | `slide 15`, `cloudflare/no-account.sh` | detail |
| S06-C77 | The slide capture shows `kex=X25519MLKEM768`, a post-quantum key exchange. | `slide 15` | detail |
| S06-C78 | Every Cloudflare response carries a `cf-ray` header. Its suffix is the colo. That is how you debug a slow or stale user. | `slide 15` | core |
| S06-C79 | The classroom demo: run the trace on wifi, then ask somebody on mobile data to run it. Same domain, same IP, different colo. | `slide 15` | detail |
| S06-C80 | The build host that produced the deck got `colo=IAD` in September 2026, not BOM. A live number depends on the day and the network. | `slide 15` | measured |

### Block D. 03 Caching, pages 16 to 21

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S06-C81 | By default a CDN decides what to cache from the file extension. HTML is not on the list. | `slide 16` | core |
| S06-C82 | Cloudflare caches 68 static extensions with no configuration: css, js, png, jpg, webp, woff, mp4, pdf, zip and more. | `slide 16` | detail |
| S06-C83 | The default list excludes HTML and JSON. It also excludes anything with `Set-Cookie`, or `Cache-Control: private`, `no-store`, `no-cache` or `max-age=0`. | `slide 16` | core |
| S06-C84 | When the origin says nothing about freshness, the default edge TTL is 2 hours for 200 and 301, and 3 minutes for 404. Other statuses are not cached. | `slide 16` | core |
| S06-C85 | The default cache key is scheme plus host plus path plus query. Nothing else. | `slide 16` | core |
| S06-C86 | Cookies and almost every header are not in the key. Two users with different cookies share one cached object. | `slide 16` | core |
| S06-C87 | Sharing one object is right for `app.css` and catastrophic for `/account`. | `slide 16` | detail |
| S06-C88 | `Vary`, or a custom cache key, is how you tell the edge that two requests differ. That is Session 5's `Vary` header, now at the edge. | `slide 16` | core |
| S06-C89 | A first request for a static asset through the lab edge answers `x-cache: MISS`, and the next answers `HIT`. The first visitor pays the origin round trip. | `slide 16`, `demos/cache.sh` | measured |
| S06-C90 | A request for HTML through the lab edge answers `x-cache: DYNAMIC`, because the extension is not eligible. It goes straight to the origin. | `slide 16`, `demos/cache.sh` | measured |
| S06-C91 | `cf-cache-status` is a small language with eight states: MISS, HIT, EXPIRED, REVALIDATED, UPDATING, STALE, DYNAMIC and BYPASS. | `slide 17` | core |
| S06-C92 | MISS means eligible and not in the cache, so the edge fetched it from the origin. The origin was hit. | `slide 17`, `edge/edge.py` | core |
| S06-C93 | HIT means served from the cache while still fresh. The origin was not hit. That is the whole point. | `slide 17`, `edge/edge.py` | core |
| S06-C94 | EXPIRED means the object was cached, the TTL passed, and the re-fetch returned a full body. The origin was hit. | `slide 17`, `edge/edge.py` | detail |
| S06-C95 | REVALIDATED means the TTL passed, the origin answered 304, and the cache reused its copy. That is Session 5's ETag and `If-None-Match`, saving bandwidth. | `slide 17`, `edge/edge.py` | core |
| S06-C96 | UPDATING means the edge served a stale copy now and refreshes it in the background. That is Session 4's `proxy_cache_use_stale`. | `slide 17`, `edge/edge.py` | detail |
| S06-C97 | STALE means the origin is down and the edge served the stale copy anyway. That is next week's whole topic. | `slide 17`, `edge/edge.py` | core |
| S06-C98 | DYNAMIC means the object was never eligible, so the edge never looked in the cache. It is the default for HTML. | `slide 17`, `edge/edge.py` | core |
| S06-C99 | BYPASS means the object was eligible, but the origin replied `no-store`, so the edge did not keep it. That is Session 5's `Cache-Control`. | `slide 17`, `edge/edge.py` | detail |
| S06-C100 | In the lab edge, the UPDATING branch follows RFC 5861 stale-while-revalidate, and the STALE branch follows stale-if-error. | `edge/edge.py` | detail |
| S06-C101 | Pages got personal, so four tricks exist to cache them anyway: SSI, ESI, Ajax and a delta to the origin. | `slide 18` | core |
| S06-C102 | Server-Side Includes arrived in NCSA HTTPd 1.0a1 in 1994, before CGI. The server fills holes in an HTML file before it sends the page. nginx still ships the module. | `slide 18` | story |
| S06-C103 | Edge-Side Includes came from Akamai and Oracle, as a W3C Note in 2001. The same holes get filled at the edge. | `slide 18` | core |
| S06-C104 | With ESI you cache the shared shell everywhere and assemble the personal parts at the point of presence. | `slide 18` | core |
| S06-C105 | Ajax, from about 2005, pushes the holes all the way to the browser. The CDN caches the body and the browser fetches the personal parts later. | `slide 18` | detail |
| S06-C106 | Railgun, Cloudflare 2013 to 2024, gave up on caching the dynamic page and sent only the bytes that changed since last time. | `slide 18` | core |
| S06-C107 | The four tricks form one arc: move the personalisation outward, server to edge to browser, so the shared part can be cached and only the small personal part is recomputed. | `slide 18` | core |
| S06-C108 | The ESI origin sends one shell with two holes, marked `Cache-Control: s-maxage=300` and `Surrogate-Control: content="ESI/1.0"`. | `slide 19`, `origin/origin.py` line 157 | detail |
| S06-C109 | With 100 logged-in users on the same page, the bench first asserts both methods produce byte-identical pages, 39,676 bytes each. | `slide 19`, `bench/04_esi_bytes.py` | measured |
| S06-C110 | Origin assembles: 100 origin requests, 3,984,200 bytes origin to edge, 3,992,400 bytes to users, and DYNAMIC 100 times. | `slide 19`, `bench/04_esi_bytes.py` | measured |
| S06-C111 | ESI at the edge: 201 origin requests, 83,454 bytes origin to edge, 3,994,793 bytes to users, and HIT 99 times with one MISS. | `slide 19`, `bench/04_esi_bytes.py` | measured |
| S06-C112 | Origin bytes fell 97.9%, which the slide rounds to 98%. The shell is fetched once instead of 100 times. | `slide 19`, `bench/04_esi_bytes.py` | measured |
| S06-C113 | Bytes to the user rose 0.06%, which the slide rounds to +0.1%. ESI does not shrink the download. | `slide 19`, `bench/04_esi_bytes.py` | measured |
| S06-C114 | Origin requests went up, 100 to 201, because each personal fragment is its own tiny fetch. | `slide 19`, `bench/04_esi_bytes.py` | core |
| S06-C115 | ESI moves load off the origin's page rendering and onto the edge's assembly. Whether that wins depends on which one is your bottleneck. | `slide 19` | detail |
| S06-C116 | 201 is 100 user fragments plus 100 cart fragments plus one shell fetch. The shell was a MISS once and a HIT 99 times. | `bench/04_esi_bytes.py`, `edge/edge.py` | detail |
| S06-C117 | Railgun's idea returned as an Internet standard: RFC 9842, Compression Dictionary Transport, September 2025. | `slide 20` | detail |
| S06-C118 | On a 24 KB news page regenerated every minute, plain gzip -6 gives 4,276 bytes, which is 17.7% of the raw page. | `slide 20`, `bench/05_delta.py` | measured |
| S06-C119 | deflate with the one-minute-old page as the dictionary gives 598 bytes, 2.5% of raw. | `slide 20`, `bench/05_delta.py` | measured |
| S06-C120 | zstd with the one-minute-old page as the dictionary gives 436 bytes, 1.8% of raw. That is the `dcz` encoding. | `slide 20`, `bench/05_delta.py` | measured |
| S06-C121 | zstd with a one-hour-old dictionary gives 1,277 bytes, 5.3% of raw. The dictionary must be recent. | `slide 20`, `bench/05_delta.py` | measured |
| S06-C122 | Railgun ran a daemon inside your origin and a sender at the edge. Both ends kept the last version of each page and sent only the delta. | `slide 20` | detail |
| S06-C123 | Cloudflare retired Railgun in January 2024. The network got fast enough, and a standard arrived. | `slide 20` | story |
| S06-C124 | RFC 9842 names the dictionary with `Available-Dictionary: <sha-256>`, and the content encoding is `dcb` for brotli or `dcz` for zstd. | `slide 20` | detail |
| S06-C125 | Dictionaries leak information, so the transport is same-origin, HTTPS only, and hashed. That is Session 5's reason for not gzipping the headers. | `slide 20` | detail |
| S06-C126 | A one-minute-old copy turns 24 KB into 436 bytes, about 10 times past gzip. The catch is that the dictionary must be recent and identical on both ends. | `slide 20` | core |
| S06-C127 | A shared cache is a shared weapon. The two classic bugs are cache poisoning and cache deception. | `slide 21` | core |
| S06-C128 | Cache poisoning, named by Kettle in 2018: the origin reflects a header such as `X-Forwarded-Host` into the page, and that header is not in the cache key. | `slide 21` | core |
| S06-C129 | One malicious request caches a hostile page, and every visitor after it is served the attacker's script. The lab shows a 60-second window. | `slide 21`, `demos/poison.sh` | detail |
| S06-C130 | The lab origin sets `Cache-Control: public, s-maxage=60` on `/page/landing` and reflects `X-Forwarded-Host` into the body. | `origin/origin.py` lines 179 to 181 | detail |
| S06-C131 | Poisoning has three fixes: drop the unkeyed header at the edge, add it to the cache key, or make the origin send `Vary` on it. | `slide 21` | core |
| S06-C132 | `demos/poison.sh` starts a second edge with `--strip-unkeyed`, and the same attack fails against it. | `demos/poison.sh` | measured |
| S06-C133 | Cache deception, named by Gil at Black Hat USA 2017: trick the victim into loading `/account/settings/fake.css`. | `slide 21` | core |
| S06-C134 | The edge sees ".css", caches the response, and the response held the victim's private page. The attacker then fetches the same URL from the cache. | `slide 21` | detail |
| S06-C135 | Deception has two fixes: do not cache by extension alone, and honour the origin's content type and `no-store`. | `slide 21` | detail |
| S06-C136 | Both bugs come from one root: the cache key disagrees with reality. A cache is shared state, and shared state is an attack surface. | `slide 21` | core |

### Block E. 04 Moving bytes faster, pages 22 to 24

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S06-C137 | The course source document said BBR "relooked at TCP retries, congestion and the famous saw-tooth". The slide corrects the framing: the saw-tooth is Session 2's slide, and BBR is the answer to it. | `slide 22` | correction |
| S06-C138 | BBR means Bottleneck Bandwidth and Round-trip propagation. Cardwell et al. at Google published it in 2016, in ACM Queue 14(5). | `slide 22` | detail |
| S06-C139 | A loss-based controller such as CUBIC fills the pipe until a packet drops, then halves its window. That is the saw-tooth. | `slide 22` | core |
| S06-C140 | On long lossy CDN paths, a loss-based controller mistakes distance for congestion. Loss is not a congestion signal. | `slide 22` | detail |
| S06-C141 | BBR measures the real bottleneck bandwidth and the minimum RTT, then paces the sender to that rate. | `slide 22` | core |
| S06-C142 | Google B4 and YouTube, 2016, the paper itself: 2 to 25 times the CUBIC throughput, and a 53% lower median RTT globally. | `slide 22` | measured |
| S06-C143 | Amazon CloudFront, 2019, edge to viewer: up to 22% more throughput, and up to 100% more on some US mobile networks. | `slide 22` | measured |
| S06-C144 | Akamai, November 2019, media delivery: BBR on more than 80% of end-user connections. | `slide 22` | measured |
| S06-C145 | A web-wide census of the top 10,000 sites in 2023 found BBR the most deployed congestion control, with CUBIC at about 7%. | `slide 22` | measured |
| S06-C146 | Only the sender changes. BBR needs no new protocol, no client change and no router change. | `slide 22` | detail |
| S06-C147 | That is why a CDN can switch BBR on for you. It owns the sender on the long leg to your origin, and on the leg out to the user. | `slide 22` | core |
| S06-C148 | The pool bench runs 300 visitors, one every 40 ms, with the origin 50 ms away over TLS 1.3 and an origin idle close after 1 second. | `slide 23`, `bench/03_pool.py` | measured |
| S06-C149 | With no pool: 300 origin requests, 300 new connections, 0% reuse, 160 ms mean time to first byte. | `slide 23`, `bench/03_pool.py` | measured |
| S06-C150 | With 32 worker pools: 164 new connections, 45.3% reuse, 112 ms. | `slide 23`, `bench/03_pool.py` | measured |
| S06-C151 | With 8 worker pools: 52 new connections, 82.7% reuse, 74 ms. | `slide 23`, `bench/03_pool.py` | measured |
| S06-C152 | With 1 shared pool: 4 new connections, 98.7% reuse, 57 ms. | `slide 23`, `bench/03_pool.py` | measured |
| S06-C153 | A pooled connection opened by one worker can only be reused by that worker. Split the pool across many workers and each worker sees too few requests to keep its connections warm. | `slide 23` | core |
| S06-C154 | That is nginx's per-worker pool against Pingora's shared pool. It is Session 4's Cloudflare thread, one layer out. | `slide 23` | detail |
| S06-C155 | Cloudflare's Pingora post, September 2022: one big customer's reuse went from 87.1% to 99.92%, a 160-fold drop in new origin connections, and 434 years of handshake time saved every day. | `slide 23` | measured |
| S06-C156 | The reuse metric is one minus new origin connections divided by origin requests. | `bench/03_pool.py` | detail |
| S06-C157 | The setup you amortise at the edge is a 2-RTT TLS handshake to your origin. Session 3's "amortise the setup" now spans a continent. | `slide 23` | core |
| S06-C158 | A CDN uses HTTP/2 multiplexing on both legs: many user streams in, a few multiplexed streams back to the origin. | `slide 24` | detail |
| S06-C159 | Most CDN to origin hops are still HTTP/1.1 by default. `cloudflared` has `http2Origin` set to false until you turn it on. | `slide 24`, `cdn-lab/README.md` | core |
| S06-C160 | Pooling, not multiplexing, is what actually saves you on the origin leg today. | `slide 24` | detail |
| S06-C161 | Without a shield, 300 edges each miss and send 300 requests to your origin for the same object. That is a built-in thundering herd. | `slide 24` | core |
| S06-C162 | With a tiered cache, the edges fetch from a regional parent, and the parent fetches from the origin once. Your origin sees one request, not 300. | `slide 24` | detail |
| S06-C163 | Cloudflare sells this as Tiered Cache and Argo. nginx did the single-flight version with `proxy_cache_lock`. | `slide 24` | detail |
| S06-C164 | Request collapsing at one edge, 50 users on a cold cache and one object: 50 origin fetches without it, 1 with it. The other 49 wait for the first, then all hit. | `slide 24`, `bench/harness.py` | measured |
| S06-C165 | Collapsing at one point of presence and tiered caching across points of presence are the same move at two scales: never fetch the same object twice at once. | `slide 24` | core |
| S06-C166 | That is why a CDN protects your origin during a traffic spike instead of amplifying it. | `slide 24` | detail |
| S06-C167 | The lab edge implements collapsing with one in-flight future per cache key, which is `proxy_cache_lock` in Python. | `edge/edge.py` lines 247 to 262 | detail |

### Block F. 05 Everything that is not speed, pages 25 to 29

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S06-C168 | All your traffic already passes through the edge. That one fact changes what the edge is for. | `slide 25` | core |
| S06-C169 | The course source document says "All requests are coming to the CDN anyway" three times in a row. | `slide 25` | story |
| S06-C170 | Four non-speed jobs live at the edge: WAF, rate limiting, DDoS absorption and an API gateway. | `slide 25` | detail |
| S06-C171 | A CDN started as a cache and became the security perimeter, because the perimeter sits wherever all the traffic converges. | `slide 25` | detail |
| S06-C172 | Speed got you to adopt a CDN. Control is why you cannot leave. | `slide 25` | core |
| S06-C173 | A WAF is a denylist of spellings. The bug still lives in your origin. | `slide 26` | core |
| S06-C174 | The lab WAF has five rules: SQL union-select, SQL tautology, stacked SQL statements, path traversal and a script tag. | `slide 26`, `edge/waf.py` | detail |
| S06-C175 | The lab WAF has three normalisation levels: raw bytes, one URL decode, and full decode until stable plus comment stripping plus whitespace collapse. | `slide 26`, `edge/waf.py` | detail |
| S06-C176 | `q="' OR 1=1 --"` is blocked by the rule `sqli-tautology`. | `slide 26`, `demos/waf.sh` | measured |
| S06-C177 | `q="'/**/OR/**/1=1--"` leaks 5 rows at the decode level. SQL comments replace the spaces, and the regex misses. | `slide 26`, `demos/waf.sh` | measured |
| S06-C178 | At the full normalisation level the same payload is blocked, because the edge strips the comments first. | `slide 26`, `demos/waf.sh` | measured |
| S06-C179 | `q="' --"` still leaks 5 rows at every level. It has no OR, no UNION and no digits to match. | `slide 26`, `demos/waf.sh` | measured |
| S06-C180 | The arms race is normalisation: how much the WAF decodes first, against how many ways the attacker can spell the same attack. You never win it outright. | `slide 26` | core |
| S06-C181 | A WAF is still a real and useful layer. It buys time and it blocks the mass-scanned known payloads, such as Log4Shell and the OWASP top patterns. | `slide 26` | detail |
| S06-C182 | The actual fix lives in the origin: bind the parameters. `demos/waf.sh` ends with `--safe` on, and then every bypass returns no results. | `slide 26`, `origin/origin.py` line 204 | core |
| S06-C183 | Cloudflare's Free Managed Ruleset runs on all plans. The OWASP Core Ruleset needs the Pro plan. | `slide 26`, `cloudflare/INSTRUCTOR.md` | detail |
| S06-C184 | "100 requests per 10 seconds" has at least five different meanings. | `slide 27` | detail |
| S06-C185 | At the window edge, a fixed window lets 200 requests through in one second. Reproduced on this machine on 2026-10-10. | `slide 27`, `bench/07_ratelimit.py` | measured |
| S06-C186 | The exact sliding log lets exactly 100 through at the same window edge. | `slide 27`, `bench/07_ratelimit.py` | measured |
| S06-C187 | The sliding-window estimate lets 104 through, the token bucket 109, and a leaky bucket with burst 0 lets only 10. | `slide 27`, `bench/07_ratelimit.py` | measured |
| S06-C188 | On a normal page load, every algorithm passes except the leaky bucket with burst 0, which refuses 97% of the requests. | `slide 27`, `bench/07_ratelimit.py` | measured |
| S06-C189 | The traffic model is explicit: 100 requests in the last half second of a window, 100 in the first half second of the next, then 50 requests per second. Simulated time, so the answer is the same on every machine. | `bench/07_ratelimit.py` | measured |
| S06-C190 | The page-load model is a real browser: 30 requests at once, every 10 seconds, six times. | `bench/07_ratelimit.py` | detail |
| S06-C191 | Failure mode one: 100 requests at 9.999 s plus 100 at 10.001 s is 200 in a blink. Cloudflare's free plan offers only this 10-second fixed window. | `slide 27` | core |
| S06-C192 | Failure mode two: a leaky bucket with no burst is mathematically pure and refuses a real browser that opens 30 requests at once. | `slide 27` | detail |
| S06-C193 | That is why nginx's `limit_req` has a burst parameter. It was Session 4's self-study. | `slide 27` | detail |
| S06-C194 | Cloudflare's 2017 answer is the sliding-window estimate: weight the previous window by how much of it still overlaps. Two counters per client. | `slide 27` | core |
| S06-C195 | Measured across 400 million requests, the estimate wrongly allowed or blocked only 0.003%. Cheap and close enough. | `slide 27` | measured |
| S06-C196 | Rate-limit counts are per data centre, not global. A botnet spread across 330 cities gets 330 budgets. | `slide 27` | core |
| S06-C197 | The lab leaky bucket follows the nginx excess formula from `ngx_http_limit_req_module.c`, in the nodelay variant that refuses instead of queueing. | `edge/ratelimit.py` | detail |
| S06-C198 | The largest DDoS on record is 31.4 Tbps, reported by Cloudflare in December 2025. The Aisuru botnet used 1 to 4 million devices, and the attack lasted 35 seconds. | `slide 28` | measured |
| S06-C199 | Cloudflare mitigated it automatically, with no human in the loop. | `slide 28` | detail |
| S06-C200 | Cloudflare's total network capacity is about 500 Tbps across more than 330 cities. That is the pool the flood lands in. | `slide 28` | detail |
| S06-C201 | You cannot buy 31 Tbps of inbound capacity to soak a flood like that. | `slide 28` | core |
| S06-C202 | A volumetric flood is won with more capacity than the attacker, spread across enough locations that anycast splits the flood across all of them. | `slide 28` | detail |
| S06-C203 | Your origin has one pipe. The CDN has hundreds. This is the purest case of renting capacity you could never own. | `slide 28` | detail |
| S06-C204 | Sites move behind a CDN the day after an attack, not before. | `slide 28` | story |
| S06-C205 | The flip side of one network absorbing everybody's attacks is one network being everybody's single point of failure. | `slide 28` | detail |
| S06-C206 | In June 2021 a Fastly configuration bug took 85% of its network to errors. Reddit, Spotify and the UK government all went down at once. | `slides 28, 33` | story |
| S06-C207 | The API gateway pattern puts authentication, header scrubbing and routing at the edge, before the origin is touched. | `slide 29` | core |
| S06-C208 | With no token, the edge answers 401 "missing bearer token" and the origin never sees the request. | `slide 29`, `demos/gateway.sh` | measured |
| S06-C209 | With a valid HS256 token, the edge sets `X-User` from the verified claims and the origin returns alice's orders. | `slide 29`, `demos/gateway.sh` | measured |
| S06-C210 | An expired token gets 401 "expired". A token that claims `alg: none` gets 401 "alg none refused". Never let the token pick the algorithm. | `slide 29`, `edge/jwtlite.py` | core |
| S06-C211 | A client that sends `X-User: admin` itself is ignored. The edge overwrites the identity header with the one it derived. | `slide 29`, `demos/gateway.sh` | detail |
| S06-C212 | An attacker who hits the origin IP directly gets every order. The edge is bypassed. | `slide 29`, `demos/gateway.sh` | detail |
| S06-C213 | The gateway is only real if the origin cannot be reached directly. That is the whole point of the demo. | `slide 29` | core |
| S06-C214 | The fix is mutual TLS, which Cloudflare calls Authenticated Origin Pulls, or a Tunnel. The origin then answers only clients holding the edge's certificate. | `slide 29` | detail |
| S06-C215 | With mTLS on, the direct request gets a connection reset and the edge still works. | `slide 29`, `demos/gateway.sh` | measured |
| S06-C216 | Header hygiene belongs at the edge too. The lab origin leaks `X-Powered-By: PHP/5.4.45`, and the edge strips it. | `slide 29`, `origin/origin.py` line 109 | detail |

### Block G. 06 Cloudflare, hands-on, pages 30 to 32

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S06-C217 | Six demos need no account at all. Any student can run them on a laptop with `curl`, `dig` and `cloudflared`. | `slide 30`, `cloudflare/no-account.sh` | core |
| S06-C218 | Demo 1 reads the colo, the TLS version and the key exchange out of `/cdn-cgi/trace`. | `slide 30` | detail |
| S06-C219 | Demo 2 asks the anycast resolver which city answered, with a CHAOS-class TXT query for `id.server`. | `slide 30` | detail |
| S06-C220 | Demo 3 greps the headers a CDN adds: `cf-ray`, `cf-cache-status`, `age` and `alt-svc`. | `slide 30` | detail |
| S06-C221 | Demo 4 times the same TLS handshake to a Mumbai AWS endpoint and a Virginia AWS endpoint, with `curl -w '%{time_appconnect}'`. Those are regional endpoints, not CDNs. | `slide 30`, `cloudflare/no-account.sh` | detail |
| S06-C222 | Demo 5 starts `tools/echo_server.py` on port 8000 and runs `cloudflared tunnel --url http://localhost:8000`. It prints a random `trycloudflare.com` URL. | `slide 30` | core |
| S06-C223 | The quick tunnel puts your laptop behind Cloudflare's edge in seconds, with no account and no DNS record. | `slide 30` | core |
| S06-C224 | The echo server prints each request's `CF-Connecting-IP`, the `CF-Ray` with the visitor's colo, and `CDN-Loop`. | `slide 30`, `tools/echo_server.py` | core |
| S06-C225 | The echo server also shows how few TCP connections `cloudflared` uses for the whole room. That is the pool, visible. | `slide 30` | detail |
| S06-C226 | Quick-tunnel limits: 200 in-flight requests, no server-sent events, and testing use only. | `slide 30` | detail |
| S06-C227 | Two browser pages belong in the same demo: `radar.cloudflare.com` for traffic and attacks by country, and `speed.cloudflare.com` for latency and jitter to your point of presence. | `slide 30` | detail |
| S06-C228 | The account demos need one free zone and one origin. The instructor drives them, after a dry run. | `slide 31` | detail |
| S06-C229 | Toggling the orange cloud in DNS makes `dig` show the origin IP vanish behind two anycast addresses. | `slide 31`, `cloudflare/INSTRUCTOR.md` §A | detail |
| S06-C230 | The orange cloud hides nothing if the origin still accepts traffic from everyone. Old DNS history, MX records and certificate-transparency logs all leak the origin IP. | `cloudflare/INSTRUCTOR.md` §A | core |
| S06-C231 | A Cache Rule makes an HTML page cacheable. The sequence to show is MISS, HIT, purge, MISS, with the `age` header climbing between. | `slide 31` | core |
| S06-C232 | Free-plan limits: 5 WAF custom rules with no regular expressions, 10 Cache Rules, 1 rate-limiting rule with a 10-second period only, and 100,000 Worker requests per day. | `slide 31`, `cloudflare/INSTRUCTOR.md` | core |
| S06-C233 | A Transform Rule strips `X-Powered-By` with no code at all. | `slide 31` | detail |
| S06-C234 | The free-plan limits are themselves the lesson. One WAF rule with no regex is why the `demos/waf.sh` bypasses matter, and a 10-second-only window is exactly the fixed-window weakness. | `slide 31` | core |
| S06-C235 | A rate-limiting rule at 20 requests per 10 seconds on `/api/*` lets about 20 requests through, then returns 429. The counts are per data centre. | `cloudflare/INSTRUCTOR.md` §D | detail |
| S06-C236 | A Worker runs your code at the edge. The gateway Worker rate-limits, verifies a JWT with WebCrypto, sets `X-User`, and fetches the primary origin with a backup fallback. | `slide 32`, `cloudflare/worker-gateway/src/index.js` | core |
| S06-C237 | A Worker is a V8 isolate, not a process. It starts in about 5 ms and costs about 3 MB, against about 35 MB and a cold start for a container. | `slide 32` | core |
| S06-C238 | That answers Session 3's question, "is not everything a web server?", one more time. CGI forked a process per request, FastCGI kept them warm, nginx ran an event loop, and a Worker runs an isolate. | `slide 32` | core |
| S06-C239 | A Worker needs no fork and no exec per request, and no virtual machine to boot. The runtime is already resident in every point of presence. | `slide 32` | detail |
| S06-C240 | A Worker is prefork, FastCGI and servlets again: amortise the setup, taken to the edge. | `slide 32` | core |
| S06-C241 | Both lab Workers ran locally in workerd, Cloudflare's real runtime, through Miniflare, against the lab origin. `node test_workers.mjs` runs them. | `slide 32`, `cloudflare/test_workers.mjs` | measured |
| S06-C242 | The gateway Worker reproduced every line of `demos/gateway.sh`: 401 on no token, `alg: none` refused, and failover to the backup origin. | `slide 32` | measured |
| S06-C243 | The ESI Worker's assembled page was checked byte for byte against the origin's own assembly. | `slide 32` | measured |
| S06-C244 | The ESI Worker first used HTMLRewriter and it ate the page header. HTML has no self-closing custom elements, so an HTML parser reads `<esi:include .../>` as an open tag whose content runs to `</header>`. | `cdn-lab/README.md` | core |
| S06-C245 | ESI is XML-ish markup inside HTML, and the two grammars disagree about where an element ends. That is Session 2's framing question again. The Worker uses a regular expression instead. | `cdn-lab/README.md`, `slide 32` | core |

### Block H. 07 Closing, pages 33 to 38

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S06-C246 | The bill for a CDN has four lines: your TLS private keys, a single point of failure, the power to see and shape traffic, and lock-in by architecture. | `slide 33` | core |
| S06-C247 | The edge terminates HTTPS, so it holds your keys or its own certificate for your domain. It can read every byte. That is the deal. | `slide 33` | core |
| S06-C248 | The Fastly outage of 8 June 2021 started with one customer's configuration change and took 49 minutes to recover. | `slide 33` | story |
| S06-C249 | Domain fronting used CDNs to hide censored traffic behind innocent domains. AWS and Google banned it in 2018, Azure in 2022 and Fastly in February 2024. | `slide 33` | story |
| S06-C250 | Whoever runs the edge decides what flows. | `slide 33` | detail |
| S06-C251 | Once the WAF, the rate limits, the authentication and your Workers live at the edge, it is not a cache you can swap. It is your security perimeter. | `slide 33` | core |
| S06-C252 | A CDN is enormous leverage rented cheaply, and the rent is trust, concentration and dependence. Use it, and know the bill. | `slide 33` | core |
| S06-C253 | Closing idea 1: move the work, or move the data. You cannot beat the speed of light, so you move content closer or push personalisation outward. Every CDN trick is one of those two moves. | `slide 34` | core |
| S06-C254 | Closing idea 2: the edge is wherever all the traffic converges. Caching routed everything through the edge, and the firewall, the rate limiter, the scrubber, the authentication and your code all followed. | `slide 34` | core |
| S06-C255 | Closing idea 3: it is all Sessions 2 to 5, rented by the city. Reverse proxy, connection pool, ETag revalidation, BBR, multiplexing, consistent hashing and framing. A CDN invents almost nothing. | `slide 34` | core |
| S06-C256 | Closing idea 4: concentration cuts both ways. The same pooling that absorbs a 31 Tbps flood is also the single point of failure that takes 85% of the web down. | `slide 34` | core |
| S06-C257 | `./setup.sh` builds a private certificate authority and three certificates, with `openssl` only. `./run_all.sh` runs 7 benches and 6 demos in about 80 seconds, with no network. | `slide 35`, `cdn-lab/README.md` | core |
| S06-C258 | `edge/edge.py` is about 450 lines and it is the whole lecture as code: cache, pool, WAF, rate limit, JWT and ESI in one file. The measured file is 486 lines. | `slide 35` | measured |
| S06-C259 | The order of stages inside the edge is fixed: rate limit, then WAF, then gateway, then cache, then origin pool, then ESI assembly. | `edge/edge.py` | core |
| S06-C260 | The instructor's reading task: read `edge/edge.py` end to end, then break it. Set `--pool 0` and watch reuse collapse. Set `--waf off` and watch the injection land. | `slide 35` | core |
| S06-C261 | The lab is honest about four things it does not model: loss and bandwidth, HTTP/2 to the origin, anycast and BGP, and a real kernel accept queue. | `slide 35`, `cdn-lab/README.md` | core |
| S06-C262 | `tools/laggy.py` delays every chunk by half the RTT each way. It never drops a packet, so it is a physics floor and nothing else. | `slide 35`, `tools/laggy.py` | detail |
| S06-C263 | BBR against CUBIC needs `tc netem` on a real Linux box. The lab refuses to fake that number. | `slide 35` | detail |
| S06-C264 | The worker-pool bench assigns each visitor a random simulated worker instead of using a real kernel accept queue. It is a model, and the slide says so. | `slide 35`, `cdn-lab/README.md` | detail |
| S06-C265 | Where a number is a model and not a measurement, both the slide and the README say so. | `slide 35` | detail |
| S06-C266 | Week 7 is Building for failures. The question it opens with: today's edge survives your origin dying with a stale hit, so what does your origin do when the edge dies? | `slide 38` | core |
| S06-C267 | Four threads hang over into week 7: stale-if-error, the Fastly 49 minutes with retry and timeout and circuit-breaker logic, failover, and the thundering herd on recovery. | `slide 38` | detail |
| S06-C268 | `demos/failover.sh` runs a primary and a backup origin, kills the primary, and shows the edge switch over. The `X-Origin` header names which one answered. | `slide 38`, `demos/failover.sh` | measured |

## 4. Instructor questions

Question count: 19. Three of them are graded, so they carry no model answer.

### Graded work

**S06-Q01. The class 6 assignment, page 36. "Put something real behind the edge, and prove what it did."**
**Graded. No model answer.** Due before Session 7. The deliverable is the code plus a
one-page write-up with the numbers and the cache-key story.

Requirement checklist, straight from the slide:

| # | Requirement |
|---|---|
| 1 | Build a small origin in any language. |
| 2 | It serves one cacheable static asset and one personalised HTML page. |
| 3 | Put it behind Cloudflare. A free zone works. A Quick Tunnel also works, with no account and no domain. |
| 4 | Show `cf-cache-status` going MISS then HIT for the asset, and DYNAMIC for the page. |
| 5 | Make the page cacheable, then show the change in origin request count. Log the count at the origin. |
| 6 | Demonstrate one cache-key hazard on your own site: a header your origin reflects that the key ignores. |
| 7 | Close that hazard, and write up why it worked. |
| 8 | Report time to first byte from far away, for cold origin against warm edge against cache hit. A cloud box in another region or a friend both count. |
| 9 | One table, in the shape of `bench/02_split_tcp.py`. |
| 10 | Add exactly one edge feature: a WAF rule, a rate limit, or a Worker that verifies a token. |
| 11 | Show one request it blocks and one request it allows. |
| 12 | Numbers, not screenshots. |

Hint ladder. Each rung is a question or a place to look, never a solution.

1. Which claim in this file tells you why HTML is DYNAMIC by default? Start there.
2. Which eight values can `cf-cache-status` hold, and which of them means "I never looked"?
3. What is in the default cache key, and what is not? The answer is one line of `edge/edge.py`.
4. Your origin has to count requests before you can report a change. What does `origin/origin.py` expose at `/__origin/stats`, and why does that exist?
5. Which header does `demos/poison.sh` use, and why does that specific header work?
6. The slide names three closes for the hazard. Which one does your platform let you do, and which one does the origin have to do?
7. Measuring from far away needs a second place to run `curl`. Which of the two options on the slide do you have access to?
8. For the one edge feature: which of the three has a free-plan limit that might block you? Check the limits table in `cloudflare/INSTRUCTOR.md` before you choose.

**S06-Q02. The class 5 assignment, page 3. The calculator that stays on the line.**
**Graded. No model answer.** Still open, due before Session 7, submitted Friday
25 September during class. Session 5 owns it. See `S05-Q01` and claims `S05-C04` to
`S05-C11`.

**S06-Q03. The course project, page 4. "HTTP, in binary."**
**Graded. No model answer.** Still open. Session 5 owns it. See claims `S05-C12` to
`S05-C22`. The slide asks one design question inside it: HTTP/2 chose field widths of
24, 8, 8 and 31 bits, so why? That is part of the graded defence.

### Homework, page 37

**S06-Q04. Homework 1. Run the whole lab, read `edge/edge.py` end to end, change one flag, and explain the number that moves.** The slide names three flags: `--pool 0`, `--waf off`, `--strip-unkeyed`.

Model answer outline. Each flag has a number that answers to it.

| Flag | The number that moves | Why |
|---|---|---|
| `--pool 0` | reuse falls to 0%, and mean time to first byte rises from 57 ms toward 160 ms in `bench/03_pool.py` terms | every origin request now pays a fresh TCP and TLS handshake |
| `--waf off` | the first `demos/waf.sh` payload stops being blocked, and the origin leaks 5 rows | nothing inspects the query string, so the f-string SQL in the origin runs it |
| `--strip-unkeyed` | the poisoning attempt stops persisting | the edge removes `X-Forwarded-Host` before the origin can reflect it into a cached page |

The learner should name the mechanism, not only the delta.

**S06-Q05. Homework 2. Redo BBR against CUBIC for real.** On a real Linux box, add 1% loss at 150 ms RTT with `tc netem`, download a large file under `cubic` and under `bbr` through `sysctl`, and report the gap.

Model answer outline. The expected direction is clear and the size is not. CUBIC reads
the 1% loss as congestion and halves its window repeatedly, so its throughput tracks the
Mathis ceiling of about MSS over RTT times the square root of loss. BBR paces to the
measured bottleneck rate and ignores the loss, so it should come out several times
faster. The honest report names the kernel version, the `tc netem` command, the file
size, and the median of several runs. The slide is explicit that the lab refused to fake
this number, because `laggy.py` delays and never drops.

**S06-Q06. Homework 3. Poison your own cache, then fix it three ways.** Reproduce `demos/poison.sh` against a site you control. Close it by dropping the header, by adding it to the key, and by sending `Vary` on it. Then argue which one a real CDN should default to, and why.

Model answer outline.

| Fix | What it costs | What it misses |
|---|---|---|
| drop the unkeyed header at the edge | breaks any origin that legitimately needs the header | nothing, if the origin truly does not need it |
| add the header to the cache key | one cache entry per distinct header value, so the hit rate falls and an attacker can flood the key space | nothing, but it is the expensive option |
| the origin sends `Vary` on the header | correct and standard, but it depends on the origin remembering to do it for every such header | any header the origin forgets |

The defensible default is to drop it, because it is safe without origin cooperation and
it costs no cache entries. The second-best default is to strip the whole class of
`X-Forwarded-*` and similar hop headers at the trust boundary. `Vary` is the right fix
but the wrong default, because a CDN cannot make the origin correct.

**S06-Q07. Homework 4. Find a real `cf-cache-status` in the wild.** Run `curl -I` against ten sites you use. For each one, explain the status, the `Cache-Control` header, and what the cache key must be. Find one HIT you believe is a mistake.

Model answer outline. The learner needs the eight-state table and the default key.
Expect a lot of DYNAMIC on HTML, HIT on assets with a content hash in the filename, and
BYPASS where the origin sends `no-store`. A suspicious HIT is a page that looks personal
and still says HIT, or any URL with a session token in the query string that answers HIT.
The write-up must say what evidence makes it suspicious, because a cache status alone
does not prove a leak.

**S06-Q08. Homework 5. Measure the speed of light to your users.** Pick your origin's real region. For five cities your users live in, compute the RTT floor with `bench/01_physics.py`, then measure the real ping. Where is the gap biggest, and would a CDN close it?

The instructor marks this one "the one to do if you do only one", because it makes the
physics personal.

Model answer outline. The floor is twice the great-circle distance divided by 204,218
km/s. The gap between the floor and the ping is the stretch factor, and the bench already
prints it. The reasoning that earns the marks: a CDN cannot change the floor, so it only
helps where the stretch is large or where the content is cacheable. Singapore in the
bench is 3.3 times closer than Washington and only 1.3 times faster, so that path has a
large routing gap a CDN can buy back. A path already near its floor has nothing left to
win except the handshakes and the cache.

### Questions the instructor asks in class

**S06-Q09. "Which one did you get?" Page 15.** Run `curl -s cloudflare.com/cdn-cgi/trace` on the classroom wifi, then ask somebody on mobile data to run it. Same domain, same IP, different colo. Why?

Answer: BGP anycast. One address is announced from every city, and the routing decides
which announcement each network reaches. The classroom and the mobile carrier sit in
different networks, so they take different routes to the same address. The colo code in
the reply names the building.

**S06-Q10. "Which cache holds which URL?" Page 13.** Get this wrong and every upgrade is a cold cache. What goes wrong with `hash(url) % N`?

Answer: N appears in the formula, so changing N changes the owner of nearly every URL.
The bench measures 90.9% moved when ten caches become eleven. Consistent hashing places
servers and URLs on one ring, so adding a server only steals the arc in front of it, and
only its fair share moves. Virtual points fix the load imbalance that one point per
server leaves.

**S06-Q11. "Read the trade carefully." Page 19.** ESI cut origin bytes by 98% and raised origin requests from 100 to 201. Which number matters to you?

Answer: it depends on the bottleneck. If the origin is limited by page rendering or by
egress bandwidth, ESI wins, because the shell is rendered once. If the origin is limited
by requests per second or by connection count, ESI loses, because each personal fragment
is its own request. The learner must name the bottleneck before claiming the win.

**S06-Q12. "So what is it FOR?" Page 26.** `demos/waf.sh` shows two bypasses in four lines. Why run a WAF at all?

Answer: it buys time and it blocks the mass-scanned known payloads. The learner should
separate two jobs. A WAF handles volume: Log4Shell probes, the OWASP top patterns, and
every scanner on the Internet. It does not handle a targeted attacker who can spell the
same attack another way. The fix for the bug is parameter binding in the origin, which
is what `--safe` turns on.

**S06-Q13. "Is not everything a web server?" Page 32, from Session 3.** A Worker answers the question again. What is the answer this time?

Answer: the unit of isolation keeps getting cheaper. CGI forked a process per request.
FastCGI kept the processes warm. nginx ran one event loop. A Worker runs a V8 isolate
that starts in about 5 ms and costs about 3 MB, inside a runtime that is already resident
in every point of presence. Each step amortises more of the setup. The thread is
`T-setup-off-path`.

**S06-Q14. The quick-tunnel demo, page 30.** Run the tunnel together, then look at the echo server output. How many TCP connections did `cloudflared` use for the whole room?

Answer: far fewer than the number of visitors. The tunnel holds a small set of
connections to the edge and multiplexes the room's requests over them. That is the same
pool from page 23, visible in a classroom. The echo output also shows each visitor's
`CF-Ray` with their own colo, so students on different networks appear with different
codes.

**S06-Q15. "Then break it." Page 35.** Read `edge/edge.py` end to end, then set `--pool 0` and `--waf off`. What breaks?

Answer: see S06-Q04. The point of the exercise is that each flag maps to one claim in
this session, so a flag that changes no number means the learner misread the code.

**S06-Q16. The question to sit with, page 38.** Today's edge survives your origin dying, with a stale hit. What does your origin do when the edge, or a whole region, is the thing that dies?

Answer: `answer: next week's topic`. The slide names it as the opening of week 7. The
honest outline today: a stale hit protects the user from the origin, and nothing in this
session protects the user from the edge. The pieces named for week 7 are
`stale-if-error`, retries, timeouts, circuit breakers, failover, feature flags, graceful
degradation and the thundering herd on recovery.

**S06-Q17. Page 28, implied.** Why can only a CDN absorb a 31 Tbps flood?

Answer: capacity and geography together. The defender needs more inbound capacity than
the attacker has outbound, and it needs enough locations that anycast splits the flood
across all of them instead of concentrating it. Your origin has one pipe. Cloudflare has
about 500 Tbps across more than 330 cities. No amount of clever code substitutes for the
pipe.

**S06-Q18. Page 29, implied.** The edge checks the token, so why does the attacker still get every order?

Answer: the attacker skipped the edge. Authentication at the edge is a filter on one
path, not a property of the origin. The origin still answers anybody who can reach it.
The fix makes the origin unreachable except through the edge: mutual TLS, which
Cloudflare calls Authenticated Origin Pulls, or a Tunnel with no inbound port at all.

**S06-Q19. Page 11, implied.** The edge is a cache and a proxy. Which of the two saves the round trip?

Answer: only the cache. The pool saves handshakes, which is worth 621 ms down to 233 ms
in the bench. It cannot remove the 194 ms to the origin, because the bytes still come
from there. A cache hit removes that leg completely, which is what takes the number to
34 ms. The slide headline says it in one line, and a miss through the edge is sometimes
slower than going direct.

## 5. Modules

Nine modules, 195 minutes of lesson time. The slide titles carry four explicit
callbacks, printed in the top right corner of the slide: Session 2 on page 10 and
page 12, Session 3 on page 23 and page 32, Session 4 on pages 16, 22, 23 and 24, and
Session 5 on pages 20, 24 and 29. Each module names the earlier class in its prereqs.

### s06-m01-physics-budget

- **Title:** The speed of light is the budget. **Minutes:** 20.
- **Big idea:** Distance sets a floor on latency that no code can cross, and the edge buys back handshakes for free but needs a cache to delete the long leg.
- **Covers:** S06-C05, S06-C11, S06-C12, S06-C15, S06-C16, S06-C17, S06-C18, S06-C19, S06-C20, S06-C21, S06-C22, S06-C23, S06-C24, S06-C25, S06-C26, S06-C27, S06-C28, S06-C29, S06-C30, S06-C31, S06-C32, S06-C33, S06-C34, S06-C35, S06-C36, S06-C37, S06-C38, S06-C39, S06-C40, S06-C41, S06-C42, S06-C43, S06-C44, S06-C45.
- **Prereqs:** s05-m06-what-it-cost, s02-m05-congestion-bbr, s05-m10-quic-handshakes.
- **Threads:** T-round-trip-tax, T-honest-benchmarks, T-setup-off-path.

**Pretest.**
1. How fast does light travel in an optical fibre, as a fraction of its speed in vacuum? *Answer: about two thirds.*
2. You double your origin's CPU speed. What happens to a user 12,000 km away? *Answer: almost nothing, because the wait is travel time.*
3. A proxy sits between you and your origin. Does it make a cache miss faster? *Answer: no. It usually makes it slightly slower.*

**Rung 1, the picture.** A friend lives on the other side of a big city. You can shout
questions down a very long tube to her house. The tube carries your voice at a fixed
speed, and nothing you do changes that speed. If a question takes 60 seconds to reach
her and 60 seconds to come back, one question costs two minutes, even if she answers
instantly. Now put a helper halfway, in a shop near your house. If the helper already
knows the answer, you get it in a few seconds. If the helper does not know, she shouts
down the same tube and you wait the same two minutes, plus the few seconds to the shop.
*Where it breaks:* the helper near your house is also useful when she does not know the
answer, because she keeps a line to your friend's house already open, and opening a line
takes several trips of its own.

**Rung 2, how it works.**
1. Light in vacuum travels 299,792 km per second. Glass has a group index near 1.468, so light in fibre travels 204,218 km per second.
2. That is 4.90 ms for every 1000 km, one way.
3. A round trip doubles it. Mumbai to Washington is 12,847 km on the great circle, so the round-trip floor is 126 ms.
4. A new TLS 1.3 connection needs three of those round trips before the first byte arrives, so about 380 ms passes with nothing useful in it.
5. Real paths are longer than the great circle. The measured Mumbai to Washington ping is 204 ms, about 1.6 times the floor.
6. Distance also raises the loss rate, and a single TCP flow's throughput falls with RTT and with the square root of loss.
7. Put an edge 10 ms away. A cache hit answers from there, so the 194 ms leg to the origin never happens.
8. On a miss the edge still has to cross that leg, so a miss is no faster than going direct.

**Rung 3, the real thing.** `bench/01_physics.py` holds the constants: `C_VACUUM =
299_792.458` and `GROUP_INDEX = 1.468`. It computes the great-circle distance with the
haversine formula on a 6371 km sphere, then the floor as twice the distance over the
fibre speed. Run on this machine on 2026-10-10 it printed 204,218 km/s, 4.90 ms per 1000
km, a Chennai floor of 10 ms against a measured 23 ms, and a Washington floor of 126 ms
against a measured 204 ms. The measured pings come from WonderNetwork, 8 to 17 September
2026, one machine pair per city. The Akamai table of page 10 is Nygren, Sitaraman and Sun,
ACM SIGOPS OSR 44(3), 2010, Table 1, and the script checks it against the Mathis model
`1.22 * MSS * 8 / RTT / sqrt(loss)`. `bench/02_split_tcp.py` builds the split path with
three `tools/laggy.py` proxies: 204 ms direct, 194 ms edge to origin, 10 ms you to edge.
It reports the median of five runs for each of the seven rows on page 11.

**Rung 4, exam depth.**
- *Why the floor is a floor.* The only ways under it are a shorter path or a faster medium. Hollow-core fibre has an index near 1.0003, so it would be 47% faster, and Microsoft began deploying it in September 2025. It is not on your path today, so treat 4.90 ms per 1000 km as fixed.
- *Stretch factor.* The ratio of the real ping to the floor measures the routing, not the physics. The bench prints 2.3x for Chennai, 4.1x for Singapore and 1.6x for Washington. Singla et al., HotNets 2014, put the Internet median near 3.2x. A large stretch is the part a CDN can buy back. A small stretch leaves only handshakes and caching.
- *Why distance charges twice.* Throughput is about MSS over RTT times the square root of loss, so doubling the RTT halves the ceiling, and a higher loss rate on the same path cuts it again. The Akamai rows fall from 44 Mbps to 0.4 Mbps, a factor of 110, while the distance grows by a factor of 60.
- *The rejected alternative.* You could buy a bigger pipe instead of an edge. More bandwidth does not shorten a round trip, and the Mathis ceiling depends on RTT and loss, not on the link rate. That is why page 10 sends you to multiplexing and BBR, not to a fatter link.
- *What if the edge has no pool.* Page 11 measures it: 625 ms against 621 ms direct. The edge became a longer proxy, with three short round trips added to three long ones. An edge with no warm pool and no cache is worse than nothing.
- *Exam prompts.* (1) Your origin is in Virginia and half your users are in Mumbai. You cannot move the origin. Name two things a CDN changes and one thing it cannot. *Model answer: it can keep a warm pooled connection to the origin, which removes two of the three round trips of a new connection, and it can serve cacheable content from Mumbai, which removes the 194 ms leg entirely. It cannot change the 126 ms floor for content that must come from the origin.* (2) A colleague says "our page is slow because the server is slow, so we will add CPU". The RTT is 204 ms and the server spends 8 ms rendering. What do you say? *Model answer: the CPU is 4% of the wait. Three round trips of TLS setup cost about 600 ms. Work on the connection setup and the cache, not on the CPU.*

**Misconceptions.**
- S06-M01: "A faster server fixes a slow page for distant users." Wrong: most of the wait is travel time, and no CPU changes propagation delay. Distractor in check 1.
- S06-M02: "Light in fibre travels at the speed of light in vacuum." Wrong: glass has a group index near 1.468, so it travels about two thirds as fast. Distractor in check 2.
- S06-M03: "Putting a CDN in front of a site makes every request faster." Wrong: a cache miss through the edge measured 625 ms against 621 ms direct. Distractor in check 3.
- S06-M04: "More bandwidth lowers latency." Wrong: bandwidth is bytes per second, and the round trip is a distance divided by a speed. Distractor in check 4.
- S06-M05: "The measured ping equals the physics floor." Wrong: real routes are longer and the Internet median is about 3.2 times the floor. Distractor in check 5.

**Diagrams.** (1) Static: a world map with the Mumbai to Washington great circle, labelled 12,847 km and 126 ms floor against 204 ms measured. (2) Step-by-step: the split path. Three frames showing direct new connection, edge with warm pool, and edge cache hit, with the round trips drawn as arrows and the time accumulating. Actors: user, edge, origin.

**Interactives.** (1) *Latency budget calculator* (P1). Inputs: origin city, user city, connection state (new or kept alive), cache state (hit or miss). The learner sees distance, floor, three-round-trip TLS cost and the total. The learner discovers that the cache row is the only one that drops below the floor of the long leg. (2) *Mathis ceiling plot* (P2). Inputs: RTT and loss rate. The learner sees the single-flow throughput ceiling and the Akamai rows plotted on it, and discovers why long paths need many flows or BBR.

**Predict, observe, explain.** Command: `python3 bench/01_physics.py`. Question to predict: Singapore is 3,904 km from Mumbai and Washington is 12,847 km. Washington is 3.3 times further. How many times slower will the measured ping be? Observe: Singapore 156 ms, Washington 204 ms, so only 1.3 times. Captured output: the run of 2026-10-10 recorded in section 1 of this file, and slide 8.

- **Worked example.** London is 7,192 km from Mumbai. One way: 7192 / 204218 s = 35.2 ms. Round trip: 70 ms. Three TLS round trips: 211 ms. The measured ping is 125 ms, a stretch of 1.8x, so the real TLS cost is about 375 ms.
- **Faded example.** Tokyo is 6,720 km from Mumbai. The round-trip floor is ____ ms. The measured ping is 135 ms, so the stretch is ____. *(66 ms, because 2 × 6720 / 204218 = 0.0658 s. 2.1x.)*
- **Your turn.** Los Angeles is 13,991 km from Mumbai, and the measured ping is 229 ms. Compute the round-trip floor and the stretch. Then say how much of the 229 ms a CDN could remove for a cacheable asset, and for an uncacheable one. *(Floor 137 ms, stretch 1.7x. For a cacheable asset almost all of it, because the asset comes from a nearby point of presence. For an uncacheable one, only the handshakes, because the bytes still travel the whole way.)*

**Checks.**
1. `mcq`: a user 12,000 km away waits 1.2 s for a page. The server renders in 10 ms. What do you fix first? Answer: the connection setup and the cache. Distractor: the server CPU (S06-M01). Distractor: the link bandwidth at the origin (S06-M04). Feedback: 10 ms of 1,200 ms is under 1%.
2. `numeric`: how many ms does light need to cross 1000 km of fibre, one way? Answer: 4.9. Distractor: 3.3 (S06-M02: uses the vacuum speed). Distractor: 9.8 (S06-M02: gives the round trip). Feedback: 1000 / 204218 s is 4.90 ms.
3. `predict`: a brand new connection fetches an uncacheable page through an edge with no origin pool. Direct costs 621 ms. What does the edge cost? Answer: about 625 ms, slightly worse. Distractor: about 210 ms, because the edge is near (S06-M03). Distractor: about 34 ms, because edges are fast (S06-M03). Feedback: the edge added three short round trips and removed none of the long ones.
4. `mcq`: your path has 150 ms RTT and 1% loss. You upgrade the link from 100 Mbps to 1 Gbps. What happens to one TCP flow? Answer: almost nothing, because the ceiling depends on RTT and loss. Distractor: it gets about ten times faster (S06-M04). Distractor: the RTT falls by ten times (S06-M04). Feedback: the Mathis ceiling has no link-rate term.
5. `numeric`: Mumbai to Chennai is 1,033 km. What is the round-trip floor, in ms? Answer: 10. Distractor: 23 (S06-M05: that is the measured ping). Distractor: 5 (S06-M05: that is one way). Feedback: 2 × 1033 / 204218 s is 10.1 ms.
6. `recall`: which one of the two jobs of an edge removes the origin round trip? Answer: the cache. Distractor: the connection pool (S06-M03). Distractor: TLS termination (S06-M03). Feedback: the pool saves handshakes, and only a hit deletes the long leg.

**Review cards.**
- Q: How fast does light travel in optical fibre? A: 204,218 km/s, about two thirds of its vacuum speed, at a group index of 1.468.
- Q: How many ms per 1000 km, one way, in fibre? A: 4.90 ms.
- Q: What is the round-trip floor from Mumbai to us-east-1? A: 126 ms, over 12,847 km.
- Q: How many round trips does a new TLS 1.3 connection need to the first byte? A: three.
- Q: Which two things does an edge buy back? A: warm connections to the origin, which save handshakes, and cache hits, which delete the origin round trip.
- Q: Why is a cache miss through an edge sometimes slower than going direct? A: it adds the short round trips to the edge and removes none of the long ones.
- Q: What does the Mathis formula say? A: throughput is about MSS divided by RTT times the square root of the loss rate.

**Lab.** `cd cdn-lab && python3 bench/01_physics.py`. Look at the "stretch" column and at the Akamai block. Expected: 204,218 km/s, 4.90 ms per 1000 km, a Chennai floor of 10 against a measured 23, a Washington floor of 126 against a measured 204, and a final line that shows the measured 110x against the modelled 91.7x. Then run `python3 bench/02_split_tcp.py` after `./setup.sh`, and expect the seven rows of page 11 within a few ms.

### s06-m02-what-a-cdn-is

- **Title:** A rented reverse proxy, and the algorithm that makes a fleet of them work. **Minutes:** 25.
- **Big idea:** A CDN invents almost nothing. It is Session 4's reverse proxy in 300 cities, held together by consistent hashing and one anycast address.
- **Covers:** S06-C13, S06-C14, S06-C47, S06-C48, S06-C49, S06-C50, S06-C51, S06-C52, S06-C53, S06-C54, S06-C55, S06-C56, S06-C57, S06-C58, S06-C59, S06-C60, S06-C61, S06-C62, S06-C63, S06-C64, S06-C65, S06-C66, S06-C67, S06-C68, S06-C69, S06-C70, S06-C71, S06-C72, S06-C73, S06-C74, S06-C75, S06-C76, S06-C77, S06-C78, S06-C79, S06-C80.
- **Prereqs:** s04-m07-reverse-proxy, s04-m08-cache, s04-m10-upstreams, s02-m11-reliability-address, s06-m01-physics-budget.
- **Threads:** T-setup-off-path, T-law-or-habit.

**Pretest.**
1. What does a reverse proxy do that a forward proxy does not? *Answer: it stands in front of the servers and answers for them, so the client thinks it is the origin.*
2. Ten caches share 100,000 URLs by `hash(url) % 10`. You add an eleventh. Roughly what share of URLs changes owner? *Answer: about 90%.*
3. Two people in different cities type the same domain and get the same IP address. How can different machines answer them? *Answer: the same address is announced from many places, so routing decides which one each person reaches.*

**Rung 1, the picture.** A chain of corner shops sells the same bread. Head office bakes
it. Each shop keeps a few loaves on the shelf, and every shop has the same phone number
painted on the window. When you dial that number, the call goes to the shop nearest you,
because the phone company routes it that way. Nobody told you which shop you reached, so
every receipt prints the shop code. Head office also has a rule about which shop stocks
which kind of bread, and the rule has to survive opening a new shop. A bad rule
reshuffles every shop's stock on opening day. A good rule only moves the new shop's fair
share. *Where it breaks:* a corner shop cannot bake bread it has never seen, while a
cache can always fetch the real thing from head office and keep a copy.

**Rung 2, how it works.**
1. A CDN runs a reverse proxy in each of its cities. That proxy terminates TLS, caches, and inspects requests.
2. One anycast IP address is announced from every city at once, so the routing picks the nearest announcement.
3. The edge keeps warm pooled connections over one long controlled leg to your origin.
4. A shield or tiered-cache layer sits between the edges and the origin, so many edges share one origin fetch.
5. Inside one city, many cache machines share the work, so something must decide which machine owns which URL.
6. `hash(url) % N` fails that job, because N is in the formula and changing N changes almost every owner.
7. Consistent hashing places servers and URLs on one ring, so a new server steals only the arc in front of it.
8. Many virtual points per server even out the load, at the cost of a little more movement.

**Rung 3, the real thing.** `bench/06_consistent_hash.py` hashes 100,000 URLs across ten
servers and then adds an eleventh. Run on this machine on 2026-10-10 it printed 90.9%
moved for modulo at a 1.02x load imbalance, 3.3% moved for one point per server at a
2.93x imbalance, and 8.2% moved for 160 points at a 1.14x imbalance. The ideal share for
ten plus one is one in eleven, which is 9.1%, so the 160-point row sits at the ideal.
nginx ships the same thing as `hash $request_uri consistent`, and
`ngx_http_upstream_hash_module.c` multiplies the peer weight by 160, which is
ketama-compatible. The paper is Karger, Lehman, Leighton, Levine, Lewin and Panigrahy,
STOC 1997. The live demo is `cloudflare/no-account.sh` steps 1 and 2:
`curl -s https://www.cloudflare.com/cdn-cgi/trace` prints the colo, and
`dig +short CHAOS TXT id.server @1.1.1.1` names the resolver instance. The build host
that made the deck got `colo=IAD`, not BOM.

**Rung 4, exam depth.**
- *Why modulo spreads load well and still fails.* Modulo gives a 1.02x imbalance, which is almost perfect. The metric that matters for a cache is not the balance but the churn on a membership change. Measuring only the balance hides the real cost.
- *The virtual-point trade.* One point per server moves the least, 3.3%, and leaves one server with 2.93 times the mean load. 160 points move 8.2% and bring the imbalance to 1.14x. You pay a little churn for a lot of balance, and 160 is the deployed default, not a theoretical optimum.
- *The rejected alternative.* A central registry that maps URL to server would move nothing at all, because you could assign the new server any set you like. It costs you a lookup on every request and a thing that can fail. Consistent hashing is the answer when you want no registry.
- *Why the software layer is familiar.* Fastly is a modified Varnish plus H2O. Cloudflare was nginx plus LuaJIT, then Rust on Oxy as FL2 in October 2025, and its origin-facing proxy became Pingora in 2022. The pattern of Sessions 3 and 4 repeats: a team adopts a proxy, outgrows it, and writes its own.
- *What if anycast sends a user to a far city.* It can happen, because BGP picks by policy and hop count, not by latency. That is why every response carries the colo in `cf-ray`. You debug a slow user by reading the colo first.
- *Exam prompts.* (1) You run 8 cache servers behind one hostname and want to add 2 more at peak season. What breaks under modulo hashing, and what do you deploy instead? *Model answer: modulo moves about 80% of keys, so almost every URL misses at once and the origin takes a stampede at the busiest moment. Use consistent hashing with many virtual points, so only the new servers' fair share moves.* (2) Explain in two sentences why "the CDN is just nginx" is both right and useless. *Model answer: right, because the data path is a caching reverse proxy, which is nginx's job. Useless, because the value is the geography, the anycast address, the pooling on the long leg, and the capacity, none of which you can install.*

**Misconceptions.**
- S06-M06: "A CDN is a new kind of server." Wrong: it is the reverse proxy of Session 4, rented in many cities. Distractor in check 1.
- S06-M07: "Modulo hashing is bad because it spreads load unevenly." Wrong: the imbalance is 1.02x. The problem is that adding one server moves 90.9% of keys. Distractor in check 2.
- S06-M08: "Consistent hashing with one point per server is the best version." Wrong: it moves the least but leaves a 2.93x load imbalance. Distractor in check 3.
- S06-M09: "You choose which point of presence serves you." Wrong: BGP anycast chooses it, and the colo code tells you after the fact. Distractor in check 4.
- S06-M10: "Anycast means each city has its own IP address." Wrong: one address is announced from every city at once. Distractor in check 5.

**Diagrams.** (1) Static: the three-part path of page 12, with the Session labels attached to each piece. Reverse proxy from Session 4, pool from Session 3, anycast from Session 2. (2) Step-by-step: a hash ring with ten servers, then an eleventh inserted, showing which arc moves. Two versions, one point and many points per server.

**Interactives.** (1) *Hash ring explorer* (P1). Inputs: server count, points per server, add or remove a server. The learner sees the keys that move and the per-server load, and discovers both halves of the trade. (2) *Modulo against consistent* (P1). Inputs: N before and after. The learner sees a bar of moved keys, and discovers the 90% cliff. (3) *Colo lookup* (P2). The learner pastes a `cdn-cgi/trace` output and the page decodes the fields, including the IATA code.

**Predict, observe, explain.** Command: `python3 bench/06_consistent_hash.py`. Question to predict: with 160 points per server, what share of 100,000 URLs moves when ten caches become eleven? Observe: 8.2%, close to the 9.1% ideal. Captured output: the run of 2026-10-10 recorded in section 1, and slide 13.

- **Worked example.** Four caches, `hash(url) % 4`. A URL hashes to 97. 97 mod 4 is 1, so cache 1 owns it. Add a fifth cache. 97 mod 5 is 2, so cache 2 owns it now. The URL moved, and it was not on the new server.
- **Faded example.** The same URL hashes to 100. Under four caches the owner is ____. Under five it is ____. Did it move? ____ *(0, because 100 mod 4 = 0. 0, because 100 mod 5 = 0. No, by luck.)*
- **Your turn.** Ten caches become eleven. The bench reports 90.9% moved under modulo and 8.2% under consistent hashing with 160 points. How many of the 100,000 URLs does each scheme move, and how many does a perfect scheme move? *(90,900 and 8,200. A perfect scheme moves 9,091, which is one in eleven, so consistent hashing is already at the ideal and modulo is ten times worse.)*

**Checks.**
1. `mcq`: what is a CDN edge, in architectural terms? Answer: a caching reverse proxy, run in many cities. Distractor: a new protocol between the browser and the origin (S06-M06). Distractor: a faster kind of origin server (S06-M06). Feedback: page 12 lists the parts and names the session each one came from.
2. `numeric`: ten caches become eleven under `hash(url) % N`. What percentage of 100,000 URLs changes owner? Answer: 90.9. Distractor: 9.1 (S06-M07: that is the ideal). Distractor: 10 (S06-M07). Feedback: N is in the formula, so changing N reshuffles nearly everything.
3. `mcq`: why use 160 virtual points per server instead of one? Answer: one point leaves a 2.93x load imbalance. Distractor: one point moves more keys (S06-M08). Distractor: one point cannot hash long URLs (S06-M08). Feedback: one point moves the least and balances the worst.
4. `mcq`: two students run the same trace command and get different colo codes. Why? Answer: BGP anycast routes each network to a different announcement of the same address. Distractor: each student resolved a different IP address (S06-M10). Distractor: the student picked a region in the request (S06-M09). Feedback: the address is the same, and the routing differs.
5. `recall`: what does the suffix of a `cf-ray` header tell you? Answer: the colo, as an IATA airport code, that served the response. Distractor: the customer account (S06-M09). Distractor: the cache status (S06-M09). Feedback: it is how you debug a slow or stale user.

**Review cards.**
- Q: What is a CDN, in one sentence? A: Session 4's caching reverse proxy, rented in more than 300 cities, with one anycast address.
- Q: What share of keys moves when `hash(url) % N` goes from 10 to 11 servers? A: 90.9%, measured over 100,000 URLs.
- Q: What does consistent hashing with 160 points per server move in the same test? A: 8.2%, against a 9.1% ideal.
- Q: Which paper is Akamai founded on? A: Karger et al., consistent hashing, STOC 1997.
- Q: How does nginx spell consistent hashing? A: `hash $request_uri consistent`, 160 points per server weight.
- Q: What is a colo? A: the CDN building that answered you, named by its IATA airport code.
- Q: Which three earlier sessions does page 12 credit? A: Session 4 for the proxy and the cache, Session 3 for the pool, Session 2 for anycast addressing.

**Lab.** `python3 bench/06_consistent_hash.py`. Expected: 90.9%, 3.3% at 2.93x, 8.2% at 1.14x. Then, with a network: `bash cloudflare/no-account.sh` steps 1 and 2. Expected: a `colo=` line with a three-letter code, and a CHAOS TXT reply naming a city. Run it on two different networks and compare.

### s06-m03-caching-defaults

- **Title:** What a CDN caches when you say nothing, and the eight words it answers with. **Minutes:** 20.
- **Big idea:** The default cache key and the default eligibility list decide what gets shared, and the cache status header tells you which of eight things happened.
- **Covers:** S06-C81, S06-C82, S06-C83, S06-C84, S06-C85, S06-C86, S06-C87, S06-C88, S06-C89, S06-C90, S06-C91, S06-C92, S06-C93, S06-C94, S06-C95, S06-C96, S06-C97, S06-C98, S06-C99, S06-C100.
- **Prereqs:** s04-m08-cache, s05-m03-validators-vary, s06-m02-what-a-cdn-is.
- **Threads:** T-where-state-goes, T-deployed-reality.

**Pretest.**
1. You put a CDN in front of your site and change nothing else. Does your home page get cached? *Answer: no. HTML is not on the default eligibility list.*
2. Two logged-in users request `/account`. What makes it dangerous for one cached copy to serve both? *Answer: the cookie is not in the cache key, so they share one object.*
3. The cache says HIT. Did your origin see the request? *Answer: no.*

**Rung 1, the picture.** A school has a photocopier in the corridor with a rule taped to
it: copy anything that looks like a worksheet, never anything that looks like a report
card. The rule reads the file extension on the folder, not the contents. The filing
clerk files each copy under the title on the front page only, and ignores the name
written inside. Two children hand in folders with the same title and different names
inside, and the clerk hands both of them the same copy. *Where it breaks:* a photocopier
never checks with the teacher before handing out a copy, and a cache can ask the origin
"is my copy still current?" and get a one-line answer.

**Rung 2, how it works.**
1. A request arrives. The edge first asks whether the object is eligible at all. Cloudflare answers that from a list of 68 static file extensions.
2. HTML and JSON are not on that list, so they go straight to the origin and the status reads DYNAMIC.
3. For an eligible object the edge builds a key: scheme, host, path and query. Nothing else.
4. The edge looks up the key. A fresh entry gives HIT and the origin is never touched.
5. No entry gives a fetch, and the status reads MISS if the response is storable, or BYPASS if the origin said `no-store`.
6. An expired entry gives a conditional request. A 304 reply gives REVALIDATED and the edge reuses its copy. A full reply gives EXPIRED.
7. Inside a stale-while-revalidate window the edge answers UPDATING from the stale copy and refreshes in the background.
8. When the origin fails and a stale-if-error window is open, the edge answers STALE.
9. When the origin is silent about freshness, the default edge TTL applies: 2 hours for 200 and 301, 3 minutes for 404.

**Rung 3, the real thing.** `edge/edge.py` holds all of it in three short methods.
`eligible()` takes the extension after the last dot of the last path segment and checks it
against `DEFAULT_EXT`. `cache_key()` returns host plus the request target, with a comment
that names the omission as the poisoning demo. `storable()` refuses anything with
`private`, `no-store`, `no-cache` or a `Set-Cookie` header, and otherwise takes the TTL
from `s-maxage`, then `max-age`, then `DEFAULT_TTL`. `cached_fetch()` returns the status
word with the response, and the eight return points are the eight words of page 17. The
UPDATING branch follows RFC 5861 stale-while-revalidate and the STALE branch follows
stale-if-error. `demos/cache.sh` walks six of the eight states in order, including a
purge and a kill of the origin process.

**Rung 4, exam depth.**
- *Why eligibility by extension at all.* It needs no cooperation from the origin and it is right for the bulk of bytes on the web. It is also wrong in both directions: it misses a cacheable JSON API, and it catches a private page that happens to end in `.css`. Module 5 turns the second half into an attack.
- *What the default key leaves out.* Cookies, `Authorization`, `Accept-Encoding`, `X-Forwarded-*` and every other header. The whole of Session 5's `Vary` exists to put something back into the key. A custom cache key does the same thing from the CDN side.
- *REVALIDATED against EXPIRED.* Both mean the TTL passed. REVALIDATED means the origin answered 304, so only headers crossed the long leg. EXPIRED means a full body crossed it. The difference is Session 5's ETag, and it is the cheapest win in the table.
- *UPDATING against STALE.* Both serve a stale body. UPDATING is planned, inside a stale-while-revalidate window, with a background refresh. STALE is unplanned, because the origin failed. The first protects latency and the second protects availability.
- *What if the origin sends both `max-age=0` and `s-maxage=300`.* A browser treats it as stale immediately and a shared cache keeps it for 300 seconds. That is exactly what the lab ESI shell does, and the `storable()` method prefers `s-maxage`.
- *Exam prompts.* (1) Your HTML pages are fully public and never personalised, and `cf-cache-status` still says DYNAMIC. Why, and what do you change? *Model answer: HTML is not an eligible extension by default, so the edge never looks in the cache. Add a Cache Rule that marks the path eligible, and keep the origin's `Cache-Control`.* (2) You see HIT on `/account` for two different users. Name the single root cause. *Model answer: the cache key does not include the cookie or the authorization header, so both users map to one object.*

**Misconceptions.**
- S06-M11: "A CDN caches everything by default." Wrong: eligibility comes from a list of static extensions, and HTML and JSON are not on it. Distractor in check 1.
- S06-M12: "DYNAMIC means the cache tried and missed." Wrong: it means the object was never eligible, so the edge never looked. Distractor in check 2.
- S06-M13: "Cookies are part of the cache key." Wrong: the default key is scheme, host, path and query only. Distractor in check 3.
- S06-M14: "STALE and UPDATING mean the same thing." Wrong: UPDATING is a planned refresh in the background, and STALE means the origin failed. Distractor in check 4.
- S06-M15: "A HIT still costs the origin one request." Wrong: on a HIT the origin is never touched. Distractor in check 5.

**Diagrams.** (1) Step-by-step: the request walking the eligibility test, the key lookup, the freshness test and the conditional request, with the status word printed at each exit. (2) Static: the eight-state table with a third column for "did the origin see it", and a fourth for the earlier session that owns the idea.

**Interactives.** (1) *Cache status machine* (P1). Inputs: path, extension, `Cache-Control` from the origin, elapsed time, origin health. The learner sees which of the eight words comes out, and discovers that two different words can both serve a stale body. (2) *Cache key builder* (P1). Inputs: a URL, a cookie, a `Vary` value. The learner sees the key and the number of stored copies, and discovers that the cookie changes nothing until `Vary` names it.

**Predict, observe, explain.** Command: `bash demos/cache.sh`. Question to predict: step 3 waits 3.2 seconds past a `max-age=3` asset. Will the next status be MISS, EXPIRED or REVALIDATED? Observe: REVALIDATED, because the origin answers 304 against the stored ETag. Captured output: slide 17 and the script header of `demos/cache.sh`.

- **Worked example.** Request `/static/app.css`, origin sends `Cache-Control: public, max-age=3`. First request: not in cache, storable, so MISS. Second request within 3 s: fresh, so HIT, and the origin count does not move.
- **Faded example.** Same asset at 4 seconds. The edge sends `If-None-Match` with the stored ETag. The origin replies 304. The status is ____ and the body travels ____ bytes over the long leg. *(REVALIDATED. Zero, because a 304 has no body.)*
- **Your turn.** The origin returns `/me/avatar.png` with `Cache-Control: private, max-age=600`. The extension is on the eligible list. What status does the edge report, and why is that the right answer? *(BYPASS. The object was eligible, so the edge looked, but `private` makes it unstorable in a shared cache, so nothing is kept. Reporting MISS would wrongly suggest a future HIT.)*

**Checks.**
1. `mcq`: you add a CDN and change nothing. Which of these is cached by default? Answer: `/static/app.css`. Distractor: `/page/home` as HTML (S06-M11). Distractor: `/api/orders` as JSON (S06-M11). Feedback: eligibility comes from the extension list, and HTML and JSON are off it.
2. `mcq`: what does DYNAMIC mean? Answer: the object was not eligible, so the cache was never consulted. Distractor: the cache was consulted and missed (S06-M12). Distractor: the object changes on every request (S06-M12). Feedback: MISS is the word for a consulted-and-absent object.
3. `spot-bug`: `/account` returns personal data with no `Cache-Control` and a 200 status, over a CDN with default settings and a `.html` rewrite to `.css`. What goes wrong? Answer: the default key ignores the cookie, so one user's page is served to everybody for the default 2-hour TTL. Distractor: nothing, because the cookie makes the key unique (S06-M13). Distractor: nothing, because 200 responses are never cached (S06-M11). Feedback: the key is scheme, host, path and query only.
4. `mcq`: the origin is down and the edge returns the old page. Which status? Answer: STALE. Distractor: UPDATING (S06-M14). Distractor: REVALIDATED (S06-M14). Feedback: UPDATING is a planned background refresh, not a failure.
5. `numeric`: 100 users request one cacheable asset through one edge, and the first is a MISS. How many requests reach the origin? Answer: 1. Distractor: 100 (S06-M15). Distractor: 0 (S06-M15: forgets the first fetch). Feedback: the first visitor pays, and the rest are free.
6. `order`: put these in the order the edge evaluates them for one request: freshness test, eligibility test, key lookup, storability test. Answer: eligibility, key lookup, freshness, storability. Feedback: the storability test runs on the origin's reply, so it comes last.

**Review cards.**
- Q: What is a CDN's default cache key? A: scheme plus host plus path plus query, and nothing else.
- Q: Which two common content types are not cached by default? A: HTML and JSON.
- Q: What is the default edge TTL when the origin says nothing? A: 2 hours for 200 and 301, 3 minutes for 404, and others not cached.
- Q: What does REVALIDATED mean? A: the TTL passed, the origin answered 304, and the cache reused its copy.
- Q: What does BYPASS mean? A: the object was eligible, but the origin said `no-store`, so nothing was stored.
- Q: Which status word means the origin was never consulted? A: HIT.
- Q: Which status word means the cache was never consulted? A: DYNAMIC.

**Lab.** `./setup.sh && bash demos/cache.sh`. Look at the `x-cache` line of each step. Expected: MISS then HIT on the asset, REVALIDATED after the 3.2-second wait, DYNAMIC on the HTML page, BYPASS on the private avatar, a stale body after the origin is killed, and a hard failure on the page that was never cached.

### s06-m04-caching-the-uncacheable

- **Title:** Four ways to cache a personal page. **Minutes:** 25.
- **Big idea:** Personalisation moved outward over thirty years, server to edge to browser, so the shared part can be cached and only the small personal part is recomputed.
- **Covers:** S06-C101, S06-C102, S06-C103, S06-C104, S06-C105, S06-C106, S06-C107, S06-C108, S06-C109, S06-C110, S06-C111, S06-C112, S06-C113, S06-C114, S06-C115, S06-C116, S06-C117, S06-C118, S06-C119, S06-C120, S06-C121, S06-C122, S06-C123, S06-C124, S06-C125, S06-C126.
- **Prereqs:** s03-m04-cgi, s05-m08-hpack-crime, s06-m03-caching-defaults.
- **Threads:** T-where-state-goes, T-fix-causes-next.

**Pretest.**
1. A news home page shows the reader's name in the corner. Why can a shared cache not store it? *Answer: every reader would get the first reader's name.*
2. A page is regenerated every minute and 98% of it does not change. What is the cheapest thing to send? *Answer: only the difference from the previous version.*
3. Which costs the origin more: rendering one page 100 times, or rendering one shell once plus 200 small fragments? *Answer: it depends on whether the origin is limited by rendering or by requests.*

**Rung 1, the picture.** A print shop makes a newsletter for 100 members of a club.
Every copy is identical except for one line that greets the member by name. The slow way
prints 100 whole newsletters. The fast way prints one stack of newsletters with a blank
box, then a volunteer at the club door writes each member's name in the box as they walk
in. The paper the member carries home is identical either way. The print shop did far
less work, and the volunteer at the door did a little more. *Where it breaks:* a
volunteer writes one word, while an edge has to fetch each personal fragment over the
network, so the number of small jobs goes up even as the total work goes down.

**Rung 2, how it works.**
1. Server-Side Includes, 1994, put holes in an HTML file and the web server fills them before sending. It predates CGI.
2. Edge-Side Includes, 2001, move the filling to the edge. The origin sends one cacheable shell with `<esi:include src="..."/>` holes.
3. The edge caches the shell under the normal key, then fetches each fragment and splices it in.
4. Ajax, about 2005, pushes the holes to the browser. The CDN caches the body and the browser fetches the personal parts after the page paints.
5. A delta to the origin gives up on caching the page at all. Both ends keep the previous version and the sender transmits only the changed bytes.
6. Cloudflare sold that as Railgun from 2013 to 2024. RFC 9842, September 2025, standardised the same idea between browser and server.
7. In RFC 9842 the client advertises the version it already holds with `Available-Dictionary: <sha-256>`, and the server replies with `Content-Encoding: dcb` or `dcz`.

**Rung 3, the real thing.** The lab origin sends the ESI shell with
`Cache-Control: public, max-age=0, s-maxage=300` and
`Surrogate-Control: content="ESI/1.0"` (`origin/origin.py` lines 157 and 158). The two
holes are `/fragment/user` and `/fragment/cart` (lines 59 and 60).
`bench/04_esi_bytes.py` runs 100 logged-in users twice, once against an edge with no ESI
and once against an edge with `--esi`, and asserts the two sets of pages are byte
identical before it counts anything. The numbers on page 19: origin requests 100 against
201, origin to edge bytes 3,984,200 against 83,454, bytes to users 3,992,400 against
3,994,793, and the cache went from DYNAMIC 100 times to one MISS and 99 HITs. Origin
bytes fell 97.906% and bytes to users rose 0.0599%. `bench/05_delta.py` generates 61
minutes of a 24 KB news page and compresses each version alone and against an older one:
gzip -6 gives 4,276 bytes, deflate with the one-minute-old page as the dictionary gives
598 bytes, zstd gives 436 bytes, and a one-hour-old dictionary gives 1,277 bytes.

**Rung 4, exam depth.**
- *Read the ESI trade carefully.* The slide states all three numbers, and two of them move the wrong way. Origin bytes fell 98%, bytes to the user did not move, and origin requests went up from 100 to 201. The win is on the origin's rendering and egress. The cost is request count at both the origin and the edge.
- *Where the 201 comes from.* 100 user fragments plus 100 cart fragments plus one shell fetch. The shell was a MISS once and a HIT 99 times, which is why only one shell fetch appears.
- *Why ESI does not shrink the download.* The user receives the same assembled bytes. Anything that claims ESI makes a page smaller has confused the origin leg with the user leg.
- *The dictionary has to be recent.* A one-minute-old dictionary gives 436 bytes and a one-hour-old dictionary gives 1,277 bytes, about three times worse. The content drifted away from the dictionary. Railgun kept the last version on both ends precisely to avoid that drift.
- *Why dictionary transport is locked down.* A shared dictionary leaks what the other side already holds, which is the same leak that made header compression unsafe in Session 5. RFC 9842 answers it with same-origin only, HTTPS only, and a hash to name the dictionary.
- *The rejected alternative.* You could cache the whole personal page per user. That multiplies the key space by the user count, destroys the hit rate, and stores private data in a shared cache. The arc of page 18 exists to avoid exactly that.
- *Exam prompts.* (1) Your origin's CPU is at 95% rendering a page that is 98% identical for every user, and your request rate is low. Would ESI help? *Model answer: yes. The shell renders once instead of per user, which is where the CPU goes, and the extra fragment requests are cheap at a low request rate.* (2) Same page, but the origin is already at its connection limit and the CPU is idle. Would ESI help? *Model answer: no. ESI doubles the request count, which is the resource you are short of. Fix the connection limit, or move personalisation to the browser with Ajax, which keeps the origin request count down.*

**Misconceptions.**
- S06-M16: "ESI makes the page smaller for the user." Wrong: bytes to users moved by 0.06%. It shrinks the origin leg, not the download. Distractor in check 1.
- S06-M17: "ESI reduces the number of origin requests." Wrong: the measured count rose from 100 to 201. Distractor in check 2.
- S06-M18: "SSI came after CGI." Wrong: NCSA HTTPd shipped SSI in 1994, before CGI. Distractor in check 3.
- S06-M19: "Delta compression works with any older version of the page." Wrong: a one-hour-old dictionary gave 1,277 bytes against 436 for a one-minute-old one. Distractor in check 4.
- S06-M20: "Railgun is still how Cloudflare talks to origins." Wrong: it was retired in January 2024, and RFC 9842 standardised the idea in September 2025. Distractor in check 5.

**Diagrams.** (1) Step-by-step: one shell with two holes, cached once, then two fragment fetches per user, with the byte counters on each leg ticking. (2) Static: the outward arc, four columns for server, edge, browser and bytes, with the year and the mechanism in each. (3) Static: a bar chart of 24 KB raw, 4,276 gzip, 598 deflate with dictionary, 436 zstd with dictionary, 1,277 with the hour-old dictionary.

**Interactives.** (1) *ESI accountant* (P1). Inputs: user count, shell size, fragment size, shell TTL. The learner sees origin requests, origin bytes and user bytes for both methods, and discovers that two of the three numbers move against them. (2) *Dictionary age slider* (P1). Inputs: dictionary age in minutes. The learner sees the compressed size climb, and discovers why freshness matters more than the algorithm.

**Predict, observe, explain.** Command: `python3 bench/04_esi_bytes.py`. Question to predict: with ESI on, do origin requests go up or down? Observe: up, from 100 to 201. Captured output: slide 19, and the assertion in the script that the two page sets are identical first.

- **Worked example.** 3,984,200 origin bytes become 83,454. The drop is 1 - 83454/3984200 = 0.97906, so 97.9%, which page 19 rounds to 98%.
- **Faded example.** Bytes to users go from 3,992,400 to 3,994,793. The change is ____ percent, which the slide rounds to ____. *(+0.0599%. +0.1%.)*
- **Your turn.** The page is 39,676 bytes and the shell is fetched once. 100 users each pull two fragments. If the shell is 39,676 bytes minus the two fragments, and the origin sent 83,454 bytes in total, what is the mean fragment size? *(83,454 minus the shell, divided by 200. With a shell near 39,000 bytes the fragments average about 220 bytes each, which is why 200 extra requests cost so few bytes and so many round trips.)*

**Checks.**
1. `numeric`: with ESI on, by what percentage did the bytes delivered to users change? Answer: 0.1 (a rise). Distractor: -98 (S06-M16). Distractor: -50 (S06-M16). Feedback: the user downloads the same assembled page.
2. `predict`: 100 users, one page, ESI on. How many requests reach the origin? Answer: 201. Distractor: 1, because the shell is cached (S06-M17). Distractor: 100, unchanged (S06-M17). Feedback: one shell fetch plus two fragments for each of 100 users.
3. `order`: put these four in the order they appeared: Ajax, ESI, Railgun, SSI. Answer: SSI 1994, ESI 2001, Ajax about 2005, Railgun 2013. Feedback: the order is also the arc outward, server then edge then browser.
4. `mcq`: delta compression of a 24 KB page against a one-hour-old copy gave 1,277 bytes, and against a one-minute-old copy 436 bytes. Why? Answer: the page drifted away from the older dictionary. Distractor: the older dictionary used a weaker algorithm (S06-M19). Distractor: the hour-old copy was larger (S06-M19). Feedback: both rows used zstd, and only the dictionary age changed.
5. `mcq`: what replaced Railgun? Answer: RFC 9842 Compression Dictionary Transport, September 2025. Distractor: nothing, Railgun is still shipping (S06-M20). Distractor: HTTP/2 header compression (S06-M20). Feedback: Cloudflare retired Railgun in January 2024.

**Review cards.**
- Q: What does ESI stand for, and who published it? A: Edge-Side Includes, from Akamai and Oracle, as a W3C Note in 2001.
- Q: What are the three ESI numbers from the lab? A: origin bytes down 98%, bytes to users up 0.1%, origin requests up from 100 to 201.
- Q: Which year did SSI ship, and in what? A: 1994, in NCSA HTTPd 1.0a1, before CGI.
- Q: What two headers mark an ESI shell in the lab? A: `Cache-Control: s-maxage=300` and `Surrogate-Control: content="ESI/1.0"`.
- Q: How small does a 24 KB page compress against a one-minute-old dictionary? A: 436 bytes with zstd, about 1.8% of raw.
- Q: Which header names the dictionary in RFC 9842? A: `Available-Dictionary`, carrying a SHA-256.
- Q: What is the one-sentence arc of page 18? A: move the personalisation outward so the shared part can be cached.

**Lab.** `python3 bench/05_delta.py`. Expected: gzip 4,276 bytes, deflate with a one-minute dictionary 598, and a visibly worse number for the hour-old dictionary. Install `zstandard` first to see the 436-byte row. Then `bash demos/esi.sh` and read the final line, which shows which paths the origin actually served for four page views.

### s06-m05-cache-bugs

- **Title:** The cache key against reality: poisoning and deception. **Minutes:** 20.
- **Big idea:** Both classic cache attacks have one root cause, a cache key that does not name everything the answer depends on.
- **Covers:** S06-C127, S06-C128, S06-C129, S06-C130, S06-C131, S06-C132, S06-C133, S06-C134, S06-C135, S06-C136.
- **Prereqs:** s06-m03-caching-defaults, s05-m05-rfcs-and-smuggling.
- **Threads:** T-name-in-message, T-where-state-goes.

**Pretest.**
1. The cache key for a page is the URL. The origin reflects a request header into the page body. What can an attacker do? *Answer: send that header once and have the hostile page served to everybody under the plain URL.*
2. Why does a victim loading `/account/settings/fake.css` endanger the victim? *Answer: the edge caches it because of the extension, and the body held the victim's private page.*
3. How many requests does a poisoning attack need? *Answer: one.*

**Rung 1, the picture.** A noticeboard in a block of flats holds one copy of each notice.
The caretaker files a notice under its title alone. A prankster hands in a notice titled
"Bin collection" with a false date written inside, and for the next hour every resident
who asks for "Bin collection" gets the prank. The second trick runs the other way. A
resident is persuaded to post their private bank letter with the title "Bin collection",
and the caretaker files it on the public board, where the prankster then reads it. In
both cases the caretaker filed by a name that did not describe the contents. *Where it
breaks:* a caretaker can look inside the envelope, and a cache deliberately does not,
because looking at every byte is what makes a cache slow.

**Rung 2, how it works.**
1. The cache key for `/page/landing` is the host and the target. No request header is in it.
2. The lab origin reads `X-Forwarded-Host` and writes it into the page as a script source.
3. The attacker sends one request with `X-Forwarded-Host: evil.example`.
4. The edge stores that response under the plain key, because the key never saw the header.
5. Every visitor for the next 60 seconds gets the attacker's script, with `x-cache: HIT`.
6. Deception runs in reverse. The attacker gets a victim to load a private path with a `.css` suffix appended.
7. The edge sees the extension, judges the object eligible, and stores the private body.
8. The attacker then requests the same URL and reads the victim's page out of the cache.

**Rung 3, the real thing.** `origin/origin.py` line 179 reads
`X-Forwarded-Host` and falls back to `Host`. Line 181 sets
`Cache-Control: public, s-maxage=60`, which is where the 60-second window comes from.
`edge/edge.py` builds the key in `cache_key()` with a comment that names this demo.
`demos/poison.sh` starts two edges on 8240 and 8241, the second with `--strip-unkeyed`,
sends the attack to both, and shows it persist on one and fail on the other. The two
published sources are J. Kettle, "Practical Web Cache Poisoning", 2018, and O. Gil, "Web
Cache Deception Attack", Black Hat USA 2017.

**Rung 4, exam depth.**
- *Why one request is enough.* The cost of the attack is the TTL, not the request count. A 60-second `s-maxage` means one request per minute keeps the poison fresh indefinitely.
- *The three closes, and which to default to.* Drop the unkeyed header at the trust boundary, add it to the key, or make the origin send `Vary` on it. Dropping is the defensible default, because it needs no origin cooperation and costs no cache entries. Adding to the key costs a cache entry per distinct value and lets an attacker flood the key space. `Vary` is correct and depends on the origin remembering, which a CDN cannot enforce.
- *Why deception is the dual of eligibility.* Module 3 called eligibility by extension "right for the bulk of bytes and wrong in both directions". Deception is the second direction, weaponised. The fixes are the two halves of that sentence: stop trusting the extension alone, and honour the content type and `no-store` that the origin sent.
- *The common root.* The key is the name of the answer. Poisoning works when something that changed the answer is not in the name. Deception works when something in the name claims a type the body does not have. Both are the key disagreeing with reality.
- *What if you cannot change the origin.* You still own the edge. Strip the whole class of hop headers at the boundary, and override eligibility so that only a known list of paths is cacheable. Both are edge-side, and both work against a legacy origin.
- *Exam prompts.* (1) A page reflects `X-Forwarded-Host` and the CDN caches it for 300 seconds. How many requests per hour does the attacker need to keep the poison live, and what single edge change ends it? *Model answer: twelve, one per 300-second window. Strip the header at the edge, so the origin never sees a value it can reflect.* (2) A support engineer proposes adding every request header to the cache key "to be safe". What breaks? *Model answer: the key space explodes, so the hit rate falls near zero and the CDN stops protecting the origin. It also hands an attacker a cheap way to fill the cache with junk entries.*

**Misconceptions.**
- S06-M21: "A poisoning attack needs many requests." Wrong: one request stores the hostile response, and the TTL does the rest. Distractor in check 1.
- S06-M22: "Caching only risks stale data, never a security problem." Wrong: a shared cache is shared state, and both named attacks turn it into an exploit. Distractor in check 2.
- S06-M23: "Adding every header to the cache key is the safe fix." Wrong: it destroys the hit rate and lets an attacker flood the key space. Distractor in check 3.
- S06-M24: "Cache deception needs the origin to be buggy." Wrong: the origin can be correct. The edge's trust in the file extension is what stores the private page. Distractor in check 4.
- S06-M25: "`Vary` on the reflected header is what a CDN should do by default." Wrong: `Vary` is the origin's job, and a CDN cannot make the origin send it. Dropping the header is the safe default. Distractor in check 5.

**Diagrams.** (1) Step-by-step, four frames: the attacker's one request, the stored response, a victim's plain request, the HIT. Actors: attacker, edge cache, origin, victim. (2) Step-by-step for deception, with the arrow directions reversed, so the two sit side by side. (3) Static: the key against the answer, with the pieces of the answer that the key does not name drawn outside the box.

**Interactives.** (1) *Poisoning sandbox* (P1). Inputs: the reflected header, the TTL, and one of the three fixes. The learner sees how long the poison lives and which fix ends it, and discovers that the TTL, not the request rate, sets the cost. (2) *Deception path builder* (P2). Inputs: a private path and a suffix. The learner sees the edge's eligibility decision and whether the private body is stored.

**Predict, observe, explain.** Command: `bash demos/poison.sh`. Question to predict: after the attacker's request, what does a plain `curl` for the same path return, and what does the `x-cache` header say? Observe: the attacker's script tag, with `x-cache: HIT`. Captured output: slide 21 and the script.

- **Worked example.** Key is `localhost:8240/page/landing`. Attacker sends `X-Forwarded-Host: evil.example`. The origin writes `<script src="https://evil.example/app.js">` into the body. The edge stores it under the key, because the header is not in the key. The next plain request matches the key and gets the script.
- **Faded example.** The second edge runs with `--strip-unkeyed`. The attacker sends the same header. The origin now sees ____ as the host, so the stored body contains ____. *(The real `Host` value, because the edge removed the forged header. The site's own script source, so nothing hostile is stored.)*
- **Your turn.** The origin instead reflects `X-Forwarded-Proto` into an absolute URL in the page, and the edge keys only on host and target. Write the one request that poisons it, and name the fix you would ship first. *(Send one request with a forged `X-Forwarded-Proto` value. Ship the edge-side strip first, because it works without touching the origin, then fix the origin to stop building absolute URLs from request headers.)*

**Checks.**
1. `numeric`: how many attacker requests does a cache-poisoning attack need to affect every later visitor within the TTL? Answer: 1. Distractor: 100 (S06-M21). Distractor: one per visitor (S06-M21). Feedback: the cache repeats the stored response for free.
2. `mcq`: what is the shared root cause of poisoning and deception? Answer: the cache key does not match what the answer really depends on. Distractor: the origin is too slow (S06-M22). Distractor: the TTL is too long (S06-M22). Feedback: both are the key disagreeing with reality.
3. `mcq`: which fix does the session recommend as a CDN default? Answer: drop the unkeyed header at the edge. Distractor: add every request header to the key (S06-M23). Distractor: wait for the origin to send `Vary` (S06-M25). Feedback: the default must work without origin cooperation and without inflating the key space.
4. `spot-bug`: the origin correctly marks `/account/settings` as `private, no-store`, and a victim loads `/account/settings/fake.css`. The edge caches it. Where is the bug? Answer: at the edge, which judged eligibility from the extension and ignored the origin's instruction. Distractor: at the origin, which should not serve the path at all (S06-M24). Distractor: nowhere, because `no-store` always wins (S06-M24). Feedback: the fix is to stop caching by extension alone and to honour the content type.
5. `mcq`: the origin sends `Vary: X-Forwarded-Host`. What does that do? Answer: it adds that header's value to the cache key, so a forged value gets its own entry. Distractor: it tells the edge to ignore the header (S06-M25). Distractor: it disables caching for the page (S06-M25). Feedback: `Vary: *` is the one that disables caching.

**Review cards.**
- Q: Who named web cache poisoning, and when? A: James Kettle, "Practical Web Cache Poisoning", 2018.
- Q: Who named web cache deception, and when? A: Omer Gil, Black Hat USA 2017.
- Q: What is an unkeyed header? A: a request header that changes the response and is not part of the cache key.
- Q: Name the three closes for poisoning. A: drop the header at the edge, add it to the cache key, or send `Vary` on it from the origin.
- Q: Name the two closes for deception. A: do not judge eligibility from the extension alone, and honour the origin's content type and `no-store`.
- Q: What is the one-sentence root cause of both attacks? A: the cache key disagrees with reality.

**Lab.** `bash demos/poison.sh`. Look at the body of the second plain request and at the `x-cache` header. Expected: the attacker's script on port 8240 with a HIT, and the site's own script on port 8241, which runs with `--strip-unkeyed`. Then re-run with `--cache-prefix` removed and explain why the attack stops working.

### s06-m06-faster-bytes

- **Title:** Three ways to move the same bytes faster. **Minutes:** 25.
- **Big idea:** A CDN owns the sender on both legs, so it can change the congestion control, reuse the origin connection, and make sure the same object is never fetched twice at once.
- **Covers:** S06-C137, S06-C138, S06-C139, S06-C140, S06-C141, S06-C142, S06-C143, S06-C144, S06-C145, S06-C146, S06-C147, S06-C148, S06-C149, S06-C150, S06-C151, S06-C152, S06-C153, S06-C154, S06-C155, S06-C156, S06-C157, S06-C158, S06-C159, S06-C160, S06-C161, S06-C162, S06-C163, S06-C164, S06-C165, S06-C166, S06-C167.
- **Prereqs:** s02-m05-congestion-bbr, s03-m05-fastcgi-servlets, s04-m08-cache, s04-m10-upstreams, s05-m09-http2-multiplexing.
- **Threads:** T-setup-off-path, T-round-trip-tax, T-law-or-habit.

**Pretest.**
1. CUBIC halves its window when a packet drops. On a long path with 1% background loss, what does that cost? *Answer: it keeps halving for a reason that is not congestion, so it never fills the pipe.*
2. nginx runs 32 worker processes, each with its own origin connection pool. Why is reuse poor? *Answer: each worker sees only a share of the traffic, so its connections go idle and the origin closes them.*
3. 300 edges miss the same object at the same moment. How many requests reach the origin? *Answer: 300, unless something collapses them.*

**Rung 1, the picture.** A delivery company moves parcels from one warehouse to many
shops. Three separate improvements make it faster, and none of them changes the parcels.
First, the drivers stop braking every time they see a pothole and instead learn the real
speed the road allows. Second, the vans stop returning to the depot after each drop and
keep running, so nobody waits for a van to be started. Third, when forty shops all phone
in for the same item at once, the dispatcher sends one van and copies the item at a
regional depot, instead of sending forty vans to the warehouse. *Where it breaks:* a van
carries a parcel once, while a cache can serve the same object to thousands of people
from one copy, which is a thing no delivery fleet can do.

**Rung 2, how it works.**
1. A loss-based controller such as CUBIC grows until a packet drops, then halves. The graph is the saw-tooth from Session 2.
2. On a long path, loss comes from distance and from random errors, not only from congestion, so the halving is a mistake.
3. BBR measures the bottleneck bandwidth and the minimum round-trip time, then paces the sender to that rate and ignores the loss.
4. Only the sender has to change, so a CDN can turn BBR on for your traffic with no change to your code, the client, or any router.
5. Separately, the edge keeps idle keep-alive connections to your origin. A request that finds a warm connection skips the TCP and TLS handshakes.
6. A pool owned by one worker can only be reused by that worker, so splitting the pool across many workers starves each one.
7. One shared pool across all threads keeps the connections busy enough to stay open.
8. Finally, when many requests want the same missing object, the edge serves one origin fetch and makes the rest wait. That is request collapsing inside one point of presence, and a tiered cache does it across points of presence.

**Rung 3, the real thing.** BBR is Cardwell, Cheng, Gunn, Yeganeh and Jacobson, ACM Queue
14(5), 2016. The deployment rows on page 22: Google B4 and YouTube in 2016 reported 2 to
25 times the CUBIC throughput and a 53% lower median RTT, CloudFront in 2019 reported up
to 22% more throughput to viewers and up to 100% more on some US mobile networks, Akamai
in November 2019 reported BBR on more than 80% of end-user connections, and a 2023 census
of the top 10,000 sites found BBR the most deployed controller with CUBIC near 7%.
`bench/03_pool.py` runs 300 visitors one every 40 ms, with the origin 50 ms away over TLS
1.3 and an origin idle close after one second. It reports no pool at 0% reuse and 160 ms,
32 worker pools at 45.3% and 112 ms, 8 worker pools at 82.7% and 74 ms, and one shared
pool at 98.7% and 57 ms. Cloudflare's Pingora post of September 2022 reports the same
shape three orders of magnitude bigger: one customer went from 87.1% to 99.92% reuse, a
160-fold drop in new origin connections, and 434 years of handshake time saved per day.
Collapsing lives in `edge/edge.py` lines 247 to 262, as one in-flight future per cache
key, which is `proxy_cache_lock` in Python. The harness measures 50 origin fetches
without it and 1 with it, for 50 users on a cold cache and one object.

**Rung 4, exam depth.**
- *The correction the slide makes.* The course source document said BBR "relooked at TCP retries, congestion and the famous saw-tooth". The saw-tooth is not BBR's. It is CUBIC's, from Session 2, and BBR is the answer to it. Getting that the right way round is the point.
- *Why only the sender changes.* Congestion control lives in the sender's stack and nothing on the wire announces it. That is why a CDN can switch it on for you, and it owns the sender on both legs: the long leg back to your origin and the leg out to the user.
- *Why the shared pool wins.* The origin closes an idle connection after a short timeout. A worker with a small share of the traffic cannot keep its connections busy enough to beat that timeout, so it re-handshakes. The fix is not more pooling, it is less partitioning. nginx partitions by worker, and Pingora does not.
- *The lab is a model here, and says so.* The worker-pool bench assigns each visitor a random simulated worker. A real nginx worker takes connections from the kernel accept queue, which is not random. The shape of the result holds, and the exact percentages are the model's.
- *Multiplexing against pooling, at the origin.* HTTP/2 multiplexing is the Session 5 answer, and most CDN to origin hops are still HTTP/1.1. `cloudflared` has `http2Origin` false until you set it. So pooling, not multiplexing, is what saves you on the origin leg today.
- *Collapsing against tiered cache.* Same move, two scales. Collapsing stops N simultaneous misses at one point of presence becoming N origin fetches. A tiered cache stops N points of presence each fetching once. Together they are why a CDN protects your origin during a spike instead of amplifying it.
- *Exam prompts.* (1) Your origin sees a spike of 300 identical requests the second a video goes live, and your CDN has 300 points of presence. Name the two features you turn on and what each one does. *Model answer: request collapsing, so each point of presence makes one fetch instead of many, and a tiered cache or shield, so the points of presence fetch from a regional parent and the origin sees one request.* (2) You move from nginx with 16 worker pools to one shared pool and reuse climbs from 80% to 99%. Explain the mechanism in one sentence, and name the number that improves for the user. *Model answer: a connection opened by one worker could not be reused by another, so each worker's connections went idle and were closed by the origin. The user's time to first byte falls, because fewer requests pay a TCP and TLS handshake.*

**Misconceptions.**
- S06-M26: "The TCP saw-tooth is BBR's behaviour." Wrong: the saw-tooth is the loss-based CUBIC pattern, and BBR exists to replace it. Distractor in check 1.
- S06-M27: "BBR needs a new protocol or a client update." Wrong: only the sender changes, which is why a CDN can enable it for you. Distractor in check 2.
- S06-M28: "More worker pools means more pooling, so better reuse." Wrong: partitioning the pool starves each part, and reuse fell from 98.7% to 45.3%. Distractor in check 3.
- S06-M29: "A CDN talks HTTP/2 to your origin by default." Wrong: most CDN-to-origin hops are HTTP/1.1, and `cloudflared` defaults `http2Origin` to false. Distractor in check 4.
- S06-M30: "Loss always means congestion." Wrong: on long paths loss also comes from distance and errors, and treating it as congestion is what caps a single flow. Distractor in check 5.

**Diagrams.** (1) Static: two throughput-against-time curves, the CUBIC saw-tooth and the BBR plateau, with the bottleneck rate drawn as a line. (2) Static: four pool layouts with their reuse percentages, from no pool to one shared pool. (3) Step-by-step: 50 users hitting one cold object, with and without collapsing, counting origin fetches.

**Interactives.** (1) *Pool partition simulator* (P1). Inputs: worker count, request rate, origin idle timeout. The learner sees the reuse ratio and the mean time to first byte, and discovers that reuse falls as workers rise. (2) *Collapse or stampede* (P1). Inputs: concurrent users, cache state, collapsing on or off. The learner sees the origin fetch count, and discovers the 50 against 1 result. (3) *CUBIC against BBR* (P2). Inputs: RTT and loss. The learner sees both curves and the achieved throughput.

**Predict, observe, explain.** Command: `python3 bench/03_pool.py`. Question to predict: 32 worker pools against 8 worker pools. Which gives better reuse? Observe: 8 pools give 82.7% against 45.3% for 32. Fewer partitions win. Captured output: slide 23.

- **Worked example.** 300 origin requests and 52 new connections. Reuse is 1 - 52/300 = 0.827, so 82.7%, the 8-worker row.
- **Faded example.** One shared pool made 4 new connections for 300 requests. Reuse is ____. *(98.7%, because 1 - 4/300 = 0.9867.)*
- **Your turn.** Cloudflare reported 87.1% reuse before Pingora and 99.92% after, for the same request volume. Show that the new connection count fell about 160 times. *(Before, new connections are 12.9% of requests. After, 0.08%. 12.9 / 0.08 = 161, so about 160 times fewer handshakes for the same traffic.)*

**Checks.**
1. `mcq`: whose behaviour is the TCP saw-tooth? Answer: a loss-based controller such as CUBIC. Distractor: BBR (S06-M26). Distractor: QUIC (S06-M26). Feedback: BBR paces to a measured rate instead of sawing.
2. `mcq`: what has to change to deploy BBR on the path from an edge to a user? Answer: the sender's congestion control only. Distractor: the client's TCP stack (S06-M27). Distractor: the routers along the path (S06-M27). Feedback: nothing on the wire announces the controller.
3. `predict`: an edge moves from 8 worker pools to 32. What happens to origin connection reuse? Answer: it falls, from 82.7% to 45.3%. Distractor: it rises, because there are more pools (S06-M28). Distractor: it stays the same (S06-M28). Feedback: each worker sees fewer requests, so its connections go idle and the origin closes them.
4. `mcq`: which protocol does a CDN usually speak to your origin? Answer: HTTP/1.1, unless you turn HTTP/2 on. Distractor: HTTP/2 by default (S06-M29). Distractor: HTTP/3 by default (S06-M29). Feedback: `cloudflared` has `http2Origin` false until you set it.
5. `numeric`: 50 users hit one uncached object at the same moment, with request collapsing on. How many origin fetches happen? Answer: 1. Distractor: 50 (S06-M30: treats every miss as its own fetch). Distractor: 0 (S06-M30). Feedback: 49 wait for the first fetch, then all hit.
6. `recall`: which saves the origin more during a global spike, collapsing at one point of presence or a tiered cache? Answer: both, at different scales. Collapsing stops many misses at one place, and a tiered cache stops many places fetching once each. Feedback: the two are the same move at two scales.

**Review cards.**
- Q: What does BBR measure? A: the bottleneck bandwidth and the minimum round-trip time, then it paces to that rate.
- Q: What did Google report for BBR in 2016? A: 2 to 25 times the CUBIC throughput, and a 53% lower median RTT globally.
- Q: What reuse did one shared pool give in the lab? A: 98.7% over 300 requests, against 0% with no pool.
- Q: What did Pingora's shared pool do for one Cloudflare customer? A: reuse from 87.1% to 99.92%, 160 times fewer new origin connections, 434 years of handshake time saved per day.
- Q: Why can a per-worker pool not be shared? A: a connection belongs to the worker that opened it, so other workers cannot reuse it.
- Q: What is request collapsing? A: one origin fetch per cache key while others wait, which is nginx's `proxy_cache_lock`.
- Q: What is a tiered cache for? A: so many points of presence share one origin fetch instead of each making their own.

**Lab.** `python3 bench/03_pool.py`. Expected: 0%, 45.3%, 82.7% and 98.7% reuse, with mean time to first byte falling from 160 ms to 57 ms. Then run the harness with `--collapse` and without, for 50 users on a cold cache, and compare the origin fetch count at `/__edge/stats`.

### s06-m07-not-speed

- **Title:** The edge became the perimeter. **Minutes:** 25.
- **Big idea:** All your traffic already converges at the edge, so the firewall, the rate limiter, the flood absorber and the authentication point all moved there, and each one has a sharp limit you must know.
- **Covers:** S06-C14, S06-C168, S06-C169, S06-C170, S06-C171, S06-C172, S06-C173, S06-C174, S06-C175, S06-C176, S06-C177, S06-C178, S06-C179, S06-C180, S06-C181, S06-C182, S06-C183, S06-C184, S06-C185, S06-C186, S06-C187, S06-C188, S06-C189, S06-C190, S06-C191, S06-C192, S06-C193, S06-C194, S06-C195, S06-C196, S06-C197, S06-C198, S06-C199, S06-C200, S06-C201, S06-C202, S06-C203, S06-C204, S06-C205, S06-C206, S06-C207, S06-C208, S06-C209, S06-C210, S06-C211, S06-C212, S06-C213, S06-C214, S06-C215, S06-C216.
- **Prereqs:** s06-m02-what-a-cdn-is, s04-m09-routing, s05-m05-rfcs-and-smuggling, s02-m11-reliability-address.
- **Threads:** T-name-in-message, T-deployed-reality, T-law-or-habit.

**Pretest.**
1. A WAF blocks `' OR 1=1 --`. Is the SQL injection fixed? *Answer: no. The origin still builds SQL by string formatting.*
2. A limit says 100 requests per 10 seconds. How many can arrive in one second? *Answer: up to 200, if the window is a fixed one.*
3. The edge verifies every token before the origin sees a request. Name the one way an attacker still reads all the data. *Answer: contact the origin directly and skip the edge.*

**Rung 1, the picture.** A festival puts one gate in front of the field. Because everyone
walks through that gate, the gate becomes the place for everything: a bag search, a
counter that limits how many enter per minute, a wall of stewards that can absorb a crowd
surge, and a ticket check. None of that was why the gate was built. The gate was built so
people could get in quickly. The bag search works from a list of things it recognises, so
a thing it has not seen goes through. The counter is only as good as how it counts. And
all of it is worthless if there is a hole in the fence round the back. *Where it breaks:*
a festival gate sees each person once, while an edge sees the same visitor thousands of
times and must decide in under a millisecond each time.

**Rung 2, how it works.**
1. All your traffic already arrives at the edge, so the edge is where a perimeter can exist at all.
2. A WAF reads the request text, normalises it by some amount, and matches it against a list of patterns.
3. How much it normalises against how many ways the attack can be spelled is the whole game, and you never win it outright.
4. A rate limiter counts requests per client. The counting method decides what "100 per 10 seconds" means.
5. A fixed window resets at a clock boundary, so a client can spend a full budget on each side of the boundary.
6. A sliding log is exact and stores up to one timestamp per allowed request. A sliding estimate stores two counters and weights the previous window by its overlap.
7. A bucket allows a burst by design, and with no burst it refuses a normal browser.
8. A volumetric flood is answered with capacity and geography, so anycast splits the flood across hundreds of cities.
9. An API gateway at the edge verifies the token, overwrites the identity header, strips leaking headers and routes to the origin. It is only real if the origin refuses everybody else.

**Rung 3, the real thing.** `edge/waf.py` holds five rules and three normalisation
levels. `demos/waf.sh` shows the ladder: `' OR 1=1 --` is blocked by `sqli-tautology`,
`'/**/OR/**/1=1--` leaks 5 rows at the decode level because comments replace the spaces,
the same payload is blocked at the full level because comments are stripped first, and
`' --` leaks 5 rows at every level because it matches nothing. The demo ends with
`--safe` on, which switches `origin/origin.py` line 207 from an f-string to the
parameterised query on line 204, and then every bypass returns no results.
`bench/07_ratelimit.py` replays "100 per 10 s" in simulated time: fixed window 200,
sliding log 100, sliding estimate 104, token bucket 109, leaky bucket with burst 0 just
10 while refusing 97% of normal page loads. Reproduced on this machine on 2026-10-10.
The leaky bucket follows the nginx excess formula from `ngx_http_limit_req_module.c`.
`demos/gateway.sh` runs six cases against `edge/jwtlite.py` and ends by turning on mutual
TLS, after which the direct request to the origin gets a connection reset.

**Rung 4, exam depth.**
- *What a WAF is for, given the bypasses.* It handles volume, not a targeted attacker. It blocks Log4Shell probes and the OWASP top patterns, which is most of the Internet's background noise. The fix for the bug is parameter binding in the origin. Both are true at once, and the slide says both.
- *The two rate-limit failure modes.* A fixed window lets twice the limit through in one instant. A leaky bucket with no burst refuses a real browser that opens 30 requests at once. That is why nginx's `limit_req` has a burst parameter, and why Cloudflare's free plan, which offers only a 10-second fixed window, is itself the lesson.
- *Why the estimate is the deployed answer.* Two counters per client, and across 400 million requests it wrongly allowed or blocked 0.003%. Exact counting costs up to 100 timestamps per client and buys almost nothing. Cheap and close enough beats exact at this scale.
- *Geography beats the algorithm.* Counts are per data centre, so a botnet spread across 330 cities gets 330 budgets. No choice of algorithm fixes that. You need a global counter, which costs a round trip, or you accept the looser bound.
- *Why only a CDN absorbs a flood.* The December 2025 record was 31.4 Tbps from the Aisuru botnet, 1 to 4 million devices, for 35 seconds, mitigated automatically. Cloudflare's capacity is about 500 Tbps across more than 330 cities. Your origin has one pipe.
- *The flip side.* One network absorbing everybody's attacks is also one network being everybody's single point of failure. Fastly, 8 June 2021: one configuration change took 85% of the network to errors, and 49 minutes to recover.
- *The gateway's one rule.* Authentication at the edge is a filter on one path, not a property of the origin. The fix is mutual TLS, which Cloudflare calls Authenticated Origin Pulls, or a Tunnel with no inbound port at all.
- *Exam prompts.* (1) Your WAF blocks three SQLi payloads in testing and the application is still breached. Explain to a manager what the WAF did and did not buy. *Model answer: it blocked the spellings on its list, which stops scanners and buys time. It cannot enumerate every spelling, so a targeted attacker writes a fourth. The defect is in the origin's query building, and binding the parameters removes it regardless of the WAF.* (2) You need "100 requests per 10 seconds" and you must survive a boundary attack and a browser that opens 30 requests at once. Which algorithm, and why not the other four? *Model answer: a sliding-window estimate, or a token bucket with a burst near 30. A fixed window fails the boundary attack at 200. A sliding log is correct but stores 100 timestamps per client. A leaky bucket with burst 0 refuses the browser. The estimate costs two counters and errs by 4%.*

**Misconceptions.**
- S06-M31: "A WAF fixes the vulnerability." Wrong: it filters spellings at the edge, and the defect stays in the origin until the query binds its parameters. Distractor in check 1.
- S06-M32: "100 per 10 seconds means never more than 100 in any 10 seconds." Wrong: with a fixed window, 200 can arrive in one second across the boundary. Distractor in check 2.
- S06-M33: "The strictest rate limiter is the best one." Wrong: a leaky bucket with burst 0 refused 97% of a normal page load. Distractor in check 3.
- S06-M34: "A rate limit is a global count." Wrong: counts are per data centre, so a spread-out botnet gets one budget per city. Distractor in check 4.
- S06-M35: "Authentication at the edge protects the origin." Wrong: an attacker who reaches the origin IP directly gets everything, until mutual TLS or a Tunnel closes that path. Distractor in check 5.

**Diagrams.** (1) Step-by-step: the five stages inside the lab edge in order, rate limit, WAF, gateway, cache, origin pool, with a request dropping out at each one. (2) Static: the WAF ladder, four payloads against three normalisation levels, with blocked or leaked in each cell. (3) Static: a timeline of the boundary attack, with the fixed-window and sliding-estimate counts drawn above it.

**Interactives.** (1) *WAF bypass ladder* (P1). Inputs: a payload and a normalisation level. The learner sees which rule fires or why none does, and discovers that normalisation and spelling are an arms race. (2) *Rate limiter race* (P1). Inputs: limit, window, traffic pattern, algorithm. The learner sees the allowed count per second and the refusals on a normal page load, and discovers that one phrase has five meanings. (3) *Gateway bypass* (P2). Inputs: token state and whether the origin is reachable directly. The learner discovers that the last case defeats every other control.

**Predict, observe, explain.** Command: `python3 bench/07_ratelimit.py`. Question to predict: with a limit of 100 per 10 seconds, how many requests can a fixed window allow in a single second? Observe: 200. Captured output: slide 27 and the run of 2026-10-10 in section 1.

- **Worked example.** Fixed window, limit 100, window 10 s. The client sends 100 requests from t=9.5 to t=10.0. All pass, because the window beginning at t=0 has room. At t=10.0 the window index changes, the counter resets, and the next 100 from t=10.0 to t=10.5 also pass. Total in one second: 200.
- **Faded example.** Sliding log, same traffic. At t=10.2 the log holds every accepted timestamp newer than t=0.2, which is ____ entries, so the request is ____. *(100, so it is refused. The log never lets more than 100 live in any 10-second span.)*
- **Your turn.** A leaky bucket has rate 10 per second and burst 0. A browser opens 30 requests in 30 ms. How many pass, and what parameter would you change? *(One passes, and the rest are refused, because the excess exceeds a burst of zero immediately. Raise the burst to at least 30, which is what nginx's `burst` parameter is for.)*

**Checks.**
1. `mcq`: `demos/waf.sh` ends with `--safe` and every bypass returns no results. What changed? Answer: the origin binds its query parameters. Distractor: the WAF added more rules (S06-M31). Distractor: the edge turned on full normalisation (S06-M31). Feedback: full normalisation still missed `' --`.
2. `numeric`: limit 100 per 10 s, fixed window, boundary attack. How many requests pass between t=9.5 and t=10.5? Answer: 200. Distractor: 100 (S06-M32). Distractor: 104 (S06-M32: that is the sliding estimate). Feedback: the counter resets at the window boundary.
3. `mcq`: why not deploy a leaky bucket with burst 0? Answer: it refuses 97% of a normal page load. Distractor: it allows too many requests (S06-M33). Distractor: it needs 100 timestamps per client (S06-M33). Feedback: a real browser opens many requests at once.
4. `mcq`: a botnet spread across 330 cities hits a 100-per-10-second limit. What does it get? Answer: about 330 separate budgets, because counts are per data centre. Distractor: one shared budget (S06-M34). Distractor: nothing, because anycast concentrates it (S06-M34). Feedback: the algorithm and the geography both matter.
5. `spot-bug`: the edge verifies a JWT, sets `X-User`, and the origin trusts `X-User`. The origin is on a public IP. What is the bug? Answer: the attacker contacts the origin directly and sets `X-User` freely. Distractor: nothing, because the edge overwrites the header (S06-M35). Distractor: the JWT algorithm is weak (S06-M35). Feedback: the fix is mutual TLS or a Tunnel, so the origin answers only the edge.
6. `recall`: what was the largest recorded DDoS, and how long did it last? Answer: 31.4 Tbps, 35 seconds, Cloudflare December 2025, mitigated automatically. Distractor: 500 Tbps (S06-M34: that is the network capacity). Distractor: 2.3 Tbps (S06-M34). Feedback: 500 Tbps is the pool the flood landed in.

**Review cards.**
- Q: What is a WAF, in one sentence? A: a denylist of spellings applied to request text, after some amount of decoding.
- Q: Which payload bypassed every normalisation level in the lab? A: `' --`, because it has no OR, no UNION and no digits to match.
- Q: What does a fixed window let through at its boundary? A: twice the limit, 200 for a limit of 100.
- Q: What does Cloudflare's sliding-window estimate cost and how wrong is it? A: two counters per client, and 0.003% wrong across 400 million requests.
- Q: Why does nginx's `limit_req` have a burst parameter? A: because a real browser opens many requests at once, and burst 0 refuses it.
- Q: Are CDN rate-limit counts global? A: no. They are per data centre.
- Q: What makes an edge API gateway real? A: the origin refuses every client except the edge, through mutual TLS or a Tunnel.
- Q: What did the Fastly outage of June 2021 cost? A: 85% of the network to errors, and 49 minutes to recover.

**Lab.** `bash demos/waf.sh`, then `python3 bench/07_ratelimit.py`, then `bash demos/gateway.sh`. Expected: the four-row WAF ladder with two leaks, the six-row rate-limit table with 200 in the fixed-window row, and six gateway cases ending with a connection reset on the direct request once mutual TLS is on.

### s06-m08-cloudflare-hands-on

- **Title:** Put your laptop behind the edge, then run code there. **Minutes:** 20.
- **Big idea:** Every idea in this session is runnable today, and a Worker is the next answer to Session 3's question about what a web server has to be.
- **Covers:** S06-C02, S06-C217, S06-C218, S06-C219, S06-C220, S06-C221, S06-C222, S06-C223, S06-C224, S06-C225, S06-C226, S06-C227, S06-C228, S06-C229, S06-C230, S06-C231, S06-C232, S06-C233, S06-C234, S06-C235, S06-C236, S06-C237, S06-C238, S06-C239, S06-C240, S06-C241, S06-C242, S06-C243, S06-C244, S06-C245.
- **Prereqs:** s03-m04-cgi, s03-m05-fastcgi-servlets, s06-m02-what-a-cdn-is, s06-m03-caching-defaults, s06-m07-not-speed.
- **Threads:** T-setup-off-path, T-framing.

**Pretest.**
1. You have no Cloudflare account and no domain. Can you put a local server behind the edge? *Answer: yes, with a quick tunnel.*
2. CGI forked a process per request and FastCGI kept them warm. What is the next step down in cost? *Answer: an isolate inside a runtime that is already running.*
3. An ESI tag looks like `<esi:include src="..."/>`. Why does an HTML parser mishandle it? *Answer: HTML has no self-closing custom elements, so it reads an open tag.*

**Rung 1, the picture.** A market stall can rent a till from the market company. The
basic rental is a working till. If you want the till to do something unusual, the company
also rents you a small shelf behind the counter where your own helper stands. The helper
is already in the building when you arrive, so there is no setting up, and she can only
do small jobs quickly. *Where it breaks:* a helper can take a break, and an edge isolate
has a hard budget of about 10 milliseconds of processor time per request on the free
plan.

**Rung 2, how it works.**
1. Six demos need nothing but `curl`, `dig` and a laptop. They read the colo, the anycast resolver, the headers a CDN adds, and a handshake timed to two continents.
2. `cloudflared tunnel --url http://localhost:8000` prints a random `trycloudflare.com` address and connects your laptop to the nearest point of presence, with no account and no DNS record.
3. The echo server prints what arrives: `CF-Connecting-IP`, the `CF-Ray` with the visitor's colo, and `CDN-Loop`. It also shows how few connections the tunnel uses for a whole room.
4. The account demos add a zone: the orange cloud that hides the origin IP, a Cache Rule that makes HTML cacheable, a WAF rule, a rate limit, and a Transform Rule that strips a header.
5. A Worker runs your own code at the edge. It is a V8 isolate, not a process, so it starts in about 5 ms and costs about 3 MB.
6. The gateway Worker rate-limits by IP, verifies a token with WebCrypto, sets the identity header, and fetches the primary origin with a backup fallback.

**Rung 3, the real thing.** `cloudflare/no-account.sh` holds all six no-account demos as
runnable lines. `cloudflare/INSTRUCTOR.md` holds the dashboard walk-through with the exact
expressions to paste, plus the free-plan limits: 5 WAF custom rules with no regular
expressions, 10 Cache Rules, 1 rate-limiting rule with a 10-second period only, and
100,000 Worker requests per day at 10 ms of processor time each. Both Workers were run
locally in workerd, Cloudflare's real runtime, through Miniflare, with
`node test_workers.mjs`. The gateway Worker reproduced every line of `demos/gateway.sh`,
including the `alg: none` refusal and the failover to the backup origin. The ESI Worker's
output was compared byte for byte against the origin's own assembly. The quick tunnel has
hard limits: 200 in-flight requests, no server-sent events, testing only.

**Rung 4, exam depth.**
- *Why the free-plan limits are the lesson.* One WAF rule with no regular expressions is exactly why the `demos/waf.sh` bypasses matter. A 10-second-only rate window is exactly the fixed-window weakness of module 7. HTML not cached until you add a Cache Rule is exactly the default of module 3. The constraints teach the concepts.
- *The orange cloud hides nothing by itself.* Old DNS history, MX records and certificate-transparency logs all leak the origin address. The real closes are a firewall that allows only the CDN's published ranges, Authenticated Origin Pulls, or a Tunnel with no inbound port at all.
- *A Worker as the fourth answer.* CGI forked a process per request. FastCGI kept processes warm. nginx ran one event loop. A Worker runs an isolate in a runtime that is already resident in every point of presence. Each step amortises more of the setup, which is the Session 3 closing idea, now at the edge.
- *The framing bug in the ESI Worker.* HTMLRewriter ate the page header, because HTML has no self-closing custom elements, so a parser reads `<esi:include .../>` as an open tag whose content runs to the closing header tag. ESI is XML-ish markup inside HTML, and the two grammars disagree about where an element ends. That is Session 2's framing question, in 2026. The Worker uses a regular expression, and the test checks the output byte for byte.
- *Exam prompts.* (1) Why does the ESI framing bug count as a framing problem and not a parser bug? *Model answer: both parsers are correct for their own grammar. The bug is that the document never said which grammar decides where the element ends, which is the same ambiguity as a message with no length and no delimiter.* (2) Name one thing a quick tunnel proves about pooling. *Model answer: the echo server shows a whole room of visitors arriving over a handful of TCP connections from the tunnel, so the edge multiplexes the room onto a small warm pool, exactly as the origin pool bench predicts.*

**Misconceptions.**
- S06-M36: "You need an account and a domain to try a CDN." Wrong: a quick tunnel needs neither. Distractor in check 1.
- S06-M37: "A Worker is a small container." Wrong: it is a V8 isolate inside a resident runtime, about 3 MB against about 35 MB. Distractor in check 2.
- S06-M38: "The orange cloud hides your origin." Wrong: DNS history, MX records and certificate logs leak it, so the origin must also refuse non-CDN traffic. Distractor in check 3.
- S06-M39: "An HTML parser is the right tool for ESI tags." Wrong: HTML has no self-closing custom elements, so it swallows the following content. Distractor in check 4.
- S06-M40: "A colo code in `cf-ray` names the customer's region." Wrong: it names the CDN building that served the response. Distractor in check 5.

**Diagrams.** (1) Step-by-step: the quick tunnel. Laptop, `cloudflared`, the nearest point of presence, then many visitors arriving over a few connections. (2) Static: four generations of request handling, CGI process, FastCGI worker, nginx event loop, Worker isolate, with start cost and memory for each.

**Interactives.** (1) *Trace decoder* (P1). The learner pastes a `cdn-cgi/trace` body and the page explains each field, including the IATA code and the post-quantum key exchange name. (2) *Isolate against container* (P2). Inputs: request rate and cold-start share. The learner sees the cost of booting per request against a resident runtime.

**Predict, observe, explain.** Command: `cloudflared tunnel --url http://localhost:8000` with `tools/echo_server.py` behind it, and 30 classmates opening the URL. Question to predict: how many TCP connections will the echo server see? Observe: a handful, not 30. Captured output: slide 30, which names the tunnel demo as the one to do together.

- **Worked example.** A Worker that verifies a token: `env.LIMITER.limit({key: ip})` for the rate limit, `verifyJwt(token, env.JWT_SECRET)` with WebCrypto, then `headers.set('X-User', claims.sub)` and a `fetch` to the origin. The same four steps as `demos/gateway.sh`, in a different language.
- **Faded example.** Free plan, 100,000 Worker requests per day. A site serving 3 requests per second all day uses ____ requests and ____ fit inside the plan. *(259,200, and no, it does not fit. The free plan covers about 1.15 requests per second sustained.)*
- **Your turn.** You want to cache HTML on a free zone, block one SQLi pattern, and rate-limit one API path. Which free-plan limit do you hit first, and what do you give up? *(The rate-limiting limit: one rule, counting by IP, with a 10-second period only. You give up any other window, so you accept the fixed-window boundary weakness from module 7.)*

**Checks.**
1. `mcq`: you have no account and no domain. How do you put a local server behind Cloudflare? Answer: `cloudflared tunnel --url http://localhost:8000`, which prints a random address. Distractor: you cannot without a zone (S06-M36). Distractor: point an A record at the edge (S06-M36). Feedback: a quick tunnel needs no DNS record.
2. `mcq`: what is a Worker? Answer: a V8 isolate in a runtime already resident in every point of presence. Distractor: a small container, booted per request (S06-M37). Distractor: a FastCGI process kept warm (S06-M37). Feedback: about 5 ms to start and about 3 MB.
3. `spot-bug`: a site turns on the orange cloud and leaves the origin on a public IP with no filtering. What is still wrong? Answer: the origin address leaks from DNS history and certificate logs, and it still answers everybody. Distractor: nothing, the proxy hides it (S06-M38). Distractor: the TLS certificate becomes invalid (S06-M38). Feedback: close the origin with an IP allowlist, mutual TLS or a Tunnel.
4. `mcq`: why did HTMLRewriter break the ESI Worker? Answer: HTML has no self-closing custom elements, so the parser treated the include as an open tag and swallowed the header. Distractor: the regular expression was wrong (S06-M39). Distractor: the fragment was too large (S06-M39). Feedback: two grammars disagreed about where the element ends.
5. `recall`: what does the suffix of `cf-ray` name? Answer: the colo that served the response. Distractor: the customer's account region (S06-M40). Distractor: the origin's region (S06-M40). Feedback: it is the CDN's building, as an airport code.

**Review cards.**
- Q: Which command puts a laptop behind Cloudflare with no account? A: `cloudflared tunnel --url http://localhost:8000`.
- Q: What are the quick-tunnel limits? A: 200 in-flight requests, no server-sent events, testing only.
- Q: How fast and how large is a Worker isolate? A: about 5 ms to start and about 3 MB, against about 35 MB and a cold start for a container.
- Q: Which four generations answer "is not everything a web server?" A: CGI process, FastCGI warm process, nginx event loop, Worker isolate.
- Q: What are the free-plan WAF and rate limits? A: 5 custom rules with no regular expressions, and 1 rate-limiting rule with a 10-second period only.
- Q: Why does the ESI Worker use a regular expression? A: an HTML parser treats the ESI include as an open tag and eats the following content.

**Lab.** `bash cloudflare/no-account.sh`. Expected: a colo code, a CHAOS TXT city, the CDN headers, and two handshake times that differ by about 150 ms between the Mumbai and Virginia endpoints. Then `cd cloudflare && npm i miniflare@4 && node test_workers.mjs`. Expected: both Workers pass, including the `alg: none` refusal and the byte-for-byte ESI comparison.

### s06-m09-the-bill

- **Title:** The rent on somebody else's computers. **Minutes:** 15.
- **Big idea:** A CDN is enormous leverage rented cheaply, and the rent is trust, concentration and dependence.
- **Covers:** S06-C01, S06-C06, S06-C246, S06-C247, S06-C248, S06-C249, S06-C250, S06-C251, S06-C252, S06-C253, S06-C254, S06-C255, S06-C256, S06-C257, S06-C258, S06-C259, S06-C260, S06-C261, S06-C262, S06-C263, S06-C264, S06-C265, S06-C266, S06-C267, S06-C268.
- **Prereqs:** s06-m01-physics-budget, s06-m04-caching-the-uncacheable, s06-m06-faster-bytes, s06-m07-not-speed, s06-m08-cloudflare-hands-on.
- **Threads:** T-law-or-habit, T-honest-benchmarks, T-where-state-goes.

**Pretest.**
1. The edge serves your site over HTTPS. Who holds a usable private key for your domain? *Answer: the CDN.*
2. One vendor absorbs attacks for a large share of the web. Name the matching risk. *Answer: one bug in that vendor breaks that same share.*
3. You want to leave your CDN after two years. Name the thing that makes it hard. *Answer: the WAF, rate limits, authentication and edge code that now live there.*

**Rung 1, the picture.** A small shop rents space inside a huge department store. The
footfall is enormous and the rent is low. The store handles security, deliveries and the
crowd at the door. In return the store sees every sale you make, decides which goods it
allows, and if the store closes for an afternoon your shop closes with it. After two
years your tills, your staff rota and your security cameras all belong to the store's
system, so moving out is not a van hire, it is a rebuild. *Where it breaks:* a department
store cannot read your customers' letters, and an edge that terminates TLS can read every
byte that crosses it.

**Rung 2, how it works.**
1. The edge terminates HTTPS, so it holds your keys or its own certificate for your domain. It can read every byte. That is the deal.
2. One network carrying a large share of the web is also a single point of failure for that share.
3. Whoever runs the edge decides what flows. Domain fronting hid censored traffic behind innocent domains until AWS and Google banned it in 2018, Azure in 2022 and Fastly in February 2024.
4. Once the WAF, the rate limits, the authentication and your code live at the edge, it is no longer a cache you can swap. It is your security perimeter.
5. The four closing ideas of the class: move the work or move the data, the edge is wherever all the traffic converges, it is all Sessions 2 to 5 rented by the city, and concentration cuts both ways.

**Rung 3, the real thing.** The Fastly post-incident report of June 2021 records one
customer's configuration change, 85% of the network returning errors, and 49 minutes to
recover. `cdn-lab` is the evidence for the rest of the class: `./setup.sh` builds a
private certificate authority and three certificates with `openssl` alone, and
`./run_all.sh` runs seven benches and six demos in about 80 seconds with no network.
`edge/edge.py` is the lecture as code, 486 lines, with the stages in a fixed order: rate
limit, WAF, gateway, cache, origin pool, ESI assembly. The lab names four things it does
not model: loss and bandwidth, HTTP/2 to the origin, anycast and BGP, and a real kernel
accept queue. `tools/laggy.py` delays each chunk by half the RTT each way and never drops
a packet, so every latency number in this session is a physics floor and nothing more.
`demos/failover.sh` is the week 7 preview: a primary origin dies and the `X-Origin`
header shows the backup answering.

**Rung 4, exam depth.**
- *Why the key handover is unavoidable.* Anything that inspects or caches HTTP has to see plaintext. A WAF, a cache and a rate limiter on a path all require it. The alternatives shrink the trust rather than remove it: keyless TLS keeps the private key on your own hardware and still lets the edge read the session, and end-to-end encryption inside the payload hides the body from the edge and also from the cache.
- *Concentration, stated as one sentence.* The same pooling that absorbs 31 Tbps is the single point of failure that takes 85% of a network down. You cannot have one without the other, because both come from putting everybody behind one network.
- *Lock-in by architecture, not by contract.* A cache is swappable. A perimeter is not, because the rules, the rate limits, the tokens and the edge code are written in the vendor's language. The honest mitigation is to keep the security rules expressible somewhere else, and to know which ones are not.
- *Why the lab's honesty matters for the exam.* Every latency number in this session came from a delay-only proxy. It is a floor, not a prediction. Any answer that quotes 34 ms as "what a CDN gives you" without the conditions is wrong, and the homework that asks for `tc netem` exists because the lab refused to fake that one number.
- *The question week 7 opens with.* Today's edge survives your origin dying, with a stale hit. Nothing in this session protects the user when the edge, or a whole region, is the thing that dies.
- *Exam prompts.* (1) Your security team objects to a CDN because "they can read our traffic". Give the honest answer and one mitigation. *Model answer: they are right, because TLS terminates at the edge and every feature you want needs plaintext. Keyless TLS keeps the private key on your hardware, and payload-level encryption hides the body from the edge at the cost of caching and inspection. Neither removes the trust.* (2) Name the one sentence that holds both the value and the risk of a CDN, and give one number on each side. *Model answer: concentration cuts both ways. 31.4 Tbps absorbed automatically on one side, and 85% of a network to errors for 49 minutes on the other.*

**Misconceptions.**
- S06-M41: "HTTPS means the CDN cannot read your traffic." Wrong: the edge terminates TLS, so it holds the keys and sees plaintext. Distractor in check 1.
- S06-M42: "A CDN only adds resilience." Wrong: it also concentrates risk, and one vendor's configuration bug took 85% of its network to errors. Distractor in check 2.
- S06-M43: "You can swap CDNs like swapping a cache." Wrong: once the perimeter lives there, moving is a rebuild. Distractor in check 3.
- S06-M44: "The lab's latency numbers predict real-world performance." Wrong: `laggy.py` delays and never drops, so every number is a floor. Distractor in check 4.

**Diagrams.** (1) Static: the four-line bill, with the matching benefit beside each cost. (2) Static: the four closing ideas as a two-by-two, each with the session it borrows from. (3) Step-by-step: the request walking the six stages of `edge/edge.py`, as the map of the whole class.

**Interactives.** (1) *The bill* (P1). The learner picks edge features to enable and the page shows which trust each one requires and how hard it is to move away. The learner discovers that the cheapest features to enable are the hardest to leave. (2) *What the lab does not model* (P2). Inputs: a measured row from the session. The page shows which of the four unmodelled factors would change it.

**Predict, observe, explain.** Command: `bash demos/failover.sh`. Question to predict: after the primary origin is killed, what does the `X-Origin` header say, and does the client see an error? Observe: it says `backup`, and the client sees a normal response. Captured output: slide 38, which names this demo as a week 7 preview.

- **Worked example.** Fastly, June 2021: one customer configuration change, 85% of the network to errors, 49 minutes to recover. Named services down at once: Reddit, Spotify, gov.uk. The cause was not an attack and not capacity.
- **Faded example.** Cloudflare absorbed 31.4 Tbps automatically against a network capacity of about 500 Tbps. The flood used ____ percent of the capacity, which is why no human was needed. *(About 6%.)*
- **Your turn.** Name, for your own project, one edge feature you would adopt first and one you would deliberately keep in your own code. Justify each with a sentence about leaving. *(A model answer names caching first, because it is the cheapest to replicate elsewhere, and keeps authentication in the application, because a token check written in a vendor's runtime is the hardest piece to move.)*

**Checks.**
1. `mcq`: your site is HTTPS end to end through a CDN. Who can read the plaintext? Answer: the CDN, because TLS terminates at the edge. Distractor: nobody but you and the user (S06-M41). Distractor: only the origin (S06-M41). Feedback: every edge feature you want needs plaintext.
2. `numeric`: what share of Fastly's network returned errors in June 2021? Answer: 85. Distractor: 100 (S06-M42). Distractor: 8.5 (S06-M42). Feedback: one customer's configuration change caused it, and recovery took 49 minutes.
3. `mcq`: which of these makes leaving a CDN hardest? Answer: the WAF rules, rate limits, token checks and Workers that now live at the edge. Distractor: the cached objects (S06-M43). Distractor: the DNS records (S06-M43). Feedback: a cache is swappable, and a perimeter is a rebuild.
4. `mcq`: the lab reports 34 ms for a cache hit. What may you claim from it? Answer: a floor under ideal conditions, with no loss and no bandwidth limit. Distractor: the latency a real user will see (S06-M44). Distractor: the latency including congestion (S06-M44). Feedback: `laggy.py` delays and never drops.
5. `recall`: state the fourth closing idea in one sentence. Answer: concentration cuts both ways, because the network that absorbs a flood nobody could survive is also the single point of failure for everybody on it. Feedback: it is also the bridge into week 7.

**Review cards.**
- Q: What are the four lines of the bill? A: your TLS private keys, a single point of failure, the power to see and shape traffic, and lock-in by architecture.
- Q: What happened to Fastly on 8 June 2021? A: one customer's configuration change took 85% of the network to errors, for 49 minutes.
- Q: Which four companies banned domain fronting, and when? A: AWS and Google in 2018, Azure in 2022, Fastly in February 2024.
- Q: State the first closing idea. A: move the work or move the data, because you cannot beat the speed of light.
- Q: State the third closing idea. A: it is all Sessions 2 to 5, rented by the city. A CDN invents almost nothing.
- Q: What does `tools/laggy.py` model, and what does it not? A: it adds delay each way. It never drops a packet, so there is no loss and no bandwidth limit.
- Q: What question opens week 7? A: today's edge survives your origin dying, so what does your origin do when the edge dies?

**Lab.** `./setup.sh && ./run_all.sh`. Expected: seven benches and six demos in about 80 seconds, with no network, and every number in this session reproduced. Then `bash demos/failover.sh` and read the `X-Origin` header before and after the primary origin is killed.

## 6. Beyond the slides

These facts are not in the deck or the lab. The lessons need them to stay correct.
Each one carries an authoritative reference, and a lesson page shows it with a
"beyond the slides" badge.

| # | Fact the lessons need | Reference | Which module needs it |
|---|---|---|---|
| B01 | TLS 1.3 itself is a one-round-trip handshake. The "three round trips to first byte" of page 8 counts one for TCP, one for TLS and one for the request. Say which layer each round trip belongs to, or the learner concludes that TLS 1.3 costs three. | RFC 8446 §2, and §2.2 for the 0-RTT variant | s06-m01-physics-budget |
| B02 | `stale-while-revalidate` and `stale-if-error` are defined in RFC 5861, May 2010, which is Informational and an Independent Submission, not a standards-track RFC. The UPDATING and STALE rows of page 17 are both from it. | RFC 5861, verified at rfc-editor.org on 2026-10-10 | s06-m03-caching-defaults |
| B03 | RFC 9842 is titled "Compression Dictionary Transport", Proposed Standard, 2025, edited by Patrick Meenan and Yoav Weiss. The slide's name and year are right, and it is standards-track, unlike RFC 5861. | RFC 9842, verified at rfc-editor.org on 2026-10-10 | s06-m04-caching-the-uncacheable |
| B04 | The modern definitions of freshness, `Vary`, the `Age` header and every `Cache-Control` directive live in RFC 9111, which replaced RFC 7234 in 2022. The session speaks of all four and names none of them. | RFC 9111 §4.1 for `Vary`, §4.2 for freshness, §5.1 for `Age`, §5.2 for the directives | s06-m03-caching-defaults |
| B05 | `X-Forwarded-Host` is not a standard header. The standardised equivalent is the `Forwarded` field of RFC 7239. The poisoning demo works because an informal header reached application code, which is part of the lesson. | RFC 7239 §4 and §5.3 | s06-m05-cache-bugs |
| B06 | BGP chooses a best path by policy, AS-path length and other tie-breaks, not by latency. So anycast gives you a nearby point of presence, and not reliably the nearest one. Page 15 says the routing chooses, and it does not say the choice can be poor. | RFC 4271 §9.1.2 and §9.1.2.2 | s06-m02-what-a-cdn-is |
| B07 | The group index of a single-mode fibre is a typical value for one wavelength, not a constant of nature. 1.468 is representative near 1550 nm in standard G.652 fibre, and a datasheet value varies in the third decimal. The 4.90 ms per 1000 km figure is therefore good to about two digits. | ITU-T G.652 and the Corning SMF-28 Ultra datasheet, group index 1.4682 at 1550 nm | s06-m01-physics-budget |
| B08 | A great-circle distance is a lower bound on a fibre route. Real cable follows coastlines, roads and existing rights of way, so the "stretch factor" of the bench mixes routing distance with queueing and processing delay. | Singla et al., "The Internet at the Speed of Light", HotNets 2014, which the bench cites | s06-m01-physics-budget |
| B09 | Cloudflare's documented `cf-cache-status` list is longer than eight values. It also includes NONE or UNKNOWN when no caching decision was made, and DEFERRED. Page 17's "one header, eight states" is the teaching set, not the whole vocabulary. | Cloudflare cache docs, "Cache status response header" | s06-m03-caching-defaults |
| B10 | ESI 1.0 is a W3C Note, published 4 August 2001. A Note records a submission and is not a W3C standard, which is why ESI support differs between CDNs. `Surrogate-Control` comes from the companion Edge Architecture Specification, also a Note. | W3C Note "ESI Language Specification 1.0", 4 August 2001 | s06-m04-caching-the-uncacheable |
| B11 | nginx's `limit_req` has both a `burst` parameter and a `nodelay` flag. Without `nodelay` it queues the burst instead of refusing it. The lab models the `nodelay` variant and says so in a comment, so the "97% refused" number belongs to that variant only. | nginx docs, `ngx_http_limit_req_module`, `limit_req` directive | s06-m07-not-speed |
| B12 | A persistent HTTP/1.1 connection is the default and either side may close it at any time, so a pool must handle a connection that dies between requests. That is why `edge/edge.py` has a `dead()` check on every pooled connection. | RFC 9112 §9.3 and §9.6 | s06-m06-faster-bytes |
| B13 | An IATA location code names a city or an airport, and a CDN's colo code is its own label that usually matches one. Treat a colo code as the vendor's name for a building, not as a guarantee of the city. | IATA location identifier registry, and Cloudflare's own data-centre list | s06-m02-what-a-cdn-is |
| B14 | TLS session resumption, RFC 8446 §2.2, can cut a repeat handshake to zero round trips for application data. The pool numbers of page 23 assume a full handshake on every new connection, so a real origin with resumption on sits between the no-pool and warm-pool rows. | RFC 8446 §2.2 and §4.6.1 | s06-m06-faster-bytes |

## 7. Open questions

1. **Page 9 does not belong to this deck.** It is titled "06 · QUIC · THE ROUND TRIPS" and it carries Session 5 numbers from `05-http3/handshake_race.py`, 456.6 ms against 319.8 ms at 150 ms RTT. The module map gives pages 8 to 11 to `s06-m01-physics-budget`. This file treats page 9 as a Session 5 slide, records it as `S06-C46`, and teaches nothing from it. Ask Bibek whether the instructor showed it, and whether he used it as a physics argument. If he did, the lesson should link to `s05-m10-quic-handshakes` rather than repeat it.
2. **Page 31 cross-references the wrong page numbers.** It points at "slide 22" for the fixed-window weakness, which is on page 27, and at "slide 11" for HTML not being cached, which is on page 16. The printed footer numbers differ from the PDF page numbers, which is the known hazard that `README.md` warns about. Confirm, then keep the PDF numbers everywhere in the lessons.
3. **Homework 2 names the wrong bench.** Page 37 says the BBR against CUBIC gap is "the number bench/05 refused to fake". `bench/05_delta.py` measures delta compression. The tool that refuses to fake loss is `tools/laggy.py`, and page 35 states it correctly. Treat it as a slide typo and cite `laggy.py` in the lesson.
4. **The deck says both "300+" and "330+" cities.** Page 12 and page 7 say 300 or more, and pages 15, 28 and 30 say 330 or more. Use the number the slide uses in each place, and prefer 330 or more for the DDoS and anycast claims, because those are the live-data slides.
5. **The lab's default TTL table is wider than page 16.** `edge/edge.py` gives 7200 s to 200, 206 and 301, 1200 s to 302 and 303, and 180 s to 404 and 410. Page 16 summarises it as "200/301 → 2 hrs · 404 → 3 min · others: not cached". The slide is a simplification of Cloudflare's behaviour, and the lab is a simplification of the slide. The lesson should teach the slide's three rows and point at the code for the rest.
6. **The lab's eligible-extension list is 20 names, and the slide says 68.** `DEFAULT_EXT` in `edge/edge.py` carries 20. The 68 belongs to Cloudflare, not to the lab. Keep the two numbers apart in any lesson text.
7. **Page 27's column headers do not match the bench headers.** The slide prints "burst at the window edge" and "normal page load". The bench prints "attack: in 9.5-10.5 s", "max in any 10 s", "page loads refused" and "steady refused". The numbers agree. Use the bench wording in a lesson, because it states the measured span.
8. **Three slides quote a "source doc" that is not in `sources/`.** Pages 22, 24 and 25. If Bibek can find the original course outline, add it to `sources/MANIFEST.md`, because it would settle how much of this session was planned and how much the instructor added.
9. **The dashboard limits need one check before a lesson claims them.** Page 31 and `cloudflare/INSTRUCTOR.md` both date the free-plan limits to September 2026. Vendor limits change. Re-check them, or mark them with the date in the lesson text.
10. **The 39,676-byte page of page 19 does not appear on the slide.** It comes from the bench output line. If a lesson quotes it, cite `bench/04_esi_bytes.py` and not the slide.

### Proposed new threads

The README says to add a thread only when a second session repeats the idea. Each of
these has at least two sessions behind it. The proposal belongs here, not in
`README.md`, as the rules require.

| Proposed ID | The idea | Sessions behind it | Why it earns a thread |
|---|---|---|---|
| `T-pick-an-owner` | Choose an owner without a central registry: consistent hashing, a hash ring, a DHT, a sharded cache. Add capacity without moving the world. | S6 page 13 says "the same idea recurs all week". S4's upstream hashing is the single-node version. | It is the one algorithm the instructor calls founding, and it generalises past caching. |
| `T-key-names-the-answer` | An identity must name everything the answer depends on. A cache key, `Vary`, a shard key, a `Host` header. When the name is short, two different answers collide. | S5 `Vary` and the `Host` header. S6 the default key, poisoning and deception. | It is the stated root cause of both class-6 cache attacks, and it already explains `Vary` in class 5. |
| `T-rent-what-you-cannot-own` | Some capacity cannot be bought at your scale, only rented: 500 Tbps of absorption, 330 cities, a warm pool on every continent. The rent is trust and concentration. | S6 pages 28, 33 and 34. S3's "in the wild" slides raise the same buy-or-build question for the proxy layer. | It is the closing argument of the class, and it is the frame the week 7 outage stories need. |
| `T-move-work-outward` | Push the per-user part outward, server to edge to browser, so the shared part can be cached. | S6 page 18, the four tricks. S3's stateless-server slides move session state outward for the same reason. | It is a distinct move from `T-where-state-goes`, because here the work moves, not the state. |

If Bibek accepts any of them, add the row to the thread table in
`docs/curriculum/README.md` and then add the thread ID to the module fields named above.
`T-pick-an-owner` belongs on `s06-m02-what-a-cdn-is`. `T-key-names-the-answer` belongs on
`s06-m03-caching-defaults` and `s06-m05-cache-bugs`. `T-rent-what-you-cannot-own` belongs
on `s06-m07-not-speed` and `s06-m09-the-bill`. `T-move-work-outward` belongs on
`s06-m04-caching-the-uncacheable`.

