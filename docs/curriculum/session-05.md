# Session 5: Evolution of HTTP

## 1. Header

- **Title:** Evolution of HTTP. Deck title "HTTP, 1996 → now".
- **Date:** about 2026-09-11.
- **Subtitle, in the instructor words:** "Same words. Three completely different ways of writing them down."
- **Rewrite:** 2026-09-13, from the complete deck, to the fixed module IDs in `README.md`. Claim numbers restart. No lesson uses them yet.

**Sources used**

| Path | What it gives | Trust |
|---|---|---|
| `sources/session-05/slides.txt` | 51 PDF pages, complete | high |
| `cn-at-scaler/lesson5/http-evolution/README.md` | the five hours, measured tables, homework 1 to 5 | high |
| `cn-at-scaler/lesson5/http-evolution/01-http10` to `05-http3`, `tools/` | the servers, clients and proxies behind every number | high |
| `cn-at-scaler/lesson4/nginx-from-scratch/06-fastcgi/fastcgi.h` | FastCGI record layout, for the project hexdump drill | high |
| RFC text from rfc-editor.org, IANA registry, Chrome and Chromium blogs, Web Almanac 2024, Langley et al. 2017 | checks for section 6 and section 7 | high |

**Source gaps.** No transcript and no AI notes exist for Session 5. We do not know what the instructor said beyond the slides. The deck announces the assignment and the project, but the course has not formally set them. So modules 12 and 13 need a check when the real task text arrives.

**Checks run for this file (2026-09-13).** A scratch copy of the lab ran on this Linux machine. `hpack_mini.py` gave 174, 79 and 6 bytes. `headers.py` gave 805 and 64,320 bytes. `fetch_page.py` through `laggy.py` at 150 ms gave 1404.2, 981.7, 605.2, 605.8 and 303.7 ms. `framing.py` gave two responses. A two-write copy of `server11.py` gave the Nagle stall: 1.0 ms, then about 41 ms for each later request. The `h2`, `hpack` and `aioquic` packages are not installed, so the HTTP/2 and HTTP/3 runs rest on the slide captures.

**Confidence.** High. The deck is complete, the code reproduces the HTTP/1.x numbers, and the RFC text confirms the byte layouts. Section 7 lists each place where a slide, the README and an RFC disagree.

## 2. The session in one paragraph

HTTP kept the same words for thirty years. GET, 404, ETag, Range and Host mean the same thing in 1996 and in 2026. What changed three times is how a program writes those words on the wire. HTTP/1.0 spent one TCP connection on each file. HTTP/1.1 kept the connection open, and that created a queue: one slow answer holds up every fast answer behind it, because a response carries no request number. HTTP/2 added a length and a stream number to every frame. Then one lost TCP packet stalled every stream. QUIC moved streams into the transport, on UDP, because middleboxes block anything new. An engineer meets every step of this chain: page load time, cache hit rate, request smuggling through a proxy chain, a 40 ms stall from two small writes, and the 15% of traffic that still speaks HTTP/1.1.

## 3. Claim inventory

Core count: 139 of 240.

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S05-C01 | HTTP is one set of words with three wire formats, from 1996 to now. | `slides 1, 49` | story |
| S05-C02 | The deck spine is RFC 1945, 2068, 2616, 7230, 9110, 9113, 9000 and 9114. | `slide 1` | story |
| S05-C03 | The syllabus slide lists week 7 as Building for failures and week 8 as Streaming video. | `slide 2` | story |
| S05-C04 | Assignment, due before Session 7: a calculator server in any language. Use a plain socket and no framework. | `slide 3` | core |
| S05-C05 | add, sub, mul and div take query values a and b. Each answers 200 and the result. | `slide 3` | core |
| S05-C06 | Division by zero and a non-number answer 400. An unknown operation answers 404. | `slide 3` | core |
| S05-C07 | POST /add answers 405. A request with no Host answers 400. | `slide 3` | core |
| S05-C08 | The marker sends every request on one socket, then checks that it is still open. One handshake, six responses. | `slide 3` | core |
| S05-C09 | The hard part: find where one request ends. Consume exactly Content-Length bytes. Byte n+1 belongs to the next request. | `slide 3` | core |
| S05-C10 | Stretch goals: honour Connection: close, a defensible idle timeout, chunked encoding, and pipelined requests answered in order. | `slide 3` | detail |
| S05-C11 | Do not read `server11.py` until you fail once. A socket that dies early means "a 1996 server". | `slide 3` | detail |
| S05-C12 | Project "HTTP, in binary", in pairs. One person writes the server bserve, one writes the client bcurl. | `slide 4` | core |
| S05-C13 | bserve reads one binary request frame and maps the path to a file under a root. It replies with status, headers and bytes. | `slide 4` | core |
| S05-C14 | bserve answers 404 for a missing file and 400 for a malformed frame. It keeps the connection open. | `slide 4` | core |
| S05-C15 | bcurl builds the request frame and writes the body to stdout. With -v it hexdumps every frame. | `slide 4` | core |
| S05-C16 | bcurl exits non-zero on 4xx or 5xx. It never opens a second connection. | `slide 4` | core |
| S05-C17 | The core of the project is a fixed-size frame header. You pick the fields and widths and defend them. | `slide 4` | core |
| S05-C18 | Headers: number the ten names you send, and length-prefix the rest. These are the first two HPACK ideas. | `slide 4` | core |
| S05-C19 | A receiver MUST skip an unknown frame type cleanly. That leaves room for a version 2. | `slide 4` | core |
| S05-C20 | Hand in a two-page spec, the program, and an annotated hexdump of one request and one response. | `slide 4` | core |
| S05-C21 | If you cannot annotate your own bytes, the spec is not finished. | `slide 4` | core |
| S05-C22 | Only the spec crosses between the pair. A client that works only with its own server is not a protocol. | `slide 4` | core |
| S05-C23 | HTTP/1.0 is RFC 1945, May 1996. | `slide 5` | story |
| S05-C24 | RFC 1945 specifies GET, HEAD and POST. Appendix D lists PUT, DELETE, LINK and UNLINK as extras. | `slide 5` | core |
| S05-C25 | RFC 1945 has 16 status codes and 16 header fields. The whole protocol fits on one slide. | `slide 5`, `server10.py` | core |
| S05-C26 | The IANA status code registry, updated 2025-09-15, lists 62 assigned codes. | `slides 5, 24` | detail |
| S05-C27 | `talk.py` sends exact bytes. The slide says curl adds four headers you did not write and hides two that the server sent. | `slide 6` | detail |
| S05-C28 | A GET request line plus the empty line is 18 bytes. The empty line ends the header block. | `slide 6` | core |
| S05-C29 | server10 sent Content-Length: 263, then closed with FIN at 2.9 ms, loopback. | `slide 6` | measured |
| S05-C30 | RFC 1945 §1.3: the client opens a connection for each request. The server closes it after the response. | `slide 7` | core |
| S05-C31 | A second request on the same HTTP/1.0 socket reads empty bytes. That is not an error. The connection is gone. | `slide 7` | core |
| S05-C32 | A 24-object page at 200 ms RTT: 24 handshakes (4.8 s) plus 24 exchanges (4.8 s) is 9.6 s. | `slide 7` | core |
| S05-C33 | Each of those 24 connections also starts its congestion window again. | `slide 7` | detail |
| S05-C34 | HTTP/1.0 has no Host header, so one IP address served one website. | `slide 8` | core |
| S05-C35 | server10 logs that it ignores `Host: site-b.example`, and it serves site-a. | `slide 8`, `server10.py` | detail |
| S05-C36 | One site per IP lasted until January 1997. The fix was one header field. | `slide 8` | story |
| S05-C37 | About 1.1 billion websites exist. Without Host, the slide says, that is a third of IPv4. | `slide 8` | story |
| S05-C38 | SNI is the same problem one layer down, after TLS hid the Host header. | `slides 8, 12` | detail |
| S05-C39 | HTTP/1.0 caching uses Last-Modified, If-Modified-Since and Expires. A match gives 304 and no body. | `slide 9` | core |
| S05-C40 | A timestamp fails three ways: no sub-second field, clocks drift, and mtime is not identity. | `slide 9` | core |
| S05-C41 | RFC 2068 fixed four HTTP/1.0 gaps: persistence, OPTIONS, better caching and Host. | `slide 10` | detail |
| S05-C42 | HTTP/1.0 has no real head-of-line blocking. With no pipelining it has no queue, only one round trip per object. | `slide 10` | correction |
| S05-C43 | Real head-of-line blocking arrives in HTTP/1.1, as a side effect of a fix. Each solution causes the next problem. | `slide 10` | core |
| S05-C44 | RFC 2068, January 1997, made persistent connections the default. Connection: close opts out. | `slide 11` | core |
| S05-C45 | In HTTP/1.0, Connection: keep-alive was a non-standard extension. Some servers ignored it, some crashed. | `slide 11` | story |
| S05-C46 | RFC 2068 §19.7.1 records keep-alive as a compatibility note, not a feature. | `slide 11` | detail |
| S05-C47 | With the default flipped, every implementation that did nothing got the fast path. | `slide 11` | core |
| S05-C48 | Demo 1: three responses on one TCP handshake, and the socket stays open after each. | `slide 11`, `demos.sh` | measured |
| S05-C49 | An HTTP/1.1 request with no Host gets 400 Bad Request. | `slide 12`, `server11.py` | core |
| S05-C50 | With Host, one IP, one port and one socket serve both site-a and site-b. | `slide 12` | core |
| S05-C51 | The same move repeats: Host, then SNI in TLS, then :authority in HTTP/2, then topics, routing keys and Ingress host rules. | `slide 12` | core |
| S05-C52 | An ETag is a fingerprint of the bytes. server11 uses the first 16 hex digits of a SHA-256. | `slide 13`, `server11.py` | core |
| S05-C53 | If-None-Match with the current ETag gives 304. A 202,000-byte body becomes 0 bytes. | `slide 13` | core |
| S05-C54 | The 304 response was 256 bytes, headers only, as `talk.py` counted it on loopback. The request bytes are extra. | `slide 13`, `talk.py` line 94 | measured |
| S05-C55 | W/ marks a weak validator: equivalent, not identical. Range requests need a strong one. | `slide 13` | core |
| S05-C56 | If-Match points the same idea at writes. It is optimistic concurrency, the fix for lost updates. | `slide 13` | core |
| S05-C57 | big.txt has 202,000 bytes. gzip made 5,763 bytes and deflate made 5,751. | `slide 14` | measured |
| S05-C58 | Text compresses, so "HTTP/1.1 is slow because it is text" is weak. Content-Encoding compresses only the body. | `slide 14` | core |
| S05-C59 | Vary is a cache-key instruction. It says the URL has more than one answer, and what the answer depends on. | `slide 14` | core |
| S05-C60 | Vary: Accept-Encoding is correct. Vary: User-Agent makes millions of keys. Vary: * turns caching off. | `slide 14` | core |
| S05-C61 | Range: bytes=100-199 gives 206, Content-Range bytes 100-199/202000, and Content-Length 100. | `slide 15` | core |
| S05-C62 | Range: bytes=-50 asks for the last 50 bytes without knowing the size. | `slide 15` | core |
| S05-C63 | A range that starts past the end gives 416, with Content-Range bytes */202000. | `slide 15` | core |
| S05-C64 | Range gives video scrubbing, resumable downloads, and Parquet or ZIP reads that start at the footer. | `slide 15` | core |
| S05-C65 | RFC 2068 has no 416. RFC 2616 added it to split bad syntax from a range past the end. | `slide 15` | detail |
| S05-C66 | Chunked transfer coding sends a body of unknown length: Transfer-Encoding: chunked, and no Content-Length. | `slide 16` | core |
| S05-C67 | The style.css body starts with the size line 37. Hex 37 is 55 bytes. An empty chunk, 0, ends the body. | `slide 16` | core |
| S05-C68 | Chunked nests both framing rules. Each chunk has a length, and an empty chunk is the delimiter. | `slide 16` | core |
| S05-C69 | That is the FastCGI record shape from Session 3. Streaming JSON, server-sent events and gRPC trailers use it. | `slide 16` | detail |
| S05-C70 | OPTIONS asks what a server supports. Every CORS preflight is an OPTIONS request. | `slide 17` | core |
| S05-C71 | PUT and DELETE write and remove resources, as every REST API does since. | `slide 17` | detail |
| S05-C72 | TRACE echoes the request back through proxies. After Cross-Site Tracing (2003), everyone disables it. | `slide 17` | story |
| S05-C73 | With Via, each proxy adds itself. It helps you find the box in the chain that lies. | `slide 17` | detail |
| S05-C74 | Expect: 100-continue asks before a large upload. It explains the 1-second pause in curl on big PUTs. | `slide 17` | detail |
| S05-C75 | Cache-Control gives a vocabulary instead of one timestamp: max-age, s-maxage, no-cache, no-store. | `slide 17` | core |
| S05-C76 | no-cache means revalidate before use. no-store means do not write it down. | `slide 17` | correction |
| S05-C77 | RFC 2068 has about 40 status codes, among them 303, 405, 409, 410, 412, 413, 415 and 504. | `slide 17` | detail |
| S05-C78 | RFC 2616 §8.1.4: a single-user client SHOULD NOT keep more than 2 connections to a server. | `slide 18` | core |
| S05-C79 | Six assets through `laggy.py --rtt 150` on loopback (port 9111), the instructor's machine: close 1369.2 ms, keepalive 985.4, parallel2 607.0, parallel6 608.2, pipelined 303.7. | `slide 18`, `fetch_page.py`, `tools/lab.sh` | measured |
| S05-C80 | In the same table: round trips 12, 7, 4, 2, 2, and TCP connections 6, 1, 2, 6, 1. These are script model counts, not captured (`fetch_page.py` lines 58-65, 100, 109). | `slide 18`, `fetch_page.py` | detail |
| S05-C81 | Browsers shipped 6 connections per origin by about 2008. Domain sharding raised that to 18. | `slide 18` | story |
| S05-C82 | RFC 7230 removed the 2-connection sentence in 2014. The spec conceded. | `slide 18` | story |
| S05-C83 | The best row in the table, pipelined, is the one nobody shipped. | `slide 18` | core |
| S05-C84 | RFC 2616, June 1999, mostly tightened RFC 2068 and added little. | `slide 19` | story |
| S05-C85 | New in RFC 2616: 307, 416, and 417 with Expect. Also identity coding, TE and charset wildcards. | `slide 19` | detail |
| S05-C86 | The slide also lists as new: Host as a MUST with a 400, ETag on creation, and ranges without a length. | `slide 19` | detail |
| S05-C87 | 504 Gateway Timeout is not a 1999 addition. RFC 2068 §10.5.5 has it, with the whole 5xx family. | `slide 19` | correction |
| S05-C88 | RFC 2068 meant 302 to keep the method. Browsers turned a redirected POST into a GET anyway. | `slide 19` | core |
| S05-C89 | RFC 2616 renamed 302 to Found and wrote down what clients do. It added 307 for the old meaning. | `slide 19` | core |
| S05-C90 | It is easier to add a number than to fix a billion deployed clients. | `slide 19` | core |
| S05-C91 | RFC 2616 §4.4: with both Transfer-Encoding and Content-Length, ignore Content-Length. Recover, do not reject. | `slide 20` | core |
| S05-C92 | RFC 9112 (2022): a server MAY reject such a request, or use Transfer-Encoding alone. Either way it MUST close. | `slide 20` | core |
| S05-C93 | "Be liberal in what you accept" is fine for two programs and catastrophic for a chain of five. | `slide 20` | core |
| S05-C94 | The attack stream: POST with Content-Length: 6 and chunked encoding. The body is 0 and an empty line, then GET /admin. | `slide 21` | core |
| S05-C95 | A Content-Length reader sees one request with a 6-byte body. A chunked reader sees two requests. Slide simplification: with Content-Length 6 the rest of the bytes still parse as a second request, `ET /admin`. See m05 rung 4. | `slide 21` | core |
| S05-C96 | A CDN that trusts Content-Length, in front of an origin that trusts chunked, lets through a request the CDN never saw. Slide simplification: the whole GET /admin is hidden only when Content-Length covers it (67 bytes). | `slide 21` | core |
| S05-C97 | The desync also leaves a spare response on the connection for the next client. | `slide 21` | core |
| S05-C98 | `framing.py` against server11: two responses, 200 OK and then 404 for the request nobody sent. | `slide 21` | measured |
| S05-C99 | HTTP/2 makes smuggling unrepresentable. The length has a fixed place and size, with no second opinion. | `slides 21, 32` | core |
| S05-C100 | RFC 7230 to 7235 (June 2014) split one document into six, each for a different reader. | `slide 22` | story |
| S05-C101 | Who reads each part: RFC 7230 (syntax, routing, the https scheme) proxies and CDNs. 7231 (semantics) frameworks. 7232 (conditionals) anything with an ETag. 7233 (ranges) video, downloads, Parquet readers. 7234 (caching) every CDN. 7235 (authentication) the WWW-Authenticate framework. | `slide 22` | detail |
| S05-C102 | The instructor jokes that the split is microservices for RFCs. People still say "2616" for HTTP/1.1. | `slide 22` | story |
| S05-C103 | RFC 7230 §3.2.6 lists the token characters. Braces, comma, slash, colon, equals and quotes are not in it. | `slide 23` | detail |
| S05-C104 | The token rule is not new in 2014. RFC 2616 §2.2 (1999) already excluded separators, braces too. | `slide 23` | correction |
| S05-C105 | A JWT must survive a header, a URL query, a cookie, a form field and a JSON body. | `slide 23` | core |
| S05-C106 | base64url swaps + and / for - and _. The signature is raw bytes, which need an encoding anyway. | `slide 23` | core |
| S05-C107 | The alphabet that all layers share is about 64 characters wide. That is why base64 exists, as in MIME. | `slide 23` | core |
| S05-C108 | HTTP/1.1, HTTP/2 and HTTP/3 share RFC 9110 (semantics) and RFC 9111 (caching). | `slide 24` | core |
| S05-C109 | RFC 9112, 9113 and 9114 only describe how to write versions 1.1, 2 and 3 on the wire. | `slide 24` | core |
| S05-C110 | 418 comes from an April 1 joke RFC (2324, 1998). RFC 9110 reserves it, because too many people shipped it. | `slide 24` | story |
| S05-C111 | `hol.py --port 8011 --slow 2`, direct loopback, no added RTT, the server sleeps 2 s on big.txt. Pipelined on one connection: the five fast files arrive at 2003.6 to 2004.4 ms. | `slide 25`, `hol.py` | measured |
| S05-C112 | Same run and conditions, one connection each: the five fast files arrive at 3.2 to 7.2 ms. big.txt arrives at 2006.0 ms. | `slide 25` | measured |
| S05-C113 | Nothing in an HTTP/1.1 response says which request it answers. The order is the identifier. | `slide 26` | core |
| S05-C114 | So order is mandatory, and the slowest response sets the pace for everything behind it. | `slide 26` | core |
| S05-C115 | Multiplexing needs identity: TCP ports, SS7 TCAP transaction ids, FastCGI requestId, HTTP/2 stream ids. | `slide 26` | core |
| S05-C116 | One realistic request carries 805 bytes of headers: cookies, User-Agent, Accept and sec-fetch fields. | `slide 27`, `headers.py` | measured |
| S05-C117 | For 80 requests the script counts 64,320 bytes. The paths, 1,600 bytes or 2.5%, are the only new data. | `slide 27` | measured |
| S05-C118 | 62,720 bytes, 97.5%, are byte-for-byte repeats. On a 1 Mbit uplink that is 0.51 s of upload. | `slide 27` | measured |
| S05-C119 | Upload is the direction with the least capacity. The page spends it at the start, while the user waits. | `slide 27` | core |
| S05-C120 | Nagle (RFC 896, 1984): do not send a small segment while an earlier one is unacknowledged. | `slide 28` | core |
| S05-C121 | Delayed ACK (RFC 1122): do not acknowledge at once. The slide says wait up to 40 ms to piggyback. | `slide 28` | core |
| S05-C122 | write(head) then write(body): Nagle holds the body, the client holds its ACK, and about 40 ms pass. | `slide 28` | core |
| S05-C123 | `nagle.py` on loopback: request 1 took 0.9 ms, the next four 41.5 to 44.0 ms, total 174.3 ms. | `slide 28` | measured |
| S05-C124 | One write plus TCP_NODELAY: 3.2 ms in total, same loopback run. | `slide 28` | measured |
| S05-C125 | The stall appears only on a persistent connection, because close() pushes the data out. | `slide 28` | core |
| S05-C126 | nginx and Apache both coalesce writes and set TCP_NODELAY. | `slide 28` | detail |
| S05-C127 | The HTTP/1.1 bill: head-of-line blocking, header bloat, many connections, ambiguous framing. HTTP/2 fixes these. | `slide 29` | core |
| S05-C128 | A new TCP plus TLS 1.3 connection costs 3 round trips before the first response byte. The slide names QUIC (HTTP/3) as the fix. | `slide 29` | core |
| S05-C129 | Text framing is why HTTP won. Anyone could write it, and anyone could debug it with telnet. | `slide 29` | story |
| S05-C130 | Text was not the problem. Text without lengths and ids was. Binary is a consequence of adding them. | `slide 29` | core |
| S05-C131 | SPDY: Belshe and Peon announced it in November 2009. The claim was "up to 55% faster", in a lab. | `slide 30` | story |
| S05-C132 | From 2010 to 2014, Chrome, Firefox, nginx, Twitter and Facebook shipped SPDY. Google measured both ends. | `slide 30` | story |
| S05-C133 | February 2015: Google announced the end of SPDY. HTTP/2 carried over 25% of Chrome resources, SPDY under 5%. | `slide 30` | story |
| S05-C134 | May 2015: RFC 7540 (HTTP/2) and RFC 7541 (HPACK). May 2016: Chrome 51 removed SPDY, "six and a half years, experiment to obsolete". | `slide 30` | story |
| S05-C135 | June 2022: RFC 9113 obsoletes RFC 7540. It deprecates the old priorities and the h2c Upgrade. | `slide 30` | detail |
| S05-C136 | The name is HTTP/2, not HTTP/2.0. The working group dropped the minor version because "1.1" caused a decade of confusion about what a 1.x server must support. There is no HTTP/2.1. | `slide 30` | detail |
| S05-C137 | The client preface is exactly 24 bytes: `PRI * HTTP/2.0`, two CRLFs, `SM`, two CRLFs. | `slide 31` | core |
| S05-C138 | An HTTP/1.1 server sees method PRI and fails cleanly with 501. It does not parse the frames as text. | `slide 31` | detail |
| S05-C139 | PRI and SM are what is left of PRISM, 2013. The RFC does not say so. | `slide 31` | story |
| S05-C140 | Over TLS, the client offers h2 and http/1.1 by ALPN in the ClientHello. No extra round trip. | `slide 31` | core |
| S05-C141 | Cleartext h2c starts by prior knowledge. RFC 9113 deprecates the Upgrade dance. No browser ships cleartext HTTP/2. | `slide 31` | detail |
| S05-C142 | The frame header is 9 bytes: Length 24 bits, Type 8, Flags 8, a reserved bit, Stream Identifier 31. | `slide 32` | core |
| S05-C143 | The bytes `00 01 07 00 00 00 00 00 01` mean length 263, type DATA, no flags, stream 1. | `slide 32`, `README.md` | core |
| S05-C144 | The server sent SETTINGS (length 42, stream 0), then HEADERS (length 77, END_HEADERS, stream 1). | `slide 32` | measured |
| S05-C145 | Then DATA with length 263, and an empty DATA frame with END_STREAM. GET / took 67 bytes of text, 15 of HPACK. | `slide 32` | measured |
| S05-C146 | Client streams are odd and server streams are even, so nobody coordinates. Stream 0 is the connection. | `slide 32` | core |
| S05-C147 | HTTP/2 defines ten frame types, 0x00 to 0x09. | `slide 33` | core |
| S05-C148 | DATA replaces Content-Length and chunked. HEADERS opens a stream and replaces the request line and headers. | `slide 33` | core |
| S05-C149 | RST_STREAM cancels one stream. In HTTP/1.1 the only way was to close the connection. | `slide 33` | core |
| S05-C150 | GOAWAY gives the last stream id the sender will process, so the connection drains. | `slide 33` | core |
| S05-C151 | SETTINGS announces limits both ways. PING measures RTT and keeps intermediaries awake. WINDOW_UPDATE does flow control per stream and per connection. | `slide 33` | detail |
| S05-C152 | PRIORITY is deprecated, see RFC 9218. PUSH_PROMISE did not last. CONTINUATION became a DoS class in 2024. | `slide 33` | detail |
| S05-C153 | Defaults: HEADER_TABLE_SIZE 4096, INITIAL_WINDOW_SIZE 65535, MAX_FRAME_SIZE 16384. MAX_CONCURRENT_STREAMS has no default limit, with the advice "no smaller than 100". | `slide 33` | detail |
| S05-C154 | HPACK static table: 61 entries, the same everywhere. Index 2 is :method GET, so GET costs one byte, 0x82. | `slide 34` | core |
| S05-C155 | HPACK dynamic table, from index 62, holds what this connection sent before. A 300-byte cookie costs 300 bytes once, then 1 to 2 bytes each time after. | `slide 34` | core |
| S05-C156 | HPACK Huffman is a fixed code built from real header text. e is 5 bits, X is 8. It applies only when shorter. | `slide 34` | core |
| S05-C157 | `hpack_mini.py` passes the RFC 7541 Appendix C vectors and agrees with the pypi hpack package. | `slide 34` | detail |
| S05-C158 | One header set: 174 bytes of text, 79 bytes of HPACK the first time, 6 bytes the second time. | `slide 34` | measured |
| S05-C159 | The dynamic table is per connection, so HTTP/2 wants one connection. Domain sharding now hurts. | `slide 34` | core |
| S05-C160 | CRIME (2012): an attacker who sees only the compressed size guesses a secret one character at a time. | `slide 35` | core |
| S05-C161 | The HPACK Huffman table never adapts, and the dynamic table matches whole fields. A right prefix guess wins nothing. | `slide 35` | core |
| S05-C162 | RFC 7541 §7.1 lets a sender mark sensitive fields as never indexed. | `slide 35` | detail |
| S05-C163 | Compress a JSON response with a user search term and an API key together, and you rebuild CRIME. | `slide 35` | core |
| S05-C164 | `h2_client.py --port 8020 --multiplex --slow 2`, direct loopback, no added RTT, the server sleeps 2 s on big.txt. Six requests on one HTTP/2 connection: fast streams done at 4.9 to 7.8 ms, big.txt at 2005.9 ms. | `slide 36` | measured |
| S05-C165 | HTTP/2 responses arrive out of order on purpose, because each frame says which stream it is for. | `slide 36` | core |
| S05-C166 | Same run: the HPACK table warms up over the first four HEADERS frames, 84 to 30, 76 to 12, 73 to 11 and 75 to 12 bytes. | `slide 36` | measured |
| S05-C167 | The h2 handler has the shape of the HTTP/1.1 handler: same GET, same 200, same ETag. | `slide 36` | detail |
| S05-C168 | Same conditions (loopback, 2 s sleep), with the first h2 server that handled each request inside the read loop: all six streams finished at 2005.6 to 2005.9 ms. | `slide 37` | measured |
| S05-C169 | The fix: one thread per stream and a lock around the connection. A protocol can only give permission. | `slide 37` | core |
| S05-C170 | Same shape: a pool on one DB connection, a blocking call in a coroutine, a gRPC handler with a global mutex, six goroutines waiting on one channel. | `slide 37` | detail |
| S05-C171 | A second bug: two writers raced, frames left out of order, and the HPACK tables diverged. | `README.md` Hour 4, `h2_server.py` | detail |
| S05-C172 | Server push stays in RFC 9113 §8.4 and RFC 9114 §4.6. No RFC deprecated it. | `slide 38` | correction |
| S05-C173 | Chrome 106, 27 September 2022, removed push. Only 1.25% of HTTP/2 sites used it, later 0.7%. | `slide 38` | story |
| S05-C174 | The server does not know the client cache. So push sends files the client has, on the same window. | `slide 38` | core |
| S05-C175 | 103 Early Hints (RFC 8297) replaces push. The server informs. The client checks its cache and decides. | `slide 38` | core |
| S05-C176 | RFC 9114 §1.1: under HTTP/2, a lost or reordered TCP packet stalls every active stream. | `slide 39` | core |
| S05-C177 | `stall_tcp.py --after 3000 --stall 300` on loopback, no added RTT, held the stream at byte 3000 for 300 ms. In run 1, streams behind the hole finished at 306.3 to 308.9 ms. | `slide 39`, `run_all.sh` | measured |
| S05-C178 | The later bytes had arrived. The kernel may not hand them over without breaking in-order delivery. | `slide 39` | core |
| S05-C179 | Which streams get caught changes every run. The blast radius is whoever had bytes behind the gap. | `slide 39` | core |
| S05-C180 | SPDY data: 11.81% faster at 0% loss, 47.7% at 2% loss. Multiplexing helps most where TCP hurts most. | `slide 39` | story |
| S05-C181 | IP protocol numbers: TCP is 6, UDP is 17, SCTP is 132. | `slide 40` | detail |
| S05-C182 | NATs, firewalls, CGNAT and proxies drop protocols they do not know. So SCTP (2000) cannot cross the internet. | `slide 40` | core |
| S05-C183 | UDP is not a good foundation. It is a hole that already exists. | `slide 40` | core |
| S05-C184 | A middlebox depends on anything it can read, and then that part can never change. That killed TCP options. | `slide 40` | core |
| S05-C185 | QUIC encrypts packet numbers and most of the header, to keep the protocol changeable. | `slide 40` | core |
| S05-C186 | QUIC runs in user space. A TCP change needs kernel upgrades. A QUIC change ships with the app. | `slide 40` | core |
| S05-C187 | Cold TCP plus TLS 1.3 plus HTTP/2 needs 3 round trips to the response. With TLS 1.2 it needed 4. | `slide 41` | core |
| S05-C188 | Cold QUIC plus HTTP/3 needs 2 round trips. The TLS ClientHello rides in a QUIC CRYPTO frame. | `slide 41` | core |
| S05-C189 | QUIC has one handshake. It does not do a transport handshake and then a crypto handshake. | `slide 41` | core |
| S05-C190 | TLS is not optional. There is no unencrypted QUIC. | `slide 41` | core |
| S05-C191 | `handshake_race.py --rtt 150` on loopback: TCP through `laggy.py --rtt 150`, QUIC through `lossy_udp.py --loss 0 --rtt 150`. TCP plus TLS 1.3 plus h2 took 456.6 ms, new QUIC 319.8 ms. The "round trips" column (3.0, 2.1) is time ÷ 150, not a count. Our code reading: the TCP row stops at the server's first HTTP/2 frame (SETTINGS). The QUIC rows stop at the full response. | `slide 41`, `run_all.sh` lines 17-18, 74, `handshake_race.py` lines 62, 107, 113 | measured |
| S05-C192 | Every layer boundary is a place where you may pay a round trip. | `slide 41` | core |
| S05-C193 | Same run and conditions: 0-RTT sends the request in the first flight, 161.7 ms (1.1 = time ÷ 150). The slide says cold QUIC saves 137 ms and 0-RTT saves 295 ms. | `slide 42` | measured |
| S05-C194 | RFC 9001 §9.2: an attacker can replay early data. The TLS 1.3 protections are imperfect. | `slide 42` | core |
| S05-C195 | The defence is a single-use ticket cache. A farm has many servers, so a replay goes to another one. | `slide 42` | core |
| S05-C196 | The application protocol MUST describe how it uses 0-RTT and how it stops replay. | `slide 42` | core |
| S05-C197 | In practice 0-RTT carries idempotent requests only. GET is fine. A POST that charges a card is not. | `slide 42` | core |
| S05-C198 | Cloudflare allows only GET and HEAD and adds an Early-Data header. The origin can answer 425 Too Early. | `slide 42` | detail |
| S05-C199 | 0-RTT is a cache of a negotiation. Such a cache trades a round trip for a possible replay. | `slide 42` | core |
| S05-C200 | HTTP/3 through `lossy_udp.py --loss 0.05 --skip 10` (seed 1, server to client, loopback, no added RTT): 18 datagrams deleted. Only big.txt waited, at 78.2 ms. The rest took 4.5 to 11.0 ms. | `slide 43`, `run_all.sh` line 16 | measured |
| S05-C201 | Each QUIC STREAM frame carries a stream id and an offset. Order holds inside a stream, not between streams. | `slide 43` | core |
| S05-C202 | The TCP side delayed a chunk and the QUIC side deleted datagrams. Compare blast radius, not 307 against 78 ms. | `slide 43` | core |
| S05-C203 | A TCP connection is its four-tuple. Change an address or a port and the connection is dead. | `slide 44` | core |
| S05-C204 | Wi-Fi to LTE changes your IP, so every TCP connection dies. A NAT rebinding after idle does the same. | `slide 44` | core |
| S05-C205 | RFC 9000 §5.1: a connection ID keeps packets on the right endpoint when addresses change. | `slide 44` | core |
| S05-C206 | New address, same connection ID, a validated path: the connection carries on (RFC 9000 §9). Slide simplification: on active migration the client must switch to an unused connection ID (RFC 9000 §9.5, section 6). | `slide 44` | core |
| S05-C207 | A stable visible ID tracks users. So IDs MUST NOT let an observer link them. Endpoints hold a pool and rotate. | `slide 44` | core |
| S05-C208 | Identity belongs at the layer that owns the meaning. TCP made address and identity the same thing. | `slide 44` | core |
| S05-C209 | RFC 9204: HPACK over HTTP/3 would cause head-of-line blocking. It assumes one total order across streams. | `slide 45` | core |
| S05-C210 | A block on stream 12 can refer to an entry added on stream 8 that has not arrived. Stream 12 stalls. | `slide 45` | core |
| S05-C211 | QPACK moves table inserts to an encoder stream (type 0x02) and acknowledgements to a decoder stream (0x03). | `slide 45` | core |
| S05-C212 | The QPACK encoder refers only to entries it knows are safe. | `slide 45` | core |
| S05-C213 | QPACK_BLOCKED_STREAMS and QPACK_MAX_TABLE_CAPACITY both default to 0. | `slide 45` | detail |
| S05-C214 | Static tables: HPACK has 61 entries from index 1. QPACK has 99 from index 0, built from newer traffic. | `slide 45` | detail |
| S05-C215 | Shared mutable state and out-of-order delivery do not mix. Relax an order guarantee, then find what used it. | `slide 45` | core |
| S05-C216 | ALPN (RFC 7301, July 2014) picks h2 or h3 inside the TLS handshake. It is free, but needs a handshake first. | `slide 46` | core |
| S05-C217 | Alt-Svc (RFC 7838, April 2016) is a response header the browser remembers. A cold cache pays one TCP+TLS connection. | `slide 46` | core |
| S05-C218 | The HTTPS DNS record (RFC 9460, November 2023, type 65) carries the ALPN list in the DNS answer. | `slide 46` | core |
| S05-C219 | 3 to 5% of networks block all UDP (RFC 9308 §2). | `slide 46` | core |
| S05-C220 | 95.3% of Google clients could use QUIC. For 4.4%, a network blocked UDP or the packets were too big. | `slide 46` | story |
| S05-C221 | Drop UDP and the client falls back to TCP. Any protocol with a fallback has a downgrade attack. | `slide 46` | core |
| S05-C222 | Web Almanac 2024, by request: HTTP/1.1 about 15%, HTTP/2 and up about 85%. | `slide 47` | detail |
| S05-C223 | Web Almanac 2024, by homepage: h1 21-22%, h2 70-71%, h3 7-9%. Alt-Svc 26-28%, HTTPS record 9-10%. | `slide 47` | detail |
| S05-C224 | W3Techs, 3 Sep 2026: HTTP/2 34.6%, HTTP/3 40.3%. h3 above h2 means the categories differ. | `slide 47` | detail |
| S05-C225 | About 15% of requests use HTTP/1.1 (Web Almanac 2024). The slide says "in 2026". There is no cutover, only a long tail. | `slide 47` | core |
| S05-C226 | Idea 1: multiplexing needs identity. If a client must wait before the next message, look for a missing id. | `slide 49` | core |
| S05-C227 | Idea 2: every fix is the next problem. There is no final version, only a sequence of trades. | `slide 49` | core |
| S05-C228 | Idea 3: semantics and encoding differ. GET has not changed since 1996. The wire format changed three times. | `slide 49` | core |
| S05-C229 | Idea 4: deployed reality beats specification: 307, six connections, smuggling, 418, push, QUIC on UDP. | `slide 49` | core |
| S05-C230 | The lab has 5 servers, 5 clients and 4 proxies in about 2,900 lines. It needs no network. | `slide 50`, `README.md` | detail |
| S05-C231 | Not covered: TLS beyond ALPN, HTTP/2 priorities, WebTransport, QUIC datagrams, MASQUE, and RFC 9111. | `slide 50` | detail |
| S05-C232 | `laggy.py` adds real delay, because loopback lies. A loopback round trip costs about 30 microseconds. | `laggy.py` | detail |
| S05-C233 | server10 answers OPTIONS with 501, because RFC 1945 has no OPTIONS. | `README.md` Hour 1, `run_all.sh` | detail |
| S05-C234 | When one side has the knowledge and the other has the state, inform, do not act. The server knows what the page needs, and the client knows its cache. | `slide 38` | core |
| S05-C235 | The closing slogan: the protocol "did not drift", it "was pushed". | `slide 51` | story |
| S05-C236 | RFC 9000 (QUIC) is from May 2021. RFC 9114 (HTTP/3) is from June 2022. | `README.md` Hour 5 heading | story |
| S05-C237 | QUIC finds lost datagrams with its own loss detection, RFC 9002. | `README.md` Hour 5, `lossy_udp.py` line 7 | detail |
| S05-C238 | The second h2 server bug showed as `IndexError: index 75 is not in either table`. `hpack_mini.py` and pypi `hpack` failed the same way on those bytes, which proved the decoder right. It surfaced under `stall_tcp.py` and almost never without it: "Concurrency bugs are latency-sensitive". | `README.md` Hour 4, `h2_server.py` lines 44-59 | story |
| S05-C239 | At the 16,384-byte default frame size, big.txt (202,000 bytes) goes out as 13 DATA frames, which lets small responses slot in between. | `h2_server.py` lines 130-133 | detail |
| S05-C240 | The Nagle stall was "a bug I hit today": the first draft of `server11.py` wrote the head and the body in two writes. | `slide 28` title, `README.md` Hour 3 | story |

