# Session 1: Network programming 101

## 1. Header

- **Title:** Network programming 101.
- **Approximate date:** 2026-08-12. The telnet demo on slide 17 shows `Date: Wed, 12 Aug 2026 16:06:35 GMT`.
- **Instructor subtitle:** "Network programming, from the socket up".
- **Deck sections:** 01 the server, 02 you already have a client, 03 writing the client, 04 http and curl, 05 many clients at once, 06 protocol design, homework, closing.

**Sources used**

| Path | What it gives | Trust |
|---|---|---|
| `sources/session-01/slides.txt` | the full deck, 48 PDF pages | high |
| `sources/session-01/slides.pdf` | the same deck, read for highlights (slide 5) | high |
| `sources/session-01/notes.md` | AI notes: fork, exec, pipes and message queues, threads, pools, DNS hijacking, text vs binary | low |
| `sources/cn-at-scaler/lesson1/01..11 *.c` | echo servers, SIGPIPE pair, clients, BCD, base64, TLV, DER | high |
| `sources/cn-at-scaler/README.md` | build steps, the SIGPIPE demo, the encoding table | high |
| `sources/session-02/slides.txt` slides 4, 5, 29, 36, 41 | socket slides that map here, framing callbacks | high |
| `sources/session-03/slides.txt` slide 18, `session-05` slide 16 | "no third option" callbacks | high |

**Slide numbers.** "Slide N" in this file is PDF page N, as in the Module IDs table in `docs/curriculum/README.md`. See Open questions 1.

**Verification runs.** Every "verified" note below comes from a run on 2026-09-13: Fedora, Linux 7.1.8, x86_64, loopback, curl 8.18, OpenSSL 3.5. The runs used copies of the demo code on spare ports 2031 to 2041 and 9000. No source file changed.

**Source gaps.**
- No class transcript. Slide 9 prints both answers to its thought experiment. What the instructor added in class is unknown.
- Divider slides name topics with no slide of their own: "A quick tour of the RFC" and "Testing headers on purpose" (slide 25), and strace (slide 28). The class content for these is unknown.
- `notes.md` is a thin AI summary with citation junk. This file marks its claims as low confidence.
- Slides 13, 14 and 20 use port 8080. The repo files use 2026.

**Confidence.** High for the socket calls, ports, the accept queue, signals and the encodings: slides, code and verified runs agree. Medium for the claims from `notes.md` only. Medium for the parts of the class that had no slide.

## 2. The session in one paragraph

Every program that talks over a network, from a 20-line echo server to Express or nginx, runs the same seven system calls. This session builds that server from nothing and then breaks it on purpose. It skips a call, kills the peer, forgets a byte swap, and floods the queue. Each break shows what the kernel does for you and what it hides. Then it turns to the question every protocol must answer: TCP gives a stream of bytes, so where does one message end? The session closes with the tools for designing bytes on the wire: framing, BCD, base64, TLV, ASN.1 and RPC. A working engineer cares because framework bugs that look like magic come from these calls: a hang, a silent death, a message cut in half.

## 3. Claim inventory

Core count: 92 of 146.

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S01-C01 | Deck title: network programming from the socket up. 2.5 hours, 7 system calls, port 2026. | `slide 1` | story |
| S01-C02 | The course plan lists eight weeks, from network programming to building for failures. | `slide 2` | story |
| S01-C03 | The session runs bottom-up, from the smallest TCP server to a binary protocol of your own. | `slide 3` | detail |
| S01-C04 | A TCP server is seven system calls: socket, bind, listen, accept, read, write, close. | `slide 5` | core |
| S01-C05 | Express, Flask and net/http wrap this same sequence. | `slide 5` | core |
| S01-C06 | The slide marks socket, bind, listen and accept as "the four that only a server makes". | `slide 5` | detail |
| S01-C07 | The echo server reads once, writes the same bytes back, closes, and loops to the next client. | `slide 6`, `01_echo_server.c` | core |
| S01-C08 | Two commands run it: gcc builds the server, and nc talks to port 2026. | `slide 7` | detail |
| S01-C09 | Only root can bind a port below 1024. Anyone can bind 1024 and up. | `slide 8` | core |
| S01-C10 | The 1024 line says who may break the rule. It is not a rule nobody can break. | `slide 8` | correction |
| S01-C11 | Low ports on the slide: 80 HTTP, 443 HTTPS, 25 SMTP, 21 FTP, 110 POP. | `slide 8` | core |
| S01-C12 | High ports on the slide: 3000 node, 8080 alt-http, 6379 redis, 2026 for the class. | `slide 8` | detail |
| S01-C13 | A server on port 80 runs as root, so a bug in its request parser gives an attacker root. | `slide 8` | core |
| S01-C14 | Real deployments bind 8080 as a normal user. A front proxy owns 80 and 443. | `slide 8` | core |
| S01-C15 | With no bind(), the client gets "Connection refused". The kernel answers the SYN with an RST. | `slide 9` | core |
| S01-C16 | A refusal is fast, loud and easy to debug. | `slide 9` | detail |
| S01-C17 | With bind() but no accept(), the kernel finishes the handshake. The connection waits in the queue. | `slide 9` | core |
| S01-C18 | That client hangs. It is silent and slow, and it looks like an overloaded server. | `slide 9` | core |
| S01-C19 | One read() is not a conversation. The persistent server loops until read() returns 0. | `slide 10`, `02_echo_server_persistent.c` | core |
| S01-C20 | The second listen() argument sizes a queue for connections the kernel accepts for you. | `slide 11` | core |
| S01-C21 | When accept() returns, the TCP connection already exists. The client already waited in line. | `slide 11` | core |
| S01-C22 | A full queue is not portable: a refusal on some systems, an endless "Trying..." on others. | `slide 11` | correction |
| S01-C23 | The class code passes 1. Real servers pass hundreds. | `slide 11` | detail |
| S01-C24 | Linux caps the backlog at net.core.somaxconn, so the number in the code may not apply. | `slide 11` | core |
| S01-C25 | The backlog is the depth of the accept queue, not a limit on connections. | `session-02 slide 4` | core |
| S01-C26 | A write to a socket the peer closed kills the process by default, with no error message. | `slide 12` | core |
| S01-C27 | Signal numbers: 2 SIGINT (Control-C), 9 SIGKILL, 13 SIGPIPE, 15 SIGTERM. | `slide 12` | core |
| S01-C28 | No program can catch SIGKILL. SIGTERM is the polite kill. | `slide 12` | core |
| S01-C29 | SIGHUP comes on SSH disconnect. Control-Z stops a process (the slide names SIGSTOP and SIGTSTP). | `slide 12` | detail |
| S01-C30 | The SIGPIPE server reads once, sleeps 1 s, then writes twice. The second write never runs. | `slide 13`, `04_sigpipe_server.c` | core |
| S01-C31 | SO_LINGER {1, 0} makes close() send RST instead of FIN. | `slide 14`, `05_sigpipe_client.c` | core |
| S01-C32 | A normal close sends FIN and leaves TIME_WAIT. Linger 0 sends RST, drops unsent data, skips TIME_WAIT. | `session-02 slide 5` | core |
| S01-C33 | Linger 0 is fast and lossy. Use it to show the difference, not in production. | `session-02 slide 5` | detail |
| S01-C34 | The demo server exits with status 141, which is 128 plus SIGPIPE (13). | `cn-at-scaler/README.md §SIGPIPE demo` | core |
| S01-C35 | You already have clients: telnet, openssl s_client for encrypted services, netcat for the rest. | `slide 15` | core |
| S01-C36 | If a protocol is text, your keyboard is a working client for it. | `slide 16` | core |
| S01-C37 | telnet opens any TCP port: google.com 80, localhost 2026, a mail server on 25. | `slide 16` | detail |
| S01-C38 | telnet to google.com 80 with a GET and a Host line got 301 Moved Permanently. The instructor's Mac laptop, live google.com over the internet, 2026-08-12. | `slide 17` | measured |
| S01-C39 | That 301 carried Location http://www.google.com/ and Content-Length 219. The instructor's Mac laptop, live google.com over the internet, 2026-08-12. | `slide 17` | measured |
| S01-C40 | The reply showed Server gws, a max-age of 2592000 (30 days), and the date 12 Aug 2026. The instructor's Mac laptop, live google.com over the internet, 2026-08-12. | `slide 17` | measured |
| S01-C41 | Most services do not speak HTTP. | `slide 18` | detail |
| S01-C42 | With TLS in the way, telnet is useless. openssl s_client does the handshake for you. | `slide 18` | core |
| S01-C43 | nc connects to a port, and nc -l listens on one. | `slide 18` | core |
| S01-C44 | The client is shorter: socket, connect, write, close. It has no bind, listen or accept. | `slide 20`, `session-02 slide 5` | core |
| S01-C45 | connect() is the call that starts the TCP handshake. | `session-02 slide 5` | core |
| S01-C46 | Clients do not bind. The kernel picks the client port at connect() time. | `slide 21` | core |
| S01-C47 | A server binds a known port, because clients need a fixed address to aim at. | `slide 21` | core |
| S01-C48 | The client port comes from the ephemeral range, typically 32768-60999 on Linux. | `slide 21` | core |
| S01-C49 | TIME_WAIT holds each port for about 60 s after close, so busy clients run out. | `slide 21` | core |
| S01-C50 | Port 2026 is 0x07EA. | `slide 22` | core |
| S01-C51 | A little-endian laptop (x86, ARM) stores it as EA 07. Network byte order is big-endian: 07 EA. | `slide 22` | core |
| S01-C52 | htons means host to network, short. htonl does 4 bytes. ntohs and ntohl convert back. | `slide 22` | core |
| S01-C53 | gethostbyname() is a whole protocol: DNS behind a synchronous call that can block for seconds. | `slide 23` | correction |
| S01-C54 | The lookup reads /etc/hosts first, before any network traffic, so a stale entry wins. | `slide 23` | core |
| S01-C55 | Next, one UDP datagram goes to the resolver. It recurses: root, TLD, authoritative. | `slide 23` | core |
| S01-C56 | The answer stays in a cache for the TTL: fast when warm, seconds when cold. | `slide 23` | core |
| S01-C57 | Use getaddrinfo() in real code. gethostbyname() is IPv4-only and not thread-safe. | `slide 23`, `07_sigpipe_client_getaddrinfo.c` | core |
| S01-C58 | Twenty lines touch three layers: the echo protocol at 7, TCP and ports at 4, IP at 3. | `slide 24` | core |
| S01-C59 | Layer 2 is Ethernet and Wi-Fi with MAC addresses. Layer 1 is copper, fibre and radio. | `slide 24` | detail |
| S01-C60 | An HTTP client is the client with a request string: port 80, write the text, read until close. | `slide 26` | core |
| S01-C61 | HTTP lines end in CRLF, and the blank line after the headers is mandatory. | `slide 26` | core |
| S01-C62 | curl is the best HTTP teaching tool: plain, -i for headers, -vv for header and SSL detail. | `slide 27` | core |
| S01-C63 | The echo server serves exactly one client at a time. | `slide 29` | core |
| S01-C64 | fork() per connection is simple. The OS schedules, and a crash stays inside one child. | `slide 29` | core |
| S01-C65 | fork costs one process per client: fine for hundreds, hopeless at ten thousand. | `slide 29` | core |
| S01-C66 | select and epoll let one process ask the kernel which sockets are ready. | `slide 29` | core |
| S01-C67 | The event loop is harder to write, and one slow handler blocks everything. nginx and Node use it. | `slide 29` | core |
| S01-C68 | Both designs still ship in production today. | `slide 29` | detail |
| S01-C69 | fork() returns twice: 0 in the child, the child PID in the parent, -1 on failure. | `slide 30` | core |
| S01-C70 | The parent closes its copy of the client fd and goes back to accept(). | `slide 30`, `slide 31` | core |
| S01-C71 | Almost nobody checks for the -1 return of fork(). | `slide 30` | detail |
| S01-C72 | select is portable and O(n): rebuild the set on each call, and the kernel walks all of it. | `slide 32` | core |
| S01-C73 | FD_SETSIZE caps select at about 1024 descriptors. | `slide 32` | core |
| S01-C74 | epoll is Linux-only and O(ready): register once, get back only the descriptors that changed. | `slide 32` | core |
| S01-C75 | kqueue does this on BSD and macOS, IOCP on Windows. nginx and Node build on these calls. | `slide 32` | detail |
| S01-C76 | Chrome opened at most 6 connections per host. Requests 7 to 10 waited in a queue. | `slide 33` | core |
| S01-C77 | A connection limit is not a browser quirk. It is the client side of the same resource problem. | `slide 33` | correction |
| S01-C78 | ulimit -n is the ceiling on open file descriptors. Sockets count. It is often 1024. | `slide 33` | core |
| S01-C79 | A pool opens a connection once and reuses it, so later requests skip the TCP and TLS handshakes. | `slide 33`, `notes.md` | core |
| S01-C80 | INADDR_ANY listens on every interface. Bind a specific address when you mean one. | `slide 34` | core |
| S01-C81 | Promiscuous mode shows traffic that is not yours. On a hub, every frame reaches every port. | `slide 34` | detail |
| S01-C82 | Packet sniffers work this way, and that is why plaintext protocols died. | `slide 34` | story |
| S01-C83 | Without SO_REUSEADDR, a restart fails with "address already in use" while old sockets sit in TIME_WAIT. | `slide 34` | core |
| S01-C84 | tcpdump -w writes a capture of port 2026. -r reads it, -A shows ASCII, -X shows hex. | `slide 35` | core |
| S01-C85 | SSL secures TCP, not HTTP. It sits under the application protocol. | `slide 36` | correction |
| S01-C86 | TLS agrees on a shared secret with asymmetric crypto, then uses faster symmetric crypto for data. | `slide 36` | core |
| S01-C87 | A certificate binds a key to an identity, and the CA chain is why you trust it. It can expire at 3am. | `slide 36` | core |
| S01-C88 | Pinning trusts one exact certificate instead of any CA. Mobile apps often pin. | `slide 36` | detail |
| S01-C89 | Text won, and protocols now go binary again: HTTP/1.1 is text, HTTP/2 is binary. | `slide 38` | core |
| S01-C90 | Text is readable with telnet, tcpdump and logs. It is verbose, ambiguous at the edges, slow to parse. | `slide 38` | core |
| S01-C91 | Binary is compact, unambiguous and cheap to parse. It needs tools, so hex and base64 fluency matters. | `slide 38` | core |
| S01-C92 | TCP gives a byte stream, not messages. Framing is the most important decision in a protocol. | `slide 39` | core |
| S01-C93 | The slide gives three framing answers: fixed length, delimiter, length prefix. | `slide 39` | core |
| S01-C94 | Fixed length is trivial and unambiguous. It wastes padding, and N can never change. | `slide 39` | core |
| S01-C95 | A delimiter, like the HTTP blank line, is simple until the delimiter shows up inside the data. | `slide 39` | core |
| S01-C96 | A length prefix, like Content-Length 219, is binary-safe. Most modern protocols use it. | `slide 39` | core |
| S01-C97 | Later decks say framing is length or delimiter, with no third option. | `session-02 slide 41`, `session-03 slide 18`, `session-05 slide 16` | core |
| S01-C98 | BCD uses four bits per decimal digit: 98765 packs to 98 76 5F. | `slide 40` | core |
| S01-C99 | In BCD, the hex dump shows the decimal digits unchanged. | `slide 40` | core |
| S01-C100 | BCD is half the size of ASCII, needs no conversion, keeps exact decimal math. SIM cards, SMS, card payments use it. | `slide 40` | detail |
| S01-C101 | The BCD sample packs two digits per byte and pads an odd last digit with nibble F. | `08_bcd.c` | detail |
| S01-C102 | ASN.1: write the grammar once, and a tool generates the encoder and decoder. | `slide 41` | core |
| S01-C103 | ASN.1 dates from 1984 and still sits under X.509, LDAP, SNMP and the telecom stack. | `slide 41` | story |
| S01-C104 | The instructor ranks ASN.1 above every other schema system he knows. | `slide 41` | story |
| S01-C105 | The sample schema: Item is a SEQUENCE with an INTEGER code limited to 1..99999, a VisibleString color limited to "Black", "Blue" or "Brown", and a BOOLEAN. | `slide 42` | detail |
| S01-C106 | A DER INTEGER is tag 0x02, a length, the value. It adds 0x00 when the top bit is 1. | `11_asn1_der.c` | core |
| S01-C107 | A DER SEQUENCE is tag 0x30, a length, then its child TLVs. | `11_asn1_der.c` | core |
| S01-C108 | TLV is type, length, value, repeated: "ASN.1 you can write on a napkin". | `slide 43` | core |
| S01-C109 | A parser can skip a type it never saw, because the length tells it how far to jump. | `slide 43` | core |
| S01-C110 | That skip makes TLV forward compatible. The slide names TLS extensions, ISO 8583 and protobuf. | `slide 43` | core |
| S01-C111 | The TLV sample uses a 1-byte type and a 1-byte length. | `10_tlv.c` | detail |
| S01-C112 | Hex is for reading: two characters per byte, next to the ASCII in tcpdump -X. | `slide 44` | core |
| S01-C113 | Hex fluency means you spot a length prefix or a repeated tag by eye. | `slide 44` | detail |
| S01-C114 | base64 is for transport through text-only channels: Basic auth, JWTs, email attachments, data URIs. | `slide 44` | core |
| S01-C115 | base64 costs 33% more bytes, because 3 bytes become 4 characters. It is a wrapper, not a design. | `slide 44` | core |
| S01-C116 | The base64 sample uses the RFC 4648 alphabet. | `09_base64.c`, `README.md` | detail |
| S01-C117 | RPC means framing plus a function name: marshal the name and arguments, frame them, send them. | `slide 45` | core |
| S01-C118 | Marshalling is the easy part. | `slide 45` | detail |
| S01-C119 | The network is not a function call: calls fail halfway, time out when the work may or may not have run, get retried. | `slide 45` | core |
| S01-C120 | gRPC is RPC with protobuf underneath: faster than JSON, easier to understand than ASN.1. | `slide 46` | core |
| S01-C121 | gRPC is schema first: a .proto file generates client and server code in any language. | `slide 46` | core |
| S01-C122 | protobuf puts tag-length-value on the wire, so new fields do not break old clients. | `slide 46` | core |
| S01-C123 | gRPC runs on HTTP/2: binary, with many streams on one connection. | `slide 46` | core |
| S01-C124 | The cost of gRPC: plain curl cannot read it. It buys speed with debuggability. | `slide 46` | core |
| S01-C125 | Redis traffic is RESP: text and length-prefixed, easy to spot in Wireshark. | `slide 47` | detail |
| S01-C126 | Every framework sits on the seven calls. Find the accept() inside yours. | `slide 48` | core |
| S01-C127 | The demo code skips error checks on purpose, to stay short. | `README.md §Notes` | detail |
| S01-C128 | Watch ps: the fork server grows one process per client, and the select server stays at one. | `README.md §fork vs. select` | detail |
| S01-C129 | Text protocols are easy to debug. SMTP separates the parts of a mail with delimiters. | `notes.md` | detail |
| S01-C130 | Fixed-length headers give a predictable layout. Variable-length messages are more common today. | `notes.md` | detail |
| S01-C131 | fork() copies the process, with its memory and file descriptors. | `notes.md` | detail |
| S01-C132 | exec() replaces the program in a process. A shell forks, then the child calls exec. | `notes.md` | detail |
| S01-C133 | A pipe carries data one way between processes. | `notes.md` | detail |
| S01-C134 | Threads share one process. Processes have separate memory and descriptors, and talk over pipes or sockets. | `notes.md` | detail |
| S01-C135 | DNS hijacking redirects DNS queries, so a user can land on a malicious site. | `notes.md` | detail |
| S01-C136 | The slide says select and epoll need no context switching and no per-client memory. It means no process and no stack per client (Open questions 9). | `slide 29` | core |
| S01-C137 | fork() returns -1 when the system is out of processes or memory. | `slide 30` | detail |
| S01-C138 | The two RPC steps have names: marshalling and demarshalling. | `slide 45` | core |
| S01-C139 | Binary has no whitespace rules and no case-sensitivity arguments. | `slide 38` | detail |
| S01-C140 | Readability, with telnet, tcpdump and logs, is most of why HTTP won. | `slide 38` | detail |
| S01-C141 | gRPC won because it combines speed against JSON with clarity against ASN.1. | `slide 46` | story |
| S01-C142 | A normal close leaves the socket in TIME_WAIT for 2 MSL. | `session-02 slide 5` | core |
| S01-C143 | The class named message queues, next to pipes, as a way for processes to talk. | `notes.md` | detail |
| S01-C144 | Threads suit work with heavy input and output. | `notes.md` | detail |
| S01-C145 | Binary protocols suit places where speed and efficiency matter. | `notes.md` | detail |
| S01-C146 | The slide says the same TLS machinery protects SSH, SMTP and database connections. SSH has its own transport (Open questions 9). | `slide 36` | detail |

