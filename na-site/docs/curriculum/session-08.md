# Session 8: Streaming video at large scale

## 1. Header

- **Title:** Streaming video at large scale. Deck header "CN @ SCALER · WEEK 8 OF 8".
- **Date:** about 2026-10-02. Week 8 of 8, the last class.
- **Subtitle, in the instructor words:** "It starts with a live cricket scorecard." The closing slide answers it: "Every live stream is a scorecard with bigger bytes."
- **Written:** 2026-10-09, from the complete transcribed deck, to the fixed module IDs in `README.md`. One module is new, `s08-m13-assignment-prep` (section 7, item 1).

**Sources used**

| Path | What it gives | Trust |
|---|---|---|
| `sources/session-08/slides.txt` | 48 PDF pages, complete. Four agents transcribed an image-only PDF on 2026-10-09. | medium-high |
| `sources/session-08/pages/p-01.txt` to `p-48.txt` | the same pages, one file each | medium-high |
| RFC 8216 §4.3.4.2, §6.2.1, §6.2.2, §6.3.3, §6.3.4 (rfc-editor.org) | the playlist reload rules, segment availability, the BANDWIDTH definition | high |
| Apple "HLS authoring specification for Apple devices", revision 2025-06-26 | requirements 1.32a, 1.32b, 7.5, 7.7, 8.24, 10.1, 14.2a, 14.2b, 14.2c, 14.3 | high |
| AWS public price list, CloudFront 2026-10-03, S3 us-east-1 2026-09-28, AWSDataTransfer 2026-09-16 | the unit prices behind the four bills | high |
| Amazon S3 User Guide, "Best practices design patterns: optimizing Amazon S3 performance" | 5,500 GET/s per prefix, the 503 Slow Down sentence | high |
| Local `ffmpeg` on this machine (Fedora, Linux 7.1.8) | the HLS muxer defaults | high |
| Fastly request-collapsing docs, Cloudflare cache-status docs, Huang et al. SIGCOMM 2014, RFC 9842 | checks for section 6 | high |

**Source gaps.** No transcript, no AI notes and no instructor code exist for Session 8. `sources/cn-at-scaler/` has no `lesson8` folder, so every command in this file comes from the slides, not from a repo we can run. The deck is an image-only PDF, so the text passed through a transcription step. Numbers, commands and tables survived, and a diagram appears as `[diagram: ...]` plus its labels. Page 22 prints "10.000 s", which section 7 records.

**Checks run for this file (2026-10-09).** Every number on pages 4, 12, 13, 15, 16, 17, 18, 19, 21, 25, 29, 30, 31, 32, 33, 34, 36, 40, 42 and 43 was recomputed by hand. The AWS unit prices were read from the public price list files. The Apple requirement numbers and the RFC 8216 sentences were read from the documents. Section 6 holds the confirmations and section 7 holds the two places where the slide arithmetic needs an extra assumption. The Hotstar blog post could not be fetched (Medium answered 403, the web archive is blocked), so its five steps rest on the slide.

**Confidence.** High on the mechanisms, the RFC text and the AWS unit prices. Medium on the deck's own measured runs, because no repo reproduces them. Medium on the Hotstar numbers, because the primary source stayed out of reach.

## 2. The session in one paragraph

Fifty million people want the same one-kilobyte file. That is the whole class. There are two ways to give it to them. The server can tell each phone when the score changes, which means fifty million held sockets and a stateful fleet. Or each phone can ask again every few seconds, which means ordinary stateless GET requests that any cache can answer. The arithmetic decides: 9.6 billion requests a match, 1.67 million a second at the peak, and a bill that is almost all request fees. Then the class shows that a live video stream is the same loop with bigger bytes. A player polls a small text index every four seconds and fetches numbered pieces that never change. Everything that made the scorecard survive makes the stream survive too: conditional requests, short TTLs, request collapsing, negative caching and diffs. The class closes the course, so every earlier week appears inside one cricket match.

## 3. Claim inventory

Kind counts sit in the tally at the end of this section.

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S08-C01 | The class teaches live delivery through one example, a live cricket scorecard. It is week 8 of 8. | `slides 1, 2` | story |
| S08-C02 | The three requests of the whole class: `score.json` 1,088 bytes every 15 s, `index.m3u8` 228 bytes every 4 s, and one `.ts` segment of 823,440 bytes once. | `slide 1` | detail |
| S08-C03 | The deck's own week list: 1 network programming, 2 eagle eye view, 3 server-side scale, 4 nginx, 5 HTTP, 6 CDNs, 7 failures, 8 video. | `slide 2` | story |
| S08-C04 | The claim of the class: all eight weeks appear in one system, one live match on fifty million phones. | `slides 2, 44` | story |
| S08-C05 | The class has eight blocks: the brief, what it costs, making polling survive, same loop bigger bytes, buffers and latency, many CDNs, making the stream, closing. | `slide 3` | story |
| S08-C06 | Cricket gives 25 to 45 s between balls, and an over every 4 to 5 minutes. That clock sets every poll interval and every TTL. | `slide 4` | core |
| S08-C07 | The audience: 50 M peak concurrent viewers, and 20 M on average across a 4-hour match. | `slide 4` | core |
| S08-C08 | The scorecard is 4 to 5 KB of JSON, about 1 KB gzipped. | `slide 4` | core |
| S08-C09 | About 100 events a year download the same file again and again. | `slide 4` | detail |
| S08-C10 | Callback to Week 5: gzip took 202,000 bytes to 5,763. | `slide 4` | story |
| S08-C11 | Two families of answers. In one the client asks. In the other the server tells. | `slide 5` | core |
| S08-C12 | The client-asks family: polling, conditional GET with a 304, caches (nginx in front, then a CDN), and a server with no memory of who asked last time. | `slide 5` | detail |
| S08-C13 | Every request in that family is an ordinary GET. So servers stay stateless, answers stay cacheable, and a CDN can stand in front. | `slide 5` | core |
| S08-C14 | The server-tells family: long poll, Server-Sent Events, WebSockets, PubSub with MQTT, and a plain binary socket like the Week 5 project. | `slide 5` | detail |
| S08-C15 | In that family every viewer holds a connection for the whole match. Servers are stateful, and nothing a CDN can cache. | `slide 5` | core |
| S08-C16 | Callback to Week 5: HTTP/1.0 hung up after every response, so the first family is the older shape. | `slide 5` | story |
| S08-C17 | Polling is a GET of the same URL every few seconds. The connection may close in between. | `slide 6` | core |
| S08-C18 | The client keeps the ETag and sends `If-None-Match`. A 304 answer has an empty body, and the client keeps what it has. | `slide 6` | core |
| S08-C19 | Jitter of plus or minus 20% stops fifty million phones from polling on the same second. The sample multiplies a 15,000 ms interval by `0.8 + random × 0.4`. | `slide 6` | core |
| S08-C20 | Worst-case freshness is one poll interval plus every cache TTL on the path. | `slides 6, 21` | core |
| S08-C21 | The sample client renders only on a 200 and calls itself again from a timer, so one loop never overlaps itself. | `slide 6` | detail |
| S08-C22 | Long polling sends `?after=1841`. The server holds the request open until ball 1842 is bowled, or 25 s pass. | `slide 7` | core |
| S08-C23 | A held request is a held socket. Every viewer has one open almost all the time, so W is 25 s, not 30 ms. | `slide 7` | core |
| S08-C24 | The server must answer before every idle timeout on the path. nginx `proxy_read_timeout` and the ALB idle timeout both default to 60 s. | `slide 7` | detail |
| S08-C25 | Long polling synchronises the herd. A wicket completes 20 M responses in one second, and 20 M new requests arrive in the next. | `slide 7` | correction |
| S08-C26 | Long polling came back standardised. The blocking playlist reload of Low-Latency HLS is long polling. | `slide 7` | core |
| S08-C27 | Server-Sent Events is one response that never ends, with `Content-Type: text/event-stream`. | `slide 8` | core |
| S08-C28 | SSE frames by delimiter. One event ends at a blank line, which is SMTP's lone dot in a different costume. | `slide 8` | core |
| S08-C29 | On reconnect the browser sends `Last-Event-ID`, and the server replays only what was missed. | `slide 8` | core |
| S08-C30 | Over HTTP/1.1 each tab holds its own SSE connection, about six per browser. HTTP/2 multiplexes them onto one. | `slide 8` | core |
| S08-C31 | SSE goes one way, server to client. Anything the phone says goes in ordinary requests. | `slide 8` | detail |
| S08-C32 | The sample stream sends `retry: 5000` once, then an `id`, `event` and `data` group for each ball. | `slide 8` | detail |
| S08-C33 | A WebSocket starts as a GET with `Upgrade: websocket` and gets 101 Switching Protocols. | `slide 9` | core |
| S08-C34 | `Sec-WebSocket-Accept` is base64 of SHA-1 of the client key plus a fixed GUID. Base64 again, from Week 1. | `slide 9` | detail |
| S08-C35 | Client-to-server frames are masked, so stray bytes can never look like a request to a caching proxy. | `slide 9` | core |
| S08-C36 | The WebSocket frame header: 1 byte of FIN, RSV and opcode, 1 byte of MASK and length, then 0, 2 or 8 bytes of extended length, then 0 or 4 bytes of masking key, then the payload. | `slide 9` | detail |
| S08-C37 | A WebSocket frames by length, the other Session 2 answer. A length of 0 to 125 fits in the second byte, and 126 or 127 means read more. | `slide 9` | core |
| S08-C38 | MQTT: the scorer sends one PUBLISH, and the broker copies it to every subscriber of the topic. | `slide 10` | core |
| S08-C39 | Hotstar picked MQTT with the EMQX broker for exactly this fan-out. | `slides 10, 11` | story |
| S08-C40 | A retained message is a cache inside the broker. It keeps the last score and hands it to each new subscriber at once. | `slide 10` | detail |
| S08-C41 | QoS 1 is at-least-once, so duplicates happen. Apply updates by version number and the duplicates become harmless. | `slide 10` | correction |
| S08-C42 | MQTT's Remaining Length is a varint: 7 bits per byte, and the top bit says "more". A type, a length, a value. | `slide 10` | detail |
| S08-C43 | A keepalive costs two bytes, `C0 00` out and `D0 00` back. But it wakes the phone radio and it holds a NAT mapping open. | `slide 10` | detail |
| S08-C44 | The MQTT exchange on the slide: CONNECT with `keepalive=60`, CONNACK, SUBSCRIBE at QoS 1, SUBACK, then PUBLISH with `retain=1`. | `slide 10` | detail |
| S08-C45 | Hotstar step 1: EMQX on one `c5.4xlarge` held 250k connections with latency in bounds. | `slide 11` | measured |
| S08-C46 | Hotstar step 2: the publisher split from the subscribers reached 2 M subscribers. Mnesia wants fewer than 10 nodes. | `slide 11` | measured |
| S08-C47 | Hotstar step 3: a Classic ELB drops connections at about 500k without pre-warming, and reaches 4 M per pre-warmed Classic ELB. | `slide 11` | measured |
| S08-C48 | Hotstar step 4: five clusters of eight subscribe nodes, bridged, passed 10 M. | `slide 11` | measured |
| S08-C49 | Hotstar step 5: a reverse bridge, a Go service on each subscriber that pulls from the publisher, reached 50 M on 200 nodes. | `slide 11` | measured |
| S08-C50 | Their quote: "Caching at any level is also not possible." Their social feed was tied to live moments, so it had to be pushed. A scorecard is the opposite case, one file identical for everyone. | `slide 11` | correction |
| S08-C51 | Source: M. Chaudhari and P. Gupta, "Building Pubsub for 50M concurrent socket connections", Hotstar Engineering blog, 6 June 2019. | `slide 11` | story |
| S08-C52 | Stateful means each phone lives on one box for hours. The deck's board says 100k to 200k connections per box, and Hotstar measured 250k. | `slide 12` | core |
| S08-C53 | A new box sits empty until someone reconnects. So rebalancing means disconnecting people. | `slide 12` | core |
| S08-C54 | Memory per connection covers kernel socket buffers, TLS state and the broker's per-client process. 250k phones on a 32 GiB box is about 137 KB each, all in. | `slide 12` | measured |
| S08-C55 | The soft `ulimit -n` still starts at 1,024. | `slide 12` | detail |
| S08-C56 | Keepalives carry nothing. At a 60 s keepalive, 20 M idle phones send 333k pings a second before the first ball is bowled. | `slide 12` | measured |
| S08-C57 | A load balancer gives DNS one address instead of 200 and spreads load evenly. But it holds every socket too. Hotstar hit 4 M per Classic ELB. | `slide 12` | core |
| S08-C58 | One client IP has 28,232 ephemeral ports (32768 to 60999) per destination. So 250k test sockets need at least 9 source IPs. | `slide 12` | detail |
| S08-C59 | Little's Law on the pull side: 1.67 M requests a second times about 0.03 s at the edge gives 50,000 requests in flight. | `slide 13` | core |
| S08-C60 | Little's Law on the push side: W is the whole match, four hours, so 50,000,000 sockets are held, ball or no ball. | `slide 13` | core |
| S08-C61 | Same audience and same file give a thousand times the concurrency, because W went from milliseconds to hours. | `slide 13` | core |
| S08-C62 | Three places the scorecard can live: your own servers, an object store with no cache, or an object store behind a CDN. | `slide 14` | detail |
| S08-C63 | Your own servers: phones to an ELB, then nginx times N serving from memory, with NFS or NAS behind and a writer that updates it. | `slide 14` | detail |
| S08-C64 | With an object store and no cache, every poll is a GET on the bucket. | `slide 14` | detail |
| S08-C65 | With a CDN edge and mid-tier in front, the edge absorbs the polls and the bucket sees a few per TTL. | `slide 14` | detail |
| S08-C66 | 9.6 B requests per match: 20 M viewers times 14,400 s divided by a 30 s poll. | `slide 15` | core |
| S08-C67 | 1.67 M requests a second at the peak: 50 M viewers divided by a 30 s poll. | `slide 15` | core |
| S08-C68 | 9.6 TB of scorecard per match: 9.6 B requests times 1 KB. | `slide 15` | core |
| S08-C69 | A 15 s poll doubles all three: 19.2 B requests, 3.33 M requests a second, 19.2 TB. | `slide 15` | detail |
| S08-C70 | Push each ball is about 9.6 B messages, one every 30 s or so per phone. | `slide 15` | detail |
| S08-C71 | Times 100 events a year: 960 B requests and 960 TB. | `slide 15` | detail |
| S08-C72 | Do the multiplication before you choose the architecture. | `slide 15` | story |
| S08-C73 | Bill 1, S3 straight to phones: $4.7K per match, $470K for 100 events. Mostly GET fees ($3,840). It breaks first at 5,500 GET/s per prefix. | `slide 16` | measured |
| S08-C74 | Bill 2, an nginx fleet with an ALB: $1.2K to $1.8K per match, $120K to $180K for 100 events. Mostly egress ($864) plus load-balancer units. It breaks first at 20 to 50 M idle keep-alive sockets at the load balancer. | `slide 16` | measured |
| S08-C75 | Bill 3, CloudFront in India: $12.5K per match, $1.25M for 100 events. Request fees are 92% of it. Nothing breaks. It is just the bill. | `slide 16` | measured |
| S08-C76 | Bill 4, push on 200 `c5.4xlarge` boxes: $0.9K to $1.6K per match, $90K to $160K for 100 events. Mostly a peak-sized fleet ($680) plus egress. It breaks first at reconnect storms and rebalancing. | `slide 16` | measured |
| S08-C77 | At list price, push is the cheapest per match and the CDN the dearest. The instructor says "Hold that thought." | `slide 16` | correction |
| S08-C78 | Conditions for the four bills: AWS list prices September 2026, S3 and EC2 and ELB in US East, CloudFront in India, body bytes only, a 30 s poll, and push sending 183-byte diffs up to full cards. | `slide 16` | detail |
| S08-C79 | One S3 prefix promises at least 5,500 GETs a second. | `slide 17` | core |
| S08-C80 | 50 M phones polling every 30 s ask for 1.67 M GETs a second. That is 303 times over, and one key lives under one prefix. | `slide 17` | core |
| S08-C81 | The S3 guide says: "While Amazon S3 is scaling to your new higher request rate, you may see some 503 (Slow Down) errors." | `slide 17` | detail |
| S08-C82 | Fifty million clients retrying a 503 without backoff is Session 7's retry storm, pointed at your own bucket. | `slide 17` | core |
| S08-C83 | Source: Amazon S3 User Guide, "Best practices design patterns: optimizing Amazon S3 performance", checked September 2026. | `slide 17` | story |
| S08-C84 | On a CDN a 1 KB file is billed per request. Request fees are 92% of the scorecard's CDN bill, not bytes. | `slide 18` | core |
| S08-C85 | Per million responses the request fee is $1.20 either way. The byte fee is $0.11 for a 1 KB scorecard and $59 to $90 for an 823 KB 480p segment. | `slide 18` | measured |
| S08-C86 | Break-even is about 11 KB. Below it you pay per request. Above it you pay per byte. | `slides 18, 45` | core |
| S08-C87 | The four marked points on the log axis: a playlist at 228 B, the scorecard at 1 KB, a 360p segment at 459 KB and a 720p segment at 1.6 MB. | `slide 18` | detail |
| S08-C88 | CloudFront India list prices, September 2026: HTTPS $0.0120 per 10,000 requests, $0.109 per GB after 1 free TB, and $0.072 per GB past 5 PB. | `slide 18` | detail |
| S08-C89 | The instructor's reason for the whole class: "I prefer polling because I want to tell you how it's used for video too." | `slide 19` | story |
| S08-C90 | Polling wins on three counts: the answer is cacheable, the server is stateless, and the path is already paid for. | `slide 19` | detail |
| S08-C91 | At list price the scorecard is 0.28% of the same match's video bill. | `slide 19` | measured |
| S08-C92 | A conditional GET sends `If-None-Match: "v1841"` and gets 304 Not Modified with the ETag and a `Cache-Control` line. | `slide 20` | detail |
| S08-C93 | Make the ETag the scorecard's version number: a fingerprint, not a clock. `If-Modified-Since` works too, but only to the second. | `slide 20` | core |
| S08-C94 | A 304 saves the 1 KB body, the JSON parse and the re-render. | `slide 20` | core |
| S08-C95 | A 304 does not save the request fee, the round trip or the headers. | `slide 20` | correction |
| S08-C96 | Conditional requests pay most between CDN tiers. Edge to mid-tier and mid-tier to origin send 304s instead of copies. | `slide 20` | detail |
| S08-C97 | Every layer at 30 s, which is the mid-tier TTL, the edge TTL and the client poll, gives up to 90 s stale: two or three balls behind the stadium. | `slide 21` | core |
| S08-C98 | A 5 s mid-tier TTL, a 5 s edge TTL and a 15 s poll give up to 25 s, which is inside one ball. | `slide 21` | detail |
| S08-C99 | Keep each CDN TTL at half of the freshness you promise, or less. | `slide 21` | core |
| S08-C100 | Refresh the edge before it expires. A prefetch at about 25 s of a 30 s TTL does it, and Akamai calls that prefresh. | `slide 21` | detail |
| S08-C101 | At the instant the edge copy expires, every request is a miss and all of them head for the origin. | `slide 22` | core |
| S08-C102 | Request collapsing: one fetch per edge per object, and everyone else waits in a queue. | `slide 22` | core |
| S08-C103 | Serve stale while updating: answer from the old copy while one request refreshes it (RFC 5861). | `slide 22` | core |
| S08-C104 | Prefetch before expiry, so no viewer ever meets an empty cache. | `slide 22` | detail |
| S08-C105 | Client jitter spreads the polls across the interval instead of onto the same second. | `slide 22` | detail |
| S08-C106 | The nginx recipe: `proxy_cache_lock on`, `proxy_cache_use_stale updating error timeout http_500 http_502 http_503 http_504`, `proxy_cache_background_update on`, and `proxy_cache_valid 200 10s`. | `slide 22` | detail |
| S08-C107 | 20,000 phones ask one edge for `score.json` in the same 50 ms. The edge sends 1 request upstream, 19,999 wait in a queue, and the origin sees 1 request. | `slide 23` | measured |
| S08-C108 | Request collapsing needs a shareable answer. The first response decides, and `Cache-Control: public` releases every waiter at once. | `slide 23` | core |
| S08-C109 | A private answer, or a stray `Set-Cookie`, dequeues the waiters one by one. Fastly then skips collapsing for that object for 2 minutes. | `slide 23` | detail |
| S08-C110 | Early hints name the next thing before it exists. HTTP 103 does it for pages. In Low-Latency HLS a preload hint names the next piece, requests for it queue at the edge, and one arrival releases them all. | `slide 23` | detail |
| S08-C111 | Check the default first. Cloudflare does not cache `.json` out of the box. Without a cache rule, `cf-cache-status` says DYNAMIC and every poll reaches you. | `slide 23` | correction |
| S08-C112 | Cache a 5xx briefly. One or two seconds of a cached 503 shields a struggling origin from fifty million retries, and the origin sees one probe per TTL per edge. | `slide 24` | core |
| S08-C113 | Almost never cache a 404. A 404 for a file that is about to exist keeps being served until its TTL runs out: the next match's scorecard, or the newest live segment. | `slide 24` | correction |
| S08-C114 | Cloudflare's default edge TTL for a 404 is 3 minutes. | `slide 24` | detail |
| S08-C115 | The rule: a negative TTL must be far shorter than the time it takes the missing thing to appear. | `slide 24` | core |
| S08-C116 | The negative-caching recipe: `proxy_cache_valid 200 10s`, `proxy_cache_valid 404 1s`, and `proxy_cache_valid 500 502 503 504 2s`. | `slide 24` | detail |
| S08-C117 | Three sizes of the same card: 4,117 B of full JSON, 1,088 B gzipped, and 183 B for one ball as a gzipped JSON Patch. Measured on a synthetic T20 card with two innings, batting and bowling figures, and fall of wickets. | `slide 25` | measured |
| S08-C118 | With push, send the patch. SSE or MQTT carry the 183-byte patch. A phone that missed one sees a version gap and fetches the full card once. | `slide 25` | core |
| S08-C119 | With pull, do not put the version in the query. `?since=1841` gives every client its own URL and the hit rate collapses. | `slide 25` | core |
| S08-C120 | Publish one file that holds the version and the last few changes instead. | `slide 25` | detail |
| S08-C121 | Callback to Week 6: Cloudflare's Railgun, and now RFC 9842, carry deltas instead of whole bodies. | `slide 25` | story |
| S08-C122 | The versioned scorecard holds a `version` and a `recent` list of the last few balls. It is polled every 15 s. | `slide 26` | detail |
| S08-C123 | The media playlist holds `EXT-X-TARGETDURATION`, `EXT-X-MEDIA-SEQUENCE` and the last ten segment names. It is polled every 4 s. | `slide 26` | detail |
| S08-C124 | The mapping, line by line: version matches MEDIA-SEQUENCE, the recent changes match the last N segments, and the poll interval matches TARGETDURATION. | `slide 26` | core |
| S08-C125 | A small index that everyone polls, pointing at numbered pieces that never change. That design already has a name: HTTP Live Streaming. | `slide 26` | core |
| S08-C126 | Same loop, bigger bytes: a 1 KB scorecard every 15 s, a 228 B video playlist every 4 s, and one 823 KB 480p segment of 4 s fetched once. | `slide 27` | core |
| S08-C127 | The in-class demo: open Big Buck Bunny or Tears of Steel on videojs.org with DevTools Network open. Watch the master playlist, then a media playlist, then segment after segment. Throttle the network and watch it change rendition. | `slide 27` | detail |
| S08-C128 | The player does four things: read the master once and pick a rendition, reload that playlist every target duration, fetch each new segment into the buffer, and play from the buffer while it switches rendition when throughput changes. | `slide 28` | core |
| S08-C129 | `master.m3u8` is control, read once. It is the menu: three renditions with bandwidth, resolution and codecs. | `slide 28` | detail |
| S08-C130 | `stream_1/index.m3u8` is control, polled every 4 s. It lists the last ten segments of 4 s each and it changes every 4 s. | `slide 28` | core |
| S08-C131 | `stream_1/seg_000011.ts` is data, fetched once. It holds 4 s of audio and video, 823 KB, and it never changes. | `slide 28` | detail |
| S08-C132 | HLS keeps control and data apart. The small thing changes often, and the big thing never changes. | `slide 28` | core |
| S08-C133 | The master playlist gives each variant an `EXT-X-STREAM-INF` line with BANDWIDTH, RESOLUTION and CODECS, then the URI of its media playlist. | `slide 29` | detail |
| S08-C134 | The deck's own ffmpeg run produced three variants: 3,440,800 at 1280x720, 1,755,600 at 854x480, and 950,400 at 640x360. | `slide 29` | measured |
| S08-C135 | BANDWIDTH there is (video plus audio) times 1.1. For the top rung, (3000k + 128k) times 1.1 is 3,440,800. | `slide 29` | detail |
| S08-C136 | "Do not poll this again." The master does not change during the match, so fetch it once and cache it for minutes. | `slide 29` | detail |
| S08-C137 | Re-reading the menu is how a player learns a new path. That was standardised later as Content Steering. | `slide 29` | detail |
| S08-C138 | CODECS lets the player skip what it cannot decode, say HEVC down to H.264. That is a fallback, not a retry. | `slide 29` | detail |
| S08-C139 | Two reloads of the deck's live 360p playlist, 4.5 s apart at t = 47.0 s and t = 51.5 s. MEDIA-SEQUENCE went from 1 to 2, and the window moved from seg_000001 to seg_000010 up to seg_000002 to seg_000011. | `slide 30` | measured |
| S08-C140 | If the playlist changed, wait at least one target duration before you reload again. | `slide 30` | core |
| S08-C141 | If the playlist did not change, wait half a target duration, then try again. | `slide 30` | core |
| S08-C142 | If a segment keeps its media sequence number but changes its URI, the client "SHOULD halt playback". | `slide 30` | detail |
| S08-C143 | `EXT-X-PROGRAM-DATE-TIME` stamps each segment with a wall-clock time. | `slides 30, 37` | detail |
| S08-C144 | Source for the reload rules: RFC 8216 §6.3.4. | `slide 30` | story |
| S08-C145 | `EXT-X-ENDLIST` means no more segments. Read the playlist once and stop polling. VOD is a playlist that stopped changing. | `slide 31` | core |
| S08-C146 | The VOD sample has TARGETDURATION 10 and 64 segments: 63 of 10 s plus a last one of 5 s. | `slide 31` | measured |
| S08-C147 | Ten-second segments are old advice. Apple now says 6 s. | `slides 31, 33` | detail |
| S08-C148 | The query string `?pubId=…&videoId=…` is the same for everyone, so it caches. A per-viewer token would not. | `slide 31` | core |
| S08-C149 | A segment is a chain of 188-byte packets: a 4-byte header with a 0x47 sync byte, a 13-bit PID and a counter, then a 184-byte payload. | `slide 32` | core |
| S08-C150 | The payload carries a slice of video, a slice of audio, or the PAT and PMT tables. | `slide 32` | detail |
| S08-C151 | Measured on the deck's run: 720p 1,613,416 B is 8,582 packets at 3.3% overhead, 480p 823,440 B is 4,380 packets at 4.1%, and 360p 452,328 B is 2,406 packets at 5.6%. Every segment is an exact multiple of 188. | `slide 32` | measured |
| S08-C152 | Fixed length and a sync byte are both of Session 2's framing answers at once. 188 was chosen for ATM. | `slide 32` | core |
| S08-C153 | A 13-bit PID says whose packet it is, so audio, video and the tables share one byte stream. | `slide 32` | detail |
| S08-C154 | fMP4 and CMAF segments use boxes instead: a size, a type and a payload. That is TLV again, from Week 1. | `slide 32` | detail |
| S08-C155 | Overhead here means everything that is not audio or video payload. | `slide 32` | detail |
| S08-C156 | Peak segment requests are 50 M divided by the segment length: 25 M/s at 2 s, 16.7 M/s at 3 s, 12.5 M/s at 4 s, 8.3 M/s at 6 s, and 1.7 M/s at 30 s. | `slide 33` | core |
| S08-C157 | The latency floor is three times the segment length: 6 s, 9 s, 12 s, 18 s and 90 s for those five rows. | `slide 33` | core |
| S08-C158 | The board marks 4 s as the deck's own ffmpeg run, 6 s as Apple's advice, 3 s with "RPS?", and 30 s with "Too late!". | `slide 33` | detail |
| S08-C159 | The trade: shorter segments mean more requests, more keyframes and more round trips. Longer segments mean more latency and slower reaction to bandwidth. | `slide 33` | core |
| S08-C160 | A hybrid ladder uses 1 to 2 s segments at start-up for a fast first frame, and longer ones later. ffmpeg has a knob for it: `-hls_init_time 1 -hls_time 4`. | `slide 33` | detail |
| S08-C161 | Playlist traffic is harder than segment traffic. | `slide 34` | correction |
| S08-C162 | The playlist is about 230 B gzipped and changes every 4 s. A segment is 450 to 1,600 KB and never changes. | `slide 34` | core |
| S08-C163 | The playlist TTL is half a target duration or less. The segment TTL is minutes to forever. | `slide 34` | core |
| S08-C164 | A stale playlist stalls playback, or it points at deleted files. A stale segment is harmless. | `slide 34` | core |
| S08-C165 | The playlist is billed by requests, like the scorecard. The segment is billed by bytes. | `slide 34` | detail |
| S08-C166 | The board asks "Rendition: poll every second → RPS?" At 1 s that is 50 M requests a second at the peak. At the RFC's one target duration it is 12.5 M. | `slide 34` | measured |
| S08-C167 | The buffer holds the segments already downloaded ahead of the playhead. The deck's picture shows 12 s buffered and the next segment still downloading. | `slide 35` | core |
| S08-C168 | A large buffer survives a bad minute on a train. It costs latency, and memory on low-end phones and TV sticks. | `slide 35` | core |
| S08-C169 | A one-segment buffer gives the lowest latency. One slow segment and the picture stalls. | `slide 35` | detail |
| S08-C170 | More network means less buffer. On a fast link a refill takes a fraction of a segment, so a small buffer is enough. | `slide 35` | detail |
| S08-C171 | When the playlist stops moving, the buffer is what keeps the picture going. | `slide 35` | core |
| S08-C172 | The latency budget: about 2 s to encode, 4 s while the segment fills, about 2 s to the CDN, and a player hold-back of three target durations, which is 12 s. That is about 20 s behind the stadium with 4 s segments. | `slide 36` | core |
| S08-C173 | The encode and CDN times are typical guesses. The hold-back is the spec. | `slide 36` | detail |
| S08-C174 | Low-Latency HLS shrinks the biggest bar with four ideas from the first half of the class: parts, a blocking reload, preload hints and delta updates. | `slide 36` | core |
| S08-C175 | Parts are pieces of a segment, about 1 s each. Apple wants at least three times the P95 round trip. | `slide 36` | detail |
| S08-C176 | A blocking reload holds `?_HLS_msn=…` until that segment exists. That is long polling. | `slide 36` | core |
| S08-C177 | Preload hints name the next part early. They replaced HTTP/2 push in January 2020. | `slide 36` | detail |
| S08-C178 | Delta updates use `EXT-X-SKIP` to drop old entries from the reply. That is diffs, for playlists. | `slide 36` | detail |
| S08-C179 | With 1 s parts the 12 s hold-back becomes about 3 s, because Apple requires PART-HOLD-BACK of at least three parts. | `slide 36` | core |
| S08-C180 | The spoiler problem: a wicket at 0 s, the scorecard says W at about 10 s, and the video shows it at about 20 s. The spoiler window is about 10 s. | `slide 37` | core |
| S08-C181 | The fix: stamp each update with the ball's wall-clock time. The player knows the wall-clock time of every segment, so the app reveals an update only when playback passes it. | `slide 37` | core |
| S08-C182 | The two stamps that line up: `"at": "2026-09-27T03:16:44.1Z"` in the score update, and `EXT-X-PROGRAM-DATE-TIME: 2026-09-27T03:16:44.365+0000` on the segment. | `slide 37` | detail |
| S08-C183 | The player picks the next rendition at every segment, under a policy that the product sets. | `slide 38` | detail |
| S08-C184 | Throughput-based ABR measures how fast the last segments arrived and picks the highest rendition that fits. That is congestion control, one layer up. | `slide 38` | core |
| S08-C185 | Buffer-based ABR watches the buffer. Nearly empty, step down. Full, step up. | `slide 38` | core |
| S08-C186 | Netflix A/B tests of the buffer-based approach: 10 to 20% fewer rebuffers at a similar video rate. | `slide 38` | measured |
| S08-C187 | The policy behind every ABR rule: a stall is worse than a lower rendition. | `slide 38` | core |
| S08-C188 | Even the default is policy. Apple suggests starting cellular viewers on the 730 kbps variant and Wi-Fi viewers on 2 Mbps. | `slide 38` | detail |
| S08-C189 | Sources: Huang, Johari, McKeown, Trunnell and Watson, "A Buffer-Based Approach to Rate Adaptation", SIGCOMM 2014, and the Apple HLS authoring spec requirement 1.32. | `slide 38` | story |
| S08-C190 | Two questions at playback time: which CDN, and which edge. | `slide 39` | detail |
| S08-C191 | The shape: one app fans out to two CDN paths. Each path is edge, then mid-tier, then an origin. Two packagers write the same names. | `slide 39` | detail |
| S08-C192 | The mid-tier shields the origin. | `slide 39` | detail |
| S08-C193 | Four ways to steer: DNS by region or ISP (slow to change, because resolvers cache), each rendition listed once per CDN in the master for stream failover, Content Steering with a JSON file polled every TTL, and client failover where errors trip a circuit breaker and the next segment tries the other CDN. | `slide 39` | core |
| S08-C194 | Callback to Week 6: Fastly's 49 minutes. | `slide 39` | story |
| S08-C195 | ffmpeg's `delete_segments` keeps one unreferenced segment. The deck watched `seg_000000` vanish 4 s after it left the playlist. | `slide 40` | measured |
| S08-C196 | RFC 8216 says a removed segment MUST stay available for its own duration plus the playlist's duration: 4 plus 40, so 44 s here. | `slide 40` | core |
| S08-C197 | During an origin blip the CDN serves a stale playlist. It still lists a segment that the origin has deleted. | `slide 40` | core |
| S08-C198 | The result is a 404, negatively cached, and a stalled player. "Serve stale may cause player issues." | `slide 40` | correction |
| S08-C199 | The fixes: `-hls_delete_threshold 12`, a playlist TTL at half a target duration or less, serve a playlist stale for one target duration at most, and serve segments stale freely because they never change. | `slide 40` | core |
| S08-C200 | Apple's rule: treat a playlist as invalid when `Last-Modified` is more than three target durations behind `Date`. | `slide 40` | detail |
| S08-C201 | The deck's run, 360p rendition: at t = 47.0 s the playlist held seg_000001 to seg_000010 while the disk held seg_000000 to seg_000010. At t = 51.5 s the playlist held seg_000002 to seg_000011 while the disk held seg_000001 to seg_000011. | `slide 40` | measured |
| S08-C202 | The caching rules for a live stream, object by object. master.m3u8: TTL minutes, serve stale yes, 404 for 1 s. Media playlist: TTL half a target duration or less, serve stale one target duration at most, 404 for 1 s or not at all. Segment .ts: TTL long because it never changes, serve stale yes, 404 for 1 s at most at the live edge. score.json: TTL half your promise or less, serve stale while updating, 404 for 1 s and 5xx for 2 s. | `slide 41` | core |
| S08-C203 | One nginx location per file type. `~ \.m3u8$` gets `proxy_cache_valid 200 2s`, `proxy_cache_lock on` and `proxy_cache_use_stale updating`. `~ \.ts$` gets `proxy_cache_valid 200 10m` and `proxy_cache_valid 404 1s`. | `slide 41` | detail |
| S08-C204 | Gzip every playlist. Apple makes it a MUST. The two types to add are `application/vnd.apple.mpegurl` and `application/json`. | `slide 41` | core |
| S08-C205 | Keep per-viewer tokens out of the cache key. | `slide 41` | detail |
| S08-C206 | The one-liner: `ffmpeg -re -i input.mp4 -codec: copy -hls_time 4 -hls_list_size 5 -hls_playlist_type event -f hls index.m3u8`. | `slide 42` | detail |
| S08-C207 | `-re` reads at native speed: a file pretending to be a camera. | `slide 42` | detail |
| S08-C208 | `-codec: copy` does no re-encode, so it can only cut at keyframes that already exist. | `slide 42` | core |
| S08-C209 | `-hls_time 4` is a target segment length, not a promise. | `slide 42` | correction |
| S08-C210 | `-hls_list_size 5` asks for a five-segment window. | `slide 42` | detail |
| S08-C211 | `-hls_playlist_type event` makes the playlist append-only. | `slide 42` | detail |
| S08-C212 | Running the one-liner gave 8.33 s segments, not 4. x264's default keyframe interval is 250 frames, which is 8.33 s at 30 fps. | `slide 42` | measured |
| S08-C213 | The window was ignored. An EVENT playlist only grows, and 11 segments were listed at the end. | `slide 42` | measured |
| S08-C214 | For real: camera, then RTMP or SRT, then a transcoder, then a packager, then an origin, then a CDN. | `slide 42` | detail |
| S08-C215 | The ABR ladder encodes three renditions in one ffmpeg run. `split=3` decodes once and encodes three times. | `slide 43` | detail |
| S08-C216 | `-g 120 -keyint_min 120 -sc_threshold 0` fixes the keyframe interval. 120 frames is 4 s at 30 fps only. | `slide 43` | core |
| S08-C217 | A 24 fps source gave 5 s segments with the same `-g 120`. | `slide 43` | measured |
| S08-C218 | The three rungs: 3000k video with 128k audio, 1500k with 96k, and 800k with 64k. `maxrate` is 1.07 times the bitrate and `bufsize` is 1.5 times it. | `slide 43` | detail |
| S08-C219 | `-hls_flags independent_segments+delete_segments+omit_endlist+program_date_time` with `-hls_list_size 10` gives a 40 s window that never ends, stamped with wall-clock time. | `slide 43` | detail |
| S08-C220 | `-var_stream_map` and `-master_pl_name` write the three media playlists and the master in one run. | `slide 43` | detail |
| S08-C221 | Week 1 in the match: ports are 16 bits, so 28k test sockets per client IP. Base64 in the WebSocket handshake. | `slide 44` | detail |
| S08-C222 | Week 2 in the match: framing. SSE's blank line, WebSocket lengths, 188-byte packets. Playlists as control, segments as data. | `slide 44` | detail |
| S08-C223 | Week 3 in the match: fifty million held sockets, Little's Law, and nothing free per connection. | `slide 44` | detail |
| S08-C224 | Week 4 in the match: the origin. `proxy_cache_lock`, `use_stale`, and one location per file type. | `slide 44` | detail |
| S08-C225 | Week 5 in the match: ETag and 304, keep-alive, the 101 Upgrade, and push's death shaping LL-HLS. | `slide 44` | detail |
| S08-C226 | Week 6 in the match: tiers, collapsing, negative caching, and paying per request or per byte. | `slide 44` | detail |
| S08-C227 | Week 7 in the match: jitter, the live-edge 404, stale-if-error, failover, and who decides "worse". | `slide 44` | detail |
| S08-C228 | Week 8 in the match: HLS is a playlist, polled like a scorecard, pointing at bytes that never change. | `slide 44` | detail |
| S08-C229 | "Every week showed up in one match. That was the point of the course." | `slide 44` | story |
| S08-C230 | Idea 1: pull scales through caches, and push scales through machines. The same answer for everyone belongs in a CDN. A different answer per person means you are buying sockets. | `slide 45` | core |
| S08-C231 | Idea 2: number the pieces, then cache them forever. A small changing index plus numbered pieces that never change. The versioned scorecard and the HLS playlist are one design. | `slide 45` | core |
| S08-C232 | Idea 3: latency is a budget you spend on safety. Poll intervals, TTLs, segment length and hold-back all add up. Decide where each second goes. | `slide 45` | core |
| S08-C233 | Idea 4: know which bill you are on. Scorecards and playlists are billed per request. Segments are billed per byte. | `slide 45` | core |
| S08-C234 | The assignment, "a match on your laptop": an nginx origin with `score.json` and the ffmpeg ladder, an nginx mid-tier cache in front, and 1,000 simulated viewers that are pollers and players. | `slide 46` | detail |
| S08-C235 | Its four tasks: collapsing, staleness, break it, and the spoiler. | `slide 46` | detail |
| S08-C236 | The deliverable is code plus a one-page write-up with the numbers. The due date is a placeholder on the slide. | `slide 46` | detail |
| S08-C237 | Five homework items: the video.js demo with DevTools, the four bills again, SSE on HTTP/1.1 with seven tabs, the Hotstar post mapped to Week 3 and Week 4, and the 24 fps keyframe proof. | `slide 47` | detail |
| S08-C238 | The closing line: "Every live stream is a scorecard with bigger bytes." Then "Thank you for eight weeks." | `slide 48` | story |

