# Session 4: nginx deep dive

## 1. Header

- **Title:** nginx deep dive. The deck title is "nginx and the code that explains it".
- **Approximate date:** about 2026-09-04.
- **Instructor subtitle:** "A trimmed history · what nginx actually changed · the features you configure · and one long walk through the source."
- **Pinned version:** nginx 1.31.5, `github.com/nginx/nginx`, commit `231a60ee`.

**Sources used**

| Path | What it gives | Trust |
|---|---|---|
| `sources/session-04/slides.txt` | 36 PDF pages, complete: history, what changed, features, walkthrough, homework, four ideas, next session | high |
| `cn-at-scaler/lesson4/nginx-from-scratch/README.md` | the seven programs, the demo ports, the honest sendfile note, the measured 3:1 split | high |
| `cn-at-scaler/lesson4/nginx-from-scratch/NGINX-TOUR.md` | Stops 0 to 10, "how to read any module", 5 homework problems, 7 "Ask the class" questions and one trade-off prompt | high |
| `cn-at-scaler/lesson4/nginx-from-scratch/01-fork` to `06-fastcgi`, `common.h`, `Makefile`, `tools/flood.sh`, `tools/syscalls.sh` | runnable C servers with teaching comments | high, with comment errors listed in section 7 |
| `cn-at-scaler/lesson4/nginx-from-scratch/07-nginx/nginx.conf` | one config, five demos on ports 8080 to 8084, one more "Ask the class" | high |
| nginx 1.31.5 source, cloned at `231a60e` for verification only | every function name, line pin, and algorithm in this file | high |
| nginx.org docs, man7.org man pages | defaults and exact semantics, in section 6 | high |

**Source gaps.** No transcript and no AI notes exist for this session. So nobody knows what the instructor said beyond the deck, the tour and the code comments. The slides are complete, so no module is blocked.

**Confidence.** High. Every slide is available. The verification pass checked the slide claims against the nginx 1.31.5 source and the nginx.org docs. The passes found 24 places where the deck or the repo comments simplify, contradict each other, or disagree with the code. Section 7 lists them (items 1 to 11, 13, and 19 to 30). The modules teach the code behavior and show the slide version as the thing to correct.

## 2. The session in one paragraph

By 2002 one machine was fast enough to serve ten thousand people, but the software was not. Every web server of the 1990s gave each connection its own worker: a process, then a thread. For ten years people tried to make that worker cheaper. nginx asked a different question: why does an idle connection need a worker at all? Its answer is one event loop per CPU core, which holds thousands of idle connections as small records in a kernel list. This session follows that idea into the real nginx source. It covers the master and workers, the loop, epoll and its stale-event trap, and sendfile. It then covers the reverse proxy, the cache, location matching, weighted round robin, the resumable parser and the eleven phases. A working engineer cares because nearly every web request today passes through a proxy of this shape. Each configuration directive is a small, readable piece of this machine. Once you can read the machine, you can predict what a config does before you deploy it.

## 3. Claim inventory

Core count: 85 of 175.

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S04-C01 | The deck pins nginx 1.31.5 and uses the companion repo nginx-from-scratch. | slides.txt slide 1 | detail |
| S04-C02 | nginx did not make the worker cheaper. It deleted the worker. | slides.txt slide 2 | core |
| S04-C03 | Learn the order of events, not the dates. Each design answered a constraint. The constraint tells a law from a habit. | slides.txt slide 3 | core |
| S04-C04 | The first web server was CERN httpd. Berners-Lee wrote it on a NeXT in 1990. | slides.txt slide 4, 5 | correction |
| S04-C05 | Mosaic (NCSA, 1993) was a browser by Andreessen. It was not a server. It brought inline images, and the web went mainstream. | slides.txt slide 4, 5 | correction |
| S04-C06 | Apache descends from NCSA HTTPd, a different NCSA program. It does not descend from Mosaic. | slides.txt slide 4 | correction |
| S04-C07 | NCSA HTTPd (1993, Rob McCool) was a server. It invented CGI. | slides.txt slide 5 | story |
| S04-C08 | McCool left in 1994. Development stalled. Webmasters traded patches by mail. | slides.txt slide 5 | story |
| S04-C09 | Apache (1995) continued that patch set as a project: "a patchy server". | slides.txt slide 5 | story |
| S04-C10 | Apache passed NCSA HTTPd in 1996. It stayed number one for twenty years. | slides.txt slide 5 | story |
| S04-C11 | From 1996 to 1999, IIS fought for a single-digit share. lighttpd and others arrived. | slides.txt slide 5 | story |
| S04-C12 | Apache 1.3 prefork forks a pool at startup. Setup leaves the request path. One process still parks on one connection. | slides.txt slide 6 | core |
| S04-C13 | Apache 2.0 worker MPM runs many threads per process. Each thread needs a stack. Linux pthreads were new and buggy in 1999 to 2002, and everyone was learning what "reentrant" means. | slides.txt slide 6 | detail |
| S04-C14 | Apache 2.4 event MPM parks idle keep-alives on epoll. A listener thread hands over a connection only when it has work. It is the default on Unix since 2.4. | slides.txt slide 6 | core |
| S04-C15 | All three Apache designs answered one question: how to make the per-connection worker cheaper. | slides.txt slide 6 | core |
| S04-C16 | CGI (1993) pays fork, exec, interpreter load, parse, run and exit on every request. | slides.txt slide 7 | core |
| S04-C17 | A servlet (1997) loads one time. Each request is a method call on a pooled thread. The object outlives the request. | slides.txt slide 7 | core |
| S04-C18 | J2EE (1999) made the multi-tier application server the default: web tier, EJB tier, database. | slides.txt slide 7 | story |
| S04-C19 | Connection pools do the same for the database handshake. Prefork, FastCGI, servlets and pools pay the setup one time. | slides.txt slide 7 | core |
| S04-C20 | Dan Kegel named the C10K problem in 1999: 10,000 concurrent connections on one box. | slides.txt slide 8 | story |
| S04-C21 | A Linux thread gets an 8 MB stack by default. 10,000 threads reserve about 80 GB of address space. | slides.txt slide 8, `02-thread/threadd.c` | detail |
| S04-C22 | FD_SETSIZE is 1024, fixed in a header. ulimit does not change it. | slides.txt slide 8, 14 | detail |
| S04-C23 | In 2002 the hardware was fast enough. The limits were a stack and a scheduler entry per connection, and a 1983 bitmap API. | slides.txt slide 8 | core |
| S04-C24 | Igor Sysoev worked at Rambler, a large Russian portal. Its Apache servers fell over under connection volume, not request volume. | slides.txt slide 9 | story |
| S04-C25 | Sysoev started nginx in 2002 to solve C10K. | slides.txt slide 9 | story |
| S04-C26 | First public release: 4 October 2004, the Sputnik anniversary. Version 1.0.0 came in April 2011. | slides.txt slide 9 | story |
| S04-C27 | The goal: 10,000 mostly idle connections in one process, with another program making dynamic content. So nginx is a reverse proxy. | slides.txt slide 9 | core |
| S04-C28 | An idle connection needs a few hundred bytes of state and a place in a list. It does not need a thread. | slides.txt slide 10 | core |
| S04-C29 | nginx runs one process per core, each with one event loop. No connection owns a thread or a process. | slides.txt slide 10 | core |
| S04-C30 | The master binds port 80, reads config, forks workers and handles signals. It never touches a connection. Workers never fork. | slides.txt slide 11, NGINX-TOUR.md Stop 1 | core |
| S04-C31 | Two helper processes: the cache manager evicts from the LRU. The cache loader warms the index. | slides.txt slide 11 | detail |
| S04-C32 | The nginx process count does not change under load. The forkd count does. Both call fork(). Only the frequency differs. | slides.txt slide 11, `01-fork/forkd.c` | core |
| S04-C33 | A reload starts new workers with the new config. Old workers stop accepting and finish their requests. No connection drops. | `07-nginx/nginx.conf` header | detail |
| S04-C34 | The master runs as root to bind port 80. The workers drop to an unprivileged user. | NGINX-TOUR.md Stop 1 | detail |
| S04-C35 | The loop: find the nearest timer, wait in epoll_wait, run accept events, release the mutex, expire timers, run other events. | slides.txt slide 12 | core |
| S04-C36 | The slide says a worker spends 99.9% of its life asleep in the second line of that loop. The figure is a teaching number, not a measurement. | slides.txt slide 12 | core |
| S04-C37 | The timer is an argument to the sleep. nginx never polls for timeouts. The nearest deadline is the leftmost rbtree node. | slides.txt slide 12, NGINX-TOUR.md Stop 2 | core |
| S04-C38 | Handlers do not run inside the poll. nginx posts them and drains the queues after. The tour gives two reasons: no deep recursion, and accept events stay ahead of read events. | slides.txt slide 12, NGINX-TOUR.md Stop 2 L116-118 | detail |
| S04-C39 | Everything in src/http is a callback that this loop reaches. | slides.txt slide 12 | detail |
| S04-C40 | accept_disabled = connection_n / 8 minus free_connection_n. Past 7/8 of its slots, a worker stops competing for new connections. | slides.txt slide 13 | core |
| S04-C41 | That balance needs no coordinator, shared counter, leader or heartbeat. Each worker decides from a number it already has. | slides.txt slide 13 | core |
| S04-C42 | accept_mutex is off by default since 1.11.3. EPOLLEXCLUSIVE (Linux 4.5+) and SO_REUSEPORT let the kernel spread connections. | slides.txt slide 13 | core |
| S04-C43 | In 2004 every worker woke for one new connection, a real problem. Later kernels solved it, so the userspace mutex lost its reason and turned into "dead weight". | slides.txt slide 13 | core |
| S04-C44 | nginx calls accept4 with SOCK_NONBLOCK: one syscall instead of accept plus fcntl. | NGINX-TOUR.md Stop 3 | detail |
| S04-C45 | multi_accept on drains the accept queue in one wakeup. Off takes one connection and goes back to the loop. | NGINX-TOUR.md Stop 3, `nginx.conf` events | detail |
| S04-C46 | select is O(watched). epoll is O(active). | slides.txt slide 14 | core |
| S04-C47 | The select watch list lives in your process, rebuilt on every call. The epoll list lives in the kernel. epoll_ctl edits it. | slides.txt slide 14 | core |
| S04-C48 | select costs O(n) to build, O(n) in the kernel and O(n) to scan. epoll costs O(ready events). | slides.txt slide 14 | core |
| S04-C49 | With 10,000 idle and 10 active, select does 30,000 units of work to find 10 events. epoll does 10. | slides.txt slide 14 | core |
| S04-C50 | ulimit -n does nothing for select and everything for epoll. | slides.txt slide 14 | core |
| S04-C51 | select works everywhere since 1983. epoll is Linux only. BSD has kqueue. | slides.txt slide 14 | detail |
| S04-C52 | Everything else in the comparison follows from one decision: who owns the watch list. | slides.txt slide 14 | core |
| S04-C53 | epoll_wait returns a batch. Handling event 1 can close the connection that event 7 points at. | slides.txt slide 15 | core |
| S04-C54 | A new client on the recycled descriptor then gets event 7. Every event-loop author writes this bug once. | slides.txt slide 15 | core |
| S04-C55 | nginx puts an instance flag in the low bit of the connection pointer. It flips the flag on reuse and skips mismatched events. | slides.txt slide 15 | core |
| S04-C56 | Structs are aligned, so the low bit of the pointer is always zero. The flag costs no memory and one branch. | slides.txt slide 15 | core |
| S04-C57 | epolld.c puts the connection pointer, not the fd, in the event data. It tracks reuse with a generation counter. | slides.txt slide 15, `04-epoll/epolld.c` | detail |
| S04-C58 | Level-triggered reports a ready fd on every wait. Edge-triggered reports a change once, so you read until EAGAIN. | `04-epoll/epolld.c` | detail |
| S04-C59 | flood.sh sends an unfinished request, so the server must hold each connection. Idle but open is the costly state. | `tools/flood.sh` | detail |
| S04-C60 | read plus write: 4 copies and 2 mode switches per chunk. Disk, page cache, your buffer, socket buffer, NIC. | slides.txt slide 16 | core |
| S04-C61 | sendfile: 2 copies, both DMA, and 0 mode switches per chunk. The data never enters your process. | slides.txt slide 16 | core |
| S04-C62 | sendfile removes the copy through your address space and the two mode switches per 64 KiB chunk. | slides.txt slide 16 | core |
| S04-C63 | Bytes you must touch (gzip, TLS, templates) must enter user space. So gzip and sendfile fight, and kTLS exists. | slides.txt slide 16 | core |
| S04-C64 | `sendfile on` is a permission, not an order. The static handler marks the buffer as a file. Later filters keep or break that mark. | NGINX-TOUR.md Stop 7 | detail |
| S04-C65 | TCP_CORK (tcp_nopush) sends the headers and the first body bytes in one segment. The nginx comment calls CORK and NODELAY mutually exclusive, so nginx clears NODELAY before it corks (kernel detail in section 6). | NGINX-TOUR.md Stop 7, `05-sendfile/sendfiled.c` | detail |
| S04-C66 | mmap removes the first copy and keeps the second. It adds page faults and a TLB shootdown at munmap. | `05-sendfile/sendfiled.c` | detail |
| S04-C67 | One sendfile call moves at most 0x7ffff000 bytes. nginx clamps to NGX_SENDFILE_MAXSIZE. | `05-sendfile/sendfiled.c` | detail |
| S04-C68 | 64 MB, loopback, the instructor laptop: read 37.4 ms and 2048 syscalls. mmap 23.3 ms and 4. sendfile 33.2 ms and 1. | slides.txt slide 17, README | measured |
| S04-C69 | On loopback sendfile does not win on wall time. There is no NIC and no DMA, and curl shares the CPU. | slides.txt slide 17 | correction |
| S04-C70 | On any machine, 2048 syscalls become 1, and 64 MB never enters the process. | slides.txt slide 17 | core |
| S04-C71 | The win is headroom under concurrency, not a faster single transfer. | slides.txt slide 17 | core |
| S04-C72 | A benchmark that does not model the bottleneck measures the wrong thing. | slides.txt slide 17 | core |
| S04-C73 | Squid (1996) is a forward proxy next to the clients. It caches for a campus and protects the uplink. | slides.txt slide 18 | story |
| S04-C74 | A reverse proxy sits next to the servers. It caches, routes, balances, falls back, terminates TLS and holds slow clients. | slides.txt slide 18 | core |
| S04-C75 | Same machinery, opposite side. The client does not configure a reverse proxy and usually cannot see it. So the proxy can do things the client would never agree to. | slides.txt slide 18 | core |
| S04-C76 | The slide names one feature that lists leave out: a reverse proxy "absorbs slow clients". The app does not serve a slow 2G phone itself. | slides.txt slide 18 | core |
| S04-C77 | Behind a proxy the app loses the client. Host and three X- headers carry it, and the app must trust them. | `07-nginx/nginx.conf` :8082 | detail |
| S04-C78 | `keepalive 32` in the upstream block pools backend connections. Without it, each request pays a new handshake. | `07-nginx/nginx.conf` :8082 | detail |
| S04-C79 | proxy_next_upstream retries the next server on error, timeout, 502 or 503. error_page shows down.html when all fail. | `07-nginx/nginx.conf` :8082, :8084 | detail |
| S04-C80 | Request time minus upstream time is the nginx cost: rt=2.001 against urt=2.000, one millisecond. Loopback, the upstream was forkd on :8001, which sleeps 2 s per request, the instructor run. | README L139-141, `nginx.conf` log_format, `forkd.c` L84 | measured |
| S04-C81 | The cache is two structures: an index in shared memory and the bodies in files on disk. | slides.txt slide 19 | core |
| S04-C82 | keys_zone=demo:10m is 10 MB of shared memory for the rbtree and LRU queue. It sizes the index, not the data. About 8,000 keys per MB. | slides.txt slide 19 | core |
| S04-C83 | The rbtree key is the MD5 of proxy_cache_key. | NGINX-TOUR.md Stop 8 | detail |
| S04-C84 | levels=1:2 spreads files over two directory levels. No directory holds a million files. | slides.txt slide 19 | detail |
| S04-C85 | max_size=100m is the disk ceiling. The cache manager evicts from the LRU tail to stay under it. | slides.txt slide 19 | core |
| S04-C86 | inactive=60s evicts an entry that nobody read for 60 s, whatever its TTL. It differs from proxy_cache_valid. | slides.txt slide 19 | core |
| S04-C87 | The slide reduces eviction to one check on the LRU tail: a young tail ends the pass, and an old tail that no client reads is deleted. The slide calls this "the entire eviction policy" (the code adds a second pass, section 7). | slides.txt slide 20 | core |
| S04-C88 | The check `count == 0` stops eviction of an object that a client downloads right now. | slides.txt slide 20 | core |
| S04-C89 | ngx_queue.h is about 50 lines of macros: an intrusive doubly linked list. The LRU and posted events use it. | slides.txt slide 20, 28 | detail |
| S04-C90 | proxy_cache_lock is the anti-stampede switch. The slide case: a popular object expires, and without the lock every request in the next 200 ms is a MISS that goes to the origin. With the lock, one request goes and the rest wait. It is off by default. The config comment scopes it to "a miss". | slides.txt slide 21, `nginx.conf` L172-175 | core |
| S04-C91 | proxy_cache_use_stale with error, timeout, updating and the 5xx codes serves a stale copy instead of an error. | slides.txt slide 21 | core |
| S04-C92 | With `updating`, one request refreshes the entry. Everyone else gets the stale copy at once. | slides.txt slide 21 | core |
| S04-C93 | Add X-Cache-Status from $upstream_cache_status to every cache config. Two curls show MISS, then HIT. | slides.txt slide 21 | detail |
| S04-C94 | Location precedence does not follow the order you wrote the blocks in. | slides.txt slide 22 | core |
| S04-C95 | An `=` location is an exact match. It wins at once and the search stops. | slides.txt slide 22 | core |
| S04-C96 | A `^~` location is a longest prefix that suppresses the regex search. | slides.txt slide 22 | core |
| S04-C97 | A `~` location is a regex. The first match in file order wins, not the longest. `~*` ignores case. | slides.txt slide 22, `nginx.conf` :8081 | core |
| S04-C98 | A plain prefix such as `location /` is used only if no regex matched. | slides.txt slide 22 | core |
| S04-C99 | On :8081, /exact gives 1, /images/a.php gives 2, /other/a.php gives 3, /anything gives 4. | slides.txt slide 22, README | core |
| S04-C100 | About half the room gets /images/a.php wrong. They expect the regex to win. | slides.txt slide 22 | story |
| S04-C101 | nginx has no .htaccess, so it does not stat() up the directory tree on every request. | slides.txt slide 22 | detail |
| S04-C102 | Prefix locations form a ternary search tree. nginx builds it at config parse time. The slide says the walk goes "one URI segment at a time" (the code splits on name prefixes, section 7). | slides.txt slide 23 | core |
| S04-C103 | Regex locations form a plain array, walked in order on every request. So 500 prefixes are cheap and 500 regexes are not. | slides.txt slide 23 | core |
| S04-C104 | The data structure is the documentation. A tree gives the longest match. An array gives the first match. | slides.txt slide 23, 35 | core |
| S04-C105 | Smooth WRR adds each weight to its current weight, picks the largest, then subtracts the total from the winner. | slides.txt slide 24 | core |
| S04-C106 | For weights 3:1, naive WRR gives a a a b. The slide says nginx gives a b a a. Same ratio, no bursts. | slides.txt slide 24 | core |
| S04-C107 | 24 requests on :8082: 6 to 127.0.0.1:8001 and 18 to 127.0.0.1:8004. Exactly 3:1, loopback, the instructor run. | slides.txt slide 24, README | measured |
| S04-C108 | The config weights :8004 at 3 and :8001 at 1, with max_fails=2 and fail_timeout=10s. :8003 is the backup. | `07-nginx/nginx.conf` | detail |
| S04-C109 | effective_weight climbs back up after a failure. That is passive health checking, with no probe traffic. | slides.txt slide 24, NGINX-TOUR.md Stop 9 | core |
| S04-C110 | Open-source nginx has no active health checks. NGINX Plus sells them. | NGINX-TOUR.md Stop 9 | detail |
| S04-C111 | `try_files $uri $uri/ /index.html?$args` asks: a real file? A real directory? If not, hand it to the app. | slides.txt slide 25 | core |
| S04-C112 | The last try_files entry is never tested. It is the fallback, not a candidate. | slides.txt slide 25, `nginx.conf` :8084 | core |
| S04-C113 | A named location such as @app is reachable only from try_files or error_page, never from a URL. | slides.txt slide 25 | core |
| S04-C114 | `try_files $uri @app` tries the disk first, then the upstream. | slides.txt slide 25 | core |
| S04-C115 | WordPress, Rails, Django and SPA routers are this directive plus an app that reads REQUEST_URI. | slides.txt slide 25 | core |
| S04-C116 | Line numbers drift. Function names do not. The return type sits on its own line, so a grep for the name at line start finds the definition. | slides.txt slide 26 | core |
| S04-C117 | The tour pins its line numbers to 1.31.5, commit 231a60ee. | slides.txt slide 26, NGINX-TOUR.md | detail |
| S04-C118 | src/core is the nginx standard library. The reason: nobody could rely on other libraries across platforms. The slide dates this "1999", which conflicts with slide 9 (section 7). | slides.txt slide 27 | detail |
| S04-C119 | src/event holds the loop and six wait modules: epoll, kqueue, select, poll, devpoll, eventport. ./configure picks one. | slides.txt slide 27 | detail |
| S04-C120 | src/http holds the HTTP state machine, phases and upstreams. src/os/unix holds the syscall layer. | slides.txt slide 27 | detail |
| S04-C121 | src/stream (TCP and UDP) and src/mail repeat the same design. Three protocol trees share one core. | slides.txt slide 27 | core |
| S04-C122 | nginx does not free per-request memory. It allocates from a pool tied to the request and destroys the pool at the end. | slides.txt slide 28 | core |
| S04-C123 | Pools give no refcounting, no leak class, no free() on the hot path and almost no cleanup branches. | slides.txt slide 28 | detail |
| S04-C124 | Each of the 100+ modules has four parts: a directive table, config callbacks, module glue, and handlers in a phase. The callbacks are eight functions that create and merge configs, and merge_loc_conf decides what a location inherits from its server. | NGINX-TOUR.md, "How to read any module" L535-544 | core |
| S04-C125 | Two greps lead from a directive to its code. The directive gives the struct field. The field gives the reader. | NGINX-TOUR.md, "How to read any module" | detail |
| S04-C126 | Ten stops pair nginx functions with repo programs, from the process model to FastCGI records. | slides.txt slide 29 | detail |
| S04-C127 | The HTTP parser is a resumable state machine, with 27 states for the request line alone. | slides.txt slide 30 | core |
| S04-C128 | It uses no regex, no strtok, no substring and no allocation. It reads one byte at a time and can stop anywhere. | slides.txt slide 30 | core |
| S04-C129 | r->state survives between calls, because the request line can arrive in three TCP segments. | slides.txt slide 30 | core |
| S04-C130 | That is the source-level cost of non-blocking I/O. A thread-per-connection server can simply block until the blank line. | slides.txt slide 30, NGINX-TOUR.md Stop 5 | core |
| S04-C131 | Method dispatch switches on length, then compares four bytes as one machine word. No strcmp. | NGINX-TOUR.md Stop 5 | detail |
| S04-C132 | An oversize request header becomes 414 or 400 in the large-buffer function. Moving the buffer means moving every parsed pointer. | NGINX-TOUR.md Stop 5 | detail |
| S04-C133 | Eleven phases: POST_READ, SERVER_REWRITE, FIND_CONFIG, REWRITE, POST_REWRITE, PREACCESS, ACCESS, POST_ACCESS, PRECONTENT, CONTENT, LOG. | slides.txt slide 31 | core |
| S04-C134 | The phase engine is a four-line loop. The slide says its return means suspended, not done, and calls it "a coroutine, hand-rolled, in C". The request resumes at the same phase later. The code adds a second case, section 7. | slides.txt slide 31 | core |
| S04-C135 | limit_req runs in PREACCESS, auth_basic in ACCESS, try_files in PRECONTENT. proxy_pass, fastcgi_pass and static run in CONTENT. | slides.txt slide 31 | core |
| S04-C136 | A grep for the phase handler arrays maps which module runs when. It answers "why did my directive not fire". | slides.txt slide 31 | detail |
| S04-C137 | A FastCGI record is an 8-byte header, then content, then padding. The header holds version, type, request id, length, padding length, reserved. Session 3 owns this (S03-C97). | slides.txt slide 32 | detail |
| S04-C138 | `01 01 00 01 00 08 00 00` opens a BEGIN_REQUEST: version 1, type 1, request 1, 8 content bytes. Session 3 owns this (S03-C99). | slides.txt slide 32, NGINX-TOUR.md Stop 10 | detail |
| S04-C139 | An empty PARAMS record ends the parameters. An empty STDIN ends the body. There is no other end signal. Without the empty record, the responder waits forever. Session 3 owns this (S03-C94, S03-C104). | slides.txt slide 32, `fcgi_client.c` L126-127 | detail |
| S04-C140 | FastCGI uses both framing rules: a length in each header and an empty record between streams. Session 3 owns this (S03-C163). | slides.txt slide 32, `fastcgi.h` | detail |
| S04-C141 | nginx hardcodes request id 1, one request per connection. FastCGI itself supports multiplexing. | NGINX-TOUR.md Stop 10, `fastcgi.h` | detail |
| S04-C142 | The FastCGI request builder computes the size first, allocates one time, then fills. No realloc. | NGINX-TOUR.md Stop 10 | detail |
| S04-C143 | A FastCGI name or value length under 128 takes one byte. A longer length takes four bytes with the top bit set. | `06-fastcgi/fastcgi.h` | detail |
| S04-C144 | The ladder: 01-fork, 02-thread, 03-select, 04-epoll, 05-sendfile, 06-fastcgi, 07-nginx. | slides.txt slide 33 | core |
| S04-C145 | 02-thread prints its 8 MB stack, with the default `ulimit -s` of 8192 KiB. 03-select dies at fd 1024. 04-epoll holds 5,000 connections with no change. The last two used `ulimit -n 65536` and `tools/flood.sh` over loopback (127.0.0.1), the instructor run. | slides.txt slide 33, README L26, `flood.sh` L11, `threadd.c` L13-14 | measured |
| S04-C146 | The repo is about 1,200 lines and nginx about 200,000. The difference is every error path. | slides.txt slide 33 | core |
| S04-C147 | Idea 1: ask the other question. If everyone improves the same part, look one level higher. Apache tuned the worker, and nginx asked why the worker existed. | slides.txt slide 35 | core |
| S04-C148 | Idea 2: check whether the constraint still exists. Goroutines and virtual threads brought thread-per-connection back. | slides.txt slide 35 | core |
| S04-C149 | Idea 4: amortize the setup. Prefork, pre-thread, servlets, pools, FastCGI and upstream keepalive are one move. | slides.txt slide 35 | core |
| S04-C150 | Next session: where did all the state go? Sessions, sticky routing, TLS termination, shared caches. | slides.txt slide 36 | story |
| S04-C151 | forkd reaps children with waitpid and WNOHANG in a loop, because signals merge. Without that handler, zombies pile up. | `01-fork/forkd.c` | detail |
| S04-C152 | A goroutine starts at 2 KiB. STACK=65536 shrinks a pthread stack to 64 KiB, and VSZ drops. | `02-thread/threadd.c`, README | detail |
| S04-C153 | nginx allocates all worker_connections structs at startup. No connection malloc happens on the request path. | `04-epoll/epolld.c`, `nginx.conf` events | detail |
| S04-C154 | `worker_processes auto` means one worker per core. `worker_connections 4096` counts per worker. | `07-nginx/nginx.conf` | detail |
| S04-C155 | open_file_cache keeps the open fd, the stat result and the directory lookup off the request path. | `07-nginx/nginx.conf` :8080 | detail |
| S04-C156 | ngx_select_module.c and ngx_epoll_module.c have the same function signature and the same job, about 200 lines each. Read them side by side. | slides.txt slide 14 | detail |
| S04-C157 | The slide sums up servlets and J2EE: the main goal was to stop creating a new process. The rest followed from that goal. | slides.txt slide 7 | core |
| S04-C158 | The instructor's children ask why chemistry needs names and dates. His answer: the order matters more than the names, because it shows each limit and its fix. | slides.txt slide 3 | story |
| S04-C159 | Running out of descriptors (EMFILE) is "C10K wall #2". epolld logs it and stops accepting for that loop turn. Its note about nginx is wrong (section 7). | `04-epoll/epolld.c` L152-158 | detail |
| S04-C160 | Port 8083 sends every request to fcgi_responder on 127.0.0.1:9000 with fastcgi_pass. Its fastcgi_param lines become PARAMS records. Try `curl :8083/hello?a=1`. | README L106, L113, `nginx.conf` L212-233 | detail |
| S04-C161 | The responder prints every record it receives. That printout and ngx_http_fastcgi_process_record() are "the same state machine written twice". | `nginx.conf` L233-236, `fcgi_responder.c` L73-74 | detail |
| S04-C162 | fcgi_responder is "what php-fpm is, minus PHP": one long-lived process that never forks, never execs and never parses HTTP. | `fcgi_responder.c` L8-10 | detail |
| S04-C163 | CGI pays "~5-20 ms" of setup per request and FastCGI "~0 ms". These are instructor estimates. No run in the sources measures them. | `fcgi_responder.c` L12-17 | detail |
| S04-C164 | The app answers with STDOUT records that carry CGI-style headers, a blank line and the body. An empty STDOUT record ends the stream, then END_REQUEST ends the request. Session 3 owns this (S03-C90). | `fcgi_responder.c` L142-152, `fcgi_client.c` L135-169 | detail |
| S04-C165 | Padding to an 8-byte boundary is a SHOULD in the spec. A sender can send zero padding. nginx sends aligned records. | `fcgi_responder.c` L43-45 | detail |
| S04-C166 | nginx sets the keep_conn flag only with `fastcgi_keep_conn on`. It sends a request body in STDIN records of about 64 KiB. | `fcgi_client.c` L93-94, L130-132 | detail |
| S04-C167 | sendfile is truly zero-copy, page cache to NIC, only on a NIC with scatter-gather DMA and checksum offload. The wall-clock win needs such a NIC and shows at 10,000 concurrent clients. | `sendfiled.c` L29-31, L55-59, README L91-93, NGINX-TOUR.md Stop 7 L379-381 | core |
| S04-C168 | Without madvise, mmap loses to read, because the kernel faults one page at a time. So sendfiled calls madvise with MADV_SEQUENTIAL and MADV_WILLNEED. | `sendfiled.c` L122-124 | detail |
| S04-C169 | The nginx listen backlog defaults to 511. | `common.h` L48-49 | detail |
| S04-C170 | tcp_nopush (TCP_CORK) matters only together with sendfile. | `nginx.conf` L82-83 | detail |
| S04-C171 | close() removes a descriptor from the epoll set, unless a dup() of it stays open. So epolld calls EPOLL_CTL_DEL before close. | `epolld.c` L83-85 | detail |
| S04-C172 | ngx_http_fastcgi_process_record() is a byte-at-a-time DFA with nine states: st_version, st_type, st_request_id_hi, st_request_id_lo, st_content_length_hi, st_content_length_lo, st_padding_length, st_reserved, st_data. | NGINX-TOUR.md Stop 10 L482-489 | detail |
| S04-C173 | About 900 lines of buffer-chain code exist so that the one sendfile(2) line gets the right arguments. | NGINX-TOUR.md Stop 7 L357-359 | detail |
| S04-C174 | `$upstream_cache_status` takes the values HIT, MISS, EXPIRED, STALE, UPDATING, BYPASS and REVALIDATED. | `nginx.conf` L181-182 | detail |
| S04-C175 | On :8082 the cache key is `$scheme$request_method$host$request_uri`. proxy_cache_valid keeps 200 and 302 for 10 s and 404 for 1 min. | `nginx.conf` L169-171 | detail |

