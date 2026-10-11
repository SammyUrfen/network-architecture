# Class 6 cram sheet: (Ab)using CDNs

Every key fact of the class, in the order the instructor taught it.
This file is a fallback for the quiz on 2026-10-12. The fast read at `/s06/digest/`
teaches the same facts with pictures and questions.

Source: `docs/curriculum/session-06.md`, 268 facts in total, 157 of them here.
A slide number is a page of the PDF.

| # | ID | Fact | Slide | Kind |
|---|---|---|---|---|
| 1 | S06-C01 | A CDN is somebody else's computers, placed closer to your users. The title adds the second half: everything those computers can do while your traffic passes through them. | `slide 1` | core |
| 2 | S06-C05 | Weeks 1 to 5 made one origin fast. Week 6 puts a network in front of it. | `slide 6` | core |
| 3 | S06-C11 | The agenda is six questions about a box in the middle: why the edge exists, what a CDN is, caching, moving bytes faster, everything that is not speed, and Cloudflare by hand. | `slide 7` | core |
| 4 | S06-C16 | Glass slows light. The fibre group index is 1.468 near 1550 nm, so light in fibre travels 204,218 km/s. | `slide 8`, `bench/01_physics.py` | core |
| 5 | S06-C17 | 204,218 km/s is 4.90 ms per 1000 km, one way. Reproduced on this machine on 2026-10-10. | `slide 8`, `bench/01_physics.py` | measured |
| 6 | S06-C18 | Mumbai to Chennai is 1,033 km on the great circle. The round-trip floor in straight glass is 10 ms. | `slide 8`, `bench/01_physics.py` | measured |
| 7 | S06-C19 | The real ping Mumbai to Chennai is 23 ms, from WonderNetwork, 8 to 17 September 2026. That is 2.3 times the floor. | `slide 8`, `bench/01_physics.py` | measured |
| 8 | S06-C20 | Mumbai to Ashburn, us-east-1, is 12,847 km. The round-trip floor is 126 ms. You cannot go under it. | `slide 8`, `bench/01_physics.py` | core |
| 9 | S06-C22 | TLS 1.3 needs three round trips to the first byte on a new connection. At 126 ms that is about 380 ms of waiting. | `slide 8` | core |
| 10 | S06-C24 | The bench also prints the measured stretch factor for each city. Singapore is 3.3 times closer than Washington and only 1.3 times faster, so the gap is routing, not physics. | `bench/01_physics.py` | measured |
| 11 | S06-C26 | Distance charges you twice: once in latency, and again in loss. | `slide 10` | core |
| 12 | S06-C27 | Akamai measured in 2010: under 100 miles gives 1.6 ms RTT, 0.6% loss and 44 Mbps. A 4 GB download takes 12 minutes. | `slide 10`, `bench/01_physics.py` | measured |
| 13 | S06-C28 | 500 to 1,000 miles gives 16 ms, 0.7% and 4 Mbps. A 4 GB download takes 2.2 hours. | `slide 10` | measured |
| 14 | S06-C29 | About 3,000 miles gives 48 ms, 1.0% and 1 Mbps. A 4 GB download takes 8.2 hours. | `slide 10` | measured |
| 15 | S06-C30 | About 6,000 miles gives 96 ms, 1.4% and 0.4 Mbps. A 4 GB download takes 20 hours. | `slide 10` | measured |
| 16 | S06-C31 | The Mathis formula says throughput is about MSS divided by RTT times the square root of the loss rate. Mathis et al., 1997. | `slide 10`, `bench/01_physics.py` | core |
| 17 | S06-C32 | The far edge is 110 times slower, not 60 times further. The bench reproduces 110x measured against 91.7x from the model. | `slide 10`, `bench/01_physics.py` | measured |
| 18 | S06-C34 | The split-path model is you, 10 ms to a Mumbai edge, then 194 ms to a Washington origin. Direct is 204 ms. Every hop uses TLS 1.3. | `slide 11`, `bench/02_split_tcp.py` | core |
| 19 | S06-C35 | Direct to the origin on a new connection gives 621 ms to the first byte, 3.0 round trips, for dynamic content. | `slide 11`, `bench/02_split_tcp.py` | measured |
| 20 | S06-C36 | Direct to the origin on a kept-alive connection gives 208 ms, 1.0 round trip. | `slide 11`, `bench/02_split_tcp.py` | measured |
| 21 | S06-C37 | An edge with no origin pool gives 625 ms, 3.1 round trips. It is only a longer proxy, and it is slower than direct. | `slide 11`, `bench/02_split_tcp.py` | measured |
| 22 | S06-C38 | An edge with a warm origin pool and a new user connection gives 233 ms, 1.1 round trips. | `slide 11`, `bench/02_split_tcp.py` | measured |
| 23 | S06-C39 | An edge with a warm pool and a kept-alive user connection gives 209 ms, about the same as direct. | `slide 11`, `bench/02_split_tcp.py` | measured |
| 24 | S06-C40 | An edge cache hit on a static asset gives 34 ms, 0.2 round trips. The origin is never touched. | `slide 11`, `bench/02_split_tcp.py` | measured |
| 25 | S06-C41 | An edge cache hit on a kept-alive connection gives 11 ms, 0.1 round trips. | `slide 11`, `bench/02_split_tcp.py` | measured |
| 26 | S06-C42 | Those seven numbers are the median of five runs, with simulated delay from `tools/laggy.py`. The tool delays each chunk and never drops a packet. | `bench/02_split_tcp.py`, `tools/laggy.py` | measured |
| 27 | S06-C43 | A cache miss through the edge is no faster than going direct, and sometimes slower. | `slide 11` | core |
| 28 | S06-C44 | The edge earns its place two ways. It keeps warm connections to your origin, which saves handshakes. When it can cache, it deletes the origin round trip, 194 ms to 0. | `slide 11` | core |
| 29 | S06-C46 | Page 9 of the deck is a Session 5 slide about the QUIC handshake. It belongs to `s05-m10-quic-handshakes`. Session 6 does not teach it again. | `slide 9` | correction |
| 30 | S06-C47 | A CDN is Session 4's reverse proxy, rented in more than 300 cities. Nothing in the architecture is new. | `slide 12` | core |
| 31 | S06-C50 | The reverse proxy is nginx from Session 4. The caching is `proxy_cache` from Session 4. The pool is `upstream keepalive` from Session 3. | `slide 12` | core |
| 32 | S06-C51 | Anycast puts one IP address in every city. That is Session 2's addressing, put to work. | `slide 12` | core |
| 33 | S06-C54 | The founding question of a CDN is which cache holds which URL. Get it wrong and every capacity upgrade is a cold cache. | `slide 13` | core |
| 34 | S06-C55 | With `hash(url) % N`, adding an eleventh cache to ten moves 90.9% of 100,000 URLs. Reproduced on this machine on 2026-10-10. | `slide 13`, `bench/06_consistent_hash.py` | measured |
| 35 | S06-C56 | Modulo hashing spreads load evenly, 1.02 times the mean on the busiest server. Even load is not the problem. The problem is the churn. | `slide 13`, `bench/06_consistent_hash.py` | measured |
| 36 | S06-C57 | A capacity upgrade under modulo hashing becomes a near-total cache flush, and a stampede on your origin at the worst moment. | `slide 13` | core |
| 37 | S06-C58 | Consistent hashing with one point per server moves only 3.3% of URLs, but the busiest server carries 2.93 times the mean. | `slide 13`, `bench/06_consistent_hash.py` | measured |
| 38 | S06-C59 | Consistent hashing with 160 points per server moves 8.2% of URLs, and the busiest server carries only 1.14 times the mean. | `slide 13`, `bench/06_consistent_hash.py` | measured |
| 39 | S06-C73 | Every Cloudflare-proxied site answers `/cdn-cgi/trace`. The reply lists the client IP, the colo, the HTTP version, the TLS version and the key exchange. | `slide 15`, `cloudflare/no-account.sh` | core |
| 40 | S06-C74 | A colo is an IATA airport code. BOM is Mumbai, DEL Delhi, MAA Chennai, SIN Singapore, LHR London, IAD Ashburn. | `slide 15` | core |
| 41 | S06-C75 | BGP anycast chooses the colo, not you. The CDN tells you which building your packets reached. | `slide 15` | core |
| 42 | S06-C78 | Every Cloudflare response carries a `cf-ray` header. Its suffix is the colo. That is how you debug a slow or stale user. | `slide 15` | core |
| 43 | S06-C80 | The build host that produced the deck got `colo=IAD` in September 2026, not BOM. A live number depends on the day and the network. | `slide 15` | measured |
| 44 | S06-C81 | By default a CDN decides what to cache from the file extension. HTML is not on the list. | `slide 16` | core |
| 45 | S06-C83 | The default list excludes HTML and JSON. It also excludes anything with `Set-Cookie`, or `Cache-Control: private`, `no-store`, `no-cache` or `max-age=0`. | `slide 16` | core |
| 46 | S06-C84 | When the origin says nothing about freshness, the default edge TTL is 2 hours for 200 and 301, and 3 minutes for 404. Other statuses are not cached. | `slide 16` | core |
| 47 | S06-C85 | The default cache key is scheme plus host plus path plus query. Nothing else. | `slide 16` | core |
| 48 | S06-C86 | Cookies and almost every header are not in the key. Two users with different cookies share one cached object. | `slide 16` | core |
| 49 | S06-C88 | `Vary`, or a custom cache key, is how you tell the edge that two requests differ. That is Session 5's `Vary` header, now at the edge. | `slide 16` | core |
| 50 | S06-C89 | A first request for a static asset through the lab edge answers `x-cache: MISS`, and the next answers `HIT`. The first visitor pays the origin round trip. | `slide 16`, `demos/cache.sh` | measured |
| 51 | S06-C90 | A request for HTML through the lab edge answers `x-cache: DYNAMIC`, because the extension is not eligible. It goes straight to the origin. | `slide 16`, `demos/cache.sh` | measured |
| 52 | S06-C91 | `cf-cache-status` is a small language with eight states: MISS, HIT, EXPIRED, REVALIDATED, UPDATING, STALE, DYNAMIC and BYPASS. | `slide 17` | core |
| 53 | S06-C92 | MISS means eligible and not in the cache, so the edge fetched it from the origin. The origin was hit. | `slide 17`, `edge/edge.py` | core |
| 54 | S06-C93 | HIT means served from the cache while still fresh. The origin was not hit. That is the whole point. | `slide 17`, `edge/edge.py` | core |
| 55 | S06-C95 | REVALIDATED means the TTL passed, the origin answered 304, and the cache reused its copy. That is Session 5's ETag and `If-None-Match`, saving bandwidth. | `slide 17`, `edge/edge.py` | core |
| 56 | S06-C97 | STALE means the origin is down and the edge served the stale copy anyway. That is next week's whole topic. | `slide 17`, `edge/edge.py` | core |
| 57 | S06-C98 | DYNAMIC means the object was never eligible, so the edge never looked in the cache. It is the default for HTML. | `slide 17`, `edge/edge.py` | core |
| 58 | S06-C101 | Pages got personal, so four tricks exist to cache them anyway: SSI, ESI, Ajax and a delta to the origin. | `slide 18` | core |
| 59 | S06-C103 | Edge-Side Includes came from Akamai and Oracle, as a W3C Note in 2001. The same holes get filled at the edge. | `slide 18` | core |
| 60 | S06-C104 | With ESI you cache the shared shell everywhere and assemble the personal parts at the point of presence. | `slide 18` | core |
| 61 | S06-C106 | Railgun, Cloudflare 2013 to 2024, gave up on caching the dynamic page and sent only the bytes that changed since last time. | `slide 18` | core |
| 62 | S06-C107 | The four tricks form one arc: move the personalisation outward, server to edge to browser, so the shared part can be cached and only the small personal part is recomputed. | `slide 18` | core |
| 63 | S06-C109 | With 100 logged-in users on the same page, the bench first asserts both methods produce byte-identical pages, 39,676 bytes each. | `slide 19`, `bench/04_esi_bytes.py` | measured |
| 64 | S06-C110 | Origin assembles: 100 origin requests, 3,984,200 bytes origin to edge, 3,992,400 bytes to users, and DYNAMIC 100 times. | `slide 19`, `bench/04_esi_bytes.py` | measured |
| 65 | S06-C111 | ESI at the edge: 201 origin requests, 83,454 bytes origin to edge, 3,994,793 bytes to users, and HIT 99 times with one MISS. | `slide 19`, `bench/04_esi_bytes.py` | measured |
| 66 | S06-C112 | Origin bytes fell 97.9%, which the slide rounds to 98%. The shell is fetched once instead of 100 times. | `slide 19`, `bench/04_esi_bytes.py` | measured |
| 67 | S06-C113 | Bytes to the user rose 0.06%, which the slide rounds to +0.1%. ESI does not shrink the download. | `slide 19`, `bench/04_esi_bytes.py` | measured |
| 68 | S06-C114 | Origin requests went up, 100 to 201, because each personal fragment is its own tiny fetch. | `slide 19`, `bench/04_esi_bytes.py` | core |
| 69 | S06-C118 | On a 24 KB news page regenerated every minute, plain gzip -6 gives 4,276 bytes, which is 17.7% of the raw page. | `slide 20`, `bench/05_delta.py` | measured |
| 70 | S06-C119 | deflate with the one-minute-old page as the dictionary gives 598 bytes, 2.5% of raw. | `slide 20`, `bench/05_delta.py` | measured |
| 71 | S06-C120 | zstd with the one-minute-old page as the dictionary gives 436 bytes, 1.8% of raw. That is the `dcz` encoding. | `slide 20`, `bench/05_delta.py` | measured |
| 72 | S06-C121 | zstd with a one-hour-old dictionary gives 1,277 bytes, 5.3% of raw. The dictionary must be recent. | `slide 20`, `bench/05_delta.py` | measured |
| 73 | S06-C126 | A one-minute-old copy turns 24 KB into 436 bytes, about 10 times past gzip. The catch is that the dictionary must be recent and identical on both ends. | `slide 20` | core |
| 74 | S06-C127 | A shared cache is a shared weapon. The two classic bugs are cache poisoning and cache deception. | `slide 21` | core |
| 75 | S06-C128 | Cache poisoning, named by Kettle in 2018: the origin reflects a header such as `X-Forwarded-Host` into the page, and that header is not in the cache key. | `slide 21` | core |
| 76 | S06-C131 | Poisoning has three fixes: drop the unkeyed header at the edge, add it to the cache key, or make the origin send `Vary` on it. | `slide 21` | core |
| 77 | S06-C132 | `demos/poison.sh` starts a second edge with `--strip-unkeyed`, and the same attack fails against it. | `demos/poison.sh` | measured |
| 78 | S06-C133 | Cache deception, named by Gil at Black Hat USA 2017: trick the victim into loading `/account/settings/fake.css`. | `slide 21` | core |
| 79 | S06-C136 | Both bugs come from one root: the cache key disagrees with reality. A cache is shared state, and shared state is an attack surface. | `slide 21` | core |
| 80 | S06-C137 | The course source document said BBR "relooked at TCP retries, congestion and the famous saw-tooth". The slide corrects the framing: the saw-tooth is Session 2's slide, and BBR is the answer to it. | `slide 22` | correction |
| 81 | S06-C139 | A loss-based controller such as CUBIC fills the pipe until a packet drops, then halves its window. That is the saw-tooth. | `slide 22` | core |
| 82 | S06-C141 | BBR measures the real bottleneck bandwidth and the minimum RTT, then paces the sender to that rate. | `slide 22` | core |
| 83 | S06-C142 | Google B4 and YouTube, 2016, the paper itself: 2 to 25 times the CUBIC throughput, and a 53% lower median RTT globally. | `slide 22` | measured |
| 84 | S06-C143 | Amazon CloudFront, 2019, edge to viewer: up to 22% more throughput, and up to 100% more on some US mobile networks. | `slide 22` | measured |
| 85 | S06-C144 | Akamai, November 2019, media delivery: BBR on more than 80% of end-user connections. | `slide 22` | measured |
| 86 | S06-C145 | A web-wide census of the top 10,000 sites in 2023 found BBR the most deployed congestion control, with CUBIC at about 7%. | `slide 22` | measured |
| 87 | S06-C147 | That is why a CDN can switch BBR on for you. It owns the sender on the long leg to your origin, and on the leg out to the user. | `slide 22` | core |
| 88 | S06-C148 | The pool bench runs 300 visitors, one every 40 ms, with the origin 50 ms away over TLS 1.3 and an origin idle close after 1 second. | `slide 23`, `bench/03_pool.py` | measured |
| 89 | S06-C149 | With no pool: 300 origin requests, 300 new connections, 0% reuse, 160 ms mean time to first byte. | `slide 23`, `bench/03_pool.py` | measured |
| 90 | S06-C150 | With 32 worker pools: 164 new connections, 45.3% reuse, 112 ms. | `slide 23`, `bench/03_pool.py` | measured |
| 91 | S06-C151 | With 8 worker pools: 52 new connections, 82.7% reuse, 74 ms. | `slide 23`, `bench/03_pool.py` | measured |
| 92 | S06-C152 | With 1 shared pool: 4 new connections, 98.7% reuse, 57 ms. | `slide 23`, `bench/03_pool.py` | measured |
| 93 | S06-C153 | A pooled connection opened by one worker can only be reused by that worker. Split the pool across many workers and each worker sees too few requests to keep its connections warm. | `slide 23` | core |
| 94 | S06-C155 | Cloudflare's Pingora post, September 2022: one big customer's reuse went from 87.1% to 99.92%, a 160-fold drop in new origin connections, and 434 years of handshake time saved every day. | `slide 23` | measured |
| 95 | S06-C157 | The setup you amortise at the edge is a 2-RTT TLS handshake to your origin. Session 3's "amortise the setup" now spans a continent. | `slide 23` | core |
| 96 | S06-C159 | Most CDN to origin hops are still HTTP/1.1 by default. `cloudflared` has `http2Origin` set to false until you turn it on. | `slide 24`, `cdn-lab/README.md` | core |
| 97 | S06-C161 | Without a shield, 300 edges each miss and send 300 requests to your origin for the same object. That is a built-in thundering herd. | `slide 24` | core |
| 98 | S06-C164 | Request collapsing at one edge, 50 users on a cold cache and one object: 50 origin fetches without it, 1 with it. The other 49 wait for the first, then all hit. | `slide 24`, `bench/harness.py` | measured |
| 99 | S06-C165 | Collapsing at one point of presence and tiered caching across points of presence are the same move at two scales: never fetch the same object twice at once. | `slide 24` | core |
| 100 | S06-C168 | All your traffic already passes through the edge. That one fact changes what the edge is for. | `slide 25` | core |
| 101 | S06-C172 | Speed got you to adopt a CDN. Control is why you cannot leave. | `slide 25` | core |
| 102 | S06-C173 | A WAF is a denylist of spellings. The bug still lives in your origin. | `slide 26` | core |
| 103 | S06-C176 | `q="' OR 1=1 --"` is blocked by the rule `sqli-tautology`. | `slide 26`, `demos/waf.sh` | measured |
| 104 | S06-C177 | `q="'/**/OR/**/1=1--"` leaks 5 rows at the decode level. SQL comments replace the spaces, and the regex misses. | `slide 26`, `demos/waf.sh` | measured |
| 105 | S06-C178 | At the full normalisation level the same payload is blocked, because the edge strips the comments first. | `slide 26`, `demos/waf.sh` | measured |
| 106 | S06-C179 | `q="' --"` still leaks 5 rows at every level. It has no OR, no UNION and no digits to match. | `slide 26`, `demos/waf.sh` | measured |
| 107 | S06-C180 | The arms race is normalisation: how much the WAF decodes first, against how many ways the attacker can spell the same attack. You never win it outright. | `slide 26` | core |
| 108 | S06-C182 | The actual fix lives in the origin: bind the parameters. `demos/waf.sh` ends with `--safe` on, and then every bypass returns no results. | `slide 26`, `origin/origin.py` line 204 | core |
| 109 | S06-C185 | At the window edge, a fixed window lets 200 requests through in one second. Reproduced on this machine on 2026-10-10. | `slide 27`, `bench/07_ratelimit.py` | measured |
| 110 | S06-C186 | The exact sliding log lets exactly 100 through at the same window edge. | `slide 27`, `bench/07_ratelimit.py` | measured |
| 111 | S06-C187 | The sliding-window estimate lets 104 through, the token bucket 109, and a leaky bucket with burst 0 lets only 10. | `slide 27`, `bench/07_ratelimit.py` | measured |
| 112 | S06-C188 | On a normal page load, every algorithm passes except the leaky bucket with burst 0, which refuses 97% of the requests. | `slide 27`, `bench/07_ratelimit.py` | measured |
| 113 | S06-C189 | The traffic model is explicit: 100 requests in the last half second of a window, 100 in the first half second of the next, then 50 requests per second. Simulated time, so the answer is the same on every machine. | `bench/07_ratelimit.py` | measured |
| 114 | S06-C191 | Failure mode one: 100 requests at 9.999 s plus 100 at 10.001 s is 200 in a blink. Cloudflare's free plan offers only this 10-second fixed window. | `slide 27` | core |
| 115 | S06-C194 | Cloudflare's 2017 answer is the sliding-window estimate: weight the previous window by how much of it still overlaps. Two counters per client. | `slide 27` | core |
| 116 | S06-C195 | Measured across 400 million requests, the estimate wrongly allowed or blocked only 0.003%. Cheap and close enough. | `slide 27` | measured |
| 117 | S06-C196 | Rate-limit counts are per data centre, not global. A botnet spread across 330 cities gets 330 budgets. | `slide 27` | core |
| 118 | S06-C198 | The largest DDoS on record is 31.4 Tbps, reported by Cloudflare in December 2025. The Aisuru botnet used 1 to 4 million devices, and the attack lasted 35 seconds. | `slide 28` | measured |
| 119 | S06-C201 | You cannot buy 31 Tbps of inbound capacity to soak a flood like that. | `slide 28` | core |
| 120 | S06-C207 | The API gateway pattern puts authentication, header scrubbing and routing at the edge, before the origin is touched. | `slide 29` | core |
| 121 | S06-C208 | With no token, the edge answers 401 "missing bearer token" and the origin never sees the request. | `slide 29`, `demos/gateway.sh` | measured |
| 122 | S06-C209 | With a valid HS256 token, the edge sets `X-User` from the verified claims and the origin returns alice's orders. | `slide 29`, `demos/gateway.sh` | measured |
| 123 | S06-C210 | An expired token gets 401 "expired". A token that claims `alg: none` gets 401 "alg none refused". Never let the token pick the algorithm. | `slide 29`, `edge/jwtlite.py` | core |
| 124 | S06-C213 | The gateway is only real if the origin cannot be reached directly. That is the whole point of the demo. | `slide 29` | core |
| 125 | S06-C215 | With mTLS on, the direct request gets a connection reset and the edge still works. | `slide 29`, `demos/gateway.sh` | measured |
| 126 | S06-C217 | Six demos need no account at all. Any student can run them on a laptop with `curl`, `dig` and `cloudflared`. | `slide 30`, `cloudflare/no-account.sh` | core |
| 127 | S06-C222 | Demo 5 starts `tools/echo_server.py` on port 8000 and runs `cloudflared tunnel --url http://localhost:8000`. It prints a random `trycloudflare.com` URL. | `slide 30` | core |
| 128 | S06-C223 | The quick tunnel puts your laptop behind Cloudflare's edge in seconds, with no account and no DNS record. | `slide 30` | core |
| 129 | S06-C224 | The echo server prints each request's `CF-Connecting-IP`, the `CF-Ray` with the visitor's colo, and `CDN-Loop`. | `slide 30`, `tools/echo_server.py` | core |
| 130 | S06-C230 | The orange cloud hides nothing if the origin still accepts traffic from everyone. Old DNS history, MX records and certificate-transparency logs all leak the origin IP. | `cloudflare/INSTRUCTOR.md` §A | core |
| 131 | S06-C231 | A Cache Rule makes an HTML page cacheable. The sequence to show is MISS, HIT, purge, MISS, with the `age` header climbing between. | `slide 31` | core |
| 132 | S06-C232 | Free-plan limits: 5 WAF custom rules with no regular expressions, 10 Cache Rules, 1 rate-limiting rule with a 10-second period only, and 100,000 Worker requests per day. | `slide 31`, `cloudflare/INSTRUCTOR.md` | core |
| 133 | S06-C234 | The free-plan limits are themselves the lesson. One WAF rule with no regex is why the `demos/waf.sh` bypasses matter, and a 10-second-only window is exactly the fixed-window weakness. | `slide 31` | core |
| 134 | S06-C236 | A Worker runs your code at the edge. The gateway Worker rate-limits, verifies a JWT with WebCrypto, sets `X-User`, and fetches the primary origin with a backup fallback. | `slide 32`, `cloudflare/worker-gateway/src/index.js` | core |
| 135 | S06-C237 | A Worker is a V8 isolate, not a process. It starts in about 5 ms and costs about 3 MB, against about 35 MB and a cold start for a container. | `slide 32` | core |
| 136 | S06-C238 | That answers Session 3's question, "is not everything a web server?", one more time. CGI forked a process per request, FastCGI kept them warm, nginx ran an event loop, and a Worker runs an isolate. | `slide 32` | core |
| 137 | S06-C240 | A Worker is prefork, FastCGI and servlets again: amortise the setup, taken to the edge. | `slide 32` | core |
| 138 | S06-C241 | Both lab Workers ran locally in workerd, Cloudflare's real runtime, through Miniflare, against the lab origin. `node test_workers.mjs` runs them. | `slide 32`, `cloudflare/test_workers.mjs` | measured |
| 139 | S06-C242 | The gateway Worker reproduced every line of `demos/gateway.sh`: 401 on no token, `alg: none` refused, and failover to the backup origin. | `slide 32` | measured |
| 140 | S06-C243 | The ESI Worker's assembled page was checked byte for byte against the origin's own assembly. | `slide 32` | measured |
| 141 | S06-C244 | The ESI Worker first used HTMLRewriter and it ate the page header. HTML has no self-closing custom elements, so an HTML parser reads `<esi:include .../>` as an open tag whose content runs to `</header>`. | `cdn-lab/README.md` | core |
| 142 | S06-C245 | ESI is XML-ish markup inside HTML, and the two grammars disagree about where an element ends. That is Session 2's framing question again. The Worker uses a regular expression instead. | `cdn-lab/README.md`, `slide 32` | core |
| 143 | S06-C246 | The bill for a CDN has four lines: your TLS private keys, a single point of failure, the power to see and shape traffic, and lock-in by architecture. | `slide 33` | core |
| 144 | S06-C247 | The edge terminates HTTPS, so it holds your keys or its own certificate for your domain. It can read every byte. That is the deal. | `slide 33` | core |
| 145 | S06-C251 | Once the WAF, the rate limits, the authentication and your Workers live at the edge, it is not a cache you can swap. It is your security perimeter. | `slide 33` | core |
| 146 | S06-C252 | A CDN is enormous leverage rented cheaply, and the rent is trust, concentration and dependence. Use it, and know the bill. | `slide 33` | core |
| 147 | S06-C253 | Closing idea 1: move the work, or move the data. You cannot beat the speed of light, so you move content closer or push personalisation outward. Every CDN trick is one of those two moves. | `slide 34` | core |
| 148 | S06-C254 | Closing idea 2: the edge is wherever all the traffic converges. Caching routed everything through the edge, and the firewall, the rate limiter, the scrubber, the authentication and your code all followed. | `slide 34` | core |
| 149 | S06-C255 | Closing idea 3: it is all Sessions 2 to 5, rented by the city. Reverse proxy, connection pool, ETag revalidation, BBR, multiplexing, consistent hashing and framing. A CDN invents almost nothing. | `slide 34` | core |
| 150 | S06-C256 | Closing idea 4: concentration cuts both ways. The same pooling that absorbs a 31 Tbps flood is also the single point of failure that takes 85% of the web down. | `slide 34` | core |
| 151 | S06-C257 | `./setup.sh` builds a private certificate authority and three certificates, with `openssl` only. `./run_all.sh` runs 7 benches and 6 demos in about 80 seconds, with no network. | `slide 35`, `cdn-lab/README.md` | core |
| 152 | S06-C258 | `edge/edge.py` is about 450 lines and it is the whole lecture as code: cache, pool, WAF, rate limit, JWT and ESI in one file. The measured file is 486 lines. | `slide 35` | measured |
| 153 | S06-C259 | The order of stages inside the edge is fixed: rate limit, then WAF, then gateway, then cache, then origin pool, then ESI assembly. | `edge/edge.py` | core |
| 154 | S06-C260 | The instructor's reading task: read `edge/edge.py` end to end, then break it. Set `--pool 0` and watch reuse collapse. Set `--waf off` and watch the injection land. | `slide 35` | core |
| 155 | S06-C261 | The lab is honest about four things it does not model: loss and bandwidth, HTTP/2 to the origin, anycast and BGP, and a real kernel accept queue. | `slide 35`, `cdn-lab/README.md` | core |
| 156 | S06-C266 | Week 7 is Building for failures. The question it opens with: today's edge survives your origin dying with a stale hit, so what does your origin do when the edge dies? | `slide 38` | core |
| 157 | S06-C268 | `demos/failover.sh` runs a primary and a backup origin, kills the primary, and shows the edge switch over. The `X-Origin` header names which one answered. | `slide 38`, `demos/failover.sh` | measured |