## 4. Instructor questions

| ID | The question | Model answer outline |
|---|---|---|
| S05-Q01 | Assignment: the calculator that stays on the line (slide 3). | Graded. No model answer. Module `s05-m12-assignment-prep` gives the checklist, concepts, test plan and hints. |
| S05-Q02 | Project: HTTP, in binary (slide 4). | Graded. No model answer. Module `s05-m13-project-studio` gives design questions, a trade-off table and a spec checklist. |
| S05-Q03 | HTTP/2 chose 24 / 8 / 8 / 31. Why? (slide 4) | Our analysis, not instructor or RFC text. Checkable parts: RFC 9113 §4.1 (unknown types discarded) and §6.5.2 (16,384 default). The 24-bit length allows 16,777,215 bytes, but the default cap is 16,384, so big bodies interleave. 8 type bits give 256 types. Unknown ones get skipped. 8 flag bits suit per-type booleans. The 31-bit id gives 2^30 client streams, and one bit stays reserved. Fixed offsets make the parse cheap and unambiguous. |
| S05-Q04 | Why not gzip the headers? (slides 27, 35) | An adaptive compressor puts attacker text and a secret cookie in one dictionary. The size then drops by one byte for a right guess (CRIME, 2012). HPACK uses a fixed Huffman code and exact-match indexes, so a partial guess shows nothing. |
| S05-Q05 | The best row in the fetch table is the one nobody shipped. Why? (slides 18, 25) | Pipelining needs responses in request order, because a response carries no request id. One slow response delays all others: 2003 ms against 3 ms. |
| S05-Q06 | Why does 307 exist? (slide 19) | Browsers turned a 302 POST into a GET against the spec. RFC 2616 wrote the habit down, renamed 302 to Found, and added 307, which keeps the method. |
| S05-Q07 | Why not take protocol number 253 and build a proper transport? (slide 40) | NATs, firewalls and proxies drop unknown protocols. SCTP is the proof. UDP already passes, so QUIC builds on it and encrypts its header so middleboxes cannot freeze it. |
| S05-Q08 | Which requests may use 0-RTT? (slide 42) | Only requests that are safe to run twice. An attacker can replay early data to another server in the farm. GET and HEAD, yes. A payment POST, no. The origin can refuse with 425 Too Early. |
| S05-Q09 | Why must you not read 307 ms against 78 ms as a benchmark? (slide 43) | The two sides used different faults: a 300 ms delay on TCP, real deletion on QUIC. Only the blast radius compares: many streams on TCP, one stream on QUIC. |
| S05-Q10 | Adoption numbers: read them how? (slide 47) | Ask what the unit is: requests, homepages or websites. Ask how the crawler finds h3. W3Techs shows h3 above h2, which cannot be the same category. The Almanac says its homepage h3 figure under-reports. |
| S05-Q11 | Homework 1: extend `fetch_page.py` to N connections, plot wall time at 150 ms for 6, 20 and 60 assets, and find the knee. Read cwnd in `ss -ti`. | Answer: needs a run. Instructor hint (slide 48, README): the knee is not "you ran out of connections", it "is not where you think", and `ss -ti` shows `cwnd`. Our analysis, not the instructor's: through `laggy.py`, each new connection waits a serial half RTT in the accept loop (line 59). So wall time ≈ the largest (k × 75 + queue depth × 150) ms over connections k. That model gives 600 ms for N = 2 and N = 6 (slide 18: 607.0, 608.2). Its best N is 4, 6 and 9 for 6, 20 and 60 assets, if connections are accepted in bucket order. The smooth optimum is √(2 × assets): 3.5, 6.3 and 11. Past the knee, time rises. Past N = assets nothing changes, because `fetch_page.py` opens no connection for an empty bucket (lines 85-86). Slow start matters on a real path with bigger objects, not for these small files on loopback. Confirm with a run. |
| S05-Q12 | Homework 2: build the ETag from mtime, then change a file twice in one second. | If the ETag uses mtime in whole seconds (for example the Last-Modified string, 1 s resolution), both versions get one ETag, so a cache keeps a stale copy with a 304. A nanosecond mtime hides the bug on Linux, but it is still not a fingerprint of the bytes. That is a weak validator in the RFC 9110 §8.8.1 sense. Range needs a strong one, because bytes from two versions would splice into a corrupt file. |
| S05-Q13 | Homework 3: decode a HEADERS block by hand against RFC 7541 §6, then explain the 6-byte second request. Slide 48: "the one to do if you only do one". The README asks for a long cookie, but `h2_client.py` has no cookie option (section 7). | A first bit 1 means an indexed field: 0x82 is index 2. A first pair 01 means a literal that joins the table: 0x41 is name index 1. On the second request every field is in a table, so each costs one byte. |
| S05-Q14 | Homework 4: set QPACK_BLOCKED_STREAMS to 0, then 16. What may the encoder do differently? Slide 48: "The hardest one here". `h3_server.py` has no QPACK setting, and the lab server already advertises 16 (section 7). | At 0 the encoder may refer only to acknowledged entries, so it sends more literals and never blocks a stream. At 16 it may refer to entries still in transit on up to 16 streams. That compresses better, but a lost insert stalls those streams. |
| S05-Q15 | Homework 5: drop UDP to port 4433, time the fallback, and redo the loss test with netem on both sides. | Answer: needs a run. `h3_client.py` has no TCP fallback, so it waits for the QUIC timeout. A browser needs a short timer or a race. "Slide 41" in the homework is PDF slide 43, the caveat slide. |
| S05-Q16 | Bring to Session 6: a QUIC connection survives a network change, a session cookie does not. Which is the real user identity? (slide 50) | Session 6 topic. Outline: the connection ID names a transport path. The cookie names a session that the application keeps in some store. Section 7 has the preview. |