## 4. Instructor questions

No Session 4 item is graded. The homework on slide 34 is practice. The Session 5 assignment and project stay out of this file, except for concept links in s04-m11 and s04-m13. Session 3 already maps four code-comment exercises from this repo: the forkd hold-open and zombies (S03-Q09), the threadd counter (S03-Q10), the select guard (S03-Q11) and the responder process count (S03-Q12). Session 4 modules link to them.

| ID | The question | Model answer outline |
|---|---|---|
| S04-Q01 | Why does the master run as root and the workers as an unprivileged user? What does the split buy when a worker is compromised? (NGINX-TOUR.md Stop 1) | A port below 1024 needs root. Only the master binds, and it binds before it forks. The master also reads the config, opens the logs and reloads. The workers only serve traffic, so they need no privilege. A compromised worker runs as the `user` account (default `nobody`). It cannot rewrite the config, bind new low ports, or read root-only files. The master survives and starts a new worker. The damage stays inside one unprivileged process. Limit: fork copies memory, so a worker still holds what the master loaded, such as TLS private keys. |
| S04-Q02 | What does the accept mutex cost when it is on? What does SO_REUSEPORT cost when one worker is slow? (NGINX-TOUR.md Stop 2) | Mutex on: each loop turn tries a shared-memory lock. The winner adds the listen sockets to its epoll set. A loser removes them. Each hand-over costs epoll_ctl calls. A loser caps its sleep at `accept_mutex_delay`, 500 ms by default. A burst can wait on one busy holder. SO_REUSEPORT: each worker has its own listen socket and accept queue. The kernel hashes each new connection to one queue. A slow or blocked worker keeps the connections in its own queue. Those clients wait while other workers sit idle. That shows up as tail latency. |
| S04-Q03 | multi_accept: drain the whole accept queue in one wakeup, or take one connection? What happens to the latency of the other connections? (NGINX-TOUR.md Stop 3) | On: one wakeup accepts the whole burst. Fewer loop turns, and new clients connect sooner. Cost: the worker spends that turn on accepts. Its existing connections wait for the next turn. One worker can also grab most of a burst. Off: one accept, then back to the loop. Existing connections get served between accepts. More wakeups under a burst. The repo config sets it off. nginx ignores the directive with kqueue, which reports the queue length itself. |
| S04-Q04 | Why is the low bit of the connection pointer always free? What breaks if a connection struct sits at an odd address? (NGINX-TOUR.md Stop 4) | The connection struct starts with pointers. On a 64-bit machine its alignment is 8 bytes, so every valid address is a multiple of 8. nginx allocates all connection structs as one malloc array. malloc returns memory aligned for any standard type. At an odd address, the mask with `~1` changes the real address. The pointer then lands one byte before the struct. The code then reads a garbage fd and a garbage instance flag. Result: a crash, or an event for the wrong client. Extension: one bit tells apart only two generations. A full counter, as in epolld.c, has no such limit. |
| S04-Q05 | What is the largest URL nginx accepts, and where does that number live? (NGINX-TOUR.md Stop 5) | Default: the whole request line must fit in one 8 KB buffer, from `large_client_header_buffers 4 8k`. A longer line gets 414. One header field longer than one buffer gets 400. nginx first reads into `client_header_buffer_size` (1k) and moves to a large buffer on demand. The code: the large-buffer function in `src/http/ngx_http_request.c`. The default: the server config merge in `ngx_http_core_module.c`. |
| S04-Q06 | proxy_cache_valid is 10s and inactive is 60s. Which one wins, and what does each mean? (slides.txt slide 19, NGINX-TOUR.md Stop 8) | proxy_cache_valid 10s is freshness. For 10 s after storage, nginx serves the copy without asking the origin. inactive=60s is existence. An entry that nobody reads for 60 s disappears, fresh or stale. Neither wins. They answer different questions. A hot object refreshes every 10 s and never reaches the inactive limit. A cold object goes stale at 10 s, stays on disk, and disappears 60 s after its last read. The gap between the two is the stale copy that proxy_cache_use_stale can serve when the origin fails. If inactive were shorter than valid, an idle object would disappear while still fresh. |
| S04-Q07 | Three app servers. One is 10x slower but still returns 200. What does round robin do? What does least_conn do? Which one lies, and where does Little's law come in? (NGINX-TOUR.md Stop 9) | Round robin keeps sending the slow server its share. Those requests take 10x longer, so p99 becomes the slow latency. Passive health checks never fire, because 200 is a success. The request counts look even. Round robin is the one that lies. Little's law: connections held = request rate × latency. At the same rate, the slow server holds 10x the connections. least_conn reads that connection count, so it sends the slow server fewer new requests. Little's law also sets the ceiling. If total demand is more than total capacity, no balancer fixes it. |
| S04-Q08 | Why does nginx decline FastCGI multiplexing? (NGINX-TOUR.md Stop 10) | On a shared connection, one slow response stalls the others: head-of-line blocking. One request per connection plus `keepalive` in the upstream block saves most of the setup cost without coupling requests. The same argument returns in Session 5, HTTP/2 against HTTP/3. |
| S04-Q09 | Predict all four answers on :8081 before you press enter. (slides.txt slide 22) | /exact gives 1. The exact match stops the search. /images/a.php gives 2. The longest prefix has `^~`, so no regex runs. /other/a.php gives 3. The longest prefix is `/` without `^~`, and the regex matches. /anything gives 4. No regex matches, so the remembered prefix `/` wins. |
| S04-Q10 | Your origin is down and you have a copy from four minutes ago. A slightly old page or a 502? (slides.txt slide 21) | Most users want the old page. proxy_cache_use_stale serves it. Good fit: news, product pages, static assets. Bad fit: data that must be current, such as balances, stock counts and access decisions. There a 502 is honest. The stale copy must still exist, so `inactive` must not delete it first. |
| S04-Q11 | Who is allowed to set X-Forwarded-For? (`07-nginx/nginx.conf` :8082) | Anyone. A client can send the header with any value. `$proxy_add_x_forwarded_for` appends the peer address to what the client sent. Only the entries that your own proxies added are trustworthy. A rate limit or an audit log that reads the leftmost value trusts the attacker. Fix: the edge proxy overwrites the header with the peer address. Or the realip module accepts it only from listed proxies. |
| S04-Q12 | Which of your rules are laws, and which are 2004? (slides.txt slide 3, 35) | A law has a constraint that still holds: the select bitmap in glibc, round trips bound by distance, Little's law. A habit outlived its constraint: accept_mutex after EPOLLEXCLUSIVE, the RFC 2616 two-connection rule, "never one thread per connection" after 2 KiB goroutines. Test: name the constraint. Then check if it still holds on your kernel and hardware. |
| S04-Q13 | Homework 1: break select, then fix it. (slides.txt slide 34, NGINX-TOUR.md Homework 1) | With the guard, the log line appears at fd 1024. Descriptors 0 to 3 are stdin, stdout, stderr and the listener, so about 1,020 clients fit. Without the guard, FD_SET writes past the end of the fixed fd_set. That is undefined behavior. Expect a crash or silent memory damage. A fortified glibc build can abort instead. The two sentences: fd_set is a bitmap with a width fixed at compile time. The ulimit setting only permits higher descriptor numbers, which makes the overflow reachable, not safe. At 5,000, epolld is different: the kernel holds the interest list, with no bitmap. Only ulimit -n and memory limit it. The flood client also needs a raised ulimit. |
| S04-Q14 | Homework 2: find the sendfile decision. (slides.txt slide 34, NGINX-TOUR.md Homework 2) | Path in 1.31.5: the `sendfile` directive sets a flag in the location config. The location update function copies it to the connection. The static handler builds a buffer that points at the file. The output filter chain passes it down. The copy filter keeps the file buffer as it is. The write filter calls the connection send function, which is `ngx_linux_sendfile_chain`, then `ngx_linux_sendfile`, then sendfile(2). With `gzip on`, the gzip header filter asks for the bytes in memory, but only when gzip applies. The client must send `Accept-Encoding: gzip`, the type must be in gzip_types (text/html by default), and the body must reach gzip_min_length (20 bytes). Plain curl sends no Accept-Encoding, so it still shows sendfile. Use `curl --compressed localhost:8080/index.html`. The copy filter then reads the file. strace shows pread64 and writev, no sendfile. Answer: the gzip filter takes sendfile away, and the copy filter does the read. |
| S04-Q15 | Homework 3: speak FastCGI to a real php-fpm. (slides.txt slide 34, NGINX-TOUR.md Homework 3) | php-fpm opens the file in SCRIPT_FILENAME. fcgi_client passes the URI there, so pass an absolute path to a real script. In `tcpdump -X`, find `01 01 00 01 00 08 00 00` at the start of the payload. nginx sends every configured `fastcgi_param`, plus each client header as an HTTP_ name. The client in the repo sends 11 fixed pairs. The stock `fastcgi_params` file adds names such as DOCUMENT_ROOT, REMOTE_PORT, SERVER_NAME and REDIRECT_STATUS. Why: these are the CGI/1.1 variables. The app rebuilds the request from them. |
| S04-Q16 | Homework 4: make round robin lie to you. (slides.txt slide 34, NGINX-TOUR.md Homework 4) | Note: forkd already sleeps 2 s per request, which is why the log shows rt=2.001. Round robin still sends the slow server its weight share. If it has weight 1, one request in four waits the full sleep, so p99 equals the sleep. With `proxy_read_timeout 10s`, a 10 s sleep can turn into timeouts and retries. least_conn helps only when requests overlap. Sequential curls keep every count at 0 or 1, so least_conn cannot see the slow server. Little's law example: 10 requests per second, a one-quarter share, 10 s latency. 2.5 × 10 = 25 connections on the slow server. `ss -tn \| wc -l` also counts a header line and other sockets, so expect a few more. |
| S04-Q17 | Homework 5: read the try_files module end to end. (slides.txt slide 34, NGINX-TOUR.md Homework 5) | For each argument except the last, nginx builds a path under root. It reserves the path buffer in the request pool and grows it only when needed. It then does a stat through the open file cache, and compares "is a directory" with the trailing slash. For a missing URI, `$uri` and `$uri/` both miss. For the last argument, the loop sees the end marker next and never checks the file. It splits off `?$args` and makes an internal redirect to /index.html. The redirect restarts location search. After 10 URI changes, nginx gives 500. Why the last is never tested: it is the answer when nothing matched. It can be a URI, a named location or `=404`, and none of those must be a file. The file has 419 lines in 1.31.5, not 390. |
| S04-Q18 | Comment out the SIGCHLD handler in forkd and flood it. Why do zombies appear? (`01-fork/forkd.c`) | A dead child stays a zombie until the parent waits for it. Nobody waits, so each finished request leaves a defunct entry. Each zombie holds a PID and counts toward the user process limit (RLIMIT_NPROC). Enough zombies make fork fail with EAGAIN. man 2 wait calls this a slot in the kernel process table. On Linux, pid_max, threads-max and RLIMIT_NPROC bound that table, not a fixed array. The handler loops on waitpid with WNOHANG, because several SIGCHLD signals can merge into one. |
| S04-Q19 | Add a request counter to threadd without a mutex. Why is the total wrong? (`02-thread/threadd.c`) | `counter++` is read, add, write. Two threads interleave and lose updates, so the total comes out low. Fix: a mutex or an atomic add. threadd uses an atomic add for its live-thread count. |
| S04-Q20 | Run epolld with EDGE=1. What changes in strace? (`04-epoll/epolld.c`) | Edge mode reports "became readable" one time. epolld then reads until EAGAIN, so strace shows an extra read that returns EAGAIN. Level mode reports the fd again on each wait while data remains. In edge mode, a reader that stops early never hears about the rest of the data. The connection hangs. |
| S04-Q21 | Turn sendfile off on :8080 and diff `strace -c -p <worker>`. (`07-nginx/nginx.conf` :8080) | sendfile on: sendfile(2) calls carry the body. sendfile off: pread64 calls plus writev calls carry the body. The config comment says read(2), but nginx reads files with pread. |
| S04-Q22 | Stop all three upstreams and watch error_page fire. (`07-nginx/nginx.conf` :8084) | `curl -i localhost:8084/maybe/x` misses on disk, goes to @app, and cannot connect. nginx makes a 502. error_page maps it to /down.html, and the status stays 502. `internal` blocks a direct request to /down.html. The page says nginx is still up. |
| S04-Q23 | Why are 500 prefix locations free and 500 regex locations not? (slides.txt slide 23) | nginx builds the prefix tree one time, at config parse. Each level is a balanced binary tree over sorted location names, so a lookup makes about log2 n compares per level, not 500. A level ends at a shared name prefix, not at a `/`. Regex locations sit in an array. A request runs each regex in order until one matches, so the cost grows with the count. |
| S04-Q24 | Explain the flat sendfile number instead of hiding it. (slides.txt slide 17, NGINX-TOUR.md Stop 7) | Loopback has no NIC and no DMA. The kernel copies into the receiver buffer in every mode. curl runs on the same CPU. Memory bandwidth bounds all three modes. Show what slide 17 calls real on any machine: the syscall count (2048 to 1), and 64 MB that never enters the process. Or run it across a LAN with a real NIC. Do not promise a system CPU drop: the instructor table shows sys flat too (section 7). |
| S04-Q25 | Pick a directive and follow it to its code with two greps. (NGINX-TOUR.md, "How to read any module") | `grep -rn '"sendfile"' src/` lands in the core module command table. The entry names the setter and the struct field `sendfile`. `grep -rn "clcf->sendfile" src/` lands in `ngx_http_update_location_config`, where the flag reaches the connection. |
| S04-Q26 | Force `use select;` in the events block and re-run the flood. (`07-nginx/nginx.conf` L29-31) | As written, nginx does not start, so the flood never runs. On Linux, configure builds the select module only with `--with-select_module`, because epoll exists. Without it, `use select;` fails with `invalid event type "select"`. With it, the config check fails: `worker_connections 4096` is more than FD_SETSIZE, and nginx stops with "the maximum number of files supported by select() is 1024". To feel 03-select again: build with the module, set `worker_connections 1024` or lower and `worker_processes 1`, and flood. Near descriptor 1024 the error log shows "maximum number of descriptors supported by select() is 1024", or "worker_connections are not enough" first. Several workers split the flood, so no worker reaches descriptor 1024. |
| S04-Q27 | Kill the forkd parent while children serve. What keeps working? (`01-fork/forkd.c` L14) | Each child owns one accepted connection and needs nothing from the parent. So the requests in flight finish: "Nobody is in charge." New clients fail, because each child closed its copy of the listening socket, and the last copy closed with the parent. init (or a subreaper) adopts and reaps the children. Contrast nginx: its master also never touches a connection, but the workers hold the listening sockets. A worker whose master dies closes the control channel and keeps running (beyond the slides). |