**Tally.** 238 claims: 89 `core`, 96 `detail`, 26 `measured`, 17 `story` and 10 `correction`. On 2026-10-10 a re-tag pass moved 39 rows out of `core`, because one digest page must hold every core claim. Section 7, item 2 names the rows and gives the command that counts them.

## 4. Instructor questions

The deck asks few questions in words. It asks many on the board, in a kicker
line, or in a figure label. Each row below says where the question comes from,
and whether the slide puts it in words or we read it off the board. The
arithmetic in every model answer was recomputed on 2026-10-10.

| ID | The question | Model answer outline |
|---|---|---|
| S08-Q01 | Assignment: "a match on your laptop", with four tasks (slide 46). | Graded. No model answer. Section 7, item 1 proposes a module `s08-m13-assignment-prep` for the checklist, the concepts and the test plan. No page of this site may show the four task results. |
| S08-Q02 | "Why 140 bytes? Why 188?" (slide 32 kicker.) | Both numbers are fixed lengths chosen for the layer below, not for the payload above. 140 bytes is the SMS payload after the SS7 header, from Session 2. 188 bytes makes an MPEG-TS packet fit the ATM cell train of the day. Section 6 gives the ATM derivation and its reference. The teaching point: a fixed length is one of the two framing answers, and the number comes from somebody else's constraint. |
| S08-Q03 | "How long should a segment be?" (slide 33 title.) | There is no single answer, only a trade. Peak segment requests are 50 M divided by the segment length. The latency floor is three times the segment length, because the player holds back three segments. So 2 s gives 25 M requests a second and a 6 s floor, and 6 s gives 8.3 M and an 18 s floor. Pick the shortest segment whose request rate your CDN contract can pay for. A hybrid ladder gets both: short segments at start-up, longer ones later. |
| S08-Q04 | The board writes "RPS?" next to the 3 s row (slide 33). | Segments: 50,000,000 ÷ 3 = 16.7 M requests a second at the peak. Playlists at one target duration: 50,000,000 ÷ 3 = 16.7 M more. So about 33 M requests a second in total, and the playlist half is the harder half. The latency floor is 3 × 3 = 9 s. |
| S08-Q05 | "Rendition: poll every second → RPS?" (slide 34 board.) | 50,000,000 ÷ 1 = 50 M requests a second at the peak. The RFC rule, one target duration, gives 50,000,000 ÷ 4 = 12.5 M. So a 1 s poll costs four times the requests and returns no extra information, because the playlist only changes every 4 s. Three of every four responses are an unchanged body or a 304. |
| S08-Q06 | "At list price, push is the cheapest per match and the CDN the dearest. Hold that thought." Why hold it? (slides 16, 19.) | Because list price is not the price anybody pays, and the bill is not the only cost. Slide 19 gives three reasons to hold it: the answer is cacheable, the server is stateless, and the path is already paid for by the video. Homework 2 shows the arithmetic. At a negotiated $0.02 per GB with no request fee, the same 9.6 TB costs about $192 a match, which beats the push fleet. Push also buys the operational costs that no bill shows: reconnect storms, rebalancing, and a fleet sized for the peak. |
| S08-Q07 | "Every fallback gives you something worse than ideal. When does worse stop being acceptable, and who decides?" (slide 38.) | The player decides, at every segment boundary, under a policy that the product sets. The policy behind every ABR rule is one sentence: a stall is worse than a lower rendition. Throughput-based ABR reads the last few segment download rates. Buffer-based ABR reads the buffer level. Netflix measured 10 to 20% fewer rebuffers from the buffer-based rule at a similar video rate. Even the starting rendition is policy, not physics. |
| S08-Q08 | "Which CDN? Which edge?" (slide 39 figure labels.) | Four mechanisms answer the first question, at four speeds. DNS answers it per region or ISP, and changes slowly because resolvers cache. The master playlist answers it by listing each rendition once per CDN. Content Steering answers it with a small JSON file that the player polls. Client failover answers it per segment, when errors trip a circuit breaker. The second question, which edge, belongs to the CDN. The viewer never picks an edge. |
| S08-Q09 | Why did the one-liner give 8.33 s segments and not the 4 s it asked for? (slide 42.) | `-codec: copy` copies the encoded video, so it can only cut where a keyframe already exists. The source came from x264 at its default keyframe interval of 250 frames. At 30 fps that is 8.33 s. So `-hls_time 4` is a target, not a promise. The fix is to re-encode with a fixed keyframe interval, which slide 43 does. |
| S08-Q10 | `?since=1841` collapses the hit rate, but `?pubId=…&videoId=…` caches well. What is the difference? (slides 25, 31.) | The query string is part of the cache key. `?since=1841` carries a per-client value, so every client gets its own key and every request is a miss. The VOD query string carries the same two values for every viewer, so all of them share one key. The rule: a cache key may hold values that describe the object, never values that describe the asker. The fix for diffs is to publish one file that holds the version and the last few changes. |
| S08-Q11 | "250k test sockets need at least 9 source IPs." Where does 9 come from? (slide 12.) | One client IP has 28,232 ephemeral ports per destination, from 32768 to 60999. A socket needs a free local port, so one IP gives at most 28,232 sockets to one destination address and port. 250,000 ÷ 28,232 = 8.86, so the floor is 9 source IP addresses. A port is 16 bits, from Session 1, and the range is a Linux default. |
| S08-Q12 | Homework 1: play the video.js demo with DevTools open, log two minutes of requests, then throttle and catch a rendition switch. (slide 47.) | Answer: needs a run. What the log must show: one master playlist fetch, then one media playlist fetch every target duration, then one segment fetch per segment. The playlist request count over two minutes is about 120 divided by the target duration. After the throttle, the segment path changes from one `stream_N` folder to another, and the master is not fetched again. Record the HTTP status of each playlist reload. An unchanged playlist may answer 200 or 304, and which one it is decides the request fee. |
| S08-Q13 | Homework 2: re-run the four bills for a 15 s poll, and for a negotiated $0.02 per GB with no request fee. Which design wins now? (slide 47.) | A 15 s poll doubles requests and bytes to 19.2 B and 19.2 TB. S3 straight to phones goes to about $9.4K a match, from $7,680 of GET fees plus $1,728 of egress. CloudFront India goes to about $25.0K, from $23,040 of request fees plus $1,984 of byte fees, so requests stay 92% of it. Push does not move at all, because push sends one message per ball and never per poll. At $0.02 per GB with no request fee, 9,600 GB costs $192 a match, and 19,200 GB costs $384. The CDN then wins outright and keeps the stateless design. The lesson: the ranking on slide 16 is a property of the price list, not of the architecture. |
| S08-Q14 | Homework 3: serve the scorecard over SSE on HTTP/1.1, open seven tabs, and explain the one that waits. Then fix it with HTTP/2. (slide 47.) | A browser allows about six connections per origin over HTTP/1.1. An SSE response never ends, so each of the first six tabs holds one connection for good. The seventh tab queues before it ever sends a request, so it shows no data and no error. HTTP/2 carries every stream on one connection, so the seventh tab gets a stream immediately. The deeper point: SSE turns the six-connection budget into a six-tab budget, and the 2-connection rule of Session 1 and 5 is the ancestor of the bug. |
| S08-Q15 | Homework 4: read the Hotstar pubsub post and map each of its five steps to a Week 3 or Week 4 idea. (slide 47.) | Step 1, one node at 250k connections, is the C10K to C10M question and the per-connection cost of Week 3. Step 2, the publisher split from the subscribers, is the control and data plane split, and Mnesia's node limit is a quorum cost. Step 3, the ELB wall, is Week 3's "nothing is free per connection" applied to the load balancer, plus the pre-warming habit. Step 4, five bridged clusters, is sharding with a fan-out tree. Step 5, the reverse bridge, moves the fan-out to a pull, which is Week 4's reverse proxy shape turned inside out. Section 7 records that the post itself could not be fetched. |
| S08-Q16 | Homework 5, "the one to do if you do only one": run the ladder on a 24 fps file, prove from the playlist that the segments are 5 s, then switch to time-based keyframes and prove they are 4 s. (slide 47.) | Answer: needs a run. The model: `-g 120` counts frames, not seconds. 120 ÷ 24 = 5 s, and the `EXTINF` lines in the media playlist must read about 5.000000. A time-based option, `-force_key_frames expr:gte(t,n_forced*4)`, asks for a keyframe every 4 s of wall-clock time at any frame rate, so the `EXTINF` lines must read about 4.000000. Proof comes from the playlist, not from the command. The teaching point: a frame count is a frame count, and only a time expression survives a change of frame rate. |
| S08-Q17 | In-class demo: open Big Buck Bunny or Tears of Steel on videojs.org with DevTools Network open. (slide 27.) | What the class must see, in this order: the master playlist once, then one media playlist, then segment after segment. Then throttle the network and watch the segment path move to a lower rendition. The demo is the whole class in one network tab: a small index polled on a clock, and large numbered pieces fetched once. |
| S08-Q18 | Closing: which week of the course shows up where inside one match? (slide 44.) | Week 1, ports and base64. Week 2, framing by length or delimiter, and control against data. Week 3, held sockets and Little's Law. Week 4, the origin cache rules. Week 5, ETag and 304, keep-alive and the 101 upgrade. Week 6, tiers, collapsing, negative caching and the two bills. Week 7, jitter, the live-edge 404 and failover. Week 8, HLS as a polled playlist over bytes that never change. This is the best "design" question in the deck, because it has eight correct answers. |
| S08-Q19 | Closing, idea 4: which bill are you on? (slide 45.) | Work out the mean object size. Below about 11 KB the request fee dominates, and above it the byte fee does. The break-even follows from two CloudFront India unit prices: $1.20 of request fee per million responses, against $0.109 per GB. $1.20 ÷ ($0.109 ÷ 1,000,000,000 bytes) gives 11,009 bytes. So a playlist and a scorecard are request-billed, and a segment is byte-billed. Two objects in one system can sit on opposite sides of that line. |
| S08-Q20 | Closing, idea 1: for your own feature, pull or push? (slide 45.) | Ask one question first: is the answer the same for everybody? If yes, pull it through a cache, because one cached copy serves every viewer. If no, you are buying sockets, and the fleet grows with the audience. Hotstar's own sentence is the test case. Their social feed was tied to live moments, so it had to be pushed. A scorecard is one file, identical for fifty million people, so it does not. |

**Count.** 20 instructor questions: one graded assignment, five homework items, one in-class demo, three closing questions and ten "ask the class" or board questions.


## 5. Modules

Twelve modules, in the order of `README.md`. Pages 1 to 3, 46, 47 and 48 feed
section 3 and section 4, not a module. Every `core` claim appears in the
**covers** list of at least one module below. Section 7, item 2 gives the
command that proves it.

### s08-m01-push-or-pull

- **Title:** Ask again, or wait to be told. **Minutes:** 22.
- **Big idea:** One small file for fifty million phones has two delivery shapes, and the choice between them decides whether a cache can help you at all.
- **Covers:** S08-C06, S08-C07, S08-C08, S08-C09, S08-C10, S08-C11, S08-C12, S08-C13, S08-C14, S08-C15, S08-C16, S08-C17, S08-C18, S08-C19, S08-C20, S08-C21, S08-C22, S08-C23, S08-C24, S08-C25, S08-C26.
- **Prereqs:** s05-m02-keepalive-host, s05-m03-validators-vary, s03-m06-stateless-servers, s07-m04-retry-mechanics.
- **Threads:** T-where-state-goes, T-littles-law, T-law-or-habit.

**Pretest.**
1. Fifty million phones want the same 1 KB file. Which shape lets a CDN help? *Answer: the one where each phone asks. A cache can answer a request. A cache cannot hold a socket for somebody.*
2. A phone polls every 15 s. Two caches on the path hold the answer for 10 s each. How stale can the screen be? *Answer: up to 35 s, the poll interval plus both TTLs.*
3. In long polling, how long does the server hold one request? *Answer: until there is news, or until a deadline. The deck uses 25 s.*

**Rung 1, the picture.** A big railway station has one departure board. Thousands of people look up at it every half minute, and nobody tells the board who looked. That is polling. Now imagine the station instead gives every traveller a walkie-talkie, keeps a list of who holds one, and calls each person when a train changes. That is push. The board scales because it is the same board for everybody. The walkie-talkies scale only if you buy more walkie-talkies and more staff to hold the list. *Where it breaks:* a traveller who looks up at the board sees it instantly, while a polling phone waits for its next tick and then for a network round trip.

**Rung 2, how it works.**
1. The client asks for one fixed URL, for example `/match/412/score.json`.
2. The client attaches the ETag it already holds, in an `If-None-Match` header.
3. The server compares. On a change it sends 200 with the new body. On no change it sends 304 with an empty body.
4. The client renders only on a 200. On a 304 it keeps the screen it has.
5. The client waits one interval multiplied by a random jitter factor, then returns to step 1.
6. Long polling changes step 3 only. The server holds the request open until news arrives, or until its own deadline.

