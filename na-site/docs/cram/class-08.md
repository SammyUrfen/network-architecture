# Class 8 cram sheet: Streaming video at large scale

Every key fact of the class, in the order the instructor taught it.
This file is a fallback for the quiz on 2026-10-12. The fast read at `/s08/digest/`
teaches the same facts with pictures and questions.

Source: `docs/curriculum/session-08.md`, 238 facts in total, 125 of them here.
A slide number is a page of the PDF.

| # | ID | Fact | Slide | Kind |
|---|---|---|---|---|
| 1 | S08-C06 | Cricket gives 25 to 45 s between balls, and an over every 4 to 5 minutes. That clock sets every poll interval and every TTL. | `slide 4` | core |
| 2 | S08-C07 | The audience: 50 M peak concurrent viewers, and 20 M on average across a 4-hour match. | `slide 4` | core |
| 3 | S08-C08 | The scorecard is 4 to 5 KB of JSON, about 1 KB gzipped. | `slide 4` | core |
| 4 | S08-C11 | Two families of answers. In one the client asks. In the other the server tells. | `slide 5` | core |
| 5 | S08-C13 | Every request in that family is an ordinary GET. So servers stay stateless, answers stay cacheable, and a CDN can stand in front. | `slide 5` | core |
| 6 | S08-C15 | In that family every viewer holds a connection for the whole match. Servers are stateful, and nothing a CDN can cache. | `slide 5` | core |
| 7 | S08-C17 | Polling is a GET of the same URL every few seconds. The connection may close in between. | `slide 6` | core |
| 8 | S08-C18 | The client keeps the ETag and sends `If-None-Match`. A 304 answer has an empty body, and the client keeps what it has. | `slide 6` | core |
| 9 | S08-C19 | Jitter of plus or minus 20% stops fifty million phones from polling on the same second. The sample multiplies a 15,000 ms interval by `0.8 + random × 0.4`. | `slide 6` | core |
| 10 | S08-C20 | Worst-case freshness is one poll interval plus every cache TTL on the path. | `slides 6, 21` | core |
| 11 | S08-C22 | Long polling sends `?after=1841`. The server holds the request open until ball 1842 is bowled, or 25 s pass. | `slide 7` | core |
| 12 | S08-C23 | A held request is a held socket. Every viewer has one open almost all the time, so W is 25 s, not 30 ms. | `slide 7` | core |
| 13 | S08-C25 | Long polling synchronises the herd. A wicket completes 20 M responses in one second, and 20 M new requests arrive in the next. | `slide 7` | correction |
| 14 | S08-C26 | Long polling came back standardised. The blocking playlist reload of Low-Latency HLS is long polling. | `slide 7` | core |
| 15 | S08-C27 | Server-Sent Events is one response that never ends, with `Content-Type: text/event-stream`. | `slide 8` | core |
| 16 | S08-C28 | SSE frames by delimiter. One event ends at a blank line, which is SMTP's lone dot in a different costume. | `slide 8` | core |
| 17 | S08-C29 | On reconnect the browser sends `Last-Event-ID`, and the server replays only what was missed. | `slide 8` | core |
| 18 | S08-C30 | Over HTTP/1.1 each tab holds its own SSE connection, about six per browser. HTTP/2 multiplexes them onto one. | `slide 8` | core |
| 19 | S08-C33 | A WebSocket starts as a GET with `Upgrade: websocket` and gets 101 Switching Protocols. | `slide 9` | core |
| 20 | S08-C35 | Client-to-server frames are masked, so stray bytes can never look like a request to a caching proxy. | `slide 9` | core |
| 21 | S08-C37 | A WebSocket frames by length, the other Session 2 answer. A length of 0 to 125 fits in the second byte, and 126 or 127 means read more. | `slide 9` | core |
| 22 | S08-C38 | MQTT: the scorer sends one PUBLISH, and the broker copies it to every subscriber of the topic. | `slide 10` | core |
| 23 | S08-C41 | QoS 1 is at-least-once, so duplicates happen. Apply updates by version number and the duplicates become harmless. | `slide 10` | correction |
| 24 | S08-C45 | Hotstar step 1: EMQX on one `c5.4xlarge` held 250k connections with latency in bounds. | `slide 11` | measured |
| 25 | S08-C46 | Hotstar step 2: the publisher split from the subscribers reached 2 M subscribers. Mnesia wants fewer than 10 nodes. | `slide 11` | measured |
| 26 | S08-C47 | Hotstar step 3: a Classic ELB drops connections at about 500k without pre-warming, and reaches 4 M per pre-warmed Classic ELB. | `slide 11` | measured |
| 27 | S08-C48 | Hotstar step 4: five clusters of eight subscribe nodes, bridged, passed 10 M. | `slide 11` | measured |
| 28 | S08-C49 | Hotstar step 5: a reverse bridge, a Go service on each subscriber that pulls from the publisher, reached 50 M on 200 nodes. | `slide 11` | measured |
| 29 | S08-C50 | Their quote: "Caching at any level is also not possible." Their social feed was tied to live moments, so it had to be pushed. A scorecard is the opposite case, one file identical for everyone. | `slide 11` | correction |
| 30 | S08-C52 | Stateful means each phone lives on one box for hours. The deck's board says 100k to 200k connections per box, and Hotstar measured 250k. | `slide 12` | core |
| 31 | S08-C53 | A new box sits empty until someone reconnects. So rebalancing means disconnecting people. | `slide 12` | core |
| 32 | S08-C54 | Memory per connection covers kernel socket buffers, TLS state and the broker's per-client process. 250k phones on a 32 GiB box is about 137 KB each, all in. | `slide 12` | measured |
| 33 | S08-C56 | Keepalives carry nothing. At a 60 s keepalive, 20 M idle phones send 333k pings a second before the first ball is bowled. | `slide 12` | measured |
| 34 | S08-C57 | A load balancer gives DNS one address instead of 200 and spreads load evenly. But it holds every socket too. Hotstar hit 4 M per Classic ELB. | `slide 12` | core |
| 35 | S08-C59 | Little's Law on the pull side: 1.67 M requests a second times about 0.03 s at the edge gives 50,000 requests in flight. | `slide 13` | core |
| 36 | S08-C60 | Little's Law on the push side: W is the whole match, four hours, so 50,000,000 sockets are held, ball or no ball. | `slide 13` | core |
| 37 | S08-C61 | Same audience and same file give a thousand times the concurrency, because W went from milliseconds to hours. | `slide 13` | core |
| 38 | S08-C66 | 9.6 B requests per match: 20 M viewers times 14,400 s divided by a 30 s poll. | `slide 15` | core |
| 39 | S08-C67 | 1.67 M requests a second at the peak: 50 M viewers divided by a 30 s poll. | `slide 15` | core |
| 40 | S08-C68 | 9.6 TB of scorecard per match: 9.6 B requests times 1 KB. | `slide 15` | core |
| 41 | S08-C73 | Bill 1, S3 straight to phones: $4.7K per match, $470K for 100 events. Mostly GET fees ($3,840). It breaks first at 5,500 GET/s per prefix. | `slide 16` | measured |
| 42 | S08-C74 | Bill 2, an nginx fleet with an ALB: $1.2K to $1.8K per match, $120K to $180K for 100 events. Mostly egress ($864) plus load-balancer units. It breaks first at 20 to 50 M idle keep-alive sockets at the load balancer. | `slide 16` | measured |
| 43 | S08-C75 | Bill 3, CloudFront in India: $12.5K per match, $1.25M for 100 events. Request fees are 92% of it. Nothing breaks. It is just the bill. | `slide 16` | measured |
| 44 | S08-C76 | Bill 4, push on 200 `c5.4xlarge` boxes: $0.9K to $1.6K per match, $90K to $160K for 100 events. Mostly a peak-sized fleet ($680) plus egress. It breaks first at reconnect storms and rebalancing. | `slide 16` | measured |
| 45 | S08-C77 | At list price, push is the cheapest per match and the CDN the dearest. The instructor says "Hold that thought." | `slide 16` | correction |
| 46 | S08-C79 | One S3 prefix promises at least 5,500 GETs a second. | `slide 17` | core |
| 47 | S08-C80 | 50 M phones polling every 30 s ask for 1.67 M GETs a second. That is 303 times over, and one key lives under one prefix. | `slide 17` | core |
| 48 | S08-C82 | Fifty million clients retrying a 503 without backoff is Session 7's retry storm, pointed at your own bucket. | `slide 17` | core |
| 49 | S08-C84 | On a CDN a 1 KB file is billed per request. Request fees are 92% of the scorecard's CDN bill, not bytes. | `slide 18` | core |
| 50 | S08-C85 | Per million responses the request fee is $1.20 either way. The byte fee is $0.11 for a 1 KB scorecard and $59 to $90 for an 823 KB 480p segment. | `slide 18` | measured |
| 51 | S08-C86 | Break-even is about 11 KB. Below it you pay per request. Above it you pay per byte. | `slides 18, 45` | core |
| 52 | S08-C91 | At list price the scorecard is 0.28% of the same match's video bill. | `slide 19` | measured |
| 53 | S08-C93 | Make the ETag the scorecard's version number: a fingerprint, not a clock. `If-Modified-Since` works too, but only to the second. | `slide 20` | core |
| 54 | S08-C94 | A 304 saves the 1 KB body, the JSON parse and the re-render. | `slide 20` | core |
| 55 | S08-C95 | A 304 does not save the request fee, the round trip or the headers. | `slide 20` | correction |
| 56 | S08-C97 | Every layer at 30 s, which is the mid-tier TTL, the edge TTL and the client poll, gives up to 90 s stale: two or three balls behind the stadium. | `slide 21` | core |
| 57 | S08-C99 | Keep each CDN TTL at half of the freshness you promise, or less. | `slide 21` | core |
| 58 | S08-C101 | At the instant the edge copy expires, every request is a miss and all of them head for the origin. | `slide 22` | core |
| 59 | S08-C102 | Request collapsing: one fetch per edge per object, and everyone else waits in a queue. | `slide 22` | core |
| 60 | S08-C103 | Serve stale while updating: answer from the old copy while one request refreshes it (RFC 5861). | `slide 22` | core |
| 61 | S08-C107 | 20,000 phones ask one edge for `score.json` in the same 50 ms. The edge sends 1 request upstream, 19,999 wait in a queue, and the origin sees 1 request. | `slide 23` | measured |
| 62 | S08-C108 | Request collapsing needs a shareable answer. The first response decides, and `Cache-Control: public` releases every waiter at once. | `slide 23` | core |
| 63 | S08-C111 | Check the default first. Cloudflare does not cache `.json` out of the box. Without a cache rule, `cf-cache-status` says DYNAMIC and every poll reaches you. | `slide 23` | correction |
| 64 | S08-C112 | Cache a 5xx briefly. One or two seconds of a cached 503 shields a struggling origin from fifty million retries, and the origin sees one probe per TTL per edge. | `slide 24` | core |
| 65 | S08-C113 | Almost never cache a 404. A 404 for a file that is about to exist keeps being served until its TTL runs out: the next match's scorecard, or the newest live segment. | `slide 24` | correction |
| 66 | S08-C115 | The rule: a negative TTL must be far shorter than the time it takes the missing thing to appear. | `slide 24` | core |
| 67 | S08-C117 | Three sizes of the same card: 4,117 B of full JSON, 1,088 B gzipped, and 183 B for one ball as a gzipped JSON Patch. Measured on a synthetic T20 card with two innings, batting and bowling figures, and fall of wickets. | `slide 25` | measured |
| 68 | S08-C118 | With push, send the patch. SSE or MQTT carry the 183-byte patch. A phone that missed one sees a version gap and fetches the full card once. | `slide 25` | core |
| 69 | S08-C119 | With pull, do not put the version in the query. `?since=1841` gives every client its own URL and the hit rate collapses. | `slide 25` | core |
| 70 | S08-C124 | The mapping, line by line: version matches MEDIA-SEQUENCE, the recent changes match the last N segments, and the poll interval matches TARGETDURATION. | `slide 26` | core |
| 71 | S08-C125 | A small index that everyone polls, pointing at numbered pieces that never change. That design already has a name: HTTP Live Streaming. | `slide 26` | core |
| 72 | S08-C126 | Same loop, bigger bytes: a 1 KB scorecard every 15 s, a 228 B video playlist every 4 s, and one 823 KB 480p segment of 4 s fetched once. | `slide 27` | core |
| 73 | S08-C128 | The player does four things: read the master once and pick a rendition, reload that playlist every target duration, fetch each new segment into the buffer, and play from the buffer while it switches rendition when throughput changes. | `slide 28` | core |
| 74 | S08-C130 | `stream_1/index.m3u8` is control, polled every 4 s. It lists the last ten segments of 4 s each and it changes every 4 s. | `slide 28` | core |
| 75 | S08-C132 | HLS keeps control and data apart. The small thing changes often, and the big thing never changes. | `slide 28` | core |
| 76 | S08-C134 | The deck's own ffmpeg run produced three variants: 3,440,800 at 1280x720, 1,755,600 at 854x480, and 950,400 at 640x360. | `slide 29` | measured |
| 77 | S08-C139 | Two reloads of the deck's live 360p playlist, 4.5 s apart at t = 47.0 s and t = 51.5 s. MEDIA-SEQUENCE went from 1 to 2, and the window moved from seg_000001 to seg_000010 up to seg_000002 to seg_000011. | `slide 30` | measured |
| 78 | S08-C140 | If the playlist changed, wait at least one target duration before you reload again. | `slide 30` | core |
| 79 | S08-C141 | If the playlist did not change, wait half a target duration, then try again. | `slide 30` | core |
| 80 | S08-C145 | `EXT-X-ENDLIST` means no more segments. Read the playlist once and stop polling. VOD is a playlist that stopped changing. | `slide 31` | core |
| 81 | S08-C146 | The VOD sample has TARGETDURATION 10 and 64 segments: 63 of 10 s plus a last one of 5 s. | `slide 31` | measured |
| 82 | S08-C148 | The query string `?pubId=…&videoId=…` is the same for everyone, so it caches. A per-viewer token would not. | `slide 31` | core |
| 83 | S08-C149 | A segment is a chain of 188-byte packets: a 4-byte header with a 0x47 sync byte, a 13-bit PID and a counter, then a 184-byte payload. | `slide 32` | core |
| 84 | S08-C151 | Measured on the deck's run: 720p 1,613,416 B is 8,582 packets at 3.3% overhead, 480p 823,440 B is 4,380 packets at 4.1%, and 360p 452,328 B is 2,406 packets at 5.6%. Every segment is an exact multiple of 188. | `slide 32` | measured |
| 85 | S08-C152 | Fixed length and a sync byte are both of Session 2's framing answers at once. 188 was chosen for ATM. | `slide 32` | core |
| 86 | S08-C156 | Peak segment requests are 50 M divided by the segment length: 25 M/s at 2 s, 16.7 M/s at 3 s, 12.5 M/s at 4 s, 8.3 M/s at 6 s, and 1.7 M/s at 30 s. | `slide 33` | core |
| 87 | S08-C157 | The latency floor is three times the segment length: 6 s, 9 s, 12 s, 18 s and 90 s for those five rows. | `slide 33` | core |
| 88 | S08-C159 | The trade: shorter segments mean more requests, more keyframes and more round trips. Longer segments mean more latency and slower reaction to bandwidth. | `slide 33` | core |
| 89 | S08-C161 | Playlist traffic is harder than segment traffic. | `slide 34` | correction |
| 90 | S08-C162 | The playlist is about 230 B gzipped and changes every 4 s. A segment is 450 to 1,600 KB and never changes. | `slide 34` | core |
| 91 | S08-C163 | The playlist TTL is half a target duration or less. The segment TTL is minutes to forever. | `slide 34` | core |
| 92 | S08-C164 | A stale playlist stalls playback, or it points at deleted files. A stale segment is harmless. | `slide 34` | core |
| 93 | S08-C166 | The board asks "Rendition: poll every second → RPS?" At 1 s that is 50 M requests a second at the peak. At the RFC's one target duration it is 12.5 M. | `slide 34` | measured |
| 94 | S08-C167 | The buffer holds the segments already downloaded ahead of the playhead. The deck's picture shows 12 s buffered and the next segment still downloading. | `slide 35` | core |
| 95 | S08-C168 | A large buffer survives a bad minute on a train. It costs latency, and memory on low-end phones and TV sticks. | `slide 35` | core |
| 96 | S08-C171 | When the playlist stops moving, the buffer is what keeps the picture going. | `slide 35` | core |
| 97 | S08-C172 | The latency budget: about 2 s to encode, 4 s while the segment fills, about 2 s to the CDN, and a player hold-back of three target durations, which is 12 s. That is about 20 s behind the stadium with 4 s segments. | `slide 36` | core |
| 98 | S08-C174 | Low-Latency HLS shrinks the biggest bar with four ideas from the first half of the class: parts, a blocking reload, preload hints and delta updates. | `slide 36` | core |
| 99 | S08-C176 | A blocking reload holds `?_HLS_msn=…` until that segment exists. That is long polling. | `slide 36` | core |
| 100 | S08-C179 | With 1 s parts the 12 s hold-back becomes about 3 s, because Apple requires PART-HOLD-BACK of at least three parts. | `slide 36` | core |
| 101 | S08-C180 | The spoiler problem: a wicket at 0 s, the scorecard says W at about 10 s, and the video shows it at about 20 s. The spoiler window is about 10 s. | `slide 37` | core |
| 102 | S08-C181 | The fix: stamp each update with the ball's wall-clock time. The player knows the wall-clock time of every segment, so the app reveals an update only when playback passes it. | `slide 37` | core |
| 103 | S08-C184 | Throughput-based ABR measures how fast the last segments arrived and picks the highest rendition that fits. That is congestion control, one layer up. | `slide 38` | core |
| 104 | S08-C185 | Buffer-based ABR watches the buffer. Nearly empty, step down. Full, step up. | `slide 38` | core |
| 105 | S08-C186 | Netflix A/B tests of the buffer-based approach: 10 to 20% fewer rebuffers at a similar video rate. | `slide 38` | measured |
| 106 | S08-C187 | The policy behind every ABR rule: a stall is worse than a lower rendition. | `slide 38` | core |
| 107 | S08-C193 | Four ways to steer: DNS by region or ISP (slow to change, because resolvers cache), each rendition listed once per CDN in the master for stream failover, Content Steering with a JSON file polled every TTL, and client failover where errors trip a circuit breaker and the next segment tries the other CDN. | `slide 39` | core |
| 108 | S08-C195 | ffmpeg's `delete_segments` keeps one unreferenced segment. The deck watched `seg_000000` vanish 4 s after it left the playlist. | `slide 40` | measured |
| 109 | S08-C196 | RFC 8216 says a removed segment MUST stay available for its own duration plus the playlist's duration: 4 plus 40, so 44 s here. | `slide 40` | core |
| 110 | S08-C197 | During an origin blip the CDN serves a stale playlist. It still lists a segment that the origin has deleted. | `slide 40` | core |
| 111 | S08-C198 | The result is a 404, negatively cached, and a stalled player. "Serve stale may cause player issues." | `slide 40` | correction |
| 112 | S08-C199 | The fixes: `-hls_delete_threshold 12`, a playlist TTL at half a target duration or less, serve a playlist stale for one target duration at most, and serve segments stale freely because they never change. | `slide 40` | core |
| 113 | S08-C201 | The deck's run, 360p rendition: at t = 47.0 s the playlist held seg_000001 to seg_000010 while the disk held seg_000000 to seg_000010. At t = 51.5 s the playlist held seg_000002 to seg_000011 while the disk held seg_000001 to seg_000011. | `slide 40` | measured |
| 114 | S08-C202 | The caching rules for a live stream, object by object. master.m3u8: TTL minutes, serve stale yes, 404 for 1 s. Media playlist: TTL half a target duration or less, serve stale one target duration at most, 404 for 1 s or not at all. Segment .ts: TTL long because it never changes, serve stale yes, 404 for 1 s at most at the live edge. score.json: TTL half your promise or less, serve stale while updating, 404 for 1 s and 5xx for 2 s. | `slide 41` | core |
| 115 | S08-C204 | Gzip every playlist. Apple makes it a MUST. The two types to add are `application/vnd.apple.mpegurl` and `application/json`. | `slide 41` | core |
| 116 | S08-C208 | `-codec: copy` does no re-encode, so it can only cut at keyframes that already exist. | `slide 42` | core |
| 117 | S08-C209 | `-hls_time 4` is a target segment length, not a promise. | `slide 42` | correction |
| 118 | S08-C212 | Running the one-liner gave 8.33 s segments, not 4. x264's default keyframe interval is 250 frames, which is 8.33 s at 30 fps. | `slide 42` | measured |
| 119 | S08-C213 | The window was ignored. An EVENT playlist only grows, and 11 segments were listed at the end. | `slide 42` | measured |
| 120 | S08-C216 | `-g 120 -keyint_min 120 -sc_threshold 0` fixes the keyframe interval. 120 frames is 4 s at 30 fps only. | `slide 43` | core |
| 121 | S08-C217 | A 24 fps source gave 5 s segments with the same `-g 120`. | `slide 43` | measured |
| 122 | S08-C230 | Idea 1: pull scales through caches, and push scales through machines. The same answer for everyone belongs in a CDN. A different answer per person means you are buying sockets. | `slide 45` | core |
| 123 | S08-C231 | Idea 2: number the pieces, then cache them forever. A small changing index plus numbered pieces that never change. The versioned scorecard and the HLS playlist are one design. | `slide 45` | core |
| 124 | S08-C232 | Idea 3: latency is a budget you spend on safety. Poll intervals, TTLs, segment length and hold-back all add up. Decide where each second goes. | `slide 45` | core |
| 125 | S08-C233 | Idea 4: know which bill you are on. Scorecards and playlists are billed per request. Segments are billed per byte. | `slide 45` | core |