## 5. Modules

### s04-m01-history

- **Title:** Ten years of making the worker cheaper.
- **Minutes:** 18.
- **Big idea:** Every server design from 1990 to 2002 answered one constraint, and every one tried to make the per-connection worker cheaper.
- **Covers:** S04-C03, S04-C04, S04-C05, S04-C06, S04-C07, S04-C08, S04-C09, S04-C10, S04-C11, S04-C12, S04-C13, S04-C14, S04-C15, S04-C16, S04-C17, S04-C18, S04-C19, S04-C149, S04-C151, S04-C157, S04-C158.
- **Prereqs:** s03-m01-threads-and-fork, s03-m04-cgi, s03-m05-fastcgi-servlets, s03-m08-in-the-wild.
- **Threads:** T-law-or-habit, T-setup-off-path.
- **Session 3 owns these repo comments (link, do not teach again):** zombies (S03-C15), fork EAGAIN at RLIMIT_NPROC (S03-C16, `forkd.c` L62-63), copy-on-write RSS (S03-C18, `forkd.c` L13), STACK and ThreadStackSize (S03-C23, `threadd.c` L17-18), NLWP (S03-C24, `threadd.c` L11-12), threads count against RLIMIT_NPROC (S03-C26, `threadd.c` L94-95), goroutines 4,000 times cheaper (S03-C28, `threadd.c` L26).

**Pretest.**
1. What was Mosaic? *Answer: a browser, from NCSA, 1993.*
2. When does Apache prefork call fork()? *Answer: at startup, to fill a pool. Not per request.*
3. How many times does a servlet container create a servlet object? *Answer: one time. Each request is a method call.*

**Rung 1, the picture.** A restaurant grows busy. First it hires a new waiter for each guest who walks in (CGI, fork per request). Then it hires a team of waiters before opening (prefork). Then the waiters share one locker room and one uniform (threads share a process), but each waiter still stays at one table. Last, a host seats resting guests in the lobby and calls a waiter only when a guest wants to order (event MPM). Each step makes a waiter cheaper. Nobody asks whether a resting guest needs a waiter at all. *Where it breaks:* a waiter costs a salary. A process costs memory, a scheduler slot and a switch. The lobby is epoll, and a restaurant has nothing like a kernel ready list.

**Rung 2, how it works.**
1. 1990: CERN httpd runs on a NeXT. 1993: NCSA HTTPd adds CGI, and Mosaic, a browser, makes the web popular.
2. 1994 to 1995: McCool leaves NCSA. Webmasters share patches, and Apache grows out of them.
3. CGI pays fork, exec and interpreter startup on every request.
4. Prefork moves fork to startup, but one process still waits on one connection.
5. The worker MPM uses threads, but each thread still needs a stack.
6. Servlets and connection pools pay the setup one time, in a long-lived process.
7. The event MPM parks idle connections on epoll and wakes a thread only for work.

**Rung 3, the real thing.** Slide 5 gives the lineage table. Slide 6 gives the three MPMs. Slide 7 compares two lifecycles. CGI runs fork, exec, load, parse, run and exit on each request. A servlet says "instantiate once", then runs a `service(req, res)` method call per request. `01-fork/forkd.c` is the fork-per-client model in 94 lines. `02-thread/threadd.c` is the thread-per-client model and prints its own stack size.

**Rung 4, exam depth.**
- *The correction (S04-C04 to S04-C06).* The myth says Berners-Lee wrote Mosaic and Mosaic became Apache. Three different programs are involved. Two came from NCSA, and one of those two was a browser.
- *Prefork still parks.* Prefork removes fork from the request path (S04-C12). It does not remove the idle wait. A keep-alive client holds a whole process while it reads a page.
- *One question, three answers.* All three MPMs make the worker cheaper (S04-C15). The event MPM is the nginx idea arriving inside Apache, about 8 years after nginx shipped.
- *Law or habit.* Each design fixed a real constraint of its year (S04-C03). The rule "fork per request is fine" was a law in 1993, when traffic was small. It became a habit by 1999. "The story" box tells the chemistry anecdote from slide 3 (S04-C158).
- *Same move everywhere.* Prefork, FastCGI, servlets and pools all pay setup one time (S04-C19). Slide 7 says the main goal was to stop creating a process (S04-C157). Session 3 named the move. Slide 35 names it again as idea 4, with upstream keepalive (S04-C149).
- *Reaping (S04-C151).* forkd reaps children in a WNOHANG loop. Session 3 teaches why (S03-C15), and S04-Q18 asks what happens without it.

**Misconceptions.**
- S04-M01: "Mosaic was the first web server and became Apache." Wrong. Mosaic was a browser. Apache came from NCSA HTTPd. Distractor in check 1.
- S04-M02: "Apache prefork forks a new process for each request." Wrong. It forks a pool at startup. Distractor in check 2.
- S04-M03: "A servlet container builds a new servlet object for each request." Wrong. The object lives for the whole run. Distractor in check 4.

**Diagrams.** Static: a timeline from 1990 to 2004. Each card shows the design, the constraint it answered, and the cost it kept. Step-by-step: the four waiter pictures next to the four process trees (CGI, prefork, worker, event).

**Interactives.** *History timeline.* Inputs: click a design card. The learner sees the constraint it answered, the cost it kept, and the next design that removed that cost. The learner discovers that every step until nginx kept one worker per connection. Priority P1.

**Predict, observe, explain.** Command: `make run-fork`, then three parallel `curl localhost:8001/ &`, then `ps -o pid,ppid,rss,vsz,comm -C forkd`. Predict: how many forkd processes appear during the 2-second sleep? Observe: 4, one parent plus three children with the parent as PPID. The output comes from a local run. The code comment in `forkd.c` describes it. The sources hold no captured output.

**Worked example.** Fork per connection, 5 requests in flight. Processes: 1 parent + 5 children = 6. When the requests finish, 5 children exit, and the count returns to 1.

**Faded example.** A prefork pool of 8 children with 5 requests in flight. Processes: 1 parent + ____ children = ____. Idle children: ____. *(8, 9, 3.)*

**Your turn.** CGI under a prefork server with 8 children, 5 requests in flight. How many new processes does CGI create for those 5 requests? *(5. Each request forks and execs its own CGI program.)*

**Checks.**
1. `mcq`: Which program was the first web server? Answer: CERN httpd. Distractors: Mosaic (S04-M01), Apache (S04-M01). Feedback: Mosaic was a browser, and Apache came five years later.
2. `mcq`: When does Apache 1.3 prefork call fork()? Answer: at startup, to fill a pool. Distractor: for every request (S04-M02). Feedback: prefork moves the fork off the request path. One process still waits on one connection.
3. `order`: CERN httpd, NCSA HTTPd with CGI, Apache project, Apache passes NCSA, J2EE. Answer: that order, 1990, 1993, 1995, 1996, 1999.
4. `mcq`: A servlet handles 1,000 requests. How many servlet objects exist? Answer: one. Distractor: 1,000 (S04-M03). Feedback: the object outlives the request.
5. `recall`: What single question did prefork, worker and event MPM all answer? Answer: how to make the per-connection worker cheaper.

**Review cards.**
- Q: What was Mosaic? A: an NCSA browser, 1993.
- Q: Apache descends from which program? A: NCSA HTTPd.
- Q: What does the event MPM do with an idle keep-alive connection? A: parks it on epoll.
- Q: What does a servlet pay per request? A: one method call on a pooled thread.
- Q: What does CGI pay per request? A: fork, exec, interpreter load, parse, run, exit.

### s04-m02-the-nginx-question

- **Title:** Why is there a worker per connection at all?
- **Minutes:** 15.
- **Big idea:** nginx did not make the worker cheaper. It saw that an idle connection needs a few hundred bytes and a list entry, not a thread.
- **Covers:** S04-C02, S04-C20, S04-C21, S04-C23, S04-C24, S04-C25, S04-C26, S04-C27, S04-C28, S04-C29, S04-C147, S04-C148, S04-C152.
- **Prereqs:** s04-m01-history, s03-m07-limits, s03-m02-select.
- **Threads:** T-law-or-habit, T-watch-list, T-littles-law.

**Pretest.**
1. In 2002, was the hardware or the software the C10K limit? *Answer: the software.*
2. epolld reserves one slot per possible descriptor at startup. How much address space does that table take? *Answer: 65,536 × 4,632 B = 289.5 MiB, whatever the connection count.*
3. What does an idle connection need? *Answer: a small state record and a place in a list.*

**Rung 1, the picture.** A hotel has 10,000 guests. The old hotel puts a butler outside every door all night, although most guests sleep. nginx puts one clerk on each floor in front of a board of call lights. A guest presses a button only when they need something. The clerk handles that light and goes back to the board. *Where it breaks:* a clerk handles one light at a time. One slow job, such as a long disk read, stalls every guest on that floor. So nginx hands slow work to other programs, and later to thread pools.

**Rung 2, how it works.**
1. A thread per connection pays a stack, a scheduler entry and context switches, even when the client is silent.
2. Most web connections are idle: slow networks, keep-alive, users who read a page.
3. nginx stores each connection as a small record.
4. The kernel tells nginx which connections have data (epoll).
5. One worker process per core runs a loop over those ready connections.
6. Dynamic content goes to another program, so nginx stays a proxy.

**Rung 3, the real thing.** Slide 8 gives the three numbers: 10,000 connections, 8 MB per thread, 1024 descriptors. Slide 10 gives the reframing. `02-thread/threadd.c` prints the default stack and multiplies it by 10,000. `04-epoll/epolld.c` keeps one fixed struct per descriptor: `sizeof(struct conn)` is 4,632 bytes, because it embeds a 4,096-byte read buffer and a 512-byte write buffer. It allocates 65,536 of them at startup and writes the fd field of each one (L110-113). Session 3 owns the thread stack arithmetic (s03-m01).

**Rung 4, exam depth.**
- *Ask the other question (S04-C147).* A decade of Apache work tuned the worker. The jump came from removing it.
- *Why a proxy.* The goal was many idle connections in one process (S04-C27). Heavy work would block the loop, so nginx sends it elsewhere. That choice made nginx a reverse proxy.
- *Law or 2004 (S04-C148).* Thread per connection died because a thread cost 8 MB and a context switch. A goroutine starts at 2 KiB (S04-C152), so Go brought the style back. The constraint moved, so the rule changed.
- *Little's law link.* Connections held = request rate × time per request. Slow clients raise the time, so a server holds many idle connections. The cost per idle connection decides whether that fits in memory.
- *Seven years to 1.0.* nginx shipped from 2004 and called itself 1.0.0 only in 2011 (S04-C26). A version number is a claim, not a measure of use.

**Misconceptions.**
- S04-M04: "nginx is a faster Apache: it made the worker cheaper." Wrong. It removed the per-connection worker. Distractor in check 2.
- S04-M05: "C10K was a hardware problem in 2002." Wrong. The hardware was fast enough, and the software models were the limit. Distractor in check 3.
- S04-M40: "nginx is a proxy because it cannot run application code." Wrong. nginx hands dynamic work to another program so that slow work never blocks the loop. Distractor in check 5.

**Diagrams.** Static: 10,000 connections drawn two ways. Left: 10,000 thread boxes with stacks. Right: 4 worker boxes and 10,000 small dots in lists. Step-by-step: a connection moves from "idle in list" to "ready" to "handled" and back.

**Interactives.** *Process-count race.* Inputs: a connection slider from 0 to 10,000, and a model toggle (fork per connection, thread per connection, nginx with 4 workers). The learner sees the process and thread counts, the reserved address space, and the loop count. The learner discovers that the nginx line stays flat while the others grow in step with connections. Constants: thread model, 8 MiB of stack address space per connection (slide 8, `threadd.c` L13-15). Fork model, one process per connection, with the private memory per child taken from the s03-m01 lab (no default). Loop model, 4 processes and 4,632 B per slot (`epolld.c` L55-62), with a note that slide 10 says "a few hundred bytes" for nginx. Priority P1.

**Predict, observe, explain.** Command: run `ulimit -n 65536` in the server shell and in the flood shell, then `tools/flood.sh 8004 5000` against `04-epoll/epolld`, then `ps -o pid,nlwp,rss -C epolld`. Predict: how many processes and threads does epolld have with 5,000 open connections? Observe: one process, one thread. The log prints "peak connections" every 500. Source: slide 33 row 04 and the README. Session 3 holds the telnet version of this idea for forkd (S03-Q09): one idle connection pins one process there, while here it needs only a slot (S04-C28).

**Worked example.** Address space for 10,000 idle connections. Threads: 10,000 × 8 MiB = 80,000 MiB. epolld reserves its whole table at startup, whatever the count: 65,536 × 4,632 B = 303,562,752 B = 289.5 MiB. The thread model reserves about 80,000 / 289.5 ≈ 276 times more. Both numbers are address space. Session 3 shows why idle stacks touch little RAM, and the lab shows that epolld touches most of its table.

**Faded example.** 50,000 idle connections. Threads: 50,000 × 8 MiB = ____ MiB. epolld table: ____ MiB. Ratio: about ____. *(400,000 / 289.5, it does not grow / 1,382.)*

**Your turn.** How many default 8 MiB thread stacks fit in the address space of the whole epolld table? *(289.5 / 8 = 36.2, so 36.)*

**Checks.**
1. `numeric`: epolld reserves 65,536 slots of 4,632 B each. How many MiB? Answer: 289.5. Feedback: 303,562,752 B / 1,048,576, paid at startup whatever the load.
2. `mcq`: What did nginx change? Answer: it removed the worker per connection. Distractor: it made each worker thread cheaper (S04-M04). Feedback: Apache made workers cheaper, and nginx asked why they exist.
3. `mcq`: What limited C10K in 2002? Answer: a stack and a scheduler entry per connection, and the select bitmap. Distractor: CPUs too slow (S04-M05). Feedback: slide 8 says the hardware was ready.
4. `recall`: Date of the first public nginx release? Answer: 4 October 2004.
5. `mcq`: Why is nginx a reverse proxy and not an application server? Answer: it keeps many idle connections cheap and hands dynamic work to another program. Distractor: nginx cannot run code (S04-M40). Feedback: slide 9, "let something else generate the dynamic content". The loop must stay free, so the choice is design, not inability.

**Review cards.**
- Q: What question did nginx ask instead of "how to make the worker cheaper"? A: why a connection needs a worker at all.
- Q: What does an idle connection need in nginx? A: a small state record and a list entry.
- Q: Who started nginx? A: Igor Sysoev.
- Q: At which company did the connection problem that led to nginx appear? A: Rambler.
- Q: Why did thread-per-connection come back with Go? A: a goroutine starts at 2 KiB, not 8 MB.

**Lab.** Build with `make`. Start `04-epoll/epolld 8004` with no clients, then run `ps -o pid,nlwp,vsz,rss -C epolld`. Expected: one thread, and VSZ and RSS both above 250 MiB before any client connects. The start-up loop writes every slot, so the table is paid up front. A scratch run (Fedora 44) printed VSZ 298,912 KiB and RSS 263,916 KiB. Session 3 runs threadd (s03-m01). There, both runs print `default thread stack: 8388608 bytes (8192 KiB)` first, and `STACK=65536` adds `stack set to 65536 bytes — x10,000 threads = 0.7 GB of VA`.

### s04-m03-process-model

- **Title:** One master, one worker per core, and a rule of 7/8.
- **Minutes:** 22.
- **Big idea:** The master forks the workers one time at startup, and each worker decides alone when to stop taking new connections.
- **Covers:** S04-C30, S04-C31, S04-C32, S04-C33, S04-C34, S04-C40, S04-C41, S04-C42, S04-C43, S04-C44, S04-C45, S04-C153, S04-C154, S04-C159, S04-C169.
- **Prereqs:** s04-m02-the-nginx-question, s03-m01-threads-and-fork, s01-m02-ports-and-queue.
- **Threads:** T-setup-off-path, T-law-or-habit.

**Pretest.**
1. Does the nginx worker count grow under load? *Answer: no.*
2. A worker has 4,096 connection slots and 400 free. What is accept_disabled? *Answer: 4096 / 8 − 400 = 112.*
3. Is accept_mutex on by default today? *Answer: no, off since 1.11.3.*

**Rung 1, the picture.** A restaurant manager unlocks the doors, hires one cook per stove before opening, and never cooks. Each cook watches their own order rail. When a rail is more than 7/8 full, its cook stops taking new orders for a while. Other cooks get them. *Where it breaks:* the cooks never talk to each other, and that is the point. On modern Linux the kernel deals out new orders, and the cooks no longer pass a lock around.

**Rung 2, how it works.**
1. The master reads the config, binds the listen sockets and forks N workers.
2. The master then only handles signals: reload, stop, and a dead worker.
3. Each worker preallocates `worker_connections` connection structs.
4. On each accept, a worker computes accept_disabled = slots / 8 − free slots.
5. With accept_mutex on and a positive value, the worker skips the lock and counts the value down by 1 per loop turn.
6. A reload forks new workers. Old workers stop accepting, finish their requests and exit.

**Rung 3, the real thing.**
```
$ ps -o pid,ppid,args -C nginx        # slide 11
2663     1  nginx: master process
2665  2663  nginx: worker process
2666  2663  nginx: worker process
2667  2663  nginx: cache manager process
```
The formula is in `src/event/ngx_event_accept.c` ~L139, inside `ngx_event_accept()`. The check is in `src/event/ngx_event.c` `ngx_process_events_and_timers()` ~L219 to ~L224. The accept call is `accept4(lc->fd, ..., SOCK_NONBLOCK)` (S04-C44). The listen backlog defaults to 511 (S04-C169). Worker startup is `ngx_start_worker_processes()` ~L358 in `src/os/unix/ngx_process_cycle.c`. The config lives in `07-nginx/nginx.conf`: `worker_processes auto`, `worker_connections 4096`, `multi_accept off`, `accept_mutex off`.

**Rung 4, exam depth.**
- *Same syscall, different rate (S04-C32).* forkd calls fork() per connection. nginx calls it N times at startup. The whole 1994 to 2004 story sits in that difference.
- *When does the 7/8 rule act?* The code reads accept_disabled only when accept_mutex is on (beyond the slides). With the default off on Linux, nginx uses EPOLLEXCLUSIVE. A worker past 7/8 then re-adds its listen socket, so siblings get the next wakeups (beyond the slides).
- *Why the mutex died (S04-C42, S04-C43).* Without help, one new connection woke every worker: the thundering herd. The mutex fixed that in userspace at a cost (S04-Q02). EPOLLEXCLUSIVE wakes one waiter. SO_REUSEPORT gives each worker its own queue. The mutex became a habit.
- *Privilege split (S04-C34).* See S04-Q01.
- *Slots include upstreams.* `worker_connections` counts client and upstream connections together (beyond the slides). A proxied request uses two slots.
- *multi_accept.* See S04-Q03.
- *Out of descriptors (S04-C159).* epolld calls EMFILE the second C10K wall. nginx logs accept4 failure at crit level, removes its listen sockets from epoll, and adds them back after accept_mutex_delay (500 ms). With the mutex on, it releases the mutex and skips one turn. It keeps no spare descriptor and sends no 503 (beyond the slides, section 7).