Program outputs for the samples, re-run 2026-09-13: `08_bcd` prints `12 34 56 78 9F`. `09_base64` prints `SGVsbG8sIEFTTi4xIQ==`. `10_tlv` prints `01 05 68 65 6C 6C 6F`. `11_asn1_der` prints `30 07 02 01 05 02 02 00 C8`.

## 4. Instructor questions

**S01-Q01. What breaks if you skip bind()?** (slide 9, thought experiment) The client gets "Connection refused" at once. Nothing listens on 2026, so the kernel answers the SYN with an RST. A Linux detail sharpens the answer: listen() on an unbound socket picks a random ephemeral port. So the server does listen, on a port nobody knows (verified: `0.0.0.0:54601`). The failure is fast and loud, so it is easy to debug.

**S01-Q02. What breaks with bind() but no accept()?** (slide 9, thought experiment) The kernel finishes the handshake, and connect() succeeds. Bytes from the client get an ACK and wait in the server buffer. No reply comes, so the client waits for its own timeout. TCP sees nothing wrong. On Linux, backlog N holds N + 1 connections. After that, new SYNs get no answer, and connect() retries for about 127 s. From outside, it looks like an overloaded server.

**S01-Q03. Why does it matter who binds port 80?** (slide 8) Binding 80 needs root or the CAP_NET_BIND_SERVICE capability. A parser bug in a root process hands the attacker root. So the app binds 8080 as a normal user, and a small front proxy owns 80 and 443. Session 4 shows the same split inside nginx.

**S01-Q04. The client is shorter. Notice what it leaves out.** (slide 20) It has no bind, no listen and no accept, and it names no port for itself. The kernel picks an ephemeral port at connect(). It checks no return value. It also never calls read(), so it never sees an echo. The slide copy aims at port 8080. The repo copy aims at 2026.

**S01-Q05. The server serves one client. What does a second client see?** (derived from slide 29, not asked on a slide) Its handshake completes in the queue, and its bytes get an ACK. It sees no echo while the first client stays. When the first client leaves, accept() returns the second one, and its queued bytes echo at once.

**S01-Q06. fork() fails and nobody checks. What does the fork server do?** (derived from slide 30, not asked on a slide) fork() returns -1, which is not 0, so the code takes the parent path. The parent closes the client fd. The client sees the connection close with no echo. The server logs nothing and calls accept() again.

**S01-Q07. Find the accept() inside your framework.** (slide 48) Run the framework under `strace -f -e trace=listen,accept,accept4`. Python `http.server` shows `listen(3, 5)`, then one `accept4(3, ...)` for each connection (verified). Node, Go and Java reach the same kernel call through their runtimes.

**S01-Q08. Read the socket options man page once.** (slide 34) Read `man 7 socket` and `man 7 tcp`. Find SO_REUSEADDR, SO_REUSEPORT, SO_LINGER, SO_KEEPALIVE, SO_RCVBUF, SO_SNDBUF and TCP_NODELAY. For each one, write what changes on the wire. The "history lesson" the slide promises: `answer: needs class audio`.

**S01-Q09. Homework 1: find Redis traffic in Wireshark or tcpdump.** (slide 47) Capture port 6379 on loopback while `redis-cli LLEN mylist` runs. The command crosses as `*2\r\n$4\r\nLLEN\r\n$6\r\nmylist\r\n`. Each `$N` is a length prefix, and CRLF ends each part. So RESP uses both framing rules. That explains why Session 2 slide 36 lists Redis under delimiter.

**S01-Q10. Homework 2: write a server and a client in your language.** (slide 47) Checklist: map each of the seven calls and connect() to the names in your language. Python keeps the names. Go folds socket, bind and listen into `net.Listen`. Java hides them in `ServerSocket`. Test your server with nc and your client against the C echo server.

**S01-Q11. Homework 3: make them do more than echo, and notice your framing choice.** (slide 47) Most people reach for a newline delimiter first. Test three cases: a message that holds the delimiter, a message larger than one read buffer, and two messages that arrive in one read. Each case breaks one naive rule. This skill feeds the Session 5 assignment, so the site gives tests, not code.

**S01-Q12. Homework 4: write base64 from scratch.** (slide 47) Checklist: take 3 bytes as 24 bits, cut four 6-bit groups, map each group to the 64-character alphabet, and pad a short last group with `=`. Test with RFC 4648 §10: "f" gives `Zg==`, "fo" gives `Zm8=`, "foo" gives `Zm9v`, "foobar" gives `Zm9vYmFy`.

**S01-Q13. Homework 5: pass complex messages with TLV, then add a field.** (slide 47) Checklist: nest a TLV inside a value, show an optional field by its absence, and skip an unknown type by its length. Test a new sender with an extra type against the old parser. The old parser must return the same fields as before. The Session 5 project needs this property, so the site gives tests, not a frame layout.

**S01-Q14. Homework 6: write a client that imitates curl.** (slide 47) Checklist: print the status line and headers, follow Location on 301, 302, 307 and 308 with a hop limit, and read a body by Content-Length or by chunked encoding. Read RFC 9112 §6 and §7.1. Use `curl -i` on the same URL as the reference output.

**S01-Q15. How does the receiver know the message ended?** (slide 39 title) TCP gives bytes, not messages, so the protocol must mark the end. Slide 39 gives three answers: a fixed length, a delimiter, a length prefix. Later decks say "length or delimiter". A fixed length is a length both sides agreed on ahead of time, so the two lists agree (s01-m08-framing).

## 5. Modules

Site order: m01, m02, m03, m04, m05, m06, m07, m08, m09, m11, m10. Module m11 is new (see Open questions 2).

### s01-m01-seven-syscalls

- **Title:** Seven system calls: the whole of a TCP server.
- **Minutes:** 20.
- **Big idea:** Every TCP server, from a 20-line class demo to a big web toolkit, makes the same seven requests to the operating system, and the operating system does the network work between them.
- **Covers:** S01-C01, S01-C02, S01-C03, S01-C04, S01-C05, S01-C06, S01-C07, S01-C08, S01-C19, S01-C126, S01-C127.
- **Prereqs:** none.
- **Threads:** T-framing.

**Pretest.** Plain words, because the pretest comes before the lesson (lesson contract v2, rule 10, 2026-09-14). The page asks the same three items again in the exit quiz.
1. A server program must ask the operating system for help to talk over the network. What does it ask for, from its start up to its first answer to a client? *Answer: seven requests: socket, bind, listen, accept, read, write, close.*
2. A server program told the operating system to take clients, but it did not ask for its next client yet. A new client connects. What happens? *Answer: the kernel finishes the connection, and the client waits in a line.* Distractors: the client waits, not connected, until the program asks (S01-M03). The kernel drops the bytes of the client until the program reads (S01-M47).
3. A server asks for the bytes of a client and gets 0 bytes. What happened? *Answer: the client closed its side. That is end of file.*

**Rung 1, the picture.** A story paragraph for each part, in one scene (lesson contract v2). The phone table failed the 10-year-old test: callers do not sit on a bench.

- *Parts 1 to 3, a shop in a mall.* A shopkeeper cannot build walls or doors, so the mall office does that work. The shopkeeper asks the office for a shop (socket, and key tag 3 is the fd), a number on the door (bind, port 2026), and a line of customers that a guard of the office keeps (listen, the kernel keeps the queue). The shopkeeper calls "next, please" and hands the customer at the counter a ticket with the number 4 (accept, fd 4, while the shop, fd 3, stays open), hears a word and says it back (read, write), says goodbye (close) and calls the next customer (the loop). Where this breaks: the shopkeeper talks face to face, but every byte of a program goes through the kernel. The guard only lines customers up, but the kernel finishes the whole handshake before the program knows about the client. A customer speaks whole words, but a read gets whatever bytes wait.
- *Part 4, a mailbox.* Your friend is the client, you are the server, and each note is a line. Your answer goes into the mailbox of your friend (write). You take out every note that waits (read). An empty box means you wait. A sign "no more notes" means stop (read returns 0). Where this breaks: notes are separate papers, but two lines that wait together come out as one run of bytes (s01-m08-framing).

**Rung 2, how it works.**
1. socket() makes an endpoint and returns fd 3.
2. bind() gives it address 0.0.0.0 and port 2026.
3. listen() turns it into a listening socket with a queue.
4. A client connects. The kernel completes the handshake and queues the connection.
5. accept() takes the connection and returns a new fd, 4. The listening fd 3 stays open.
6. read() and write() move bytes on fd 4.
7. close(4) ends this client. The loop goes back to accept().

**Rung 3, the real thing.** `01_echo_server.c` lines 6 to 19 hold all seven calls. Line 17 reads once, line 18 writes the same bytes, line 19 closes. `02_echo_server_persistent.c` line 18 loops until read() returns 0. A verified strace of the persistent server with one client that sends two lines:

```
socket(AF_INET, SOCK_STREAM, IPPROTO_IP) = 3
bind(3, {sin_port=htons(2037), sin_addr=inet_addr("0.0.0.0")}, 16) = 0
listen(3, 1)               = 0
accept(3, NULL, NULL)      = 4
read(4, "one\n", 4096)     = 4
write(4, "one\n", 4)       = 4
read(4, "two\n", 4096)     = 4
write(4, "two\n", 4)       = 4
read(4, "", 4096)          = 0
close(4)                   = 0
```

With the one-read server, the same client gets `one` back and never `two` (verified with nc). The code checks no return value, on purpose (S01-C127). Slide 5 marks socket() as server-only, but the client calls socket() too. Only a server calls listen and accept. A server always calls bind. A client usually skips bind and lets connect() choose the port.

**Rung 4, exam depth.**
- *Why a new fd for each client?* The listening socket must stay free for the next handshake. Each connection has its own four-tuple, so it gets its own fd.
- *A client sends 10,000 bytes to the one-read server.* One read() takes at most 4,096 bytes. The server writes those back and closes with bytes still unread. Linux then sends RST, not FIN (beyond the slides). The client sees "connection reset".
- *Where is accept() in Express or net/http?* Inside the runtime: libuv for Node, the net package for Go, socketserver for Python. strace shows the kernel call (S01-Q07).
- *Which calls belong to whom?* Only a server calls listen and accept. A server always calls bind. A client usually skips bind and lets connect() choose the port. connect is the client call. socket, read, write and close belong to both.
- *The story box.* Slide 2 lists the eight-week course plan, from network programming to building for failures. Slide 3 says the session runs bottom-up, from the smallest TCP server to a binary protocol of your own (S01-C02, S01-C03).

**Misconceptions.**
- S01-M01: "A framework talks to the network in some other way." Wrong: it wraps the same calls. Distractor in check 2.
- S01-M02: "socket() is a server-only call." Wrong: the client calls it first. Distractor in check 3.
- S01-M03: "accept() does the TCP handshake." Wrong: the kernel finishes the handshake before accept() returns. Distractor in check 4.
- S01-M04: "One read() returns one whole message." Wrong: a read returns the bytes that wait, which can be part of a message or parts of two. Distractor in check 5.
- S01-M45: "A client calls listen() to wait for the reply." Wrong: listen() only prepares a socket to take new connections. The reply comes to the connected socket through read(). Distractor in check 3.
- S01-M46: "The kernel speaks HTTP, and a framework asks it for requests." Wrong: the kernel moves TCP bytes, and the framework parses the HTTP text itself. Distractor in check 2.
- S01-M47: "Bytes that arrive before the server calls read() are lost." Wrong: the kernel keeps them in the receive buffer until a read takes them. Distractor in check 5.

**Diagrams.**
- Static: seven boxes in call order. listen and accept carry a "server only" mark, bind carries "server, client optional", and connect sits beside them for the client.
- Step-by-step: three lanes (client, kernel, server). The handshake runs in the kernel lane, then the queue, fd 3 and fd 4 appear.

**Interactives.**
- *Syscall theater* (P1). Inputs: a "next call" button, a toggle for the one-read or the loop server, a "client sends a second line" button. The learner sees each call, its return value, the queue and the fd table. The learner discovers that the handshake happens before accept(), and that the one-read server drops line two.

**Predict, observe, explain.** Build `01_echo_server.c` and run `(printf 'one\n'; sleep 0.5; printf 'two\n'; sleep 0.5) | nc 127.0.0.1 2026`. Predict: how many lines come back? Observe: one, `one`. Repeat with `02_echo_server_persistent.c`: two lines. The captured output is the verification run in rung 3. The page asks this as check 6, and uses check 5 as its predict block.

Two quick sends to the persistent server on loopback, verified 2026-09-14: when the client sends both lines right after connect(), the first read got both lines in 5 runs of 5 (`read(4, "one\ntwo\n", 4096) = 8`). When the server already waits inside read(), the first read got only `one` in 3 runs of 10. With Fedora's `nc` (Ncat 7.92), `nc` does not end when the one-read server closes. It ends at Control-C or at the end of its input.

**Worked example, faded example, your turn.**
- *Worked:* The strace above. Each read returns 4, because `one\n` is 4 bytes. The last read returns 0 when nc closes, and the server calls close(4).
- *Faded:* A client sends `hello\n` and quits. `accept → 4`, `read(4) → ____`, `write(4) → ____`, `read(4) → ____`. *(6, 6, 0.)*
- *Your turn:* With `02_echo_server_persistent`, a client sends `ab\n`, then `cdef\n` half a second later, then quits. `accept → 4`, `read(4) → ____`, `write(4) → ____`, `read(4) → ____`, `write(4) → ____`, `read(4) → ____`. *(3, 3, 5, 5, 0.)*

**Checks.**
1. `numeric` (the site shows no `order` item yet, so the order moves to card 1 and the pretest): the one-read server gets `hi` and a newline. What does read() return? Answer: 3 bytes. Distractor: 2, the newline is a byte too.
2. `mcq`: how does Flask reach the network? Answer: through the same kind of system calls, such as accept(). Distractor: a private network stack of its own (S01-M01). Distractor: it asks the kernel for HTTP requests (S01-M46). Feedback: Flask parses the HTTP text itself. Under strace, Python's server shows accept4, recvfrom and sendto, not read and write.
3. `mcq`: which call do both the client and the echo server make? Answer: socket(). Distractor: accept() (S01-M02). Distractor: listen() (S01-M45). Feedback: every endpoint starts with socket(). The slide says socket is among "the four that only a server makes". The client calls it too. On the quiz, expect the slide wording.
4. `mcq`: when accept() returns, the handshake is? Answer: already complete. Distractor: about to start (S01-M03). Distractor: halfway, and accept() waits for the last ACK (S01-M03). Feedback: the kernel did it while the client waited in the queue.
5. `predict`: a client sends `one\n` and `two\n` back to back, with no pause, to the persistent server on loopback. What can the first read() return? Answer: `one\n` or both lines (8 bytes), as the bytes happen to wait. Distractor: always exactly `one\n`, because a read returns one message (S01-M04). Distractor: only bytes sent after read() started, because earlier bytes are dropped (S01-M47). Feedback: a read takes every byte that waits, up to the buffer size.
6. `numeric`: the one-read server gets `one`, then `two` half a second later, then the client quits. How many lines come back? Answer: 1. Distractors: 2 (the one read returns before `two` arrives) and 0 (the one read gets `one` and writes it back).