## 5. Modules

### s05-m01-http10

- **Title:** HTTP/1.0: one question, then the line goes dead. **Minutes:** 20.
- **Big idea:** HTTP/1.0 spent one whole TCP connection on every response, and it could not tell two websites apart.
- **Covers:** S05-C23, S05-C24, S05-C25, S05-C27, S05-C28, S05-C29, S05-C30, S05-C31, S05-C32, S05-C33, S05-C34, S05-C35, S05-C36, S05-C37, S05-C39, S05-C40, S05-C41, S05-C42, S05-C43, S05-C233.
- **Prereqs:** s01-m01-seven-syscalls, s01-m08-framing, s02-m04-tcp-lifecycle.
- **Threads:** T-round-trip-tax, T-name-in-message, T-framing, T-fix-causes-next.

**Pretest.**
1. A page needs 24 files. How many TCP connections does HTTP/1.0 open? *Answer: 24, one for each file.*
2. How does an HTTP/1.0 client know that the body ended? *Answer: the server closes the connection. server10 also sends Content-Length.*
3. Can one HTTP/1.0 server on one IP address host two site names? *Answer: no. There is no Host header.*

**Rung 1, the picture.** You phone a shop. You may ask one question. The clerk answers and hangs up. For the next question you dial again, and the dialing takes as long as the question. The shop number reaches one building, and nobody there asks which company you want. *Where it breaks:* a phone call has no rule that forces a hang-up. HTTP/1.0 chose it. Also, each new TCP connection starts slow again, which a phone call does not do.

**Rung 2, how it works.**
1. The client opens a TCP connection. That costs one round trip.
2. The client sends a request line, some headers and an empty line.
3. The server sends a status line, headers, an empty line and the body.
4. The server closes the connection. The client reads until end of file.
5. For the next file, the client starts again at step 1.

**Rung 3, the real thing.** `talk.py 8010 --req "GET / HTTP/1.0" ""` sends 18 bytes: 16 for the request line with CRLF, 2 for the empty line (slide 6). The reply has a status line and six headers, then `--- server closed the connection (FIN) at 2.9 ms`. In `01-http10/server10.py`, `handle()` reads one request and returns (lines 61-124). No loop exists. The status list (lines 26-35) is the whole RFC 1945 list. A second send on the same socket reads `b''` (slide 7). If-Modified-Since against the file mtime gives 304 (lines 110-115). A Host header only makes a log line (lines 81-84).

**Rung 4, exam depth.**
- *The round-trip tax.* Each object costs a handshake and an exchange: 2 × N × RTT. At 24 objects and 200 ms that is 9.6 s. More bandwidth does not change it (S05-C32).
- *What if the browser opens 4 connections at once?* 24 objects in 6 batches of 4, each batch 2 RTT: 6 × 400 ms = 2.4 s. This model ignores slow start and server limits.
- *The correction.* Head-of-line blocking needs a queue. HTTP/1.0 has no pipelining, so it has a serialisation cost, not a queue stall (S05-C42).
- *A clock is a weak fingerprint.* Two writes in one second look like one write. Clocks drift. A rebuild changes mtime and no bytes (S05-C40). Module 3 fixes this.
- *No Host.* The address was the only name, so one site needed one IPv4 address (S05-C34). The fix arrived in RFC 2068 (S05-C36, S05-C41).
- *Exam prompts.* (1) Why is a 24-object HTTP/1.0 page slow even on a 1 Gbit link? *Model answer: it pays 48 round trips, 9.6 s at 200 ms. Bandwidth moves bytes faster, but it does not shorten a round trip.* (2) Why did HTTP/1.1 need a Host header, when HTTP/1.0 did not? *Model answer: under HTTP/1.0 the IP address was the site name. To put many sites on one address, the request itself must carry the name.*

**Misconceptions.**
- S05-M01: "One HTTP/1.0 connection carries many requests." Wrong. The server closes after one response. Distractor in checks 1, 2 and 3.
- S05-M02: "HTTP/1.0 suffers head-of-line blocking." Wrong. It has no queue, only one round trip per object. Distractor in check 3.
- S05-M03: "The address alone can pick between sites, or a Host header works on any server." Wrong. RFC 1945 has no Host, and server10 ignores it. Distractor in check 4.
- S05-M04: "More bandwidth makes a many-object page load faster." Wrong. Round trips cost time that bandwidth does not buy. Distractor in check 3.

**Diagrams.** (1) Step-by-step: one connection life. SYN, SYN-ACK, ACK, request, response, FIN. Actors: client, server. (2) Static: a 24-object timeline with 48 round-trip bars at 200 ms. Actors: client, server.

**Interactives.** *Page-load waterfall simulator* (P1). One simulator for modules 1, 2, 6, 9, 10 and 11. Here only "HTTP/1.0 close" mode is on. Inputs: RTT, asset count, parallel connections from 1 to 6, bandwidth. The learner sees a handshake bar and a request bar for each object. The learner discovers that time grows with assets × RTT, and that bandwidth does almost nothing for small objects. *Simulator spec* (a pure function per mode, with tests). Wall-time round trips for N assets, as `fetch_page.py` counts them: close 2N, keep-alive 1 + N, parallel n 1 + ceil(N/n), pipelined 2. Test vector: slide 18 gives 12, 7, 4, 2 and 2 for N = 6. TLS 1.3 adds 1 round trip per connection setup: close 3N, keep-alive 2 + N, parallel 2 + ceil(N/n), pipelined and HTTP/2 3. HTTP/3 is 2 and 0-RTT is 1 (module 10). Wall time = round trips × RTT + bytes × 8 ÷ bandwidth. Loss rule: a lost segment adds a fixed stall S (default 300 ms, as `stall_tcp.py` does) to every later byte on the same TCP connection, but on QUIC only to later bytes of its own stream. The wall time is a model, not the `laggy.py` capture (section 7, item 17).

**Predict, observe, explain.** Command: `python3 tools/talk.py 8010 --req "GET / HTTP/1.0" ""`. Predict: after the body, does the socket stay open? Observe: the FIN line. The captured output is slide 6. The second-request result, `b''`, is slide 7.

- **Worked example.** 24 objects at 200 ms RTT. Handshakes: 24 × 200 ms = 4.8 s. Exchanges: 24 × 200 ms = 4.8 s. Total: 9.6 s.
- **Faded example.** 10 objects at 100 ms RTT. Handshakes: ____. Exchanges: ____. Total: ____. *(1.0 s, 1.0 s, 2.0 s.)*
- **Your turn.** 6 objects at 150 ms RTT. *(12 round trips, 1.8 s. The measured close row is 1369.2 ms. Section 7 explains why the proxy charges less for a handshake.)*

**Checks.**
1. `numeric`: 12 objects, 50 ms RTT, one connection at a time. Total in seconds? Answer: 1.2. Distractor 0.6 (S05-M01: no handshake per object). Distractor 0.65 (S05-M01: one kept connection, 13 round trips). Feedback: each object pays a handshake and an exchange, 24 × 50 ms.
2. `predict`: after response 1, the client sends a second GET on the same HTTP/1.0 socket. What does recv return? Answer: empty bytes. Distractor: a second 200 (S05-M01). Distractor: a 400 for a bad request (S05-M01). Feedback: the server closed the connection after response 1.
3. `mcq`: which cost does a 24-object HTTP/1.0 page pay? Answer: a handshake and an exchange per object, in series. Distractor: a queue behind one slow response (S05-M02). Distractor: one handshake for the whole page (S05-M01). Distractor: a delay that a faster link removes (S05-M04). Feedback: no pipelining means no queue, only 2 round trips per object.
4. `mcq`: a client sends Host: site-b.example to server10. Which page returns? Answer: site-a. Distractor: site-b (S05-M03). Distractor: 400 (S05-M03). Feedback: RFC 1945 has no Host, so server10 ignores it.

**Review cards.**
- Q: What does an HTTP/1.0 server do right after it sends a response? A: It closes the TCP connection.
- Q: The cost of N objects over HTTP/1.0, one connection at a time, at RTT R? A: 2 × N × R.
- Q: Why did one IPv4 address serve only one website in 1996? A: HTTP/1.0 had no Host header.
- Q: Which RFC defines HTTP/1.0 (May 1996)? A: RFC 1945.
- Q: Which three headers made up HTTP/1.0 caching? A: Last-Modified, If-Modified-Since, Expires.

**Lab.** `sources/` is read-only, and `tools/lab.sh` writes pid files. So copy first: `cp -r sources/cn-at-scaler/lesson5/http-evolution /tmp/he && cd /tmp/he && tools/lab.sh up`. Run `python3 tools/talk.py 8010 --req "GET / HTTP/1.0" "Host: site-b.example" ""`. Expected: `<h1>site-a</h1>`, and `out/s10.log` shows the "ignoring Host" line. Run `python3 tools/talk.py 8010 --req "OPTIONS / HTTP/1.0" ""`. Expected: `501 Not Implemented`. Stop with `tools/lab.sh down`.

### s05-m02-keepalive-host

- **Title:** Keep-alive and Host: stay on the line, and say the name. **Minutes:** 18.
- **Big idea:** RFC 2068 made the connection stay open by default, and one header let one address serve many sites.
- **Covers:** S05-C38, S05-C44, S05-C45, S05-C46, S05-C47, S05-C48, S05-C49, S05-C50, S05-C51.
- **Prereqs:** s05-m01-http10, s01-m07-see-the-bytes-tls, s04-m09-routing.
- **Threads:** T-setup-off-path, T-name-in-message, T-fix-causes-next.

**Pretest.**
1. In HTTP/1.1, what happens to the connection after a response, by default? *Answer: it stays open.*
2. An HTTP/1.1 request arrives with no Host. Which status? *Answer: 400 Bad Request.*

**Rung 1, the picture.** Now the clerk stays on the phone. You ask, the clerk answers, and you ask again. The building has one street address and many companies. You say the company name at the front desk first. *Where it breaks:* with HTTPS the whole message is in a sealed envelope, so the name must also go on the outside (SNI). And a line that stays open still costs the shop a phone, so servers hang up after an idle time.

**Rung 2, how it works.**
1. The client opens one connection and sends a request with a Host header.
2. The server picks the site from the Host value.
3. The server answers with a length and does not close.
4. The client reads exactly that many bytes, then sends the next request.
5. Either side ends it with Connection: close, or the server closes after an idle timeout.

**Rung 3, the real thing.** RFC 2616 §8.1.2 calls persistent connections "the default behavior". `demos.sh` demo 1 shows three responses on one handshake (slide 11). Slide 12 shows a 400 for a request with no Host, and site-a and site-b from one IP and one port. A `talk.py` capture of a kept response shows `Connection: keep-alive` and `Keep-Alive: timeout=15, max=100` (scratch copy, 2026-09-13). *Gated box, "open after your first calculator attempt" (slide 3 asks the class not to read `server11.py` before one failure):* in `02-http11/server11.py`, `handle()` calls `one_request()` in a loop (lines 107-110). The server closes only on `Connection: close`, or for an HTTP/1.0 client without keep-alive (lines 155-157). A 1.1 request with no Host gets 400 and a close (lines 149-152). The Host value picks the document root (lines 30-31, 193-199). The idle timeout is 15 s (line 52), and line 75 writes the Keep-Alive header.

**Rung 4, exam depth.**
- *Why the default mattered.* An opt-in header broke on servers that crashed on it. An opt-out default gave the fast path to code that did nothing (S05-C45, S05-C47).
- *Persistence forces framing.* When the server stops closing, "end of file" no longer marks the end. Now every body needs a length or chunking. Module 4 and module 12 build on this.
- *The name in the message.* Host in the request, SNI in the ClientHello, :authority in HTTP/2, a routing key in a broker (S05-C51). Each time, many destinations share one address.
- *What if a server guesses a default site for a missing Host?* It might send the pages of one tenant to the users of another. HTTP/1.1 requires a 400 instead.
- *Model arithmetic.* N objects in sequence on one kept-alive connection cost 1 + N round trips, against 2N for HTTP/1.0.
- *Exam prompt.* A server keeps idle connections for 15 s and has 10,000 idle clients. What does a 1 s timeout gain and lose? *Model answer: it frees the sockets and buffers of idle clients quickly. A client that pauses longer than 1 s must reconnect and pay the handshake again.*

**Misconceptions.**
- S05-M05: "An HTTP/1.1 connection closes unless the client sends Connection: keep-alive." Wrong. Staying open is the default. Distractor in check 1.
- S05-M06: "A server guesses a default site when Host is missing." Wrong. HTTP/1.1 requires 400. Distractor in check 3.
- S05-M03 appears again in checks 3 and 4.

**Diagrams.** (1) Step-by-step: three requests and three responses on one connection, one handshake. Actors: client, server. (2) Static: the name-in-the-message table across HTTP/1.1, TLS, HTTP/2 and a message broker.

**Interactives.** (1) *Page-load waterfall simulator* (P1), with "keep-alive, one at a time" mode added. The learner discovers that the handshake bar appears once. (2) *Virtual host router* (P2). Inputs: Host value, a site table. The learner sees which root answers, and the 400 for a missing Host.

**Predict, observe, explain.** Command: `python3 tools/talk.py 8011 --req "GET / HTTP/1.1" ""`. Predict the status with no Host. Observe: 400 and the RFC text. Captured output: slide 12.

- **Worked example.** 6 objects at 150 ms RTT. Close: 12 round trips = 1,800 ms. Keep-alive: 1 + 6 = 7 round trips = 1,050 ms. Measured: 1369.2 ms and 985.4 ms (slide 18).
- **Faded example.** 10 objects at 100 ms RTT. Close: ____. Keep-alive: ____. *(2,000 ms. 1,100 ms.)*
- **Your turn.** 3 objects at 80 ms RTT. *(Close 480 ms. Keep-alive 320 ms.)*

**Checks.**
1. `mcq`: what does an HTTP/1.1 connection do after a response, with no Connection header? Answer: it stays open. Distractor: it closes (S05-M05). Distractor: it stays open only if the request said Connection: keep-alive (S05-M05). Feedback: RFC 2068 flipped the default, and Connection: close opts out.
2. `numeric`: keep-alive, 5 objects in sequence, 100 ms RTT. How many round trips? Answer: 6. Distractor: 10 (S05-M05). Feedback: one handshake, then one exchange per object.
3. `mcq`: an HTTP/1.1 request has no Host. Answer: 400 Bad Request. Distractor: 200 from a default site (S05-M06). Distractor: 200 from the site bound to that IP address (S05-M03). Feedback: guessing can serve the wrong tenant.
4. `multi`: which carry the site name inside the message? Answer: Host, SNI, :authority. Distractor: the destination IP address (S05-M03). Distractor: the destination port (S05-M03). Feedback: one address and one port can front many names.

**Review cards.**
- Q: What is the default connection behaviour in HTTP/1.1? A: Persistent. Connection: close opts out.
- Q: Which RFC made persistence the default (January 1997)? A: RFC 2068.
- Q: What status does an HTTP/1.1 request with no Host get? A: 400 Bad Request.
- Q: Where does TLS carry the site name before encryption starts? A: SNI in the ClientHello.
- Q: What is the HTTP/2 form of the Host header? A: The :authority pseudo-header.

**Lab.** In the scratch copy, run demo 3: `talk.py 8011 --req "GET / HTTP/1.1" "Host: site-a.local" "Connection: close" ""`, then the same with `site-b.local`. Expected: `<h1>site-a</h1>`, then `<h1>site-b</h1>` from one IP and one port.

### s05-m03-validators-vary

- **Title:** Validators and Vary: a fingerprint, not a clock. **Minutes:** 20.
- **Big idea:** An ETag names the exact bytes, so a cache can skip the whole body, and Vary tells the cache what else the answer depends on.
- **Covers:** S05-C39, S05-C40, S05-C52, S05-C53, S05-C54, S05-C55, S05-C56, S05-C57, S05-C58, S05-C59, S05-C60, S05-C75, S05-C76.
- **Prereqs:** s05-m02-keepalive-host, s04-m08-cache.
- **Threads:** T-fix-causes-next.

**Pretest.**
1. How many body bytes does a 304 carry? *Answer: zero.*
2. A file changes twice in one second. Why can If-Modified-Since miss the second change? *Answer: both versions show the same second.*
3. What does Vary: Accept-Encoding tell a cache? *Answer: keep a separate copy for each Accept-Encoding value.*

**Rung 1, the picture.** A library stamps a date inside each book. You ask: "did it change since Tuesday?" If it changed twice on Tuesday, the date does not show it. A photo of every page works better. Any change makes a new photo. Vary is the cloakroom ticket that also says "coat" or "umbrella", because one hook holds two kinds of item. *Where it breaks:* a server may choose a weak tag that ignores small changes on purpose. A photo cannot. And a cloakroom ticket names one item, but the cache key uses the values of the request headers that Vary names, so one URL can need many hooks.

**Rung 2, how it works.**
1. The server sends the body, an ETag, and `Cache-Control: max-age=60`.
2. The cache stores the body under the URL plus the headers named in Vary.
3. After max-age, the cache sends If-None-Match with the stored tag.
4. The same bytes give 304 and no body. The cache keeps its copy.
5. Different bytes give 200, a new body and a new tag.

**Rung 3, the real thing.** Slide 13 shows the tag for big.txt, `"55274ac22c651b90"`, the first 16 hex digits of a SHA-256 of the bytes (confirmed on the copy). If-None-Match with that tag gives 304. The 304 response is 256 bytes, headers only (slide 13). Demo 7 of `demos.sh` shows `Vary: Accept-Encoding` and gives 202,000, 5,763 and 5,751 bytes (slide 14). RFC 9110 §8.8.3.2 defines the two comparisons. *Gated box, "open after your first calculator attempt" (slide 3):* `server11.py` line 214 builds the tag. Lines 221-224 compare If-None-Match by exact string and return 304. Line 217 sends `max-age=60, must-revalidate`. Lines 251-264 add Vary for text bodies over 256 bytes, then gzip or deflate.

**Rung 4, exam depth.**
- *Strong and weak comparison* (RFC 9110 §8.8.3.2). `W/"1"` against `W/"1"`: weak match yes, strong no. `W/"1"` against `"1"`: weak yes, strong no. `"1"` against `"1"`: both yes. If-None-Match uses the weak comparison. If-Match uses the strong one.
- *Why Range needs a strong validator.* Bytes 0-999 from version 1 and bytes 1000-1999 from version 2 make a corrupt file (S05-C55). RFC 9110 §13.1.5 forbids a weak ETag in If-Range.
- *If-Match and lost updates.* Two editors read version 1. Both send PUT with If-Match. The first succeeds. The second gets 412, rereads and merges (S05-C56).
- *Vary costs.* Accept-Encoding makes a few keys. User-Agent makes millions and the hit rate falls near zero. `*` means never reuse (S05-C60).
- *Text compresses.* gzip gave 5,763 / 202,000 = 2.853% of the size, which the README rounds to 2.9% and the slide prints as 2.8%. The body was never the slow part. Headers are, because Content-Encoding does not touch them (S05-C58). Module 6 measures that.
- *Exam prompts.* (1) Two editors PUT the same document. How does If-Match stop a lost update? *Model answer: each sends the ETag it read. The first matches and wins. The second gets 412 Precondition Failed, so it rereads and merges.* (2) An origin sends Vary: User-Agent through a CDN. What happens to the hit rate, and what should it send? *Model answer: every distinct User-Agent string makes its own key, so hits fall near zero. Vary only on what really changes the bytes, such as Accept-Encoding.*

**Misconceptions.**
- S05-M07: "An ETag is the file modification time." Wrong. server11 hashes the bytes. Distractor in check 2.
- S05-M08: "no-cache means do not store the response." Wrong. It means revalidate first. Distractor in check 3.
- S05-M09: "A 304 carries the body again." Wrong. It carries headers only. Distractor in check 1.
- S05-M10: "More Vary headers make a cache safer at no cost." Wrong. Each one splits the key space. Distractor in check 4.
- S05-M11: "Every ETag comparison is strong." Wrong. If-None-Match uses the weak comparison. Distractor in check 5.

**Diagrams.** (1) Step-by-step: 200 with ETag, max-age expires, If-None-Match, 304. Actors: client, cache, origin. (2) Static: a cache-key table. URL plus Vary headers on the left, stored copies on the right.

**Interactives.** (1) *ETag and 304 cache simulator* (P1). Inputs: the change (new bytes, touch only, two edits in one second), validator type (mtime or hash), clock. The learner sees 200 or 304, and a stale copy when mtime misses an edit. The learner discovers why a fingerprint beats a clock. (2) *Vary cache-key demo* (P1). Inputs: Vary value, a stream of requests with mixed Accept-Encoding and User-Agent. The learner sees the key count and hit rate, and discovers why Vary: User-Agent kills the cache.

**Predict, observe, explain.** Command: demo 6 of `02-http11/demos.sh`. Predict: how many bytes arrive for the 304? Observe: `--- received 256 bytes`. Captured output: slide 13.