**Misconceptions.**
- S04-M06: "nginx forks more workers when load rises." Wrong. The master forks a fixed number at startup. Distractor in check 3.
- S04-M07: "Workers need a coordinator or a shared counter to balance accepts." Wrong. Each worker uses its own free-slot count. Distractor in check 4.
- S04-M08: "accept_mutex is on by default and still needed on modern Linux." Wrong. It is off since 1.11.3. Distractor in check 2.
- S04-M41: "TCP_CORK decides how new connections spread across workers." Wrong. TCP_CORK holds outgoing bytes on one socket. Distractor in check 5.

**Diagrams.** Static: the process tree, master over N workers plus the cache manager and cache loader. The master has no line to any client. Step-by-step: a reload. Old workers drain while new workers accept. Two generations are alive at one time.

**Interactives.** *accept_disabled calculator.* Inputs: `worker_connections`, and used or free slots. The learner sees the value with integer division, the 7/8 threshold line, and the verdict "competes" or "skips N loop turns". The learner discovers that the value turns positive exactly past 7/8 full. Priority P1. *Reload stepper.* Inputs: next. The learner sees the PIDs of old and new workers and the requests each one holds. Priority P2.

**Predict, observe, explain.** Command: start nginx in `07-nginx`, run `watch -n0.2 'ps -o pid,ppid,etime,args -C nginx'`, then `tools/flood.sh 8080 2000`. Predict: does the worker count change during the flood? Observe: no. Then run the same watch against `01-fork/forkd` under `tools/flood.sh 8001 200`, and the count moves. Captured nginx output: slide 11.

**Worked example.** `worker_connections 4096`, 400 slots free. 4096 / 8 = 512. 512 − 400 = 112. The value is positive, so with the mutex on, the worker skips the lock for the next 112 loop turns.

**Faded example.** `worker_connections 1024`, 200 slots free. 1024 / 8 = ____. ____ − 200 = ____. Verdict: ____. *(128 / 128 / −72 / competes.)*

**Your turn.** `worker_connections 4096`. How many slots must be in use before accept_disabled turns positive? *(More than 3,584, so fewer than 512 free.)*

**Checks.**
1. `numeric`: `worker_connections 2048`, 100 free. accept_disabled? Answer: 156. Feedback: 2048 / 8 = 256, and 256 − 100 = 156.
2. `mcq`: Default accept_mutex in current nginx? Answer: off. Distractor: on, to stop the thundering herd (S04-M08). Feedback: EPOLLEXCLUSIVE and SO_REUSEPORT moved the fix into the kernel.
3. `mcq`: A load test doubles the connections. What happens to the worker count? Answer: it stays the same. Distractor: the master forks more workers (S04-M06). Feedback: fork happens at startup and on reload only.
4. `mcq`: With accept_mutex on, how does a worker past 7/8 of its slots give way to its siblings? Answer: its own accept_disabled value turns positive, and it skips the mutex for that many loop turns. Distractor: a shared counter in the master tells it to stop (S04-M07). Feedback: no leader, no heartbeat, no shared counter. With the default (mutex off), the kernel does most of the sharing.
5. `multi`: Which kernel features replaced the userspace accept mutex? Answer: EPOLLEXCLUSIVE, SO_REUSEPORT. Distractor: TCP_CORK (S04-M41). Feedback: TCP_CORK groups outgoing bytes and has nothing to do with accept.

**Review cards.**
- Q: The accept_disabled formula? A: connection_n / 8 − free_connection_n.
- Q: What does the nginx master never touch? A: a client connection.
- Q: Since which version is accept_mutex off by default? A: 1.11.3.
- Q: What wakes only one waiter on a shared listen socket? A: EPOLLEXCLUSIVE, Linux 4.5+.
- Q: What does a reload do with the old workers? A: they stop accepting, finish their requests, and exit.

**Lab.** In `07-nginx`: `mkdir -p logs temp && cp /etc/nginx/mime.types . && nginx -p $PWD -c $PWD/nginx.conf`. In a second terminal: `nginx -p $PWD -c $PWD/nginx.conf -s reload` while `watch` runs. Expected: new worker PIDs appear, and the master PID stays the same.

### s04-m04-event-loop

- **Title:** Six lines where a worker lives.
- **Minutes:** 20.
- **Big idea:** A worker sleeps in epoll_wait with the nearest timer as the timeout, wakes, runs the ready handlers and the due timers, and sleeps again.
- **Covers:** S04-C35, S04-C36, S04-C37, S04-C38, S04-C39.
- **Prereqs:** s04-m03-process-model, s03-m02-select, s03-m03-stacking-and-timeouts.
- **Threads:** T-watch-list.

**Pretest.**
1. How does nginx notice a timeout without a polling tick? *Answer: it passes the time to the nearest deadline as the epoll_wait timeout.*
2. Where does a worker spend most of its time? *Answer: asleep inside epoll_wait.*
3. With accept_mutex on, which posted queue drains first after the wait? *Answer: the accept events queue. With the default (mutex off), nginx posts nothing, and handlers run inside the wait call in epoll order.*

**Rung 1, the picture.** A night nurse has a call-button board and an alarm clock. Before she naps, she sets the alarm for the next medicine time. She wakes when a button lights or the alarm rings. She answers every lit button, gives any medicine that is due, then sets the alarm again and naps. *Where it breaks:* a nurse can stop a task when an alarm rings. Nothing can interrupt a handler, so a handler must never wait inside a task. It saves its place, returns, and the loop calls it again on the next event. Until it returns, every other patient on that worker waits.

**Rung 2, how it works.**
1. Ask the timer tree for the nearest deadline. That number becomes the sleep limit.
2. Call epoll_wait with that limit. The worker sleeps here.
3. Run the queued accept events.
4. Release the accept mutex, if this worker holds it.
5. Fire every timer whose deadline has passed.
6. Run the other queued events. Go back to step 1.

**Rung 3, the real thing.**
```c
timer = ngx_event_find_timer();                               /* 1 */
ngx_process_events(cycle, timer, flags);   /* epoll_wait()       2 */
ngx_event_process_posted(cycle, &ngx_posted_accept_events);   /* 3 */
ngx_shmtx_unlock(&ngx_accept_mutex);                          /* 4 */
ngx_event_expire_timers();                                    /* 5 */
ngx_event_process_posted(cycle, &ngx_posted_events);          /* 6 */
```
Source: slide 12, `src/event/ngx_event.c` `ngx_process_events_and_timers()` ~L195. The timers are an rbtree in `src/event/ngx_event_timer.c`, so the nearest deadline is the leftmost node (S04-C37). Compare `04-epoll/epolld.c`, which calls `epoll_wait(epfd, evs, MAX_EVENTS, -1)` because it has no timers.

**Rung 4, exam depth.**
- *Timeouts cost nothing when nothing times out (S04-C37).* A polling design wakes on a tick and scans. nginx sleeps for exactly the gap to the next deadline.
- *Posted or inline?* The slide says handlers never run inside the poll (S04-C38). In 1.31.5, nginx posts events only while the worker holds the accept mutex. With the default setting, read and write handlers run inline, inside the epoll batch loop (beyond the slides). Teach the posting design, then this detail.
- *A slow handler stalls everyone.* One blocking disk read or a long CPU task stalls every connection on that worker. Session 3 slide 30 shows the nginx answer, a thread pool for disk reads.
- *timer_resolution.* With that directive, nginx sleeps without a timer limit and updates time from a signal instead (beyond the slides, `ngx_event.c` ~L201).
- *Line 2 or line 3?* The slide says callbacks come from line 2 or line 6. The tour says line 3 or line 6. In the code, handlers run from lines 2, 3, 5 and 6 (section 7).

**Misconceptions.**
- S04-M09: "nginx wakes on a fixed tick to check for timeouts." Wrong. The nearest deadline is the sleep timeout. Distractor in check 2.
- S04-M10: "A long handler only slows its own connection." Wrong. It stalls the whole worker. Distractor in check 5.

**Diagrams.** Step-by-step: the six lines as a cycle, with a clock face showing the timeout shrink as time passes. Static: an rbtree of timers with the leftmost node marked as "next deadline".

**Interactives.** *Event-loop stepper.* Inputs: a list of timers, and events that arrive at chosen times. The learner steps line by line and sees the computed timeout, the wakeup reason, which handlers run, and which timers fire. The learner discovers that the worker never wakes without a reason. Priority P1.

**Predict, observe, explain.** Command: start nginx in `07-nginx`, then trace every worker: `strace -e trace=epoll_wait $(pgrep -f 'nginx: worker' | sed 's/^/-p /')`. In a second shell, hold one connection open with an unfinished request, as flood.sh does: `exec 3<>/dev/tcp/127.0.0.1/8080; printf 'GET / HTTP/1.1\r\nHost: x\r\n' >&3`. About 5 s later, send one more header line on the same connection: `printf 'X-A: 1\r\n' >&3`. Predict: the timeout of the worker that holds the connection, first, and after the second line. Observe: first about 60,000 ms (client_header_timeout, set at accept). Then about 55,000 ms, because new bytes do not reset that timer. Idle workers show -1. Do not use `curl --keepalive-time`: it sets TCP keepalive probes, and curl closes the socket when the transfer ends. This is a prediction from the 1.31.5 code. Confirm it on a local run, because the sources hold no capture.

**Worked example.** Timers due at +500 ms, +2,000 ms and +75,000 ms. Line 1 returns 500. A client sends data at +120 ms, so epoll_wait returns after 120 ms and the handler runs. No timer is due. The next line 1 returns 500 − 120 = 380. At +500 ms, epoll_wait returns 0 events, and line 5 fires the first timer. The next timeout is 2,000 − 500 = 1,500.

**Faded example.** Timers at +300 ms and +1,000 ms. An event arrives at +100 ms. First timeout: ____. Timeout after the event: ____. Timeout after the +300 ms timer fires: ____. *(300 / 200 / 700.)*

**Your turn.** No timers exist and no client sends data. What timeout does line 1 give? *(Infinite, so epoll_wait sleeps until an event arrives.)*

**Checks.**
1. `numeric`: The nearest timer is 900 ms away. What timeout does epoll_wait get? Answer: 900.
2. `mcq`: How does nginx detect a client that went quiet past its timeout? Answer: the deadline is the sleep limit, and expired timers fire after the wait. Distractor: a tick every 100 ms scans all connections (S04-M09). Feedback: a tick wastes wakeups when nothing is due.
3. `order`: Put in order: expire timers, epoll_wait, find the nearest timer, run posted accept events. Answer: find the nearest timer, epoll_wait, run posted accept events, expire timers.
4. `recall`: What data structure holds the nginx timers? Answer: a red-black tree.
5. `mcq`: A handler does a 200 ms blocking disk read. Who waits? Answer: every connection on that worker. Distractor: only that one connection (S04-M10). Feedback: one worker, one loop, one thing at a time.

**Review cards.**
- Q: What is the epoll_wait timeout in nginx? A: the time to the nearest timer.
- Q: Why is "nearest deadline" cheap? A: it is the leftmost node of an rbtree.
- Q: Which posted queue runs first after epoll_wait? A: the accept events queue.
- Q: What does a blocking handler stall? A: every connection on that worker.

### s04-m05-select-vs-epoll

- **Title:** Who owns the watch list, and the stale event.
- **Minutes:** 25.
- **Big idea:** select pays for every watched socket on every call and epoll pays only for ready ones, but a batch of ready events can point at a connection that no longer exists.
- **Covers:** S04-C22, S04-C46, S04-C47, S04-C48, S04-C49, S04-C50, S04-C51, S04-C52, S04-C53, S04-C54, S04-C55, S04-C56, S04-C57, S04-C58, S04-C59, S04-C156, S04-C171.
- **Prereqs:** s03-m02-select, s04-m04-event-loop.
- **Threads:** T-watch-list, T-law-or-habit.
- **Session 3 owns these repo comments (link, do not teach again):** the FD_SETSIZE wall and ulimit (S03-C43, S03-C44, S03-C46), select overwrites its sets (S03-M05, `selectd.c` L27, L94-95), the backward walk after swap-remove (S03-C47, `selectd.c` L137-138), select as the nginx fallback (S03-C49, `selectd.c` L36-37), epoll in Linux 2.5.44 (S03-C142, `epolld.c` L2).

**Pretest.**
1. 10,000 idle sockets and 10 active. How many units of work does one select call cost? *Answer: 30,000.*
2. nginx frees and reuses one connection struct twice before the loop reaches an old event for it. Does the one-bit instance check skip that event? *Answer: no. Two flips bring the bit back to its old value.*
3. epoll_wait returns 8 events. Handling event 1 closes a socket that event 5 refers to. What is the risk? *Answer: event 5 reaches a new client on the recycled descriptor.*

**Rung 1, the picture.** A teacher has 10,000 students. With select, the teacher reads the whole roll every minute, and every student answers "nothing" or "question". That is 10,000 answers to find 10 questions. With epoll, a student with a question drops a card in a box, and the teacher reads only the cards. The stale event: a student drops a card and then leaves. A new student takes the same seat number. The teacher reads the old card and answers the new student. nginx puts a colour sticker on every seat and changes the colour for each new sitter. The card carries the colour. If the colours differ, the teacher throws the card away. *Where it breaks:* a single sticker has only two colours. If two new students use the same seat before the teacher reaches the card, the colour matches again. nginx accepts that limit, and a full generation counter removes it.

**Rung 2, how it works.**
1. select: build a bitmap of all descriptors, pass it in, and the kernel checks each one. Then scan the bitmap to find the ready ones.
2. epoll: register each descriptor one time with epoll_ctl. The kernel keeps the list.
3. epoll_wait copies out only the ready events, each with a pointer you chose.
4. The loop handles events one by one. Handler 1 can close connection X and free its struct.
5. A new accept in the same batch can reuse the descriptor number and the struct.
6. nginx checks each event: descriptor closed, or instance flag changed? Then skip it.

**Rung 3, the real thing.**

| | select() | epoll |
|---|---|---|
| Watch list | in your process, rebuilt each call | in the kernel, edited with epoll_ctl |
| Cost per call | O(n) build + O(n) kernel + O(n) scan | O(ready events) |
| 10,000 idle, 10 active | 30,000 units | 10 |
| Ceiling | FD_SETSIZE = 1024, compile time | ulimit -n |
| Portable | everywhere since 1983 | Linux only, kqueue on BSD |

The check, from `src/event/modules/ngx_epoll_module.c` `ngx_epoll_process_events()` ~L837:
```c
c = event_list[i].data.ptr;
instance = (uintptr_t) c & 1;
c = (ngx_connection_t *) ((uintptr_t) c & (uintptr_t) ~1);
if (c->fd == -1 || rev->instance != instance) { continue; }  /* stale */
```
The store, in `ngx_epoll_add_event()` ~L579: `ee.data.ptr = (void *) ((uintptr_t) c | ev->instance);`. The flip, in `ngx_get_connection()` in `src/core/ngx_connection.c`: `rev->instance = !instance;`. A bit example: a struct at `0x55d0c3a1e0e0` with instance 1 goes into epoll as `0x55d0c3a1e0e1`. The mask gives back `0x55d0c3a1e0e0` and instance 1. Slide 14 asks you to read `ngx_select_process_events()` next to `ngx_epoll_process_events()`: same signature, same job, about 200 lines each (S04-C156).

**Rung 4, exam depth.**
- *The ceiling is a bitmap width (S04-C22, S04-C50).* Raising ulimit lets the process open descriptor 2000. The fd_set still has 1024 bits, so FD_SET on 2000 writes out of bounds. Session 3 owns the details.
- *One decision (S04-C52).* Because the kernel owns the epoll list, the cost follows active sockets, and the ceiling follows ulimit. Both rows of the table follow from ownership.
- *Why the low bit is free (S04-C56, S04-Q04).* The struct holds pointers, so its address is a multiple of 8 on 64-bit.
- *Why reuse is likely.* nginx keeps free connection structs in a LIFO list, so the struct freed a moment ago is the next one handed out (beyond the slides). The kernel also reuses the lowest free descriptor number.
- *A gap that does not fire yet.* `epolld.c` keeps a generation counter but never compares it. Today no stale event can slip through. Each handler closes only its own connection, and epoll reports a descriptor at most once per batch, so no later event in the batch points at a closed slot. The gap opens when one handler can close another connection: a timeout sweep, or a client and upstream pair as in nginx. Then an accept can reuse that fd and slot. `data.ptr` holds only the slot pointer, and slots are indexed by fd, so the later event passes `fd < 0`. A stale EPOLLOUT calls write with 0 bytes, gets 0, and closes the new client. The fix: pack fd and generation into `data.u64` and compare (section 7).
- *Edge or level (S04-C58).* epolld comments say nginx uses level-triggered epoll. nginx 1.31.5 uses edge-triggered events (EPOLLET) for connections and level for listen sockets (beyond the slides).
- *Closed means removed, mostly (S04-C171).* The kernel drops a descriptor from the interest list only after every duplicate closes, so epolld calls EPOLL_CTL_DEL first. A batch already copied to user space still holds the old event.

**Misconceptions.**
- S04-M11: "`ulimit -n 65536` lets select watch descriptor 2000." Wrong. FD_SETSIZE is a compile-time bitmap width. Distractor in check 3.
- S04-M12: "epoll is faster because the kernel scans the list faster." Wrong. epoll does not scan idle sockets, because the kernel keeps a ready list. Distractor in check 2.
- S04-M13: "After close(), no event for that descriptor can reach you." Wrong. The batch in your array can already hold it. Distractor in check 4.
- S04-M14: "The low-bit flag needs extra memory and works at any address." Wrong. It uses a bit that alignment keeps zero. At an odd address it corrupts the pointer. Distractor in check 5.
- S04-M43: "A closed-descriptor test (`fd < 0` or `fd == -1`) catches every stale event." Wrong. After an accept reuses the descriptor, the test passes again. Distractor in check 6.

**Diagrams.** Static: the select versus epoll table as two pictures. A bitmap passed back and forth, against a kernel list with a ready queue. Step-by-step: a batch of 8 events. Event 1, for a client, closes that client's upstream on fd 7. An accept reuses fd 7. Event 5 arrives for fd 7, with and without the instance check.

**Interactives.** *Stale-event scenario stepper.* Inputs: the event order in a batch, which handler closes which connection (its own, or another one, as a timeout sweep or an upstream close does), an "instance check" toggle, a "generation counter" toggle. The learner sees each handler run, the descriptor table, the free list, and where each event lands. The learner discovers that a stale event needs one handler to close another connection, the misdelivery with the check off, and the double-reuse limit of one bit. Priority P1. *select versus epoll cost counter.* Inputs: watched n, active k. The learner sees 3n against k per call and a running total over 1,000 calls. Priority P2, and it doubles as a generator.

**Predict, observe, explain.** Command: `EDGE=1 strace -e trace=read,epoll_wait ./04-epoll/epolld 8004`, then `curl localhost:8004/`. Predict: after the read that returns the request bytes, what does the next read return? Observe: `read(5, ...) = -1 EAGAIN`, because edge mode must read until the socket is empty. Without EDGE, epolld reads one time and stops (S04-C58, S04-Q20). A scratch run (Fedora 44, loopback) printed `read(5, "GET / HTTP/1.1\r\nHost: localhost:"..., 4095) = 79`, then `read(5, 0x7fe01123daef, 4016) = -1 EAGAIN (Resource temporarily unavailable)`. The deck holds no capture. Session 3 runs the selectd flood (s03-m02).

**Worked example.** n = 10,000 watched, k = 10 active. select: build 10,000 + kernel 10,000 + scan 10,000 = 30,000 units. epoll: 10 units. Ratio 3,000 to 1.

**Faded example.** n = 2,000, k = 50. select: 3 × ____ = ____ units. epoll: ____ units. *(2,000 / 6,000 / 50.)*

**Your turn.** A connection struct holds instance 0, and an epoll event for it carries instance 0. Before the loop reaches that event, nginx frees and reuses the struct twice. What instance does the struct hold now, and does the check skip the event? *(0, then 1, then 0. The bits match and the fd is open again, so the event gets through. A full generation counter would catch it.)*

**Checks.**
1. `numeric`: n = 5,000 watched, k = 5 active. select units per call? Answer: 15,000.
2. `mcq`: 10,000 sockets are watched and 10 have data. Why does one epoll_wait cost about 10 units, not 10,000? Answer: the kernel puts a socket on a ready list when data arrives, and epoll_wait reads only that list. Distractor: the kernel scans all 10,000 faster than select does (S04-M12). Feedback: nothing scans an idle socket on each call.
3. `mcq`: You raise ulimit -n to 65,536. What changes? Answer: epoll can now watch descriptors up to 65,535, and select still stops below 1024. Distractor: select also reaches 65,536 (S04-M11). Feedback: slide 14, ulimit does nothing for select and everything for epoll.
4. `mcq`: Handler 1 closes fd 9. Event 4 in the same batch is for fd 9. What happens without a check? Answer: the old event can reach a new connection on fd 9. Distractor: the kernel removed it, so it cannot arrive (S04-M13). Feedback: the batch is already in your array.
5. `mcq`: Why can nginx store a flag in the low bit of the pointer? Answer: struct alignment keeps that bit zero. Distractor: nginx allocates one extra byte per connection (S04-M14). Feedback: free bit, no memory, one branch.
6. `spot-bug`: `epolld.c` checks only `if (c->fd < 0) continue;` and never compares `gen`. You add a timeout sweep that closes idle connections inside the batch loop. What can slip through now? Answer: a later event in the batch for a connection that the sweep closed and an accept reused. Distractor: nothing, the `fd < 0` test catches every stale event (S04-M43). Feedback: the reused slot has an open fd again. Pack fd and generation into the event data and compare them.

**Review cards.**
- Q: select cost against epoll cost? A: O(watched) against O(active).
- Q: Where does the epoll watch list live? A: in the kernel.
- Q: What makes an epoll event stale? A: another handler closed its connection earlier in the same batch.
- Q: What does nginx compare to detect a stale event? A: fd == -1, or the instance bit.
- Q: Why is the pointer low bit free? A: struct alignment.
- Q: What does `ulimit -n 65536` change for epoll? A: the descriptor ceiling, which is all that limits it.