**Review cards.**
- Q: The seven server calls, in order? A: socket, bind, listen, accept, read, write, close.
- Q: What does read() return when the peer closes? A: 0.
- Q: What does accept() return? A: a new fd for one client.
- Q: Which client call starts the handshake? A: connect().
- Q: Why does the one-read server lose the second line? A: it closes after one read.
- Q: Which two calls does only a server make, and never a client? A: listen() and accept(). (It replaces a card about what slide 5 marks, because a card never asks which slide says what.)
- Q: When accept() gives a client to the program, what state is the handshake in? A: already complete, done by the kernel.
- Q: What do Express, Flask and net/http call underneath? A: the same seven system calls.

### s01-m02-ports-and-queue

- **Title:** Ports and the accept queue: refused, queued or hung.
- **Minutes:** 22.
- **Big idea:** Before your code runs, the port and the accept queue decide what a client sees: a refusal, a wait in line, or a silent hang.
- **Covers:** S01-C09, S01-C10, S01-C11, S01-C12, S01-C13, S01-C14, S01-C15, S01-C16, S01-C17, S01-C18, S01-C20, S01-C21, S01-C22, S01-C23, S01-C24, S01-C25, S01-C80, S01-C83.
- **Prereqs:** s01-m01-seven-syscalls.
- **Threads:** T-honest-benchmarks (full-queue behavior differs by system, so a local result can mislead).
- **Note:** slide 34 (INADDR_ANY, SO_REUSEADDR) moved here from s01-m06. See Open questions 2.

**Pretest.**
1. A server calls bind() and listen() but never accept(). Does the client connect() succeed? *Answer: yes. The kernel finishes the handshake.*
2. No process listens on port 2026. What does the client see, and how fast? *Answer: "Connection refused", at once.*
3. listen(fd, 1). Is 1 the limit on total clients? *Answer: no. It is the depth of the accept queue.*

**Rung 1, the picture.**

| The picture | The real thing |
|---|---|
| Each door in a street has a number. Doors below 1024 need a master key. | A port. Ports below 1024 need root. |
| No clinic behind a door: a guard says "nobody here" at once. | No listener: the kernel sends RST. |
| The doctor never calls a name. The nurse seats you and you wait in silence. | bind and listen, no accept: the queue. |
| The waiting room is full. The nurse ignores your knock, so you knock again. | A full queue on Linux drops the SYN. |

Where this breaks: a Linux waiting room of size N seats N + 1 people. A patient who already sits in the room waits forever, because TCP sees nothing wrong.

**Rung 2, how it works.**
1. A SYN arrives for port 2026.
2. No socket listens on 2026: the kernel sends RST. The client gets "Connection refused".
3. A listener exists and its queue has room: the kernel completes the handshake and queues it.
4. The client connect() returns success. Its data gets an ACK and waits in a buffer.
5. accept() removes one connection from the queue.
6. The queue is full: Linux drops the SYN, and the client retries for about 127 s.

**Rung 3, the real thing.** Verified runs, Linux 7.1, loopback, 2026-09-13:
- listen(1), no accept, four clients: two connect at once, two stay in `SYN-SENT`. `ss -ltn` shows `Recv-Q 2` and `Send-Q 1` on the listener. With listen(3), four clients connect.
- A queued client sends 3 bytes. The server side shows `Recv-Q 3`. The client read waits.
- No bind(): listen() still returns 0, and the kernel picks `0.0.0.0:54601`. A connect to the intended port fails with "refused".
- The restart trap: TIME_WAIT is a waiting state. The side that closes a connection first keeps it for 60 s on Linux, so late packets from the old connection die out. The one-read echo server closes first, so its port sits in TIME_WAIT. A quick restart gets `EADDRINUSE` from bind(). The code does not check (S01-C127), listen() picks port 51821, and every client to the real port gets "refused". SO_REUSEADDR fixes the bind.
- `/proc/sys/net/core/somaxconn` holds 4096 on this machine. `ip_unprivileged_port_start` holds 1024.
- `01_echo_server.c` line 9 binds INADDR_ANY: every interface, including the LAN. Binding 127.0.0.1 keeps the port on this machine.

**Rung 4, exam depth.**
- *Refused versus hung.* A refusal costs one round trip and names the problem. A hang costs the whole client timeout and looks like load (S01-C16, S01-C18).
- *Why the queue exists.* The kernel finishes handshakes while the app works on another client. The queue absorbs a burst. The backlog sets its depth, not the number of clients (S01-C25).
- *Portability.* Linux always drops a SYN that finds the accept queue full. `tcp_abort_on_overflow=1` only makes Linux reset a handshake whose final ACK arrives when the queue is full. macOS also drops silently. Some other stacks refuse. Do not build logic on the behavior you saw locally (S01-C22).
- *Root and port 80.* The rule is a privilege: root, the CAP_NET_BIND_SERVICE capability, or a lower `ip_unprivileged_port_start`. The safe design keeps the parser unprivileged behind a proxy (S01-C13, S01-C14).
- *SO_REUSEADDR is not SO_REUSEPORT.* REUSEADDR lets bind() succeed next to TIME_WAIT sockets. It does not let two servers listen on one port. That job belongs to SO_REUSEPORT.

**Misconceptions.**
- S01-M05: "No process can use a port below 1024 without root, ever." Wrong: a capability or a sysctl grants it. Distractor in check 5.
- S01-M06: "The backlog caps the number of clients." Wrong: it caps the queue of connections that wait for accept(). Distractor in check 6.
- S01-M07: "A server that skips bind() listens on nothing." Wrong: Linux picks an ephemeral port for it. Distractor in check 1.
- S01-M08: "A client in the queue soon gets a TCP timeout." Wrong: its handshake and data got ACKs, so TCP waits forever. Distractor in check 2.
- S01-M09: "SO_REUSEADDR lets two servers listen on one port." Wrong: it lets bind() succeed while old connections sit in TIME_WAIT. Distractor in check 4.
- S01-M48: "The port in the code is the port in effect, even when bind() did not run or failed." Wrong: listen() then picks a random ephemeral port. Distractor in check 1.
- S01-M49: "The kernel resets a queued connection that the app does not accept soon." Wrong: Linux keeps it in the queue with no deadline. Distractor in check 2.
- S01-M50: "On Linux, listen(fd, N) holds exactly N finished handshakes." Wrong: Linux calls the queue full only above N, so it holds N + 1 (beyond the slides). Distractor in check 3.
- S01-M51: "SO_REUSEADDR removes TIME_WAIT." Wrong: the old sockets stay in TIME_WAIT. Only the bind() failure goes away. Distractor in check 4.
- S01-M52: "A port for a web service needs root, whatever its number." Wrong: only the number matters, so any user can bind 8080. Distractor in check 5.

**Diagrams.**
- Step-by-step: the SYN decision tree. No listener, queue with room, queue full. Actors: client, kernel, server.
- Static: a port ruler with the privileged range and the slide ports 21, 25, 80, 110, 443, 2026, 3000, 6379, 8080.

**Interactives.**
- *Break-it toggles* (P1). Inputs: skip bind, skip accept, restart without SO_REUSEADDR, backlog 1 to 8, client count. The learner sees each client state (refused, in the queue, SYN-SENT) and the matching `ss` line. The learner discovers that a missing call rarely crashes. It changes what the client sees.

**Predict, observe, explain.** Run `python3 -c 'import socket,time; s=socket.socket(); s.bind(("127.0.0.1",2038)); s.listen(1); time.sleep(60)'`. In a second terminal, run `(sleep 30 | nc 127.0.0.1 2038 &)` three times, then `ss -tn state all '( sport = :2038 or dport = :2038 )'`. Predict: how many clients reach ESTAB? Observe: two, and one `SYN-SENT`. The listener shows `Recv-Q 2` and `Send-Q 1`. The captured output is the verification run above.

**Worked example, faded example, your turn.**
- *Worked:* Backlog 1, the server never accepts, four clients. The Linux queue holds backlog + 1 = 2. Clients 1 and 2: ESTAB. Clients 3 and 4: SYN-SENT, then failure after about 127 s.
- *Faded:* Backlog 3, six clients. In the queue: ____. In SYN-SENT: ____. *(4, 2.)*
- *Your turn:* listen(fd, 10000) on a machine with somaxconn 4096. How many connections can wait? *(The backlog becomes 4096, so 4097 fit.)*

**Checks.**
1. `mcq`: the code sets port 2026 but never calls bind(). listen() returns 0. What does `ss -ltn` show for the process? Answer: a listener on a random high port, such as `0.0.0.0:54601`. Distractor: no listener at all (S01-M07). Distractor: a listener on 2026 (S01-M48). Feedback: Linux binds an unbound socket to an ephemeral port at listen().
2. `mcq`: bind and listen, no accept. The client connected and sent data. What does it see? Answer: it waits with no reply. Distractor: a TCP timeout after a few seconds (S01-M08). Distractor: a reset when the kernel gives up on the app (S01-M49). Feedback: the kernel sent an ACK for its bytes, so TCP sees nothing wrong. Slide 9 says the client "waits until TCP times out". A queued connection has no such timeout. On the quiz, expect the slide wording.
3. `numeric`: Linux, listen(fd, 1), no accept. How many handshakes complete? Answer: 2. Distractor value: 1 (S01-M50). Feedback: beyond the slides, Linux calls the queue full only above the backlog. Slide 11 only says the backlog sizes a queue.
4. `mcq`: what does SO_REUSEADDR fix? Answer: a bind() failure while old sockets sit in TIME_WAIT. Distractor: two servers on one port (S01-M09). Distractor: it removes TIME_WAIT (S01-M51). Feedback: two listeners need SO_REUSEPORT, and TIME_WAIT stays.
5. `multi`: which statements hold on Linux by default? Answer: port 80 needs privilege. Any user can bind 8080. A process with CAP_NET_BIND_SERVICE can bind 80 without root. Wrong picks: only root can ever bind 80 (S01-M05). Port 8080 needs root, because web servers use it (S01-M52). Feedback: the line is 1024, and a capability or a sysctl can lift it. Slide 8 says "root only". On the quiz, expect the slide wording.
6. `mcq`: listen(fd, 1). The server accepts each client at once and keeps it open. A third client connects. Result? Answer: it connects, because accept() emptied the queue. Distractor: refused, because the backlog allows one client in total (S01-M06). Distractor: it waits, because each open client still fills the queue (S01-M06). Feedback: the backlog counts only connections that wait for accept().

**Review cards.**
- Q: What does a client see when no process listens on the port? A: connection refused (RST).
- Q: What does the listen() backlog size? A: the accept queue.
- Q: Which sysctl caps the backlog on Linux? A: net.core.somaxconn.
- Q: Default net.core.somaxconn since Linux 5.4? A: 4096.
- Q: Per slide 9, how long does the client of a server with no accept() wait? A: "until TCP times out", in the slide's words.
- Q: What does Linux do with a SYN when the accept queue is full? A: it drops it.
- Q: Why bind 8080 behind a proxy instead of 80? A: so the parser does not run as root.
- Q: Why does a quick restart fail with "address already in use"? A: TIME_WAIT sockets hold the port.

**Lab.** The restart trap.
```sh
cd sources/cn-at-scaler/lesson1 && gcc -o 01_echo_server 01_echo_server.c
./01_echo_server & pid=$!; sleep 0.3
python3 -c 'import socket; s=socket.create_connection(("127.0.0.1",2026)); s.sendall(b"x\n"); s.recv(9); s.recv(9)'
kill $pid; ./01_echo_server & pid=$!; sleep 0.3
ss -ltnp | grep 01_echo_server
nc -z 127.0.0.1 2026; echo $?
kill $pid
```
Expected: `ss` shows the new server on a random high port, not 2026, and `nc -z` prints 1. The server closed first, so its old connection holds 2026 in TIME_WAIT for 60 s. A copy on a spare port gave `0.0.0.0:60777` and `1` (verified).

### s01-m03-signals-sigpipe

- **Title:** SIGPIPE: the write that kills your server.
- **Minutes:** 18.
- **Big idea:** A write to a connection that the peer already killed raises SIGPIPE, and its default action ends your process with no error message.
- **Covers:** S01-C26, S01-C27, S01-C28, S01-C29, S01-C30, S01-C31, S01-C32, S01-C33, S01-C34.
- **Prereqs:** s01-m01-seven-syscalls.
- **Threads:** T-network-not-function.

**Pretest.**
1. Your server writes to a client that reset the connection. What is the default result? *Answer: on Linux the first write fails with ECONNRESET, and the next write raises SIGPIPE, which ends the process.*
2. Which signal can no program catch: SIGTERM or SIGKILL? *Answer: SIGKILL.*
3. A shell prints exit status 141. Which signal ended the process? *Answer: 141 - 128 = 13, SIGPIPE.*

**Rung 1, the picture.**

| The picture | The real thing |
|---|---|
| You talk into a phone after the other side hung up. | write() on a socket that the peer reset. |
| By default, the phone company cuts the power to your whole house. | The kernel sends SIGPIPE, and the process ends. |
| You can ask the phone company for a busy tone instead. | Ignore SIGPIPE or pass MSG_NOSIGNAL. write() returns ECONNRESET or EPIPE. |

Where this breaks: on Linux the power cut does not come on the first try. The first write reports "connection reset", and the second write brings the signal.

**Rung 2, how it works.**
1. The client writes `hello`.
2. The client sets SO_LINGER {1, 0} and calls close(). The kernel sends RST, not FIN.
3. The server reads `hello` and sleeps 1 s. The RST arrives and marks the socket as reset.
4. First write: Linux returns ECONNRESET. No signal yet.
5. Second write: Linux returns EPIPE and sends SIGPIPE.
6. The default action ends the server. The shell reports 128 + 13 = 141.

**Rung 3, the real thing.** Verified strace of `04_sigpipe_server.c` with `05_sigpipe_client.c`, Linux 7.1, loopback:

```
read(4, "hello", 4096)  = 5
write(4, "hello", 5)    = -1 ECONNRESET (Connection reset by peer)
write(4, "hello", 5)    = -1 EPIPE (Broken pipe)
--- SIGPIPE {si_signo=SIGPIPE, si_code=SI_USER, ...} ---
+++ killed by SIGPIPE +++
```

- The code comments on slide 13 put SIGPIPE on the first write. On Linux, the kernel turns the first error into ECONNRESET, so the second write gets the signal (`net/core/stream.c`, `sk_stream_error`). See Open questions 5.
- The README runs `wait` and then `echo $?`. A plain `wait` returns 0 in bash and in zsh (verified). `wait $pid` shows 141.
- A client with no server also exits with 141. connect() fails, the unchecked write() gets EPIPE, and SIGPIPE ends the client (verified).
- Signal numbers on Linux x86 and ARM: 1 SIGHUP, 2 SIGINT, 9 SIGKILL, 13 SIGPIPE, 15 SIGTERM, 19 SIGSTOP, 20 SIGTSTP. Control-Z sends SIGTSTP. No handler can catch SIGKILL or SIGSTOP.
- Session 2 slide 5, verified: after a normal close, the port sits in TIME_WAIT. After a linger-0 close, it does not, and the peer read fails with "Connection reset by peer".

**Rung 4, exam depth.**
- *Why a signal and not an error?* Pipes came first. Many programs in a pipeline do not check write errors. SIGPIPE stops them when the reader exits. It also stops a program such as cat in `cat big.log | head` at once, with no error message (`man 7 pipe`). Sockets share the rule, so a server must opt out.
- *How a server opts out.* `signal(SIGPIPE, SIG_IGN)` covers the whole process. `send()` with `MSG_NOSIGNAL` covers one call. Then a failed write returns ECONNRESET or EPIPE, so the server handles both and closes that one client.
- *FIN or RST.* FIN says "no more data from me" and leaves TIME_WAIT on the side that closes first. RST aborts, drops unsent data, and leaves no TIME_WAIT. Linger 0 is for demos (S01-C33).
- *Polite kill.* SIGTERM lets a process finish its work and close files. SIGKILL gives it no chance. So a careful stop sends SIGTERM first.
- *Exit status arithmetic.* A shell reports 128 + N for a death by signal N: 130 for SIGINT, 137 for SIGKILL, 141 for SIGPIPE, 143 for SIGTERM.

**Misconceptions.**
- S01-M10: "Every write to a dead connection only returns an error." Wrong by default: on Linux the first write after RST returns ECONNRESET, and the next one raises SIGPIPE, which ends the process. Distractor in check 2.
- S01-M11: "The first write after an RST always raises SIGPIPE." Wrong on Linux: it returns ECONNRESET, and the second write raises SIGPIPE. Distractor in check 3.
- S01-M12: "A handler can catch SIGKILL to clean up." Wrong: no handler can catch SIGKILL or SIGSTOP. Distractor in check 4.
- S01-M13: "Exit status 141 proves that the server demo worked." Wrong: a client with no server also exits with 141. Distractor in check 6.
- S01-M53: "A write only fills the send buffer, so it always succeeds." Wrong: after an RST the kernel knows the connection is dead and fails the write. Distractor in check 2.
- S01-M54: "A read from a reset socket raises SIGPIPE." Wrong: a read gets ECONNRESET or 0. Only a write raises SIGPIPE. Distractor in check 3.
- S01-M55: "Any signal can be caught if you install a handler." Wrong: SIGKILL and SIGSTOP cannot be caught. Distractor in check 4.
- S01-M56: "A plain `wait` returns the exit status of the background job." Wrong: a plain `wait` returns 0 in bash and zsh. `wait $pid` returns the job status. Distractor in check 5.
- S01-M57: "A failed connect() raises SIGPIPE." Wrong: connect() returns -1. The unchecked write() on the unconnected socket raises SIGPIPE. Distractor in check 6.

**Diagrams.**
- Step-by-step: client, kernel and server lanes. hello, RST, sleep, write 1 (ECONNRESET), write 2 (EPIPE and SIGPIPE), exit 141.
- Static: a FIN close and an RST close side by side, with TIME_WAIT on one side only.

**Interactives.**
- *SIGPIPE timeline* (P2). Inputs: close with FIN or RST, SIGPIPE default or ignored, MSG_NOSIGNAL on or off. The learner sees each write result and the exit status. The learner discovers which setting keeps the server alive.

**Predict, observe, explain.** Run `./04_sigpipe_server & pid=$!; sleep 0.3; ./05_sigpipe_client; wait $pid; echo $?`. Predict the number. Observe: 141. Then run the server under `strace -e trace=read,write` and predict which write returns EPIPE. Observe: the second one. The captured output is the verification run in rung 3.