- **Worked example.** The cache holds `"v7"`. The server has `"v7"`. If-None-Match uses weak comparison: the tags match, so 304. If-Match uses strong comparison: both tags are strong and equal, so the PUT goes ahead.
- **Faded example.** The cache holds `W/"v7"`. The server has `W/"v7"`. If-None-Match gives ____. If-Match gives ____. *(304, because weak comparison ignores W/. 412, because strong comparison fails when either tag is weak.)*
- **Your turn.** The cache holds `W/"a1"`. The server has `"a1"`. What does If-None-Match give, and what does If-Match give? *(If-None-Match uses weak comparison, so it matches: 304. If-Match uses strong comparison, so it fails: 412.)*

**Checks.**
1. `numeric`: body bytes in a 304? Answer: 0. Distractor: 202,000 (S05-M09). Distractor: 256 (S05-M09: counts the headers as body). Feedback: the cache already has the body, and the 256 bytes are headers.
2. `mcq`: why does a hash ETag beat Last-Modified? Answer: it changes exactly when the bytes change. Distractor: it is the mtime in another format (S05-M07). Distractor: it is a weak tag, so small edits do not count (S05-M11). Feedback: a rebuild changes mtime and not the hash.
3. `mcq`: what does no-cache mean? Answer: store it, but revalidate before use. Distractor: never store it (S05-M08). Distractor: store it and use it with no check until max-age ends (S05-M08). Feedback: never storing is no-store.
4. `mcq`: what does Vary: User-Agent do to a shared cache? Answer: it makes a huge number of keys, so hits fall near zero. Distractor: it makes the cache safer, with no cost (S05-M10). Distractor: nothing, because caches act only on Vary: * (S05-M10). Feedback: each User-Agent string becomes its own key.
5. `multi`: which use the strong comparison? Answer: If-Match, If-Range. Distractor: If-None-Match (S05-M11). Distractor: If-Modified-Since (S05-M07: a date is an ETag). Feedback: If-None-Match allows weak tags, and If-Modified-Since compares dates, not tags.

**Review cards.**
- Q: What does W/ before an ETag mean? A: A weak validator: equivalent, not byte-identical.
- Q: Why do Range requests need a strong validator? A: Bytes from two versions would splice into a corrupt file.
- Q: What does Vary: * do? A: It turns caching off for that response.
- Q: What is the difference between no-cache and no-store? A: no-cache revalidates before use. no-store never writes.
- Q: Which conditional header gives optimistic concurrency for writes? A: If-Match.

**Lab.** `talk.py 8011 --req "HEAD /big.txt HTTP/1.1" "Host: site-a.local" "Connection: close" ""`. Expected: `ETag: "55274ac22c651b90"` and `Vary: Accept-Encoding`. Then send the tag in If-None-Match. Expected: `304 Not Modified`.

### s05-m04-range-chunked-extras

- **Title:** Range, chunked and the rest of HTTP/1.1. **Minutes:** 20.
- **Big idea:** Range asks for part of a body, and chunked sends a body of unknown length by nesting both framing rules.
- **Covers:** S05-C61, S05-C62, S05-C63, S05-C64, S05-C65, S05-C66, S05-C67, S05-C68, S05-C69, S05-C70, S05-C71, S05-C72, S05-C73, S05-C74, S05-C77.
- **Prereqs:** s05-m02-keepalive-host, s01-m08-framing, s02-m09-ftp-framing, s03-m05-fastcgi-servlets.
- **Threads:** T-framing, T-deployed-reality.

**Pretest.**
1. `Range: bytes=100-199` asks for how many bytes? *Answer: 100.*
2. A chunk size line says `1a`. How many bytes follow? *Answer: 26.*

**Rung 1, the picture.** Range: you ask the video shop for minutes 40 to 41, not the whole film. Chunked: a friend reads a story on the phone. Before each part she says "the next part has 55 letters". At the end she says "0 letters". *Where it breaks:* the size is in hexadecimal, it counts bytes, and a CRLF follows every part. And a Range counts bytes, not minutes, so byte 1,000,000 does not map to one video time without an index in the file.

**Rung 2, how it works.**
1. Chunked: the server sends Transfer-Encoding: chunked and no Content-Length.
2. For each piece, the server sends the size in hex, CRLF, the bytes, CRLF.
3. At the end it sends `0`, CRLF, and an empty line.
4. The receiver reads a size, reads exactly that many bytes, skips the CRLF, and repeats.
5. Range: the client sends `bytes=a-b`, both ends counted from 0. The server answers 206 with `Content-Range`, or 416 if a is past the end.

**Rung 3, the real thing.** On the scratch copy the chunked wire bytes are `37\r\n`, then 55 bytes of CSS that end in `\n`, then `\r\n0\r\n\r\n` (slide 16). A suffix range `bytes=-50` gives the last 50. A start past the end gives 416 with `bytes */202000` (slide 15). Demos 4, 5, 8 and 9 of `demos.sh` show chunked, Range, OPTIONS with TRACE, and 100 Continue. The lab server uses the RFC 2616 reason phrase "Requested Range Not Satisfiable". RFC 9110 §15.5.17 says "Range Not Satisfiable". *Gated box, "open after your first calculator attempt" (slide 3):* `server11.py` lines 79-84 write 4096-byte pieces with an uppercase hex size, and lines 227-247 handle Range.

**Rung 4, exam depth.**
- *Two rules, nested.* A persistent connection needs an end marker, and a generated body has no length at the start. Chunked uses both framing rules: a length per chunk, an empty chunk as the delimiter (S05-C68). A FastCGI record stream has the same shape (S05-C69).
- *What if a size line lies?* Say it claims 0x40 (64) but 55 bytes follow. The reader wants 9 more bytes. It swallows the CRLF and the final 0 chunk (7 bytes), then waits for 2 more bytes, or on a kept connection steals 2 bytes of the next response. It never sees the end of the body and loses its place. Module 5 turns that into an attack.
- *What Range bought.* Video scrubbing, resume at 60%, and a Parquet or ZIP footer read with a suffix range (S05-C64).
- *416 and 400.* 400 means bad syntax. 416 means the file is smaller than the request (S05-C65).
- *The extras.* OPTIONS is every CORS preflight (S05-C70). TRACE is off everywhere since Cross-Site Tracing (S05-C72). Expect: 100-continue explains the 1-second curl pause (S05-C74).
- *Exam prompt.* Why can a generated page not send Content-Length, and what does chunked cost instead? *Model answer: the server does not know the length before the first byte leaves. Chunked adds a hex size line and a CRLF per chunk, plus the final `0\r\n\r\n`, 5 bytes.*

**Misconceptions.**
- S05-M12: "A byte range end is exclusive, so 100-199 is 99 bytes." Wrong. Both ends count. Distractor in check 1.
- S05-M13: "A chunk size line is decimal." Wrong. It is hexadecimal. Distractor in check 2.
- S05-M14: "A chunked response also needs Content-Length." Wrong. They are alternatives. Distractor in check 3.
- S05-M15: "A range past the end of a file gives 404." Wrong. The file exists, so 416. Distractor in check 4.

**Diagrams.** (1) Step-by-step: a cursor moves over the style.css chunked bytes: size line, 55 bytes, CRLF, `0`, empty line. (2) Static: the three Range cases from slide 15, with status and Content-Range.

**Interactives.** (1) *Chunked decoder* (P1). Inputs: raw bytes with visible CRLF, editable size lines. The learner sees each size parsed and each byte taken. The learner discovers that one wrong size shifts every later read. (2) *Range byte picker* (P1). Inputs: file size, Range header. The learner sees status, Content-Range, Content-Length and the chosen bytes. The learner discovers inclusive ends and suffix ranges.

**Predict, observe, explain.** Command: `talk.py 8011 --req "GET /style.css?chunked=1 HTTP/1.1" "Host: site-a.local" "Connection: close" ""`. Predict: the size line before the CSS. Observe: `37`. Captured output: slide 16.

- **Worked example.** 55 = 3 × 16 + 7, so the size line is `37`. Range `bytes=-50` on 202,000 bytes: start 202,000 − 50 = 201,950, end 201,999, length 50.
- **Faded example.** A 4,096-byte piece. Size line: ____. *(`1000`.)* Range `bytes=500-999`: length ____. *(500.)*
- **Your turn.** Decode `1a` CRLF, 26 bytes, CRLF, `5` CRLF, 5 bytes, CRLF, `0` CRLF CRLF. *(Body length 31.)* Then: `bytes=201990-` on 202,000 bytes. *(206, `bytes 201990-201999/202000`, 10 bytes.)*

**Checks.**
1. `numeric`: `bytes=100-199` returns how many bytes? Answer: 100. Distractor: 99 (S05-M12). Feedback: 199 − 100 + 1.
2. `bytes`: which size line starts a 55-byte chunk? Answer: `37`. Distractor: `55` (S05-M13). Feedback: the size is hex, 3 × 16 + 7.
3. `mcq`: which header, if any, gives the body length of a chunked response? Answer: none, the zero-size chunk marks the end. Distractor: Content-Length, sent next to Transfer-Encoding (S05-M14). Distractor: Content-Length: 0, to say that chunks follow (S05-M14). Feedback: chunked and Content-Length are alternatives.
4. `mcq`: `bytes=999999-` on a 202,000-byte file? Answer: 416. Distractor: 404 (S05-M15). Distractor: 206 with an empty body (S05-M15). Feedback: the file exists, the range does not, and 416 says so.

**Review cards.**
- Q: What ends a chunked body? A: A chunk of size 0, then an empty line.
- Q: Hex 37 is how many bytes? A: 55.
- Q: Which status answers a range that starts past the end of a file? A: 416.
- Q: Which RFC added 416 (1999)? A: RFC 2616.
- Q: Why is TRACE disabled everywhere? A: Cross-Site Tracing, 2003.

**Lab.** `talk.py 8011 --req "GET /big.txt HTTP/1.1" "Host: site-a.local" "Range: bytes=-50" "Connection: close" ""`. Expected: `Content-Range: bytes 201950-201999/202000`.

### s05-m05-rfcs-and-smuggling

- **Title:** The RFC road, and the day liberal parsing lost. **Minutes:** 25.
- **Big idea:** The HTTP spec kept bending to deployed clients, and one "be liberal" framing rule became request smuggling.
- **Covers:** S05-C01, S05-C02, S05-C26, S05-C84, S05-C85, S05-C86, S05-C87, S05-C88, S05-C89, S05-C90, S05-C91, S05-C92, S05-C93, S05-C94, S05-C95, S05-C96, S05-C97, S05-C98, S05-C99, S05-C100, S05-C101, S05-C102, S05-C103, S05-C104, S05-C105, S05-C106, S05-C107, S05-C108, S05-C109, S05-C110, S05-C228, S05-C229, S05-C235.
- **Prereqs:** s05-m04-range-chunked-extras, s04-m07-reverse-proxy, s01-m09-encodings, s02-m07-smtp-mime.
- **Threads:** T-deployed-reality, T-framing, T-alphabets.

**Pretest.**
1. A request has both Content-Length and Transfer-Encoding. What did RFC 2616 say? *Answer: use Transfer-Encoding and ignore Content-Length.*
2. What must a server do after it answers such a request, under RFC 9112? *Answer: close the connection.*
3. Why does 307 exist when 302 already existed? *Answer: browsers changed a redirected POST into a GET.*

**Rung 1, the picture.** Two teachers check one list of names. Teacher A counts six names from the top. Teacher B reads until the word END. A trick student writes END early and adds one more name after it. Teacher A sees one list. Teacher B sees a second list with one extra name, and lets that name in. *Where it breaks:* a real parser meets the length and the delimiter in the same message, not on two separate lists. And a count that stops in the middle of a name leaves a torn name for the next reader, so the count must cover the whole hidden list to hide it.

**Segment plan.** (1) The RFC road and redirects: 302, 307, 504 (S05-C84 to S05-C90). (2) Smuggling (S05-C91 to S05-C99). (3) One document became six, and semantics against wire format (S05-C100 to S05-C102, S05-C108 to S05-C110). (4) Alphabets: tokens, JWT, base64url (S05-C103 to S05-C107). Segment 1 picture: a dictionary that adds a new word because everyone already uses an old word wrongly. *Where it breaks:* a dictionary can call the old use wrong and move on. An RFC cannot change deployed clients, so RFC 2616 wrote down what clients do with 302 and added 307 for the old meaning. Segment 4 picture: a parcel label must pass five post offices, and each accepts a different set of characters, so you write the label in the small alphabet that all five accept. *Where it breaks:* base64url is a byte mapping, not a translation, and it makes the data about a third longer.

**Rung 2, how it works.**
1. The attacker sends one POST with both `Content-Length` and `Transfer-Encoding: chunked`.
2. A front proxy that trusts Content-Length forwards the body it counted. If that count covers the whole GET /admin request, the proxy sees one request.
3. The origin trusts chunked. The body ends at the `0` chunk.
4. The origin reads the leftover bytes, `GET /admin ...`, as a second request.
5. The origin sends two responses. The proxy expected one, so the spare one waits for the next client.
6. Other segments, as steps. Redirects: 301 and 302 let clients change POST to GET, 303 says use GET, 307 keeps the method. RFC split: RFC 9110 and 9111 give meaning and caching, and 9112, 9113 and 9114 give bytes. Alphabets: find the characters that every layer accepts, then encode raw bytes into that set.

**Rung 3, the real thing.** `03-limits/framing.py` lines 29-36 hold the stream. Under Content-Length 6 the body is `0\r\n\r\nG`, exactly 6 bytes. After the headers the stream holds 67 bytes: the 5-byte end chunk and a 62-byte GET /admin request. The lab server trusts chunked. It answers the POST with 200, then answers `GET /admin` with 404, and it does not close (slide 21, confirmed on the copy). RFC 2616 §4.4 said "the latter MUST be ignored". RFC 9112 §6.1 now says a server "MAY reject" and "MUST close". RFC 9112 §11.2 names request smuggling. The RFC road: 1945 (1996), 2068 (1997), 2616 (1999), 7230-7235 (2014), 9110-9114 (2022). *Gated box, "open after your first calculator attempt" (slide 3):* `server11.py` `read_body()` checks chunked first (lines 271-280).

**Rung 4, exam depth.**
- *Postel in a chain.* Two programs can agree on a guess. Five hops give five parsers, and any pair can disagree (S05-C93). RFC 9413 (2023) now argues for active protocol maintenance over tolerance.
- *Why "close" is the fix.* After an ambiguous length, nobody knows where the next request starts. A new connection is the only known state.
- *Which length hides what.* In the `framing.py` stream, Content-Length 5 makes both parsers agree: both see GET /admin as request 2. Content-Length 6 smuggles a one-byte prefix: the Content-Length reader sees `ET /admin HTTP/1.1` as its next request line. Content-Length 67 hides the whole GET /admin from the Content-Length reader, which is the classic CL.TE shape. Slide 21 simplifies this (S05-C95, S05-C96).
- *Redirects and deployed reality.* 301 and 302 let clients change POST to GET. 303 says "use GET". 307 keeps the method (S05-C89), and 308 is the permanent form (RFC 7538). Like the dropped 2-connection rule and 418, 307 shows a spec that follows shipped code (S05-C229).
- *Semantics against wire format.* RFC 9110 and 9111 hold meaning and caching for all versions. 9112, 9113 and 9114 hold only bytes (S05-C108, S05-C109). A new encoding does not touch GET (S05-C228).
- *Alphabets.* A token cannot hold braces, commas, slashes or quotes (S05-C103). A JWT must also cross URLs, cookies and JSON. The shared alphabet is about 64 characters, so base64url (S05-C105, S05-C107).
- *Exam prompts.* (1) A CDN trusts Content-Length and the origin trusts chunked. Which Content-Length hides the whole GET /admin of `framing.py` from the CDN? *Model answer: 67, the 5-byte end chunk plus the 62-byte request. With 6, the CDN still parses a torn second request.* (2) Why did RFC 2616 add 307 instead of fixing 302? *Model answer: deployed browsers already turned a redirected POST into a GET. A new number was cheaper than changing every client.*

**Misconceptions.**
- S05-M16: "Pick the standard length header and continue, and the request is safe." Wrong. The next box in the chain can pick the other one. Distractor in check 1.
- S05-M17: "A browser keeps the POST method on a 302." Wrong. Browsers change it to GET. Distractor in check 2.
- S05-M18: "504 Gateway Timeout arrived in RFC 2616." Wrong. RFC 2068 has it. Distractor in check 3.
- S05-M19: "HTTP/2 and HTTP/3 changed what GET and 404 mean." Wrong. All three versions share RFC 9110. Distractor in check 4.

**Diagrams.** (1) Step-by-step: one byte stream, cut two ways. Actors: attacker, CDN, origin, next user. (2) Static: the RFC family tree, with shared semantics in one box and the three wire formats below.

**Interactives.** (1) *Request-smuggling two-parser viewer* (P1). Inputs: the Content-Length value, Transfer-Encoding on or off, the body bytes. The learner sees where each parser cuts the stream, and the request count for each. The learner discovers three cases: Content-Length 5 gives the same split in both parsers, 6 splits the stream at a different byte so each parser sees a different second request, and 67 hides the whole GET /admin from the Content-Length parser. (2) *Status code timeline* (P2). Input: a status code. Output: the RFC and year that added it.

**Predict, observe, explain.** Command: `python3 03-limits/framing.py --port 8011`. Predict: how many responses come back? Observe: 2, a 200 and a 404. Captured output: slide 21.

- **Worked example.** Content-Length 6: the bytes are `0`, CR, LF, CR, LF, `G`. That is 6. The Content-Length reader then sees `ET /admin HTTP/1.1` as the next request line.
- **Faded example.** Content-Length 5: the body is ____. After it, both readers see ____. *(`0\r\n\r\n`. `GET /admin` as request 2, so they agree and nothing hides.)*
- **Your turn.** Content-Length 11. What is the body, and how does the next request line start? *(`0\r\n\r\nGET /a`. It starts with `dmin HTTP/1.1`.)*

**Checks.**
1. `mcq`: current advice for a request with both length headers? Answer: reject it, or use chunked and close after the response. Distractor: use Content-Length and keep the connection (S05-M16). Distractor: use chunked and keep the connection open (S05-M16). Feedback: any mismatch in the chain is a smuggling path, so the connection must end.
2. `mcq`: why did RFC 2616 add 307? Answer: browsers turned a 302 POST into a GET. Distractor: browsers kept the method on 302, and 307 changes it to GET (S05-M17). Distractor: 302 had become a permanent redirect (S05-M17). Feedback: 302 became "Found" to match clients, and 307 keeps the method.
3. `mcq`: where did 504 first appear? Answer: RFC 2068. Distractor: RFC 2616 (S05-M18). Distractor: RFC 1945 (S05-M18). Feedback: RFC 1945 has no 504, and the whole 5xx family of RFC 2068 is from 1997.
4. `mcq`: what do RFC 9112, 9113 and 9114 define? Answer: wire formats only. Distractor: new meanings for methods and codes (S05-M19). Distractor: separate caching rules for each version (S05-M19). Feedback: RFC 9110 and 9111 hold meaning and caching for all three versions.

**Review cards.**
- Q: What did RFC 2616 §4.4 say about both length headers? A: Ignore Content-Length.
- Q: What does RFC 9112 require after a request with both? A: Reject it or use chunked, then close the connection.
- Q: Which RFCs hold the HTTP semantics and caching shared by all versions? A: RFC 9110 and RFC 9111.
- Q: Why is a JWT base64url and not raw text? A: It must cross header, URL, cookie and JSON alphabets, and the signature is raw bytes.
- Q: How many assigned status codes does IANA list (2025-09-15)? A: 62.

**Lab.** `python3 03-limits/framing.py --port 8011 | tail -6`. Expected: `HTTP/1.1 200 OK`, then `HTTP/1.1 404 Not Found`.

### s05-m06-what-it-cost

- **Title:** What HTTP/1.1 cost: queues, repeats and a 40 ms stall. **Minutes:** 25.
- **Big idea:** Keep-alive removed the handshake bill and exposed four new costs: a queue, extra connections, repeated headers and a Nagle stall.
- **Covers:** S05-C43, S05-C78, S05-C79, S05-C80, S05-C81, S05-C82, S05-C83, S05-C111, S05-C112, S05-C113, S05-C114, S05-C115, S05-C116, S05-C117, S05-C118, S05-C119, S05-C120, S05-C121, S05-C122, S05-C123, S05-C124, S05-C125, S05-C126, S05-C127, S05-C128, S05-C129, S05-C130, S05-C230, S05-C232, S05-C240.
- **Prereqs:** s05-m02-keepalive-host, s02-m04-tcp-lifecycle, s02-m05-congestion-bbr, s02-m02-ss7, s03-m05-fastcgi-servlets, s03-m07-limits.
- **Threads:** T-round-trip-tax, T-fix-causes-next, T-law-or-habit, T-honest-benchmarks, T-deployed-reality.

**Pretest.**
1. Six pipelined requests, the first one slow. When do the five fast answers arrive? *Answer: after the slow one.*
2. 80 requests repeat the same headers. About what share of the header bytes is new? *Answer: about 2.5%.*
3. Can keep-alive be slower than a new connection per request? *Answer: yes. Nagle plus delayed ACK can add about 40 ms each.*

**Rung 1, the picture.** A lunch counter hands out trays strictly in the order of the order slips. The trays have no names. Your sandwich is ready, but the soup ordered before you takes two minutes, so you wait. *Where it breaks:* a person at a counter can shout a name. An HTTP/1.1 response has no name field at all. Position is the only name.

**Segment plan.** (1) The queue (S05-C111 to S05-C115). (2) Connection count: 2, then 6, then 18 (S05-C78 to S05-C83). (3) The header tax (S05-C116 to S05-C119). (4) Nagle and delayed ACK (S05-C120 to S05-C126, S05-C240). Segment 3 picture: every letter you post repeats your full address and a long signature, and only one line changes. *Where it breaks:* HTTP/1.1 has no "same as last time" mark at all. HPACK adds one in module 8. Segment 4 picture: two polite people at a door. One waits for a nod before passing the second parcel. The other waits to nod until it has something to say. *Where it breaks:* the waits are fixed timers (about 40 ms on Linux), and close() pushes the parcel out at once.