**Lab.** `make`. In the server shell, run `ulimit -n 65536` and `./04-epoll/epolld 8004`. In the flood shell, run `ulimit -n 65536` and `tools/flood.sh 8004 5000`. Both ends need the higher limit. Look at the server log and `ss -tn state established '( sport = :8004 )' | wc -l`. Expected: epolld logs peaks at every 500 up to 5,000 with no error, and ss prints 5,001 lines (one header). Session 3 runs the selectd flood (s03-m02).

### s04-m06-sendfile

- **Title:** sendfile, and the honest benchmark.
- **Minutes:** 20.
- **Big idea:** sendfile moves file bytes to a socket without passing them through your process, and the real win is CPU headroom, not a faster loopback number.
- **Covers:** S04-C60, S04-C61, S04-C62, S04-C63, S04-C64, S04-C65, S04-C66, S04-C67, S04-C68, S04-C69, S04-C70, S04-C71, S04-C72, S04-C167, S04-C168, S04-C170, S04-C173.
- **Prereqs:** s03-m07-limits, s01-m01-seven-syscalls.
- **Threads:** T-honest-benchmarks.

**Pretest.**
1. How many copies does read() plus write() make per chunk, per the slide? *Answer: 4, and 2 of them use the CPU.*
2. On loopback, does sendfile beat read plus write on wall time? *Answer: no.*
3. Can nginx use sendfile for a response that gzip compresses? *Answer: no.*

**Rung 1, the picture.** You move books from a warehouse to a truck. With read and write, you carry each box into your office and then out to the truck. With sendfile, you tell the warehouse crew to load the truck directly, and the boxes never enter your office. *Where it breaks:* on loopback, the truck is another office in the same building. Someone still carries every box, so the job takes about as long. You saved your own time, which you can now spend on other customers.

**Rung 2, how it works.**
1. read(): the kernel copies file bytes from the page cache into your buffer. One CPU copy, one trip into the kernel.
2. write(): the kernel copies your buffer into the socket buffer. A second CPU copy, a second trip.
3. The NIC pulls the socket buffer by DMA. The disk filled the page cache by DMA.
4. sendfile(): one call names the file and the socket. The kernel moves the bytes internally.
5. With a NIC that has scatter-gather DMA and checksum offload, the socket buffer gets only page references, and the NIC reads the page cache directly (S04-C167).

**Rung 3, the real thing.**
```
read() + write()   disk -> page cache -> your buffer -> socket buffer -> NIC
sendfile()         disk -> page cache -> socket buffer -> NIC
$ ./sendfiled 8005 www/big.bin              # 64 MB, over loopback, slide 17
mode=read      wall  37.4 ms | sys 37.3 | 2048 syscalls
mode=mmap      wall  23.3 ms | sys 23.1 |    4 syscalls
mode=sendfile  wall  33.2 ms | sys 32.3 |    1 syscall
```
`05-sendfile/sendfiled.c` counts the calls: `send_read` loops pread plus write in 64 KiB chunks, `send_mmap` does mmap, madvise, write and munmap, `send_sendfile` loops sendfile until done. In nginx, `ngx_http_static_handler()` sets `b->in_file = b->file_last ? 1 : 0;` at ~L264. `ngx_linux_sendfile()` ~L232 calls `sendfile(c->fd, file->file->fd, &offset, size)` at ~L261.

**Rung 4, exam depth.**
- *Count with care.* The slide counts one mode switch per syscall and zero per chunk for sendfile (S04-C60, S04-C61). The usual count is two transitions per syscall: 4 per read-write pair, 2 per sendfile call (beyond the slides). The instructor ties "both DMA" to a scatter-gather NIC with checksum offload (S04-C167). Without one, sendfile still makes one CPU copy, into the socket buffer.
- *Why loopback is flat (S04-C69).* There is no NIC and no DMA. The kernel copies into the receiver buffer in every mode, and curl competes for the same CPU. See S04-Q24.
- *What is real (S04-C70, S04-C71).* 64 MiB / 64 KiB = 1,024 chunks, and 2 calls per chunk = 2,048 syscalls. sendfile makes 1. The CPU you do not spend copying serves another request.
- *Permission, not order (S04-C64, S04-Q14).* gzip must see the bytes, so it asks for them in memory, and nginx falls back to pread plus writev. TLS has the same need, which is why kTLS moves encryption into the kernel (S04-C63). About 900 lines of buffer-chain code decide whether the one sendfile line runs (S04-C173).
- *TCP_CORK (S04-C65, S04-C170).* nginx sends the headers with writev and the body with sendfile. The cork makes them leave in one segment, so tcp_nopush matters only with sendfile. The nginx comment calls CORK and NODELAY mutually exclusive. The kernel allows both since Linux 2.5.71, but setting NODELAY flushes corked data, so nginx turns NODELAY off while it corks. A cork also has a 200 ms ceiling (beyond the slides).
- *mmap in the middle (S04-C66, S04-C168).* mmap wins this loopback run but adds page faults and a TLB shootdown at munmap. It wins only because sendfiled calls madvise. Without madvise, the comment says mmap loses to read.
- *The default.* `sendfile` is off unless the config turns it on (beyond the slides). The repo config turns it on for :8080.

**Misconceptions.**
- S04-M15: "sendfile makes every single transfer faster, loopback included." Wrong. On loopback it saves syscalls and CPU, not wall time. Distractor in check 2.
- S04-M16: "`sendfile on` makes nginx use sendfile for every response." Wrong. A filter that needs the bytes, such as gzip, turns it off for that response. Distractor in check 3.
- S04-M17: "If wall time is flat, the syscall count does not matter." Wrong. The saved CPU shows up under concurrency. Distractor in check 5.

**Diagrams.** Step-by-step: the two copy chains from slide 16. Each arrow is labelled DMA or CPU, and each syscall shows a user-kernel crossing. Static: the slide 17 table as bars, with syscalls on a log scale next to wall time.

**Interactives.** *sendfile copy animation.* Inputs: mode (read plus write, mmap, sendfile), NIC gather support on or off, file size, chunk size. The learner steps chunk by chunk and sees CPU copies, DMA copies, syscalls and bytes that enter user space. The learner discovers that sendfile removes the user-space copy, and gather support removes the last CPU copy. Priority P1.

**Predict, observe, explain.** Command: `make bigfile`, `make run-sendfile`, then `tools/syscalls.sh read` and `tools/syscalls.sh sendfile`. Predict: how many write or sendfile calls does each mode make? Observe: thousands of writes against one sendfile. Captured numbers: slide 17, for a 64 MB file. The Makefile makes a 256 MB file (section 7). Read mode then shows 4,096 pread64 and about 4,100 write: 4,096 body chunks, 1 header, and 3 writes for the log line on stderr. Sendfile mode shows 1 sendfile and 4 write. A scratch run (Fedora 44, strace started the server, so start-up adds 2 pread64 and 6 writes) counted 4,098 pread64 and 4,106 write in read mode, and 1 sendfile and 10 write in sendfile mode.

**Worked example.** A 64 MiB file, 64 KiB chunks. Chunks: 64 × 1,024 KiB / 64 KiB = 1,024. read mode: 1,024 preads + 1,024 writes = 2,048 syscalls. CPU copies: 2 × 64 MiB = 128 MiB of memcpy. sendfile mode: 1 syscall, 0 MiB copied through user space.

**Faded example.** A 256 MiB file, 64 KiB chunks. Chunks: ____. read-mode syscalls: ____. Bytes copied by the CPU in read mode: ____ MiB. *(4,096 / 8,192 / 512.)*

**Your turn.** A 3 GiB file with sendfile. One call moves at most 0x7ffff000 bytes. What is the minimum number of calls? *(3,221,225,472 / 2,147,479,552 is about 1.5, so 2 calls.)*

**Checks.**
1. `numeric`: A 128 MiB file, 64 KiB chunks, read mode. Syscalls? Answer: 4,096. Feedback: 2,048 chunks × 2.
2. `mcq`: On loopback, what does sendfile improve? Answer: syscall count and user-space copies. Distractor: wall time for one transfer (S04-M15). Feedback: no NIC, no DMA, and curl shares the CPU.
3. `mcq`: `sendfile on` and `gzip on` in one location. A client sends `Accept-Encoding: gzip` for a 5 KB text/html file. What sends the response? Answer: memory buffers through writev. Distractor: sendfile, because the config says on (S04-M16). Feedback: gzip must touch the bytes.
4. `numeric`: With a gather-capable NIC, how many CPU copies does sendfile make? Answer: 0.
5. `mcq`: sendfile and read mode show similar wall time on loopback. What is the right conclusion? Answer: the benchmark does not model the bottleneck. Distractor: sendfile is useless (S04-M17). Feedback: the saved CPU appears at 10,000 concurrent clients.

**Review cards.**
- Q: Which copy does sendfile remove? A: the one through user space.
- Q: Why does gzip disable sendfile? A: gzip must read the bytes in user space.
- Q: Why does kTLS exist? A: so encryption stays in the kernel and sendfile survives.
- Q: Syscalls for 64 MB in read mode, 64 KiB chunks? A: 2,048.
- Q: What is TCP_CORK for with sendfile? A: headers and first body bytes leave in one segment.

**Lab.** Run `tools/syscalls.sh read`, then `tools/syscalls.sh sendfile`. Look at the calls column for write and sendfile. Expected: read mode shows a write count in the thousands, and sendfile mode shows 1 sendfile.

### s04-m07-reverse-proxy

- **Title:** A reverse proxy is a forward proxy turned around.
- **Minutes:** 18.
- **Big idea:** A reverse proxy is the caching machine from the client side moved in front of your servers, and its quiet superpower is absorbing slow clients.
- **Covers:** S04-C73, S04-C74, S04-C75, S04-C76, S04-C77, S04-C78, S04-C79, S04-C80.
- **Prereqs:** s04-m02-the-nginx-question, s03-m05-fastcgi-servlets, s03-m07-limits.
- **Threads:** T-littles-law, T-setup-off-path, T-name-in-message, T-where-state-goes.

**Pretest.**
1. Which side of the internet does Squid sit on? *Answer: next to the clients.*
2. Does a client configure a reverse proxy? *Answer: no. It usually cannot see it.*
3. Behind nginx, what client IP does the app see without extra headers? *Answer: the nginx address.*

**Rung 1, the picture.** A forward proxy is a campus librarian who fetches books for students and keeps copies. A reverse proxy is the front desk of a company. Visitors talk only to the desk. The desk listens to a slow visitor for as long as it takes, writes one complete note, and hands it to the right department in one second. The department never waits on a mumbling visitor. *Where it breaks:* the department sees only the desk. It learns who the visitor was from the note, and a visitor can forge a line in that note.

**Rung 2, how it works.**
1. A phone on 2G opens a connection to nginx and uploads slowly.
2. nginx reads the whole request body into its buffers first.
3. nginx picks an upstream by path, host or weight, and sends the request at LAN speed.
4. The app answers in milliseconds and frees its worker.
5. nginx buffers the response and trickles it to the phone.
6. If the upstream fails, nginx retries another server or serves an error page.

**Rung 3, the real thing.** From `07-nginx/nginx.conf`, port 8082:
```nginx
proxy_pass       http://app;
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_next_upstream   error timeout http_502 http_503;
```
The upstream block has `keepalive 32` (S04-C78). Port 8084 has `error_page 502 503 504 /down.html` with `location = /down.html { internal; }` (S04-C79). The log format prints `rt=` and `urt=`. The README run shows `rt=2.001 urt=2.000` over loopback, with forkd as the upstream and its 2 s sleep (S04-C80).

**Rung 4, exam depth.**
- *Same machine, other side (S04-C73, S04-C75).* Squid serves users on the way out. A reverse proxy serves origins on the way in. Session 3 slide 29 made the same point with Varnish.
- *Slow clients and Little's law (S04-C76).* A 2G phone needs 10 s for a response. Without a buffer, the app worker is held for 10 s. At 100 requests per second, that is 100 × 10 = 1,000 busy app workers. With nginx buffering and a 20 ms app time, 100 × 0.02 = 2. The idle connections move to nginx, where they are cheap.
- *The mechanism.* proxy_request_buffering and proxy_buffering are on by default (beyond the slides).
- *Trust (S04-C77).* See S04-Q11.
- *Pooled upstream connections (S04-C78).* Since nginx 1.29.7 upstream keepalive is on by default, with proxy HTTP/1.1 and no Connection header. The two config lines from the repo still work but are no longer required (beyond the slides).
- *Two slots per request.* A proxied request uses a client connection and an upstream connection, and both count toward `worker_connections` (beyond the slides).

**Misconceptions.**
- S04-M18: "A client must configure a reverse proxy, like a forward proxy." Wrong. The client sees only a normal server. Distractor in check 1.
- S04-M19: "X-Forwarded-For is safe to trust." Wrong. Any client can send it. Distractor in check 3.
- S04-M42: "`keepalive 32` in an upstream block limits client keep-alive connections." Wrong. It keeps up to 32 idle connections to the upstream servers per worker. Distractor in check 4.

**Diagrams.** Static: slide 18 as two mirrored pictures. Client, proxy, internet, against internet, nginx, app servers. Step-by-step: a slow upload and a slow download, with the app worker busy time shaded in each case.

**Interactives.** *Slow-client absorber.* Inputs: client link speed, app time, request rate, buffering on or off. The learner sees the app workers busy, using Little's law. The learner discovers that buffering moves the idle wait off the app. Priority P2.

**Predict, observe, explain.** Command: start nginx in `07-nginx` with no upstreams running, then `curl -i localhost:8084/maybe/x`. Predict: the status code and the page. Observe: 502 with the "All upstreams are down" page. Source: `nginx.conf` port 8084 and `www/down.html`.

**Worked example.** 200 requests per second, a client download time of 5 s, an app time of 10 ms. Without buffering: 200 × 5 = 1,000 app connections. With buffering: 200 × 0.01 = 2 app connections, and nginx holds 1,000 cheap client connections.

**Faded example.** 50 requests per second, a 4 s client time, a 40 ms app time. Without buffering: ____ app connections. With buffering: ____. *(200 / 2.)*

**Your turn.** The log shows `rt=0.350 urt=0.020`. Where did the time go? *(0.330 s in nginx or the client link, not in the app. For a slow client, that is the buffered download.)*

**Checks.**
1. `mcq`: Who configures a reverse proxy? Answer: the site operator. Distractor: each client, in its browser settings (S04-M18). Feedback: that is a forward proxy.
2. `numeric`: 100 requests per second held 10 s each. Connections held? Answer: 1,000. Feedback: Little's law.
3. `mcq`: An app rate-limits by the leftmost X-Forwarded-For value. What is wrong? Answer: the client sets that value. Distractor: nothing, nginx writes the header (S04-M19). Feedback: nginx appends to the client value.
4. `mcq`: What does `keepalive 32` in an upstream block save? Answer: a TCP handshake per proxied request. Distractor: 32 client keep-alive connections (S04-M42). Feedback: the pool faces the upstreams, which is Session 3's "amortise the setup" again.
5. `recall`: What does `$request_time` minus `$upstream_response_time` measure? Answer: the time spent outside the upstream, in nginx and the client link.

**Review cards.**
- Q: Where does a forward proxy sit? A: next to the clients.
- Q: Where does a reverse proxy sit? A: next to the servers.
- Q: The reverse proxy feature nobody lists? A: absorbing slow clients.
- Q: What does `$proxy_add_x_forwarded_for` produce? A: the client X-Forwarded-For plus the peer address.

### s04-m08-cache

- **Title:** An index in memory, bodies on disk, and three different clocks.
- **Minutes:** 25.
- **Big idea:** The nginx cache keeps a small index in shared memory and the bodies on disk, and separate rules decide freshness, existence and who may refill an entry.
- **Covers:** S04-C81, S04-C82, S04-C83, S04-C84, S04-C85, S04-C86, S04-C87, S04-C88, S04-C89, S04-C90, S04-C91, S04-C92, S04-C93, S04-C174, S04-C175.
- **Prereqs:** s04-m07-reverse-proxy.
- **Threads:** T-where-state-goes.

**Pretest.**
1. `keys_zone=demo:10m` limits what? *Answer: the index, about 80,000 keys. Not the cached data.*
2. valid 10 s, inactive 60 s. One fetch at t = 0, the next request at t = 30. Does nginx ask the origin? *Answer: yes. The copy is stale.*
3. Is proxy_cache_lock on by default? *Answer: no.*

**Rung 1, the picture.** A library keeps its card catalogue at the front desk and its books in the stacks. A "best before" stamp says whether a book is still current (proxy_cache_valid). A dust rule removes any book that nobody borrowed for 60 seconds, current or not (inactive). A shelf limit makes the librarian remove the least recently borrowed book, but never one that someone is reading (count). When a new title arrives, one runner fetches it and the others wait (lock). If the publisher is closed, the desk lends the old edition (use_stale). *Where it breaks:* a library book has one reader at a time. A cache file serves many readers at once, which is why the reader count matters.

**Rung 2, how it works.**
1. A request arrives. nginx computes the MD5 of the cache key.
2. nginx looks up that key in the rbtree in shared memory.
3. No entry: MISS. nginx fetches from the origin and writes a file under the levels directories.
4. Entry fresh: HIT. nginx serves the file and moves the entry to the head of the LRU.
5. Entry stale: EXPIRED. nginx refetches, unless use_stale lets it serve the old copy.
6. Inactive pass: the cache manager takes the LRU tail. If nobody read it for `inactive` and no client reads it now, the manager deletes it and looks at the next tail.
7. Forced pass: if the cache is over max_size or the keys_zone is full, the manager deletes the tail with no reader even if it is fresh. It repeats until the cache fits.

**Rung 3, the real thing.**
```nginx
proxy_cache_path temp/cache levels=1:2 keys_zone=demo:10m
                 max_size=100m inactive=60s use_temp_path=off;
proxy_cache_valid      200 302  10s;
proxy_cache_lock       on;
proxy_cache_use_stale  error timeout updating http_500 http_502 http_503 http_504;
add_header X-Cache-Status $upstream_cache_status;
```
Eviction, from `src/http/ngx_http_file_cache.c` `ngx_http_file_cache_expire()` ~L1860:
```c
q    = ngx_queue_last(&cache->sh->queue);
fcn  = ngx_queue_data(q, ngx_http_file_cache_node_t, queue);
wait = fcn->expire - now;
if (wait > 0) { break; }                      /* tail not old yet */
if (fcn->count == 0) { ngx_http_file_cache_delete(cache, q, name); }
```
The forced pass is `ngx_http_file_cache_forced_expire()` ~L1761, called from `ngx_http_file_cache_manager()` ~L2022 while `size >= max_size` or `count >= watermark`. It deletes the tail when `fcn->count == 0`, with no expire check. The key string on :8082 is `$scheme$request_method$host$request_uri` (S04-C175). With `levels=1:2`, the nginx docs show a key hash `b7f54b2df7773722d382f4809d65029c` stored at `c/29/b7f54b2df7773722d382f4809d65029c`. The first level is the last hex digit, and the second level is the two digits before it.

**Rung 4, exam depth.**
- *Index, not data (S04-C82).* 10 MB × 8,000 keys per MB = about 80,000 keys. max_size limits the bodies on disk.
- *Which clock does eviction read?* The code sets `fcn->expire` to the last access time plus inactive (beyond the slides). So "is the tail old" means "unread for the inactive time", not "past proxy_cache_valid". See S04-Q06.
- *Two passes, one slide line.* Slide 20 shows only the inactive pass (S04-C87). The code adds the forced pass for max_size and a full keys_zone (beyond the slides, section 7).
- *The queue (S04-C89).* The LRU is `ngx_queue.h`, an intrusive list, so a move to the head allocates nothing. s04-m12 reads that file.
- *Lock scope.* The slide ties the lock to an expired popular object (S04-C90). The instructor's own config comment says "on a miss" (`nginx.conf` L172). The docs and code apply the lock to a new element, a MISS. For an expired entry, the first request refreshes (EXPIRED), and `updating` makes the others get the stale copy (UPDATING) (beyond the slides, section 7). The repo config has both lines, so it is safe in both cases.
- *Lock timeout.* After proxy_cache_lock_timeout (5 s default), a waiting request goes to the origin, and nginx does not cache that response (beyond the slides).
- *Streaming safety (S04-C88).* A client that downloads a file raises the entry count, so the manager skips that entry.
- *Not everything caches.* A response with Set-Cookie or `Vary: *` is not cached by default (beyond the slides).
- *Stale or 502.* See S04-Q10.

**Misconceptions.**
- S04-M20: "`keys_zone=10m` caps the cached bodies at 10 MB." Wrong. It sizes the shared-memory index. Distractor in check 2.
- S04-M21: "inactive and proxy_cache_valid measure the same clock." Wrong. One is freshness, the other is time since the last read. Distractor in check 4.
- S04-M22: "The cache manager can delete a file while a client downloads it." Wrong. It skips entries with a nonzero count. Distractor in check 5.
- S04-M23: "proxy_cache_lock also stops the stampede on an expired entry." Wrong in 1.31.5. The lock covers a new entry, and `updating` covers an expired one. Distractor in check 6.

**Diagrams.** Static: shared memory (rbtree plus LRU queue, same nodes) above the disk tree with `levels=1:2` directories. Step-by-step: a timeline of requests with a status label on each, and the LRU queue order under it.

**Interactives.** *LRU cache simulator.* Inputs: a request schedule per key, a body size per key, proxy_cache_valid, inactive, max_size, a keys_zone capacity in keys, the lock and use_stale switches, an origin-down toggle. The learner sees the X-Cache-Status per request, from the real value set (S04-C174), the LRU order, the manager passes, and which entry each pass deletes and why. Model rules: every read sets the entry deadline to now + inactive. The manager wakes at time 0, then at now + min(tail deadline − now, 10 s), or 10 s later when the queue is empty. Each wake runs the inactive pass, then the forced pass while total size ≥ max_size, or, after the zone once ran out of room, while keys ≥ 7/8 of the count at that moment. Both passes skip an entry with a reader. Test vectors: the worked example below deletes the entry at t = 75. Two 60 MB bodies with max_size 100m and inactive 60s: at the wake after the second store, the forced pass deletes the older one while it is still fresh. The learner discovers that valid and inactive answer different questions, that a full cache evicts fresh entries, and that a reader blocks eviction. Priority P1.