**Worked example, faded example, your turn.**
- *Worked:* SIGTERM ends a process. Exit status = 128 + 15 = 143.
- *Faded:* Control-C sends SIGINT. Exit status = 128 + ____ = ____. *(2, 130.)*
- *Your turn:* A process exits with status 137. Which signal? *(137 - 128 = 9, SIGKILL.)*

**Checks.**
1. `numeric`: exit status 141. Which signal number? Answer: 13. Feedback: subtract 128.
2. `mcq`: the server keeps writing after the peer reset, SIGPIPE left at its default. Result on Linux? Answer: a later write raises SIGPIPE, and the process ends. Distractor: every write only returns an error, and the program goes on (S01-M10). Distractor: every write succeeds, because it only fills a buffer (S01-M53). Feedback: the first write reports ECONNRESET, and the next one brings the signal.
3. `mcq`: in the demo on Linux, which call raises SIGPIPE? Answer: the second write. Distractor: the first write (S01-M11). Distractor: the read before the writes (S01-M54). Feedback: the first write returns ECONNRESET. The slide 13 comment puts SIGPIPE on the first write. On the quiz, expect the slide wording.
4. `mcq`: which signal can a handler catch? Answer: SIGTERM. Distractor: SIGKILL (S01-M12). Distractor: SIGSTOP (S01-M55). Feedback: SIGKILL and SIGSTOP cannot be caught.
5. `spot-bug`: "I ran the demo with a plain `wait`, got 0, so SIGPIPE never fired." Answer: a plain `wait` returns 0. Use `wait $pid` (S01-M56). Feedback: also run the server first, or the client dies with 141 on its own.
6. `mcq`: you run only `./05_sigpipe_client`, with no server, and the shell shows 141. What does that prove? Answer: the client died by SIGPIPE on its own. Distractor: the server demo worked (S01-M13). Distractor: the failed connect() raised the signal (S01-M57). Feedback: connect() returned -1, and the unchecked write() raised SIGPIPE.

**Review cards.**
- Q: Signal number of SIGPIPE? A: 13.
- Q: Exit status of a process ended by SIGPIPE? A: 141.
- Q: Which two signals can no handler catch? A: SIGKILL and SIGSTOP.
- Q: What does SO_LINGER {1, 0} make close() send? A: RST instead of FIN.
- Q: Which side keeps TIME_WAIT after a linger-0 close? A: neither side.
- Q: Which send() flag stops SIGPIPE for one call? A: MSG_NOSIGNAL.
- Q: Which write does the slide 13 code comment blame for SIGPIPE? A: the first write.

### s01-m04-clients

- **Title:** Clients: telnet, nc, and the port the kernel lends you.
- **Minutes:** 18.
- **Big idea:** A client mirrors the server with connect() and a port the kernel lends it, and for text protocols your keyboard is already a client.
- **Covers:** S01-C35, S01-C36, S01-C37, S01-C38, S01-C39, S01-C40, S01-C41, S01-C42, S01-C43, S01-C44, S01-C45, S01-C46, S01-C47, S01-C48, S01-C49, S01-C142.
- **Prereqs:** s01-m01-seven-syscalls, s01-m03-signals-sigpipe.
- **Threads:** T-name-in-message (the `Host: google.com` line in the telnet demo).

**Pretest.**
1. Where does the client port number come from? *Answer: the kernel picks it at connect(), from the ephemeral range.*
2. Can telnet fetch a page from port 443? *Answer: no. TLS needs a handshake, so use openssl s_client.*
3. How long does Linux keep a closed connection in TIME_WAIT? *Answer: 60 s.*

**Rung 1, the picture.**

| The picture | The real thing |
|---|---|
| You call a shop from a hotel room. The shop has a famous number. | The server binds a known port. |
| The hotel switchboard gives your call any free outside line. | The kernel picks an ephemeral port at connect(). |
| After you hang up, the line stays reserved for a minute. | TIME_WAIT holds the port about 60 s. |
| A busy hotel runs out of free lines. | A busy client runs out of ephemeral ports. |

Where this breaks: the kernel can lend one client port to two calls at once when they go to different servers. The four-tuples still differ.

**Rung 2, how it works.**
1. socket() makes an fd.
2. connect() to 127.0.0.1:2026. The kernel picks a free port, for example 38428, and sends SYN.
3. The handshake completes, and connect() returns 0.
4. write() sends `hello`.
5. close() sends FIN, or RST with linger 0.
6. The side that closes first keeps the four-tuple in TIME_WAIT for 60 s.

**Rung 3, the real thing.**
- `05_sigpipe_client.c` lines 6 to 17: socket, connect, write, setsockopt, close. It has no bind. `06_sigpipe_client_dns.c` finds the address with gethostbyname, and `07_sigpipe_client_getaddrinfo.c` with getaddrinfo.
- The telnet demo on slide 17, run by the instructor on 2026-08-12: `Trying 142.251.222.142...`, then `GET / HTTP/1.1`, `Host: google.com` and an empty line. The reply: `HTTP/1.1 301 Moved Permanently`, `Location: http://www.google.com/`, `Content-Length: 219`, `Server: gws`. A re-run with curl on 2026-09-13 gave the same status and the same length. Slide 16 aims telnet at google.com 80, localhost 2026 and a mail server on 25, and slide 18 adds that most services do not speak HTTP (S01-C37, S01-C41).
- `nc -l 9000` is a server and `nc localhost 9000` is a client. Two terminals make a chat.
- `openssl s_client -connect www.hotstar.com:443` does the TLS handshake. After it, you type HTTP.
- `/proc/sys/net/ipv4/ip_local_port_range` holds `32768 60999`, which is 28,232 ports. Linux keeps TIME_WAIT for 60 s (`TCP_TIMEWAIT_LEN`).

**Rung 4, exam depth.**
- *Port exhaustion arithmetic.* The client closes each connection first, so TIME_WAIT sits on the client. 28,232 ports, each held 60 s, allow about 470 new connections per second to one server address and port. This is a rough ceiling before kernel reuse options. Pools and keep-alive lower the need (s01-m06).
- *TIME_WAIT sits on the closer.* It stays on whichever side calls close() first, not always the client. A server that closes first collects TIME_WAIT sockets. That is the restart trap of s01-m02.
- *2 MSL or 60 s?* Session 2 slide 5 says a normal close waits in TIME_WAIT "for 2 MSL". Slide 21 says about 60 s. Both hold: RFC 9293 sets 2 MSL, and Linux uses a fixed 60 s (S01-C142, S01-C49).
- *Can a client bind?* Yes (beyond the slides, `man 2 bind`). Slide 21 says "Clients never bind", which is true of most clients (Open questions 9). A client can bind to pick a source address on a machine with two networks. Most clients let the kernel choose.
- *Why well-known ports?* One side must be findable. The server takes the fixed half of the four-tuple, and the client takes a temporary half.

**Misconceptions.**
- S01-M14: "A client must bind a port before connect()." Wrong: the kernel binds it at connect(). Distractor in check 2.
- S01-M15: "telnet can talk to an HTTPS server." Wrong: telnet cannot do the TLS handshake. Distractor in check 3.
- S01-M16: "TIME_WAIT always sits on the client." Wrong: it sits on the side that closes first. Distractor in check 4.
- S01-M58: "The server assigns the client port in its SYN-ACK." Wrong: the client kernel picks the port before it sends the SYN. Distractor in check 2.
- S01-M59: "A plain TCP tool such as nc can type HTTP to port 443." Wrong: it sends raw bytes and cannot do the TLS handshake. Distractor in check 3.
- S01-M60: "TIME_WAIT sits on both ends of every closed connection." Wrong: only the side that closes first keeps it. Distractor in check 4.

**Diagrams.**
- Step-by-step: connect(), the kernel picks a port, SYN, SYN-ACK, ACK, with the four-tuple labeled.
- Static: a ruler from 0 to 65535 with the privileged range, the ephemeral range and the ports 2026, 8080 and 443.

**Interactives.**
- *Ephemeral port meter* (P2). Inputs: new connections per second, TIME_WAIT seconds, range size. The learner sees free ports drain and refill. The learner finds the rate where connect() starts to fail.

**Predict, observe, explain.** Start `nc -l 9000`. In a second terminal, run `nc localhost 9000`. In a third, run `ss -tn 'dport = :9000'`. Predict the client port range. Observe a port between 32768 and 60999. The verification run showed `[::1]:44550`, because `localhost` resolved to IPv6 first.

**Worked example, faded example, your turn.**
- *Worked:* 60999 - 32768 + 1 = 28,232 ports. The +1 counts both ends of the range.
- *Faded:* The range 40000 to 40999 holds ____ ports. *(1,000.)*
- *Your turn:* 28,232 ports and 60 s of TIME_WAIT. The client closes each connection first. How many new connections per second can the client open to one server, without pause? *(28,232 ÷ 60 ≈ 470.)*

**Checks.**
1. `numeric`: a machine sets `ip_local_port_range` to `10000 65000`. How many ports? Answer: 55001. Feedback: count both ends.
2. `mcq`: who picks the client port? Answer: the kernel, at connect(). Distractor: the client calls bind() first (S01-M14). Distractor: the server, in its SYN-ACK (S01-M58). Feedback: client.c has no bind, and the SYN already carries the port.
3. `mcq`: which tool talks to port 443 by hand? Answer: openssl s_client. Distractor: telnet (S01-M15). Distractor: plain `nc` (S01-M59). Feedback: telnet and plain nc cannot do TLS.
4. `mcq`: the server closes first. Where is TIME_WAIT? Answer: on the server. Distractor: on the client (S01-M16). Distractor: on both sides (S01-M60). Feedback: TIME_WAIT follows the side that closes first.

**Review cards.**
- Q: Linux ephemeral port range? A: 32768 to 60999.
- Q: When does the kernel pick the client port? A: at connect().
- Q: How long does Linux hold TIME_WAIT? A: 60 s.
- Q: Which tool reaches a TLS service by hand? A: openssl s_client.
- Q: Which status did Google send to telnet on slide 17? A: 301 Moved Permanently.

### s01-m05-byte-order-dns

- **Title:** Byte order and DNS: two translations inside a 20-line client.
- **Minutes:** 20.
- **Big idea:** Before the first byte leaves, the client turns a port into big-endian bytes and a name into an address, and both steps hide work.
- **Covers:** S01-C50, S01-C51, S01-C52, S01-C53, S01-C54, S01-C55, S01-C56, S01-C57, S01-C58, S01-C59, S01-C135.
- **Prereqs:** s01-m04-clients.
- **Threads:** T-network-not-function (a whole DNS exchange inside one call), T-encapsulation (layers 7, 4 and 3 in twenty lines).
- **Segments:** one page with one unifying idea, the hidden translations before the first byte. Segment 1: byte order (htons, checks 1 to 3). Segment 2: name lookup (checks 4 to 6). Segment 3: the slide 24 layer map. See Open questions 16.

**Pretest.**
1. 2026 is 0x07EA. Which byte goes first on the wire? *Answer: 07.*
2. Which file does the lookup read before any DNS packet? *Answer: /etc/hosts.*
3. Port numbers belong to which OSI layer? *Answer: layer 4.*

**Rung 1, the picture.**

| The picture | The real thing |
|---|---|
| "12/08" is 12 August in India and 8 December in the US. | The bytes EA 07 mean 2026 on x86 but 59911 on the wire. |
| Two countries must agree which part comes first. | The network sends the most significant byte first. |
| Before you phone directory help, you read the note on your fridge. | gethostbyname reads /etc/hosts first. |
| Directory help phones other offices and remembers the answer for a while. | The resolver recurses and caches for the TTL. |

Where this breaks: a date format is a habit. Byte order is a fixed rule in RFC 791. And the note on the fridge can lie. A stale /etc/hosts line or a hijacked resolver sends you to the wrong address.

**Rung 2, how it works.** Byte order:
1. The code holds 2026 = 0x07EA.
2. An x86 or ARM laptop stores the low byte first: EA 07.
3. htons(2026) swaps the bytes, so memory holds 07 EA.
4. The kernel copies those two bytes into the TCP header.
5. The server reads 07 EA, and ntohs() gives back 2026.

Name lookup:
1. The call reads /etc/nsswitch.conf to learn the order of sources.
2. It reads /etc/hosts. The name `localhost` stops here, with no packet.
3. For other names, it sends one UDP query to the resolver in /etc/resolv.conf.
4. The resolver walks the root, TLD and authoritative servers, or answers from its cache.
5. The call returns an address. It blocks the whole time.

**Rung 3, the real thing.**
- 2026 = 7 × 256 + 234 = 0x07EA. On the x86 verification machine, memory holds `EA 07`. As a number on x86, htons(2026) is 0xEA07 = 59911.
- Forget htons: `sin_port = 2026` puts `EA 07` in the port field, and the kernel binds port 59911 (verified with getsockname).
- `htonl(INADDR_LOOPBACK)`: 127.0.0.1 is 0x7F000001, and the wire bytes are `7F 00 00 01`. INADDR_ANY is 0, so its missing swap changes nothing.
- strace of `06_sigpipe_client_dns.c` opens `/etc/host.conf`, `/etc/resolv.conf`, `/etc/nsswitch.conf` and `/etc/hosts`. It sends no DNS packet for `localhost` (verified).
- The hosts line on the Fedora verification machine: `files myhostname mdns4_minimal [NOTFOUND=return] resolve [!UNAVAIL=return] dns`.
- `07_sigpipe_client_getaddrinfo.c` passes the port as the string `"2026"` and gets back a ready address structure, so it needs no htons.
- `man 3 gethostbyname` calls the function obsolete and marks it MT-Unsafe.
- Slide 24: the echo text is layer 7, TCP and `htons(2026)` are layer 4, INADDR_ANY and 127.0.0.1 are layer 3.

**Rung 4, exam depth.**
- *Why one fixed order?* Machines with different CPUs must read one header. Any fixed choice works. The Internet chose the most significant byte first (RFC 791 Appendix B).
- *Two little-endian hosts that both skip htons.* Both sides use port 59911, so they connect, and the bug stays hidden. It shows up when a correct client aims at 2026, or when a big-endian host runs one side. Tests between two x86 machines cannot catch it.
- *htons on a big-endian CPU.* It does nothing, because host order already equals network order.
- *Blocking DNS in a server.* One slow lookup in an event loop stalls every client (s01-m06). So a server resolves names ahead of time or off the main loop.
- *Where the cache lives.* The TTL cache lives in a resolver service, such as systemd-resolved, or in the recursive resolver. A C program on glibc keeps no DNS cache of its own.
- *DNS hijacking* (S01-C135). A hijacked resolver or hosts file returns a wrong address. A TLS certificate check catches the fake server (s01-m07).
- *UDP and size.* An answer too large for UDP comes back with the TC bit on. The client then asks again over TCP (RFC 1035 §4.2.1, RFC 7766).

**Misconceptions.**
- S01-M17: "htons always swaps the bytes." Wrong: it swaps only on a little-endian host. Distractor in check 3.
- S01-M18: "Network byte order is little-endian, like my laptop." Wrong: it is big-endian. Distractor in checks 1 and 3.
- S01-M19: "gethostbyname is a quick local lookup." Wrong: it can send UDP and block for seconds. Distractor in check 5.
- S01-M20: "The DNS cache lives inside my program." Wrong: it lives in a resolver service or the recursive resolver. Distractor in check 6.
- S01-M61: "Byte order reverses the hex digits." Wrong: it reverses whole bytes, so 07 EA becomes EA 07, not AE 70. Distractor in check 1.
- S01-M62: "My program walks the root, TLD and authoritative servers itself." Wrong: it sends one query, and the resolver recurses. Distractor in check 5.
- S01-M63: "/etc/hosts is the DNS cache." Wrong: it is a static file that a person edits. Distractor in check 6.

**Diagrams.**
- Static: 2026 as 16 bits, then as two boxes in memory order and in wire order.
- Step-by-step: one lookup. nsswitch.conf, /etc/hosts, UDP query, root, TLD, authoritative, answer, cache.
- Static: the slide 24 stack, with each line of `01_echo_server.c` pinned to its layer.

**Interactives.**
- *Byte-order flipper* (P1). Inputs: a port or an IPv4 address, a host type (little or big). The learner sees hex, memory bytes, wire bytes, and the port the kernel uses without htons. The learner discovers why a missing htons binds 59911.

**Predict, observe, explain.** Run `python3 -c 'import struct; print(struct.pack("<H",2026).hex(" "), struct.pack("!H",2026).hex(" "))'`. Predict both byte pairs. Observe `ea 07 07 ea`. Then run `strace -e trace=openat,sendto ./06_sigpipe_client_dns` and predict whether a DNS packet leaves for `localhost`. Observe: file opens only, no sendto. The captured output is the verification run. Note for a real-name contrast: on a systemd-resolved system such as Fedora, the program sends no UDP packet for a real name either. It connects to a Unix socket, `/run/systemd/resolve/io.systemd.Resolve`, and the resolver service sends the query. Trace with `-e trace=connect,sendto,sendmmsg` and expect that Unix socket (verified for example.com).

**Worked example, faded example, your turn.**
- *Worked:* 8080 = 31 × 256 + 144 = 0x1F90. Wire bytes: `1F 90`. Without htons, x86 memory holds `90 1F`, and the kernel binds 0x901F = 36895.
- *Faded:* 443 = 0x01BB. Wire bytes: ____. Port without htons: 0x____ = ____. *(01 BB, 0xBB01, 47873.)*
- *Your turn:* Port 80 without htons on x86? *(0x0050 becomes 0x5000 = 20480.)*

**Checks.**
1. `bytes`: 2026 in network byte order. Answer: `07 EA`. Distractor: `EA 07` (S01-M18). Distractor: `AE 70` (S01-M61). Feedback: the wire sends the high byte first, and a swap moves whole bytes.
2. `numeric`: x86 code sets `sin_port = 2026` with no htons. Which port does the kernel bind? Answer: 59911. Feedback: 0xEA07.
3. `mcq`: what does htons do on a big-endian CPU? Answer: nothing. Distractor: it swaps the bytes (S01-M17). Distractor: it converts the port to little-endian (S01-M18). Feedback: host order already matches the wire.
4. `order`: put the lookup steps in order. Answer: nsswitch.conf, /etc/hosts, UDP query to the resolver, recursion, the answer is stored for the TTL.
5. `mcq`: why can gethostbyname freeze a one-thread server? Answer: it waits on the network with no timeout you control. Distractor: it only reads a local file (S01-M19). Distractor: the program itself walks the root, TLD and authoritative servers (S01-M62). Feedback: /etc/hosts is only the first step, and the resolver does the recursion.
6. `mcq`: where does the TTL cache live? Answer: in a resolver service or the recursive resolver. Distractor: in the memory of your program (S01-M20). Distractor: in /etc/hosts (S01-M63).