**Rung 3, the real thing.** Slide 6 gives the whole client in 14 lines. The interval is `15_000` ms and the jitter is `0.8 + Math.random() * 0.4`, which is plus or minus 20%. The loop calls `setTimeout(poll, EVERY * jitter)` from inside `poll`, so one loop never overlaps itself. Slide 7 gives the long-poll wire form: `GET /match/412/score?after=1841`, a pause, then `200 OK` with `{"version":1842,...}`, then the next request with `after=1842`. Two timeouts bound that pause, and both default to 60 s: nginx `proxy_read_timeout` and the AWS load-balancer idle timeout.

**Rung 4, exam depth.**
- *Why cricket sets the clock.* Balls arrive 25 to 45 s apart, and an over takes 4 to 5 minutes (S08-C06). A poll faster than the event rate buys nothing. A poll slower than the event rate loses balls. Every TTL in the later modules is derived from this one number.
- *Why the first family is older.* HTTP/1.0 closed the connection after every response (S08-C16). "Ask again" was not a design choice at first. It was all the protocol could do.
- *The held-socket arithmetic.* Little's Law says concurrency equals arrival rate times hold time. Polling holds a request for about 30 ms. Long polling holds it for 25 s. Nothing else changed, and concurrency went up by a factor of about 800.
- *What if you drop the jitter?* Fifty million phones that started together keep polling together. Each interval then delivers one spike instead of a flat rate. The peak becomes the whole interval worth of traffic in one second.
- *The herd that long polling builds.* A wicket completes 20 M responses inside one second, and the same 20 M phones send a new request in the next second (S08-C25). Push does not remove the herd. It synchronises it.
- *The design came back.* The blocking playlist reload of Low-Latency HLS is long polling with a query parameter instead of a header (S08-C26). Module 9 teaches it. A design that lost once can win later, when the constraint around it changes.
- *Exam prompt.* A product manager asks for sub-second score updates for fifty million viewers. What do you tell her? *Model answer: sub-second means push, which means fifty million held sockets and a stateful fleet. Offer the arithmetic first. Then offer the alternative: a 2 s poll with a 1 s edge TTL costs ordinary GET requests and keeps every cache in play.*

**Misconceptions.**
- S08-M01: "A 304 response saves the request." Wrong. The round trip, the headers and the CDN request fee all happen. Only the body, the parse and the re-render are saved. Distractor in checks 2 and 3.
- S08-M02: "Push is always fresher, so push is always better." Wrong. Push buys freshness with held sockets, a stateful fleet and no cache. The freshness gap at a 15 s poll is smaller than the gap between balls. Distractor in check 1.
- S08-M03: "Long polling needs no socket between events, because the client is just waiting." Wrong. A held request is a held socket, at the client, at every proxy and at the server. Distractor in checks 1 and 4.
- S08-M04: "Jitter makes the data fresher." Wrong. Jitter spreads the same number of requests across the interval. It lowers the peak and changes no average. Distractor in check 5.

**Diagrams.** (1) Static: two columns, "the client asks" and "the server tells", each listing its members and its one-line consequence. Actors: phone, cache, server. (2) Step-by-step: one poll cycle, with the 304 branch and the 200 branch drawn separately. Actors: phone, edge cache, origin. (3) Step-by-step: one long-poll cycle, with the held interval shaded and both idle timeouts marked on the same axis. Actors: phone, nginx, origin.

**Interactives.** (1) *Poll or push cost dial* (P1). Inputs: viewers, poll interval, event rate, hold time. The learner sees requests a second, held sockets and worst-case staleness side by side. The learner discovers that the socket count tracks the hold time, not the audience alone. (2) *Jitter spreader* (P2). Inputs: viewers, interval, jitter percentage. The learner sees a histogram of request arrival times. The learner discovers that zero jitter turns a flat rate into one spike per interval.

**Predict, observe, explain.** Command: none in a repo, because no Session 8 code exists. Use the deck instead. Show the slide 6 client and ask the learner to predict the request rate for 50 M phones at `EVERY = 15_000`. Predict, then observe: 50,000,000 ÷ 15 = 3.33 M requests a second, which slide 15 confirms on its own 15 s line. Then ask what `0.8 + Math.random() * 0.4` changes. Observe: the mean interval stays 15 s, so the mean rate does not move.

- **Worked example.** A 30 s poll, 20 M average viewers, a 4-hour match. Requests: 20,000,000 × 14,400 ÷ 30 = 9.6 B. Peak at 50 M viewers: 50,000,000 ÷ 30 = 1.67 M a second. Held sockets with polling, at 30 ms at the edge: 1.67 M × 0.03 = about 50,000.
- **Faded example.** A 15 s poll, same audience. Requests: ____. Peak: ____. Held sockets at 30 ms: ____. *(19.2 B. 3.33 M a second. About 100,000.)*
- **Your turn.** Long polling at a 25 s hold, 50 M viewers. How many sockets are held between balls? *(50,000,000. The hold time is almost the whole interval, so every viewer has one open almost all the time.)*

**Checks.**
1. `mcq`: which delivery shape lets a CDN edge answer most requests? Answer: polling with ordinary GET requests. Distractor: long polling, because the request is still a GET (S08-M03). Distractor: Server-Sent Events, because it is still HTTP (S08-M02). Distractor: MQTT with a retained message, because the broker caches (S08-M02). Feedback: a cache can answer a request. A cache cannot hold a socket on your behalf.
2. `multi`: what does a 304 response save? Answer: the body bytes, the JSON parse, the re-render. Distractor: the CDN request fee (S08-M01). Distractor: the round trip (S08-M01). Feedback: the request still happens, so you still pay for it.
3. `numeric`: 50 M phones, a 20 s poll. Requests a second at the peak, in millions? Answer: 2.5. Distractor: 1.0 (a wrong divisor). Distractor: 0 (S08-M01: assuming 304s are free). Feedback: the peak rate is viewers divided by the interval, whatever the status code is.
4. `mcq`: a long-poll server holds each request for 25 s. What is the main cost? Answer: one open socket per viewer, almost all the time. Distractor: more bytes on the wire (S08-M03). Distractor: more CPU per response (S08-M03). Distractor: a longer TLS handshake (S08-M03). Feedback: Little's Law. Hold time times arrival rate is concurrency.
5. `predict`: you remove the jitter from the slide 6 client. What happens to the average request rate? Answer: nothing. Distractor: it rises (S08-M04). Distractor: it falls (S08-M04). Feedback: jitter moves requests inside the interval. It does not add or remove any.

**Review cards.**
- Q: What is the worst-case staleness of a polled file? A: The poll interval plus every cache TTL on the path.
- Q: Why can a CDN not help a push design? A: There is no request to answer. Each viewer holds a private socket.
- Q: How much jitter does the deck apply, and why? A: Plus or minus 20%, so fifty million phones do not poll on the same second.
- Q: Which two 60 s defaults bound a long-poll hold? A: nginx `proxy_read_timeout` and the load-balancer idle timeout.
- Q: Which modern HLS feature is long polling? A: The blocking playlist reload of Low-Latency HLS.
- Q: How often does a ball arrive in cricket? A: Every 25 to 45 s, with an over every 4 to 5 minutes.

**Lab.** Run a one-file origin and watch the conditional loop by hand. `mkdir -p /tmp/s08/m1 && cd /tmp/s08/m1 && printf '{"version":1841}' > score.json && python3 -m http.server 8080 &`. Then `curl -si localhost:8080/score.json | head -5` and copy the `ETag` value. Then `curl -si -H 'If-None-Match: <that value>' localhost:8080/score.json | head -3`. Expected: `304 Not Modified` and no body. Then `printf '{"version":1842}' > score.json` and repeat the second command. Expected: `200 OK` with the new body, because the ETag changed. Stop the server with `kill %1`.

### s08-m02-sse-websockets-mqtt

- **Title:** Three ways the server tells you. **Minutes:** 24.
- **Big idea:** Server-Sent Events, WebSockets and MQTT differ mainly in their framing and their direction, and all three pay the same price: one held socket per viewer.
- **Covers:** S08-C27, S08-C28, S08-C29, S08-C30, S08-C31, S08-C32, S08-C33, S08-C34, S08-C35, S08-C36, S08-C37, S08-C38, S08-C39, S08-C40, S08-C41, S08-C42, S08-C43, S08-C44.
- **Prereqs:** s08-m01-push-or-pull, s01-m08-framing, s02-m07-smtp-mime, s05-m07-http2-frames.
- **Threads:** T-framing, T-encapsulation, T-alphabets, T-skip-unknown.
- **Site note:** this module teaches the three push protocols only. The cost of holding their sockets belongs to module 3.

**Pretest.**
1. An SSE event ends where? *Answer: at a blank line. SSE frames by delimiter.*
2. A WebSocket frame says its payload length where? *Answer: in the second byte, and in 2 or 8 more bytes when the value is 126 or 127.*
3. Who copies one MQTT message to fifty million subscribers? *Answer: the broker. The publisher sends one PUBLISH.*

**Rung 1, the picture.** Three ways a friend keeps you up to date on a match. The first friend reads the score aloud down one open phone line and never lets you speak. That is SSE. The second friend swaps the phone for a walkie-talkie, so both of you can talk, and each message starts with "this message is 40 words long". That is a WebSocket. The third friend does not call you at all. A radio station does. You tune to the station once, the station gets the score from one scorer, and everybody tuned in hears it. That is MQTT with a broker. *Where it breaks:* a radio station spends the same power whether ten or ten million people listen. A broker spends one process, one buffer and one keepalive timer per listener.

**Rung 2, how it works.**
1. **SSE.** The client sends an ordinary GET with `Accept: text/event-stream`. The server answers 200 with `Content-Type: text/event-stream` and then never ends the body. Each event is a group of `id`, `event` and `data` lines, closed by one blank line. On a drop, the browser reconnects and sends `Last-Event-ID`, and the server replays from there.
2. **WebSocket.** The client sends a GET with `Upgrade: websocket`, `Connection: Upgrade`, a `Sec-WebSocket-Key` and `Sec-WebSocket-Version: 13`. The server answers 101 Switching Protocols with `Sec-WebSocket-Accept`. After that the connection carries frames, not HTTP messages.
3. **MQTT.** The client sends CONNECT with a keepalive, gets CONNACK, sends SUBSCRIBE for a topic, gets SUBACK. The scorer sends one PUBLISH to the broker. The broker copies it to every subscriber of that topic.

**Rung 3, the real thing.** Slide 8 shows a live SSE body: one `retry: 5000` line, then an `id`, `event` and `data` group for ball 1842, a blank line, then the group for ball 1843. Slide 9 shows the handshake and then the frame layout, field by field: 1 byte of FIN, RSV and opcode, 1 byte of MASK and length, 0, 2 or 8 bytes of extended length, 0 or 4 bytes of masking key, then the payload. The accept value is base64 of SHA-1 of the client key joined to a fixed GUID, which is Week 1 base64 again. Slide 10 shows the MQTT exchange, with `keepalive=60`, a QoS 1 subscription, `retain=1` on the publish, and the two-byte ping pair `C0 00` and `D0 00`.

**Rung 4, exam depth.**
- *The two framing answers, in one slide each.* SSE ends an event at a blank line, which is the lone dot of SMTP in different clothes. A WebSocket writes the length first. Session 2 said every protocol must pick one. Here are both, side by side (S08-C28, S08-C37).
- *Why client frames are masked.* A caching proxy that does not understand the 101 upgrade may keep parsing bytes as HTTP. Masking every client-to-server frame with a fresh key makes it impossible to place chosen plaintext that looks like a request line (S08-C35).
- *Why the length field has three sizes.* 0 to 125 fits in the 7 spare bits of byte two. 126 means read 2 more bytes. 127 means read 8 more. Small frames cost no extra bytes, and a huge frame is still possible. MQTT answers the same question with a varint: 7 bits of value per byte and a top bit that says "more" (S08-C42).
- *The six-connection trap.* Over HTTP/1.1 a browser allows about six connections per origin, and an SSE response never ends. So six tabs can each hold one for good, and a seventh tab waits with nothing on screen. HTTP/2 puts every stream on one connection and the trap disappears (S08-C30). This is homework 3, question S08-Q14.
- *A retained message is a cache.* The broker keeps the last value of the topic and hands it to each new subscriber at once (S08-C40). That is the same idea as a cached response, built into a stateful server, and it serves exactly one hop.
- *At-least-once is not once.* QoS 1 can deliver a duplicate. Make every update carry a version number and apply it by that number. A duplicate then changes nothing (S08-C41). This is the idempotency rule of Session 7, applied to a feed.
- *What if you send the diff only?* A phone that missed one message would show a wrong score for ever. So the version number must be in every message, and a gap must trigger one full fetch. Module 6 builds that.
- *A keepalive is not free.* Two bytes on the wire, but it wakes the phone radio and holds a NAT mapping open (S08-C43). Module 3 turns that into 333k pings a second.
- *Exam prompt.* You must deliver one score to fifty million phones and accept one tap back from each phone. Which protocol, and why? *Model answer: not SSE alone, because SSE goes one way. Either a WebSocket, or SSE down plus ordinary POST requests up. The second option keeps the upward path stateless and cacheable at the edge, and it costs one held socket instead of two.*

**Misconceptions.**
- S08-M05: "SSE is two-way, because it runs over TCP." Wrong. SSE is one response, server to client. Anything the phone says travels in a separate ordinary request. Distractor in checks 1 and 5.
- S08-M06: "A WebSocket is still HTTP after the 101." Wrong. After 101 the bytes are WebSocket frames. An HTTP proxy that keeps parsing them is the reason client frames are masked. Distractor in checks 2 and 3.
- S08-M07: "Masking protects the payload from eavesdroppers." Wrong. The mask key travels in the same frame, so it hides nothing. It only stops chosen bytes from looking like a request. Use TLS for secrecy. Distractor in check 3.
- S08-M08: "MQTT fan-out is free, because the publisher sends one message." Wrong. One PUBLISH in, N copies out, and the broker holds N sockets to send them. Distractor in check 4.
- S08-M09: "QoS 1 means exactly once." Wrong. QoS 1 means at least once, so duplicates arrive. Version numbers make them harmless. Distractor in check 6.

**Diagrams.** (1) Static: the three protocols in three columns, with rows for framing, direction, who holds state, and what happens on a drop. Actors: phone, server, broker. (2) Step-by-step: the WebSocket upgrade, four messages, with the byte layout of the first frame revealed at the last step. Actors: client, server. (3) Static: one MQTT fan-out tree, one publisher to one broker to N subscribers, with the per-subscriber cost labelled on each leg.

**Interactives.** (1) *Frame builder* (P1). Inputs: payload length, masked or not, opcode. The learner sees the exact header bytes appear and the total overhead. The learner discovers that the header grows in three steps, not smoothly. (2) *SSE tab budget* (P2). Inputs: protocol version, number of tabs. The learner sees which tabs get data. The learner discovers that the seventh HTTP/1.1 tab never sends its request. (3) *Varint counter* (P2). Input: a length in bytes. The learner sees the MQTT Remaining Length encoding and the number of bytes it needs.

**Predict, observe, explain.** Show the slide 9 handshake. Predict: how many bytes of header does a 183-byte masked client frame carry? Observe: 2 bytes of the fixed header, 2 bytes of extended length, because 183 is above 125, and 4 bytes of masking key. That is 8 bytes, so 191 bytes on the wire. Then ask what an unmasked 183-byte server frame costs. Observe: 4 bytes, so 187 on the wire. The captured layout comes from slide 9.

- **Worked example.** Frame a 100-byte text payload from client to server. Byte 1: FIN set, opcode 1. Byte 2: MASK set, length 100. Extended length: 0 bytes, because 100 is at most 125. Masking key: 4 bytes. Total header 6 bytes, total frame 106 bytes.
- **Faded example.** Frame a 70,000-byte binary payload from server to client. Byte 2 length field: ____. Extended length bytes: ____. Masking key bytes: ____. Total header: ____. *(127, because 70,000 is above 65,535. 8. 0, because server frames are not masked. 10 bytes.)*
- **Your turn.** Encode an MQTT Remaining Length of 300 as a varint. *(`AC 02`. 300 = 2 × 128 + 44, so the low byte is 44 with the continue bit set, which is 0xAC, then 2.)*

**Checks.**
1. `mcq`: a phone on an SSE stream wants to send a tap to the server. How? Answer: in a separate ordinary HTTP request. Distractor: as an SSE event in the other direction (S08-M05). Distractor: by sending a `data:` line up the same body (S08-M05). Distractor: it cannot send anything at all (S08-M05). Feedback: SSE is one response, one way. The upward path is normal HTTP.
2. `bytes`: a server-to-client WebSocket frame carries 200 bytes of text. How many header bytes? Answer: 4. Distractor: 2 (forgetting that 200 is above 125). Distractor: 8 (S08-M06: adding a masking key to a server frame). Feedback: 2 fixed bytes, 2 extended-length bytes, no mask on the server side.
3. `mcq`: why are client-to-server frames masked? Answer: so stray bytes can never look like an HTTP request to a caching proxy. Distractor: to encrypt the payload (S08-M07). Distractor: to detect corruption (S08-M07). Distractor: to compress repeated bytes (S08-M07). Feedback: the key travels in the frame, so masking is not secrecy.
4. `numeric`: 50 M subscribers on one topic. How many PUBLISH messages does the scorer send, and how many copies leave the brokers? Answer: 1 and 50,000,000. Distractor: 1 and 1 (S08-M08). Feedback: fan-out moves the cost from the publisher to the broker fleet.
5. `multi`: which of these frame by delimiter? Answer: SSE events, SMTP message bodies. Distractor: WebSocket frames (S08-M06). Distractor: MPEG-TS packets (a fixed length, taught in module 8). Feedback: a blank line is a delimiter. A length field is not.
6. `predict`: an MQTT client at QoS 1 receives ball 1842 twice. What does a version-keyed client show? Answer: the same score, once. Distractor: the score twice (S08-M09). Distractor: an error (S08-M09). Feedback: apply by version and a duplicate becomes a no-op.

**Review cards.**
- Q: What ends one SSE event? A: A blank line.
- Q: Which header does a browser send when it reconnects an SSE stream? A: `Last-Event-ID`.
- Q: What status code completes a WebSocket upgrade? A: 101 Switching Protocols.
- Q: How is `Sec-WebSocket-Accept` built? A: base64 of SHA-1 of the client key joined to a fixed GUID.
- Q: What do the WebSocket length values 126 and 127 mean? A: Read 2 more length bytes, or read 8 more.
- Q: What is an MQTT retained message? A: The last value of a topic, kept by the broker and sent to each new subscriber at once.
- Q: Why are duplicates harmless at MQTT QoS 1? A: Each update carries a version number, so a repeat applies nothing new.

**Lab.** Watch SSE framing with no client library. `mkdir -p /tmp/s08/m2 && cd /tmp/s08/m2`. Write a two-line server with `python3 -c` or a file, then stream it. The quickest honest version uses `nc`: run `printf 'HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\n\r\nretry: 5000\n\nid: 1842\nevent: ball\ndata: {"runs":4}\n\n' | nc -l -p 8081 -q 5` in one terminal. In a second terminal run `curl -N -s localhost:8081`. Expected: curl prints the event and keeps waiting, because the body never ended. Note the blank line after each group. Then run the same curl with `-v` and confirm no `Content-Length` and no `Transfer-Encoding: chunked` appear, so the body ends only when the connection ends.

### s08-m03-hotstar-sockets

- **Title:** Fifty million held sockets, and what each one costs. **Minutes:** 25.
- **Big idea:** Hotstar reached fifty million concurrent sockets in five steps, and every step bought capacity by adding machines, because a held socket is a resource that no cache can share.
- **Covers:** S08-C45, S08-C46, S08-C47, S08-C48, S08-C49, S08-C50, S08-C51, S08-C52, S08-C53, S08-C54, S08-C55, S08-C56, S08-C57, S08-C58, S08-C59, S08-C60, S08-C61.
- **Prereqs:** s08-m02-sse-websockets-mqtt, s03-m07-limits, s03-m08-in-the-wild, s01-m02-ports-and-queue.
- **Threads:** T-littles-law, T-where-state-goes, T-honest-benchmarks.

**Pretest.**
1. One box holds 250,000 MQTT connections and has 32 GiB of memory. How much memory per connection? *Answer: about 137 KB, counting everything.*
2. You add a new broker box during a match. How many connections does it get? *Answer: none, until somebody reconnects.*
3. Same audience, same file. Why does push need a thousand times the concurrency of polling? *Answer: Little's Law. The hold time went from milliseconds to hours.*

**Rung 1, the picture.** A cloakroom at a concert. Polling is a ticket window: each person steps up, gets an answer in a few seconds, and leaves. One window serves thousands an hour because nobody stays. Push is a coat rack: every person hangs a coat and it stays there all night. Fifty thousand coats need fifty thousand hooks, and no amount of staff speed changes that. Adding a new rack halfway through the show helps nobody, because the coats are already hanging somewhere else. *Where it breaks:* a coat costs nothing while it hangs, and a held socket keeps costing memory, a keepalive timer and a NAT mapping every minute of the night.

**Rung 2, how it works.** Hotstar climbed in five steps, and each step hit a different ceiling.
1. One EMQX broker on one `c5.4xlarge` held 250,000 connections with latency inside bounds.
2. They split the publisher nodes from the subscriber nodes and reached 2 M subscribers. The Mnesia database behind EMQX wants fewer than 10 nodes in a cluster, so the cluster could not simply grow.
3. The load balancer became the wall. A Classic ELB dropped connections at about 500,000 without pre-warming, and reached 4 M per pre-warmed load balancer.
4. They ran five clusters of eight subscribe nodes each, bridged together, and passed 10 M.
5. They added a reverse bridge: a Go service on each subscriber node pulls from the publisher instead of waiting to be pushed to. On 200 nodes that reached 50 M.

**Rung 3, the real thing.** Slide 12 itemises the per-connection bill in four groups. Machines: 100k to 200k connections per box on the deck's own board, against Hotstar's measured 250k. Memory: kernel socket buffers, TLS session state and the broker's per-client process, which is about 137 KB each when 250k phones share a 32 GiB box. Network: at a 60 s keepalive, 20 M idle phones send 20,000,000 ÷ 60, which is about 333,000 pings a second, before a single ball is bowled. Load balancers: one address for DNS to hand out instead of 200, an even spread, and every socket held twice. Slide 12 also records the soft `ulimit -n` default of 1,024, and the test-rig arithmetic: 28,232 ephemeral ports from 32768 to 60999, so 250,000 test sockets need at least 9 source IP addresses. Slide 13 then runs Little's Law twice on the same audience.

**Rung 4, exam depth.**
- *Little's Law, read carefully.* Pull: 1.67 M requests a second times about 0.03 s at the edge gives about 50,000 requests in flight. Push: 50 M viewers arrive across the match and each stays four hours, so 50,000,000 sockets are held. The ratio is 1,000. Note what did not change: the audience and the file. Only the hold time did.
- *Why the arrival rate is not the lever.* Push has a far lower arrival rate than polling, about 3,500 new connections a second across the match against 1.67 M requests a second. It still ends up with a thousand times the concurrency, because `W` grew by far more than `lambda` shrank.
- *Why a new box sits empty.* Connections live where they were made. Nothing moves them. So rebalancing a hot broker means disconnecting real viewers and hoping they land elsewhere (S08-C53). Compare a stateless fleet, where the next request can go anywhere.
- *Why the load balancer is a second copy of the problem.* It terminates one socket from the phone and opens one to a broker. The deck's own Week 3 line applies twice: nothing is free per connection (S08-C57).
- *The quote that explains their choice.* Hotstar wrote "Caching at any level is also not possible." That was true of their product: a social feed tied to live moments, different for each viewer. A scorecard is the opposite case, one file identical for fifty million people (S08-C50). Read the sentence with its context, not as a general law.
- *Why the reverse bridge worked.* Step 5 turned the last hop from a push into a pull. A subscriber node asks the publisher for what it needs, so the publisher holds no fan-out state for 200 nodes. The whole class in one engineering move.
- *Honest benchmark warning.* Every number here comes from one company's 2019 blog post about Classic ELB and EMQX with Mnesia. A network load balancer, a newer broker and a newer kernel all change the ceilings. Teach the shape of the climb, not the five numbers as limits of today.
- *Exam prompt.* Your broker fleet holds 10 M sockets on 50 boxes and one box is at 95% memory. What can you do during the match, and what can you only do between matches? *Model answer: during the match you can shed load by disconnecting a slice of clients and letting them reconnect elsewhere, which costs those users a gap. You cannot migrate a live socket. Between matches you resize the fleet and pre-warm the load balancer.*

**Misconceptions.**
- S08-M10: "Adding broker boxes during a spike fixes the spike." Wrong. New boxes receive no existing connections. Only a disconnect moves a client. Distractor in checks 1 and 4.
- S08-M11: "A load balancer in front of the brokers reduces the socket count." Wrong. It doubles it. The load balancer holds one socket to the phone and one to the broker. Distractor in check 2.
- S08-M12: "An idle connection costs nothing." Wrong. It costs memory, a file descriptor, a keepalive timer and a NAT mapping, every minute. 20 M idle phones generate 333k pings a second. Distractor in checks 3 and 5.
- S08-M13: "Push needs fewer resources because it sends fewer messages." Wrong. It does send fewer messages. It holds a thousand times the concurrency, and concurrency is what you buy machines for. Distractor in check 4.
- S08-M14: "One test machine can open 250,000 sockets to one server." Wrong. One source IP has 28,232 ephemeral ports per destination, so you need at least 9 source addresses. Distractor in check 6.

**Diagrams.** (1) Step-by-step: the five Hotstar steps, each adding one box or one layer, with the ceiling that stopped it written under each step. Actors: phone, load balancer, publisher, subscriber node. (2) Static: one held socket exploded into its costs, with memory, a file descriptor, TLS state, a broker process and a NAT entry labelled. (3) Static: Little's Law twice, two bars of the same audience with wildly different concurrency, with `L`, `lambda` and `W` written on each.

**Interactives.** (1) *Socket budget* (P1). Inputs: connections per box, memory per connection, box memory, keepalive seconds, audience. The learner sees boxes needed, memory headroom and pings a second. The learner discovers that memory, not CPU, sets the ceiling. (2) *Rebalance simulator* (P2). Inputs: current boxes, new boxes, disconnect percentage. The learner sees load per box over time. The learner discovers that a new box stays empty unless somebody is disconnected.

**Predict, observe, explain.** Show the slide 12 board figure of 100k to 200k connections per box and Hotstar's 250k. Predict how many boxes 50 M sockets need at 250k each. Observe: 50,000,000 ÷ 250,000 = 200 boxes, which is exactly the number in Hotstar's step 5. Then predict the memory per connection on a 32 GiB box at that density. Observe: 34,359,738,368 ÷ 250,000 = about 137,439 bytes, which the slide rounds to 137 KB.