**Predict, observe, explain.** Command: run the 07-nginx setup, then `curl -si localhost:8082/ | grep X-Cache` twice. Predict: the status of each call. Observe: MISS, then HIT (slide 21). Then wait 11 s and run it again. Predict: HIT or EXPIRED? The third result comes from a local run. The sources hold no capture of it.

**Worked example.** valid 10 s, inactive 60 s, use_stale off.
- t = 0: MISS. nginx stores the copy. Fresh until 10. Inactive deadline 60.
- t = 5: HIT. Inactive deadline moves to 65.
- t = 12: EXPIRED. nginx refetches. Fresh until 22. Inactive deadline 72.
- t = 15: HIT. Inactive deadline 75.
- t = 100: MISS. The manager deleted the entry after t = 75. It wakes at least every 10 s, so the deletion came between 75 and about 85.

**Faded example.** valid 60 s, inactive 10 s. t = 0 MISS. t = 5 HIT, inactive deadline ____. t = 30: ____. Why? ____. *(15 / MISS / the manager deleted the entry after t = 15, although it was still fresh.)*

**Your turn.** `keys_zone=25m`. About how many keys fit? *(25 × 8,000 = 200,000.)*

**Checks.**
1. `numeric`: `keys_zone=demo:10m` holds about how many keys? Answer: 80,000.
2. `mcq`: What does the 10m in keys_zone limit? Answer: the shared-memory index. Distractor: the total size of cached bodies (S04-M20). Feedback: max_size limits the disk.
3. `order`: valid 10 s, inactive 60 s, requests at t = 0, 5, 12. Status order? Answer: MISS, HIT, EXPIRED.
4. `mcq`: What does inactive=60s do? Answer: it removes an entry that nobody read for 60 s. Distractor: it marks the entry stale after 60 s (S04-M21). Feedback: freshness belongs to proxy_cache_valid.
5. `mcq`: The LRU tail is old, but a client downloads it now. What does the manager do? Answer: it skips the entry. Distractor: it deletes the file (S04-M22). Feedback: `count == 0` guards the delete.
6. `mcq`: Slide 21 calls proxy_cache_lock the anti-stampede switch. In the 1.31.5 code, a popular entry expires and 500 requests arrive. Which directive keeps most of them off the origin? Answer: `proxy_cache_use_stale updating`. Distractor: `proxy_cache_lock on` alone (S04-M23). Feedback: the code applies the lock to a new entry, as the repo config comment says ("on a miss"). Beyond the slides.

**Review cards.**
- Q: What does keys_zone size? A: the shared-memory index, not the data.
- Q: Keys per MB of keys_zone? A: about 8,000.
- Q: What does inactive measure? A: time since the entry was last read.
- Q: What does proxy_cache_valid measure? A: how long a stored response stays fresh.
- Q: When does the cache manager delete a fresh entry at the LRU tail? A: when the cache is over max_size or the keys_zone is full, and no client reads the entry.
- Q: What does slide 21 call proxy_cache_lock, a switch that is off by default? A: the anti-stampede switch.

**Lab.** In 07-nginx, start `04-epoll/epolld 8004` and `01-fork/forkd 8001`, then nginx. Run `curl -si localhost:8082/ | grep X-Cache` three times, with 11 s between the second and third. Then `ls -R temp/cache`. Expected: MISS, HIT, EXPIRED. The cache directory shows a one-character directory holding a two-character directory.

### s04-m09-routing

- **Title:** Which location wins, and the fallback that powers every framework.
- **Minutes:** 25.
- **Big idea:** nginx picks a location with a fixed algorithm, prefixes in a tree then regexes in file order, and try_files falls back from the disk to the app.
- **Covers:** S04-C94, S04-C95, S04-C96, S04-C97, S04-C98, S04-C99, S04-C100, S04-C101, S04-C102, S04-C103, S04-C104, S04-C111, S04-C112, S04-C113, S04-C114, S04-C115, S04-C155.
- **Prereqs:** s04-m07-reverse-proxy, s03-m04-cgi.
- **Threads:** T-setup-off-path.

**Pretest.**
1. With the four :8081 locations, which one answers /images/a.php? *Answer: 2, the `^~ /images/` prefix.*
2. Two regex locations both match. Which wins? *Answer: the one written first.*
3. Does `try_files $uri $uri/ /index.html` check that /index.html exists? *Answer: no.*

**Rung 1, the picture.** A post office sorts letters by address. First it checks a short list of exact addresses. If one fits, done. Then it walks a tree of street prefixes and remembers the longest street that fits. If that street has a "no detours" flag, done. If not, it reads a list of pattern rules from top to bottom, and the first rule that fits wins. If no rule fits, it uses the street it remembered. *Where it breaks:* in nginx, the exact addresses sit inside the same prefix tree, so there is only one walk. Also, nginx 1.31.5 adds predicate locations, checked after the patterns.

**Rung 2, how it works.**
1. Walk the prefix tree with the URI. Remember the longest matching prefix.
2. If an `=` location matches the whole URI, use it and stop.
3. If the remembered prefix has `^~`, use it and stop.
4. Test the regex locations in file order. The first match wins.
5. If no regex matches, use the remembered prefix.
6. Inside the chosen location, try_files tests each candidate on disk. The first real one wins.
7. If none exists, nginx makes an internal redirect to the last argument, without testing it.

**Rung 3, the real thing.** From `07-nginx/nginx.conf`, port 8081:
```nginx
location = /exact      { return 200 "1: exact match\n"; }
location ^~ /images/   { return 200 "2: prefix, regex skipped\n"; }
location ~ \.php$      { return 200 "3: regex\n"; }
location /             { return 200 "4: catch-all prefix\n"; }
```
The tree walk, from `ngx_http_core_find_static_location()` ~L1542 in `src/http/ngx_http_core_module.c`:
```c
n  = (len <= node->len) ? len : node->len;
rc = ngx_filename_cmp(uri, node->name, n);
if (rc != 0) { node = (rc < 0) ? node->left : node->right; continue; }
if (len > node->len && node->inclusive) { node = node->tree; uri += n; len -= n; }
```
`ngx_http_core_find_location()` ~L1446 then loops over `regex_locations` in order, unless the chosen prefix set `noregex` (`^~`). try_files lives in `src/http/modules/ngx_http_try_files_module.c`, `ngx_http_try_files_handler()` ~L79.

**Rung 4, exam depth.**
- *The data structure is the rule (S04-C104).* A tree can report "longest match" cheaply. An array can report only "first match in order". The precedence rules are the only rules these two structures give.
- *What a tree level is (S04-C102).* The slide says the walk goes one URI segment at a time. The code splits on location name prefixes, not on `/`. Each level is a balanced binary tree over sorted names, and `tree` holds the longer names that share the node name. `/a` and `/abc` give a node `/a` with a child `bc` (beyond the slides, section 7).
- *Half the room (S04-C100).* The instructor reports that about half the class expects the regex to win for /images/a.php. Predict before you run it.
- *`^~` only on the longest prefix.* Add a plain `location /images/big/`. For /images/big/a.php, the longest prefix is /images/big/ without `^~`, so the regex runs and wins (beyond the slides, docs wording).
- *Predicate locations.* 1.31.5 adds `location $variable`. nginx checks them after the regexes, and `^~` also skips them (beyond the slides).
- *Trailing slash.* A prefix like `/user/` with proxy_pass answers /user with a 301 to /user/ (beyond the slides).
- *No .htaccess (S04-C101).* Apache can check for a per-directory file on every request. nginx reads the config one time.
- *try_files details (S04-C112, S04-Q17).* Each candidate check goes through the open file cache code. With `open_file_cache` on, as on :8080, nginx keeps the fd, the stat result and the lookup off the request path (S04-C155). A found file keeps processing in the current location. The fallback redirect restarts location search, and 10 URI changes give 500 (beyond the slides).
- *Where the app gets the path (S04-C115).* `/index.html?$args` keeps only the query string. The app reads the original path from REQUEST_URI, which nginx fills from `$request_uri`. The repo config comment says "the whole URI as a query string", which is not exact (section 7).
- *Named locations (S04-C113).* `@app` cannot appear in a URL match. Only try_files and error_page reach it.

**Misconceptions.**
- S04-M24: "nginx picks the first prefix location in file order." Wrong. It picks the longest matching prefix. Distractor in check 6.
- S04-M39: "A matching prefix location beats a matching regex." Wrong. A regex beats a plain prefix. Only `=` and a longest prefix with `^~` stop the regex search. Distractor in check 1.
- S04-M25: "Among regex locations, the most specific match wins." Wrong. The first match in file order wins. Distractor in check 2.
- S04-M26: "Any matching `^~` prefix turns off the regex search." Wrong. Only when it is the longest match. Distractor in check 3.
- S04-M27: "try_files checks that the last argument exists." Wrong. The last argument is the fallback. Distractor in check 4.
- S04-M28: "A request for /@app reaches the named location @app." Wrong. Named locations never match a URL. Distractor in check 5.

**Diagrams.** Step-by-step: the search for one URI, with the tree walk highlighted, the remembered prefix marked, then the regex list scan. Static: the slide 22 table with a "why" column.

**Interactives.** *Location-matching playground with a search trace.* Inputs: a config of locations (edit, add, reorder) and a URI. The learner sees the tree walk node by node, the remembered prefix, whether `^~` stops the search, each regex tested in order, and the winner. The learner discovers that moving prefix blocks changes nothing and moving regex blocks changes the winner. Priority P1. *try_files stepper.* Inputs: a file tree and a try_files line. The learner sees each stat and the final internal redirect. Priority P2.

**Predict, observe, explain.** Command: run 07-nginx, then `curl localhost:8081/exact`, `curl localhost:8081/images/a.php`, `curl localhost:8081/other/a.php`, `curl localhost:8081/anything`. Predict all four before the first curl. Observe: "1: exact match", "2: prefix, regex skipped", "3: regex", "4: catch-all prefix". Captured output: README, "Routing precedence".

**Worked example.** The docs config: `= /` (A), `/` (B), `/documents/` (C), `^~ /images/` (D), `~* \.(gif|jpg|jpeg)$` (E). Request /documents/1.jpg. Exact: no. Longest prefix: /documents/ (C), without `^~`. Regexes: E matches. Winner: E.

**Faded example.** Same config, request /images/1.gif. Exact: ____. Longest prefix: ____. Has `^~`: ____. Winner: ____. *(no / /images/ (D) / yes, so regexes are skipped / D.)*

**Your turn.** Add `location /images/big/ { }` to the :8081 config. Which block answers /images/big/a.php? *(The regex, 3. The longest prefix is /images/big/ without `^~`.)*

**Checks.**
1. `predict`: the :8081 config, request /other/a.php. Answer: 3. Distractor: 4, because the prefix `location /` matches (S04-M39). Feedback: a plain prefix wins only when no regex matches.
2. `mcq`: `location ~ \.php$` comes before `location ~ ^/admin/.*\.php$`. Which answers /admin/x.php? Answer: the first, `\.php$`. Distractor: the second, because it is more specific (S04-M25). Feedback: regexes are an array, walked in order.
3. `spot-bug`: A config has `^~ /images/` and `/images/big/`. The author expects /images/big/a.php to skip the regexes. What is wrong? Answer: `^~` acts only on the longest prefix, and /images/big/ has none (S04-M26).
4. `mcq`: `try_files $uri /fallback.html`, and /fallback.html does not exist. What happens? Answer: nginx redirects internally to /fallback.html anyway. Distractor: nginx tests it and returns 404 at once (S04-M27). Feedback: the last argument is never tested.
5. `mcq`: Can a client request /@app to reach `location @app`? Answer: no. Distractor: yes, the name is a path (S04-M28). Feedback: only try_files and error_page reach a named location.
6. `mcq`: A config lists `location /img/ { A }` first and `location /img/big/ { B }` second, with no regexes. Which answers /img/big/x.png, and why? Answer: B, because prefixes sit in a tree that reports the longest match. Distractor: A, the first prefix in file order (S04-M24). Feedback: file order matters only in the regex array.

**Review cards.**
- Q: What stops the location search at once? A: an `=` exact match.
- Q: Among prefixes, which wins? A: the longest match.
- Q: Among regexes, which wins? A: the first in file order.
- Q: When does `^~` skip the regexes? A: when it is on the longest matching prefix.
- Q: Which try_files argument is never tested? A: the last one.
- Q: What reaches a named location? A: try_files or error_page only.

**Lab.** In 07-nginx, run `curl -i localhost:8084/does-not-exist`. Expected: 200 with the index.html page that says try_files fell back. Then run `curl -i localhost:8084/index.html` and compare. Expected: the same page, found as a real file.

### s04-m10-upstreams

- **Title:** Smooth weighted round robin, step by step.
- **Minutes:** 22.
- **Big idea:** Smooth weighted round robin keeps the weight ratio but spreads the turns of each server apart, and a failing server loses weight and earns it back.
- **Covers:** S04-C105, S04-C106, S04-C107, S04-C108, S04-C109, S04-C110.
- **Prereqs:** s04-m07-reverse-proxy, s03-m07-limits.
- **Threads:** T-littles-law, T-honest-benchmarks.

**Pretest.**
1. Weights 3:1, naive WRR. Order of the first 4 picks? *Answer: a a a b.*
2. After 4 smooth picks with weights 3:1, what are the current weights? *Answer: 0 and 0.*
3. A server returns 200 but is 10x slower. Do passive health checks lower its weight? *Answer: no.*

**Rung 1, the picture.** A game hands out one sweet per round. Each round, every child adds their own weight to their score. The child with the highest score gets the sweet and pays back the points that all children added that round. A heavy child wins often, but pays back a lot each time, so their wins spread out. *Where it breaks:* here every child sees one shared scoreboard. Each nginx worker keeps its own scoreboard unless the upstream has a shared `zone`.

**Rung 2, how it works.**
1. Start every current weight at 0.
2. For each pick, add the effective weight of each server to its current weight. Add the same amounts to a total.
3. Pick the server with the largest current weight. On a tie, the first listed server wins.
4. Subtract the total from the current weight of the winner.
5. After each full cycle (sum of weights picks), all current weights return to 0.
6. On a failure, lower effective weight by weight / max_fails in integer math, and never below 0. On each selection, every server that can take traffic gains 1 of effective weight, up to its weight.

**Rung 3, the real thing.** From `src/http/ngx_http_upstream_round_robin.c` `ngx_http_upstream_get_peer()` ~L811:
```c
peer->current_weight += peer->effective_weight;
total                += peer->effective_weight;
if (peer->effective_weight < peer->weight) { peer->effective_weight++; }
if (best == NULL || peer->current_weight > best->current_weight) { best = peer; }
...
best->current_weight -= total;
```
Trace for weights a = 3, b = 1, a listed first (as in the repo config):
```
step  after add (a, b)   pick   after subtract (a, b)
1     ( 3,  1)           a      (-1,  1)
2     ( 2,  2)  tie      a      (-2,  2)
3     ( 1,  3)           b      ( 1, -1)
4     ( 4,  0)           a      ( 0,  0)
sequence: a a b a
```
The classic case from the nginx commit that added the algorithm (52327e0, 2012), weights 5:1:1, gives `a a b a c a a`. The repo config lists `127.0.0.1:8004 weight=3` first and `127.0.0.1:8001 weight=1` second. The measured split is 18 and 6 out of 24 (S04-C107).

**Rung 4, exam depth.**
- *The slide sequence (S04-C106).* The slide and the tour say nginx emits `a b a a`. The code gives `a b a a` only when b is listed first. With a first, it gives `a a b a`. Both are rotations of one cycle: b gets one pick in four, and a never gets more than 3 in a row across cycles (section 7).
- *Why smooth.* For 3:1, naive `a a a b` and smooth `a a b a` repeat the same cycle and differ only in where it starts. Both send server a up to 3 picks in a row. The difference shows with 5:1:1. Naive gives `a a a a a b c`: a run of 5, with b and c back to back. Smooth gives `a a b a c a a`: b and c sit between the a picks, and each gets a pick within the first 5 requests. Across cycles, a still reaches a run of 4 (`c a a | a a b`). So "no bursts" means shorter runs and an even spread, not zero runs.
- *Passive health (S04-C109).* With weight 3 and max_fails 2, a failure lowers effective weight by 3 / 2 = 1 in integer math. For the weight-1 server, 1 / 2 = 0, so a failure lowers nothing, and only max_fails takes it out. Effective weight climbs back by 1 per selection. No probe traffic (S04-C110).
- *max_fails and fail_timeout.* 2 failures inside 10 s mark the server down for 10 s. The backup server gets traffic only when the primaries are down (beyond the slides, docs).
- *Per worker.* Without a `zone`, each worker runs its own counters. The 3:1 ratio holds per worker, and a small sample across workers can drift (beyond the slides).
- *Round robin lies (S04-Q07, S04-Q16).* A slow 200 is still a success, so weights do not react. least_conn counts active connections, which Little's law ties to latency.

**Misconceptions.**
- S04-M29: "Weighted round robin sends each server all its turns in a row." Wrong in nginx. Smooth WRR spreads them. Distractor in check 3.
- S04-M30: "Passive health checks catch a slow server that still returns 200." Wrong. Only the cases listed in proxy_next_upstream count as failures, here error, timeout, 502 and 503. A slow 200 never counts. Distractor in check 4.
- S04-M31: "The smooth sequence for 3:1 is always a b a a." Wrong. The start of the cycle depends on server order. Distractor in check 1.

**Diagrams.** Step-by-step: bars for each current weight, rising on "add" and dropping on "subtract", with the winner marked. Static: naive against smooth picks for 5:1:1 over 14 requests.

**Interactives.** *Smooth weighted round robin stepper.* Inputs: weights, server order, a "fail this server now" button, max_fails. The learner sees each add, pick and subtract, the sequence so far, and effective weight after a failure. The learner discovers that the cycle returns to zero, that order only rotates the sequence, and how a failed server earns traffic back. Priority P1. The same logic feeds the practice generator.

**Predict, observe, explain.** Command: in 07-nginx with epolld on 8004 and forkd on 8001, `: > logs/access.log` to empty the log from earlier labs, then `for i in $(seq 24); do curl -s "localhost:8082/x-$i-$RANDOM" -o /dev/null; done`, then `grep -o 'upstream=[0-9.:]*' logs/access.log | sort | uniq -c`. Predict the two counts. Observe: 6 for 8001 and 18 for 8004 (slide 24, README). The random path defeats the cache, so every request reaches an upstream.

**Worked example.** The 3:1 trace in rung 3.

**Faded example.** Weights a = 5, b = 1, c = 1, listed a, b, c. Total 7.
```
step  after add (a, b, c)   pick   after subtract
1     ( 5,  1,  1)          a      (-2,  1,  1)
2     ( 3,  2,  2)          a      (-4,  2,  2)
3     ( 1,  3,  3)          b      ( 1, -4,  3)
4     ( ?,  ?,  ?)          ?      ( ?,  ?,  ?)
5     ( 4, -2,  5)          ?      ( 4, -2, -2)
```
*(Step 4: add gives (6, −3, 4), pick a, subtract gives (−1, −3, 4). Step 5: pick c.)*

**Your turn.** Weights a = 2, b = 1, a listed first. Give the first 3 picks and the weights after step 3. *(a b a. After step 3: (0, 0).)*

**Checks.**
1. `mcq`: Slide 24 shows `a b a a` for 3:1. In the 1.31.5 code, with the weight-3 server listed first, what are picks 1 to 4? Answer: a a b a. Distractor: a b a a, whatever the server order (S04-M31). Feedback: the tie at step 2 goes to the first listed server. The slide order appears when b is listed first.
2. `numeric`: Weights 3:1, a first. What is the current weight of a after step 2? Answer: −2.
3. `mcq`: Weights 5:1:1, servers listed a, b, c. What are the first 7 picks in nginx? Answer: a a b a c a a. Distractor: a a a a a b c (S04-M29). Feedback: that is naive WRR, where b and c wait for five a picks.
4. `mcq`: One upstream answers 200 in 3 s instead of 30 ms. What does passive health checking do? Answer: nothing. Distractor: it lowers the effective weight of that server (S04-M30). Feedback: only the cases in proxy_next_upstream count, such as error, timeout, 502 and 503.
5. `numeric`: 24 requests at 3:1. How many go to the weight-1 server? Answer: 6.

**Review cards.**
- Q: The three steps of smooth WRR? A: add weights, pick the largest, subtract the total from the winner.
- Q: Smooth WRR 5:1:1 sequence? A: a a b a c a a.
- Q: Smooth WRR 3:1, heavy server first? A: a a b a.
- Q: What is passive health checking in nginx? A: effective weight drops on failure and climbs back per pick.
- Q: Which nginx edition sells active health checks? A: NGINX Plus.
- Q: What 3:1 sequence does slide 24 give for nginx smooth WRR? A: a b a a.

**Lab.** Run the predict command above. Then stop `01-fork/forkd`, empty the log again, and repeat. Expected: 8004 serves all 24 requests. A few lines still show `upstream=127.0.0.1:8001`, at most 2 per worker. Those are failed first tries: `$upstream_addr` logs `127.0.0.1:8001, 127.0.0.1:8004`, and the grep stops at the comma. After 2 failures (max_fails) a worker skips 8001 for 10 s. The error log shows the connection failures to 8001.

### s04-m11-parser-phases

- **Title:** A parser that can stop anywhere, and a request that can pause at any phase.
- **Minutes:** 22.
- **Big idea:** Non-blocking I/O forces every nginx parser to be a resumable state machine, and every request runs as a resumable walk through eleven phases.
- **Covers:** S04-C127, S04-C128, S04-C129, S04-C130, S04-C131, S04-C132, S04-C133, S04-C134, S04-C135, S04-C136.
- **Prereqs:** s04-m04-event-loop, s04-m09-routing, s01-m08-framing.
- **Threads:** T-framing.
- **Link to graded work:** the Session 5 calculator assignment needs to find where one request ends on a persistent connection. This module gives the concept only: bytes arrive in pieces, so a reader keeps state between reads. See s05-m12-assignment-prep. No parser code appears here.