**Review cards.**
- Q: 2026 in hex? A: 0x07EA.
- Q: Network byte order? A: big-endian, most significant byte first.
- Q: First place gethostbyname looks? A: /etc/hosts.
- Q: Which IP version does gethostbyname handle? A: IPv4 only.
- Q: Which call does slide 23 say to use in real code instead of gethostbyname? A: getaddrinfo().
- Q: OSI layer of a port number? A: layer 4.

### s01-m06-many-clients

- **Title:** Many clients at once: fork, or ask the kernel who is ready.
- **Minutes:** 22.
- **Big idea:** The two ways past a one-client server: a process per client (fork), or one process that asks the kernel which sockets are ready (select, epoll).
- **Covers:** S01-C63, S01-C64, S01-C65, S01-C66, S01-C67, S01-C68, S01-C69, S01-C70, S01-C71, S01-C72, S01-C73, S01-C74, S01-C75, S01-C76, S01-C77, S01-C78, S01-C79, S01-C128, S01-C131, S01-C132, S01-C133, S01-C134, S01-C136, S01-C137, S01-C143, S01-C144.
- **Prereqs:** s01-m01-seven-syscalls, s01-m02-ports-and-queue.
- **Threads:** T-setup-off-path, T-watch-list, T-deployed-reality.
- **Note:** Session 3 owns the cost of fork, threads and select. This module is first contact only. Slide 34 moved to s01-m02 and s01-m07.

**Pretest.**
1. What does fork() return in the child? *Answer: 0.*
2. Which costs less at ten thousand clients: a process per client, or epoll? *Answer: epoll.*
3. On the slide, how many connections per host did Chrome open? *Answer: 6.*

**Rung 1, the picture.**

| The picture | The real thing |
|---|---|
| One tutor helps one student. The rest wait at the door. | The persistent server blocks in read() for one client. |
| You clone the tutor for each student. Clones need food and desks. | fork() gives each client a process with its own memory. |
| One tutor, and a bell on every desk. The tutor walks only to desks that ring. | epoll returns only the sockets with data. |
| One tutor who checks every desk on each round. | select scans every descriptor on each call. |

Where this breaks: a real clone costs less than a new tutor. A fork child shares the memory pages of the parent until one side writes (copy-on-write, beyond the slides, `man 2 fork`). It also keeps a copy of every open descriptor, so a clone is cheaper and more tangled than a new tutor.

**Rung 2, how it works.** The fork server:
1. accept() returns fd 4.
2. fork() makes a copy. Both processes hold fd 3 and fd 4.
3. The child sees 0. It echoes on fd 4 until read() returns 0, closes fd 4, and exits.
4. The parent sees the child PID. It closes its copy of fd 4 and calls accept() again.
5. The connection ends only when both copies of fd 4 are closed.

**Rung 3, the real thing.**
- `03_echo_server_fork.c` lines 15 to 27. Line 17 tests `fork() == 0`. Line 27 is the parent close.
- Verified: three clients connect and leave. `ps -o pid,ppid,stat,comm --ppid $pid` lists three rows in state `Z`, `<defunct>`. The code never calls wait(), so each finished child stays a zombie until the parent exits.
- Slide 29: select and epoll need "no context switching, no per-client memory". The slide means no process and no stack for each client. Each connection still holds a buffer and some state (Open questions 9).
- Slide 32: select rebuilds its set on each call, and the kernel walks all of it, O(n). FD_SETSIZE is 1024. epoll registers interest once and returns only ready descriptors, O(ready). kqueue does this on BSD and macOS, IOCP on Windows.
- The repo README asks you to watch `ps`: the fork server grows one process per client, and the select server in lesson3 stays at one.
- Slide 33: Chrome opened 6 connections per host, and requests 7 to 10 waited. Chromium source still sets 6 for its normal socket pool. Slide 33 calls `ulimit -n` "your hard ceiling". In fact `ulimit -n` shows the soft limit on open descriptors (Open questions 9), and each socket uses one.
- `notes.md` adds: fork copies memory and descriptors. exec replaces the program. Threads share one process and suit work with heavy input and output. Processes talk over pipes, message queues or sockets. A pool keeps connections open for reuse.

**Rung 4, exam depth.**
- *Why the parent must close fd 4.* The kernel ends a connection when the last descriptor for it closes. If the parent keeps its copy, the client never sees end of file. The parent also leaks one descriptor per client until `ulimit -n` stops accept().
- *fork versus an event loop.* fork gives isolation and simple code, and a crash kills one client. The cost is a process per client. An event loop has no process per client, but one slow handler blocks everyone (slide 29). One crash also kills everyone, because one process holds every client (reasoning, not on the slide).
- *Why both still ship.* The choice follows the load: hundreds of clients or ten thousand. Session 3 shows servers that stack both designs.
- *The client-side limit.* Six connections per host is the same resource problem seen from the client: descriptors, memory and handshakes (S01-C77).
- *Pools.* A pool pays the TCP and TLS handshakes one time, then reuses the connection (T-setup-off-path).
- *fork failure.* fork() returns -1 in the parent and makes no child. Slide 30 names the cause: the system is out of processes or memory (S01-C137). In the demo, the parent path closes the client, so that client sees a close with no echo (S01-Q06).

**Misconceptions.**
- S01-M21: "fork() returns the child PID in the child." Wrong: the child gets 0. Distractor in check 1.
- S01-M22: "The parent can keep its copy of the client fd." Wrong: the connection stays open and descriptors leak. Distractor in check 2.
- S01-M23: "An event loop keeps no memory at all for a client." Slide 29 says "no per-client memory", and it means no process and no stack per client. Wrong as a literal claim: each client still needs a buffer and some state. A slow handler also blocks the loop. Distractor in check 4.
- S01-M24: "The six-connection cap is a browser quirk." Wrong: it rations descriptors and handshakes. Distractor in check 5.
- S01-M25: "ulimit -n counts files, not sockets." Wrong: a socket is a descriptor. Distractor in check 6.
- S01-M64: "The child gets the parent PID from fork()." Wrong: the child gets 0, and it calls getppid() for the parent PID. Distractor in check 1.
- S01-M65: "An event loop still makes a process per client." Wrong: one process watches every socket. Distractor in check 4.
- S01-M66: "The HTTP standard sets the six-connection cap." Wrong: six is a browser choice. RFC 9112 §9.4 sets no fixed number. Distractor in check 5.
- S01-M67: "A socket uses a descriptor only while data moves." Wrong: it holds one from socket() or accept() until close(). Distractor in check 6.

**Diagrams.**
- Step-by-step: accept, fork, two processes with their fd tables, the child echo, the parent close.
- Static: fork, select and epoll in three columns: cost per client, code difficulty, what one crash takes down.

**Interactives.**
- *Process counter* (P2). Inputs: number of clients, model (fork or event loop), wait() on or off. The learner sees the process list grow, zombies pile up, or one process stay. The learner discovers the zombie leak in the demo code.

**Predict, observe, explain.** Build and start `03_echo_server_fork.c` with `./03_echo_server_fork & pid=$!`. Run `for i in 1 2 3; do python3 -c 'import socket; s=socket.create_connection(("127.0.0.1",2026)); s.sendall(b"x"); s.recv(1)'; done`. Predict how many child rows `ps -o pid,ppid,stat,comm --ppid $pid` lists. Observe three rows in state `Z` with `<defunct>`. The captured output is the verification run, Linux 7.1, 2026-09-13.

**Worked example, faded example, your turn.**
- *Worked:* The parent, PID 5000, forks child 5001. The parent sees 5001. The child sees 0. Both hold fd 3 and fd 4. The parent closes fd 4. The child never closes fd 3, and it closes fd 4 at the end.
- *Faded:* fork() fails. Return value: ____. Which processes see it: ____. *(-1. Only the parent, because no child exists.)*
- *Your turn:* Ten clients came and left, and nobody called wait(). How many zombie rows? *(10.)*

**Checks.**
1. `mcq`: what does fork() return in the child? Answer: 0. Distractor: the child PID (S01-M21). Distractor: the parent PID (S01-M64). Feedback: the parent gets the child PID, and the child calls getppid().
2. `spot-bug`: a fork server with no `close(client_fd)` in the parent. What breaks? Answer: the client never sees end of file, and descriptors leak (S01-M22).
3. `numeric`: three clients served, no wait(). How many zombies? Answer: 3.
4. `mcq`: the main risk of one event loop? Answer: one slow handler blocks all clients. Distractor: none, because it keeps no memory at all for a client (S01-M23). Distractor: a process per client fills the process table (S01-M65). Feedback: slide 29 means no process or stack per client. Buffers and state per client remain.
5. `mcq`: why do browsers cap connections per host? Answer: to ration descriptors, memory and handshakes on both ends. Distractor: an old browser bug (S01-M24). Distractor: the HTTP standard demands six (S01-M66).
6. `mcq`: does an open socket count against `ulimit -n`? Answer: yes, from socket() or accept() until close(). Distractor: no, only files count (S01-M25). Distractor: only while data moves (S01-M67). Feedback: a socket is a file descriptor.

**Review cards.**
- Q: The three return values of fork()? A: 0 in the child, the child PID in the parent, -1 on failure.
- Q: Cost of one select call? A: O(watched descriptors).
- Q: Cost of one epoll_wait call? A: O(ready descriptors).
- Q: Chrome per-host connection cap on the slide? A: 6.
- Q: What does a pool skip after the first request? A: the TCP and TLS handshakes.
- Q: Why do zombies pile up under the fork demo? A: the parent never calls wait().

### s01-m07-see-the-bytes-tls

- **Title:** See the bytes: curl, tcpdump, and the TLS wrapper.
- **Minutes:** 20.
- **Big idea:** A text protocol is bytes you can read with curl and tcpdump, until TLS wraps them, and TLS wraps TCP, not HTTP.
- **Covers:** S01-C60, S01-C61, S01-C62, S01-C81, S01-C82, S01-C84, S01-C85, S01-C86, S01-C87, S01-C88, S01-C146.
- **Prereqs:** s01-m04-clients, s01-m05-byte-order-dns.
- **Threads:** T-encapsulation, T-name-in-message.
- **Note:** promiscuous mode from slide 34 moved here. The telnet demo (slide 17) stays in s01-m04.
- **Segments:** one page with one unifying idea, bytes you can read until a wrapper hides them. Segment 1: HTTP bytes by hand and with curl (checks 1, 2, 4). Segment 2: tcpdump and promiscuous mode (check 5). Segment 3: TLS under the application (checks 3, 6). See Open questions 16.

**Pretest.**
1. Which bytes end an HTTP header block? *Answer: CR LF CR LF, `0D 0A 0D 0A`.*
2. Which tcpdump flag prints hex next to ASCII? *Answer: `-X`.*
3. Does TLS protect only HTTP? *Answer: no. It protects any protocol on TCP.*

**Rung 1, the picture.**

| The picture | The real thing |
|---|---|
| HTTP is a postcard. Every post office can read it. | Plain HTTP bytes cross every hop in the clear. |
| A worker at an old sorting table sees every card, not only his own. | Promiscuous mode on a hub shows every frame. |
| TLS is an envelope around the card. Any card fits. | TLS sits under HTTP, SMTP and database protocols. |
| An ID card, checked against a list of trusted issuers. | A certificate, checked against a CA chain. |

Where this breaks: the envelope still shows the address, the size and the time. TLS hides the content, not the IP addresses, the ports, or the site name that the client sends at the start.

**Rung 2, how it works.** An HTTP request by hand:
1. connect() to port 80.
2. Write `GET / HTTP/1.1`, then CR LF.
3. Write `Host: google.com`, then CR LF.
4. Write one more CR LF. The empty line ends the headers.
5. Read the status line, the headers, the empty line, then the body.

TLS under it:
1. The TCP handshake completes.
2. Client and server use asymmetric crypto to agree on a shared secret.
3. The client checks the certificate against the CA chain.
4. Both sides switch to symmetric crypto for the data, because it is much faster.

**Rung 3, the real thing.**
- The request on slide 26 is 36 bytes: 16 for the request line with CR LF, 18 for the Host line with CR LF, and 2 for the empty line.
- `curl -i google.com` on 2026-09-13 returned `301 Moved Permanently` with `Content-Length: 219`, the same as slide 17. The 219-byte body has six lines: four LF line ends, then two CR LF (verified with xxd).
- `curl -vv https://google.com 2>&1 | less`: curl writes its trace to stderr, so `2>&1` sends it to less. Lines with `>` show the headers curl sends, `<` the headers it gets, and `*` connection and TLS notes. Since curl 8.10, each extra v raises the trace level.
- `sudo tcpdump -ni any port 2026 -w 1.pcap`: `-n` skips name lookups, `-i any` includes loopback, `-w` writes the file. `tcpdump -r FILE -A` prints ASCII, and `-X` prints hex beside ASCII. The slide reads `local_capture.pcap`, a different name from the file it writes.
- Session 5 owns the details of HTTP. Here the point is that the bytes are readable.

**Rung 4, exam depth.**
- *Read until close.* Slide 26 says to read until close. HTTP/1.1 keeps the connection open by default, so the server does not close after the 301. A read-until-close client waits for the server idle timeout. The Content-Length header tells a client where the body ends. The Session 5 assignment tests this idea (s05-m12-assignment-prep).
- *SSL secures TCP.* TLS runs on any reliable byte stream, so one library protects HTTPS, SMTP with STARTTLS, and database links. SSH is a separate protocol with its own transport layer (RFC 4253), built on the same ideas.
- *Why symmetric crypto for data?* Asymmetric crypto only sets up the key. Symmetric ciphers move bulk data much faster.
- *Pinning trade-off.* A pinned app ignores a rogue CA. But a certificate change breaks every old app build that pins the old certificate (beyond the slides, OWASP Pinning Cheat Sheet).
- *What a sniffer still sees under TLS.* IP addresses, ports, sizes, timing, and the server name in the first TLS message (SNI, beyond the slides, RFC 6066 §3, Session 5).
- *Why plaintext died.* On a hub, one sniffer could read every password in a plain protocol (S01-C82). A switch learns which port holds each MAC address and sends a frame for a known address only to that port, so it limits what one port sees (beyond the slides, IEEE 802.1Q). The fix that lasted is encryption.

**Misconceptions.**
- S01-M26: "TLS is part of HTTP." Wrong: it sits under the application protocol. Distractor in check 3.
- S01-M27: "SSH runs on TLS." Wrong: SSH has its own transport protocol. Distractor in check 6.
- S01-M28: "An HTTP/1.1 client can always read until close." Wrong: the connection stays open by default. Distractor in check 4.
- S01-M29: "tcpdump sees loopback traffic on its default interface." Wrong: capture on `lo` or `any`. Distractor in check 5.
- S01-M68: "HTTP lines end in a bare LF." Wrong: slide 26 and RFC 9112 §2.2 say CR LF. Distractor in check 1.
- S01-M69: "One CR LF ends the header block." Wrong: CR LF ends each line, and the empty line adds a second CR LF. Distractor in check 1.
- S01-M70: "TLS runs below TCP and hides the TCP header." Wrong: TLS rides on TCP, so ports and TCP headers stay in the clear. Distractor in check 3.
- S01-M71: "The empty line after the headers ends the whole response." Wrong: the body follows it, and Content-Length gives its size. Distractor in check 4.
- S01-M72: "Loopback traffic crosses the network card." Wrong: it never leaves the kernel, so only `lo` or `any` shows it. Distractor in check 5.
- S01-M73: "SSH sends its data in the clear, like telnet." Wrong: SSH encrypts with its own transport protocol. Distractor in check 6.

**Diagrams.**
- Static: the 36 request bytes in hex, with each CR LF pair labeled.
- Static: a layer stack. HTTP, SMTP and a database protocol sit on TLS, and TLS sits on TCP.
- Step-by-step: TLS setup. TCP handshake, key agreement, certificate check, symmetric data.

**Interactives.**
- *Capture reader* (P2). Inputs: a short capture of the telnet request and the 301. The learner switches between the `-A` and `-X` views and clicks a byte to see its field. The learner finds `0d 0a 0d 0a` and the Content-Length value.

**Predict, observe, explain.** Run `curl -si http://google.com | head -12`. Predict the status code and the Content-Length. Observe `301` and `219`. The sources are slide 17 and the re-run on 2026-09-13. Google can change this reply at any time.

**Worked example, faded example, your turn.**
- *Worked:* Count `GET / HTTP/1.1\r\nHost: google.com\r\n\r\n`. Request line: 14 + 2 = 16. Host line: 16 + 2 = 18. Empty line: 2. Total: 36 bytes.
- *Faded:* Add `User-Agent: nc\r\n`. That line is ____ bytes. The new total is ____. *(16, 52.)*
- *Your turn:* A `tcpdump -X` line ends in `0d0a 0d0a`. What does it mark? *(The end of the header block.)*

**Checks.**
1. `bytes`: which bytes end an HTTP header block? Answer: `0D 0A 0D 0A`. Distractor: `0A 0A` (S01-M68). Distractor: `0D 0A` (S01-M69). Feedback: CR LF ends the last header line, then the empty line adds one more.
2. `numeric`: how many bytes in `GET /a HTTP/1.1\r\nHost: x.io\r\n\r\n`? Answer: 31. Feedback: 15 + 2, 10 + 2, and 2.
3. `mcq`: where does TLS sit? Answer: under the application protocol, on TCP. Distractor: inside HTTP (S01-M26). Distractor: below TCP, where it hides the TCP header (S01-M70). Feedback: SMTP and databases use the same TLS, and a sniffer still sees the ports.
4. `mcq`: an HTTP/1.1 client reads until close after the 301. What happens? Answer: it waits until the server times out the connection. Distractor: it finishes at once (S01-M28). Distractor: it stops at the empty line after the headers (S01-M71). Feedback: use the Content-Length. Slide 26 says to "read until close". HTTP/1.1 keeps the connection open by default. On the quiz, expect the slide wording.
5. `mcq`: capture loopback traffic to port 2026. Answer: `tcpdump -i any port 2026`. Distractor: `tcpdump port 2026` on the default interface (S01-M29). Distractor: `tcpdump -i eth0 port 2026` (S01-M72).
6. `mcq`: which statement about SSH is true? Answer: it has its own transport protocol. Distractor: it runs on TLS (S01-M27). Distractor: it sends data in the clear, like telnet (S01-M73). Feedback: slide 36 lists SSH with the users of TLS. RFC 4253 gives SSH its own transport. On the quiz, expect the slide wording.