- **Worked example.** 20 M idle phones, a 60 s keepalive. Pings a second: 20,000,000 ÷ 60 = 333,333. Bytes a second each way: 333,333 × 2 = about 667 kB, which is nothing. Packets a second: 333,333, which is not nothing for a middlebox.
- **Faded example.** 50 M phones, a 30 s keepalive. Pings a second: ____. Boxes at 250k each: ____. Memory at 137 KB each, in TiB: ____. *(1,666,667. 200. About 6.4 TiB.)*
- **Your turn.** A test rig must open 1 M sockets to one server address and port. How many source IP addresses, at least? *(1,000,000 ÷ 28,232 = 35.4, so 36.)*

**Checks.**
1. `mcq`: a broker box is overloaded mid-match. You add two more boxes. What happens next? Answer: nothing, until clients reconnect. Distractor: the load spreads within seconds (S08-M10). Distractor: the load balancer migrates sockets (S08-M10). Distractor: the cluster rebalances automatically (S08-M10). Feedback: a live socket cannot move. Only a disconnect moves a client.
2. `numeric`: 4 M phones behind one load balancer, in front of brokers. How many TCP connections exist in total? Answer: 8000000. Distractor: 4000000 (S08-M11). Feedback: the load balancer terminates one socket and opens another.
3. `numeric`: 30 M idle phones at a 60 s keepalive. Pings a second? Answer: 500000. Distractor: 30000000 (reading the keepalive as one second). Distractor: 0 (S08-M12). Feedback: each phone pings once per keepalive, so divide the audience by the keepalive.
4. `mcq`: same audience and same file. Why does push need a thousand times the concurrency of polling? Answer: the hold time went from milliseconds to hours. Distractor: push sends more messages (S08-M13). Distractor: push sends bigger messages (S08-M13). Distractor: push needs more load balancers (S08-M10). Feedback: Little's Law. Concurrency is arrival rate times hold time.
5. `multi`: which costs does one idle held socket carry? Answer: kernel socket buffers, a file descriptor, TLS session state, a NAT mapping. Distractor: CPU for message encoding (S08-M12: nothing is being sent). Distractor: CDN request fees (S08-M12: there is no request). Feedback: idle is not free. It is only quiet.
6. `numeric`: one client IP, one server address and port. The largest number of sockets, on a Linux default port range? Answer: 28232. Distractor: 65535 (S08-M14). Distractor: 1024 (confusing the port range with the descriptor limit). Feedback: the ephemeral range runs from 32768 to 60999.

**Review cards.**
- Q: How many connections did one EMQX node on a `c5.4xlarge` hold? A: 250,000, with latency inside bounds.
- Q: Where did Hotstar's Classic ELB drop connections without pre-warming? A: At about 500,000. Pre-warmed, it reached 4 M.
- Q: What did Hotstar's step 5 change? A: A reverse bridge, so each subscriber node pulls from the publisher. 200 nodes held 50 M.
- Q: Memory per connection at 250k sockets on a 32 GiB box? A: About 137 KB, counting kernel buffers, TLS state and the broker process.
- Q: Why does a new broker box not relieve a hot one? A: Existing sockets cannot move. Only a disconnect reassigns a client.
- Q: Pull against push, in Little's Law terms? A: 1.67 M a second times 0.03 s is 50,000 in flight. 50 M viewers times four hours is 50 M sockets.
- Q: Which sentence of Hotstar's must be read with its context? A: "Caching at any level is also not possible." It describes a per-viewer feed, not a shared file.

**Lab.** Measure the two ceilings on your own machine, safely and in one terminal. Check the descriptor limit first: `ulimit -n` and `ulimit -Hn`. Expected: a soft value near 1,024 and a much larger hard value. Then read the ephemeral range: `cat /proc/sys/net/ipv4/ip_local_port_range`. Expected: `32768	60999`, which is 28,232 ports. Then read the per-socket memory defaults: `cat /proc/sys/net/ipv4/tcp_rmem /proc/sys/net/ipv4/tcp_wmem`. Multiply the middle value of each by your target connection count and compare the total with your box memory. Change nothing. These three files are the whole of Hotstar's step 1, visible in ten seconds.

### s08-m04-the-arithmetic

- **Title:** Multiply before you choose. **Minutes:** 25.
- **Big idea:** Four designs for one scorecard produce four very different bills and four different first failures, and ten minutes of multiplication tells you which ones to discard.
- **Covers:** S08-C62, S08-C63, S08-C64, S08-C65, S08-C66, S08-C67, S08-C68, S08-C69, S08-C70, S08-C71, S08-C72, S08-C73, S08-C74, S08-C75, S08-C76, S08-C77, S08-C78, S08-C79, S08-C80, S08-C81, S08-C82, S08-C83, S08-C84, S08-C85, S08-C86, S08-C87, S08-C88, S08-C89, S08-C90, S08-C91.
- **Prereqs:** s08-m01-push-or-pull, s08-m03-hotstar-sockets, s06-m09-the-bill, s06-m02-what-a-cdn-is, s07-m02-retry-definitions.
- **Threads:** T-littles-law, T-honest-benchmarks, T-where-state-goes.

**Pretest.**
1. 20 M average viewers, a 4-hour match, a 30 s poll. How many requests? *Answer: 9.6 billion.*
2. One S3 prefix promises how many GET requests a second? *Answer: at least 5,500.*
3. For a 1 KB file on a CDN, which costs more: the request or the bytes? *Answer: the request, by about ten times.*

**Rung 1, the picture.** A town of fifty thousand people wants today's newspaper. Three plans. Print one copy and let everybody walk to the press to read it, which jams the press. Print fifty thousand copies and pay per sheet. Or put one copy in every corner shop, pay the shops a small fee per reader, and reprint each shop copy twice an hour. The third plan costs the most on paper and never jams. *Where it breaks:* a newspaper is read once and discarded, while the same scorecard is fetched 480 times by every reader during one match.

**Rung 2, how it works.**
1. Count the requests. Average viewers times match seconds, divided by the poll interval.
2. Count the peak rate. Peak viewers divided by the poll interval. Use the peak, not the average, for every capacity question.
3. Count the bytes. Requests times the body size on the wire.
4. Price each design against those three numbers, using the unit prices of your region.
5. Ask what breaks first in each design, which is never the same thing as what costs most.
6. Only then pick the architecture.

**Rung 3, the real thing.** Slide 15 writes the five lines out. Requests a match: 20 M × 14,400 s ÷ 30 s = 9.6 B. Peak rate: 50 M ÷ 30 s = 1.67 M a second. Bytes a match: 9.6 B × 1 KB = 9.6 TB. A 15 s poll doubles all three to 19.2 B, 3.33 M a second and 19.2 TB. A hundred events a year gives 960 B requests and 960 TB. Slide 16 turns those into four bills. Slide 17 puts the S3 prefix limit beside the peak rate: 1,670,000 ÷ 5,500 = 303, so the demand is 303 times the promise, and one key lives under one prefix. Slide 18 shows the per-million table and the log axis with its break-even line. Slide 19 gives the instructor's own reason for choosing the pull side.

**Checked arithmetic (recomputed 2026-10-10).** Every figure below follows from the slide 16 conditions: AWS list prices of September 2026, body bytes only, a 30 s poll.

| Design | Line items | Total | First failure |
|---|---|---|---|
| S3 straight to phones | 9.6 B GET at $0.0004 per 1,000 = $3,840. 9,600 GB egress at $0.09 = $864. | $4,704, which the slide calls $4.7K | 5,500 GET/s per prefix, against 1.67 M/s demanded |
| nginx fleet with a load balancer | 9,600 GB egress at $0.09 = $864, plus load-balancer capacity units and the instances | $1.2K to $1.8K | 20 to 50 M idle keep-alive sockets at the load balancer |
| CloudFront, India | 9.6 B ÷ 10,000 × $0.0120 = $11,520 of request fees. (9,600 − 1,000 free) GB × $0.109 = $937. | $12,457, which the slide calls $12.5K | nothing breaks. It is only the bill |
| Push on 200 `c5.4xlarge` | a peak-sized fleet at $680, plus 1,757 GB of 183-byte diffs or 10,445 GB of full cards, at $0.09 | $838 to $1,620, which the slide calls $0.9K to $1.6K | reconnect storms and rebalancing |

The CDN request share checks out: 11,520 ÷ 12,457 = 92.5%, which the deck rounds to 92%. The per-million table checks out too. 1,000,000 ÷ 10,000 × $0.0120 = $1.20 of request fee, whatever the object is. A million 1 KB bodies are 1.024 GB, so $0.112 of byte fee. A million 823,440-byte segments are 823.44 GB, so $89.76 at $0.109 and $59.29 at the $0.072 tier, which is the deck's "$59 to $90". The break-even follows: $1.20 ÷ $0.109 is 11.009 GB per million responses, so 11,009 bytes each, which is the slide's "about 11 KB". Section 7, item 4 records the one figure that needs an extra assumption, the $680 fleet line.

**Rung 4, exam depth.**
- *Why the peak and the average are different numbers.* Requests a match uses 20 M, the average across four hours. Requests a second uses 50 M, the peak. Use the average for the bill and the peak for the capacity. Swapping them under-provisions by 2.5 times.
- *Why S3 runs out of requests before money.* The $4.7K bill is the cheapest of the three pull designs. It is also the only one with a hard ceiling in the way: 5,500 GET requests a second per prefix, against 1.67 M a second demanded. Cost and capacity are separate questions.
- *Why the 503 is the dangerous part.* The S3 guide says you may see 503 Slow Down while it scales. Fifty million clients that retry a 503 with no backoff turn one slow bucket into Session 7's retry storm, aimed at your own bucket (S08-C82). The fix is jitter and backoff on the client, not a bigger bucket.
- *Why 92% of the CDN bill is request fees.* A 1 KB body costs about a tenth of a cent per million bytes-wise and $1.20 per million request-wise. The ratio is about 11 to 1 at these unit prices. Below the 11 KB break-even, bytes are rounding error.
- *Why the instructor says "hold that thought".* On list price, push is the cheapest per match and the CDN the dearest (S08-C77). Slide 19 and homework 2 then unwind it. At a negotiated $0.02 per GB with no request fee, the same 9.6 TB costs $192 a match, and the CDN wins outright. The ranking belongs to the price list, not to the architecture.
- *Why "already paid for" matters most.* At list price the scorecard is 0.28% of the same match's video bill (S08-C91). Our own check: about 59 PB of 480p video at the $0.072 tier is roughly $4.3M, and 12,457 ÷ 4,300,000 is about 0.29%. The video path already exists, already has the contract, and already has the capacity. The scorecard rides it for free in practice.
- *What if your poll is 15 s instead of 30 s?* Every pull bill doubles and the push bill does not move at all, because push sends one message per ball regardless of the poll interval (S08-Q13). That asymmetry is the one real cost argument for push.
- *Exam prompt.* Your CFO asks why you pay a CDN $12.5K a match when 200 EC2 boxes cost $1.2K. Answer in four sentences. *Model answer: the $1.2K buys a stateful fleet that has to be sized for the peak and cannot be rebalanced during a match. The CDN price is a list price that a contract reduces by a large factor. The CDN path already carries the video, so the scorecard is 0.28% on top. And nothing in the CDN design breaks. The other three designs each have a wall.*

**Misconceptions.**
- S08-M15: "The cheapest bill names the right design." Wrong. Each design also has a first failure, and three of the four have a hard wall. Price and capacity are separate questions. Distractor in checks 1 and 5.
- S08-M16: "S3 scales to any request rate, because it is object storage." Wrong. The documented promise is at least 5,500 GET requests a second per prefix, and one key lives under one prefix. Distractor in checks 2 and 3.
- S08-M17: "A small file is cheap on a CDN, because CDNs bill for bandwidth." Wrong. Below about 11 KB the request fee dominates. For a 1 KB file it is 92% of the bill. Distractor in checks 4 and 6.
- S08-M18: "Use the average viewer count for capacity planning." Wrong. Capacity follows the peak, which is 50 M here, not the 20 M average. Distractor in check 1.
- S08-M19: "Halving the poll interval halves nothing, because 304 responses are free." Wrong. Halving the interval doubles requests, and a 304 still pays a request fee. Distractor in check 6.

**Diagrams.** (1) Static: the three places the file can live, as three top-to-bottom chains, with the request that reaches the bucket counted on each. Actors: phone, load balancer, nginx, edge, mid-tier, bucket, writer. (2) Static: the four bills as a stacked bar each, with the dominant line item shaded and the first failure written under the bar. (3) Static: the log-scale object-size axis with the break-even line at 11 KB, four objects marked, and the two fee curves crossing.

**Interactives.** (1) *Bill builder* (P1). Inputs: viewers at peak and average, match length, poll interval, object size, and unit prices for requests and bytes. The learner sees the four bills recompute live, with each line item shown. The learner discovers that the pull bills double with the poll interval while the push bill does not move. (2) *Break-even finder* (P1). Inputs: a request price per 10,000, a byte price per GB. The learner drags an object size and sees which fee wins. The learner discovers that the break-even moves to about 16 KB at the $0.072 tier.

**Predict, observe, explain.** Show slide 15's first line only. Predict the request count for a 15 s poll before reading the fourth line. Observe: 19.2 B, exactly double, because only the divisor changed. Then show the slide 16 table with the "mostly paying for" column hidden. Predict which line item dominates the CDN bill. Observe: request fees at 92%, which slide 18 explains with the per-million table.

- **Worked example.** CloudFront India, a 30 s poll. Requests: 9.6 B ÷ 10,000 = 960,000 units × $0.0120 = $11,520. Bytes: 9,600 GB − 1,000 free = 8,600 GB × $0.109 = $937.40. Total $12,457.40. Request share: 11,520 ÷ 12,457.40 = 92.5%.
- **Faded example.** Same CDN, a 15 s poll. Requests: 19.2 B ÷ 10,000 = ____ units × $0.0120 = ____. Bytes: ____ GB chargeable × $0.109 = ____. Total: ____. Request share: ____. *(1,920,000. $23,040. 18,200. $1,983.80. $25,023.80. 92.1%.)*
- **Your turn.** The same 9.6 B requests, but at a negotiated $0.02 per GB with no request fee. What is the bill, and which design wins? *($192 a match, from 9,600 GB × $0.02. The CDN wins, and it keeps the stateless design. This is homework 2.)*

**Checks.**
1. `mcq`: which design would you discard first, on the slide 16 table alone? Answer: S3 straight to phones, because 1.67 M GET requests a second is 303 times its documented rate. Distractor: the CDN, because it is the dearest (S08-M15). Distractor: push, because 200 boxes is a lot (S08-M15). Distractor: none of them, because the averages all fit (S08-M18). Feedback: a hard wall beats a high bill as a reason to discard.
2. `numeric`: one S3 prefix, 50 M phones, a 30 s poll. The demand divided by the promise? Answer: 303. Distractor: 1 (S08-M16). Feedback: 1,670,000 ÷ 5,500 = 303.
3. `predict`: your bucket starts returning 503 Slow Down and every client retries at once with no backoff. What happens? Answer: the retries multiply the load and the bucket stays slow for longer. Distractor: the retries succeed because S3 scales within seconds (S08-M16). Distractor: the CDN absorbs them (there is no CDN in this design). Feedback: that is Session 7's retry storm, pointed at your own bucket.
4. `numeric`: a million responses of a 1 KB body on CloudFront India. Request fee in dollars? Answer: 1.20. Distractor: 0.11 (S08-M17: reading the byte fee). Feedback: 1,000,000 ÷ 10,000 × $0.0120, whatever the body size.
5. `multi`: which statements about the four bills are true? Answer: push is the cheapest at list price, the CDN is the dearest at list price, three of the four designs have a hard first failure. Distractor: the cheapest design is the right one (S08-M15). Distractor: the CDN bill is mostly bytes (S08-M17). Feedback: hold the list-price ranking lightly. A contract changes it.
6. `numeric`: you move from a 30 s poll to a 15 s poll. The CloudFront request fee goes from $11,520 to what? Answer: 23040. Distractor: 11520 (S08-M19). Feedback: twice the requests, twice the request fee, including the 304 responses.

**Review cards.**
- Q: Requests a match, at 20 M average viewers, four hours and a 30 s poll? A: 9.6 billion.
- Q: Peak request rate, at 50 M viewers and a 30 s poll? A: 1.67 million a second.
- Q: Bytes a match, at 1 KB each? A: 9.6 TB.
- Q: What rate does one S3 prefix promise? A: At least 5,500 GET requests a second.
- Q: What share of the scorecard's CDN bill is request fees? A: 92%.
- Q: Where is the request-fee and byte-fee break-even? A: About 11 KB, at $1.20 per million requests and $0.109 per GB.
- Q: What is the scorecard, as a share of the same match's video bill? A: 0.28%, at list price.
- Q: What does a 15 s poll change about the push bill? A: Nothing. Push sends one message per ball, not per poll.

**Lab.** Prove the break-even with arithmetic you can check, not with a cloud account. `python3 -c "req=1.20; byte=0.109; print(req/byte*1e9/1e6, 'bytes')"`. Expected: `11009.17... bytes`, so about 11 KB. Then repeat with `byte=0.072` for the high-volume tier. Expected: about 16,667 bytes. Then price your own object: `python3 -c "n=9.6e9; s=1024; print('req', n/1e4*0.012, 'bytes', max(0, n*s/1e9-1000)*0.109)"`. Expected: `req 11520.0 bytes 937.4...`. Change `s` to `823440` and watch the two numbers swap places.

### s08-m05-making-polling-survive

- **Title:** Making polling survive fifty million phones. **Minutes:** 25.
- **Big idea:** Five mechanisms turn a naive poll into something that fifty million phones cannot hurt: conditional requests, stacked TTLs you can add up, request collapsing, serving stale, and a careful negative TTL.
- **Covers:** S08-C92, S08-C93, S08-C94, S08-C95, S08-C96, S08-C97, S08-C98, S08-C99, S08-C100, S08-C101, S08-C102, S08-C103, S08-C104, S08-C105, S08-C106, S08-C107, S08-C108, S08-C109, S08-C110, S08-C111, S08-C112, S08-C113, S08-C114, S08-C115, S08-C116.
- **Prereqs:** s08-m01-push-or-pull, s08-m04-the-arithmetic, s04-m08-cache, s06-m03-caching-defaults, s06-m05-cache-bugs, s07-m04-retry-mechanics.
- **Threads:** T-setup-off-path, T-fix-causes-next, T-law-or-habit.

**Pretest.**
1. A mid-tier TTL of 30 s, an edge TTL of 30 s and a 30 s client poll. The worst-case staleness? *Answer: up to 90 s. They add.*
2. Twenty thousand phones hit one edge in the same 50 ms, just after the copy expired. How many requests reach the origin, with collapsing on? *Answer: one.*
3. Would you cache a 404 for the newest live segment? *Answer: no, or for one second at the very most. The file is about to exist.*

**Rung 1, the picture.** A school noticeboard copied down a corridor. The head office writes the notice. A copy goes on the staffroom board, and a copy from there goes on the classroom board. Each copy is refreshed on its own timer. A pupil who reads the classroom board can therefore be two refresh cycles plus one walk behind the head office. When a classroom copy is pulled down to be replaced, thirty pupils arrive at once, and a sensible teacher sends one pupil to fetch the new copy while the others wait, instead of sending all thirty. *Where it breaks:* a paper notice cannot be served while it is being replaced. A cache can, and that is what "serve stale while updating" means.

**Rung 2, how it works.**
1. The client sends `If-None-Match` with the ETag it holds.
2. On no change the server answers 304 with no body. The client keeps its screen.
3. Each cache on the path holds the answer for its own TTL. The worst-case staleness is the poll interval plus every TTL.
4. At the instant a TTL expires, every arriving request is a miss. Request collapsing sends one of them upstream and queues the rest.
5. While that one fetch runs, the cache can answer the queue from the old copy instead of making it wait.
6. A prefetch before expiry means no viewer ever meets an empty cache at all.
7. Error responses get their own short TTLs: a 5xx for one or two seconds, a 404 for one second or not at all.

**Rung 3, the real thing.** Slide 20 gives the conditional exchange: `If-None-Match: "v1841"` up, `304 Not Modified` down with the `ETag` and `Cache-Control: public, max-age=10`. The ETag is the scorecard version number, a fingerprint rather than a clock. Slide 21 draws the two TTL stacks as bars: 30 plus 30 plus 30 gives up to 90 s, and 5 plus 5 plus 15 gives up to 25 s. Slide 22 gives the nginx recipe for the herd: `proxy_cache_lock on`, `proxy_cache_use_stale updating error timeout http_500 http_502 http_503 http_504`, `proxy_cache_background_update on` and `proxy_cache_valid 200 10s`. Slide 23 puts numbers on it: 20,000 phones, one edge, 1 request upstream and 19,999 in a queue. Slide 24 gives the negative-caching recipe, with 10 s for a 200, 1 s for a 404 and 2 s for the four 5xx codes.

**Rung 4, exam depth.**
- *What a 304 saves, and what it does not.* It saves the 1 KB body, the JSON parse and the re-render. It does not save the request fee, the round trip or the headers (S08-C94, S08-C95). So a conditional request helps the client and the network, and it does nothing for the CDN bill.
- *Where conditional requests really pay.* Between CDN tiers. Edge to mid-tier and mid-tier to origin become 304 exchanges instead of body copies, and those hops are the ones you own (S08-C96).
- *Why TTLs add instead of taking the maximum.* Each layer refreshes on its own clock, and the clocks are not aligned. The worst case stacks one full TTL per layer plus one poll interval. Keep each CDN TTL at half the freshness you promise or less, which is where 5 plus 5 plus 15 comes from.
- *Prefresh.* Refresh the edge copy before it expires, for example at about 25 s of a 30 s TTL. Akamai calls it prefresh. The herd never forms, because the cache is never empty.
- *Why collapsing needs a shareable answer.* The first response decides for the whole queue. `Cache-Control: public` releases every waiter at once. A private answer, or one stray `Set-Cookie`, dequeues them one at a time, and Fastly then skips collapsing for that object for two minutes (S08-C108, S08-C109). One cookie turns 1 upstream request into 20,000.
- *Check the default before you trust the design.* Cloudflare does not cache `.json` out of the box. With no cache rule, `cf-cache-status` reads DYNAMIC and every poll reaches your origin (S08-C111). The design was never wrong. It was never switched on.
- *Why a cached 5xx is a shield and a cached 404 is a trap.* A 503 held for two seconds means the origin sees one probe per TTL per edge instead of fifty million retries. A 404 held for three minutes, which is Cloudflare's default, keeps being served after the file appears. The newest live segment and the next match's scorecard are both files that are about to exist (S08-C112, S08-C113, S08-C114).
- *The rule to memorise.* A negative TTL must be far shorter than the time it takes the missing thing to appear (S08-C115). For a 4 s live segment that means one second, not three minutes.
- *Early hints, named early.* HTTP 103 names the next thing before it exists, for pages. Low-Latency HLS does the same with a preload hint, so requests for the next part queue at the edge and one arrival releases them all (S08-C110). Module 9 returns to it.
- *Exam prompt.* Your origin request rate for `score.json` is 20,000 a second instead of the 2 a second you expected, and `proxy_cache_lock` is on. Name three causes, in the order you would check them. *Model answer: first, the response is not shareable, because of a `private` directive or a `Set-Cookie`, so the queue drains one by one. Second, the cache key varies, for example a per-client query parameter or a `Vary` header. Third, the object is not cached at all, because the platform default excludes that content type.*

**Misconceptions.**
- S08-M20: "A 304 response makes polling free." Wrong. The request, the round trip, the headers and the CDN request fee all still happen. Distractor in checks 1 and 6. S08-M01 appears again in check 1.
- S08-M21: "With caches on the path, the staleness is the largest TTL." Wrong. Each layer runs its own clock, so the TTLs and the poll interval add. Distractor in checks 2 and 3.
- S08-M22: "Request collapsing works whatever the response says." Wrong. The answer must be shareable. A `private` directive or a `Set-Cookie` drains the queue one request at a time. Distractor in checks 4 and 5.
- S08-M23: "Caching a 404 protects the origin, like caching a 503." Wrong. A 404 at the live edge is a file that is about to exist, so the cached 404 outlives the problem. Distractor in check 6.
- S08-M24: "An ETag built from the file timestamp is as good as a version number." Wrong. A clock has one-second resolution and it moves when the bytes do not. Use the version number. Distractor in check 1.

**Diagrams.** (1) Static: two TTL stack bars to scale, 30-30-30 against 5-5-15, with the worst case written at the end of each. (2) Step-by-step: the herd at expiry, four frames. The copy expires, 20,000 requests arrive, one goes upstream and 19,999 queue, the answer releases them all. Actors: phones, edge, origin. (3) Step-by-step: the same frames with a `Set-Cookie` on the response, so the queue drains one by one and the upstream count climbs. (4) Static: a timeline of one 30 s TTL with the prefresh point marked at 25 s.

**Interactives.** (1) *TTL stacker* (P1). Inputs: mid-tier TTL, edge TTL, poll interval. The learner sees a stacked bar and the worst-case staleness, with the cricket ball interval drawn as a reference line. The learner discovers which combinations stay inside one ball. (2) *Herd at expiry* (P1). Inputs: requests per 50 ms, collapsing on or off, shareable or private, serve-stale on or off. The learner sees the origin request count. The learner discovers that one cookie costs four orders of magnitude. (3) *Negative TTL chooser* (P2). Inputs: negative TTL, time until the file appears. The learner sees how long the wrong answer is served after the file exists.

**Predict, observe, explain.** Show the slide 22 nginx block with `proxy_cache_lock on` commented out. Predict the origin request count for 20,000 phones hitting one edge in 50 ms. Observe: 20,000. Then uncomment the line and predict again. Observe: 1 upstream request and 19,999 queued, which is slide 23. Then add a `Set-Cookie` to the origin response and predict a third time. Observe: the queue drains one by one, and Fastly stops collapsing that object for two minutes.