**Pretest.**
1. A request line arrives in three TCP segments. Must nginx copy the first segment and wait? *Answer: no. It saves its state and resumes.*
2. How many HTTP phases does nginx have? *Answer: 11.*
3. In the phase loop, what does `return` mean? *Answer: slide 31 says suspended, not finished. In the code it means "stop running phases now": the request waits for an event, or a checker already finalized it.*

**Rung 1, the picture.** You do a crossword on the train. When the train stops, you pencil a mark at the clue and the letter where you stopped. On the next ride you start from the mark, not from clue 1. The phases are a passport office with 11 desks. If desk 7 needs a document that is not ready, you leave with a ticket that says "desk 7". When the document comes, you return straight to desk 7. *Where it breaks:* you remember the crossword in your head. The parser keeps only a small state number and pointers into its buffer. If the buffer must grow, every pointer must move with it.

**Rung 2, how it works.**
1. A read event brings some bytes into the connection buffer.
2. The parser loads its saved state and continues one byte at a time.
3. At the end of the bytes, it saves the state and returns "again".
4. The loop waits for the next read event and calls the parser again.
5. When the request line and headers are complete, the phase engine starts.
6. Each phase checker runs its handlers. A handler that waits returns, and the engine returns too.
7. When the event fires, the engine re-enters at the phase it left.

**Rung 3, the real thing.** `ngx_http_parse_request_line()` ~L108 in `src/http/ngx_http_parse.c` declares a 27-value state enum, from `sw_start` to `sw_almost_done`, and loops `for (p = b->pos; p < b->last; p++)` with a `switch (state)`. It saves `r->state` when the bytes run out. Method dispatch compares a machine word: on little-endian x86, the bytes `47 45 54 20` ("GET ") read as the 32-bit value `0x20544547` (S04-C131). The phases, from `ngx_http_core_module.h` ~L110:
```
POST_READ -> SERVER_REWRITE -> FIND_CONFIG -> REWRITE -> POST_REWRITE -> PREACCESS
          -> ACCESS -> POST_ACCESS -> PRECONTENT -> CONTENT -> LOG
```
The engine, `ngx_http_core_run_phases()` ~L894:
```c
while (ph[r->phase_handler].checker) {
    rc = ph[r->phase_handler].checker(r, &ph[r->phase_handler]);
    if (rc == NGX_OK) { return; }      /* stop now: waiting, or finalized */
}
```
The generic checker translates handler codes. A handler NGX_OK moves to the next phase and keeps the loop going. NGX_DECLINED moves to the next handler. NGX_AGAIN or NGX_DONE makes the checker return NGX_OK, which stops the loop until an event. A final status or an error makes the checker call `ngx_http_finalize_request()` and then also return NGX_OK. The content checker always does this. So every `return 200` on :8081 leaves the loop by the finalize path, not by a suspension.

**Rung 4, exam depth.**
- *The cost of non-blocking (S04-C130).* A blocking server can call read until it sees a blank line, because a waiting thread is its whole job. An event loop cannot wait, so every parser in nginx (HTTP, FastCGI, headers) keeps state between calls.
- *Buffer growth (S04-C132, S04-Q05).* The request line must fit one large buffer, 8 KB by default, or nginx answers 414. A single header over the buffer size gets 400.
- *Where handlers cannot go.* FIND_CONFIG, POST_REWRITE and POST_ACCESS take no module handlers. They are internal steps (beyond the slides, dev guide).
- *Suspended or finished (S04-C134).* The slide reads the loop return as "suspended". That holds when a handler returns NGX_AGAIN or NGX_DONE, as limit_req does when it delays a request. After a final status, the checker finalizes the request and the loop returns the same way (beyond the slides, section 7).
- *The grep misses proxy_pass (S04-C136).* proxy_pass and fastcgi_pass set a location content handler, not an entry in the CONTENT phase array. The slide grep lists static, index, autoindex and others, but not proxy or fastcgi (beyond the slides, section 7).
- *try_files is PRECONTENT.* A try_files redirect goes back through location search (s04-m09).

**Misconceptions.**
- S04-M32: "One read() returns the whole request line." Wrong. TCP can split it anywhere. Distractor in check 1.
- S04-M33: "A return from the phase loop always means the request is finished." Wrong. It also happens when a handler must wait, and the request resumes at the same phase. Distractor in check 3.
- S04-M44: "A handler returns NGX_OK when it must wait for an event." Wrong. In the generic checker (POST_READ, PREACCESS), a handler NGX_OK moves the request to the next phase. NGX_AGAIN or NGX_DONE makes the loop stop and resume later. Distractor in check 3.
- S04-M34: "proxy_pass registers a CONTENT phase handler, so the grep shows it." Wrong. It sets the location content handler. Distractor in check 4.

**Diagrams.** Step-by-step: the bytes of one request line arrive in three segments. The state number and the buffer pointers carry across calls. Static: the 11 phases as desks, with sample modules at each and the three handler-free phases greyed out.

**Interactives.** *Resumable parser stepper.* Inputs: a request line, and cut points that split it into segments. The learner sees each call, the byte being read, the saved state number, and the "again" return. The learner discovers that nothing is copied and each call resumes where the last one stopped. Priority P2. *Phase walker.* Inputs: a config with limit_req, auth_basic, try_files and proxy_pass, and events that delay a handler. The learner sees the request stop and resume at the same phase. Priority P2.

**Predict, observe, explain.** Command: in an nginx 1.31.5 clone, `grep -rn "NGX_HTTP_.*_PHASE\].handlers" src/http/modules/`. Predict: does `ngx_http_proxy_module.c` appear? Observe: no. The list shows static, index, autoindex, try_files, mirror, limit_req, limit_conn, access, auth_basic, realip, rewrite and log, among others. Captured output: the verification run for this file on nginx 1.31.5.

**Worked example.** `GET /index.html HTTP/1.1\r\n` is 3 + 1 + 11 + 1 + 8 + 2 = 26 bytes. It arrives as segments of 5, 10 and 11 bytes. Call 1 reads bytes 1 to 5 and saves its state. Call 2 reads bytes 6 to 15 and saves again. Call 3 reads bytes 16 to 26 and finishes. The scan never restarts from the start of the line, and nothing is copied. One exception: when the space after the method arrives, nginx compares the method bytes again as one word.

**Faded example.** The bytes `50 55 54 20` ("PUT ") read as a little-endian 32-bit word: `0x________`. *(20545550.)*

**Your turn.** The same request line arrives as 26 reads of 1 byte each, and every read triggers the parser. How many parser calls? *(26. Each call scans one new byte and saves the state.)*

**Checks.**
1. `mcq`: Why does nginx save `r->state`? Answer: the request line can arrive in several segments. Distractor: one read always holds the whole line (S04-M32). Feedback: TCP is a byte stream.
2. `numeric`: How many HTTP phases does nginx 1.31.5 have? Answer: 11.
3. `mcq`: limit_req must delay a request by 500 ms. What does its PREACCESS handler return, and what happens next? Answer: NGX_AGAIN. The checker returns NGX_OK, the loop returns, and a timer resumes the request at PREACCESS. Distractor: NGX_OK, the code for "wait" (S04-M44). Distractor: the handler blocks for 500 ms, because a loop return always means the request is finished (S04-M33). Feedback: a handler NGX_OK moves on to the next phase, and a blocked handler stalls the whole worker.
4. `mcq`: Why does the phase grep not list the proxy module? Answer: proxy_pass sets a location content handler. Distractor: proxy registers a CONTENT phase handler, and the grep pattern is wrong (S04-M34). Feedback: the location content handler replaces the CONTENT phase handlers for that location, so no array entry exists.
5. `order`: PREACCESS, CONTENT, ACCESS, PRECONTENT. Answer: PREACCESS, ACCESS, PRECONTENT, CONTENT.

**Review cards.**
- Q: States in the nginx request-line parser? A: 27.
- Q: Why must an event-loop parser resume? A: a read can stop anywhere in the bytes.
- Q: Phase of try_files? A: PRECONTENT.
- Q: Phase of auth_basic? A: ACCESS.
- Q: What does slide 31 say `return` in the phase loop means? A: suspended, not done.
- Q: Default status for a request line over the large buffer size? A: 414.

### s04-m12-reading-the-source

- **Title:** How to read nginx.
- **Minutes:** 15.
- **Big idea:** nginx is navigable by structure: find functions by name, read three protocol trees on one core, learn the pool and the queue first, and every module has the same four parts.
- **Covers:** S04-C01, S04-C89, S04-C116, S04-C117, S04-C118, S04-C119, S04-C120, S04-C121, S04-C122, S04-C123, S04-C124, S04-C125, S04-C126, S04-C144, S04-C145, S04-C146.
- **Prereqs:** s04-m11-parser-phases.
- **Threads:** T-law-or-habit.

**Pretest.**
1. Why does `grep -rn "^ngx_epoll_process_events" src/` find only the definition? *Answer: nginx puts the return type on the line above the name.*
2. When does nginx release the memory of one request? *Answer: when it destroys the request pool, all at once.*

**Rung 1, the picture.** A city renumbers its houses after every renovation, but the street names stay. So you navigate by street name. The city has three neighbourhoods (http, stream, mail) built on one shared ground floor (core). Food at a picnic comes on one paper plate, and you throw the whole plate away at the end instead of each crumb. That plate is the memory pool. *Where it breaks:* a keep-alive connection lives much longer than a picnic. So nginx keeps a pool per request and a separate pool per connection, and a large allocation still goes to malloc.

**Rung 2, how it works.**
1. Find a function by name at the start of a line, not by line number.
2. Read `src/core/ngx_queue.h` and `src/core/ngx_palloc.h` before any other file.
3. Pick a module. Find its directive table, its config callbacks, its module struct, and its handler.
4. From a directive, grep the name to find the struct field. Grep the field to find the code that reads it.

**Rung 3, the real thing.** The two greps, run on the 1.31.5 clone (S04-C125):
```
$ grep -rn '"sendfile"' src/            # 1: the directive table
src/http/ngx_http_core_module.c:404:    { ngx_string("sendfile"),
$ grep -rn "clcf->sendfile)" src/       # 2: the code that reads the field
src/http/ngx_http_core_module.c:1370:    if ((ngx_io.flags & NGX_IO_SENDFILE) && clcf->sendfile) {
```
Line 1370 sits inside `ngx_http_update_location_config()`. The four parts of a module, in the smallest one: `ngx_http_static_module.c` registers its handler with `h = ngx_array_push(&cmcf->phases[NGX_HTTP_CONTENT_PHASE].handlers);` at ~L289 (S04-C124). The ladder of slide 33 maps each repo program to its era and its lesson (S04-C144). Its results column keeps the run conditions of S04-C145.

**Rung 4, exam depth.**
- *Names over coordinates (S04-C116).* The tour pins lines to 1.31.5 (S04-C117). The skill is to find code by structure, so pins can drift without harm.
- *Three trees, one core (S04-C121).* src/http, src/stream and src/mail share the event loop, pools and buffers. The repetition is the argument for the design.
- *Intrusive list.* The link fields live inside the node, so adding a node allocates nothing. The node comes back from a link by subtracting the field offset. The cache LRU uses this list (S04-C89).
- *Pools (S04-C122, S04-C123).* No free on the hot path and almost no cleanup branches. The cost: memory stays allocated until the pool dies.
- *1,200 against 200,000 (S04-C146).* A `wc -l` on the repo gives 1,442 lines of C plus a 270-line config. The 1.31.5 src tree has 255,904 lines of C and headers. The gap is still error paths and portability.

**Misconceptions.**
- S04-M35: "Line numbers are the stable way to find code in nginx." Wrong. Names are stable, and lines drift each release. Distractor in check 1.
- S04-M38: "nginx frees each allocation when it is done with it." Wrong. It destroys the whole pool at the end. Distractor in check 2.

**Diagrams.** Static: the src tree as three houses (http, stream, mail) on one foundation (core, event, os). Static: the slide 33 ladder as a staircase from fork to nginx.

**Interactives.** *Two-greps guide.* Inputs: a directive name from a short list. The learner sees the first grep hit, the struct field, and the second grep hit. Priority P2.

**Predict, observe, explain.** Command: in an nginx 1.31.5 clone, `grep -rn '"sendfile"' src/`. Predict: does the directive live in a sendfile module or in the core HTTP module? Observe: `src/http/ngx_http_core_module.c:404`, in the core module command table. Captured output: the verification run for this file on 1.31.5, commit `231a60ee`.

**Worked example.** Two greps for `sendfile`. Grep 1 lands at `ngx_http_core_module.c` L404, in the command table. The entry names the setter `ngx_conf_set_flag_slot` and the location config field `sendfile`. Grep 2 for `clcf->sendfile)` lands at L1370, inside `ngx_http_update_location_config()`, where the flag reaches the connection.

**Faded example.** Two greps for `tcp_nopush`. Grep 1 lands at `ngx_http_core_module.c` L____. Grep 2 for `clcf->tcp_nopush` lands at L____, where the code checks ____. *(461 / 1426 / whether the location turned tcp_nopush off.)*

**Your turn.** Which phase does try_files register into? Prove it with one grep. *(PRECONTENT. `grep -n "PHASE\].handlers" src/http/modules/ngx_http_try_files_module.c` prints L411, `NGX_HTTP_PRECONTENT_PHASE`.)*

**Checks.**
1. `mcq`: The tour says a function sits near line 784, and your checkout shows something else there. What do you do? Answer: grep for the name at the start of a line. Distractor: trust the line number (S04-M35). Feedback: names stay the same across releases, and lines move.
2. `mcq`: When does nginx release the memory of a request? Answer: when it destroys the request pool. Distractor: after each use, with free() (S04-M38). Feedback: one pool per request, destroyed at the end, so the hot path has no free().
3. `recall`: The four parts of every nginx module? Answer: directive table, config callbacks, module struct, handlers.

**Review cards.**
- Q: How do you find an nginx function definition with grep? A: search for the name at the start of a line.
- Q: What does nginx destroy at the end of a request instead of freeing each allocation? A: the request pool.
- Q: What does 03-select show on the repo ladder? A: the 1024 wall.

### s04-m13-fastcgi-records

- **Title:** FastCGI framing, one more time.
- **Minutes:** 20.
- **Big idea:** A FastCGI record carries its own length and an empty record ends each stream, so one protocol uses both framing rules.
- **Covers:** S04-C137, S04-C138, S04-C139, S04-C140, S04-C141, S04-C142, S04-C143, S04-C160, S04-C161, S04-C162, S04-C163, S04-C164, S04-C165, S04-C166, S04-C172.
- **Prereqs:** s04-m12-reading-the-source, s03-m05-fastcgi-servlets, s01-m08-framing.
- **Threads:** T-framing, T-setup-off-path, T-skip-unknown.
- **Session 3 owns the record format** (s03-m05-fastcgi-servlets). This module links it, recaps it in rung 3, and adds the nginx side: the parser states, request id 1, the request builder and the :8083 run. See the Session 3 and 4 boundary in `README.md`.
- **Link to graded work:** the Session 5 project asks for a binary frame header with defended field widths. FastCGI appears here as a finished example to read. This module does not suggest widths or a layout for the project. See s05-m13-project-studio.

**Pretest.**
1. What are the first 8 bytes nginx sends to a FastCGI app? *Answer: `01 01 00 01 00 08 00 00`.*
2. How does FastCGI say "no more parameters"? *Answer: an empty PARAMS record.*
3. Where does the app put its response headers? *Answer: at the start of the STDOUT stream, CGI style, before a blank line.*

**Rung 1, the picture.** A long letter travels as a row of envelopes. Each envelope has a label with its kind (questions, body, answer) and its word count. An empty envelope labelled "questions" means "no more questions". The reader never searches the words for an end mark. *Where it breaks:* real envelopes can get lost or arrive out of order. TCP never loses or reorders bytes, so FastCGI needs no sequence numbers. The request id only says which request an envelope belongs to.

**Rung 2, how it works.**
1. nginx connects to the app. Only with `fastcgi_keep_conn on` does it ask the app to keep the connection (S04-C166).
2. It sends BEGIN_REQUEST with role RESPONDER and request id 1.
3. It sends the CGI variables as name-value pairs in PARAMS records, then an empty PARAMS record.
4. It sends the body in STDIN records of about 64 KiB, then an empty STDIN record.
5. The app sends STDOUT records: CGI-style headers, a blank line, the body. An empty STDOUT record and END_REQUEST follow (S04-C164).
6. nginx reads each 8-byte header with a nine-state parser and turns the headers into an HTTP response (S04-C172).

**Rung 3, the real thing.**
```
>> BEGIN_REQUEST                         (06-fastcgi/fcgi_client)
01 01 00 01 00 08 00 00  00 01 00 00 00 00 00 00
|  |  |---| |---| |  |   |---| |  |------------|
v  ty reqid clen  pad res role  flg  reserved (5)
>> PARAMS   <- EMPTY = end of PARAMS
01 04 00 01 00 00 00 00
```
Header: version 1, type 1 (`BEGIN_REQUEST`), request id 0x0001, content length 0x0008, padding 0, reserved 0. Body: role 0x0001 (RESPONDER), flags 0 (do not keep the connection), 5 reserved bytes. The empty record has type 4 (PARAMS) and content length 0. nginx parses this header byte by byte in `ngx_http_fastcgi_process_record()` ~L2742, and rejects any request id other than 1 at ~L2786 (S04-C141). The tour lists the parser states: st_version, st_type, st_request_id_hi, st_request_id_lo, st_content_length_hi, st_content_length_lo, st_padding_length, st_reserved, st_data (S04-C172). `ngx_http_fastcgi_create_request()` ~L858 computes the total size first, allocates one time, then fills (S04-C142). On the way back, `fcgi_responder.c` L142-152 writes one STDOUT record with the headers and body, an empty STDOUT record, and END_REQUEST (S04-C164).

**Rung 4, exam depth.**
- *Both framing rules (S04-C140).* A length in each record header lets the body hold any byte. The empty record ends a stream. Chunked encoding in Session 5 has the same shape.
- *Skip what you do not know.* A FastCGI app answers an unknown management record with an UNKNOWN_TYPE record, so the other side can continue (beyond the slides, FastCGI spec).
- *"Every connection on earth".* nginx always opens with those 8 bytes. Another client can send a GET_VALUES record with request id 0 first, or use another request id (beyond the slides).
- *Padding is a SHOULD (S04-C165).* The sender picks the padding and writes it in the header. A reader takes the value from the header and never computes it. The spec only recommends 8-byte alignment.
- *What FastCGI saves (S04-C162, S04-C163).* The responder is php-fpm without PHP: one process that never forks. The instructor estimates about 5-20 ms of CGI setup against about 0 ms. No run in the sources measures it, so lessons show it as an estimate. Session 3 counts the processes (S03-Q12).
- *Why no multiplexing.* See S04-Q08.

**Misconceptions.**
- S04-M36: "FastCGI ends a stream with a special byte sequence in the data." Wrong. It ends with a record of length 0. Distractor in check 1.
- S04-M37: "nginx multiplexes many FastCGI requests on one connection." Wrong. It uses request id 1 and one request per connection. Distractor in check 2.

**Diagrams.** Static: the 16 `BEGIN_REQUEST` bytes with a label over each field. Step-by-step: the records of one :8083 request in both directions, with each empty record marked as an end of stream.

**Interactives.** Reuse the *FastCGI record hex annotator* of s03-m05-fastcgi-servlets. Do not build a second simulator.

**Predict, observe, explain.**
- Command: `make run-fcgi`, then `06-fastcgi/fcgi_client 127.0.0.1 9000 /hello 'a=1&b=2'`. Predict the first 16 bytes on the wire. Observe: `01 01 00 01 00 08 00 00 00 01 00 00 00 00 00 00`. Captured output: NGINX-TOUR.md Stop 10.
- Command: start `06-fastcgi/fcgi_responder 9000` and nginx in `07-nginx`, then `curl 'localhost:8083/hello?a=1'` (S04-C160, S04-C161). Predict: which record types does the responder log, in order? Expected from the code: BEGIN_REQUEST with `keep_conn=0`, one or more PARAMS, an empty PARAMS, an empty STDIN, then the responder line `-> STDOUT n bytes, STDOUT 0 (eof), END_REQUEST`. curl prints the pairs, with `QUERY_STRING = a=1` among them. The sources hold no capture, so confirm on a local run.

**Worked example.** Decode `01 06 00 01 01 2c 04 00`. Version 1. Type 6, STDOUT. Request id 0x0001 = 1. Content length 0x012c = 300. Padding 4, read from the seventh byte (offset 6). That value gives 8-byte alignment: (8 − 300 mod 8) mod 8 = 4, and 300 + 4 = 304 = 38 × 8. Reserved 0. The full record is 8 + 300 + 4 = 312 bytes.

**Faded example.** Decode `01 05 00 01 00 00 00 00`. Type: ____. Content length: ____. Meaning: ____. *(5, STDIN / 0 / the request body is over.)*

**Your turn.** The client sends a value of 199 bytes (`HTTP_X_LONG_HEADER`). Write its 4-byte length field. *(199 = 0xC7, so `80 00 00 c7`.)*

**Checks.**
1. `mcq`: How does a FastCGI app know the parameters are complete? Answer: a PARAMS record with content length 0. Distractor: a `\r\n\r\n` inside the data (S04-M36). Distractor: an `FCGI_END_REQUEST` record after the input (S03-M37). Feedback: the end marker is structural. END_REQUEST comes from the app, after its reply.
2. `mcq`: nginx sends 10 concurrent PHP requests to one php-fpm. How many FastCGI connections, without fastcgi_keep_conn? Answer: 10. Distractor: 1, multiplexed by request id (S04-M37). Distractor: fewer than 10, because the keep_conn flag puts several requests on one connection at once (S03-M38). Feedback: nginx uses request id 1 only. Keep-conn only reuses a connection for the next request.
3. `bytes`: A record header has content length 13. What padding makes the record end on an 8-byte boundary? Answer: 3. Feedback: (8 − 13 mod 8) mod 8 = 3, and 8 + 13 + 3 = 24.