**Rung 2, how it works.**
1. The client sends six requests at t = 0 on one connection.
2. The server works on request 1, which takes 2 s.
3. Responses 2 to 6 are ready, but they carry no request id.
4. The client matches responses by position, so the server must send them in order.
5. The five fast responses leave after 2 s.
6. Other segments, as steps. Header tax: count the bytes that repeat on every request, then the bytes that change. Nagle: the server writes the head, the head leaves, the body waits for an ACK, the client delays that ACK, and about 40 ms pass.

**Rung 3, the real thing.** `03-limits/hol.py` `pipelined()` (lines 42-53) sends all six requests in one write (line 47) and gives the times on slide 25. `fetch_page.py` runs through `tools/laggy.py`, which adds 150 ms of RTT on loopback (slide 18, S05-C232). Its "round trips" column is a count from the script model, not a capture. `headers.py` builds one realistic Chrome request (lines 18-37) and changes only the path for 80 requests. `nagle.py` against the current lab server shows no stall: 0.4 ms per request on the copy. A copy with two writes gave 1.0 ms, then 41.4, 42.0, 40.9 and 41.1 ms, total 166.3 ms (Linux 7.1, loopback, 2026-09-13). *Gated box, "open after your first calculator attempt" (slide 3):* `server11.py` writes each response in one call (lines 87-93). Line 286 tries to set TCP_NODELAY, but it has no effect: the attribute belongs on the handler class (`H11`), not on the `Server` class (section 6). A two-write copy that keeps line 286 still stalls about 41 ms per request.

**Rung 4, exam depth.**
- *The rule that became a habit.* RFC 2616 said 2 connections. Browsers shipped 6, and sharding gave 18. RFC 7230 §6.4 dropped the number (S05-C78, S05-C81, S05-C82).
- *Identity is the missing field.* TCP has ports, TCAP has transaction ids, FastCGI has requestId. HTTP/1.1 has nothing, so it must keep order (S05-C113, S05-C115).
- *The header tax.* Content-Encoding compresses the body only, and gzip took the body to 2.85%. The repeated 97.5% of header bytes sits in the upload direction (S05-C118, S05-C119). Text was not the problem. Text with no lengths and no ids was (S05-C130).
- *Nagle meets delayed ACK.* The head goes out at once. Nagle holds the small body until an ACK. The client has nothing to send, so it holds the ACK for about 40 ms (S05-C122). close() flushes, so only persistent connections show it (S05-C125). The fix is one write and TCP_NODELAY (S05-C124, S05-C126). The instructor hit this bug himself (S05-C240).
- *Exam prompts.* (1) Six requests on one persistent connection, two writes per response, Linux delayed ACK about 40 ms. Slide 28 says the stall hits "every request but the 1st". How much extra time do requests 2 to 6 add? *Model answer: 5 × 40 = 200 ms. Slide 28 measured four stalled requests out of five, 174.3 ms in total.* (2) Why does the 97.5% header repeat hurt more on upload than on download? *Model answer: upload is the direction with the least capacity, and the page spends it first, while the user waits (S05-C119).*

**Misconceptions.**
- S05-M20: "Pipelining removed head-of-line blocking." Wrong. Pipelining created it. Distractor in check 2.
- S05-M21: "HTTP/1.1 is slow mainly because it is text." Wrong. Missing lengths and ids cost more. Distractor in checks 2 and 4.
- S05-M22: "Keep-alive can never be slower than a new connection." Wrong. Two small writes hit Nagle and delayed ACK. Distractor in check 5.
- S05-M23: "More parallel connections always win." Wrong. Each one pays a handshake and its own slow start. Distractor in checks 1 and 4.
- S05-M52: "Most header bytes change from request to request." Wrong. In `headers.py`, 97.5% repeat. Distractor in check 3.

**Diagrams.** (1) Step-by-step: a pipelined queue with a slow head. Actors: client, server, six responses. (2) Step-by-step: the Nagle timeline. Server writes head, server writes body (held), client ACK timer runs 40 ms, ACK, body. Actors: server kernel, client kernel.

**Interactives.** (1) *Page-load waterfall simulator* (P1), with "parallel N", "pipelined" and "slow first asset" added. The learner discovers that pipelining wins on round trips and loses to one slow response. (2) *Nagle timeline stepper* (P2). Inputs: one write or two, TCP_NODELAY on or off, delayed ACK timer. The learner sees the 40 ms gap appear and vanish.

**Predict, observe, explain.** Command: `python3 03-limits/hol.py --port 8011 --slow 2`. Predict: in pipelined mode, when does /style.css arrive? Observe: about 2004 ms. Captured output: slide 25.

- **Worked example.** headers.py: the sample request is 805 bytes. The 80 generated paths are 20 bytes each, one byte shorter than the sample path, so each request is 804 bytes. Total 80 × 804 = 64,320. New data 80 × 20 = 1,600, which is 2.49%. Repeats 62,720, which is 97.51%. Upload: 64,320 × 8 = 514,560 bits, so 0.51 s at 1 Mbit.
- **Faded example.** 100 requests of 700 bytes, 25 bytes new in each. Total: ____. New share: ____. Upload at 1 Mbit: ____. *(70,000 bytes. 3.6%. 0.56 s.)*
- **Your turn.** 50 requests of 900 bytes each, 30 bytes new in each. Repeat share, and upload time at 1 Mbit? *(45,000 bytes in all, 1,500 new, so 96.7% repeats. 45,000 × 8 = 360,000 bits, 0.36 s.)*

**Checks.**
1. `order`: rank by measured wall time at 150 ms RTT, slowest first: close, keepalive, parallel2, pipelined. Distractor order: pipelined slower than parallel2 (S05-M23). Feedback: pipelined needs only 2 round trips.
2. `mcq`: why did no browser turn pipelining on? Answer: head-of-line blocking behind a slow response. Distractor: pipelining removes head-of-line blocking (S05-M20). Distractor: text headers were too large to send in one batch (S05-M21). Feedback: one slow response held the rest, 2003 ms against 3 ms.
3. `numeric`: 64,320 header bytes over 80 requests, 1,600 of them new. What percent repeat? Answer: 97.5. Distractor: 2.5 (S05-M52: most header bytes change per request). Feedback: only the paths change, 62,720 bytes repeat.
4. `mcq`: what made HTTP/1.1 costly on the wire? Answer: text with no lengths and no request ids. Distractor: text itself, since text is large (S05-M21). Distractor: the RFC limit of too few connections (S05-M23). Feedback: gzip took the body to 2.85%, and more connections each pay a handshake.
5. `predict`: persistent connection, `write(head); write(body)`, Nagle on, Linux loopback. Request 2 latency? Answer: about 40 ms. Distractor: under 1 ms, since keep-alive is always faster (S05-M22). Distractor: about 500 ms, the RFC 1122 upper limit (S05-M22). Feedback: Nagle holds the body, and Linux delays the ACK about 40 ms.

**Review cards.**
- Q: Why must HTTP/1.1 pipelined responses keep request order? A: A response carries no request id, so position is the id.
- Q: RFC 2616 allowed 2 connections per origin. How many did browsers ship by about 2008? A: 6.
- Q: What share of header bytes repeated across 80 requests in headers.py? A: 97.5%.
- Q: Which two TCP rules together make the write-write-read stall? A: Nagle and delayed ACK.
- Q: What is the fix for the write-write-read stall? A: One write per response, plus TCP_NODELAY.

**Lab.** In the scratch copy with `tools/lab.sh up`: `python3 03-limits/fetch_page.py --port 9111 --rtt 150`. Expected: pipelined near 300 ms, close near 1,370 ms. The copy run gave 303.7 and 1404.2 ms.

### s05-m07-http2-frames

- **Title:** HTTP/2 frames: the same words, with lengths and ids. **Minutes:** 22.
- **Big idea:** HTTP/2 keeps every HTTP meaning and writes it as binary frames with a 9-byte header that holds a length and a stream id.
- **Covers:** S05-C99, S05-C131, S05-C132, S05-C133, S05-C134, S05-C135, S05-C136, S05-C137, S05-C138, S05-C139, S05-C140, S05-C141, S05-C142, S05-C143, S05-C144, S05-C145, S05-C146, S05-C147, S05-C148, S05-C149, S05-C150, S05-C151, S05-C152, S05-C153.
- **Prereqs:** s05-m06-what-it-cost, s01-m05-byte-order-dns, s01-m08-framing, s01-m07-see-the-bytes-tls.
- **Threads:** T-framing, T-skip-unknown, T-deployed-reality, T-round-trip-tax.

**Pretest.**
1. Did HTTP/2 change the meaning of HTTP or the wire format? *Answer: the wire format.*
2. How many bytes is an HTTP/2 frame header? *Answer: 9.*

**Rung 1, the picture.** HTTP/1.1 writes everything on one long scroll that you read in order. HTTP/2 cuts it into envelopes. Every envelope label says how thick it is, what kind it is, a few tick boxes, and which conversation it belongs to. *Where it breaks:* all envelopes still ride in one mail bag, one TCP connection. If the bag gets stuck, every conversation waits. Module 9 shows that.

**Rung 2, how it works.**
1. Client and server agree on h2: ALPN over TLS, or prior knowledge in cleartext.
2. The client sends the 24-byte preface and a SETTINGS frame. The server sends its SETTINGS, and each side acknowledges.
3. Each request opens a new odd stream with a HEADERS frame.
4. The body travels in DATA frames. The END_STREAM flag marks the last one.
5. A receiver reads 9 bytes, gets the length, reads the payload, and repeats.

**Rung 3, the real thing.**
```
+-----------------------------------------------+
|                 Length (24)                   |
+---------------+---------------+---------------+
|   Type (8)    |   Flags (8)   |
+-+-------------+---------------+-------------------------------+
|R|                 Stream Identifier (31)                      |
+=+=============================================================+
```
`04-http2/h2_client.py` `frame()` (lines 56-60) packs a 32-bit big-endian length and drops its first byte. It masks the stream id with `0x7FFFFFFF`. `read_frame()` (lines 63-70) reads 9 bytes first. The preface bytes are `50 52 49 20 2a 20 48 54 54 50 2f 32 2e 30 0d 0a 0d 0a 53 4d 0d 0a 0d 0a` (RFC 9113 §3.4, slide 31). The capture on slide 32 shows SETTINGS, HEADERS, DATA 263 and an empty DATA with END_STREAM. The DATA length matches `Content-Length: 263` on slide 6. The frame table is slide 33. The defaults are RFC 9113 §6.5.2.

**Rung 4, exam depth.**
- *Why 24 / 8 / 8 / 31* (our analysis, not instructor or RFC text). Length allows 16,777,215 bytes, but the default MAX_FRAME_SIZE is 16,384, so a large body splits and other streams slot in. Type gives 256 values for 10 types. Flags give 8 booleans per type. The stream id gives 2^31 − 1, and client ids are odd, so 2^30 client streams.
- *Fixed offsets end smuggling, inside one hop.* Inside one HTTP/2 connection, the frame length has no second reading (S05-C99). A chain that translates to HTTP/1.1 must still check that content-length equals the DATA bytes and that field bytes are valid, or smuggling returns (RFC 9113 §8.1.1, §8.2.1, beyond the slides).
- *Room for version 2.* RFC 9113 §4.1 says endpoints MUST ignore and discard unknown frame types. The length makes the skip possible.
- *Cancel one, drain all.* RST_STREAM stops one stream and keeps the rest (S05-C149). GOAWAY names the last stream the sender will process, so clients retry only the later ones (S05-C150).
- *Ship, then standardise.* SPDY ran in Chrome and at Google for years before RFC 7540 (S05-C131 to S05-C134). RFC 9113 later deprecated the h2c Upgrade, and browsers speak HTTP/2 over TLS only (S05-C141).
- *Exam prompts.* (1) The HTTP/2 frame has no version field. How can a new feature or HTTP/3 arrive? *Model answer: ALPN picks the protocol (h2 or h3) before the first frame, and a receiver skips a frame type it does not know by its length (RFC 9113 §4.1).* (2) Why are client stream ids odd and server ids even? *Model answer: both sides can open streams at the same time with no coordination and no collision.*

**Misconceptions.**
- S05-M24: "The Length field counts the 9 header bytes too." Wrong. It counts the payload only. Distractor in check 2.
- S05-M25: "HTTP/2 needs an Upgrade round trip before frames flow." Wrong. ALPN rides in the ClientHello. Distractor in check 4.
- S05-M26: "HTTP/2 stream ids are 32 bits, and clients use even ids." Wrong. 31 bits, and clients use odd ids. Distractor in check 3.
- S05-M27: "An endpoint must reject a frame type it does not know." Wrong. It discards it. Distractor in check 5.

**Diagrams.** (1) Static: the 9-byte header with a bit ruler and field names. (2) Step-by-step: connection start. Preface, SETTINGS both ways, SETTINGS ACK, HEADERS on stream 1, DATA, END_STREAM. Actors: client, server.

**Interactives.** *HTTP/2 frame header decoder* (P1). Input: 9 hex bytes, typed or from a generator. The learner sees length, type name, flag names for that type, R and stream id. Warnings show a length over MAX_FRAME_SIZE or a DATA frame on stream 0. The learner discovers big-endian 24-bit arithmetic.

**Predict, observe, explain.** Command: `python3 04-http2/h2_client.py --port 8020 --path /`. Predict: the length field of the first DATA frame. Observe: `00 01 07`, 263. Captured output: slide 32.

- **Worked example.** Decode `00 01 07 00 00 00 00 00 01`. Length `00 01 07` = 1 × 256 + 7 = 263. Type `00` = DATA. Flags `00` = none. R = 0, stream `00 00 00 01` = 1.
- **Faded example.** Decode `00 00 4d 01 04 00 00 00 01`. Length: ____. Type: ____. Flags 0x04: ____. Stream: ____. *(77. HEADERS. END_HEADERS. 1.)*
- **Your turn.** Decode `00 00 08 07 00 00 00 00 00`. *(GOAWAY, length 8, stream 0. The payload holds a last stream id and an error code, 4 bytes each.)*

**Checks.**
1. `recall`: list the frame header fields with bit widths. Answer: Length 24, Type 8, Flags 8, R 1, Stream Identifier 31. Distractor: a 32-bit stream id with no R bit (S05-M26). Feedback: 24 + 8 + 8 + 1 + 31 = 72 bits, 9 bytes.
2. `numeric`: a frame header says length `00 00 2a`. How many bytes follow the header? Answer: 42. Distractor: 33 (S05-M24). Feedback: Length excludes the 9 header bytes.
3. `mcq`: which stream ids may a client open? Answer: odd ids above all earlier ones. Distractor: even ids (S05-M26). Distractor: any free id, even one reused after its stream closed (S05-M26). Feedback: RFC 9113 §5.1.1, odd and rising, never reused.
4. `mcq`: how does a browser get HTTP/2 over TLS? Answer: ALPN in the handshake. Distractor: an Upgrade: h2c request first (S05-M25). Distractor: a PRI request that the server answers with 101 (S05-M25). Feedback: the client offers h2 in the ClientHello, so no extra round trip.
5. `mcq`: a frame of type 0xfa arrives. Answer: skip its payload by the length and continue. Distractor: close the connection with an error (S05-M27). Distractor: send RST_STREAM on that stream (S05-M27). Feedback: RFC 9113 §4.1 says ignore and discard unknown types.

**Review cards.**
- Q: How long is the HTTP/2 client connection preface? A: 24 bytes.
- Q: How many bits wide is the HTTP/2 stream identifier? A: 31.
- Q: What is the default SETTINGS_MAX_FRAME_SIZE? A: 16,384 bytes.
- Q: Which frame cancels one stream without closing the connection? A: RST_STREAM.
- Q: Which Chrome version removed SPDY (May 2016)? A: Chrome 51.

**Lab.** In a virtual environment inside the scratch copy, run `./setup.sh` first. It installs `h2`, `hpack` and `aioquic` and makes the `certs` directory. Then run `tools/lab.sh h2`. Run `python3 04-http2/h2_client.py --port 8443 --tls --path /style.css`. Expected: `ALPN negotiated: 'h2'`.

### s05-m08-hpack-crime

- **Title:** HPACK: numbers for headers, and why not gzip. **Minutes:** 22.
- **Big idea:** HPACK indexes repeated headers in a static table and a per-connection table, because adaptive compression leaks secrets.
- **Covers:** S05-C154, S05-C155, S05-C156, S05-C157, S05-C158, S05-C159, S05-C160, S05-C161, S05-C162, S05-C163, S05-C166.
- **Prereqs:** s05-m07-http2-frames, s05-m06-what-it-cost, s01-m09-encodings.
- **Threads:** T-fix-causes-next, T-setup-off-path.

**Pretest.**
1. How many bytes does `:method: GET` cost in HPACK? *Answer: 1, the byte 0x82.*
2. Why is the second identical request so much smaller? *Answer: the fields are now in the dynamic table.*
3. Why did HTTP/2 not simply gzip headers? *Answer: CRIME. The compressed size leaks a secret.*

**Rung 1, the picture.** Two friends share a code book. Page 1 comes printed: "2 means the usual greeting". Page 2 they write as they talk. The first time you say your long address, both of you write it down as number 62. Next time you just say "62". *Where it breaks:* each new entry takes number 62 and pushes older ones up one, so your address is 62 only until the next entry. Both friends must add entries in exactly the same order. A lost or reordered note breaks the book (module 11). And a spy who can measure message length learns things if your secret shares a compressor with his words.

**Rung 2, how it works.**
1. For each header, look for an exact match: static table first, then dynamic table.
2. Exact match: send the index with the top bit set, one byte for indexes up to 126.
3. Name match only: send the name index and the value, and add the pair to the dynamic table.
4. No match: send name and value as strings, and add the pair.
5. Each string uses Huffman only when that makes it shorter.
6. The decoder makes the same inserts, so both tables stay equal.

**Rung 3, the real thing.** `04-http2/hpack_mini.py` searches static then dynamic (lines 140-154) and encodes (lines 167-184). Prefix integers are lines 34-44. Table size counts name + value + 32 bytes (line 130). The self-test header set, run on the copy, gives a 79-byte first block starting `82 87 84 41 8c`, and the 6-byte second block `82 87 84 c0 bf be`. The dynamic table lists the newest entry first: user-agent 62, cookie 63, :authority 64. `_tables.py` has 61 static entries and gives e 5 bits, X 8 bits. RFC 7541 §6 defines the byte patterns.

**Rung 4, exam depth.**
- *Indexed, not compressed.* On the first send, Huffman saved 26 of the 95 bytes. Indexes and dropped separators saved the other 69 (S05-C154). A 300-byte cookie costs 300 bytes once, then 1 to 2 bytes (S05-C155).
- *One connection wins.* The table lives per connection. Six sharded connections pay for six tables (S05-C159).
- *CRIME.* DEFLATE matches repeated substrings. If an attacker guess repeats part of the cookie, the output gets one byte shorter (S05-C160). HPACK matches whole fields, so only a full-value guess counts. RFC 7541 §7.1.1 says HPACK mitigates this but does not fully prevent it. Never-indexed literals protect short secrets (S05-C162). A compressed body that mixes user input with a key rebuilds CRIME (S05-C163).
- *Two different 97s.* 97.5% is the repeat share of 80 requests (module 6). 97% is how much smaller one repeated header set got. Do not mix them.
- *Order is everything.* The README second bug: two writers sent frames in a different order than the encoder built them. The client table diverged (S05-C171, S05-C238).
- *Exam prompts.* (1) An attacker can add text next to a cookie in an HTTP/2 request. What can it learn, and what can the sender do? *Model answer: only a guess of the whole value changes the size, because the table matches whole fields. The sender can mark the cookie never indexed (RFC 7541 §7.1).* (2) Why does the second identical header set cost 6 bytes? *Model answer: every field is now a table index below 127, one byte each.*

**Misconceptions.**
- S05-M28: "HPACK is gzip applied to headers." Wrong. It indexes, and its Huffman code never adapts. Distractor in check 1.
- S05-M29: "A CRIME attacker must break the encryption." Wrong. The attacker only watches sizes. Distractor in check 2.
- S05-M30: "All connections to a server share one dynamic table." Wrong. One table per connection. Distractor in check 3.
- S05-M31: "HPACK makes every header set 97% smaller." Wrong. The first set got 55% smaller. Distractor in check 4.

**Diagrams.** (1) Step-by-step: the encoder walks six fields, with the static table and a growing dynamic stack (newest at 62). (2) Static: the CRIME size oracle. Three guesses, lengths 412, 412, 411. The numbers are illustrative (our reading, the slide does not label them).

**Interactives.** (1) *HPACK encoder with a dynamic table view* (P1). Inputs: an editable header list, "send again", table size. The learner sees the bytes for each field, the representation type, the table, and evictions. The learner discovers 79 bytes, then 6. (2) *HPACK integer generator* (P2). A value and a prefix width in, bytes out, with a reveal button.

**Predict, observe, explain.** Command: `python3 04-http2/hpack_mini.py`. It needs no install. Predict: the size of the second encoding. Observe: 6 bytes. Captured output: slide 34, and the copy run matched.

- **Worked example.** Decode `82 87 84 c0 bf be`. Each byte has the top bit set, so each is a full index. 0x82 → 2, `:method: GET`. 0x87 → 7, `:scheme: https`. 0x84 → 4, `:path: /`. 0xc0 → 64, `:authority`. 0xbf → 63, `cookie`. 0xbe → 62, `user-agent`.
- **Faded example.** `41 8c` then 12 bytes. 0x41 is `01` then 000001: a literal that joins the table, name index ____. 0x8c is H bit 1, length ____. *(1, :authority. 12 Huffman bytes.)*
- **Your turn.** Decode the field starts `60 9c` and `7a 9e`. How many bytes does each field take, and do all the fields add up to the 79-byte block? *(0x60: name index 32, cookie, then 28 Huffman bytes, 30 bytes in all. 0x7a: name index 58, user-agent, then 30 Huffman bytes, 32 in all. 3 + 14 + 30 + 32 = 79.)*