- **Worked example.** Mid-tier TTL 30 s, edge TTL 30 s, poll 30 s. Worst case: 30 + 30 + 30 = 90 s. At 25 to 45 s a ball, that is two or three balls behind the stadium.
- **Faded example.** Mid-tier 5 s, edge 5 s, poll 15 s. Worst case: ____. Inside one ball? ____. *(25 s. Yes, because a ball takes 25 to 45 s.)*
- **Your turn.** You promise 20 s of freshness and you poll every 10 s. What is the largest TTL you may give each of two cache layers? *(5 s each. 5 + 5 + 10 = 20 s, and the deck's rule of half the promise or less gives 10 s as an upper bound per layer, so 5 s satisfies both.)*

**Checks.**
1. `multi`: what does a 304 response save? Answer: the body bytes, the JSON parse, the re-render. Distractor: the CDN request fee (S08-M20). Distractor: the round trip (S08-M20). Distractor: the need for a correct ETag (S08-M24). Feedback: a 304 is a cheaper answer, not a missing request.
2. `numeric`: mid-tier TTL 10 s, edge TTL 10 s, client poll 20 s. Worst-case staleness in seconds? Answer: 40. Distractor: 20 (S08-M21: taking the largest). Distractor: 10 (S08-M21). Feedback: every layer runs its own clock, so they add.
3. `mcq`: you must stay inside one ball, which is 25 s. Which stack qualifies? Answer: 5 s mid-tier, 5 s edge, 15 s poll. Distractor: 30 s, 30 s, 30 s (S08-M21). Distractor: 10 s, 10 s, 30 s, which is 50 s (S08-M21). Distractor: 25 s, 0 s, 0 s, which no client can do (S08-M21). Feedback: 5 + 5 + 15 = 25 s exactly.
4. `numeric`: 20,000 phones ask one edge for `score.json` in 50 ms, just after expiry, with collapsing on and a public response. Requests reaching the origin? Answer: 1. Distractor: 20000 (S08-M22). Feedback: one fetch per edge per object, and everybody else waits.
5. `spot-bug`: the origin adds `Set-Cookie: session=abc` to `score.json`. What breaks? Answer: request collapsing. The queue drains one request at a time, and Fastly skips collapsing for that object for two minutes. Distractor: nothing, because the cookie is small (S08-M22). Distractor: the ETag stops matching (S08-M24). Feedback: the first response decides for the whole queue, so it must be shareable.
6. `mcq`: which negative TTL is safe for the newest live segment? Answer: one second at most, or no negative caching at all. Distractor: three minutes, which is Cloudflare's default (S08-M23). Distractor: the same TTL as a 200 response (S08-M23). Distractor: as long as the 5xx TTL, because both are errors (S08-M23). Feedback: the file appears in about four seconds, so the negative TTL must be far shorter than that.

**Review cards.**
- Q: Worst-case staleness of a polled file? A: The poll interval plus every cache TTL on the path.
- Q: What does a 304 not save? A: The request fee, the round trip and the headers.
- Q: How large may each CDN TTL be? A: Half the freshness you promise, or less.
- Q: What is prefresh? A: Refreshing the edge copy before it expires, for example at 25 s of a 30 s TTL.
- Q: What does request collapsing do? A: One fetch per edge per object. Everybody else waits in a queue.
- Q: What makes a collapsed queue drain one by one? A: An unshareable answer, such as `private` or a stray `Set-Cookie`.
- Q: How long should a cached 503 live? A: One or two seconds, so the origin sees one probe per TTL per edge.
- Q: What is Cloudflare's default edge TTL for a 404? A: Three minutes, which is far too long at a live edge.
- Q: The rule for any negative TTL? A: Far shorter than the time it takes the missing thing to appear.

**Lab.** Watch collapsing and serving stale on one machine, with two nginx layers. Copy nothing from a repo, because Session 8 has no code. Write a minimal origin and cache under `/tmp/s08/m5`: an origin on port 9001 that sleeps 1 s and returns `score.json`, and an nginx with `proxy_cache_path /tmp/s08/m5/cache levels=1:2 keys_zone=s:10m;`, `proxy_cache_valid 200 5s;` and `proxy_cache_lock on;`. Start nginx with `nginx -p /tmp/s08/m5 -c /tmp/s08/m5/nginx.conf`. Then fire a burst: `for i in $(seq 1 50); do curl -s -o /dev/null localhost:9080/score.json & done; wait`. Count origin hits in the origin log. Expected: 1 per 5 s window, not 50. Then comment out `proxy_cache_lock` and repeat. Expected: up to 50. Stop with `nginx -p /tmp/s08/m5 -s stop`. Never use the system nginx port or config.

### s08-m06-diffs-and-versions

- **Title:** Send the change, not the card. **Minutes:** 18.
- **Big idea:** A diff is 183 bytes against 1,088, but a diff per client destroys the cache, so the pull side publishes one file that holds the version and the last few changes.
- **Covers:** S08-C117, S08-C118, S08-C119, S08-C120, S08-C121, S08-C122, S08-C123, S08-C124, S08-C125.
- **Prereqs:** s08-m05-making-polling-survive, s08-m02-sse-websockets-mqtt, s06-m04-caching-the-uncacheable, s02-m09-ftp-framing.
- **Threads:** T-skip-unknown, T-where-state-goes, T-framing.

**Pretest.**
1. One ball as a gzipped JSON Patch is how big, against the whole gzipped card? *Answer: 183 bytes against 1,088.*
2. Why is `?since=1841` a bad URL for a public cache? *Answer: every client has a different version, so every client gets its own cache key.*
3. A phone misses one push message. How does it recover? *Answer: it sees a gap in the version numbers and fetches the whole card once.*

**Rung 1, the picture.** A cricket club pins the full scorecard on a board, and also keeps a short list of the last few balls beside it. A member who stepped out for two minutes reads the short list and catches up. A member who stepped out for an hour reads the whole board. Nobody asks the club secretary to write a private note describing only what they personally missed, because the secretary would then write a thousand different notes. *Where it breaks:* a paper board cannot tell you whether you missed something. The version number does that job here.

**Rung 2, how it works.**
1. Give every update a version number that only increases.
2. On the push side, send the patch for one version, which is 183 bytes.
3. A receiver applies the patch when its own version is exactly one behind.
4. A receiver that sees a gap fetches the whole card once, then returns to patches.
5. On the pull side, do not put the client version in the URL.
6. Publish one file instead, holding the current version and the last few changes. Every client fetches the same URL and picks what it needs.

**Rung 3, the real thing.** Slide 25 gives three measured sizes of one synthetic T20 card with two innings, batting and bowling figures and fall of wickets: 4,117 bytes of raw JSON, 1,088 bytes gzipped, and 183 bytes for one ball as a gzipped JSON Patch. Slide 26 puts the versioned scorecard beside an HLS media playlist, line for line. The scorecard carries `"version": 1842` and a `recent` array of the last few balls, polled every 15 s. The playlist carries `#EXT-X-TARGETDURATION:4`, `#EXT-X-MEDIA-SEQUENCE:2` and ten segment names, polled every 4 s. The mapping is explicit on the slide: version against MEDIA-SEQUENCE, the recent changes against the last N segments, and the poll interval against TARGETDURATION.

**Rung 4, exam depth.**
- *The compression chain, in order.* 4,117 raw, 1,088 gzipped, which is 26% of raw. Then 183 for one patch, which is 17% of the gzipped card and 4.4% of the raw card. Each step is a different idea: gzip removes repetition inside one document, and the patch removes the parts that did not change.
- *Why the diff belongs to push and the shared file to pull.* A push server already knows each receiver's version, because it holds the socket. A cache knows nothing about any client. So the only diff a cache can serve is a diff that is the same for everybody.
- *Why `?since=1841` is worse than it looks.* It does not merely lower the hit rate. It gives each client a private key, so the hit rate collapses toward zero and the origin sees the full poll rate. Compare the VOD query string of module 7, which is identical for everybody and caches perfectly.
- *How many recent changes to publish.* Enough to cover the slowest poll plus the worst staleness. At a 15 s poll, a 25 s worst case and 25 s per ball, two or three entries suffice. An HLS playlist makes the same decision and calls it the window.
- *Why the version number does double duty.* It is the ETag, so a conditional request works. It is the gap detector, so a receiver knows it missed something. It is the ordering key, so a duplicate at MQTT QoS 1 applies nothing. One integer, three jobs.
- *The lineage.* Cloudflare's Railgun carried deltas between its own edge and its own origin. RFC 9842 now standardises a compression dictionary negotiated between client and server, which is the same idea with a published wire format (S08-C121). Section 6 gives the reference.
- *What if you send only diffs and never a full card?* A client that joins mid-match has nothing to apply them to. Every diff design needs one full snapshot path, and the retained message of module 2 is a broker that keeps one for you.
- *Exam prompt.* Design the scorecard URL set for a design that must serve a mid-match joiner, a steady watcher and a phone that went through a tunnel. *Model answer: one URL. It carries the current version, the full card, and the last few changes. The joiner uses the full card, the watcher uses the newest change, and the tunnel phone compares its version with the list and takes what it missed, or takes the full card if the gap is too large.*

**Misconceptions.**
- S08-M25: "Diffs always save money, so use them everywhere." Wrong. A per-client diff needs a per-client URL or a held socket. On the pull side that destroys the cache hit rate. Distractor in checks 1 and 3.
- S08-M26: "A query parameter is not part of the cache key." Wrong. It is, by default, on every CDN in the deck. Distractor in checks 2 and 3.
- S08-M27: "A versioned scorecard and an HLS playlist are different designs." Wrong. They are the same design: a small index everyone polls, over numbered items that do not change. Distractor in check 4.
- S08-M28: "A client that missed a patch can wait for the next one." Wrong. Patches apply in order, so a gap must trigger one full fetch. Distractor in check 5.

**Diagrams.** (1) Static: three bars to scale, 4,117, 1,088 and 183 bytes, with what each step removed written beside it. (2) Static: the two files side by side, with four arrows joining version to MEDIA-SEQUENCE, recent to the segment window, poll interval to TARGETDURATION, and item id to segment name. (3) Step-by-step: a phone leaves a tunnel at version 1838 while the server is at 1842, reads the recent list, and applies four changes. Actors: phone, edge, origin.

**Interactives.** (1) *Patch or card* (P1). Inputs: balls missed, patch size, card size, poll interval. The learner sees the bytes for each strategy and the crossover point. The learner discovers that past about six missed balls the full card is cheaper. (2) *Cache key breaker* (P1). Inputs: a URL template and a client version. The learner sees the distinct keys generated across 1,000 clients and the resulting hit rate. The learner discovers that `?since=` gives 1,000 keys and the shared file gives one.

**Predict, observe, explain.** Show the slide 25 sizes. Predict the break-even in missed balls between applying patches and fetching the whole gzipped card. Observe: 1,088 ÷ 183 = 5.9, so six missed balls. Then show the two `?since=` and shared-file URL shapes and predict the distinct cache keys for 1,000 clients at mixed versions. Observe: about 1,000 against 1.

- **Worked example.** A phone at version 1839 polls and the server is at 1842. Patches needed: 1840, 1841 and 1842, which is 3 × 183 = 549 bytes. The full gzipped card is 1,088 bytes. So patches win here.
- **Faded example.** The same phone, but at version 1830. Patches needed: ____. Bytes: ____. Cheaper option: ____. *(12. 2,196 bytes. The full card, at 1,088 bytes.)*
- **Your turn.** Your `recent` list holds three entries and you poll every 15 s. A phone is offline for 90 s. What does it do on its next poll? *(It sees a gap of about three or four balls, which may exceed the list, so it takes the full card. The safe rule: if your version is not in the list, take the full card.)*

**Checks.**
1. `numeric`: one gzipped card is 1,088 bytes and one gzipped patch is 183 bytes. How many patches cost more than one card? Answer: 6. Distractor: 5 (rounding 5.9 down). Distractor: 1 (S08-M25). Feedback: 1,088 ÷ 183 = 5.9, so six patches lose.
2. `spot-bug`: the team ships `GET /score?since=<client version>` behind a CDN. What breaks? Answer: the cache hit rate, because each client version is a separate cache key. Distractor: nothing, because the response body is small (S08-M26). Distractor: the ETag, because the version moved into the URL (S08-M26). Feedback: a query parameter is part of the cache key by default.
3. `mcq`: which design serves diffs through a shared cache? Answer: one file that holds the version and the last few changes. Distractor: one URL per client version (S08-M26). Distractor: a diff computed per request from an `If-Version` header (S08-M25). Distractor: no design can, so always send the full card (S08-M25). Feedback: a cache can only serve a diff that is the same for everybody.
4. `multi`: which pairs line up between the versioned scorecard and an HLS media playlist? Answer: version with MEDIA-SEQUENCE, the recent list with the segment window, the poll interval with TARGETDURATION. Distractor: the card body with a segment body (S08-M27: one is the index, the other is the data). Feedback: they are one design with two payloads.
5. `predict`: an MQTT client at version 1840 receives the patch for 1842. What should it do? Answer: fetch the full card once, then resume patching. Distractor: apply 1842 and carry on (S08-M28). Distractor: wait for 1841 to be re-sent (S08-M28). Distractor: discard 1842 and keep showing 1840 (S08-M28). Feedback: a version gap means a lost update, and patches only apply in order.

**Review cards.**
- Q: Three sizes of one T20 card? A: 4,117 bytes raw, 1,088 gzipped, 183 bytes for one ball as a gzipped JSON Patch.
- Q: Why not put the client version in the URL? A: It gives each client its own cache key and the hit rate collapses.
- Q: What does the pull side publish instead of a per-client diff? A: One file with the current version and the last few changes.
- Q: What does a phone do when it sees a version gap? A: It fetches the whole card once, then resumes patches.
- Q: Which three jobs does one version number do? A: The ETag, the gap detector and the ordering key.
- Q: Which HLS field matches the scorecard version? A: `EXT-X-MEDIA-SEQUENCE`.
- Q: Which HLS field matches the poll interval? A: `EXT-X-TARGETDURATION`.

**Lab.** Reproduce the three sizes with tools you already have. `mkdir -p /tmp/s08/m6 && cd /tmp/s08/m6`. Write a scorecard JSON of about 4 KB with two innings. Then: `wc -c card.json` for the raw size, `gzip -9 -c card.json | wc -c` for the gzipped size. Write a one-ball JSON Patch, for example `[{"op":"replace","path":"/total","value":"146/4"},{"op":"add","path":"/balls/-","value":{"v":1842,"runs":4}}]`, and run `gzip -9 -c patch.json | wc -c`. Expected: the raw card in the low thousands, the gzipped card near a quarter of that, and the gzipped patch under 250 bytes. Your numbers will not equal the deck's, because the card contents differ. Record your own three numbers and the ratios.

### s08-m07-hls-playlists

- **Title:** HLS: the same loop, with bigger bytes. **Minutes:** 24.
- **Big idea:** A video player runs the scorecard loop: it polls a small text index on a clock and fetches large numbered pieces that never change.
- **Covers:** S08-C126, S08-C127, S08-C128, S08-C129, S08-C130, S08-C131, S08-C132, S08-C133, S08-C134, S08-C135, S08-C136, S08-C137, S08-C138, S08-C139, S08-C140, S08-C141, S08-C142, S08-C143, S08-C144, S08-C145, S08-C146, S08-C147, S08-C148.
- **Prereqs:** s08-m06-diffs-and-versions, s08-m05-making-polling-survive, s06-m03-caching-defaults, s05-m03-validators-vary.
- **Threads:** T-framing, T-name-in-message, T-skip-unknown.

**Pretest.**
1. How many times does a player read the master playlist during a match? *Answer: once. It does not change.*
2. The playlist reloads and nothing changed. How long before the next reload? *Answer: half a target duration.*
3. Which HLS tag means "stop polling"? *Answer: `EXT-X-ENDLIST`.*

**Rung 1, the picture.** A library reading room with a noticeboard. The noticeboard names the ten books currently on the new-arrivals shelf, in order. A reader checks the board every few minutes, sees one new title appear and one old title drop off, and walks to the shelf for the new book. The books themselves never change, so a reader can keep one for as long as they like. One board, many readers, and the board is tiny. *Where it breaks:* a library reader can take any book on the shelf. A player must take the segments in order, because video decodes forward from a keyframe.

**Rung 2, how it works.**
1. The player fetches `master.m3u8` once and reads the variant list.
2. It picks one variant, by resolution, bandwidth and codec support.
3. It fetches that variant's media playlist, which lists the current window of segments.
4. It fetches each segment it has not seen, in order, into the buffer.
5. It reloads the media playlist. If the playlist changed, it waits at least one target duration first. If it did not change, it waits half a target duration.
6. It plays from the buffer and may pick a different variant at any segment boundary.
7. If the playlist carries `EXT-X-ENDLIST`, the player stops reloading. That is video on demand.

**Rung 3, the real thing.** Slide 28 draws the three objects with their roles. `master.m3u8` is control, read once, three renditions with bandwidth, resolution and codecs. `stream_1/index.m3u8` is control, polled every 4 s, listing the last ten segments and changing every 4 s. `stream_1/seg_000011.ts` is data, fetched once, 4 s of audio and video in 823 KB, and it never changes. Slide 29 gives the master from the deck's own ffmpeg run, with `BANDWIDTH=3440800` at 1280x720, `1755600` at 854x480 and `950400` at 640x360. The rule behind those numbers is on the slide: video plus audio, times 1.1. Our check: (3,000,000 + 128,000) × 1.1 = 3,440,800, (1,500,000 + 96,000) × 1.1 = 1,755,600 and (800,000 + 64,000) × 1.1 = 950,400. All three match. Slide 30 shows two reloads of the live 360p playlist, 4.5 s apart, where `EXT-X-MEDIA-SEQUENCE` went from 1 to 2 and the window moved from `seg_000001` to `seg_000010` up to `seg_000002` to `seg_000011`. Slide 31 shows a VOD playlist with `EXT-X-TARGETDURATION:10`, 63 segments of 10 s, one of 5 s, and `EXT-X-ENDLIST`.

**Rung 4, exam depth.**
- *Why the split is the whole design.* The playlist is small and changes constantly. The segment is large and never changes. Put them on different TTLs, different caches and different bills, and both problems become easy. Mix them and both become hard (S08-C132). Module 8 gives the cache rules.
- *Why the window moves rather than grows.* A live playlist drops the oldest entry as it adds the newest, so it stays about the same size and the origin can delete old files. Module 10 shows the 404 that follows when the deletion and the cached playlist disagree.
- *Why the two reload rules differ.* If the playlist changed, the next change is at least one target duration away, so there is no point in asking sooner. If it did not change, something is late, so ask again sooner, at half a target duration. The rule is a backoff and a speed-up in one sentence (S08-C140, S08-C141).
- *Why a changed URI at the same sequence number is fatal.* The sequence number is the player's only identity for a segment. If the same number names different bytes, the player cannot tell what it already has. RFC 8216 says it SHOULD halt playback (S08-C142).
- *What BANDWIDTH actually declares.* It is a peak, not an average, and the deck's own ffmpeg ladder sets it to (video + audio) × 1.1. A player compares its measured throughput against this number, so an understated value causes stalls and an overstated one causes needless downgrades.
- *Why CODECS is a fallback and not a retry.* A player reads the codec string before it fetches anything and skips a variant it cannot decode, for example HEVC down to H.264. Nothing failed, so nothing is retried. Session 7 called that a fallback (S08-C138).
- *Why re-reading the master is a steering mechanism.* The master names the path to every media playlist. A player that reads it again can be sent somewhere else. That habit was standardised later as Content Steering (S08-C137). Module 10 teaches it.
- *Why the VOD query string caches and a token would not.* `?pubId=…&videoId=…` carries the same two values for every viewer, so every viewer shares one cache key. A per-viewer token would give each viewer a private key, exactly like `?since=` in module 6 (S08-C148).
- *VOD is not a different protocol.* It is a playlist that stopped changing. One tag, `EXT-X-ENDLIST`, turns a polling loop into a single read (S08-C145).
- *Exam prompt.* A player shows four seconds of video and then stalls for ever, and the playlist request returns 200 every time. Name two causes you can see in the playlist itself. *Model answer: first, the media sequence number is not advancing, so the origin or the cache is serving the same window again and again. Second, a segment URI changed under an unchanged sequence number, so the player cannot trust its own buffer and halts.*

**Misconceptions.**
- S08-M29: "The player polls the master playlist too." Wrong. The master is read once. Only the media playlist is polled. Distractor in checks 1 and 2.
- S08-M30: "A segment can change after it is published." Wrong. A segment is immutable. That is what lets you cache it for ever and serve it stale freely. Distractor in checks 3 and 5.
- S08-M31: "The reload interval is always one target duration." Wrong. One target duration after a change, half a target duration after no change. Distractor in check 2.
- S08-M32: "VOD uses a different protocol from live." Wrong. VOD is the same playlist with `EXT-X-ENDLIST`, read once. Distractor in check 4.
- S08-M33: "BANDWIDTH is the average bit rate of the variant." Wrong. It is a declared peak, and the deck's ladder computes it as (video + audio) × 1.1. Distractor in check 6.

**Diagrams.** (1) Static: the three objects in one row, each labelled control or data, with its size, its change rate and how often the player fetches it. (2) Step-by-step: the player loop, four steps, with the reload timer drawn as a branch on "changed or not". Actors: player, edge, origin. (3) Static: the two slide 30 playlists side by side, with the sequence number and the window endpoints highlighted, and the 4 s shift shown with arrows. (4) Static: the master playlist as a menu, three rows with bandwidth, resolution and codec, and the arrow from each row to its own media playlist.

**Interactives.** (1) *Playlist reloader* (P1). Inputs: target duration, whether the origin is producing segments, a cache TTL. The learner sees the reload clock, the sequence number and the buffer level. The learner discovers the half-target-duration speed-up when nothing changes. (2) *Variant picker* (P1). Inputs: measured throughput, the three BANDWIDTH values, supported codecs. The learner sees which variant the player chooses and why. The learner discovers that a codec it cannot decode is skipped before any bytes move. (3) *Window walker* (P2). Inputs: list size, segment duration. The learner steps time forward and watches the window and the sequence number move together.

**Predict, observe, explain.** Show slide 29's ladder parameters, `-b:v:0 3000k` and `-b:a:0 128k`. Predict the BANDWIDTH value that ffmpeg will write. Observe: (3,000,000 + 128,000) × 1.1 = 3,440,800, which the slide confirms. Then show the first slide 30 playlist and predict the second one, 4.5 s later. Observe: the sequence number advances by 1 and the window shifts by one segment at each end.

- **Worked example.** Target duration 4 s, list size 10. Window length: 10 × 4 = 40 s. Reload interval after a change: 4 s. Reload interval after no change: 2 s. Playlist requests a minute, per viewer, in the steady state: 60 ÷ 4 = 15.
- **Faded example.** Target duration 6 s, list size 5. Window length: ____. Reload after a change: ____. Reload after no change: ____. Playlist requests a minute: ____. *(30 s. 6 s. 3 s. 10.)*
- **Your turn.** A VOD playlist has `EXT-X-TARGETDURATION:10`, 63 segments of 10 s and a final one of 5 s. How long is the video, and how many playlist requests does one viewer make? *(635 s, which is 10 minutes and 35 s. One request, because `EXT-X-ENDLIST` stops the polling.)*

**Checks.**
1. `numeric`: a 90-minute match, target duration 4 s. How many times does one player read the master playlist? Answer: 1. Distractor: 1350 (S08-M29: polling it like the media playlist). Feedback: the master does not change during the match.
2. `mcq`: a player reloads the media playlist and the body is byte-for-byte identical. When does it reload again? Answer: after half a target duration. Distractor: after one target duration (S08-M31). Distractor: immediately (S08-M31). Distractor: never, because nothing changed (S08-M29). Feedback: unchanged means something is late, so ask again sooner.
3. `mcq`: why can a segment be cached for ten minutes while its playlist is cached for two seconds? Answer: the segment never changes and the playlist changes every target duration. Distractor: the segment is larger, so it is cheaper to keep (S08-M30). Distractor: the playlist is text and text is not cacheable (S08-M30). Distractor: the CDN cannot cache binary bodies for long (S08-M30). Feedback: TTL follows the change rate, not the size.
4. `mcq`: what does `EXT-X-ENDLIST` tell the player? Answer: no more segments will appear, so stop reloading the playlist. Distractor: the stream uses the VOD protocol instead of the live one (S08-M32). Distractor: the player must fetch the master again (S08-M29). Distractor: the segments may now be deleted (S08-M30). Feedback: VOD is a playlist that stopped changing.
5. `predict`: `seg_000007.ts` stays at media sequence 7 but its URI changes to `seg_000007b.ts`. What should the player do? Answer: halt playback. Distractor: fetch the new URI and carry on (S08-M30). Distractor: keep the old segment, because the number matched (S08-M30). Distractor: reload the master playlist (S08-M29). Feedback: the sequence number is the only identity a player has for a segment.
6. `numeric`: a variant encodes 1500k of video and 96k of audio. What BANDWIDTH does the deck's rule write? Answer: 1755600. Distractor: 1596000 (S08-M33: omitting the 1.1 factor). Feedback: (video + audio) × 1.1.

**Review cards.**
- Q: How often does a player read the master playlist? A: Once. It does not change during the match.
- Q: How often does a player reload the media playlist after a change? A: After at least one target duration.
- Q: And after no change? A: After half a target duration.
- Q: What must a player do when a segment URI changes at the same sequence number? A: Halt playback.
- Q: How does the deck's ffmpeg ladder compute BANDWIDTH? A: (video bit rate + audio bit rate) × 1.1.
- Q: What does `EXT-X-ENDLIST` mean? A: No more segments. Read the playlist once and stop polling.
- Q: Which HLS object is control, and which is data? A: Both playlists are control. The segments are data.
- Q: Why does the VOD query string cache well? A: It carries the same values for every viewer, so they share one cache key.

**Lab.** Read a real playlist tree with curl and nothing else. Pick any public HLS master, for example from the video.js demo of slide 27. Run `curl -s <master url> | head -20` and count the `EXT-X-STREAM-INF` lines. Then take the first media playlist URI and run `curl -s <media url> | grep -E 'TARGETDURATION|MEDIA-SEQUENCE|ENDLIST' `. Expected: a target duration, a media sequence number, and either `EXT-X-ENDLIST` for VOD or no such line for live. For a live stream, run the same command twice about one target duration apart and diff the two bodies: `curl -s <media url> > a.m3u8; sleep 5; curl -s <media url> > b.m3u8; diff a.m3u8 b.m3u8`. Expected: one segment leaves the top and one joins the bottom, and the sequence number advances.

### s08-m08-segments

- **Title:** Segments: 188 bytes at a time, and how long is right. **Minutes:** 22.
- **Big idea:** A segment is a chain of fixed 188-byte packets, and its length is the single knob that trades request rate against latency.
- **Covers:** S08-C149, S08-C150, S08-C151, S08-C152, S08-C153, S08-C154, S08-C155, S08-C156, S08-C157, S08-C158, S08-C159, S08-C160, S08-C161, S08-C162, S08-C163, S08-C164, S08-C165, S08-C166.
- **Prereqs:** s08-m07-hls-playlists, s01-m08-framing, s01-m11-tlv-asn1, s02-m03-sms-bytes.
- **Threads:** T-framing, T-encapsulation, T-round-trip-tax, T-law-or-habit.

**Pretest.**
1. Why is every `.ts` segment an exact multiple of 188? *Answer: it is a chain of 188-byte packets with nothing between them.*
2. 50 M viewers, 4 s segments. Peak segment requests a second? *Answer: 12.5 million.*
3. Which is harder to cache, a playlist or a segment? *Answer: the playlist. It changes every few seconds and a stale copy stalls the player.*

**Rung 1, the picture.** A goods train made of identical wagons. Every wagon is the same length, and the first thing painted on each one is a bright mark so a signaller can find where a wagon starts, even halfway down the train. Inside, some wagons carry pictures, some carry sound, and a few carry the index that says which wagon is which. A longer train makes fewer trips but takes longer to load before it can leave. *Where it breaks:* a train can be shunted and reordered. Video packets must arrive in order, and the wait before the train leaves is exactly the latency you cannot get back.

**Rung 2, how it works.**
1. The encoder writes a stream of 188-byte packets.
2. Each packet starts with a 4-byte header: a `0x47` sync byte, a 13-bit program identifier, and a continuity counter.
3. The remaining 184 bytes carry a slice of video, a slice of audio, or a table that says which identifier is which.
4. The packager cuts the stream into segments at keyframe boundaries.
5. Each segment becomes one file, named with a number, and one line in the playlist.
6. The player fetches segments in order and decodes each one from its keyframe.

**Rung 3, the real thing.** Slide 32 draws the packet and gives the deck's own measured table. 720p: 1,613,416 bytes in 8,582 packets at 3.3% overhead. 480p: 823,440 bytes in 4,380 packets at 4.1%. 360p: 452,328 bytes in 2,406 packets at 5.6%. Our check: 188 × 8,582 = 1,613,416, 188 × 4,380 = 823,440 and 188 × 2,406 = 452,328. All three are exact, which is the slide's point. Slide 33 gives the segment-length board, with peak segment requests and a latency floor of three times the segment length. Slide 34 compares a playlist with a segment across five rows and names the playlist as the harder problem.

**Rung 4, exam depth.**
- *Both framing answers at once.* A fixed length says where the next packet starts. A sync byte lets a receiver that joined late find the boundary again. Session 2 presented these as alternatives. MPEG-TS uses both, because it was designed for a broadcast feed that a receiver tunes into mid-stream (S08-C152).
- *Why 188 and not 200.* The number came from the layer below, not from video. Section 6 gives the ATM cell derivation and its reference. The lesson generalises: a fixed frame size is almost always somebody else's constraint.
- *What the overhead figures include.* The 4-byte header alone is 4 ÷ 188, which is 2.13%. The measured figures are 3.3%, 4.1% and 5.6%, so the rest is adaptation fields, the program tables and padding. Overhead rises as the segment shrinks, because the fixed tables cost relatively more (S08-C155).
- *Why one byte stream carries three things.* A 13-bit identifier per packet means audio, video and the tables interleave in one file and one TCP stream. That is multiplexing with an identity in every frame, which is the same trick as an HTTP/2 stream id (S08-C153).
- *fMP4 says it differently.* A CMAF or fMP4 segment is a chain of boxes, each a size, a type and a payload. That is type-length-value from Week 1, with the length first (S08-C154).
- *The segment-length trade, with both columns.* Shorter segments: more requests, more keyframes and so a worse compression ratio, and more round trips. Longer segments: more latency and a slower reaction to a bandwidth change. There is no free direction (S08-C159).
- *Why the latency floor is three times the segment length.* The player holds back three target durations, so it never plays a segment that may still be incomplete. That single rule turns a 4 s segment into a 12 s floor before any encode or network time (S08-C157). Module 9 budgets the rest.
- *The hybrid answer.* Use 1 to 2 s segments at start-up for a fast first frame, then longer ones. ffmpeg exposes it as `-hls_init_time 1 -hls_time 4` (S08-C160).
- *Why the playlist is the harder half.* It is 230 bytes gzipped and it changes every 4 s. A stale copy stalls playback or points at deleted files. It is billed by requests, like the scorecard. The segment is 450 to 1,600 KB, never changes, a stale copy is harmless, and it is billed by bytes (S08-C161 to S08-C165). Every property is inverted.
- *The board question.* At a 1 s playlist poll the peak is 50 M requests a second. At the RFC's one target duration it is 12.5 M (S08-C166). Four times the requests for no extra information.
- *Exam prompt.* Your CDN contract caps you at 10 M requests a second. Which segment lengths are available, and what does each cost you? *Model answer: segment requests alone are 50 M divided by the length, so 5 s or longer. Playlist polls at one target duration add the same amount again, so 10 s or longer for both together. At 10 s the latency floor is 30 s. Shorter segments only become possible if you cut the playlist request rate, with delta updates or a longer poll.*

**Misconceptions.**
- S08-M34: "A segment file size can be any number of bytes." Wrong. An MPEG-TS segment is an exact multiple of 188. Distractor in checks 1 and 2.
- S08-M35: "Shorter segments are simply better, because latency drops." Wrong. The request rate rises by the same factor, and more keyframes cost bit rate. Distractor in checks 3 and 4.
- S08-M36: "Segments are the hard caching problem, because they are large." Wrong. Segments never change, so they are the easy half. The playlist changes every few seconds and a stale copy stalls the player. Distractor in checks 5 and 6.
- S08-M37: "The sync byte exists for error detection." Wrong. It marks where a packet starts, so a receiver that joined mid-stream can resynchronise. Distractor in check 2.
- S08-M38: "Polling the playlist faster lowers latency." Wrong. The playlist only changes once per target duration. A faster poll buys requests, not information. Distractor in check 6.

**Diagrams.** (1) Static: one 188-byte packet drawn to scale, with the 4-byte header exploded into the sync byte, the 13-bit identifier and the counter. (2) Static: one segment as a long chain of packets, with three colours for video, audio and tables, and the exact packet count written at the end. (3) Static: the segment-length board as a two-axis chart, peak requests against latency floor, with the five rows plotted and the board's four annotations attached. (4) Static: the playlist against segment table, five rows, with every row shaded to show which object is the harder one.

**Interactives.** (1) *Packet counter* (P1). Input: a segment size in bytes. The learner sees the packet count, whether the size divides by 188, and the header-only overhead. The learner discovers that a size that is not a multiple of 188 cannot be a valid MPEG-TS segment. (2) *Segment-length dial* (P1). Inputs: segment length, peak viewers, playlist poll rule. The learner sees peak segment requests, peak playlist requests and the latency floor together. The learner discovers that the playlist half can exceed the segment half. (3) *Overhead breakdown* (P2). Inputs: segment length, table repeat interval. The learner sees the overhead split into header, tables and padding.

**Predict, observe, explain.** Show the 480p figure of 823,440 bytes. Predict the packet count before reading the table. Observe: 823,440 ÷ 188 = 4,380 exactly, which the slide confirms. Then predict the 360p count from 452,328 bytes. Observe: 2,406. Then ask what a size of 823,441 bytes would mean. Observe: it cannot be a plain MPEG-TS segment, because the division leaves a remainder.

- **Worked example.** 4 s segments, 50 M peak viewers. Peak segment requests: 50,000,000 ÷ 4 = 12.5 M a second. Latency floor: 3 × 4 = 12 s. Playlist polls at one target duration: another 12.5 M a second.
- **Faded example.** 6 s segments, same audience. Peak segment requests: ____. Latency floor: ____. Playlist polls: ____. *(8.3 M a second. 18 s. 8.3 M a second.)*
- **Your turn.** 2 s segments. What are the two numbers, and what does the deck call 30 s segments? *(25 M a second and a 6 s floor. The board writes "Too late!" against 30 s, whose floor is 90 s.)*

**Checks.**
1. `numeric`: a segment is 1,613,416 bytes. How many 188-byte packets? Answer: 8582. Distractor: 8581 (an off-by-one). Distractor: 8583 (S08-M34: assuming a partial last packet). Feedback: the division is exact, because a segment is nothing but whole packets.
2. `mcq`: what does the `0x47` sync byte at the start of each packet do? Answer: it marks where a packet begins, so a receiver that joined mid-stream can find the boundary. Distractor: it is a checksum over the payload (S08-M37). Distractor: it names the program (S08-M37). Distractor: it pads the header to four bytes (S08-M34). Feedback: fixed length plus a sync byte is both framing answers at once.
3. `numeric`: 50 M peak viewers, 3 s segments. Peak segment requests a second, in millions, to one decimal place? Answer: 16.7. Distractor: 12.5 (reading the 4 s row). Distractor: 50.0 (S08-M35: forgetting to divide). Feedback: viewers divided by the segment length.
4. `mcq`: you cut the segment length from 6 s to 2 s. What happens? Answer: the latency floor falls from 18 s to 6 s and the request rate triples. Distractor: the latency floor falls and nothing else changes (S08-M35). Distractor: the request rate falls too, because the files are smaller (S08-M35). Distractor: nothing, because the playlist rate is what matters (S08-M38). Feedback: there is no free direction on this knob.
5. `mcq`: which object gets the longer cache TTL, and why? Answer: the segment, because it never changes. Distractor: the playlist, because it is small (S08-M36). Distractor: both the same, so the cache stays consistent (S08-M36). Distractor: the segment, because it is large and expensive to fetch (S08-M36). Feedback: TTL follows the change rate.
6. `numeric`: a player polls a 4 s playlist every second, at 50 M peak viewers. Peak playlist requests a second, in millions? Answer: 50. Distractor: 12.5 (the RFC-conformant rate). Feedback: four times the requests, and the playlist still changes only every 4 s.

**Review cards.**
- Q: How long is one MPEG-TS packet, and how is it split? A: 188 bytes: a 4-byte header and a 184-byte payload.
- Q: What are the three things in the 4-byte header? A: The `0x47` sync byte, a 13-bit program identifier, and a continuity counter.
- Q: Why is a segment size always a multiple of 188? A: It is a chain of whole packets with nothing between them.
- Q: Why was 188 chosen? A: For the ATM cell train of the day, not for video.
- Q: Peak segment requests at 50 M viewers and 4 s segments? A: 12.5 million a second.
- Q: Why is the latency floor three times the segment length? A: The player holds back three target durations.
- Q: Which is the harder caching problem, playlist or segment? A: The playlist. It changes constantly and a stale copy stalls the player.
- Q: What does a stale segment cost you? A: Nothing. It never changes.
- Q: What does the hybrid ladder do at start-up? A: 1 to 2 s segments for a fast first frame, longer ones later.

**Lab.** Prove the 188-byte structure on any `.ts` file. Fetch one segment from a public HLS stream: `curl -s -o /tmp/s08/seg.ts <segment url>`. Then `stat -c %s /tmp/s08/seg.ts` and divide by 188 with `python3 -c "import os;n=os.path.getsize('/tmp/s08/seg.ts');print(n, n/188, n%188)"`. Expected: a remainder of 0. Then read the sync bytes: `xxd -l 16 /tmp/s08/seg.ts` shows `47` as the first byte, and `xxd -s 188 -l 4 /tmp/s08/seg.ts` shows `47` again at offset 188. Then count them all: `python3 -c "d=open('/tmp/s08/seg.ts','rb').read();print(sum(1 for i in range(0,len(d),188) if d[i]==0x47), len(d)//188)"`. Expected: the two numbers are equal, so every packet starts with the sync byte.

### s08-m09-buffers-latency

- **Title:** The buffer, the budget, and who picks the quality. **Minutes:** 25.
- **Big idea:** Live latency is a budget of four bars that you spend deliberately, the buffer is the safety you buy with it, and the player spends it again at every segment under a policy the product wrote.
- **Covers:** S08-C167, S08-C168, S08-C169, S08-C170, S08-C171, S08-C172, S08-C173, S08-C174, S08-C175, S08-C176, S08-C177, S08-C178, S08-C179, S08-C180, S08-C181, S08-C182, S08-C183, S08-C184, S08-C185, S08-C186, S08-C187, S08-C188, S08-C189.
- **Prereqs:** s08-m08-segments, s08-m01-push-or-pull, s07-m05-player-case-study, s07-m06-systems-that-survive, s02-m05-congestion-bbr.
- **Threads:** T-round-trip-tax, T-fix-causes-next, T-law-or-habit, T-littles-law.

**Pretest.**
1. With 4 s segments, how far behind the stadium is a default player? *Answer: about 20 s. Two seconds to encode, four while the segment fills, two to the CDN and a 12 s hold-back.*
2. Which bar of that budget is the largest, and who sets it? *Answer: the player hold-back of three target durations. The spec sets it.*
3. The scorecard says W ten seconds before the video shows it. What is the fix? *Answer: hold the score until playback passes the ball's wall-clock time.*

**Rung 1, the picture.** A bucket under a tap, with a hole in the bottom. The hole is the screen, which drains video at a steady rate. The tap is the network, which refills at a rate that changes. A deep bucket survives a minute with the tap off, and it also means the water you see now fell in a while ago. A shallow bucket shows you fresher water and runs dry the first time the tap sputters. *Where it breaks:* water is interchangeable and video is not. The bucket must drain in the order it filled, and a missing segment stops everything, even when later segments are already in the bucket.

**Rung 2, how it works.**
1. The player downloads segments ahead of the playhead and holds them in a buffer.
2. It plays out of the buffer at the real-time rate, so the buffer drains at one second per second.
3. It refills as fast as the network allows, so a fast link refills a 4 s segment in well under 4 s.
4. The latency budget adds up: encode time, the time while the newest segment fills, the time to the CDN, and the player hold-back.
5. The hold-back is three target durations, so a player never plays the newest, possibly incomplete, segment.
6. At every segment boundary the player chooses the next rendition, from measured throughput, from the buffer level, or from both.
7. The policy behind every choice is one sentence: a stall is worse than a lower rendition.

**Rung 3, the real thing.** Slide 35 draws the buffer: the played segments behind the playhead, 12 s buffered ahead of it, and the next segment still downloading. Slide 36 draws the budget as four bars whose widths are proportional to the times: about 2 s to encode, 4 s while the segment fills, about 2 s to the CDN, and a hold-back of three target durations, which is 12 s. The total is about 20 s with 4 s segments. The slide is explicit about trust: the encode and CDN times are typical guesses and the hold-back is the spec. Slide 36 then lists the four Low-Latency HLS ideas, all of them recycled from the first half of the class: parts of about 1 s, a blocking reload with `?_HLS_msn=`, preload hints, and delta updates with `EXT-X-SKIP`. With 1 s parts the hold-back becomes about 3 s, because Apple requires PART-HOLD-BACK of at least three parts. Slide 37 draws the spoiler timeline, with the wicket at 0 s, the scorecard at about 10 s and the video at about 20 s, and gives the two matching stamps: `"at": "2026-09-27T03:16:44.1Z"` in the score update and `#EXT-X-PROGRAM-DATE-TIME: 2026-09-27T03:16:44.365+0000` on the segment. Slide 38 gives the two ABR families and Netflix's measured result.

**Rung 4, exam depth.**
- *Add the budget up yourself.* 2 + 4 + 2 + 12 = 20 s. The hold-back is 60% of it, and nobody chose it per deployment. It is the spec applied to the segment length you picked in module 8.
- *What Low-Latency HLS actually changes.* Two bars shrink. Parts of 1 s shrink the fill bar from 4 s to 1 s. PART-HOLD-BACK of three parts shrinks the hold-back from 12 s to 3 s. Our own sum, not the slide's: 2 + 1 + 2 + 3 is about 8 s. The slide states only the hold-back change, so treat the 8 s as our arithmetic (section 7, item 7).
- *Every LL-HLS idea is a recycled one.* Parts are smaller segments. The blocking reload is long polling (module 1). Preload hints are early hints (module 5). Delta updates are diffs (module 6). The class is deliberate about this: nothing in LL-HLS is new, only newly standardised.
- *Why a bigger buffer is not a free win.* It survives a bad minute on a train. It costs latency one-for-one, and it costs memory on low-end phones and TV sticks (S08-C168). A one-segment buffer gives the lowest latency and stalls on the first slow segment.
- *The relationship nobody states.* More network means less buffer. On a fast link the refill of a 4 s segment takes a fraction of a second, so a small buffer is enough safety (S08-C170). The buffer size you need is a function of the worst refill you expect, not of the segment length.
- *The buffer is the stale cache.* When the playlist stops advancing, nothing new can be fetched, and the buffer is the only thing still delivering pictures (S08-C171). Module 10 shows exactly that failure.
- *Why the spoiler happens at all.* Two polling loops with different budgets. The scorecard path has a 10 s budget and the video path a 20 s budget. The gap is the spoiler window (S08-C180). It is not a bug in either path.
- *The spoiler fix is a clock, not a delay.* Stamp each score update with the ball's wall-clock time. The player already knows the wall-clock time of every segment, from `EXT-X-PROGRAM-DATE-TIME`. The app reveals an update only when playback passes that instant (S08-C181). The two systems then agree without talking to each other.
- *The two ABR families, and what each one gets wrong.* Throughput-based ABR reads the last few download rates, which is congestion control one layer up, and it over-reacts to one slow segment. Buffer-based ABR reads the buffer, which is a smoothed signal, and it reacts late to a genuine collapse. Netflix measured 10 to 20% fewer rebuffers from the buffer signal at a similar video rate (S08-C186).
- *Even the default is policy.* Apple suggests starting cellular viewers on the 730 kbps variant and Wi-Fi viewers on 2 Mbps (S08-C188). Nothing physical picks that. A product decision does.
- *Session 7's closing question, answered.* Every fallback hands you something worse than ideal. Here the player decides what "worse" means, at every segment, under rules the product wrote. A stall beats a soft picture, so the player steps down (S08-C187).
- *Exam prompt.* A product owner wants 5 s glass-to-glass latency on 4 s segments. Explain what has to change. *Model answer: the 4 s segment alone sets a 12 s hold-back, so 5 s is impossible with plain HLS. Parts of about 1 s cut the fill bar and the hold-back to about 1 s and 3 s. Encode and delivery still cost about 4 s together, so 5 s is at the edge even with Low-Latency HLS. Budget the parts first, then the encode path, and expect a request-rate increase.*

**Misconceptions.**
- S08-M39: "A bigger buffer is always safer, so make it as big as memory allows." Wrong. Every second of buffer is a second of latency, and low-end devices run out of memory. Distractor in checks 1 and 2.
- S08-M40: "The 12 s hold-back is a player setting somebody chose badly." Wrong. It is three target durations, from the spec, so it follows the segment length you picked. Distractor in checks 3 and 4.
- S08-M41: "Low-Latency HLS is a new protocol." Wrong. It is four recycled ideas: smaller pieces, long polling, early hints and diffs. Distractor in check 4.
- S08-M42: "The spoiler is a bug in the scorecard path." Wrong. Both paths work. They have different budgets, and the difference is the spoiler window. Distractor in check 5.
- S08-M43: "ABR should always pick the highest rendition the link can carry." Wrong. The policy is that a stall is worse than a lower rendition, so a player with a nearly empty buffer steps down regardless of throughput. Distractor in check 6.

**Diagrams.** (1) Static: the buffer as a timeline, with played segments, the playhead, 12 s of buffered segments, the downloading segment and the live edge marked. (2) Static: the four-bar latency budget to scale, with each bar labelled by its owner, and a second copy underneath showing the Low-Latency HLS version. (3) Step-by-step: the spoiler, three frames at 0 s, 10 s and 20 s, with the spoiler window shaded, then a fourth frame where the score is held until the stamps match. (4) Step-by-step: one ABR decision, with the throughput signal and the buffer signal shown side by side and the chosen rendition highlighted.

**Interactives.** (1) *Latency budget builder* (P1). Inputs: encode time, segment or part length, CDN time, hold-back in target durations. The learner sees the four bars and the total. The learner discovers that the hold-back dominates until parts shrink it. (2) *Buffer simulator* (P1). Inputs: segment length, buffer target, a bandwidth trace with a dropout. The learner sees the buffer level, any stall, and the latency behind live. The learner discovers that the same trace stalls a one-segment buffer and not a 12 s one. (3) *ABR duel* (P2). Inputs: a bandwidth trace, the policy choice. The learner sees rebuffer count and mean rendition for throughput-based and buffer-based rules on the same trace. The learner discovers why Netflix measured fewer rebuffers at a similar rate. (4) *Spoiler guard* (P2). Inputs: the score path latency and the video path latency. The learner sees the window, then switches the wall-clock guard on and watches it close.

**Predict, observe, explain.** Show the slide 36 bars with the hold-back bar hidden. Predict the total latency. Observe: 2 + 4 + 2 = 8 s, which is less than half the real figure. Then reveal the hold-back and observe 20 s. Then predict the Low-Latency HLS total with 1 s parts. Observe: the hold-back drops to about 3 s and the fill bar to about 1 s, so about 8 s by our own sum. The slide confirms only the hold-back figure.

- **Worked example.** 4 s segments. Encode 2 s, fill 4 s, CDN 2 s, hold-back 3 × 4 = 12 s. Total 20 s. Hold-back share: 12 ÷ 20 = 60%.
- **Faded example.** 6 s segments, same encode and CDN times. Fill: ____. Hold-back: ____. Total: ____. Hold-back share: ____. *(6 s. 18 s. 28 s. 64%.)*
- **Your turn.** 1 s parts with PART-HOLD-BACK of three parts, and the same 2 s encode and 2 s CDN. What is the total, and which bar is now largest? *(About 8 s. The encode and CDN bars are now 2 s each, so they are jointly the largest half of the budget. The hold-back is 3 s.)*

**Checks.**
1. `mcq`: you raise the player buffer target from 4 s to 30 s. What do you get and what do you pay? Answer: more tolerance of a bad network, paid for with 26 s more latency and more device memory. Distractor: more tolerance at no cost (S08-M39). Distractor: lower latency, because fewer refills are needed (S08-M39). Distractor: nothing changes, because the hold-back sets the latency (S08-M40). Feedback: every second of buffer is a second behind live.
2. `mcq`: a stream runs on a very fast link. What happens to the buffer you need? Answer: it falls, because a refill takes a fraction of a segment. Distractor: it rises, because more data arrives (S08-M39). Distractor: it stays the same, because the segment length fixes it (S08-M39). Distractor: it stays the same, because the spec fixes it (S08-M40). Feedback: buffer size follows the worst refill you expect.
3. `numeric`: 6 s segments, 2 s encode, 2 s to the CDN. Total live latency in seconds? Answer: 28. Distractor: 16 (S08-M40: using a fixed 6 s hold-back). Distractor: 10 (forgetting the hold-back). Feedback: the hold-back is three target durations, so 18 s here.
4. `multi`: which Low-Latency HLS ideas are recycled from earlier in the class? Answer: the blocking reload is long polling, preload hints are early hints, delta updates are diffs, parts are smaller segments. Distractor: parts use a new transport (S08-M41). Distractor: the blocking reload uses HTTP/2 push (S08-M41). Feedback: nothing in LL-HLS is new, only newly standardised.
5. `mcq`: the scorecard shows a wicket about ten seconds before the video does. What is the correct fix? Answer: stamp each update with the ball's wall-clock time and reveal it when playback passes that instant. Distractor: cut the scorecard TTLs to zero (S08-M42). Distractor: cache the scorecard for ten more seconds (S08-M42: a fixed delay breaks as soon as either budget moves). Distractor: speed up the video path to match (S08-M42). Feedback: the two paths agree on a clock, not on a delay.
6. `predict`: the buffer is nearly empty and the measured throughput is high. What does a buffer-based player do? Answer: it steps down. Distractor: it steps up, because throughput allows it (S08-M43). Distractor: it holds the current rendition (S08-M43). Distractor: it stalls deliberately to refill (S08-M43). Feedback: a stall is worse than a lower rendition.

**Review cards.**
- Q: The four bars of the live latency budget? A: Encode, the segment filling, delivery to the CDN, and the player hold-back.
- Q: How large is the hold-back, and who sets it? A: Three target durations. The spec sets it.
- Q: Total latency with 4 s segments, on the deck's figures? A: About 20 s.
- Q: Which two bars does Low-Latency HLS shrink? A: The fill bar, with about 1 s parts, and the hold-back, to about 3 s.
- Q: The four Low-Latency HLS ideas? A: Parts, a blocking playlist reload, preload hints, and delta updates with `EXT-X-SKIP`.
- Q: What does a large buffer cost? A: Latency, one second for one second, and device memory.
- Q: What keeps the picture going when the playlist stops advancing? A: The buffer.
- Q: What is the spoiler window? A: The gap between the score path latency and the video path latency, about 10 s here.
- Q: How do you close it? A: Stamp updates with wall-clock time and reveal them when playback passes that instant.
- Q: What did Netflix measure for buffer-based ABR? A: 10 to 20% fewer rebuffers at a similar video rate.
- Q: The policy behind every ABR rule? A: A stall is worse than a lower rendition.

**Lab.** Read a real hold-back and a real wall clock out of a playlist. Fetch any live HLS media playlist and look for the low-latency tags: `curl -s <media url> | grep -E 'PART-INF|PART-HOLD-BACK|SERVER-CONTROL|PROGRAM-DATE-TIME|TARGETDURATION'`. Expected on a plain live stream: a target duration and possibly program date times, and no part tags. Expected on a low-latency stream: `EXT-X-SERVER-CONTROL` with `PART-HOLD-BACK` and an `EXT-X-PART-INF` line. Then compute the implied latency yourself: `python3 -c "td=4;print('hold-back', 3*td, 's')"`, and compare with any `HOLD-BACK` attribute the playlist declares. Then take the newest `EXT-X-PROGRAM-DATE-TIME` value and compare it with `date -u +%FT%T.%3NZ`. The difference is the live edge latency of that stream, measured with two commands.

### s08-m10-many-cdns

- **Title:** Two CDNs, one stale playlist, and the 404 that stalls everybody. **Minutes:** 24.
- **Big idea:** Multi-CDN delivery needs four steering mechanisms at four speeds, and the sharpest failure in the whole class comes from serving a playlist stale after the origin has deleted what it names.
- **Covers:** S08-C190, S08-C191, S08-C192, S08-C193, S08-C194, S08-C195, S08-C196, S08-C197, S08-C198, S08-C199, S08-C200, S08-C201, S08-C202, S08-C203, S08-C204, S08-C205.
- **Prereqs:** s08-m09-buffers-latency, s08-m05-making-polling-survive, s06-m07-not-speed, s07-m06-systems-that-survive, s04-m09-routing.
- **Threads:** T-fix-causes-next, T-deployed-reality, T-name-in-message, T-law-or-habit.

**Pretest.**
1. Which mechanism changes CDN fastest, and which slowest? *Answer: fastest is client failover, at the next segment. Slowest is DNS, because resolvers cache.*
2. RFC 8216 says a removed segment must stay available for how long? *Answer: its own duration plus the playlist's duration. With 4 s segments and a 40 s window, that is 44 s.*
3. Which object must you never serve stale for long, and why? *Answer: the media playlist. A stale one names segments the origin has already deleted.*

**Rung 1, the picture.** Two parcel companies deliver the same catalogue. The catalogue lists the ten items currently in stock, and each company keeps its own photocopy of it. The warehouse clears old stock quickly. If one company hands out a photocopy from a minute ago, a customer orders item three, the warehouse no longer has it, and the customer gets a "not found" slip. Worse, the slip is itself photocopied and handed to the next forty customers. *Where it breaks:* a customer who gets a slip can try the other company. A video player cannot skip a segment, because the pictures must come in order.

**Rung 2, how it works.**
1. Two packagers write the same segment names to two origins, so either path serves the same stream.
2. Each CDN has an edge tier and a mid-tier, and the mid-tier shields the origin from edge misses.
3. DNS answers "which CDN" per region or ISP, and it changes slowly because resolvers cache.
4. The master playlist can list each rendition once per CDN, which gives a player a second path to try.
5. Content Steering serves a small JSON file, polled on its own TTL, naming the preferred CDN.
6. Client failover trips a circuit breaker on errors, and the next segment request goes to the other CDN.
7. The CDN itself answers "which edge". The viewer never chooses an edge.

**Rung 3, the real thing.** Slide 39 draws one app fanning out to two CDN paths, each edge to mid-tier to origin, with two packagers writing the same names. It lists the four steering mechanisms. Slide 40 walks the stale-playlist failure in four numbered steps and gives the measured evidence. ffmpeg's `delete_segments` keeps one unreferenced segment, and the deck watched `seg_000000` vanish 4 s after it left the playlist. RFC 8216 requires a removed segment to stay available for its own duration plus the playlist's duration, which is 4 plus 40, so 44 s. Our check: a 10-segment window of 4 s segments is a 40 s playlist, so the rule gives 44 s and ffmpeg's default gives about 4 s. The deck's fix, `-hls_delete_threshold 12`, keeps 12 unreferenced segments, which is 48 s of margin. Slide 40 records the run: at t = 47.0 s the playlist held `seg_000001` to `seg_000010` while the disk held `seg_000000` to `seg_000010`, and at t = 51.5 s both had advanced by one. Slide 41 gives the per-object cache table and the nginx location blocks.

**Rung 4, exam depth.**
- *Four mechanisms, four speeds.* DNS changes in minutes to hours, because resolvers cache. The master playlist changes when a player next reads it, which is once per session. Content Steering changes on its own TTL, which is seconds to minutes. Client failover changes at the next segment, which is seconds. Pick the slow ones for planned shifts and the fast one for an outage (S08-C193).
- *Why both packagers must write the same names.* Failover happens mid-stream. If CDN B names the same instant `seg_000011.ts` and CDN A names it something else, the player cannot continue its sequence. Identical naming is the contract that makes the second path usable at all.
- *Why the mid-tier exists.* It converts many edge misses into few origin requests, which is the same collapsing idea as module 5, one tier up (S08-C192).
- *The exact failure chain, in four links.* First, the origin deletes a segment too early. Second, a CDN serves a playlist stale during an origin blip, so the playlist still names it. Third, the segment request returns 404. Fourth, the 404 is itself negatively cached, so every player on that edge gets it until the negative TTL runs out. The deck's own words: "Serve stale may cause player issues." (S08-C198).
- *Why this failure is worse than an outage.* An origin that returns 503 lets the CDN serve stale and the players keep going. An origin that returns 404 for a segment named by a valid playlist produces a stall that looks like your bug, not the origin's. Session 6's stale-if-error has a catch, and this is it.
- *The fixes, and which one you own.* `-hls_delete_threshold 12` is the packager's fix. A playlist TTL of half a target duration or less is yours. Serving a playlist stale for one target duration at most is yours. Serving segments stale freely is free, because segments never change (S08-C199).
- *Apple's staleness test.* Treat a playlist as invalid when `Last-Modified` is more than three target durations behind `Date`, which is 12 s with 4 s segments (S08-C200). That is a client-side guard against exactly the chain above.
- *Read the cache table as four different objects.* The master gets minutes and may be served stale. The media playlist gets half a target duration and one target duration of stale at most. The segment gets a long TTL and free stale service. The scorecard gets half your freshness promise, stale while updating, 1 s for a 404 and 2 s for a 5xx (S08-C202). One system, four policies.
- *Why gzip the playlist.* It is text with huge repetition, it is fetched more often than anything else, and Apple makes compression a MUST. The two content types to add are `application/vnd.apple.mpegurl` and `application/json`, which covers the scorecard too (S08-C204).
- *The cache-key rule, again.* Keep per-viewer tokens out of the cache key (S08-C205). It is the same rule as `?since=` in module 6 and the VOD query string in module 7.
- *Exam prompt.* During a 30-second origin blip, players on CDN A stall for two minutes and players on CDN B do not. Explain, and name the two settings you would change. *Model answer: CDN A served the playlist stale past the origin's retention window, so the playlist named deleted segments and the 404 was negatively cached for longer than the blip. Change two settings: raise the packager retention above the RFC minimum of segment duration plus playlist duration, and cut the stale window for playlists to one target duration with a negative TTL of one second or none.*

**Misconceptions.**
- S08-M44: "Serve stale is always safe, because stale beats an error." Wrong. A stale playlist names deleted segments, so it turns one origin blip into a stall that outlives the blip. Distractor in checks 1 and 3.
- S08-M45: "DNS is the right way to fail over from a broken CDN." Wrong. Resolvers cache, so DNS changes in minutes to hours. Client failover changes at the next segment. Distractor in check 2.
- S08-M46: "ffmpeg keeps segments long enough by default." Wrong. `delete_segments` keeps one unreferenced segment, which is about one segment duration. The RFC asks for the segment duration plus the playlist duration. Distractor in checks 4 and 5.
- S08-M47: "A segment and its playlist should share one cache policy, for consistency." Wrong. Their change rates differ by orders of magnitude, and so must their TTLs. Distractor in check 6.
- S08-M48: "A multi-CDN setup works as long as both CDNs are configured." Wrong. Both packagers must also write identical segment names, or a mid-stream switch cannot continue the sequence. Distractor in check 2.

**Diagrams.** (1) Static: the two-path topology, app to two edges to two mid-tiers to two origins, with "same names" written across the two packagers. (2) Static: the four steering mechanisms on a time axis from seconds to hours, each with what it can and cannot do. (3) Step-by-step: the stale-playlist failure, five frames. The segment is deleted, the origin blips, the edge serves a stale playlist, the segment request gets 404, the 404 is cached and every player on that edge stalls. (4) Static: the four-object cache table, with each row colour-coded by how dangerous a stale copy is.

**Interactives.** (1) *Retention calculator* (P1). Inputs: segment duration, list size, delete threshold. The learner sees the RFC minimum, the actual retention and whether the gap is safe. The learner discovers that the default threshold of one fails the rule at every segment length. (2) *Stale playlist breaker* (P1). Inputs: origin blip length, playlist stale window, negative TTL for a 404. The learner sees the stall duration for players on that edge. The learner discovers that the stall can be several times the blip. (3) *Steering race* (P2). Inputs: which mechanism, resolver TTL, steering TTL, segment length. The learner sees how long until traffic actually moves.

**Predict, observe, explain.** Show the deck's ladder settings, `-hls_time 4` and `-hls_list_size 10`. Predict the RFC retention minimum. Observe: 4 + 40 = 44 s, which slide 40 states. Then predict what ffmpeg's default `delete_segments` behaviour gives. Observe: one unreferenced segment, so about 4 s, and the deck watched `seg_000000` vanish 4 s after it left the playlist. Then predict the threshold that meets the rule. Observe: 12, which gives 48 s.

- **Worked example.** 4 s segments, a 10-segment window. Playlist duration: 10 × 4 = 40 s. RFC minimum retention: 4 + 40 = 44 s. `-hls_delete_threshold 12` keeps 12 × 4 = 48 s. Margin: 4 s.
- **Faded example.** 6 s segments, a 5-segment window. Playlist duration: ____. RFC minimum: ____. Threshold needed: ____. *(30 s. 36 s. 6, which gives 36 s and no margin, so 7 for safety.)*
- **Your turn.** A 30 s origin blip, a playlist stale window of 60 s, and a negative TTL of 10 s for a 404. How long can a player on that edge stall? *(Up to about 40 s. The stale playlist keeps naming the deleted segment for the rest of the stale window, and each 404 is then held for 10 s after that. The stall outlives the blip.)*

**Checks.**
1. `mcq`: why can serving a playlist stale be worse than returning an error? Answer: the stale playlist names segments the origin has deleted, so players get a 404 and stall. Distractor: it costs more bandwidth (S08-M44). Distractor: it breaks the ETag (S08-M44). Distractor: it cannot be worse. Stale always beats an error (S08-M44). Feedback: the deck's own line is "Serve stale may cause player issues."
2. `order`: order these four steering mechanisms from fastest to slowest to take effect. Answer: client failover, Content Steering, the master playlist, DNS. Distractor order starting with DNS (S08-M45). Feedback: resolvers cache, so DNS is the slowest lever you have.
3. `numeric`: 4 s segments, a 10-segment window. The RFC 8216 minimum retention for a removed segment, in seconds? Answer: 44. Distractor: 4 (S08-M46). Distractor: 40 (forgetting the segment's own duration). Feedback: the segment duration plus the playlist duration.
4. `spot-bug`: a packager runs with `delete_segments` and no threshold, and the CDN serves playlists stale for 30 s. What breaks and when? Answer: a segment is deleted about 4 s after it leaves the playlist, while the stale playlist still names it, so players get a cached 404 and stall. Distractor: nothing, because the playlist is correct at the origin (S08-M44). Distractor: the master playlist goes stale (S08-M47). Feedback: the origin and the cached playlist must agree about what exists.
5. `numeric`: 6 s segments, a 10-segment window. What `-hls_delete_threshold` value just meets the RFC rule? Answer: 11. Distractor: 1 (S08-M46). Distractor: 10 (forgetting the segment's own duration). Feedback: 6 + 60 = 66 s, and 11 × 6 = 66 s.
6. `multi`: which cache settings are correct for a live stream? Answer: the segment gets a long TTL and free stale service, the media playlist gets half a target duration, the master gets minutes, the scorecard gets a 1 s negative TTL. Distractor: the playlist and the segment share one TTL (S08-M47). Distractor: the segment gets a 3-minute negative TTL (S08-M44). Feedback: four objects, four change rates, four policies.

**Review cards.**
- Q: The four ways to steer a player between CDNs? A: DNS, the master playlist listing each rendition per CDN, Content Steering, and client failover.
- Q: Which is fastest, and which is slowest? A: Client failover, at the next segment. DNS, because resolvers cache.
- Q: What must two packagers agree on? A: The segment names, so a mid-stream switch can continue the sequence.
- Q: What does the mid-tier do? A: It shields the origin, turning many edge misses into few origin requests.
- Q: How long must a removed segment stay available? A: Its own duration plus the playlist duration. 44 s, with 4 s segments and a 40 s window.
- Q: What does ffmpeg's `delete_segments` keep by default? A: One unreferenced segment, which is far short of the RFC rule.
- Q: The four links of the stale-playlist failure? A: Early deletion, a stale playlist, a 404, and that 404 negatively cached.
- Q: Apple's playlist staleness test? A: Invalid when `Last-Modified` is more than three target durations behind `Date`.
- Q: Which two content types must the gzip list cover? A: `application/vnd.apple.mpegurl` and `application/json`.
- Q: How long may you serve a media playlist stale? A: One target duration at most.

**Lab.** Reproduce the whole failure locally, in one directory, with no live service touched. `mkdir -p /tmp/s08/m10 && cd /tmp/s08/m10`. Produce a live-shaped stream from any mp4: `ffmpeg -re -i input.mp4 -c copy -f hls -hls_time 4 -hls_list_size 10 -hls_flags delete_segments -hls_delete_threshold 1 index.m3u8`. In a second terminal, watch the disk against the playlist: `while sleep 2; do echo "--- $(date +%T)"; grep -c '^seg' index.m3u8; ls seg_*.ts | head -1; done`. Expected: the first file on disk tracks the first file in the playlist within about one segment. Now simulate the stale playlist by hand: `cp index.m3u8 stale.m3u8`, wait 20 s, then try to fetch the oldest segment that `stale.m3u8` names. Expected: the file is gone, which is the 404 the slide describes. Then stop ffmpeg and rerun it with `-hls_delete_threshold 12`, repeat the test, and expect the file to still exist. Never run this against a real origin.

### s08-m11-making-the-stream

- **Title:** Two ffmpeg commands, run for real. **Minutes:** 20.
- **Big idea:** A segment length is a request, not a promise, because the packager can only cut where a keyframe already sits, and fixing the keyframe interval in frames quietly breaks at a different frame rate.
- **Covers:** S08-C206, S08-C207, S08-C208, S08-C209, S08-C210, S08-C211, S08-C212, S08-C213, S08-C214, S08-C215, S08-C216, S08-C217, S08-C218, S08-C219, S08-C220.
- **Prereqs:** s08-m08-segments, s08-m07-hls-playlists, s08-m10-many-cdns, s01-m07-see-the-bytes-tls.
- **Threads:** T-honest-benchmarks, T-setup-off-path, T-law-or-habit, T-deployed-reality.

**Pretest.**
1. You ask for 4 s segments with `-codec: copy` and get 8.33 s. Why? *Answer: copy cannot create keyframes, and the source has one every 250 frames, which is 8.33 s at 30 fps.*
2. `-g 120` gives 4 s segments on one file and 5 s on another. What differs? *Answer: the frame rate. 120 ÷ 30 is 4 s and 120 ÷ 24 is 5 s.*
3. You set `-hls_list_size 5` and the playlist ends with 11 entries. Why? *Answer: an EVENT playlist only grows. The window is ignored.*

**Rung 1, the picture.** A long roll of wallpaper with a pattern that repeats every so often. You may only cut where the pattern starts, or the two pieces will not match on the wall. If you ask for pieces of one metre and the pattern repeats every two metres, you get two-metre pieces and your request is ignored politely. To get one-metre pieces you must reprint the roll with a pattern that repeats every metre. *Where it breaks:* a wallpaper pattern repeats in centimetres, which is the same measure you cut in. A keyframe interval is counted in frames, and segments are measured in seconds, so the two only agree at one frame rate.

**Rung 2, how it works.**
1. `-re` makes ffmpeg read the input at its native speed, so a file behaves like a camera.
2. `-codec: copy` passes the encoded video through, so no new keyframe can appear.
3. The HLS muxer cuts a new segment at the first keyframe at or after the target length.
4. So the real segment length is the keyframe interval, rounded up to the target.
5. To control the length, re-encode and fix the keyframe interval, which the ladder does.
6. `-var_stream_map` and `-master_pl_name` write several media playlists and one master in a single run.

**Rung 3, the real thing.** Slide 42 gives the one-liner and a flag table. The deck ran it and recorded two surprises. First, 8.33 s segments instead of the 4 s requested, because x264 defaults to a keyframe every 250 frames and 250 ÷ 30 = 8.33 s. Second, the window was ignored, because `-hls_playlist_type event` makes the playlist append-only, so 11 segments were listed at the end. Slide 42 also names the real pipeline: camera, then RTMP or SRT, then a transcoder, then a packager, then an origin, then a CDN. Slide 43 gives the annotated ladder. `split=3` decodes once and encodes three times. `-g 120 -keyint_min 120 -sc_threshold 0` fixes the keyframe interval, and 120 frames is 4 s at 30 fps only. A 24 fps source gave 5 s segments with the same setting. The three rungs are 3000k video with 128k audio, 1500k with 96k, and 800k with 64k, and every `maxrate` is 1.07 times its bit rate while every `bufsize` is 1.5 times it. Our check: 3210 ÷ 3000, 1605 ÷ 1500 and 856 ÷ 800 all give 1.07, and 4500, 2250 and 1200 all give 1.5. The flag set `independent_segments+delete_segments+omit_endlist+program_date_time` with `-hls_list_size 10` gives a 40 s window that never ends, stamped with wall-clock time.

**Rung 4, exam depth.**
- *Why the target is only a target.* The muxer cuts at a keyframe. With `-codec: copy` it cannot make one, so it waits for the next existing one. `-hls_time 4` is therefore a floor on the length, not a value (S08-C209).
- *Why the frame count is the wrong unit.* `-g 120` counts frames. The playlist measures seconds. The two agree at 30 fps and disagree everywhere else. A 24 fps source gives 5 s segments, and a 25 fps source gives 4.8 s. Homework 5 asks for the proof, and the fix is a time expression rather than a frame count (S08-Q16).
- *Why `-sc_threshold 0` matters.* Without it x264 inserts an extra keyframe on a scene change, so the interval becomes irregular and the segments become uneven. Setting it to zero makes the interval exact, which is what a multi-CDN deployment needs for identical segment names from two packagers.
- *Why `independent_segments` matters.* It promises that each segment decodes without the one before it. Without that promise a player cannot start at an arbitrary segment, and a mid-stream CDN switch becomes unsafe.
- *Why `omit_endlist` and `delete_segments` go together.* `omit_endlist` says the stream never ends, which is what makes it live. `delete_segments` keeps the disk bounded. Module 10 showed the trap in the second one, and the threshold is the fix.
- *Why `maxrate` is 1.07 times the bit rate.* It caps the instantaneous rate a few percent above the average, so one busy scene cannot exceed the rendition's declared bandwidth. `bufsize` at 1.5 times sets the window the rate control smooths over. Both numbers are conventions, and the deck uses them consistently across all three rungs (S08-C218).
- *Why `split=3` is the cheap part.* One decode feeds three encodes. The decode is the shared setup, paid once, which is the recurring thread of the whole course (S08-C215).
- *The honest-benchmark lesson.* The deck asked for 4 s and 5 segments, and got 8.33 s and 11 segments. Both numbers came from running it, not from reading the manual. Report what the run produced, then explain the gap.
- *Exam prompt.* Your packager produces 8.33 s segments and the product needs 4 s. You cannot re-encode, because the upstream feed is already compressed. What are your options? *Model answer: with no re-encode, none. The keyframe interval is in the bytes. Either ask the upstream encoder for a 4 s keyframe interval, which is the right fix, or re-encode and pay the CPU. A transcoder in the pipeline exists for exactly this reason.*

**Misconceptions.**
- S08-M49: "`-hls_time 4` guarantees 4-second segments." Wrong. The muxer cuts at a keyframe, so the keyframe interval decides. Distractor in checks 1 and 2.
- S08-M50: "`-g 120` means 4 seconds." Wrong. It means 120 frames, which is 4 s only at 30 fps. Distractor in checks 3 and 4.
- S08-M51: "`-hls_list_size 5` always gives a 5-entry playlist." Wrong. An EVENT playlist only grows, so the window is ignored. Distractor in check 5.
- S08-M52: "`-codec: copy` saves CPU and changes nothing else." Wrong. It also removes your control over the keyframe interval, and so over the segment length. Distractor in check 1.
- S08-M53: "One ffmpeg run can only produce one rendition." Wrong. `split` plus `-var_stream_map` and `-master_pl_name` write the whole ladder and the master in one run. Distractor in check 6.

**Diagrams.** (1) Static: the one-liner with each flag annotated, and the two measured surprises attached to the flags that caused them. (2) Static: a film strip with keyframes marked every 250 frames, and the requested 4 s cut points drawn as dotted lines that have to slide right to the nearest keyframe. (3) Static: the real pipeline as six boxes, camera to CDN, with the one-liner's scope drawn as a bracket over just two of them. (4) Static: the ladder as a table, three rungs with bit rate, `maxrate`, `bufsize` and the resulting BANDWIDTH, with the 1.07 and 1.5 multipliers shown.

**Interactives.** (1) *Segment length predictor* (P1). Inputs: frame rate, keyframe interval in frames, requested `hls_time`, copy or re-encode. The learner sees the real segment length. The learner discovers that the requested value only wins when the keyframe interval divides it. (2) *Frame rate trap* (P2). Input: a frame rate slider with `-g 120` fixed. The learner sees the segment length move from 4 s at 30 fps to 5 s at 24 fps to 2 s at 60 fps. (3) *Ladder builder* (P2). Inputs: three bit rates. The learner sees `maxrate`, `bufsize` and the BANDWIDTH value each rung will declare.

**Predict, observe, explain.** Show the slide 42 one-liner. Predict the segment length from `-hls_time 4` alone. Then reveal that the source has a 250-frame keyframe interval at 30 fps. Observe: 8.33 s, which the deck measured. Then predict the playlist length from `-hls_list_size 5`. Observe: 11 entries, because `event` makes the playlist append-only. Both observations come from slide 42, and both are the deck's own run.

- **Worked example.** 30 fps source, `-g 120`. Keyframe interval: 120 ÷ 30 = 4.0 s. Requested `-hls_time 4`. Result: 4 s segments, because the interval divides the request exactly.
- **Faded example.** 24 fps source, same `-g 120` and same `-hls_time 4`. Keyframe interval: ____. Result: ____. Why: ____. *(5.0 s. 5 s segments. The muxer must wait for the next keyframe, which arrives after the 4 s target.)*
- **Your turn.** 60 fps source, `-g 120`, `-hls_time 4`. What do you get, and is it what you asked for? *(The keyframe interval is 2.0 s, so the muxer cuts at the first keyframe at or after 4 s, which is exactly 4 s. You get what you asked for, by luck, because 2 divides 4.)*

**Checks.**
1. `predict`: `ffmpeg -re -i in.mp4 -c copy -hls_time 2 -f hls out.m3u8`, on a source with keyframes every 250 frames at 30 fps. What segment length appears in the playlist? Answer: about 8.33 s. Distractor: 2 s (S08-M49). Distractor: 4 s (S08-M49). Distractor: 250 s (misreading the unit). Feedback: copy cannot create a keyframe, so the existing interval decides.
2. `mcq`: which single change gives you real control of the segment length? Answer: re-encode with a fixed keyframe interval. Distractor: lower `-hls_time` (S08-M49). Distractor: add `-hls_list_size` (S08-M51). Distractor: switch the playlist type to `event` (S08-M51). Feedback: the keyframe interval is in the bytes, so only a re-encode moves it.
3. `numeric`: a 25 fps source with `-g 120`. Segment length in seconds? Answer: 4.8. Distractor: 4 (S08-M50). Distractor: 5 (reading the 24 fps case). Feedback: 120 ÷ 25 = 4.8.
4. `mcq`: you want 4 s segments at any frame rate. What do you use? Answer: a time-based keyframe option, such as forcing a keyframe every 4 s of wall-clock time. Distractor: `-g 120`, which works everywhere (S08-M50). Distractor: `-hls_time 4` alone (S08-M49). Distractor: `-keyint_min 120` alone (S08-M50). Feedback: a frame count is a frame count. Only a time expression survives a frame-rate change.
5. `spot-bug`: `-hls_playlist_type event -hls_list_size 5`, and the playlist ends with 11 entries. What is wrong? Answer: nothing is wrong. An EVENT playlist is append-only, so the window is ignored. Distractor: the muxer ignored the flag by mistake (S08-M51). Distractor: the segments were too short (S08-M49). Feedback: pick the playlist type that matches the window you want.
6. `numeric`: a ladder encodes 800k of video. What `maxrate` and `bufsize` does the deck's convention give, in kbit/s? Answer: 856 and 1200. Distractor: 800 and 800 (ignoring the multipliers). Feedback: 1.07 times the bit rate and 1.5 times the bit rate.

**Review cards.**
- Q: What does `-re` do? A: It reads the input at native speed, so a file behaves like a camera.
- Q: Why can `-codec: copy` not honour `-hls_time`? A: It cannot create a keyframe, so it must cut at the existing ones.
- Q: Why did the one-liner give 8.33 s segments? A: x264 defaults to a keyframe every 250 frames, which is 8.33 s at 30 fps.
- Q: What does `-hls_playlist_type event` do to the window? A: It ignores it. An EVENT playlist only grows.
- Q: What is `-g 120` in seconds? A: 4 s at 30 fps, 5 s at 24 fps, 4.8 s at 25 fps.
- Q: What does `-sc_threshold 0` prevent? A: An extra keyframe on a scene change, which would make the interval irregular.
- Q: What do `maxrate` and `bufsize` multiply the bit rate by, in the deck's ladder? A: 1.07 and 1.5.
- Q: What does `split=3` save? A: Two decodes. One decode feeds three encodes.
- Q: What does the flag set `delete_segments+omit_endlist+program_date_time` give? A: A bounded disk, a stream that never ends, and wall-clock stamps.
- Q: The real pipeline, in order? A: Camera, RTMP or SRT, transcoder, packager, origin, CDN.

**Lab.** Reproduce both surprises on your own machine. `mkdir -p /tmp/s08/m11 && cd /tmp/s08/m11`. Make a 60-second 30 fps test clip with no shortcuts: `ffmpeg -f lavfi -i testsrc2=size=640x360:rate=30 -t 60 -c:v libx264 -g 250 -sc_threshold 0 in.mp4`. Now run the deck's one-liner: `ffmpeg -re -i in.mp4 -codec: copy -hls_time 4 -hls_list_size 5 -hls_playlist_type event -f hls index.m3u8`. Then read the result: `grep EXTINF index.m3u8 | head -3` and `grep -c '^index' index.m3u8`. Expected: `EXTINF` values near 8.333333, not 4, and more than 5 entries. Then prove the frame-rate trap: build a 24 fps clip with `-g 120` and segment it with a re-encode, and read the `EXTINF` values again. Expected: about 5.000000. That second run is homework 5, so record your own numbers.

### s08-m12-whole-course

- **Title:** The whole course in one cricket match. **Minutes:** 22.
- **Big idea:** Four sentences carry the eight weeks: pull scales through caches and push scales through machines, number the pieces and cache them for ever, latency is a budget you spend on safety, and know which bill you are on.
- **Covers:** S08-C221, S08-C222, S08-C223, S08-C224, S08-C225, S08-C226, S08-C227, S08-C228, S08-C229, S08-C230, S08-C231, S08-C232, S08-C233.
- **Prereqs:** s08-m01-push-or-pull, s08-m04-the-arithmetic, s08-m06-diffs-and-versions, s08-m09-buffers-latency, s08-m10-many-cdns, s07-m07-synthesis.
- **Threads:** T-where-state-goes, T-framing, T-littles-law, T-setup-off-path, T-fix-causes-next, T-round-trip-tax.
- **Site note:** this is the course closing page. It teaches nothing new. It gives the learner one page to revise the eight weeks from, and every bullet links to the module that taught it.

**Pretest.**
1. One sentence: when does an answer belong in a CDN? *Answer: when it is the same answer for everybody.*
2. A small changing index over numbered pieces that never change. Name two systems with that shape. *Answer: the versioned scorecard and an HLS playlist.*
3. Where does a live stream spend its latency? *Answer: on poll intervals, cache TTLs, segment length and the player hold-back.*

**Rung 1, the picture.** A stadium with three ways of telling the crowd outside what is happening. A big scoreboard anybody can read, a numbered film reel the cinema down the road collects piece by piece, and a staff member with a phone for each person who asked to be called. The first two scale because they do not know who is watching. The third scales only by hiring. Everything the course taught is a consequence of that difference. *Where it breaks:* a real stadium has one crowd, and a real system has fifty million separate networks, each with its own worst minute.

**Rung 2, how it works.** The four ideas, in the order the deck gives them.
1. Pull scales through caches, and push scales through machines. The same answer for everybody belongs in a CDN. A different answer per person means you are buying sockets.
2. Number the pieces, then cache them for ever. A small changing index plus numbered pieces that never change. The versioned scorecard and the HLS playlist are one design.
3. Latency is a budget you spend on safety. Poll intervals, TTLs, segment length and hold-back all add up. Decide where each second goes.
4. Know which bill you are on. Below about 11 KB you pay per request, and above it you pay per byte. Scorecards and playlists are the first kind, and segments the second.

**Rung 3, the real thing.** Slide 44 maps each week into the match, and every line is a concrete artefact from an earlier week. Week 1: a port is 16 bits, so a test client gets 28k sockets per destination, and base64 appears in the WebSocket handshake. Week 2: framing by delimiter in SSE, by length in a WebSocket, by fixed length in a 188-byte packet, and playlists as control against segments as data. Week 3: fifty million held sockets, Little's Law, and nothing free per connection. Week 4: the origin, with `proxy_cache_lock`, `proxy_cache_use_stale` and one location per file type. Week 5: ETag and 304, keep-alive, the 101 upgrade, and the death of server push shaping Low-Latency HLS. Week 6: tiers, collapsing, negative caching, and paying per request or per byte. Week 7: jitter, the live-edge 404, stale-if-error, failover, and who decides "worse". Week 8: HLS as a playlist, polled like a scorecard, over bytes that never change. Slide 45 compresses all of it into the four ideas, and slide 48 closes with the sentence the class opened on.

**Rung 4, exam depth.**
- *Why "the same answer for everybody" is the real test.* Not "is it static", not "is it small". A cache serves one copy to many askers, so the only question that matters is whether one copy answers them all. The Hotstar sentence is the counter-example: a per-viewer feed cannot be cached at any level, so they bought sockets (S08-C230).
- *Why numbering is the enabling trick.* An immutable, numbered piece can be cached for ever, served stale freely, prefetched, and fetched again after a failure with no coordination. The small index carries all the change. Put the change in the big object instead and every property is lost (S08-C231).
- *Why latency is a budget and not a target.* Each second you add buys something concrete: a cache TTL buys origin protection, a buffer buys tolerance of a bad network, a hold-back buys protection against an incomplete segment. The right question is never "how low can latency go" but "what did I buy with each second" (S08-C232).
- *Why the bill question changes the design.* Two objects in one system sit on opposite sides of the 11 KB line, so they need opposite optimisations. For the playlist you cut requests, with longer polls and delta updates. For the segment you cut bytes, with a better codec and a sensible ladder. Optimising the wrong one wastes the work (S08-C233).
- *The one sentence that holds the course together.* Every week showed up in one match, and that was the point of the course (S08-C229). The claim is testable: pick any artefact in the match and name the week it came from.
- *What this course did not cover.* No DRM, no SVC or layered coding, no WebRTC for sub-second latency, no per-title encoding, and no live advertisement insertion. Each is a large subject that sits directly on top of what the eight weeks taught.
- *Exam prompt.* You are given a new real-time feature and twenty minutes. What four questions do you ask, in order? *Model answer: first, is the answer the same for everybody, which decides pull against push. Second, can I split it into a small changing index over immutable numbered pieces. Third, what is my freshness promise, and how do I spend it across poll interval, TTLs and buffer. Fourth, what is the mean object size, so I know whether to cut requests or bytes.*

**Misconceptions.**
- S08-M54: "The four ideas are about video." Wrong. Three of them never mention video, and the scorecard demonstrates all four. Distractor in checks 1 and 4.
- S08-M55: "Static content belongs in a CDN, and dynamic content does not." Wrong. The test is whether the answer is the same for everybody. A scorecard changes every ball and caches perfectly. Distractor in checks 1 and 2.
- S08-M56: "Lower latency is always the goal." Wrong. Latency is a budget, and each second buys origin protection, network tolerance or safety against an incomplete segment. Distractor in check 3.
- S08-M57: "One optimisation serves every object in a system." Wrong. The playlist needs fewer requests and the segment needs fewer bytes. The 11 KB line separates them. Distractor in check 4.

**Diagrams.** (1) Static: the eight-week grid, each card naming its artefact inside the match, with a link to the module that teaches it. (2) Static: the four ideas as four cards, each with the scorecard example and the video example side by side. (3) Static: one decision tree, from "is the answer the same for everybody" through "can you number the pieces" to "where is your mean object size", ending at four named designs.

**Interactives.** (1) *Course map* (P1). Input: click any artefact in a drawing of the match. The learner sees which week taught it and jumps to that module. The learner discovers that the eight weeks are not eight subjects. (2) *Design chooser* (P2). Inputs: answers to the four questions. The learner sees a named design and the first failure it will meet. The learner discovers that the four answers determine the architecture almost completely.

**Predict, observe, explain.** Give the learner the three request lines from slide 1, with no labels: a 1,088-byte body every 15 s, a 228-byte body every 4 s, and one 823,440-byte body fetched once. Predict which of the three is billed by requests and which by bytes. Observe: the first two by requests and the third by bytes, because the break-even is about 11 KB. Then predict which one may be cached for ever. Observe: the third, because it never changes. The whole course, from three lines of a log.

- **Worked example.** Apply the four questions to the scorecard. Same answer for everybody: yes, so pull it through a CDN. Can you number the pieces: yes, the version number, with the last few changes in one shared file. Freshness budget: 25 s, spent as 5 plus 5 plus 15. Mean object size: 1 KB, so cut requests, not bytes.
- **Faded example.** Apply the same four questions to a live video segment. Same answer for everybody: ____. Numbered pieces: ____. Budget: ____. Mean size: ____, so cut ____. *(Yes. Yes, the media sequence number. About 20 s, mostly the 12 s hold-back. 823 KB, so cut bytes.)*
- **Your turn.** Apply them to a per-viewer "your team" notification feed. *(Not the same answer for everybody, so a cache cannot help. You are buying sockets, which is Hotstar's case exactly. Either accept a stateful fleet, or restructure it into a shared file plus a small per-viewer filter applied on the phone.)*

**Checks.**
1. `mcq`: which single question decides pull against push? Answer: is the answer the same for everybody? Distractor: is the content static? (S08-M55). Distractor: is the object small? (S08-M55). Distractor: is it video? (S08-M54). Feedback: a cache serves one copy to many askers, so that is the only question that matters.
2. `mcq`: a scorecard changes every 25 to 45 s. Can a CDN cache it? Answer: yes, because every viewer gets the same body. Distractor: no, because it is dynamic (S08-M55). Distractor: only with a per-viewer key (S08-M55). Distractor: only as a 304 (S08-M55). Feedback: changing often is not the same as differing per viewer.
3. `mcq`: you cut every TTL to zero and the buffer to one segment. What have you bought and lost? Answer: the lowest latency, at the cost of origin protection and any tolerance of a bad network. Distractor: a strictly better system (S08-M56). Distractor: nothing changes, because the hold-back dominates (S08-M56). Distractor: lower cost, because less is cached (S08-M56). Feedback: every second of latency was buying something.
4. `multi`: which objects do you optimise by cutting requests? Answer: the media playlist, the scorecard. Distractor: the video segment (S08-M57). Distractor: all four objects equally (S08-M57). Feedback: below about 11 KB the request fee dominates.
5. `recall`: name the four ideas to keep. Answer: pull scales through caches and push scales through machines. Number the pieces and cache them for ever. Latency is a budget you spend on safety. Know which bill you are on. Feedback: three of the four never mention video.

**Review cards.**
- Q: Idea 1, in one sentence? A: Pull scales through caches, and push scales through machines.
- Q: Idea 2, in one sentence? A: Number the pieces, then cache them for ever.
- Q: Idea 3, in one sentence? A: Latency is a budget you spend on safety.
- Q: Idea 4, in one sentence? A: Know which bill you are on.
- Q: The test for "can a CDN help"? A: Is the answer the same for everybody?
- Q: Which two designs share one shape? A: The versioned scorecard and the HLS playlist.
- Q: Which four things add up to your latency? A: Poll intervals, cache TTLs, segment length and the player hold-back.
- Q: The closing line of the course? A: Every live stream is a scorecard with bigger bytes.

**Lab.** No commands. This page ends with one written exercise instead. Pick a feature in a system you have built, and answer the four questions on one page: is the answer the same for everybody, can it become a small index over numbered pieces, what is the freshness promise and where does each second go, and what is the mean object size. Then name the first thing that will break. Keep the page. It is the shortest design review in the course.
## 6. Beyond the slides

Facts the lessons need for correctness that the deck does not state. Every row
carries an authoritative reference. A lesson page shows these with a "beyond
the slides" badge. Rows 1 to 10 were read from the RFC text on 2026-10-10.

| Fact | Reference |
|---|---|
| BANDWIDTH is a **peak**, not an average. "It represents the peak segment bit rate of the Variant Stream." A separate AVERAGE-BANDWIDTH attribute carries the average. So the deck's (video + audio) × 1.1 declares a peak, and a player compares its measured throughput against that peak. | RFC 8216 §4.3.4.2 |
| Every segment MUST be no longer than the target duration. A longer segment "can trigger playback stalls". The tag is REQUIRED. | RFC 8216 §4.3.3.1 |
| The removal rule, in the RFC's own words: "the corresponding Media Segment MUST remain available to clients for a period of time equal to the duration of the segment plus the duration of the longest Playlist file distributed by the server containing that segment." That is the slide 40 sum of 4 plus 40. | RFC 8216 §6.2.2 |
| The reload rules are normative, and both are MUST. After a change the client "MUST wait for at least the target duration before attempting to reload the Playlist file again", measured from when it last began loading. After no change it "MUST wait for a period of one-half the target duration before retrying". | RFC 8216 §6.3.4 |
| The halt rule, with its reason: a client SHOULD check that each segment keeps the same URI as the segment with the same media sequence number in the previous playlist, and "SHOULD halt playback if it does not, as this normally indicates a server error." | RFC 8216 §6.3.4 |
| The hold-back is a client rule, phrased as a starting-point restriction: "the client SHOULD NOT choose a segment that starts less than three target durations from the end of the Playlist file." It applies when `EXT-X-ENDLIST` is absent. So the deck's 12 s is 3 × 4 s, and nobody configured it. | RFC 8216 §6.3.3 |
| The server side of the same clock: a new playlist version appears "no earlier than one-half the target duration after that time, and no later than 1.5 times the target duration." | RFC 8216 §6.2.1 |
| The RFC says gzip is a **SHOULD**, not a MUST: "HTTP servers SHOULD transfer text files -- such as Playlists and WebVTT segments -- using the gzip Content-Encoding if the client indicates that it is prepared to accept it." Slide 41 attributes a MUST to Apple's authoring specification, which is a stricter document than the RFC. Teach both levels. | RFC 8216 §6.2.1 |
| `EXT-X-ENDLIST` "indicates that no more Media Segments will be added to the Media Playlist file", and a playlist that holds the final segment MUST carry it. | RFC 8216 §4.3.3.4, §6.2.1 |
| `EXT-X-PROGRAM-DATE-TIME` "associates the first sample of a Media Segment with an absolute date and/or time". That is the stamp the spoiler guard of module 9 compares against. | RFC 8216 §4.3.2.6 |
| Request collapsing is in the HTTP caching standard, not only in vendor features. A cache may "collapse requests" by combining "multiple incoming requests into a single forward request upon a cache miss". | RFC 9111 §4 |
| Heuristic freshness, when no explicit lifetime exists: a cache is encouraged to use "no more than some fraction of the interval since that time", and "A typical setting of this fraction might be 10%." This is why an origin that sends no `Cache-Control` still gets cached. | RFC 9111 §4.2.2 |
| Serving stale is forbidden by default. "A cache MUST NOT generate a stale response unless it is disconnected", unless the client or the origin permits it, for example with `max-stale` or an extension directive. `no-cache` and `must-revalidate` each forbid it outright. | RFC 9111 §4.2.4, §5.2.2.2 |
| `stale-while-revalidate` and `stale-if-error` are **not** in RFC 9111. RFC 9111 only points at the extension that defines them. So "serve stale while updating" needs a cache that implements RFC 5861 or an equivalent vendor feature. | RFC 5861, referenced from RFC 9111 §4.2.4 |
| `public` "explicitly marks the response as cacheable". The unqualified `private` directive means "a shared cache MUST NOT store the response". That is the pair behind module 5's collapsing failure. | RFC 9111 §5.2.2.9, §5.2.2.7 |
| A cache MUST add an `Age` header when it serves a stored response without validating it. `Age` is therefore the field that proves a stale playlist came from a cache, and the first thing to read when a player stalls. | RFC 9111 §5.1, §4.2.3 |
| **Why a CDN caches a 404 by default.** The spec makes it cacheable: "A 404 response is heuristically cacheable", and "A 404 status code does not indicate whether this lack of representation is temporary or permanent." So Cloudflare's 3-minute default follows the standard. Slide 24's warning is about the live edge, not about a vendor bug. 410 Gone exists for the permanent case. | RFC 9110 §15.5.5 |
| The deck's "Railgun → RFC 9842 deltas" is correct. RFC 9842, "Compression Dictionary Transport", September 2025, lets a previous version of a resource act as a dictionary for a newer one, which yields "a delta-compressed version of the changes". It defines `Use-As-Dictionary`, `Available-Dictionary` and `Dictionary-ID`, plus the `dcb` and `dcz` content encodings. | RFC 9842, §1.1.1 |
| The MPEG-TS packet layer is normative in the systems standard, not in HLS. It fixes the 188-byte transport packet, the `sync_byte` value of 0x47, the 13-bit PID and the 4-bit continuity counter. HLS merely carries those packets. | ITU-T H.222.0 (ISO/IEC 13818-1), transport packet layer, §2.4.3.2 and §2.4.3.3 |
| **Where 188 came from.** An ATM cell is 53 bytes with a 48-byte payload. AAL type 1 spends one of those bytes on its own header, which leaves 47 bytes of user data per cell. Four cells therefore carry 4 × 47 = 188 bytes. That arithmetic is the design rationale behind the number, and it is the whole of the deck's "188 was chosen for ATM". | ITU-T I.361 (ATM layer, the 53-byte cell), ITU-T I.363.1 (AAL type 1, the 47-byte payload) |
| The WebSocket handshake constant is in the RFC, not invented by the deck. The fixed GUID is `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`, and the accept value is base64 of the SHA-1 of the concatenation. Masking exists so that an intermediary which does not understand the upgrade cannot be fed a chosen request line. | RFC 6455 §1.3, §5.3, §10.3 |
| The SSE wire format and the `retry`, `id`, `event` and `data` field names are specified in the HTML standard, not in an RFC. An event dispatches on a blank line, and the reconnection time set by `retry` persists for the connection. | WHATWG HTML Living Standard, "Server-sent events" |
| MQTT's Remaining Length is a variable-length integer of at most four bytes, so one packet is at most 268,435,455 bytes of payload. PINGREQ is the fixed header byte 0xC0 and PINGRESP is 0xD0, each followed by a zero length, which is the `C0 00` and `D0 00` pair on slide 10. | OASIS MQTT Version 5.0, §1.5.5, §3.12, §3.13 |
| The Low-Latency HLS additions the deck names are in the second-edition HLS specification, not in RFC 8216. They are `EXT-X-PART`, `EXT-X-PRELOAD-HINT`, `EXT-X-SKIP`, and the blocking-reload query parameters `_HLS_msn` and `_HLS_part`. `PART-HOLD-BACK` is an attribute of `EXT-X-SERVER-CONTROL`. | draft-pantos-hls-rfc8216bis ("HTTP Live Streaming 2nd Edition"), §4.4.4.9, §4.4.5.3, §6.2.5.2 |
| HTTP 103 Early Hints is its own short RFC, and it exists because it must not be mistaken for a final response. "The 103 (Early Hints) informational status code indicates to the client that the server is likely to send a final response with the header fields included in the informational response." | RFC 8297 §2 |
| The Linux ephemeral port range default is 32768 to 60999, which is the 28,232 of slide 12. It is a sysctl, so a test rig can widen it instead of adding source addresses. | Linux `Documentation/networking/ip-sysctl.rst`, `net.ipv4.ip_local_port_range` |
| x264's default keyframe interval is 250 frames, which is the cause of the deck's 8.33 s segments. ffmpeg exposes a time-based alternative, `-force_key_frames`, which takes an expression in seconds rather than a frame count. | x264 `--keyint` default, ffmpeg-all documentation, "force_key_frames" |
| **The AWS unit prices, with their dates.** Slide 18 prints three of them itself: CloudFront India HTTPS at $0.0120 per 10,000 requests, $0.109 per GB after the first free TB, and $0.072 per GB past 5 PB, all dated September 2026. Three more are not printed on any slide, and we derived them by matching the slide 16 totals: S3 GET at $0.0004 per 1,000 requests, internet egress at $0.09 per GB, and `c5.4xlarge` on-demand at $0.68 per hour in US East. A lesson page must print the price **and** its date, because every one of these moves. | AWS public price list: CloudFront 2026-10-03, S3 us-east-1 2026-09-28, AWSDataTransfer 2026-09-16, as recorded in section 1 |
| The S3 request-rate promise is per prefix, and it is a floor rather than a cap: "at least 3,500 PUT/COPY/POST/DELETE or 5,500 GET/HEAD requests per second per partitioned prefix". More prefixes raise it, and one object key lives under exactly one prefix. | Amazon S3 User Guide, "Best practices design patterns: optimizing Amazon S3 performance" |


## 7. Open questions

Things to check, decide or correct. Items 1, 2 and 10 need a `README.md`
change before a lesson page uses them.

1. **A thirteenth module, `s08-m13-assignment-prep`.** Section 1 announces it and section 4 points at it, but this file does **not** define it, because the `README.md` table fixes twelve modules for Session 8. The README rule is explicit: the `### sNN-mNN` headings and the table must list the same 85 modules. So adding m13 is a README change, and Bibek decides it. The case for it: Session 5 has `s05-m12-assignment-prep` and `s05-m13-project-studio` for exactly this purpose, and the slide 46 assignment has four tasks that each need a concept checklist and a test plan. The case against it: Session 8 is the last class, so there may be no graded work after it at all. **Until the README changes, the twelve headings above are the whole of section 5.**

2. **The core re-tag of 2026-10-10.** Section 3 marked 128 claims `core`, which no single digest page can hold. 39 rows moved out: `C02 C04 C24 C31 C40 C64 C65 C72 C90 C92 C96 C98 C109 C120 C129 C131 C133 C137 C142 C153 C165 C175 C177 C178 C183 C188 C190 C191 C192 C205 C207 C211 C214 C215 C219 C228 C234 C235 C236` to `detail`, except C04 and C72, which went to `story`. No ID was renumbered and no row was deleted. The new count is 89. Each moved row is either a restatement of a neighbouring `core` row, a figure label, a slide slogan, or graded-work text that no quiz may ask. Verify with:

   ```sh
   grep -c '| core |$' docs/curriculum/session-08.md     # expect 89
   grep -c '^| S08-C' docs/curriculum/session-08.md       # expect 238
   ```

   And check that every `core` claim sits in a module:

   ```sh
   python3 - <<'EOF'
   import re
   s = open('docs/curriculum/session-08.md').read()
   core = set(re.findall(r'^\| (S08-C\d+) \|.*\| core \|$', s, re.M))
   cov = set()
   for ln in s.split('\n'):
       if ln.startswith('- **Covers:**'):
           cov |= set(re.findall(r'S08-C\d+', ln))
   print(len(core), 'core,', len(core - cov), 'uncovered')
   EOF
   ```

   On 2026-10-10 that printed `89 core, 0 uncovered`.

3. **The "10.000 s" on page 22.** The slide reads "At 10.000 s the edge's copy expires." The same slide sets `proxy_cache_valid 200 10s`, so the intended value is almost certainly ten seconds, written to three decimal places as a log timestamp. The other reading, a European decimal comma meaning ten thousand seconds, is 2 hours 46 minutes, which no TTL on any slide of this deck comes near. **Our reading: t = 10.000 s, an instant on a clock, not a duration of 10,000 s.** A lesson page must write "at t = 10 s" and never reproduce the ambiguous form. Confirm against the page image.

4. **The $680 push fleet line needs a fifth hour.** Slide 16 attributes $680 to "a peak-sized fleet" of 200 `c5.4xlarge` boxes. At the US East on-demand rate of $0.68 an hour, 200 boxes cost $136 an hour, so $680 is **five** hours, not the four-hour match length used everywhere else in the deck. Four hours gives $544. Our reading: the deck budgets one extra hour for warm-up and drain, which is realistic for a pre-warmed fleet. The $0.9K to $1.6K range then checks out exactly: $680 plus 1,757 GB of 183-byte diffs at $0.09 gives $838, and $680 plus 10,445 GB of full cards gives $1,620. **Ask whether the fifth hour is deliberate.** If it is, every lesson page must say "five hours of a peak-sized fleet", because $680 cannot be derived from a four-hour match.

5. **Slide 18 and slide 32 disagree about the 360p segment.** The slide 18 log axis marks "360p segment · 459 KB". Slide 32 measures the same rendition at 452,328 bytes, which is 452.3 kB decimal or 441.7 KiB. Neither reading gives 459. A lesson page should use the measured 452,328 bytes and drop the 459 figure, or find the run that produced it. The claim rows keep both: S08-C87 holds 459 KB and S08-C151 holds 452,328 B.

6. **The assignment due date is a placeholder.** Slide 46 ends "Due: [date]." Nothing in the deck fills it. The assignment itself is announced but not formally set, exactly as Session 5's was (its open question 25). Recheck the four task statements and the marking scheme against the real task text when it arrives, and never publish a solution. Rule 4 of `na-site/CLAUDE.md` governs.

7. **The 8-second Low-Latency HLS total is ours, not the deck's.** Slide 36 states only that the 12 s hold-back becomes about 3 s with 1 s parts. Module 9 adds the fill bar: a 1 s part fills in 1 s rather than 4 s, so 2 + 1 + 2 + 3 is about 8 s. The slide does not say this, so the lesson page must attribute the sum to us. The encode and CDN bars stay at the deck's own "typical guesses".

8. **The date of the class.** `README.md` records Session 8 as "Fri 2026-10-02", and the same table says the dates of classes 7 and 8 are a guess from the weekly Friday pattern. Session 1 is "about 2026-08-12", which is a Wednesday, so the pattern is not uniform across the course. Session 8 therefore rests on the Friday guess alone, and no slide of the deck carries a date. The deck does carry one absolute timestamp, `2026-09-27T03:16:44` on slides 37 and 40, from the deck's own ffmpeg run. That is a Sunday, five days before the guessed class date, which is consistent with a deck prepared in the week before the class, and it is evidence about the **recording**, not about the class. **Ask Bibek to confirm the real date.** Until then every page says "about 2026-10-02".

9. **The push message count on slide 15 is a coincidence, not a result.** The slide gives "push each ball → about 9.6 B messages, one every ~30 s per phone", which equals the 9.6 B of the 30 s poll. The two numbers match only because the ball interval and the poll interval are both about 30 s. Change the poll to 15 s and the pull count doubles while the push count does not move, which is the whole point of homework 2. A lesson page must not present 9.6 B as "the same either way".

10. **Proposed threads.** None of these exists in the `README.md` thread table, and each repeats across at least two sessions, which is the README's bar. Bibek decides.

    | Proposed ID | The idea | Sessions that repeat it |
    |---|---|---|
    | `T-ask-or-tell` | The same answer for everybody can be cached. A different answer per person must be pushed, and then you buy sockets. | S3 (stateless servers), S6 (what a CDN can hold), S8 (the whole class) |
    | `T-index-and-pieces` | A small changing index over immutable numbered pieces. The index carries all the change, so the pieces cache for ever. | S2 (sequence numbers make a stream resumable), S5 (Range over a fixed body), S8 (the versioned scorecard and the HLS playlist) |
    | `T-ttl-follows-change` | A cache lifetime follows the change rate of the object, never its size. | S4 (the nginx cache), S6 (caching defaults), S8 (four objects, four policies) |

    `T-ask-or-tell` is the strongest candidate, because slide 45's first idea states it almost verbatim and Session 3 and Session 6 both set it up.

11. **The Hotstar post could not be fetched.** Section 1 records it: Medium answered 403 and the web archive was blocked. So the five steps of S08-C45 to S08-C49, the 250k, 2 M, 500k, 4 M, 10 M and 50 M figures, and the "Caching at any level is also not possible" quote all rest on the slide alone. Homework 4 asks the class to read the post, so confirm the five steps before any page quotes a number. Treat every figure in module 3 as medium confidence until then.

12. **The overhead percentages of slide 32 cannot be derived from the slide.** The 4-byte header alone is 4 ÷ 188, which is 2.13%. The measured figures are 3.3%, 4.1% and 5.6%, so the remainder is adaptation fields, the PAT and PMT tables, PCR insertion and padding. The slide defines overhead as "everything that is not audio or video payload" but does not break it down, and no repo reproduces the run. A lesson page may quote the three figures as measured, and must not claim to explain the split. The one derivable fact is the 2.13% floor.

13. **No Session 8 code exists, so every lab here is ours.** `sources/cn-at-scaler/` has no `lesson8` folder. The labs in modules 1 to 12 were written for this file, not taken from the instructor's repo, and only the arithmetic in them is checked. Each one must be run on a clean machine before it reaches a lesson page. The module 5 and module 10 labs write under `/tmp/s08/` and start their own nginx and ffmpeg on non-default ports, which honours the operational rule in `~/Codes/CLAUDE.md`: never touch a live dev port, and never use the system nginx configuration.

14. **The week list on slide 2 against the official syllabus.** Slide 2 lists week 7 "Building for failures" and week 8 "Streaming video at large scale", which matches slide 2 of Session 5 and matches this deck. Session 5's open question 1 records that the official course table instead lists week 7 "Economics of cloud tech" and week 8 "Building for failures". Two decks now agree against the official table, so the table is probably stale. Confirm once with the course platform and then close both items together.

15. **The 137 KB memory figure uses binary gibibytes.** 32 GiB is 34,359,738,368 bytes, and dividing by 250,000 gives 137,439 bytes, so "about 137 KB" is right. Had the slide meant 32 GB decimal, the answer would be 128,000 bytes. Both round to "about 130 KB", so the teaching point survives either reading, and a page that prints 137 must also print GiB.

16. **Rounding of the peak rate.** 50,000,000 ÷ 30 is 1,666,667, which the deck writes as 1.67 M. The derived figures follow the rounding: 1.67 M × 0.03 s gives 50,100 in-flight requests, which slide 13 calls 50,000, and 1,670,000 ÷ 5,500 gives 303.6, which slide 17 calls 303×. Every one of these is self-consistent at two significant figures. A numeric check item must accept 1.67 and must not demand 1.666667.

17. **The 0.28% video-bill figure needs an assumed rendition mix.** Slide 19 states it with no working. Our reconstruction: 20 M average viewers for 14,400 s at the 480p rate of 823,440 bytes per 4 s is about 59 PB, which at the $0.072 per GB tier is roughly $4.3M, plus about $86K of segment request fees. $12,457 ÷ $4.39M is about 0.28%. That arrives at the slide's number, but it assumes every viewer watches 480p, which no real ladder produces. Treat 0.28% as an order-of-magnitude claim and print the assumption beside it.

18. **Misconception IDs end at S08-M57.** Fifty-seven bullets across twelve modules, all unique, all in the verifier's form. Five of them appear as a reference in a later module rather than as a new definition, in the Session 5 style (`S08-M01 appears again in check 1.`). If a thirteenth module arrives under item 1, it starts at S08-M58.

19. **Quiz scope is unknowable without a transcript.** No transcript, no AI notes and no recording exist for Session 8. We cannot tell which of the four closing ideas the instructor stressed aloud, or how long the Hotstar story actually took. The claim inventory keeps everything, and the `core` tag is our judgement, not an observation. Session 5's open question 26 says the same thing about its own deck.