**Review cards.**
- Q: tcpdump flag for hex plus ASCII? A: `-X`.
- Q: What does TLS secure, per slide 36? A: TCP, under the application protocol.
- Q: Why does TLS switch to symmetric crypto? A: it is much faster for bulk data.
- Q: What does certificate pinning take out of the trust decision? A: the CA chain.
- Q: Where does `curl -v` write its trace? A: stderr.
- Q: Per slide 26, how does an HTTP client know the reply is over? A: it reads until close.
- Q: Which three protocols does slide 36 say the TLS machinery protects? A: SSH, SMTP and database connections.

**Lab.** Needs sudo for the capture. Not run on the verification machine.
```sh
sudo tcpdump -ni any port 2026 -w /tmp/s01.pcap       # terminal 1
./02_echo_server_persistent                            # terminal 2
printf 'hello\n' | nc -w1 127.0.0.1 2026               # terminal 3
tcpdump -r /tmp/s01.pcap -X                            # after Control-C in terminal 1
```
Expected: the three handshake packets, then the payload bytes `68 65 6c 6c 6f 0a` in two packets, one each way, then the close.

### s01-m08-framing

- **Title:** Framing: where does a message end?
- **Minutes:** 22.
- **Big idea:** TCP delivers bytes with no message edges, so every protocol must say where a message ends: by a length or by a delimiter.
- **Covers:** S01-C89, S01-C90, S01-C91, S01-C92, S01-C93, S01-C94, S01-C95, S01-C96, S01-C97, S01-C125, S01-C129, S01-C130, S01-C139, S01-C140, S01-C145.
- **Prereqs:** s01-m01-seven-syscalls, s01-m07-see-the-bytes-tls.
- **Threads:** T-framing, T-skip-unknown.
- **Graded-work guard:** the Session 5 calculator assignment turns on this idea. This module teaches the rule and gives no reading loop. The checklist lives in s05-m12-assignment-prep.

**Pretest.**
1. A sender writes "hello", then "world". Can one read() return "helloworld"? *Answer: yes.*
2. What ends the HTTP header block? *Answer: an empty line.*
3. What does `Content-Length: 219` tell the reader? *Answer: read exactly 219 body bytes.*

**Try to invent it first.** Before rung 2, the page asks: "Design a chat app where a message can hold any byte, even a newline. How does the receiver know where one message stops?" The learner types a rule. Then the page shows the three answers and the reconciliation in rung 4.

**Rung 1, the picture.**

| The picture | The real thing |
|---|---|
| You pour the pages of a letter into a water pipe. | A program calls write() on a TCP socket. |
| Your friend gets one long flow. The pipe keeps no gap between pages. | read() returns bytes with no gap between writes. |
| So you agree: 100 words a page, or a page ends at STOP, or the first word gives the count. | Fixed length, delimiter, or length prefix. |

Where this breaks: a real pipe can spill or mix water. TCP never loses, reorders or mixes bytes. It only forgets where each write stopped.

**Rung 2, how it works.**
1. The sender writes `hello`, then `world`.
2. TCP puts 10 bytes in its send buffer. It can send them in one segment or in several.
3. The receiver reads. It can get `hel` and then `loworld`, or all 10 bytes at once.
4. Nothing in TCP marks the edge between the two writes.
5. So the protocol adds the edge: a length it knows, a delimiter it scans for, or a length prefix it reads first.

**Rung 3, the real thing.**
- Verified: a Python client called `send(b"hello")` and `send(b"world")` on loopback. The persistent echo server logged one `read(4, "helloworld", 4096) = 10`.
- Delimiter: the HTTP header block ends at `\r\n\r\n` (s01-m07).
- Length prefix: the 301 on slide 17 carries `Content-Length: 219`, and its body is exactly 219 bytes (verified).
- A binary length prefix: `00 05 68 65 6c 6c 6f` is a 2-byte big-endian length, 5, then `hello`. Slide 39 calls the length prefix robust, binary-safe, and what most modern protocols do (S01-C96).
- Fixed length: every message is N bytes, with padding. The protocol spec holds N, not each message.
- `notes.md` says binary protocols suit places where speed and efficiency matter. It also calls TCP/IP headers fixed size. In fact the IPv4 and TCP headers have a fixed 20-byte part plus a length field that covers options. So even a "fixed" header carries a length.

**Rung 4, exam depth.**
- *Three answers or two?* Slide 39 gives three. Session 2 slide 41, Session 3 slide 18 and Session 5 slide 16 say "length or delimiter", with no third option. Both statements hold. A fixed length is a length both sides agreed on before the connection started. It lives in the spec, not in each message.
- *The cost of each rule.*

| Rule | Good | Cost |
|---|---|---|
| Fixed length | trivial parse | padding, and N can never change |
| Delimiter | readable, no size needed up front | escape the delimiter in data (SMTP dot-stuffing, Session 2) |
| Length prefix | binary-safe, no scan | the sender must know the size first, and the field width caps it |
| Both | readable control, safe binary payload (HTTP/1.1 CRLF headers + Content-Length, IMAP literals, session-02 slide 36) | two parsers, two failure modes, request smuggling in the gap (session-02 slide 36, Session 5) |

- *Redis in two decks.* Slide 47 calls RESP "text and length-prefixed". Session 2 slide 36 lists Redis under delimiter. RESP uses both rules (S01-Q09, Open questions 10).
- *Field width.* A 1-byte length caps a message at 255 bytes, 2 bytes at 65,535, 4 bytes at about 4 GB.
- *Text versus binary.* Text won because a person can telnet in and read it. Slide 38 says that readability is most of why HTTP won (S01-C90, S01-C140). Binary wins on parse cost and ambiguity, with no whitespace rules and no case-sensitivity arguments (S01-C91, S01-C139). HTTP/2 went binary, and gRPC rides on it (s01-m10).
- *The receiver keeps leftovers.* A read can stop in the middle of a message or hold the start of the next one. So the receiver keeps unused bytes for the next message.

**Misconceptions.**
- S01-M04 (from s01-m01): "One read() returns one whole message." Distractor in check 1.
- S01-M30: "Fixed length is a third rule with no length in it." Wrong: it is a length agreed ahead of time. Distractor in check 2.
- S01-M31: "A delimiter works for any data." Wrong: data that holds the delimiter needs escaping. Distractor in check 3.
- S01-M32: "TCP sends each write() as one packet." Wrong: TCP can split or merge writes. Distractor in checks 1 and 6.
- S01-M74: "A fixed-length message needs an end marker too." Wrong: the reader counts N bytes, so no marker is needed. Distractor in check 2.
- S01-M75: "A delimiter needs the message size up front." Wrong: that cost belongs to a length prefix. A delimiter lets the sender stream. Distractor in check 3.
- S01-M76: "A delimiter is a kind of length, because the reader counts the bytes before it." Wrong: the reader learns the count only after it scans to the delimiter. Distractor in check 5.
- S01-M77: "TCP sends nothing until the send buffer is full." Wrong: TCP sends small writes soon, and it can split or merge them. Distractor in check 6.

**Diagrams.**
- Step-by-step: two writes enter a send buffer, leave as segments of random size, and arrive as reads of other sizes.
- Static: the same three messages framed four ways: fixed, delimiter, length prefix, both.

**Interactives.**
- *Framing sandbox* (P1). Inputs: a list of messages, a framing rule, a chunking seed. The learner sees the bytes arrive in random TCP chunks and sees the parser output. The learner discovers that "one read is one message" fails, and that a delimiter inside the data breaks a naive parser. Graded-work limit: only three rules, a fixed N, a newline delimiter and a 1-byte length prefix. No "both" mode, no CR LF CR LF plus Content-Length mode, and no parser source on the page. The page shows the parser state step by step, not code.

**Predict, observe, explain.** Start `02_echo_server_persistent` under `strace -e trace=read,write`. Run `python3 -c 'import socket,time; s=socket.create_connection(("127.0.0.1",2026)); s.send(b"hello"); s.send(b"world"); time.sleep(0.3); print(s.recv(100))'`. Predict how many read() calls the server makes for the two sends. Observe one read of 10 bytes on loopback. A real network can split the bytes another way. The captured output is the verification run.

**Worked example, faded example, your turn.**
- *Worked:* A 1-byte length prefix. The stream `03 61 62 63 02 68 69` arrives as `03 61`, then `62 63 02 68`, then `69`. Message 1: length 3, bytes `61 62 63`, "abc", across two reads. Message 2: length 2, bytes `68 69`, "hi", across two reads.
- *Faded:* `05 68 65 6c 6c 6f 01 21`. Message 1: length ____, text ____. Message 2: length ____, text ____. *(5, "hello". 1, "!".)*
- *Your turn:* A newline delimiter, and the user sends the text `a\nb` as one message. How many messages does the receiver see? *(Two, "a" and "b", unless the sender escapes the newline.)*

**Checks.**
1. `mcq`: two writes, "hello" and "world". What can one read() return? Answer: any split, such as "helloworld". Distractor: always exactly "hello" (S01-M04). Distractor: the two words in two reads, one per packet (S01-M32). Feedback: TCP keeps no write edges.
2. `mcq`: what is a fixed length, underneath? Answer: a length both sides agreed on ahead of time. Distractor: a third rule with no length (S01-M30). Distractor: N bytes plus an end marker (S01-M74).
3. `mcq`: the main risk of a delimiter? Answer: the delimiter shows up inside the data. Distractor: none, it works for any bytes (S01-M31). Distractor: the sender must know the size first (S01-M75).
4. `numeric`: largest payload a 1-byte length prefix can describe? Answer: 255.
5. `multi`: which of these mark a message end with a length? Answer: `Content-Length: 219`, the 2-byte prefix `00 05`. Wrong picks: the CR LF CR LF after the headers (S01-M76), the newline at the end of a homework 3 chat line (S01-M76). Feedback: those two are delimiters, found by a scan.
6. `mcq`: how many TCP segments carry one 10-byte write()? Answer: one or more, as TCP decides. Distractor: always exactly one (S01-M32). Distractor: none until the send buffer fills (S01-M77).

**Review cards.**
- Q: What does TCP deliver? A: a byte stream with no message edges.
- Q: The two framing rules? A: length or delimiter.
- Q: Why is a fixed length a length rule? A: both sides agreed on N ahead of time.
- Q: The cost of a delimiter? A: escape it when it appears in the data.
- Q: The cost of a length prefix? A: the sender must know the size first.

### s01-m09-encodings

- **Title:** BCD, hex and base64: bytes for people and for text channels.
- **Minutes:** 20.
- **Big idea:** An encoding is a fixed rule between values and bytes: BCD packs a digit into four bits, hex shows a byte as two characters, and base64 carries bytes through text-only channels.
- **Covers:** S01-C98, S01-C99, S01-C100, S01-C101, S01-C112, S01-C113, S01-C114, S01-C115, S01-C116.
- **Prereqs:** s01-m05-byte-order-dns, s01-m08-framing.
- **Threads:** T-alphabets.
- **Note:** slides 40 and 44 only. TLV and ASN.1 (slides 41 to 43) moved to s01-m11-tlv-asn1. See Open questions 2 and 3.

**Pretest.**
1. How many bits does BCD use for one decimal digit? *Answer: 4.*
2. How many base64 characters encode 3 bytes? *Answer: 4.*
3. Does base64 hide the data? *Answer: no. Anyone can decode it.*

**Rung 1, the picture.**

| The picture | The real thing |
|---|---|
| An egg carton with two cups in each box. One digit sits in each cup. | BCD puts two digits in one byte, one per nibble. |
| An odd number of eggs leaves one cup empty. You mark it with an X. | An odd last digit gets the pad nibble F. |
| A door fits only small parcels. You repack three boxes of 8 into four parcels of 6. | base64 cuts 24 bits into four 6-bit groups. |
| Each parcel gets a label from a list of 64 printable letters. | Each group maps to one character of the alphabet. |

Where this breaks: repacking does not shrink anything. base64 output is a third larger. And the labels are no lock: anyone with the list can unpack the parcels.

**Rung 2, how it works.** base64:
1. Take 3 bytes, which is 24 bits.
2. Cut them into four 6-bit groups.
3. Look up each group (0 to 63) in `A-Z a-z 0-9 + /`.
4. If only 1 or 2 bytes remain, fill the bits with zeros and add `==` or `=`.

BCD, slide order:
1. Take the digits two at a time.
2. Put the first digit in the high nibble and the second in the low nibble.
3. If one digit remains, put nibble F in the low half.

**Rung 3, the real thing.**
- Slide 40: 98765 gives the nibbles `1001 1000 0111 0110 0101` and the bytes `98 76 5F`. In a hex dump, the digits show as they are.
- `08_bcd.c`: `123456789` gives `12 34 56 78 9F` and decodes back (verified).
- ASCII `9` is `0x39`. The digit sits in the low nibble, so BCD keeps half the bits (S01-C100).
- SMS and SIM files swap the nibbles: the first digit goes in the low half. 98765 becomes `89 67 F5` (3GPP TS 23.040 §9.1.2.3).
- base64: "Man" = `4D 61 6E` = `010011 010110 000101 101110` = 19, 22, 5, 46 = `TWFu`.
- `09_base64.c`: "Hello, ASN.1!" (13 bytes) gives `SGVsbG8sIEFTTi4xIQ==` (20 characters, verified).
- Size rule: base64 gives 4 × ceil(n / 3) characters. Hex gives 2 × n characters.
- Basic auth: `Aladdin:open sesame` becomes `QWxhZGRpbjpvcGVuIHNlc2FtZQ==` (RFC 7617 §2). That is an encoding, not encryption.

**Rung 4, exam depth.**
- *Hex or base64?* Hex doubles the size but maps one byte to two characters, so a person can spot a length or a tag. base64 adds only a third, but its 4-for-3 groups hide byte edges. So hex is for reading and base64 is for transport (S01-C112, S01-C114).
- *Why base64 exists.* Email bodies, headers, URLs and JSON accept text only. base64 uses 64 characters that cross them all (T-alphabets). Session 5 shows base64url for JWTs.
- *MIME line length.* Email wraps base64 at 76 characters per line, so a real attachment grows a little more than a third (RFC 2045 §6.8).
- *BCD versus binary.* 99999 needs 17 bits in binary, so 3 bytes. In BCD it needs 5 nibbles plus a pad, also 3 bytes. BCD wins on "no conversion" and exact decimal math, not on size.
- *Check the nibble order.* The slide and `08_bcd.c` put the first digit high. GSM puts it low. A decoder must know which rule the sender used.

**Misconceptions.**
- S01-M33: "base64 compresses or encrypts." Wrong: it grows the data by a third, and anyone can decode it. Distractor in check 3.
- S01-M34: "The BCD byte 0x98 means 152." Wrong: in BCD it holds the digits 9 and 8. Distractor in checks 2 and 4.
- S01-M35: "base64 length is exactly n × 4 / 3." Wrong: padding rounds up to a multiple of 4. Distractor in check 5.
- S01-M36: "Every BCD puts the first digit in the high nibble." Wrong: SMS and SIM files swap it. Distractor in checks 4 and 6.
- S01-M78: "A BCD byte holds one ASCII character." Wrong: ASCII digits are 0x30 to 0x39, and a BCD byte holds two digits. Distractor in check 2.
- S01-M79: "The F pad always sits in the low nibble." Wrong: in semi-octets the first digit of a byte goes low, so the pad goes high: `F5`. Distractor in check 6.

**Diagrams.**
- Static: "Man" as 24 bits, cut into four groups of 6, with the alphabet lookup.
- Static: 98765 in slide BCD and in GSM semi-octets, side by side.

**Interactives.**
- *base64 bit regrouper* (P1). Inputs: 1 to 6 bytes as text or hex. The learner sees the bits, the 6-bit cuts, the zero fill and the characters. The learner discovers why one leftover byte gives `==`.
- *BCD packer* (P1). Inputs: a digit string, a nibble order (slide or GSM). The learner sees each nibble and the hex bytes. The learner discovers the F pad and the swapped order.

**Predict, observe, explain.** Run `printf 'Man' | base64` and `printf 'Ma' | base64`. Predict both. Observe `TWFu` and `TWE=`. Then run `./08_bcd`. The program packs the digits `123456789`. Predict the last byte. Observe `9F`. The captured output is the verification run.

**Worked example, faded example, your turn.**
- *Worked:* "hi" = `68 69` = `01101000 01101001`. Fill to 18 bits: `011010 000110 100100`. Values 26, 6, 36. Characters `a`, `G`, `k`. One byte short of a group, so one `=`: `aGk=`.
- *Faded:* "Ma" = `4D 61`. Groups: `010011 010110 0001__`. Values 19, 22, ____. Result: `TW____`. *(Fill with `00`. Value 4. `TWE=`.)*
- *Your turn:* Encode "A" = `41`. *(`01000001`, filled to `010000 010000`. Values 16, 16. Two bytes short of a group, so `QQ==`.)*

**Checks.**
1. `numeric`: how many base64 characters for 13 bytes? Answer: 20. Feedback: 4 × ceil(13 / 3).
2. `mcq`: the BCD byte `0x98` holds which value? Answer: 98. Distractor: 152 (S01-M34). Distractor: one ASCII character (S01-M78). Feedback: in BCD each nibble is one digit.
3. `mcq`: what does base64 give you? Answer: safe transport through text channels. Distractor: secrecy (S01-M33). Distractor: smaller data (S01-M33). Feedback: base64 grows the data by a third, and Basic auth needs TLS for secrecy.
4. `bytes`: 98765 in slide BCD. Answer: `98 76 5F`. Distractor: `01 81 CD`, plain binary (S01-M34). Distractor: `89 67 F5` (S01-M36). Feedback: the slide puts the first digit high, one digit per nibble.
5. `numeric`: how many base64 characters for 10 bytes? Answer: 16. Distractor value: 14 (S01-M35). Feedback: the output length is always a multiple of 4.
6. `mcq`: 98765 as SMS semi-octets? Answer: `89 67 F5`. Distractor: `98 76 5F` (S01-M36). Distractor: `89 67 5F` (S01-M79).