**Checks.**
1. `mcq`: how does HPACK shrink `:method: GET`? Answer: a static table index, one byte. Distractor: gzip over the header text (S05-M28). Distractor: a Huffman code for the letters G, E and T (S05-M28). Distractor: a dynamic entry built by an earlier request (S05-M30). Feedback: static index 2 holds name and value, so 0x82 on every connection.
2. `mcq`: what does a CRIME attacker need? Answer: the compressed size and a way to add text next to the secret. Distractor: the session key (S05-M29). Distractor: the compressed bytes in clear (S05-M29). Feedback: size alone leaks, one byte shorter means a right guess.
3. `mcq`: a browser opens three HTTP/2 connections to one host. How many dynamic tables? Answer: three, one per connection. Distractor: one shared table (S05-M30). Distractor: one per stream (S05-M30). Feedback: the table lives per connection, which is why sharding hurts.
4. `numeric`: 174 bytes of text became 79 bytes on first send. Percent smaller, to the nearest whole number? Answer: 55. Distractor: 97 (S05-M31). Feedback: 79 / 174 is 45.4%, so 54.6% smaller. The 97% is the second send.

**Review cards.**
- Q: How many entries does the HPACK static table hold? A: 61.
- Q: The `hpack_mini.py` header set is 174 bytes of text and 79 bytes on the first send. What does the second send cost? A: 6 bytes.
- Q: Which 2012 attack ruled out gzip for HTTP headers? A: CRIME.
- Q: Why does HPACK resist CRIME? A: Its Huffman code never adapts, and table matches need the whole field.
- Q: Why does domain sharding hurt HTTP/2? A: Each connection builds its own header table.

**Lab.** `python3 04-http2/hpack_mini.py`. Expected: every `[ok]` line, then 174, 79 and 6. Without the pypi package, the last check prints `[skip]`.

### s05-m09-http2-multiplexing

- **Title:** HTTP/2 multiplexing: what it fixed, and the stall it could not. **Minutes:** 25.
- **Big idea:** Stream ids let responses finish in any order, but only if the server works in parallel, and TCP still stalls every stream behind one lost packet.
- **Covers:** S05-C164, S05-C165, S05-C167, S05-C168, S05-C169, S05-C170, S05-C171, S05-C172, S05-C173, S05-C174, S05-C175, S05-C176, S05-C177, S05-C178, S05-C179, S05-C180, S05-C226, S05-C234, S05-C238, S05-C239.
- **Prereqs:** s05-m07-http2-frames, s05-m06-what-it-cost, s03-m01-threads-and-fork, s02-m04-tcp-lifecycle.
- **Threads:** T-fix-causes-next, T-deployed-reality.

**Pretest.**
1. Six requests on one HTTP/2 connection, the first slow. When does /style.css finish? *Answer: in a few milliseconds.*
2. The server handles each request inside its read loop. What happens? *Answer: everything waits for the slow one again.*
3. One TCP segment is lost under HTTP/2. Which streams wait? *Answer: every stream with bytes after the gap.*

**Rung 1, the picture.** One road, and every car has a number plate. Cars pass each other, so a slow truck no longer blocks the road. But the road ends at one gate that lets cars out strictly in the order they entered. If one car breaks down at the gate, every car behind it waits, even cars from other families. *Where it breaks:* in TCP the later cars already arrived. They sit in the kernel buffer. The gate holds them back to keep the order promise.

**Rung 2, how it works.**
1. The client sends six HEADERS frames on streams 1, 3, 5, 7, 9 and 11.
2. The server starts one worker for each stream.
3. Fast workers send HEADERS and DATA at once. The slow worker sends later.
4. The client sorts frames by stream id, so each response finishes on its own.
5. If TCP loses a segment, the kernel holds every later byte until the retransmit, so every stream with bytes after the hole waits.

**Rung 3, the real thing.** `04-http2/h2_server.py` lines 76-92 start one thread per stream. The comment records the first version that served inline and gave the HTTP/1.1 numbers (slide 37). Lines 44-63 and 109-113 hold one lock and queue bytes to a single writer thread. That keeps HPACK order equal to wire order. `send()` splits DATA by flow window and frame size (lines 130-146), so big.txt leaves as 13 DATA frames. `tools/stall_tcp.py` delays, and does not drop (lines 33-44). `run_all.sh` starts it with `--after 3000 --stall 300`. Captures: slide 36 (multiplex), slide 37 (bug), slide 39 (three stall runs). Push stays in RFC 9113 §8.4. The Chrome post on removing push gives 1.25% and 0.7%.

**Rung 4, exam depth.**
- *Permission, not parallelism.* Framing allows interleaving. A server that serves streams one at a time is HTTP/1.1 again (S05-C168, S05-C169). The same shape appears in pools, coroutines and mutexes (S05-C170). Lock the write too, not only the encoder, so bytes reach the socket in encoder order (S05-C171).
- *Why push died.* The server cannot see the client cache, so it pushes files the client has, on the same window (S05-C174). 103 Early Hints sends a hint, and the client decides (S05-C175). The rule: the side with the knowledge informs, and the side with the state acts (S05-C234).
- *TCP head-of-line blocking.* TCP promises one ordered byte stream, so it cannot release stream 5 bytes past a hole in stream 3 bytes (S05-C176, S05-C178). The caught set changes each run (S05-C179).
- *The loss paradox.* SPDY gained 11.81% at 0% loss and 47.7% at 2%. At 2.5% the whitepaper shows 43.63%. The instructor reads this as: multiplexing helps most where TCP hurts most. But the same loss stalls every stream on the one connection, and QUIC exists to remove that tension (S05-C180).
- *Stream id arithmetic.* Odd client ids from 1 to 2,147,483,647 give 1,073,741,824 streams. Request k gets id 2k − 1. Ids never repeat, so a long connection must end and reopen.
- *Exam prompts.* (1) A server speaks HTTP/2 but serves streams on one worker thread. What do the six finish times look like? *Model answer: all near 2005 ms, the HTTP/1.1 numbers, as slide 37 shows.* (2) SPDY gained 47.7% at 2% loss. Why does the same loss still hurt every stream? *Model answer: the instructor reads the gain as "multiplexing helps most where TCP hurts most". But on one TCP connection, each loss stalls every stream with bytes behind the gap (RFC 9114 §1.1). QUIC removes that tension.*

**Misconceptions.**
- S05-M32: "HTTP/2 framing makes a server concurrent by itself." Wrong. The server must run streams in parallel. Distractor in check 1.
- S05-M33: "The RFC deprecated server push." Wrong. RFC 9113 keeps it. Browsers removed it. Distractor in check 3.
- S05-M34: "HTTP/2 removed every kind of head-of-line blocking." Wrong. TCP still has it. Distractor in checks 2 and 4.
- S05-M35: "TCP throws away bytes that arrive after a lost segment." Wrong. It buffers them and waits. Distractor in checks 2 and 4.

**Diagrams.** (1) Step-by-step: six streams interleave on one connection, with finish times. Actors: client, server threads. (2) Step-by-step: a TCP hole. Segments 1, 3, 4 and 5 sit in the receive buffer, segment 2 is missing, the application reads nothing. Actors: sender, receiver kernel, application.

**Interactives.** (1) *Page-load waterfall simulator* (P1), with "HTTP/2" and a loss slider added. The learner discovers that loss hurts every stream on one TCP connection. (2) *Head-of-line blocking visual* (P1), TCP half. Inputs: which segment to lose, which streams own bytes after it. The learner sees every stream behind the gap freeze. Module 11 adds the QUIC half. (3) *Push against Early Hints* (P2). Inputs: client cache contents, push or hint. Output: wasted bytes and the finish time of the needed file.

**Predict, observe, explain.** Command: `python3 04-http2/h2_client.py --port 8020 --multiplex --slow 2`. Predict: which stream finishes last, and when? Observe: stream 1, big.txt, at about 2005.9 ms. Captured output: slide 36. Then, through the stall proxy: `h2_client.py --port 9020 --multiplex --slow 0 -q`, three times. Predict: which files finish before the hole? Observe: a different set each run. Captured output: slide 39.