**Review cards.**
- Q: The first 8 bytes nginx sends to FastCGI? A: `01 01 00 01 00 08 00 00`.
- Q: The FastCGI record header size? A: 8 bytes.
- Q: What follows the empty STDOUT record from the app? A: END_REQUEST.

## 6. Beyond the slides

| Fact | Reference | Module |
|---|---|---|
| The first web server ran on a NeXT at CERN in 1990. Mosaic was the Andreessen browser for X, released by NCSA in 1993. | w3.org/History.html | s04-m01 |
| McCool left NCSA in mid-1994. Apache 0.6.2 shipped in April 1995, Apache 1.0 on 1 December 1995. Apache passed NCSA httpd in 1996 (Netcraft). | httpd.apache.org/ABOUT_APACHE.html | s04-m01 |
| Archive tarball dates: Apache 1.3.0 on 1998-06-05, httpd 2.0.35 on 2002-04-06, httpd 2.4.1 on 2012-02-19. | archive.apache.org/dist/httpd | s04-m01 |
| Apache 2.4 picks event when the platform has threads and thread-safe polling, which is almost always. | httpd.apache.org/docs/2.4/mpm.html | s04-m01 |
| fork fails with EAGAIN at RLIMIT_NPROC, threads-max or pid_max. A zombie keeps its PID and a process table slot until the parent waits for it, or until init adopts and reaps it. | man 2 fork (EAGAIN), man 2 wait (NOTES) | S04-Q18, S04-Q27 |
| nginx 0.1.0 on 2004-10-04 was the first public version. 1.0.0 came on 2011-04-12. 1.11.3 on 2016-07-26 turned accept_mutex off and added EPOLLEXCLUSIVE. | nginx CHANGES (docs/xml/nginx/changes.xml in 1.31.5) | s04-m02, s04-m03 |
| accept_mutex_delay defaults to 500 ms. multi_accept is ignored with kqueue. `user` defaults to nobody. worker_connections counts upstream connections too. | nginx.org/en/docs/ngx_core_module.html | s04-m03, s04-m07 |
| On EMFILE or ENFILE, nginx logs the accept failure at crit level and removes its listen sockets from epoll. With accept_mutex off it adds them back after accept_mutex_delay. With the mutex on it releases the mutex and sets accept_disabled to 1. No reserve descriptor and no 503 exist. | nginx 1.31.5 `ngx_event_accept.c` ~L85, ~L112 to ~L130 | s04-m03 |
| A worker whose master dies closes the control channel and keeps running. | nginx 1.31.5 `ngx_process_cycle.c` `ngx_channel_handler()` ~L1035 | S04-Q27 |
| accept_disabled acts in the loop only when accept_mutex is on. With EPOLLEXCLUSIVE, a positive value makes the worker re-add its listen socket. | nginx 1.31.5 `ngx_event.c` ~L219, `ngx_event_accept.c` `ngx_reorder_accept_events()` ~L450 | s04-m03 |
| EPOLLEXCLUSIVE exists since Linux 4.5 and helps avoid the thundering herd. SO_REUSEPORT exists since Linux 3.9 and gives each thread its own listen socket. | man 2 epoll_ctl, man 7 socket | s04-m03 |
| nginx posts events only while it holds the accept mutex. Otherwise handlers run inline inside the epoll batch loop. | nginx 1.31.5 `ngx_epoll_module.c` ~L890 to ~L901, `ngx_event.c` ~L228 | s04-m04 |
| With `timer_resolution` set, the loop sleeps with no timer limit, and a setitimer signal updates the clock. | nginx 1.31.5 `ngx_event.c` ~L201, ~L705 to ~L719 | s04-m04 |
| keepalive_timeout defaults to 75 s and client_header_timeout to 60 s. nginx sets the header timer at accept and does not reset it when part of a header arrives. The listen backlog defaults to 511 on Linux, as `common.h` also says (S04-C169). | nginx 1.31.5 `ngx_http_core_module.c` ~L3618, ~L3980, `ngx_http_request.c` ~L366, `ngx_http_read_request_header()` ~L1600, `ngx_posix_config.h` ~L143 | s04-m04, s04-m03 |
| nginx uses edge-triggered epoll (EPOLLET) for connection events on Linux, and level-triggered for listen sockets. | nginx 1.31.5 `auto/os/linux`, `ngx_event.h` ~L353, `ngx_epoll_module.c` `ngx_epoll_init()` | s04-m05 |
| `ngx_get_connection()` flips the instance bit. The free list is LIFO, so the struct freed last is reused first. | nginx 1.31.5 `src/core/ngx_connection.c` ~L1211 to ~L1280 | s04-m05 |
| A descriptor leaves an epoll interest list only after all duplicates of it close (the instructor states this in S04-C171). epoll_wait reports one ready descriptor at most once per call, so a stale event needs a handler that closes a different connection. | man 7 epoll, Linux `fs/eventpoll.c` `ep_poll_callback()` and `ep_send_events()` | s04-m05 |
| On Linux, configure builds the select module only with `--with-select_module`, because epoll exists. `use select;` then fails with `invalid event type "select"`. With the module, nginx refuses worker_connections above FD_SETSIZE and logs each descriptor at or above it. | nginx 1.31.5 `auto/os/linux` L56, `auto/modules` L6-14, `ngx_select_module.c` ~L151 to ~L157, ~L425 to ~L430, `ngx_event.c` ~L1147 | S04-Q26 |
| FD_SET with fd at or above FD_SETSIZE is undefined behavior. select first appeared in 4.2BSD. | man 2 select | s04-m05 |
| Extra reference for S04-C60, S04-C61 and S04-C167. read plus send: 4 context switches and 4 copies, 2 by CPU. sendfile: 2 switches and 3 copies, 1 by CPU. With NIC gather support: 2 copies, both DMA. | IBM Developer, "Java ZeroCopy I/O optimization" (developer.ibm.com/articles/j-zerocopy) | s04-m06 |
| One sendfile call transfers at most 0x7ffff000 = 2,147,479,552 bytes. The man page recommends TCP_CORK for headers before file data. | man 2 sendfile | s04-m06 |
| `sendfile` defaults to off. The docs also say `tcp_nopush` works only with sendfile (S04-C170). | nginx.org/en/docs/http/ngx_http_core_module.html | s04-m06 |
| TCP_CORK combines with TCP_NODELAY since Linux 2.5.71. Setting TCP_NODELAY flushes pending output even while corked. A cork holds data for at most 200 ms. | man 7 tcp | s04-m06 |
| nginx reads file buffers with pread, so strace shows pread64, not read. gzip compresses only when the client accepts gzip, the type is in gzip_types (text/html by default), and the length reaches gzip_min_length (20). | nginx 1.31.5 `ngx_files.c` `ngx_read_file()` ~L31, `ngx_http_gzip_filter_module.c` ~L221 to ~L260, `ngx_http_gzip_ok()` in `ngx_http_core_module.c` ~L2128, nginx.org gzip module docs | s04-m06 |
| The gzip header filter sets `main_filter_need_in_memory`. The copy filter then reads the file into memory instead of passing the file buffer on. | nginx 1.31.5 `ngx_http_gzip_filter_module.c` ~L289, `src/core/ngx_output_chain.c` ~L288 to ~L299 | s04-m06 |
| proxy_buffering and proxy_request_buffering default to on. That is how nginx absorbs slow clients. | nginx.org/en/docs/http/ngx_http_proxy_module.html | s04-m07 |
| Since 1.29.7, upstream keepalive is on by default (32), proxy_http_version defaults to 1.1, and nginx does not send Connection upstream. | nginx.org/en/docs/http/ngx_http_upstream_module.html, nginx CHANGES | s04-m07 |
| `$proxy_add_x_forwarded_for` is the client X-Forwarded-For value with `$remote_addr` appended. | nginx.org/en/docs/http/ngx_http_proxy_module.html | s04-m07 |
| The realip module replaces the client address only for requests from addresses in set_real_ip_from. | nginx.org/en/docs/http/ngx_http_realip_module.html | s04-m07 |
| keys_zone: 1 MB holds about 8,000 keys. inactive defaults to 10 minutes. The cache loader starts one minute after start. The levels example path. | nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_path | s04-m08 |
| The eviction check reads `fcn->expire`, which nginx sets to access time plus inactive. | nginx 1.31.5 `ngx_http_file_cache.c` ~L977, ~L1900 | s04-m08 |
| The manager runs a second pass while the cache is over max_size, or over a watermark of 7/8 of the key count after the zone once filled. That pass deletes the LRU tail with no reader, fresh or not. The inactive pass sleeps at most 10 s. | nginx 1.31.5 `ngx_http_file_cache.c` `ngx_http_file_cache_forced_expire()` ~L1761, `..._expire()` ~L1860, `..._manager()` ~L2022, `..._set_watermark()` ~L2343 | s04-m08 |
| proxy_cache_lock covers a new cache element. An expired entry gets EXPIRED for the refresher and UPDATING for others, with use_stale updating. The lock timeout defaults to 5 s and skips caching. | proxy module docs, nginx 1.31.5 `ngx_http_upstream.c` ~L969, `ngx_http_file_cache.c` ~L655 | s04-m08 |
| A response with Set-Cookie is not cached. A response with `Vary: *` is not cached. | nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_valid | s04-m08 |
| `^~` skips regexes only if it is the longest matching prefix. 1.31.5 adds predicate locations after regexes. A slash-ending prefix with proxy_pass redirects the bare name with 301. | nginx.org/en/docs/http/ngx_http_core_module.html#location | s04-m09 |
| The static location tree splits on location name prefixes, not on `/`. Each level is a balanced binary tree over sorted names, and `tree` points at longer names that share the node name. | nginx 1.31.5 `ngx_http.c` `ngx_http_create_locations_list()` ~L1100, `ngx_http_create_locations_tree()` ~L1164 | s04-m09 |
| try_files redirects internally to the last parameter if no file exists. The last parameter can be a named location or `=code`. | nginx.org/en/docs/http/ngx_http_core_module.html#try_files | s04-m09 |
| An internal redirect loop stops after 10 URI changes with a 500. | nginx 1.31.5 `ngx_http_request.h` NGX_HTTP_MAX_URI_CHANGES | s04-m09 |
| Smooth WRR came in commit 52327e0 (2012-05-14). 5:1:1 gives a a b a c a a. Ties go to the first listed peer, because the compare is strict. | github.com/nginx/nginx commit 52327e0, `ngx_http_upstream_round_robin.c` ~L884 | s04-m10 |
| A failure lowers effective_weight by weight / max_fails in integer math, clamped at 0. Each selection raises it by 1, up to weight, for every peer that can take traffic. proxy_next_upstream defines a failure, and http_403 and http_404 never count. `$upstream_addr` lists every server tried, separated by commas. | nginx 1.31.5 `ngx_http_upstream_round_robin.c` ~L884, `..._free_round_robin_peer_locked()` ~L1064 to ~L1077, `ngx_http_upstream.c` `ngx_http_upstream_next()` ~L4599, nginx.org upstream module docs (max_fails, $upstream_addr) and proxy module docs (proxy_next_upstream) | s04-m10 |
| Without `zone`, each worker keeps its own upstream state. least_conn picks the fewest active connections, with weights, and breaks ties with WRR. max_fails defaults to 1, fail_timeout to 10 s. | nginx.org/en/docs/http/ngx_http_upstream_module.html | s04-m10 |
| Phase handler return codes, and the three phases that take no handlers. A location content handler replaces the CONTENT phase handlers. | nginx.org/en/docs/dev/development_guide.html#http_phases | s04-m11 |
| A checker also returns NGX_OK after it finalizes the request: always in the content phase, and on a final status in the generic and rewrite checkers. limit_req returns NGX_AGAIN when it delays a request. | nginx 1.31.5 `ngx_http_core_module.c` `ngx_http_core_generic_phase()` ~L916, `..._rewrite_phase()` ~L953, `..._content_phase()` ~L1302, `ngx_http_limit_req_module.c` ~L328 | s04-m11 |
| large_client_header_buffers defaults to 4 8k. A request line over one buffer gives 414. A header field over one buffer gives 400. | nginx.org/en/docs/http/ngx_http_core_module.html#large_client_header_buffers | s04-m11 |
| On little-endian builds, the 4-byte method compare reads a uint32. It rereads the method bytes from the start of the request when the space arrives. | nginx 1.31.5 `ngx_http_parse.c` ~L42 | s04-m11 |
| A pool sends an allocation too large for its block to the system allocator. | nginx.org/en/docs/dev/development_guide.html#pool | s04-m12 |
| Measured in 1.31.5: 255,904 lines of C and headers in src, try_files module 419 lines, static module 297, ngx_queue.h 115. Repo: 1,442 lines of C, config 270. | `wc -l` on the clone and on `sources/cn-at-scaler/lesson4/nginx-from-scratch` | s04-m12 |
| The stock fastcgi_params file sets 19 names, including DOCUMENT_ROOT, REMOTE_PORT, SERVER_NAME and REDIRECT_STATUS. nginx also passes client headers as HTTP_ names by default. | nginx 1.31.5 `conf/fastcgi_params`, `ngx_http_fastcgi_module.c` ~L3284 | s04-m13 |
| FastCGI management records use request id 0. An app answers an unknown management type with FCGI_UNKNOWN_TYPE. The spec recommends 8-byte record alignment, and the sender writes paddingLength in the header. | FastCGI specification, sections 3.3 and 4 (fastcgi-archives.github.io) | s04-m13 |

## 7. Open questions

1. **Smooth WRR sequence for 3:1.** Slide 24, the tour and the config comment say nginx emits `a b a a`. The code emits `a a b a` when the weight-3 server comes first, as in the repo config. The two are rotations of one cycle. The modules teach the code order, keep a card with the slide order, and use "a b a a whatever the order" as a named misconception (S04-M31). Also, for 3:1 the naive `a a a b` is the same cycle as smooth, so "no bursts" shows only with weights such as 5:1:1. Confirm the instructor meant the pattern, not the exact start.
2. **Mode-switch count on slide 16.** The slide counts 2 mode switches per chunk for read plus write, and 0 for sendfile. The usual count is 4 transitions per pair and 2 per sendfile call. The "both DMA" part is not a gap: the instructor ties it to a scatter-gather NIC with checksum offload in three sources (S04-C167). Confirm which switch count the instructor wants in a quiz.
3. **proxy_cache_lock scope on slide 21.** The slide describes the lock for an expired popular object. The instructor's own config comment says "ONE request goes to the origin on a miss" (`nginx.conf` L172). The docs and code agree with the comment: the lock covers a new element only, and `updating` protects an expired one. Check what the instructor said in class. Check 6 of s04-m08 carries a beyond-the-slides badge.
4. **Posted events on slide 12.** "Handlers are posted and drained after" holds only while the worker holds the accept mutex. With the default, handlers run inline. Also, slide 12 says callbacks come from line 2 or 6, and the tour says line 3 or 6. The code runs handlers from lines 2, 3, 5 and 6.
5. **accept_disabled with the mutex off.** Slide 13 presents the 7/8 rule as the live balance rule. With the default settings on Linux, it only triggers the EPOLLEXCLUSIVE re-add. s04-m03 teaches both.
6. **epolld.c stale check.** The comment says epolld does what nginx does "with an explicit generation counter", but the code never compares `gen`. Today no stale event can reach a new client, because each handler closes only its own connection and epoll reports a descriptor at most once per batch. The gap matters only after a change, such as a timeout sweep. s04-m05 check 6 frames it that way. Do not edit the source.
7. **epolld.c on level-triggered.** The comment says nginx uses level-triggered epoll by default. nginx 1.31.5 uses EPOLLET for connections.
8. **Apache 1.3 label on slide 33.** Slide 33 and `forkd.c` label fork-per-client "Apache 1.3, 1995". Slide 6 says Apache 1.3 was prefork, and the 1.3.0 tarball dates from June 1998. s04-m01 teaches slide 6.
9. **Demo file size.** Slide 17 measures a 64 MB file. The Makefile `bigfile` target makes 256 MB, so a learner sees 8,192 syscalls in read mode, not 2,048. s04-m06 says so.
10. **select work units.** Slide 14 and `selectd.c` say 30,000 units. The `epolld.c` comment says 10,000. The modules use the slide count of three passes.
11. **try_files comment.** The :8084 comment says try_files hands "the whole URI to the app as a query string". `$args` carries only the original query string. The app reads the path from REQUEST_URI. Slide 25 states it correctly.
12. **"A patchy server".** The slide gives this as the Apache name story. This pass did not confirm it against an Apache Foundation page. Keep it as the instructor story in "The story" box, without a stronger claim.
13. **Drifted counts.** "About 1,200 lines" (1,442 lines of C), "nginx is 200,000" (255,904), "try_files 390 lines" (419), "static 240 lines" (297), "ngx_queue.h about 50 lines" (115 with comments). Minor. Lessons quote the slide and show the measured count once.
14. **Cache loader in ps.** The tour lists a cache loader. Slide 11 shows none. The loader starts one minute after startup and exits after it loads the index. Explain this when a learner does not see it.
15. **Session 6 topic.** Slides 36 of Session 4 and the Session 5 deck preview "Where did all the state go?". The course table lists Session 6 as "(Ab)using CDNs". No module covers the preview (S04-C150). Confirm the Session 6 topic.
16. **Homework status.** The slide 34 homework does not appear in the grading table. This file treats it as practice and gives answer outlines. Confirm that the course does not grade it.
17. **Module map changes.** New module `s04-m13-fastcgi-records` (next free number). s04-m12 held two big ideas, so slide 32 and the FastCGI claims moved to s04-m13, and s04-m12 keeps slides 26 to 29 and 33. NGINX-TOUR.md Stop 3 (accept4, multi_accept) went to s04-m03. Slide 33 rows serve as evidence in s04-m02 and s04-m05, while the ladder stays in s04-m12. Slide 28 (ngx_queue) also supports s04-m08. Slide 35 idea 4 (S04-C149) moved to s04-m01.
18. **Measured numbers are one machine.** Every measured value comes from the instructor laptop over loopback: the sendfile table, the 3:1 split, rt=2.001 and the slide 33 results. Pages that show them must keep that condition.
19. **sendfiled.c on system CPU.** The comment says "SYSTEM CPU is where the copies show up. Watch sys collapse." The measured table (64 MB, loopback) shows sys 37.3, 23.1 and 32.3 ms: 13% lower from read to sendfile, and mmap lowest. S04-Q24 no longer promises a sys drop. A scratch run here (Fedora 44, 64 MiB, loopback, 3 runs) did show sys near 13.4 ms for read and 2.3 ms for sendfile, and wall near 15.4 ms against 11.1 ms. So both the sys result and the "flat wall time" of S04-C69 depend on the machine. Lessons show the instructor numbers and say so.
20. **epolld.c on EMFILE.** The comment says nginx keeps a spare descriptor so that it can close it, accept, and send a 503. nginx 1.31.5 has no such code. It removes its listen sockets from epoll and retries after accept_mutex_delay (500 ms). s04-m03 teaches the code (S04-C159).
21. **nginx.conf "Force select".** The comment suggests `use select;` and a new flood. With `worker_connections 4096`, nginx refuses to start, and a default Linux build has no select module at all. S04-Q26 gives the working steps.
22. **fcgi_responder.c header.** It starts nginx with `07-nginx/fastcgi.conf`, which the repo does not have, and curls port 8080. The real config serves FastCGI on :8083 (S04-C160).
23. **Phase grep on slide 31.** Slide 31 and NGINX-TOUR.md Stop 6 put proxy_pass and fastcgi_pass among the CONTENT handlers that the grep maps. On 1.31.5 it lists 17 modules, and neither proxy nor fastcgi is one. They set a location content handler. s04-m11 teaches this (S04-M34).
24. **nginx.conf :8082 split check.** The comment says the 3:1 split "should show up in the two servers' own logs" after `seq 20`. forkd and epolld log no requests, and 20 requests give 15:5. The README method, 24 requests and a grep of the nginx access log, gives 18:6.
25. **1999 or 2002.** Slide 9 says Sysoev started nginx in 2002. Slides 27 and 31 and the tour say "in 1999" for src/core and the phase engine. S04-C118 and S04-C134 keep the slide wording without the year as fact. Ask which date the instructor means.
26. **"return means suspended" on slide 31.** The loop also returns after a checker finalizes the request, for example after `return 200` on :8081. s04-m11 teaches both cases (S04-M33, S04-M44).
27. **"The entire eviction policy" on slide 20.** The code has a second pass that deletes fresh entries when the cache is over max_size or the keys_zone fills. s04-m08 teaches both passes.
28. **"One URI segment at a time" on slide 23.** The tree splits on location name prefixes, not on `/` segments. s04-m09 rung 4 carries the code version.
29. **"Mutually exclusive" CORK and NODELAY.** The nginx code comment and the :8080 config comment say so. The kernel allows both since Linux 2.5.71, but NODELAY flushes corked data. s04-m06 rung 4 explains it.
30. **":8080 sendfile off -> read(2)".** nginx reads files with pread, so strace shows pread64. S04-Q21 uses pread64.
31. **One distractor per choice check.** 36 `mcq` and `predict` checks in s04-m01 to s04-m12 give one distractor, so they have 2 options. The lesson contract asks for 3 or 4 options, and Sessions 1, 2, 3 and 5 give at least 2 distractors. Before Phase 6, a curriculum pass adds a second distractor to each one, with a misconception ID, and runs the accuracy review on it.
32. **FastCGI taught twice.** Resolved 2026-09-14. S04-C137 to S04-C140 and S04-C164 are now `detail` rows that point to the Session 3 IDs. s04-m13 links s03-m05, reuses its annotator, and drops two cards that repeated Session 3 cards.