**Review cards.**
- Q: base64 output length for n bytes? A: 4 × ceil(n / 3) characters.
- Q: base64 size overhead? A: about 33%.
- Q: BCD pad nibble for an odd digit count? A: F.
- Q: Hex characters per byte? A: 2.
- Q: Why is BCD half the size of ASCII digits? A: 4 bits per digit instead of 8.

### s01-m11-tlv-asn1

- **Title:** TLV and ASN.1: messages that describe themselves.
- **Minutes:** 22.
- **Big idea:** A type and a length before each value let an old parser skip unknown fields, and ASN.1 generates that code from a schema.
- **Covers:** S01-C102, S01-C103, S01-C104, S01-C105, S01-C106, S01-C107, S01-C108, S01-C109, S01-C110, S01-C111.
- **Prereqs:** s01-m08-framing, s01-m09-encodings.
- **Threads:** T-skip-unknown, T-framing, T-encapsulation.
- **Note:** a new module, split from s01-m09. It comes before s01-m10-rpc on the site.
- **Graded-work guard:** the Session 5 project requires a clean skip of an unknown frame type. This module teaches the skip with TLV and DER. It gives no frame layout and no field widths for the project (s05-m13-project-studio).

**Pretest.**
1. A parser meets a type it does not know. What lets it continue? *Answer: the length.*
2. What is the DER tag byte for INTEGER? *Answer: 0x02.*
3. Why does DER write 200 as `00 C8` and not `C8`? *Answer: the top bit of C8 is 1, so C8 alone reads as a negative number.*

**Rung 1, the picture.**

| The picture | The real thing |
|---|---|
| A freight train. Each car has a sign: what it carries and how long it is. | Each field has a type and a length. |
| A worker who does not know "type 9" still walks that car length to the next car. | A parser skips L bytes for an unknown type. |
| A car can carry smaller boxes with their own signs. | A SEQUENCE value holds more TLVs. |
| The railway prints one rule book, and a machine builds the loaders. | An ASN.1 schema generates the codec. |

Where this breaks: a wrong sign is worse than no sign. A length that is too big walks the worker into the next car or off the train. A parser must check each length against the bytes it holds.

**Rung 2, how it works.** Skipping an unknown field:
1. Read the type.
2. Read the length, L.
3. If the parser knows the type, decode the next L bytes.
4. If not, jump over the next L bytes.
5. Repeat until the bytes end.

ASN.1, schema first (slides 41 and 42):
1. Write the shape of the data once, in a schema that no language owns.
2. The schema also sets limits: itemCode from 1 to 99999, and color one of three strings.
3. A tool reads the schema and generates the encoder and the decoder.
4. The program fills an Item and calls the generated encoder. Encoding rules such as DER give the TLV bytes.
5. Nobody writes the parser by hand (S01-C102).

**Rung 3, the real thing.**
- `10_tlv.c`: type 1 with the value "hello" gives `01 05 68 65 6C 6C 6F` (verified). The type and the length are one byte each, so a value holds at most 255 bytes.
- The schema on slide 42: `Item ::= SEQUENCE { itemCode INTEGER (1..99999), color VisibleString ("Black" | "Blue" | "Brown"), isTaxable BOOLEAN }`.
- `11_asn1_der.c`: INTEGER 5 is `02 01 05`. INTEGER 200 is `02 02 00 C8`. The SEQUENCE is `30 07` and then both. Output: `30 07 02 01 05 02 02 00 C8` (verified with `openssl asn1parse`).
- The tag byte 0x30: class bits `00` (universal), bit 6 set to 1 (constructed), number `10000` (16, SEQUENCE). See X.690 §8.1.2.5 and §8.9.1.
- One Item in DER, `{ itemCode 5, color "Blue", isTaxable TRUE }`: `30 0C 02 01 05 1A 04 42 6C 75 65 01 01 FF` (verified with openssl). VisibleString is tag 0x1A. DER writes TRUE as `FF` (X.690 §11.1).
- A limit in `11_asn1_der.c`: it keeps only the low byte of the value. INTEGER 300 comes out as `02 01 2C`, which is 44 (verified).
- TLS extensions use a 2-byte type and a 2-byte length. A TLS 1.3 server MUST ignore extensions it does not recognize (RFC 8446 §4.1.2 and §9.3).

**Rung 4, exam depth.**
- *Why skip-unknown matters.* A version 2 sender adds a type. A version 1 parser skips it and still works. Without lengths, version 1 must reject the whole message.
- *Width trade-off.* A 1-byte length saves space and caps values at 255 bytes. DER uses one length byte up to 127 and a longer form above that (X.690 §8.1.3).
- *Why DER and not plain BER?* DER allows exactly one encoding for each value. A certificate signature covers the DER bytes of the certificate, so both sides must produce the same bytes (RFC 5280 §4.1.1.3).
- *Minimal INTEGER.* DER drops extra leading `00` and `FF` bytes, but keeps one `00` when the top bit would flip the sign (X.690 §8.3.2).
- *Trust a length, pay for it.* In Heartbleed (CVE-2014-0160), OpenSSL copied as many bytes as a heartbeat message claimed and sent back server memory. RFC 6520 §4 says to drop a message whose length is too large.
- *ISO 8583 on the slide.* ISO 8583 marks present fields with a bitmap and puts a length before each variable field. Its chip-card field carries tagged values. So the TLV claim fits only part of it (Open questions 11).
- *ASN.1 versus protobuf.* Both are schema first with generated code. ASN.1 has many encoding rules and a large grammar. protobuf has one wire format (s01-m10).
- *The story box.* Slide 41: ASN.1 dates from 1984, and it still sits under X.509, LDAP, SNMP and the whole telecom stack. The instructor calls it "the most powerful system" he has seen (S01-C103, S01-C104).

**Misconceptions.**
- S01-M37: "INTEGER 200 fits in one content byte, C8." Wrong: without the leading 00, C8 reads as -56. Distractor in check 1.
- S01-M38: "The SEQUENCE tag byte is 0x10." Wrong: 16 plus the constructed bit 0x20 gives 0x30. Distractor in check 2.
- S01-M39: "An old parser must reject a message with an unknown type." Wrong: it skips the value by its length. Distractor in check 3.
- S01-M40: "The length counts the type and length bytes too." Wrong: in `10_tlv.c` and in DER it counts the value only. Distractor in check 4.
- S01-M80: "DER writes INTEGER bytes low byte first, like x86." Wrong: DER integers are big-endian. Distractor in check 1.
- S01-M81: "A tag byte is the tag number written as decimal digits." Wrong: 16 is 0x10, and the constructed bit makes 0x30. Distractor in check 2.
- S01-M82: "A parser can go on at the byte after an unknown type." Wrong: it must jump L bytes, or it reads value bytes as types. Distractor in check 3.
- S01-M83: "ASN.1 is only a guide, and you still hand-write the parser." Wrong: slide 41 says a tool generates the encoder and the decoder. Distractor in check 6.
- S01-M84: "ASN.1 is a young format from the web era." Wrong: it dates from 1984 and sits under X.509, LDAP and SNMP. Distractor in check 6.

**Diagrams.**
- Static: `30 07 02 01 05 02 02 00 C8` as nested boxes, with each tag, length and value labeled.
- Static: the tag byte 0x30 split into class, constructed bit and tag number.
- Step-by-step: an old parser walks a stream that holds one unknown type.

**Interactives.**
- *TLV builder with an old parser* (P1). Inputs: fields with a type, a value, and a "known to the old parser" flag. The learner sees the hex, then watches the old parser skip unknown types. The learner discovers that one wrong length breaks every field after it.
- *DER INTEGER encoder* (P2). Inputs: an integer from -300 to 70000. The learner sees the signed bytes, the minimal trim, and the leading 00 or FF. The learner discovers why 127 is `02 01 7F` and 128 is `02 02 00 80`.

**Predict, observe, explain.** Run `./11_asn1_der`, then `printf '\x30\x07\x02\x01\x05\x02\x02\x00\xC8' | openssl asn1parse -inform DER`. Predict the nesting depth and the two values. Observe `d=0 ... SEQUENCE`, `d=1 ... INTEGER :05`, `d=1 ... INTEGER :C8`. The captured output is the verification run.

**Worked example, faded example, your turn.**
- *Worked:* A SEQUENCE that holds INTEGER 5 and INTEGER 200. INTEGER 5: `02 01 05`, 3 bytes. INTEGER 200 = 0xC8, and its top bit is 1, so add `00`: `02 02 00 C8`, 4 bytes. Content length: 3 + 4 = 7. SEQUENCE header: `30 07`. Total: `30 07 02 01 05 02 02 00 C8`, 9 bytes.
- *Faded:* A SEQUENCE that holds INTEGER 1 and INTEGER 255. INTEGER 1: `02 01 01`. INTEGER 255: `02 __ __ __`. SEQUENCE header: `30 __`. *(`02 00 FF`, `07`.)*
- *Your turn:* A SEQUENCE that holds INTEGER 127 and INTEGER 128. Write the DER bytes. *(127 = 0x7F, top bit 0: `02 01 7F`. 128 = 0x80, top bit 1: `02 02 00 80`. Content 3 + 4 = 7. `30 07 02 01 7F 02 02 00 80`.)*

**Checks.**
1. `bytes`: DER INTEGER 200. Answer: `02 02 00 C8`. Distractor: `02 01 C8` (S01-M37). Distractor: `02 02 C8 00` (S01-M80). Feedback: the top bit of C8 is 1, and DER is big-endian.
2. `bytes`: the DER SEQUENCE tag byte. Answer: `30`. Distractor: `10` (S01-M38). Distractor: `16` (S01-M81). Feedback: 16 is 0x10, then add the constructed bit.
3. `mcq`: an old parser meets `09 03 AA BB CC`. It must? Answer: skip 3 bytes and go on. Distractor: reject the message (S01-M39). Distractor: go on at `03` and read it as the next type (S01-M82).
4. `numeric`: for `09 03 AA BB CC`, after the type and length bytes, how many bytes does the parser skip? Answer: 3. Distractor value: 1 (S01-M40). Feedback: the length counts the value only.
5. `spot-bug`: `asn1_encode_integer(out, 300)` returns `02 01 2C`. Why? Answer: the code keeps only `value & 0xFF`, which is 44.
6. `multi`: which statements match slide 41 on ASN.1? Answer: you write the schema, and a tool generates the encoder and the decoder. It dates from 1984. It still sits under X.509, LDAP and SNMP. Wrong picks: you still hand-write the parser (S01-M83). It is a young format from the web era (S01-M84).

**Review cards.**
- Q: What lets a parser skip an unknown type? A: the length field.
- Q: DER tag byte for INTEGER? A: 0x02.
- Q: DER tag byte for SEQUENCE? A: 0x30.
- Q: When does DER add a leading 00 to an INTEGER? A: when the top bit of the first byte is 1.
- Q: DER of a SEQUENCE holding 5 and 200? A: `30 07 02 01 05 02 02 00 C8`.
- Q: In ASN.1, what does a tool generate from the schema? A: the encoder and the decoder.
- Q: In which year did ASN.1 start, per slide 41? A: 1984.

**Lab.**
```sh
cd sources/cn-at-scaler/lesson1
gcc -o 10_tlv 10_tlv.c && ./10_tlv
gcc -o 11_asn1_der 11_asn1_der.c && ./11_asn1_der
printf '\x30\x0C\x02\x01\x05\x1A\x04Blue\x01\x01\xFF' | openssl asn1parse -inform DER
```
Expected: `TLV: 01 05 68 65 6C 6C 6F`, `DER SEQUENCE: 30 07 02 01 05 02 02 00 C8`, then a SEQUENCE with `INTEGER :05`, `VISIBLESTRING :Blue` and `BOOLEAN :255`.

### s01-m10-rpc

- **Title:** RPC and gRPC: a function call that can fail halfway.
- **Minutes:** 18.
- **Big idea:** RPC means framing plus a function name, but a remote call can fail halfway, time out when the work may or may not have run, and run twice.
- **Covers:** S01-C117, S01-C118, S01-C119, S01-C120, S01-C121, S01-C122, S01-C123, S01-C124, S01-C138, S01-C141.
- **Prereqs:** s01-m08-framing, s01-m11-tlv-asn1.
- **Threads:** T-network-not-function, T-skip-unknown, T-framing, T-encapsulation.

**Pretest.**
1. An RPC times out. Did the server do the work? *Answer: you cannot tell.*
2. Which encoding does gRPC use for messages? *Answer: protobuf.*
3. Can plain curl read a gRPC call? *Answer: no. It is binary protobuf on HTTP/2.*

**Rung 1, the picture.**

| The picture | The real thing |
|---|---|
| You phone a pizza shop and give your order. | The client marshals the name and the arguments. |
| The line drops before they confirm. | The response gets lost, or the timeout fires. |
| Did they hear you? You cannot know. | The work ran, or it did not. |
| You call again and get two pizzas, unless you say "order 17". | A retry runs the work twice, unless a request ID marks it. |

Where this breaks: a pizza shop may know your voice. A server knows nothing that the message does not carry.

**Rung 2, how it works.**
1. The client marshals the function name and the arguments into bytes.
2. It frames the bytes and sends them.
3. The server reads one frame, unmarshals it, runs the function, and marshals the result.
4. The client waits, with a timeout.
5. Each step can fail. A lost request means no work. A lost response means the work ran. A slow server means a timeout while the work may still run.

**Rung 3, the real thing.**
- Slide 45: marshal, frame, send. The slide names the two steps marshalling and demarshalling. Marshalling is the easy part.
- Slide 46: gRPC is protobuf, a `.proto` schema, and HTTP/2. The schema generates client and server code in any language. HTTP/2 is binary and multiplexed: many streams share one connection. No curl. The slide says the mix of speed against JSON and clarity against ASN.1 is why gRPC won.
- protobuf tag = field number × 8 + wire type, as a varint. Field 1 with the value 150 is `08 96 01`: the tag `08`, then 150 as the varint `96 01` (protobuf.dev encoding guide).
- Only wire type 2 (LEN) carries a length. Field 2 with "testing" is `12 07 74 65 73 74 69 6e 67`. A varint field has no length byte: the high bit of each byte says whether another byte follows. Slides 43 and 46 call protobuf TLV. It is TLV in spirit (beyond the slides, Open questions 9): the wire type tells an old parser how to skip a field it does not know.
- gRPC puts each message in the HTTP/2 stream behind 1 byte (a compression flag) and 4 bytes of big-endian length (gRPC `PROTOCOL-HTTP2.md`). That is the length prefix from s01-m08.

**Rung 4, exam depth.**
- *The failure table.*

| What fails | Did the work run? | What the client sees |
|---|---|---|
| The request is lost | no | a timeout |
| The server crashes before the work | no | an error or a timeout |
| The response is lost | yes | a timeout |
| The server is slow | yes, later | a timeout |

- *Retries.* A blind retry is safe only for an idempotent call, where two runs equal one run (RFC 9110 §9.2.2). Otherwise the client sends a request ID, and the server remembers the IDs it served.
- *Why every framework rediscovers this.* RPC makes a remote call look local. A local call never fails halfway, so the calling code forgets that case. Waldo and others made this argument in 1994.
- *JSON versus protobuf.* JSON repeats field names in every message and parses text. protobuf sends field numbers and varints, so it is smaller and faster. The price: you need the schema, and a tool such as grpcurl, to read it (S01-C124).
- *ASN.1 versus protobuf.* The same schema-first idea. protobuf has one wire format and a small grammar, which made it easier to adopt (S01-C120).

**Misconceptions.**
- S01-M41: "A timeout means the work did not happen." Wrong: the response alone can be lost. Distractor in check 1.
- S01-M42: "A retry is always safe." Wrong: it can run the work twice. Distractor in check 3.
- S01-M43: "curl can read a gRPC call." Wrong: the body is binary protobuf in HTTP/2 frames. Distractor in check 5.
- S01-M44: "gRPC sends JSON." Wrong: it sends protobuf. Distractor in check 6.
- S01-M85: "A timeout means the work ran exactly once." Wrong: it may have run zero times, once, or later. Distractor in check 1.
- S01-M86: "A long timeout makes a blind retry safe." Wrong: a lost response still hides a finished run. Distractor in check 3.
- S01-M87: "The protobuf tag byte is the field number itself." Wrong: the tag is field number × 8 + wire type. Distractor in check 4.
- S01-M88: "A varint is plain big-endian bytes." Wrong: each byte carries 7 bits, low group first, and the high bit says that more bytes follow. Distractor in check 4.
- S01-M89: "Binary protobuf carries its field names." Wrong: it carries field numbers only, so a reader needs the schema. Distractor in check 5.
- S01-M90: "gRPC encodes messages with ASN.1." Wrong: slide 46 says protobuf, which is easier to understand than ASN.1. Distractor in check 6.

**Diagrams.**
- Step-by-step: client, network and server lanes for four runs: success, lost request, lost response, slow server.
- Static: the bytes `08 96 01` with the field number, wire type and varint bits labeled.

**Interactives.**
- *RPC failure simulator* (P2). Inputs: drop the request, drop the response, delay, retry count, request ID on or off. The learner sees how many times the server ran the work and what the client saw. The learner discovers that a timeout says nothing about the work.

**Predict, observe, explain.** No instructor command exists for RPC, so the page uses this local probe. The server counts each run and answers after 2 s. The client waits 1 s and retries 2 times.