- **Worked example** (a model, not a capture). One TCP stream. A 300 ms hold at byte 3,000 starts at t = 5 ms. On the wire, style.css ends at byte 900, logo.png at 2,100, app.js at 3,400 and hero.png at 5,000. style.css and logo.png end before the hole: done near 5 ms. app.js and hero.png have bytes after it: done near 305 ms.
- **Faded example.** Same hold. icon.png ends at byte 2,990 and big.txt at byte 210,000. icon.png is done near ____. big.txt is done ____. *(5 ms. At 305 ms or later, because its bytes sit behind the hole.)*
- **Your turn.** Another run puts style.css at bytes 3,100 to 3,800 and every other file before byte 3,000. Which streams wait, and until when? *(Only style.css, near 305 ms. The caught set follows byte order, which is why slide 39's three runs differ.)*

**Checks.**
1. `mcq`: the first h2 server served each request inside the read loop. The result? Answer: all six streams finished at about 2005 ms. Distractor: the fast streams still finished in ms (S05-M32). Distractor: only stream 1 was slow, because frames carry ids (S05-M32). Feedback: framing gave permission, but the read loop slept 2 s, so nobody read streams 3 to 11.
2. `mcq`: under HTTP/2, one lost TCP segment delays which streams? Answer: every stream with bytes after the gap. Distractor: only the stream that owned the lost bytes (S05-M34). Distractor: no stream, because the later bytes go straight to the application (S05-M35). Feedback: TCP holds every later byte until the gap fills.
3. `mcq`: what is the status of server push in RFC 9113? Answer: still specified. Chrome 106 removed it. Distractor: deprecated by RFC 9113 (S05-M33). Distractor: removed from RFC 9113 and RFC 9114 (S05-M33). Feedback: RFC 9113 §8.4 and RFC 9114 §4.6 keep push, and browsers removed it.
4. `mcq`: bytes after a TCP hole arrive at the receiver. What happens to them? Answer: the kernel buffers them until the retransmit fills the hole. Distractor: TCP drops them, and the sender resends all (S05-M35). Distractor: the kernel hands them to the application at once (S05-M34). Feedback: they wait in the receive buffer, to keep the byte order.

**Review cards.**
- Q: What must an HTTP/2 server do to gain from multiplexing? A: Serve streams in parallel, and serialise its writes.
- Q: Which Chrome version removed HTTP/2 server push (September 2022)? A: Chrome 106.
- Q: What replaces server push? A: 103 Early Hints (RFC 8297).
- Q: Why does one lost TCP segment stall other HTTP/2 streams? A: TCP must deliver one ordered byte stream, so later bytes wait.
- Q: In Google's SPDY data, what was the speedup at 2% packet loss? A: 47.7%.

**Lab.** With `h2` installed and `tools/lab.sh h2` in the scratch copy: start `python3 tools/stall_tcp.py 9020 127.0.0.1 8020 --after 3000 --stall 300`. Run `python3 04-http2/h2_client.py --port 9020 --multiplex --slow 0 -q` three times. Expected: some files near 5 ms, the rest near 306 to 309 ms, and a different split each run.

### s05-m10-quic-handshakes

- **Title:** QUIC: why UDP, one handshake, and a connection with a name. **Minutes:** 25.
- **Big idea:** QUIC rebuilds the transport in user space on UDP, so it can merge the handshakes and name a connection by an ID instead of an address.
- **Covers:** S05-C181, S05-C182, S05-C183, S05-C184, S05-C185, S05-C186, S05-C187, S05-C188, S05-C189, S05-C190, S05-C191, S05-C192, S05-C193, S05-C194, S05-C195, S05-C196, S05-C197, S05-C198, S05-C199, S05-C203, S05-C204, S05-C205, S05-C206, S05-C207, S05-C208, S05-C236.
- **Prereqs:** s05-m09-http2-multiplexing, s02-m06-udp-quic, s02-m04-tcp-lifecycle, s01-m07-see-the-bytes-tls, s01-m10-rpc.
- **Threads:** T-round-trip-tax, T-setup-off-path, T-network-not-function, T-deployed-reality, T-name-in-message.

**Pretest.**
1. Why does QUIC run on UDP instead of its own IP protocol number? *Answer: middleboxes drop protocols they do not know.*
2. How many round trips does a new TCP plus TLS 1.3 plus HTTP/2 connection need before the response? *Answer: 3.*
3. Is a 0-RTT POST that charges a card safe? *Answer: no. An attacker can replay it.*

**Rung 1, the picture.** TCP plus TLS is a phone call where you first say "can you hear me?", then agree on a secret language, then ask. QUIC says hello and agrees on the language in one sentence. 0-RTT calls a friend who still knows your secret language, so the question goes in the first sentence. *Where it breaks:* someone can record that first sentence and play it again, and the friend may obey twice.
A second picture for connection IDs: TCP knows you by your home address, so the call drops when you move. QUIC knows you by a member card. *Where it breaks:* one card that never changes lets anyone follow you, so QUIC issues several cards and swaps them.

**Segment plan.** (1) Why UDP (S05-C181 to S05-C186). (2) The handshake ladder (S05-C187 to S05-C193). (3) 0-RTT and replay (S05-C194 to S05-C199). (4) Connection IDs and migration (S05-C203 to S05-C208). Segment 1 picture: toll gates ban every new kind of vehicle, so you build your new vehicle inside a delivery van that the gates already pass. *Where it breaks:* staff can open a real van. QUIC encrypts its cargo and most of its label, so the gates cannot learn to depend on what is inside.

**Rung 2, how it works.**
1. The client sends an Initial packet over UDP. It carries the TLS ClientHello in a CRYPTO frame.
2. The server replies with its TLS handshake data. That is round trip 1.
3. The client finishes the handshake and sends the GET in the same flight. The response ends round trip 2.
4. With a saved session ticket, the client sends the GET as 0-RTT data in flight 1, so about 1 round trip.
5. After an address change, the client sends with a new connection ID from the pool that the server gave it. The server maps it to the same connection and validates the new path (PATH_CHALLENGE and PATH_RESPONSE). Data continues.
6. Why UDP, as steps: a middlebox reads the IP protocol number, drops a number it does not know, and passes UDP. So QUIC sends UDP datagrams and encrypts almost all of its own header.

**Rung 3, the real thing.** RFC 9001 §3 carries TLS handshake messages directly in QUIC, with no TLS record layer. `05-http3/handshake_race.py` lines 100-119 time the three rows and print time ÷ RTT. Lines 80-86 set `wait_connected=False` for 0-RTT, so the request leaves with the ClientHello. Captured at 150 ms RTT: 456.6, 319.8 and 161.7 ms (slides 41, 42). The TCP path ran through `laggy.py` and the QUIC path through `lossy_udp.py --loss 0 --rtt 150`, both on loopback. The "round trips" column is time ÷ 150. The rows also stop at different points: the TCP row stops at the server's first HTTP/2 frame, SETTINGS, which `h2_server.py` sends before it reads a request (line 62 of `handshake_race.py`, lines 42 and 64 of `h2_server.py`). The QUIC rows stop at the full response (`h3_client.py` lines 103-105). So 456.6 ms does not prove the 3-RTT ladder. The ladder is the model. RFC 9001 §9.2 covers replay. RFC 9000 §5.1 covers connection IDs, §9 covers migration. RFC 8999 §7 covers middleboxes that infer meaning.

**Rung 4, exam depth.**
- *Why not a new protocol number.* NATs and firewalls drop what they do not know. SCTP (2000) proves it (S05-C182). UDP already passes (S05-C183).
- *Encrypt to stay changeable.* A middlebox depends on every visible field. TCP options froze that way. QUIC hides packet numbers and most header bits (S05-C184, S05-C185).
- *The ladder.* TCP 1 RTT, TLS 1.3 1 RTT, request 1 RTT. TLS 1.2 adds one more. QUIC merges the first two (S05-C187 to S05-C189). The `h3_client.py` docstring counts only to the end of the handshake, so it says 1 against 2. Same facts, another end point.
- *The price of 0-RTT.* The single-use ticket cache lives on one server, and a farm has many (S05-C195). The application must decide. GET and HEAD, yes. Payments, no. RFC 8470 defines Early-Data and 425 Too Early (S05-C196 to S05-C198). 0-RTT is a cache of a negotiation, so it trades a round trip for a possible replay (S05-C199).
- *Identity against address.* A four-tuple dies on Wi-Fi to LTE or a NAT rebind (S05-C203, S05-C204). The connection survives, because the server finds it by connection ID. On active migration the client switches to an unused ID, so an observer cannot link the old path to the new one (S05-C207, RFC 9000 §9.5). Only a passive NAT rebind shows the old ID from a new address.
- *Exam prompts.* (1) Why can an attacker replay 0-RTT data when the ticket cache is single-use? *Model answer: the cache lives on one server, and a farm has many. The attacker sends the copy to a different server.* (2) A phone moves from Wi-Fi to LTE during a download. What happens on TCP and on QUIC? *Model answer: TCP: the four-tuple changes, the connection dies, the download restarts. QUIC: the client sends from the new address with a new connection ID, the server validates the path, and the transfer continues.*

**Misconceptions.**
- S05-M36: "QUIC uses UDP because UDP is faster than TCP." Wrong. UDP is the only new-transport path that middleboxes let through. Distractor in check 1.
- S05-M37: "0-RTT is safe for any request, because TLS protects it." Wrong. Encryption does not stop a replay. Distractor in check 3.
- S05-M38: "QUIC can run without encryption for speed." Wrong. There is no unencrypted QUIC. Distractor in check 4.
- S05-M39: "A QUIC connection shows one fixed connection ID for its whole life." Wrong. Endpoints rotate IDs to stop tracking. Distractor in check 5.
- S05-M04 and S05-M25 appear again: more bandwidth does not remove handshake round trips, and ALPN costs no extra round trip. Distractors in check 2. S05-M43 appears in check 5.

**Diagrams.** (1) Static: the round-trip ladder in three columns, TCP plus TLS 1.3 plus h2, QUIC, and 0-RTT. Actors: client, server. (2) Step-by-step: migration. Wi-Fi address with connection ID A, LTE address with connection ID B, PATH_CHALLENGE and PATH_RESPONSE, data continues. Actors: phone, NAT, server.

**Interactives.** (1) *Handshake round-trip counter* (P1). Inputs: RTT, TLS 1.2 or 1.3, TCP or QUIC, 0-RTT on or off, request method. The learner sees the ladder and the time. A warning appears for a non-idempotent 0-RTT request. The learner discovers that each layer boundary costs a round trip. (2) *Connection migration stepper* (P1). Inputs: change the IP, NAT rebind, rotate the ID. The learner sees TCP die and QUIC continue, and a "linkable" flag when the ID does not rotate.

**Predict, observe, explain.** Command: `python3 05-http3/handshake_race.py --rtt 150 --tcp-port 9543 --quic-port 4733`, after the proxies from `run_all.sh`. Predict all three times at 150 ms RTT. Observe: 456.6, 319.8 and 161.7 ms, on loopback through the lab proxies, with different end points for the TCP and QUIC rows (rung 3). Captured output: slide 42.

- **Worked example.** RTT 150 ms, model. TCP plus TLS 1.3 plus h2: 3 × 150 = 450 ms. QUIC: 2 × 150 = 300 ms. 0-RTT: 1 × 150 = 150 ms. The slide measured 456.6, 319.8 and 161.7 ms through the lab proxies on loopback, and prints savings of 137 and 295 ms. The TCP row stops at the server's SETTINGS frame and the QUIC rows at the full response, so those savings do not compare like with like (rung 3).
- **Faded example.** RTT 60 ms. TCP plus TLS 1.3: ____. QUIC: ____. 0-RTT: ____. *(180 ms. 120 ms. 60 ms.)*
- **Your turn.** RTT 80 ms, TCP plus TLS 1.2 plus HTTP/2. Time to the response, and the QUIC saving? *(4 × 80 = 320 ms. QUIC needs 160 ms, so it saves 160 ms.)*

**Checks.**
1. `mcq`: why does QUIC run over UDP? Answer: middleboxes pass UDP and drop unknown IP protocols. Distractor: UDP is faster than TCP (S05-M36). Distractor: UDP headers are smaller, and that was the goal (S05-M36). Feedback: SCTP shows that a new protocol number cannot cross the internet.
2. `numeric`: RTT 100 ms, new TCP plus TLS 1.3 plus HTTP/2. Milliseconds to the response? Answer: 300. Distractor: 400 (S05-M25: adds an Upgrade round trip for HTTP/2). Distractor: 30 (S05-M04: a ten times faster link cuts the wait ten times). Feedback: TCP, TLS 1.3 and the request each take one round trip, and bandwidth changes none.
3. `mcq`: which request fits 0-RTT? Answer: an idempotent GET. Distractor: any request, since TLS encrypts it (S05-M37). Distractor: a POST that charges a card, since the client sends it once (S05-M37). Feedback: an attacker can replay early data to another server.
4. `mcq`: can QUIC run without TLS? Answer: no. Distractor: yes, for internal networks (S05-M38). Distractor: yes, with a plaintext flag in the header (S05-M38). Feedback: the TLS 1.3 handshake is part of the QUIC handshake.
5. `mcq`: why does a QUIC endpoint hold several connection IDs? Answer: to use an unused ID on a new path, so an observer cannot link the paths. Distractor: to carry more data in parallel (S05-M39). Distractor: one ID per stream, to tell streams apart (S05-M43). Feedback: stream ids tell streams apart, and a fresh connection ID per path stops tracking.

**Review cards.**
- Q: How many round trips does a new QUIC plus HTTP/3 connection need before the response? A: 2.
- Q: Which RFC section warns that an attacker can replay 0-RTT data? A: RFC 9001 §9.2.
- Q: Why does QUIC encrypt most of its header? A: So middleboxes cannot depend on fields, and the protocol stays changeable.
- Q: What keeps a QUIC connection alive across an IP change? A: Connection IDs from a pool the peer issued, not the four-tuple.
- Q: Which IP protocol number does UDP use? A: 17.

**Lab.** Needs `aioquic`. In the scratch copy, run `./setup.sh`, then `./run_all.sh 2>&1 | tail -15`. Expected: the handshake table with three rows near 3, 2 and 1 round trips.

### s05-m11-quic-streams-fallback

- **Title:** HTTP/3: one stall per stream, QPACK, and the road back to TCP. **Minutes:** 25.
- **Big idea:** QUIC limits a loss to one stream, which broke HPACK and needed QPACK, and a client must still discover HTTP/3 and fall back when a network blocks UDP.
- **Covers:** S05-C200, S05-C201, S05-C202, S05-C209, S05-C210, S05-C211, S05-C212, S05-C213, S05-C214, S05-C215, S05-C216, S05-C217, S05-C218, S05-C219, S05-C220, S05-C221, S05-C222, S05-C223, S05-C224, S05-C225, S05-C227, S05-C231, S05-C237.
- **Prereqs:** s05-m10-quic-handshakes, s05-m08-hpack-crime, s05-m09-http2-multiplexing, s01-m05-byte-order-dns.
- **Threads:** T-fix-causes-next, T-honest-benchmarks, T-deployed-reality, T-round-trip-tax.

**Pretest.**
1. One QUIC packet with bytes of stream 8 is lost. Which streams wait? *Answer: only stream 8.*
2. Why can HPACK not run unchanged over QUIC? *Answer: its table assumes all frames arrive in one total order.*

**Rung 1, the picture.** Now every family on the road has its own gate. A broken car blocks only its own family. But the shared code book from module 8 has a new problem. A letter can say "use page 67" before the note that wrote page 67 arrives. So QPACK sends code-book changes in a separate lane, and uses only pages the other side has confirmed. *Where it breaks:* all families still share one speed limit, the congestion window, so heavy loss still slows everyone.
A second picture for discovery: a shop puts a sign inside its front door, "we have a fast back door". You see it only after you come in the front (Alt-Svc). A listing in the phone book tells you before you arrive (HTTPS DNS record). *Where it breaks:* the browser remembers an Alt-Svc sign only for a set time (the `ma` parameter, RFC 7838 §3.1, beyond the slides), and a back door can be shut: a network that blocks UDP sends you to the front door again.

**Segment plan.** (1) Loss per stream (S05-C200 to S05-C202, S05-C237). (2) QPACK (S05-C209 to S05-C215). (3) Discovery and fallback (S05-C216 to S05-C221). (4) Reading adoption numbers (S05-C222 to S05-C225). Segment 4 picture: count cars by trips, by families or by houses, and you get three different shares for one town. *Where it breaks:* a crawler also misses back doors it never tried, so one of the web counts under-reports h3.

**Rung 2, how it works.**
1. Each HTTP/3 request uses its own QUIC stream.
2. Each STREAM frame carries a stream id and a byte offset.
3. A lost packet delays only the streams whose bytes it carried.
4. QPACK sends table inserts and acknowledgements on two separate streams. A block that uses an unacknowledged entry may stall, on at most QPACK_BLOCKED_STREAMS streams.
5. The client learns about h3 by ALPN, Alt-Svc or an HTTPS DNS record. If UDP fails, it uses TCP.
6. Reading an adoption number: find the unit (requests, homepages or websites), the date, and how the crawler discovers h3.

**Rung 3, the real thing.** `tools/lossy_udp.py` drops server-to-client datagrams with probability 0.05 after the first 10, with a fixed seed (`run_all.sh`). Slide 43 shows 18 drops and the finish times. RFC 9204 §1 gives the HPACK problem. §4.2 gives stream types 0x02 and 0x03, and §5 gives both settings with default 0. RFC 9204 Appendix A has 99 static entries, from 2018 traffic. RFC 9308 §2 gives 3 to 5% UDP blocking and the downgrade warning. `h3_client.py` uses the next free QUIC stream id, so its client ids are 0, 4, 8 (RFC 9000 §2.1, beyond the slides).

**Rung 4, exam depth.**
- *Blast radius, not milliseconds.* The two perturbations differ, so 307 against 78 ms proves nothing (S05-C202). The shape proves the point: many streams against one.
- *The QPACK trade-off.* With 0 blocked streams, the encoder uses only acknowledged entries. Headers grow, and nothing blocks. With 16, it may use fresh entries on 16 streams. Headers shrink, and a lost insert stalls them (S05-Q14). With table capacity 0 there is no dynamic table at all. QPACK is the latest link in the fix-cause chain that started with persistence (S05-C227).
- *Discovery costs.* ALPN needs a handshake. Alt-Svc needs one full TCP connection on a cold cache. An HTTPS record rides a lookup you already make (S05-C216 to S05-C218).
- *Fallback is a downgrade.* An attacker who drops UDP pushes clients to TCP (S05-C221). The client needs a fallback timer short enough for users and long enough for slow networks.
- *Reading adoption.* Requests, homepages and websites are three units. The Almanac says its 7-9% homepage h3 figure under-reports, because the crawler rarely gets to use Alt-Svc (S05-C222 to S05-C225).
- *Exam prompts.* (1) Six streams on QUIC. One lost packet carried bytes of streams 4 and 8. Which streams wait, and which would wait on TCP? *Model answer: QUIC: streams 4 and 8. TCP: every stream with bytes after the gap, a set that changes each run.* (2) An attacker drops all UDP to a site. What does the client do, and what does it cost? *Model answer: it falls back to TCP and TLS after a timer, so it loses the QUIC gains and exposes control data again. Any fallback path is a downgrade attack (RFC 9308 §2).*

**Misconceptions.**
- S05-M40: "QUIC removed every head-of-line blocking, header compression included." Wrong. HPACK would block, so QPACK exists. Distractor in check 2.
- S05-M41: "307 ms against 78 ms proves HTTP/3 is four times faster." Wrong. The two tests used different faults. Distractor in check 3.
- S05-M42: "A browser can use HTTP/3 on the first visit to any h3 site." Wrong. Without an HTTPS record it must discover h3 first. Distractor in check 4.
- S05-M43 (beyond the slides, RFC 9000 §2.1; slide 26 says 31 bits): "HTTP/3 stream ids work like HTTP/2: 31 bits, odd for clients." Wrong. QUIC ids are 62-bit, and client bidirectional ids are 0, 4, 8. Distractor in check 5.
- S05-M34 and S05-M35 appear again in check 1.

**Diagrams.** (1) Step-by-step: a lost TCP segment and a lost QUIC packet, side by side, six streams each. (2) Step-by-step: QPACK. The encoder stream inserts entry A. A request stream refers to A. The decoder blocks until A arrives, then acknowledges.

**Interactives.** (1) *Head-of-line blocking visual* (P1), QUIC half added. Inputs: TCP or QUIC, which packet to lose, stream layout. The learner sees which streams stall, and discovers all-behind-the-gap against one. (2) *Page-load waterfall simulator* (P1), with "HTTP/3 with loss" added. (3) *QPACK blocked-streams stepper* (P2). Inputs: QPACK_BLOCKED_STREAMS, loss on the encoder stream. Output: header size and blocked streams.

**Predict, observe, explain.** Command: `python3 05-http3/h3_client.py --port 4533 --multiplex --slow 0`, through the lossy proxy from `run_all.sh`. Predict: which file finishes last? Observe: /big.txt at 78.2 ms, the rest under 12 ms. Captured output: slide 43.

- **Worked example.** RTT 100 ms, a site with h3 and Alt-Svc, no HTTPS record. Visit 1 uses TCP plus TLS 1.3 plus h2: 300 ms to the response. A later new connection uses QUIC: 200 ms. With an HTTPS record, visit 1 already uses QUIC: 200 ms.
- **Faded example.** RTT 50 ms, same site. Visit 1 without the record: ____. With the record: ____. *(150 ms. 100 ms.)*
- **Your turn.** RTT 80 ms, an h3 site with Alt-Svc and no HTTPS record. Time to the response on visit 1, and on a later new connection? *(240 ms over TCP plus TLS 1.3 plus h2. 160 ms over QUIC.)*

**Checks.**
1. `mcq`: under HTTP/3, a lost packet carried bytes of stream 8 only. Which streams wait? Answer: stream 8. Distractor: all streams (S05-M34). Distractor: stream 8 and every later stream (S05-M35). Feedback: each STREAM frame has its own offset, so other streams deliver.
2. `mcq`: why does HTTP/3 use QPACK and not HPACK? Answer: HPACK needs one total order of frames, which QUIC does not give. Distractor: QUIC already has no head-of-line blocking anywhere (S05-M40). Distractor: HTTP/3 needs no dynamic table (S05-M40). Feedback: QPACK moves table inserts to their own stream so request streams do not stall.
3. `mcq`: what may you conclude from 307 ms on TCP and 78 ms on QUIC? Answer: the loss reached one stream on QUIC and many on TCP. Distractor: HTTP/3 is four times faster (S05-M41). Distractor: QUIC recovers a loss 229 ms faster than TCP (S05-M41). Feedback: the TCP side delayed a chunk and the QUIC side dropped datagrams, so only the blast radius compares.
4. `mcq`: first visit, no HTTPS record, h3 site. The browser uses? Answer: TCP first, then h3 after Alt-Svc. Distractor: h3 at once (S05-M42). Distractor: h3 after one failed UDP probe (S05-M42). Feedback: without the DNS record, the client learns h3 from a header on a TCP response.
5. `mcq`: what are the first three client bidirectional stream ids in QUIC? Answer: 0, 4, 8. Distractor: 1, 3, 5 (S05-M43). Distractor: 0, 2, 4 (S05-M43). Feedback, with the beyond-the-slides badge (RFC 9000 §2.1): slide 26 says 31 bits for HTTP/2 and HTTP/3, which holds for HTTP/2 only. QUIC ids are 62-bit, and the low two bits give the type.

**Review cards.**
- Q: Which RFC defines QPACK? A: RFC 9204.
- Q: What do the QPACK encoder and decoder streams carry? A: Table inserts from the encoder, acknowledgements from the decoder.
- Q: What share of networks block all UDP, per RFC 9308? A: 3 to 5%.
- Q: Which DNS record type advertises h3 before the first connection? A: HTTPS, type 65 (RFC 9460).
- Q: What share of requests still used HTTP/1.1 in Web Almanac 2024? A: About 15%.

**Lab.** Homework 5, in a VM or test machine only, because it changes the firewall. In the scratch copy, run `./setup.sh` (it installs `aioquic` and makes `certs`), then `tools/lab.sh h3` to start `h3_server.py` on UDP 4433. Check that `python3 05-http3/h3_client.py --port 4433` gets a response. Run `sudo iptables -A OUTPUT -p udp --dport 4433 -j DROP`, then time `python3 05-http3/h3_client.py --port 4433`. Remove the rule with `sudo iptables -D OUTPUT -p udp --dport 4433 -j DROP`. Expected: the client has no TCP fallback, so it waits until the QUIC attempt times out. Record that time for S05-Q15.

### s05-m12-assignment-prep

- **Title:** Assignment prep: a calculator that stays on the line. **Minutes:** 20.
- **Big idea:** The arithmetic is trivial, and the real skill is to take exactly one request off a persistent byte stream and pick the right status.
- **Covers:** S05-C04, S05-C05, S05-C06, S05-C07, S05-C08, S05-C09, S05-C10, S05-C11.
- **Prereqs:** s05-m02-keepalive-host, s05-m04-range-chunked-extras, s01-m08-framing, s01-m04-clients.
- **Threads:** T-framing, T-setup-off-path.
- **Integrity note.** This task counts for a grade. This module gives a checklist, concepts, a test plan and hints. It gives no solution code and no server skeleton. The instructor asks you not to read `server11.py` until you fail once. Page builders: every `server11.py` line pointer in modules 2 to 6 stays in a collapsed box labelled "open after your first calculator attempt". Keep that gate.

**Pretest.**
1. Two GET requests arrive back to back on one socket. Where does the first one end? *Answer: at the empty line after its headers. A GET here has no body.*
2. A request declares Content-Length: 5. How many body bytes do you read? *Answer: exactly 5.*
3. The server knows the method, but this path does not allow it. Which status? *Answer: 405.*

**Rung 1, the picture.** A post office clerk takes letters from one long conveyor belt. Each letter has a label: "5 pages". The clerk takes exactly 5 pages, not the whole pile, because the next pages belong to the next person. *Where it breaks:* TCP shows no gaps between letters. The empty line and the length label are the only markers, and one read can hold half a letter or three letters.

**Rung 2, how it works.** These are concepts, not code.
1. Collect bytes until the header block ends at an empty line.
2. Parse the request line and headers from those bytes only.
3. If the request declares a body, collect exactly that many more bytes. Keep any extra bytes for the next request.
4. Pick a status, and send a response with its own Content-Length.
5. Go back to step 1 on the same socket, until the client closes or asks to close, or a timeout fires.

**Rung 3, the real thing.**

| # | Requirement from slide 3 | Expected |
|---|---|---|
| 1 | `GET /add?a=2&b=3` | 200, body 5 |
| 2 | `GET /sub?a=10&b=4` | 200, body 6 |
| 3 | `GET /mul?a=6&b=7` | 200, body 42 |
| 4 | `GET /div?a=9&b=3` | 200, body 3 |
| 5 | `GET /div?a=1&b=0` | 400 |
| 6 | `GET /add?a=x&b=3` | 400 |
| 7 | `GET /pow?a=2&b=8` | 404 |
| 8 | `POST /add` | 405 |
| 9 | `GET /add` with no Host | 400 |
| 10 | the marking run: rows 1, 2, 3, 5, 7 and 8, in that order, on one socket | socket still open, 1 TCP handshake, 6 responses |
| S | stretch: Connection: close, a defensible idle timeout, chunked, pipelined requests in order | optional |

References for status choices: RFC 9110 §15.5.1 (400), §15.5.5 (404), §15.5.6 (405). RFC 9110 §15.5.6 also requires an Allow header in a 405. RFC 9112 §6.3 gives the body length rules, and §3.2 gives the Host rule.

**Rung 4, exam depth.**
- *Why framing is the whole task.* When the server hung up, end of file marked the end for free. On a kept connection nothing marks the end but your parser (S05-C09).
- *The concepts to get right.* (1) Consume exactly Content-Length bytes. (2) Find where one request ends and the next starts. (3) Loop on the same socket. (4) Choose 400, 404 or 405 by what is wrong: the input, the resource, or the method.
- *Timeout trade-off.* A short idle timeout frees server memory and breaks slow clients. A long one keeps idle sockets open. server11 uses 15 s. Be ready to defend your number (S05-C10).
- *Pipelining.* If six requests arrive in one read, you must still answer in order, because the client matches by position (module 6).
- *Exam prompts.* (1) Why must a server remove only the bytes it used from its read buffer? *Model answer: the bytes after the request can be the start of the next request.* (2) On a kept connection, why can a server not wait for end of file to find the end of a request? *Model answer: the client does not close between requests, so no end of file arrives. Only the empty line and the declared length mark the end.*

**Local test plan** (run against your own server, on a spare port).
1. Open one socket with a short client of your own. Send the six requests of the slide 3 marking run in its order: add, sub, mul, div by zero, pow, POST /add. Check each result, then check that the socket still works. Test rows 4, 6 and 9 (div 9/3, a=x, no Host) on separate connections. Slide 3 does not say whether the socket must survive an error such as the no-Host 400 (section 7).
2. Send one request in two writes, 1 s apart, split inside a header line. Expect one correct response.
3. Send two requests in one write. Expect two responses, in order.
4. Send a POST with `Content-Length: 5`, then 5 body bytes and a GET in the same write. Expect two responses.
5. Send `Connection: close`. Expect one response, then end of file.
6. Stay idle past your timeout. Expect a close from the server.
7. `python3 tools/talk.py PORT --keep-open --req "GET /add?a=2&b=3 HTTP/1.1" "Host: localhost" "" "GET /mul?a=6&b=7 HTTP/1.1" "Host: localhost" ""` sends a pipelined pair.

**Hint ladder.** Open one hint at a time.
1. Draw the byte stream of cases 1 and 2 on paper. Mark where each request ends.
2. A single recv() can return any number of bytes. Keep a buffer between reads.
3. Search the buffer for the empty line before you parse anything.
4. Every response needs a length, or the client cannot find its end.
5. After you answer, remove only the bytes you used from the buffer.
6. Stretch: for pipelining, handle requests from the buffer in a loop before you call recv() again.

**Misconceptions.**
- S05-M44: "One recv() returns exactly one request." Wrong. TCP keeps no message edges. Distractor in check 1.
- S05-M45: "Division by zero is a server error, so 500." Wrong. The client sent bad input, so 400. Distractor in check 2.
- S05-M46: "A wrong method on a known path is 404." Wrong. The resource exists, so 405. Distractor in check 3.
- S05-M47: "Read the body until the client closes." Wrong. On a kept connection, read exactly Content-Length. Distractor in check 4.

**Diagrams.** (1) Static: a byte ruler of two pipelined requests, with the empty lines and the boundary marked. (2) Step-by-step: the persistent loop. Wait for the header end, maybe read a body, respond, back to wait.

**Interactives.** *Request boundary finder* (P1). Inputs: a generic HTTP byte stream (the /echo and /style.css requests below, not calculator requests), and the sizes of each recv. The learner sees where the reads cut and where requests really end. The learner discovers that reads and requests do not line up.

**Predict, observe, explain.** Command: `python3 tools/talk.py 8011 --keep-open --req "GET /style.css HTTP/1.1" "Host: site-a.local" "" "GET /app.js HTTP/1.1" "Host: site-a.local" ""`. Predict: how many status lines return from one send? Observe: two, with bodies of 55 and 32 bytes. No slide shows it. Our capture on a scratch copy (loopback, 2026-09-13): `--- sent 91 bytes`, then `--- no more data after 3.0s: the server is holding the connection open`, then `HTTP/1.1 200 OK` with `Content-Length: 55`, then `HTTP/1.1 200 OK` with `Content-Length: 32`, then `--- received 757 bytes in ... ms`. The script prints the responses only after its read loop ends (`talk.py` lines 83 to 94).

- **Worked example.** The stream holds `POST /echo HTTP/1.1`, `Host: site-a.local`, `Content-Length: 5`, an empty line, `hello`, then `GET /style.css ...`. The head is 21 + 20 + 19 + 2 = 62 bytes. The body is bytes 62 to 66. Request 2 starts at byte 67.
- **Faded example.** Same, with `Content-Length: 11` and `hello world`. Head: ____ bytes. Request 2 starts at byte ____. *(63. 74.)*
- **Your turn.** The stream holds `GET /a HTTP/1.1`, `Host: x`, an empty line, then a second GET. Where does the second request start? *(Byte 28.)*

**Checks.**
1. `spot-bug`: a server calls recv(4096) and treats the result as one request. What breaks? Answer: a read can hold half a request or two. Distractor: nothing, one read is one request (S05-M44). Distractor: only requests bigger than 4096 bytes break (S05-M44). Feedback: TCP keeps no message edges, so even a small request can arrive split or joined.
2. `mcq`: `GET /div?a=1&b=0`? Answer: 400. Distractor: 500 (S05-M45). Distractor: 200 with an error message in the body (S05-M45). Feedback: the input is wrong, not the server.
3. `mcq`: `POST /add` when the path allows only GET? Answer: 405. Distractor: 404 (S05-M46). Distractor: 501 Not Implemented (S05-M46). Feedback: the path exists and the method is known, so 405 with an Allow header.
4. `mcq`: how many body bytes does a request with Content-Length: 5 own? Answer: exactly 5. Distractor: all bytes until the client closes (S05-M47). Distractor: every byte in the current read buffer (S05-M44). Feedback: byte 6 belongs to the next request.

**Review cards.**
- Q: On a persistent connection, what marks the end of a request with no body? A: The empty line after the headers.
- Q: How many body bytes belong to a request with Content-Length n? A: Exactly n. Byte n+1 belongs to the next request.
- Q: Which status fits bad query values? A: 400.
- Q: Which status fits a known path with a method it does not allow? A: 405, with an Allow header.
- Q: When is the calculator assignment due? A: Before Session 7.

### s05-m13-project-studio

- **Title:** Project studio: HTTP, in binary. **Minutes:** 25.
- **Big idea:** A protocol is a spec that a stranger can build from, so the spec must state and defend every field width, every length and every unknown-type rule.
- **Covers:** S05-C12, S05-C13, S05-C14, S05-C15, S05-C16, S05-C17, S05-C18, S05-C19, S05-C20, S05-C21, S05-C22.
- **Prereqs:** s05-m07-http2-frames, s05-m08-hpack-crime, s03-m05-fastcgi-servlets, s01-m08-framing, s01-m05-byte-order-dns, s01-m09-encodings.
- **Threads:** T-framing, T-skip-unknown, T-encapsulation.
- **Integrity note.** This task counts for a grade. This module gives design questions, a trade-off table, a spec checklist, hexdump practice on HTTP/2 and FastCGI bytes, and interop test ideas. It never designs or annotates your own protocol.

**Pretest.**
1. The HTTP/2 24-bit length allows frames up to how many bytes? *Answer: 16,777,215.*
2. What must a receiver do with an unknown frame type? *Answer: skip it, using its length.*

**Rung 1, the picture.** Two kids build walkie-talkies in two rooms. They may pass only one sheet of paper with the rules. If the sheet says "send the size first" but not how many digits, the walkie-talkies do not work together. *Where it breaks:* friends fill gaps by guessing the same way. A stranger guesses differently, and a spec must leave nothing to guess.

**Rung 2, how it works.** The design process.
1. List every message the two programs exchange.
2. Choose a fixed header: the fields, their widths, and the byte order.
3. Decide how a receiver finds the end of every frame and every header.
4. Decide header names: numbers for common names, length-prefixed strings for the rest.
5. Write the rules for an unknown and a malformed frame, and one annotated hexdump. Then give only the spec to your partner.

**Rung 3, the real thing.** HTTP/2 (RFC 9113 §4.1) uses Length 24, Type 8, Flags 8, R 1 and Stream Identifier 31: 9 bytes, with no version field, because ALPN picks the version. FastCGI (`fastcgi.h` lines 11 and 67-74) uses version 1 byte, type 1, requestId 2, contentLength 2, paddingLength 1 and reserved 1: 8 bytes, big-endian. `FCGI_UNKNOWN_TYPE` (line 51) is the FastCGI answer to an unknown management record.

**Design questions from slide 4.** Answer each one in your spec.
1. Which fields go in the fixed header, and how wide is each one?
2. What is the largest frame your length allows, and is that enough?
3. How does a receiver skip a frame type it does not know?
4. Which ten header names get numbers, and how do you send the rest?
5. How does bcurl know where a body ends?
6. What does bserve do with a malformed frame, and does the connection survive?

Slide 4 also asks why HTTP/2 chose 24 / 8 / 8 / 31. That question is about HTTP/2, and rung 4 of s05-m07-http2-frames reads it. This page does not answer it again next to the questions for your own spec.

**Trade-off table: HTTP/2 against FastCGI.**

| Question | HTTP/2 | FastCGI |
|---|---|---|
| Header size | 9 bytes | 8 bytes |
| Largest payload | 16,777,215 (capped by SETTINGS) | 65,535 plus up to 255 padding |
| Multiplexing id | 31-bit stream id | 16-bit requestId |
| Where the version lives | outside, in ALPN | a version byte in every record |
| End of a stream | END_STREAM flag | a record with contentLength 0 |

**Exam prompts** (HTTP/2 and FastCGI only). (1) A receiver has read a 9-byte HTTP/2 header whose length runs past the bytes it holds. What does it do? *Model answer: it keeps reading, because TCP can split a frame. Only a frame over its advertised MAX_FRAME_SIZE is an error (FRAME_SIZE_ERROR, RFC 9113 §4.2).* (2) Why does a 16-bit FastCGI contentLength force a large body into many records? *Model answer: one record holds at most 65,535 bytes, so a bigger body needs a record sequence that ends with an empty record. HTTP/2 DATA frames split the same way at 16,384 bytes, which lets other streams slot in.*

**Spec-writing checklist.**
1. The byte order, stated once, near the top.
2. The fixed header, field by field, with offsets and widths.
3. One sentence that defends each width.
4. Every frame type: number, name, payload layout.
5. The numbered header names, with their numbers.
6. How a string or unnumbered header gets its length.
7. The rule for an unknown frame type: skip by length.
8. The rule for a malformed frame: status 400, and what happens to the connection.
9. Status codes: 404 for a missing file, 400 for a malformed frame.
10. What happens at end of file and on a second request.
11. One annotated hexdump of a full request and response.
12. A version 2 note: which part can grow without breaking version 1.

**Hexdump practice** (HTTP/2 and FastCGI only).
- *Worked example.* FastCGI `01 01 00 01 00 08 00 00 | 00 01 00 00 00 00 00 00`. Version 1. Type 1, `FCGI_BEGIN_REQUEST`. requestId `00 01` = 1. contentLength `00 08` = 8. Padding 0. Reserved 0. Body: role `00 01`, RESPONDER. Flags 0, so no KEEP_CONN. Five reserved bytes.
- *Faded example.* One HTTP/2 SETTINGS entry: `00 04 00 10 00 00`. Identifier `00 04` = ____. Value `00 10 00 00` = ____. *(INITIAL_WINDOW_SIZE. 1,048,576. `h2_client.py` sends this at line 130.)*
- *Your turn.* Annotate `00 00 04 08 00 00 00 00 00 01 00 00 00`. *(Length 4. Type 8, WINDOW_UPDATE. Flags 0. Stream 0. Increment `01 00 00 00` = 16,777,216, sent by `h2_client.py` line 134.)*

**Interop test ideas.**
1. Run your bcurl against your partner bserve, never only your own.
2. Send a frame with a type number your spec does not define. Expect a clean skip.
3. Send a frame whose length runs past the end of the data. Expect 400 or your written rule.
4. Request a missing file. Expect 404, and a connection that stays open.
5. Send two requests on one connection. Expect two responses.
6. Put both hexdumps next to the spec, field by field.

**Misconceptions.**
- S05-M48: "A receiver should close the connection on an unknown frame type." Wrong. It skips the frame by its length. Distractor in check 1.
- S05-M49: "Wider fields are always safer." Wrong. Every byte repeats on every frame. Distractor in check 2.
- S05-M50: "A client that passes against its own server proves the spec." Wrong. Shared guesses hide gaps. Distractor in check 3.
- S05-M51: "Byte order is obvious and needs no line in the spec." Wrong. A stranger may pick the other order. Distractor in check 4.

**Diagrams.** (1) Static: HTTP/2 and FastCGI header rulers, one above the other, with offsets. (2) Step-by-step: the stranger test. Spec, partner builds, interop run, a mismatch, a spec fix.

**Interactives.** (1) *HTTP/2 frame header decoder* from module 7 (P1), with FastCGI mode added. (2) *Header width sandbox* (P2). Inputs: generic field names and widths. Output: header size, largest values, overhead per 1 KB of body. It never outputs a spec.

**Predict, observe, explain.** Command: `python3 04-http2/h2_client.py --port 8020 --path /`. Predict the 9 bytes of the final empty DATA frame with END_STREAM on stream 1. Observe: `00 00 00 00 01 00 00 00 01`. Captured output: slide 32.

**Checks.**
1. `mcq`: a receiver meets frame type 0x7f, which it does not know. Answer: skip it by its length and continue. Distractor: close the connection (S05-M48). Distractor: send an error for that frame and close (S05-M27). Feedback: the length lets the receiver skip the payload, which leaves room for version 2.
2. `mcq`: why not make every field 32 bits? Answer: every frame pays those bytes, with no gain for most fields. Distractor: wider is always safer (S05-M49). Distractor: a 32-bit field is faster to parse, so it costs nothing (S05-M49). Feedback: 8 flag bits or 8 type bits already cover the need, and every extra byte repeats on every frame.
3. `mcq`: what shows that the spec is complete? Answer: a partner builds from it alone, and you can annotate your own bytes. Distractor: your client works with your server (S05-M50). Distractor: your code passes its own unit tests (S05-M50). Feedback: shared guesses hide gaps, and a stranger finds them.
4. `mcq`: a spec gives a length field's offset, its width (2 bytes) and what it counts. What is still missing? Answer: the byte order. Distractor: nothing, since both programs run on the same kind of machine (S05-M51). Distractor: nothing, since network order is the only order (S05-M51). Feedback: a stranger can read `00 2a` as 42 or as 10,752.

**Review cards.**
- Q: Which rule leaves room for a version 2 of a binary protocol? A: Skip unknown frame types cleanly, by length.
- Q: How big is a FastCGI record header? A: 8 bytes.
- Q: Besides the program and the two-page spec, what does the project hand-in include? A: An annotated hexdump of one full request and response.
- Q: What is the only thing that may cross between the project pair? A: The spec.
- Q: Where does HTTP/2 keep its version, since the frame has no version field? A: In ALPN, during the TLS handshake.

**Lab.** `python3 tools/talk.py 8011 --hex --req "GET /style.css HTTP/1.1" "Host: site-a.local" "Connection: close" ""`. Mark the status line, each header, the empty line and the 55 body bytes. Text framing gives the contrast for the binary work.

## 6. Beyond the slides

| Fact | Reference |
|---|---|
| The HTTP/2 Length field excludes the 9 header bytes. Endpoints MUST ignore and discard unknown frame types. | RFC 9113 §4.1 |
| An Alt-Svc entry stays fresh for 24 hours unless the `ma` parameter sets another max age. | RFC 7838 §3.1 |
| The preface MUST be followed by a SETTINGS frame. The RFC says only that many 1.x servers "do not attempt to process further frames". It does not mention 501. | RFC 9113 §3.4 |
| A new stream id must be greater than every earlier id from that side. Ids never repeat. | RFC 9113 §5.1.1 |
| QUIC stream ids are 62-bit variable-length integers. Client-initiated ids are even. HTTP/3 frames carry only a type and a length. | RFC 9000 §2.1, RFC 9114 §7.1 |
| An HPACK table entry costs name + value + 32 bytes. 1337 in a 5-bit prefix is `1f 9a 0a`. The newest dynamic entry takes the lowest dynamic index, 62, and older entries move up one. With a 7-bit prefix, indexes 1 to 126 fit in one byte. | RFC 7541 §2.3.2, §2.3.3, §4.1, §5.1, C.1.2 |
| HPACK "mitigates but does not completely prevent" CRIME-style attacks. A whole-value guess still works. | RFC 7541 §7.1.1, §7.1.3 |
| A delayed ACK MUST come within 0.5 s. Linux uses a 40 ms minimum. A two-write copy of server11 gave 41 ms per request on Linux 7.1. | RFC 1122 §4.2.3.2, Linux `include/net/tcp.h` TCP_DELACK_MIN |
| Each new TCP connection starts slow start from an initial window of up to 10 segments, not from nothing. | RFC 6928, RFC 5681 |
| The "MAY reject" and "MUST close" sentence is in RFC 9112 §6.1. §6.3 says Transfer-Encoding overrides and the message "ought to be handled as an error". | RFC 9112 §6.1, §6.3, §11.2 |
| The IETF now argues for active protocol maintenance, not tolerance of bad input. | RFC 9413 (June 2023) |
| RFC 2068 already required Host and a 400 when it is missing. Its header numbers differ from RFC 2616: ETag §14.20, Range §14.36, Vary §14.43. | RFC 2068 §14.23, §19.5.1 |
| RFC 2068 had 100 Continue but no Expect header. RFC 2616 added Expect and 417. | RFC 2616 §19.6.3 |
| 308 Permanent Redirect keeps the method, like 307. 303 already existed in RFC 2068. | RFC 7538, RFC 9110 §15.4.9 |
| RFC 9110 reserves 418, but says it "can be re-assigned" if 4xx codes run out. | RFC 9110 §15.5.19 |
| If-None-Match uses weak comparison. If-Match uses strong comparison. If-Range MUST NOT hold a weak ETag. | RFC 9110 §8.8.3.2, §13.1.1, §13.1.2, §13.1.5 |
| Last-Modified is a weak validator unless the Date is at least one second later. | RFC 9110 §8.8.2.2 |
| A 405 response MUST carry an Allow header. | RFC 9110 §15.5.6 |
| RFC 7230 replaced the 2-connection limit with advice to be conservative. | RFC 7230 §6.4 |
| Early-Data and 425 Too Early come from RFC 8470. Cloudflare docs today list GET, HEAD and OPTIONS for 0-RTT. | RFC 8470, developers.cloudflare.com 0-RTT page |
| QUIC carries TLS handshake messages directly, with no TLS record layer. RFC 9001 §2.1 is only a TLS overview. | RFC 9001 §3, §4 |
| The QPACK static table has 99 entries from 2018 traffic. It has no sec-fetch entries. | RFC 9204 Appendix A |
| An encoder MUST limit blocked streams to SETTINGS_QPACK_BLOCKED_STREAMS. It can avoid blocking by using only acknowledged entries. | RFC 9204 §2.1.2 |
| The 95.3% figure covers video playback clients, from November 2016 data. Another 0.3% saw rate limiting. | Langley et al., "The QUIC Transport Protocol", SIGCOMM 2017, §7.2 |
| The SPDY loss table used the top 25 sites on a simulated 4/1 Mbit cable link, and 2.5% loss gave 43.63%. The "over 25% HTTP/2" figure is from 11 February 2016. | chromium.org SPDY whitepaper Table 2, Chromium blog "Transitioning from SPDY to HTTP/2" |
| The Chrome post on push says "without a clear net performance gain and in many cases performance regressions". | developer.chrome.com, "Removing HTTP/2 Server Push from Chrome" |
| The Almanac says its homepage h3 share under-reports. Real h3 support is "closer to 30%". | Web Almanac 2024, HTTP chapter |
| The HTTP/2 CONTINUATION flood is CERT/CC VU#421644, April 2024. | kb.cert.org VU#421644 |
| On active migration, an endpoint MUST NOT reuse a connection ID from more than one local address. It uses an unused ID from the pool. Only a NAT rebinding, outside the client's control, can show the old ID from a new address. Slide 44's "same connection id" simplifies this. | RFC 9000 §5.1, §9.2, §9.5 |
| In Python `socketserver`, `StreamRequestHandler.setup()` reads `disable_nagle_algorithm` from the handler instance. Set on a `TCPServer` subclass, it has no effect, so `server11.py` line 286 does not set TCP_NODELAY. A two-write copy that keeps the line gave 0.9 ms, then 41.9, 40.9, 41.1 and 40.9 ms (loopback, 2026-09-13). | CPython `Lib/socketserver.py`, `StreamRequestHandler` |
| HTTP/2 does not end smuggling across a chain. A message is malformed if content-length differs from the sum of its DATA payloads. Unvalidated fields enable smuggling when a message is forwarded as HTTP/1.1. Published attack class: HTTP/2 downgrade smuggling (H2.CL, H2.TE). | RFC 9113 §8.1.1, §8.2.1, §10.3, PortSwigger research, Black Hat USA 2021 |
| The lab HTTP/3 server builds `H3Connection` with aioquic defaults, which advertise QPACK_MAX_TABLE_CAPACITY 4096 and QPACK_BLOCKED_STREAMS 16. The RFC defaults are 0. | aioquic `src/aioquic/h3/connection.py`, RFC 9204 §5 |

## 7. Open questions

1. **Syllabus mismatch.** Slide 2 lists week 7 "Building for failures" and week 8 "Streaming video at large scale" (S05-C03). The official table lists week 7 "Economics of cloud tech" and week 8 "Building for failures". Confirm with the course platform.
2. **Session 6 preview, no module.** Slide 50 previews "Where did the state go?": sticky sessions, the cost of stateless design, TLS termination, shared caches and the thundering herd, connection pools. It brings question S05-Q16 and offers `http-evolution.tar.gz`. Slide 51 is the agenda: five hours, five RFC eras. Session 4 previewed the same title.
3. **Slide moves.** Slide 44 (connection IDs) moved from `s05-m11` to `s05-m10`, because m11 already holds four dense slides. Slide 9 teaches in m01 and returns in m03. The Cache-Control row of slide 17 (S05-C75, S05-C76) moved from `s05-m04` to `s05-m03`, next to the validators. Slide 18 sits in m06 as planned. Slides 48 and 49 feed the questions and the claims in m05, m09 and m11.
4. **Footer numbers.** Slide 36 says "slide 23" for PDF slide 25. Homework 5 says "slide 41" for PDF slide 43. Lesson pages must use PDF numbers.
5. **RFC 2068 labels with RFC 2616 section numbers.** Slides 10, 13, 14 and 15 cite §14.19, §14.44 and §14.35 under RFC 2068. Those are RFC 2616 numbers. In RFC 2068, §14.19 is Date, §14.35 is Public and §14.44 is Via. The slides also cite §14.3, which is Accept-Encoding in both RFCs, so that one is correct.
6. **Expect in RFC 2068.** Slide 17 lists Expect: 100-continue as an early HTTP/1.1 arrival. RFC 2068 has 100 Continue but no Expect header. Slide 19 lists Expect as new in RFC 2616, which matches the RFC.
7. **Host as new in 1999.** Slide 19 lists "Host is now a MUST (and a MUST-400)" as new in RFC 2616. RFC 2068 already had both. RFC 2616 only tightened the wording.
8. **RFC 9112 section.** Slide 20 cites §6.3 for "MAY reject … MUST close". That text is in §6.1.
9. **"deprecat" count.** Slide 38 says RFC 9113 has two hits. The text has eight, on three topics: priority, the h2c Upgrade, and userinfo in :authority. None is push, so the teaching point stands.
10. **SPDY adoption date.** Slide 30 puts "over 25% against under 5%" in the February 2015 row. The figure comes from the February 2016 post.
11. **QPACK static table.** Slide 45 says "the sec-fetch headers are in it". RFC 9204 Appendix A has no sec-fetch entry. Teach the 99 entries and drop that phrase.
12. **HTTP/3 stream ids.** Slide 26 gives "31 bits" for HTTP/2 and HTTP/3. QUIC stream ids are 62-bit. Teach the correction in m11 (S05-M43).
13. **Cloudflare 0-RTT.** Slide 42 says GET and HEAD only. The Cloudflare page today also lists OPTIONS.
14. **418 "reserved forever".** Slide 24 quotes "widely implemented as an easter egg" and cites RFC 9110 and draft-nottingham-thanks-larry. The quote matches the draft, not RFC 9110. RFC 9110 allows re-assignment if 4xx codes run out.
15. **Arithmetic differences.** Check these before any lesson page shows them.
    - gzip: 5,763 / 202,000 = 2.85%. The slide says 2.8%, the README 2.9%, `demos.sh` "about 3%". "400× faster" is 2003.6 / 4.9 = 409 for style.css, but 257 for hero.png.
    - Header tax: 80 × 805 = 64,400, not 64,320. The script sums 80 requests of 804 bytes, because its generated paths are one byte shorter than the sample path.
    - The README says six assets cost 240 ms of Nagle stall. Slide 28 measures five requests at 174.3 ms. The README HTTP/2 stall table is another run than slide 39.
    - "Nine months later" is eight months (May 1996 to January 1997). "A third of IPv4" is 1.1 billion / 2^32 = 26%, or 30% of about 3.7 billion routable addresses.
16. **Slide 9 mixes two files.** The 304 demo uses style.css, 55 bytes. The saving "202,000 bytes → 0" is the size of big.txt.
17. **Measurement conditions.** All numbers come from the instructor laptop on loopback. `laggy.py` charges a new connection half an RTT, in a serial accept loop, and delays each read chunk in series. That model explains the close row (6 × 225 ≈ 1,350 ms) and why parallel6 did not beat parallel2. The handshake "round trips" column is time ÷ RTT, and the TCP and QUIC paths use different delay code. The TCP row also stops at the server's first HTTP/2 frame (SETTINGS, sent before the server reads a request), while the QUIC rows stop at the full response. A likely cause of the exact 3.0: `laggy.py` delays each read chunk in series, so the TLS 1.3 session tickets and SETTINGS each wait 75 ms. Keep 3, 2 and 1 RTT as the model, and do not present 456.6 ms as proof of it. State these conditions on every page that shows the numbers.
18. **The code already fixes the Nagle demo.** `server11.py` now writes each response in one call (lines 87-93), so `nagle.py` shows no stall. Line 286 tries to set TCP_NODELAY, but it has no effect: the attribute belongs on the handler class (`H11`), not on the `Server` class (section 6). A predict-observe block must use the slide capture or a two-write copy. A learner who copies that idiom into a socketserver server gets the 40 ms stall back.
19. **Why request 1 is fast in the Nagle table.** The slide does not say. A likely cause is Linux quick-ACK mode at the start of a connection (tcp(7), TCP_QUICKACK). Confirm before teaching it.
20. **curl header count.** Slide 6 says curl adds four headers. curl 8.18 on this machine added three: Host, User-Agent and Accept.
21. **README scope note.** The README lists server push and connection migration as not covered. Slides 38 and 44 teach both. The slides win.
22. **Homework 5 port.** The README says "UDP 443". The command drops port 4433.
23. **Almanac reading.** Slide 47 calls the homepage row the "cleanest number". The Almanac itself says the homepage h3 share under-reports.
24. **Proposed threads.** "Multiplexing needs identity" repeats TCP ports and TCAP ids (Session 2), FastCGI requestId (Session 3) and stream ids (Session 5). "Semantics against encoding" repeats Session 1 encodings. Both need a README change before a module uses them. On 2026-09-14, T-postel ("be liberal in what you accept", S05-C93) left the README thread table, because no other session repeats it.
25. **Graded work text.** The deck announces the assignment and project, but nobody has formally set them. Recheck m12 and m13 against the real task text and marking scheme when it arrives.
26. **Quiz scope.** No transcript exists. We cannot tell which stories and numbers the instructor stressed aloud. The claim inventory keeps all of them.
27. **Errors on the persistent connection.** Slide 3's marking run sends six requests and no error of the no-Host, a=x or div 9/3 kind. The slide does not say whether an error response, at least the no-Host 400, must keep the connection open. The reference `server11.py` closes after that 400 (lines 149-152). m12 tests those cases on separate connections and takes no side. Ask when the task text arrives.
28. **Homeworks 3 and 4 need a code change first.** Homework 3 says to run `h2_client.py` with a long cookie, but `main()` passes no extra headers and has no cookie option (`request(extra=())`, line 140, called at lines 208 and 224). Homework 4 says to set QPACK_BLOCKED_STREAMS in `h3_server.py`, which has no QPACK setting. Its aioquic defaults already advertise 16 blocked streams and a 4096-byte table, not the RFC defaults of 0 that slide 45 lists (section 6). A lab built from S05-Q13 or S05-Q14 must add these hooks first.
29. **Smuggling length.** Slide 21 says a Content-Length 6 reader sees "ONE request". In the `framing.py` bytes, 6 covers only `0\r\n\r\nG`, so the rest parses as a second request, `ET /admin`. Only Content-Length 67 hides the whole GET /admin. m05 teaches all three cases (5, 6, 67). Check whether the instructor meant the one-byte prefix trick.
30. **The 15% date.** Slide 47 says "Fifteen per cent of requests are still HTTP/1.1, in 2026", but its source row is the Web Almanac 2024. S05-C225 keeps both. Use "about 15% (Web Almanac 2024)" on quiz items.
31. **Migration simplification.** Slide 44 says "same connection id" after an address change. RFC 9000 §9.5 forbids reuse on active migration (section 6). m10 teaches the RFC rule and flags S05-C206.