```python
import socket, threading, time
srv = socket.create_server(("127.0.0.1", 2041)); runs = 0
def work(c):                      # the remote function: count the run, answer after 2 s
    global runs; c.recv(100); runs += 1; time.sleep(2); c.sendall(b"done")
def serve():
    while True: threading.Thread(target=work, args=(srv.accept()[0],)).start()
threading.Thread(target=serve, daemon=True).start()
for attempt in (1, 2, 3):         # one call and two retries, each with a 1 s timeout
    s = socket.create_connection(("127.0.0.1", 2041), timeout=1); s.sendall(b"charge order 17")
    try: print("try", attempt, s.recv(100)); break
    except TimeoutError: print("try", attempt, "timeout")
print("the work ran", runs, "times")
```

Predict how many times the work runs. Observe `try 1 timeout`, `try 2 timeout`, `try 3 timeout`, `the work ran 3 times`. The captured output is a verification run, Python 3.14, loopback, 2026-09-13. It matches the "server is slow" row of the failure table.

**Worked example, faded example, your turn.**
- *Worked:* The response gets lost two times, then it arrives. The client sent 3 requests. The server ran the work 3 times.
- *Faded:* The request gets lost one time, then the call succeeds. Server runs: ____. *(1.)*
- *Your turn:* The request gets lost two times, then the response gets lost one time, then the fourth try succeeds. Requests sent? Server runs? *(4 sent. 2 runs: the third and the fourth.)*

**Checks.**
1. `mcq`: a call times out. What do you know about the work? Answer: nothing. Distractor: it did not run (S01-M41). Distractor: it ran exactly once (S01-M85). Feedback: a lost response looks the same as a lost request.
2. `numeric`: the response gets lost three times, and the fourth try succeeds. How many server runs? Answer: 4.
3. `mcq`: when is a blind retry safe? Answer: when the call is idempotent. Distractor: always (S01-M42). Distractor: when the timeout is long (S01-M86).
4. `bytes`: `08 96 01`. Field number and value? Answer: field 1, value 150. Distractor: field 8, value 150 (S01-M87). Distractor: field 1, value 0x9601 = 38401 (S01-M88). Feedback: 0x08 >> 3 = 1, and 0x16 + 1 × 128 = 150.
5. `mcq`: which tool reads a gRPC call? Answer: a tool that knows the schema, such as grpcurl. Distractor: plain curl (S01-M43). Distractor: any hex dump, which shows the field names (S01-M89).
6. `mcq`: the gRPC message encoding? Answer: protobuf. Distractor: JSON (S01-M44). Distractor: ASN.1 (S01-M90).

**Review cards.**
- Q: RPC in one line, from slide 45? A: framing plus a function name.
- Q: Per slide 45, what does a timeout tell you about the work? A: it may or may not have run.
- Q: What can a retry of a call that is not idempotent do? A: run the work twice.
- Q: gRPC message encoding? A: protobuf.
- Q: What does HTTP/2 give gRPC, per slide 46? A: many streams over one connection.
- Q: Why do new protobuf fields not break old clients? A: slide 46 says tag-length-value on the wire. More exactly, the wire type tells the parser how to skip.
- Q: The price of gRPC, per slide 46? A: plain curl cannot read it.

## 6. Beyond the slides

Facts the lessons need that the sources do not state. "Verified" means a run on the machine named in the header. Lesson pages show each one with a "beyond the slides" badge.

| Fact | Reference | Module |
|---|---|---|
| Only a server calls listen and accept. A server always calls bind. A client usually skips bind and lets connect() choose the port. The client also calls socket(), and adds connect(). | `man 2 socket`, `man 2 connect`, `man 7 ip` | m01 |
| close() with unread received data sends RST, not FIN. | `RFC 2525 §2.17`, Linux `net/ipv4/tcp.c` `__tcp_close` | m01 |
| listen() on an unbound stream socket gets an ephemeral port (verified: `0.0.0.0:54601`). | `man 7 ip` (ip_local_port_range) | m02 |
| Since Linux 2.2, the backlog sizes the queue of finished handshakes. somaxconn caps it: 4096 since Linux 5.4, 128 before. | `man 2 listen` NOTES, kernel `admin-guide/sysctl/net.rst` | m02 |
| Linux calls the queue full only above the backlog, so N holds N + 1 (verified: 1 held 2, 3 held 4). | Linux `include/net/sock.h` `sk_acceptq_is_full` | m02 |
| With a full accept queue, Linux always drops the SYN. The client retries about 127 s. tcp_abort_on_overflow=1 only resets a handshake whose final ACK finds the queue full. macOS also drops the SYN silently. | Linux `net/ipv4/tcp_input.c` `tcp_conn_request`, `net/ipv4/tcp_minisocks.c` `tcp_check_req`, `ip-sysctl.rst` tcp_abort_on_overflow, `man 7 tcp` tcp_syn_retries, XNU `bsd/netinet/tcp_input.c` "listen drop" | m02 |
| A queued connection gets ACKs for its data, so the client waits with no TCP timeout (verified). | `RFC 9293 §3.10.7.4`, verified run | m02 |
| Ports below 1024 need root or CAP_NET_BIND_SERVICE. The threshold is the sysctl ip_unprivileged_port_start. | `man 7 ip`, kernel `ip-sysctl.rst` | m02 |
| SO_REUSEADDR lets bind() succeed next to TIME_WAIT sockets. It does not allow two listeners. | `man 7 socket` | m02 |
| After an unchecked EADDRINUSE, listen() picks a random port, and clients to 2026 get refused (verified). | verified run, `man 7 ip` | m02 |
| On Linux, the first write after RST returns ECONNRESET. The second gets EPIPE and SIGPIPE (verified). | Linux `net/core/stream.c` `sk_stream_error` | m03 |
| A shell reports 128 + N for a death by signal N. A plain `wait` returns 0 in bash and zsh (verified). | bash manual, EXIT STATUS and `wait` builtin | m03 |
| Control-Z sends SIGTSTP (20). No handler can catch SIGKILL (9) or SIGSTOP (19). | `man 7 signal` | m03 |
| SIGPIPE exists so a pipe writer stops when the reader exits. Ignore it, or use MSG_NOSIGNAL, to get an error (ECONNRESET or EPIPE) instead. GNU cat checks its write errors and prints "write error: Broken pipe" when SIGPIPE is ignored (verified). | `man 7 pipe`, `man 2 send`, `man 2 write` | m03 |
| A client with no server also exits with 141: failed connect, unchecked write, SIGPIPE (verified). | verified run | m03 |
| Linger 0 makes close() abort with RST, and that side keeps no TIME_WAIT (verified). | Linux `net/ipv4/tcp.c`, `man 7 socket` SO_LINGER | m03 |
| TIME_WAIT sits on the side that closes first. Session 2 slide 5 says 2 MSL (S01-C142), as RFC 9293 does. Linux uses a fixed 60 s. | `RFC 9293 §3.3.2`, Linux `include/net/tcp.h` `TCP_TIMEWAIT_LEN` | m04 |
| The default ephemeral range 32768 to 60999 holds 28,232 ports. | kernel `ip-sysctl.rst` ip_local_port_range | m04 |
| A client can call bind() before connect() to pick a source address or port. Slide 21 says clients never bind. | `man 2 bind`, `man 7 ip` | m04 |
| Network byte order sends the most significant octet first. | `RFC 791 Appendix B` | m05 |
| htons swaps bytes only on a little-endian host. On x86, 2026 without htons binds 59911 (verified). | `man 3 byteorder`, verified run | m05 |
| /etc/nsswitch.conf sets the order of name sources. /etc/hosts first is the common default. | `man 5 nsswitch.conf` | m05 |
| gethostbyname is obsolete and MT-Unsafe. getaddrinfo replaces it. | `man 3 gethostbyname` | m05 |
| A TTL cache lives in a resolver service, such as systemd-resolved, or in the recursive resolver. | `man 8 systemd-resolved` | m05 |
| A DNS answer too large for UDP comes back truncated, and the client retries over TCP. | `RFC 1035 §4.2.1`, `RFC 7766` | m05 |
| A child that exits without a wait() from its parent stays a zombie (verified: three `Z` rows). | `man 2 wait` NOTES | m06 |
| A connection closes only when its last descriptor closes, so the parent must close its copy. A fork child shares pages with the parent until one side writes (copy-on-write). | `man 2 close`, `man 2 fork` | m06 |
| HTTP/1.1 sets no fixed number of connections per server, so the six-connection cap is a browser choice. | `RFC 9112 §9.4` | m06 |
| select can only watch descriptor numbers below FD_SETSIZE (1024). | `man 2 select` | m06 |
| Chromium still allows 6 sockets per host group in its normal pool. | Chromium `net/socket/client_socket_pool_manager.cc` | m06 |
| `ulimit -n` shows the soft limit. `ulimit -Hn` shows the hard limit. | `man 2 getrlimit` (RLIMIT_NOFILE) | m06 |
| HTTP/1.1 connections persist by default, so read-until-close waits. Senders MUST use CRLF. | `RFC 9112 §9.3, §2.2` | m07 |
| The Google 301 body is 219 bytes: four LF line ends, then two CRLF (verified 2026-09-13). | `curl -i google.com`, xxd | m07 |
| Since curl 8.10, each extra `-v` raises the trace level. The trace goes to stderr. | `man curl` (8.18) | m07 |
| `tcpdump -i any` includes loopback. A live capture needs root or CAP_NET_RAW. | `man 8 tcpdump`, `man 7 packet` | m07 |
| SSH does not use TLS. It has its own transport protocol. TLS 1.3 is RFC 8446. | `RFC 4253`, `RFC 8446` | m07 |
| The client sends the server name (SNI) in the ClientHello, the first TLS message, before encryption starts. | `RFC 6066 §3`, `RFC 8446 §4.1.2, §4.2` | m07 |
| A pinned app breaks when the server rotates to a certificate that is not in its pin set, until the app updates. | OWASP Pinning Cheat Sheet | m07 |
| A switch learns the port of each MAC address and forwards a frame for a known address only to that port. | IEEE 802.1Q, learning process and filtering database | m07 |
| IPv4 and TCP headers have a 20-byte fixed part plus options, sized by a length field. | `RFC 791 §3.1`, `RFC 9293 §3.1` | m08 |
| SMS and SIM semi-octets put the first digit in the low nibble: 98765 is 89 67 F5. | `3GPP TS 23.040 §9.1.2.3` | m09 |
| base64 output is 4 × ceil(n/3) characters, and MIME wraps it at 76 per line. | `RFC 4648 §4, §10`, `RFC 2045 §6.8` | m09 |
| Basic auth sends base64 of user:password, which anyone can decode. | `RFC 7617 §2` | m09 |
| The DER tag byte uses bit 6 for constructed. SEQUENCE is always constructed, so 16 becomes 0x30. | `ITU-T X.690 §8.1.2.5, §8.9.1` | m11 |
| A DER INTEGER is a signed big-endian number in the fewest octets. The first 9 bits are never all equal. | `ITU-T X.690 §8.3.2, §8.3.3` | m11 |
| DER writes TRUE as FF, and lengths in the fewest octets. The short form covers 0 to 127. | `ITU-T X.690 §11.1, §10.1, §8.1.3.4` | m11 |
| A certificate signature covers the DER bytes of the certificate body. | `RFC 5280 §4.1.1.3` | m11 |
| `11_asn1_der.c` keeps only the low byte, so INTEGER 300 encodes as `02 01 2C` (verified). | verified run | m11 |
| TLS extensions are a 2-byte type and a 2-byte length. A server MUST ignore unknown ones. | `RFC 8446 §4.2, §4.1.2, §9.3` | m11 |
| Heartbleed: OpenSSL trusted a heartbeat length and leaked memory. The RFC says to drop such messages. | `CVE-2014-0160`, `RFC 6520 §4` | m11 |
| ISO 8583 marks fields with a bitmap. Variable fields carry a length prefix. Field 55 holds chip data. | `ISO 8583-1` (paid), Wikipedia "ISO 8583" checked 2026-09-13 | m11 |
| protobuf tag = (field number << 3) OR wire type. Field 1 = 150 encodes as 08 96 01. | protobuf.dev, Encoding guide | m10 |
| Only protobuf LEN fields (wire type 2) carry a length. A varint field carries none, so protobuf is TLV only in spirit. | protobuf.dev, Encoding guide | m10 |
| gRPC frames each message with a 1-byte flag and a 4-byte big-endian length. | grpc `doc/PROTOCOL-HTTP2.md` | m10 |
| An idempotent request has the same effect when sent once or many times. | `RFC 9110 §9.2.2` | m10 |
| A remote call cannot hide partial failure behind a local call interface. | Waldo et al., "A Note on Distributed Computing", Sun Labs TR-94-29, 1994 | m10 |
| RESP bulk strings are `$length` CRLF data CRLF, so RESP uses a length and a delimiter. | redis.io, RESP protocol spec | Q09 |

## 7. Open questions

1. **Slide numbers in the README.** The Module IDs table in `docs/curriculum/README.md` counts two lower than the PDF, as if the title and week pages were absent. This file uses PDF pages. The modules start at: m01 5-10, m02 8, 9, 11 (and 34), m03 12-14, m04 15-21, m05 22-24, m06 28-33, m07 25-27, 35, 36 (and 34), m08 37-39, m09 40, 44, m11 41-43, m10 45, 46. Resolved 2026-09-14: the README table now uses these PDF pages and lists s01-m11.
2. **Module changes.** (a) s01-m09-encodings kept its ID but lost TLV and ASN.1. (b) A new module, s01-m11-tlv-asn1, took slides 41 to 43, because one page with four encodings breaks the one big idea rule. The site order is m09, m11, m10. (c) Slide 34 split: INADDR_ANY and SO_REUSEADDR went to s01-m02, and promiscuous mode went to s01-m07. s01-m06 keeps slides 28 to 33.
3. **Which session owns the encoding samples?** The instructor committed `bcd.c`, `base64.c`, `tlv.c` and `asn1_der.c` as `lesson2` on 2026-08-13 (commit 5fb92b6) and moved them into `lesson1` on 2026-08-14 (e1a8151). The Session 1 deck teaches them in section 06, and Session 2 slide 29 opens with "Last time we built binary protocols". This file treats them as Session 1.
4. **Three framing answers or two.** Slide 39 gives three. Session 2 slide 41, Session 3 slide 18 and Session 5 slide 16 say there is no third option. s01-m08 treats a fixed length as a length agreed ahead of time. Confirm that this matches the intent of the instructor.
5. **Which write raises SIGPIPE.** The comments on slide 13 put SIGPIPE on the first write. On Linux 7.1, the first write returns ECONNRESET and the second one raises SIGPIPE (verified). The telnet prompt on slide 17 suggests a Mac laptop. macOS behavior is not checked.
6. **The README exit status recipe.** `wait; echo $?` prints 0 in bash and zsh. `wait $pid` prints 141. Lesson pages use the second form.
7. **Ports differ.** Slides 13, 14 and 20 use port 8080. The repo files use 2026. A slide client with a repo server gets "refused". Lesson pages use the repo files.
8. **Divider topics with no slides.** "A quick tour of the RFC" and "Testing headers on purpose" (slide 25), strace (slide 28), and the "history lesson" in the socket options man page (slide 34). The class content is unknown.
9. **Slide wording to confirm.** Slide 5 marks socket() among "the four that only a server makes", but the client calls socket() too. Slide 9 says the queued client "waits until TCP times out". A connection already in the queue waits with no TCP timeout. Only SYNs past a full queue time out, after about 127 s. Slide 12 pairs Control-Z with SIGSTOP and SIGTSTP, but the terminal sends SIGTSTP. Slide 33 calls six connections the "old" Chrome cap, but Chromium still uses 6 for HTTP/1.x. Slide 36 lists SSH with the users of TLS, but SSH has its own transport (S01-C146). Slide 29 says select and epoll need "no per-client memory". Each connection still holds a buffer and some state, so the site reads it as no process and no stack per client (S01-C136). Slide 21 says "Clients never bind", but a client can bind to pick a source address (`man 2 bind`). Slide 33 calls `ulimit -n` the "hard ceiling", but `ulimit -n` shows the soft limit, and `ulimit -Hn` shows the hard one. Slide 11 says a full queue gives "an indefinite 'Trying...'" on some systems, but on Linux a SYN past a full queue fails after about 127 s. Slides 43 and 46 call protobuf tag-length-value, but a varint field carries no length, and the wire type tells a parser how to skip. Lesson pages show the slide wording first, then the correction, because a quiz can use the slide wording.
10. **Redis framing in two decks.** Slide 47 calls RESP length-prefixed. Session 2 slide 36 lists Redis under delimiter. RESP uses both (S01-Q09).
11. **ISO 8583 as TLV.** Slide 43 lists ISO 8583 with TLS extensions and protobuf. The core ISO 8583 layout is a bitmap with fixed and length-prefixed fields. Only its chip data field holds tagged values. The standard is paid, so this rests on a secondary source.
12. **README examples.** The ID examples in `docs/curriculum/README.md` name S01-C07 as the backlog claim and S01-M04 as "one read() returns one message". Here S01-M04 matches, but S01-C07 is the echo server claim, and the backlog claims are S01-C20 and S01-C25. Resolved 2026-09-14: the README example names S01-C25.
13. **notes.md confidence.** The claims S01-C129 to S01-C135 and S01-C143 to S01-C145 come from the AI notes only. They stay `detail`, and no check tests them alone.
14. **Session 2 slide 4 label.** It says "THE SIX" above a list of seven calls. Flag it for the Session 2 author.
15. **Measured conditions.** The telnet output on slide 17 comes from the laptop of the instructor on 2026-08-12, over the internet. Every "verified" result here comes from one Linux 7.1 machine over loopback. Keep both conditions on any lesson page that shows them.
16. **Two ideas on one page.** s01-m05 joins byte order and DNS, and s01-m07 joins readable bytes and TLS. The README fixes both IDs, so this file keeps each as one page with named segments (see each module). A split needs new IDs, s01-m12 and s01-m13, and a README change. Bibek decides after the pilot.
17. **Counts over the template.** A review on 2026-09-13 added a second tagged distractor to each choice item (S01-M45 to S01-M90), slide-wording cards, and split cards. So s01-m02 has 8 cards, s01-m03 7, s01-m07 7, s01-m10 7 and s01-m11 7, over the six in the template. The file also runs over 1,300 lines. Resolved 2026-09-14: the README template now allows 3 to 8 cards and 1,500 lines, and T-network-not-function now says "may or may not have run", as slide 45 does.

