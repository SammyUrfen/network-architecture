# Session 2 — Computer Networking Eagle Eye View

## 1. Header

- **Title:** Computer Networking Eagle Eye View. Deck title "Computer Networks".
- **Approximate date:** about 2026-08-14.
- **Instructor subtitle:** "Seven syscalls make a server. Seven layers of nesting carry eleven bytes. Today we open both ends."
- **Tags on slide 1:** OSI · SS7 · BBR · TCP · UDP · QUIC · SMTP · POP · FTP.
- **Agenda (slide 2):** five stops (Sockets, OSI, SS7, TCP · UDP · QUIC, text protocols by hand) and one idea: the headers of one layer are the body of the next.

**Sources used**

| Path | What it gives | Trust |
|---|---|---|
| `sources/session-02/slides.txt` | 41 PDF pages, complete. PDF page N matches footer N in this deck. | high |
| `sources/session-02/notes.md` | AI summary of the class, with citation junk | low |
| `sources/session-05/slides.txt` | later quotes of this session: closing idea 2, MIME, TCP ports, TCAP id | high |
| `cn-at-scaler/lesson5/http-evolution/README.md` line 275 | "Session 2 did handshakes" | high |
| `cn-at-scaler/lesson1/01_echo_server.c` | the server from slide 4, used in the labs | high |
| RFCs, ITU-T Q.703, 3GPP TS 29.002 and others | fact checks, see section 6 | high |

**Source gaps.** No transcript. The instructor repo has no Session 2 code. The demos run public containers (mailpit, greenmail, pyftpdlib), so no captured output exists. Predict-observe blocks use the slide transcript or a run on the learner machine. The notes cite `transcript.txt` and `handwritten.pdf`, which are not available.

**Confidence.** High for TCP, UDP, SMTP, MIME, POP, IMAP and FTP: slides plus RFC checks. Medium for the SS7 byte counts and the SMS size story: the slides disagree with each other on 272 and 273, and one octet count does not reproduce. Low for the numbers without conditions: 2 ms Wi-Fi contention, 20 ms Starlink, 190 ms Mumbai to Virginia, and "up to 2,000×" for BBR.

## 2. The session in one paragraph

Every network is a set of envelopes inside envelopes. An HTTP request rides inside TCP, inside IP, inside Ethernet. An SMS rides inside MAP, inside TCAP, inside SCCP, inside MTP. The phone network built this onion in the 1970s and the internet built the same one later. The session walks both, then asks two design questions that every protocol must answer. Where does a message end: at a length or at a delimiter? Where does reliability live: at each hop, at the two ends, or in userspace? It closes by typing SMTP, POP and FTP by hand, so the learner sees framing, text alphabets and a separate data connection with real bytes. A working engineer needs this map to read a packet capture, choose TCP, UDP or QUIC, and debug a stuck socket or a mail header.

## 3. Claim inventory

Core count: 126 of 165.

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|
| S02-C01 | One idea runs through the whole session: the headers of one layer are the body of the next. Ethernet, SS7, email and FTP all show it. | slides.txt slide 2, 41 | core |
| S02-C02 | Title line: seven syscalls make a server. Seven layers of nesting carry eleven bytes. | slides.txt slide 1 | story |
| S02-C03 | Above the socket API everything is a convention. Below it everything is the problem of somebody else. | slides.txt slide 3 | detail |
| S02-C04 | A TCP server is socket, bind, listen, accept, read, write, close. Session 1 owns this. | slides.txt slide 2, 4 | detail |
| S02-C05 | The 1 in `listen(fd, 1)` is the accept-queue depth, not a connection limit. It returns in the SYN flood story. Session 1 owns this (S01-C25). s02-m04 only links back. | slides.txt slide 4, 24 | detail |
| S02-C06 | `htons` exists because the wire is big-endian and most laptops are not. Session 1 owns this. | slides.txt slide 4 | detail |
| S02-C07 | A client calls no bind and no listen. The kernel picks an ephemeral source port. Session 1 owns this. | slides.txt slide 5 | detail |
| S02-C08 | `connect()` is the call that starts the TCP handshake. Session 1 owns this (S01-C45). | slides.txt slide 5 | detail |
| S02-C09 | A normal `close()` sends FIN. The socket then waits in TIME_WAIT for 2 MSL. Session 1 owns this (S01-C32). Slide 25 teaches the close again (S02-C102). | slides.txt slide 5 | detail |
| S02-C10 | `SO_LINGER {1, 0}` makes close send RST. No TIME_WAIT, and unsent data is lost. Fast and lossy: for demos only. Session 1 owns this (S01-C32, S01-C33). | slides.txt slide 5 | detail |
| S02-C11 | Sockets are files in the Unix sense, so read and write work on them. | notes.md (low trust) | detail |
| S02-C12 | OSI is a 1984 committee model that outlived almost everything built on top of it. | slides.txt slide 6 | story |
| S02-C13 | OSI L7 application: HTTP, FTP, DNS, SMTP. L6 presentation: encryption, compression, encoding. L5 session: sessions, authentication. | slides.txt slide 7 | core |
| S02-C14 | L4 transport: TCP, UDP. L3 network: IP, ICMP, routing. L2 data link: Ethernet, MAC, ARP, switches. L1 physical: cables, signals. | slides.txt slide 7 | core |
| S02-C15 | TCP at L4: connection-oriented, reliable, ordered, flow and congestion control, error recovery. Higher latency. HTTP, FTP, SMTP, SSH. | slides.txt slide 7 | core |
| S02-C16 | UDP at L4: connectionless, low overhead, no delivery guarantee, no ordering. Low latency. DNS, VoIP, video calls, games. | slides.txt slide 7 | core |
| S02-C17 | On a wire you detect collisions (CSMA/CD). On radio you can only avoid them (CSMA/CA, 802.11). L3 and up stay the same. | slides.txt slide 8 | core |
| S02-C18 | Wi-Fi cannot detect a collision. A radio cannot listen while it transmits, because its own signal drowns everything else. | slides.txt slide 8 | core |
| S02-C19 | The CSMA/CA loop: sense the channel, defer if busy, random backoff, transmit, wait for an ACK. No ACK: back off and send again. | slides.txt slide 8 | core |
| S02-C20 | Wi-Fi acknowledges each frame at L2, long before TCP at L4 knows that anything happened. | slides.txt slide 8 | core |
| S02-C21 | About 2 ms of contention delay passes before a frame leaves. The slide gives no conditions. | slides.txt slide 8 | detail |
| S02-C22 | Starlink is a physical layer. That is the entire point of having layers. | slides.txt slide 9 | core |
| S02-C23 | The path: laptop, Wi-Fi, dish, Ku/Ka uplink, LEO satellite (about 550 km, about 20 ms), optional laser crosslink, gateway, internet. | slides.txt slide 9 | detail |
| S02-C24 | The IP header arrives unchanged except TTL, checksum and any NAT rewrite. L3 and up never learn that the packet went to space. | slides.txt slide 9 | core |
| S02-C25 | SS7 is a second network, older than TCP/IP, that you use every day and never see. Its one big idea, 1975: get the signalling out of the voice channel. | slides.txt slide 2, 10, 11 | core |
| S02-C26 | Before SS7, signalling was in-band. A 2600 Hz tone meant "trunk idle" and MF tones carried the digits. Who makes the sound makes the decision. | slides.txt slide 11 | core |
| S02-C27 | After SS7, voice rides a 64 kbps DS0 bearer. Signalling rides a separate packet network that the caller never touches. | slides.txt slide 11 | core |
| S02-C28 | This is the control plane and data plane split. Fifty years later, every network you build still does it. | slides.txt slide 11 | core |
| S02-C29 | Blue boxes died when SS7 split control from voice. | slides.txt slide 41 | story |
| S02-C30 | SS7 and TCP/IP do the same seven jobs with different names and a very different trust model. | slides.txt slide 12 | core |
| S02-C31 | The slide maps MAP, INAP, CAP, ISUP to L7. TCAP to L5–L6 (dialogues, components, ASN.1 BER). SCCP to L4 (subsystems, global titles). | slides.txt slide 12 | detail |
| S02-C32 | MTP3 (L3) routes by point code with SLS load sharing. MTP2 (L2) has signal units, FSN/BSN, CRC-16, retransmission. MTP1 is DS0 on E1/T1. | slides.txt slide 12 | core |
| S02-C33 | The TCP/IP column: TLS or app framing at L5–L6, no distinct layer. TCP/UDP at L4, IP at L3, Ethernet/PPP/HDLC at L2. | slides.txt slide 12 | detail |
| S02-C34 | SS7 is a whole stack and TCP is one protocol at L4. The fair comparison is stack to stack. | slides.txt slide 12 | core |
| S02-C35 | Ethernet II: destination MAC 6 B, source MAC 6 B, EtherType 2 B (0x0800), payload 46–1500 B, FCS 4 B (CRC-32). | slides.txt slide 13 | core |
| S02-C36 | IPv4 header 20 B. The slide shows version/IHL, total length, TTL, protocol 6 = TCP, checksum, source IP, destination IP. | slides.txt slide 13 | core |
| S02-C37 | TCP header 20 B: ports, seq, ack, flags, window. The payload is at most the MSS, typically 1460 B. | slides.txt slide 13 | core |
| S02-C38 | To TCP the HTTP request is an opaque byte stream that it neither knows nor cares about. | slides.txt slide 13 | core |
| S02-C39 | Byte budget: 1500 MTU − 20 IP − 20 TCP = 1460 MSS. Add 14 B of Ethernet header and 4 B of FCS: a 1518 B frame. | slides.txt slide 13 | core |
| S02-C40 | An SMS nests MTP2 ⊃ MTP3 ⊃ SCCP ⊃ TCAP ⊃ MAP ⊃ TPDU. Same onion as Ethernet ⊃ IP ⊃ TCP ⊃ HTTP, fifty years apart. | slides.txt slide 14, 41 | core |
| S02-C41 | The MTP2 MSU: flag, BSN+BIB, FSN+FIB, LI, SIO+SIF, CRC-16, flag. The top line of this slide says the SIF cap is 273 octets. Its bottom line says 272. | slides.txt slide 14 | detail |
| S02-C42 | MTP3 in the example: SIO 0x83, DPC 2065, OPC 2050, SLS 5, payload 129 octets. | slides.txt slide 14 | detail |
| S02-C43 | SCCP UDT in the example: type 0x09, class 1, called GT +447700900999, calling GT +447700900111, 99 octets inside. | slides.txt slide 14 | detail |
| S02-C44 | TCAP `BEGIN`: tag 0x62, OTID 0x00000001, a dialogue AARQ with application context shortMsgMO-Relay v3. | slides.txt slide 14 | detail |
| S02-C45 | The MAP invoke: tag 0xA1, invoke ID 1, opCode 46 (0x2E) = mo-ForwardSM, 47 octets. | slides.txt slide 14 | core |
| S02-C46 | The MAP argument holds sm-RP-DA, sm-RP-OA and sm-RP-UI. The sm-RP-UI is 25 octets. | slides.txt slide 14 | detail |
| S02-C47 | The SMS-SUBMIT TPDU: MTI, TP-MR, TP-DA, TP-PID, TP-DCS 0x00 (GSM-7), TP-VP, TP-UDL 0x0C. | slides.txt slide 14 | core |
| S02-C48 | The user data `C8 32 9B FD 06 5D DF 72 36 39 04` is "Hello World!": 12 characters, 84 bits, 11 octets. | slides.txt slide 14, 40 | core |
| S02-C49 | An SMS is 140 bytes because a 1980s signalling packet caps at 272 octets. | slides.txt slide 15 | core |
| S02-C50 | Three stacked limits: SIF 272 (one MSU), sm-RP-UI about 200 (MAP user data), TP-UD 140 (the SMS). The smallest wins. | slides.txt slide 15 | core |
| S02-C51 | 140 octets keeps the whole MAP operation in one MSU. No segmentation, no reassembly, no state. So SMS ran on 1980s hardware, and it still works when the data network is down. | slides.txt slide 15 | core |
| S02-C52 | 160 characters fit in 140 bytes: 140 × 8 = 1120 bits, and 1120 ÷ 7 = 160 GSM 7-bit characters. | slides.txt slide 16 | core |
| S02-C53 | Packing pushes septets into one bit stream and cuts it into octets. After the first character, the boundaries stop lining up. | slides.txt slide 16 | core |
| S02-C54 | 12 characters × 7 bits = 84 bits. They travel as 11 octets (88 bits) with 4 zero padding bits. | slides.txt slide 16 | core |
| S02-C55 | With UCS-2 for emoji or a non-Latin script, the same 140 octets hold 70 characters. One emoji can cost a second SMS. | slides.txt slide 16 | core |
| S02-C56 | Sending a text is a database lookup wrapped in a queue. | slides.txt slide 17 | core |
| S02-C57 | Phone A sends SMS-SUBMIT to its serving switch (VMSC/VLR). The switch sends MAP mo-ForwardSM, opCode 46, to the SMSC. | slides.txt slide 17 | core |
| S02-C58 | The SMSC answers TCAP `END`: accepted, queued. From then on, delivery is the problem of the SMSC. | slides.txt slide 17 | core |
| S02-C59 | The SMSC asks the HLR with MAP sendRoutingInfoForSM (MSISDN). The HLR returns the IMSI and the serving MSC address. | slides.txt slide 17 | core |
| S02-C60 | The SMSC sends MAP mt-ForwardSM (SMS-DELIVER) to MSC B. MSC B delivers over the air, gets an ack, and returns the result. | slides.txt slide 17 | core |
| S02-C61 | SMS-STATUS-REPORT goes back to phone A only if the sender asked for one. | slides.txt slide 17 | detail |
| S02-C62 | A phone call puts signalling on one network and voice on another. | slides.txt slide 18 | core |
| S02-C63 | ISUP setup: IAM (called number, bearer request). ACM: the caller hears ringback. ANM: the voice path cuts through. | slides.txt slide 18 | core |
| S02-C64 | During the conversation a 64 kbps bearer circuit carries the voice, with no SS7 involvement at all. | slides.txt slide 18 | core |
| S02-C65 | Release: on-hook, then REL, then RLC, and the circuit is free. | slides.txt slide 18 | core |
| S02-C66 | The slide says four messages set up a call. The signalling network does its job at the edges. | slides.txt slide 18 | detail |
| S02-C67 | In 5G the same call is HTTP-shaped text over IP: IMS and SIP. | slides.txt slide 19 | core |
| S02-C68 | SIP: INVITE with an SDP offer goes through a proxy or SBC. Then 100 Trying, 180 Ringing, and 200 OK with the SDP answer. | slides.txt slide 19 | core |
| S02-C69 | The ACK goes end to end, past the proxy. RTP/SRTP media flows between the endpoints over UDP. BYE and 200 OK end it. | slides.txt slide 19 | core |
| S02-C70 | SIP borrowed the status codes of HTTP: 100, 180, 200. Signalling is text, media is RTP, and the two take separate paths. | slides.txt slide 19 | core |
| S02-C71 | Try it with Asterisk or FreeSWITCH, a softphone (Linphone, Zoiper), and Wireshark with the SIP dissector. | slides.txt slide 19, 40 | detail |
| S02-C72 | SS7 makes every hop reliable. TCP makes only the endpoints reliable. | slides.txt slide 20 | core |
| S02-C73 | SS7 FSN is 7 bits per signal unit and wraps at 128. The TCP sequence number is 32 bits and counts bytes. | slides.txt slide 20 | core |
| S02-C74 | SS7 acks with BSN + BIB on every unit and resends with a BIB toggle, PCR on long links. TCP: cumulative ACK, SACK, RTO, 3 duplicate ACKs. | slides.txt slide 20 | detail |
| S02-C75 | SS7 flow control is SIB in an LSSU, a blunt stop/go. TCP advertises a window. SS7 checks CRC-16, TCP a 16-bit ones' complement sum. | slides.txt slide 20 | detail |
| S02-C76 | SS7 addresses by point code, SSN and global title. It is connectionless, with SCCP class 2 or 3 when a connection is needed. TCP uses IP plus port and a 3-way handshake. | slides.txt slide 20 | detail |
| S02-C77 | Congestion control: SS7 works hop by hop with MTP3 transfer-controlled. TCP works end to end: Reno, CUBIC, BBR. | slides.txt slide 20 | core |
| S02-C78 | Max payload: 272 octets of SIF against about 1460 B for TCP. The slide adds "64 KB with window scaling". | slides.txt slide 20 | detail |
| S02-C79 | Security: SS7 has none and trusts by point code. TCP has none natively, and TLS sits above it. | slides.txt slide 20 | core |
| S02-C80 | Both stacks solve the same eleven problems. The only disagreement is which layer is responsible. | slides.txt slide 20 | core |
| S02-C81 | BBR, 2016, stops treating packet loss as the signal for congestion. | slides.txt slide 21 | core |
| S02-C82 | Loss-based TCP fills the buffer until something drops. On a fat, long or lossy link that is exactly wrong. | slides.txt slide 21 | core |
| S02-C83 | Reno and CUBIC grow until a drop, then halve. They need loss to make progress, so they crawl on links that drop for other reasons. | slides.txt slide 21 | core |
| S02-C84 | BBR measures bottleneck bandwidth × round-trip propagation time. It sends at the rate the path carries, with the queue near empty. | slides.txt slide 21 | core |
| S02-C85 | Google reports up to 2,000× throughput on some benchmarks, and much lower latency. | slides.txt slide 21 | detail |
| S02-C86 | The slide links a BBR video (youtu.be/VIX45zMMZG8), the Google Cloud post "TCP BBR comes to GCP", and a 2011 bufferbloat talk (youtu.be/qbIozKVz73g). | slides.txt slide 21 | story |
| S02-C87 | TCP opens with three messages because each direction needs its own sequence number confirmed. | slides.txt slide 23 | core |
| S02-C88 | SYN announces the client ISN. SYN-ACK acks it and announces the server ISN. ACK acks that. The server SYN forces the third leg. | slides.txt slide 23 | core |
| S02-C89 | Example: SYN seq=1000 (MSS 1460, SACK permitted, wscale 7). SYN-ACK seq=5000 ack=1001. ACK seq=1001 ack=5001. Data at seq=1001. | slides.txt slide 23 | core |
| S02-C90 | In SYN RECEIVED the server holds a half-open backlog entry. On the final ACK it reaches ESTABLISHED and `accept()` returns. | slides.txt slide 23 | core |
| S02-C91 | SYN and FIN each consume one sequence number. That is why ack=1001 answers seq=1000 with no payload. The slide gives this reason: otherwise a bare SYN could not be told apart from a retransmission. | slides.txt slide 23 | core |
| S02-C92 | Early stacks counted ISNs predictably. Guess the next ISN and you can inject forged segments blind: the Mitnick attack. | slides.txt slide 23 | core |
| S02-C93 | RFC 6528 makes the ISN a keyed hash of the 4-tuple plus a timer. | slides.txt slide 23 | core |
| S02-C94 | A SYN flood sends SYNs from spoofed addresses and never finishes. Each costs one packet, and the server one half-open entry until timeout. | slides.txt slide 24 | core |
| S02-C95 | The backlog between segment 1 and segment 3 is the target. When it fills, real clients get refused. | slides.txt slide 24 | core |
| S02-C96 | SYN cookies (1996) store nothing. The server hides the connection in its own ISN: a keyed hash of 4-tuple, coarse time and MSS. | slides.txt slide 24 | core |
| S02-C97 | The client ACK carries that number back plus one. The server recomputes, checks, and rebuilds the connection from that packet. | slides.txt slide 24 | core |
| S02-C98 | The cost: 32 bits of ISN, so window scale, SACK and timestamps are mostly lost. So cookies switch on under pressure, not always. | slides.txt slide 24 | core |
| S02-C99 | Closing takes four segments, not three. | slides.txt slide 25 | core |
| S02-C100 | Example: client FIN seq=2000 ack=6000. Server ACK ack=2001. Server FIN seq=6000 ack=2001. Client ACK ack=6001. | slides.txt slide 25 | core |
| S02-C101 | Half-close is a real state, not an error. After the first FIN and its ACK, only the server still sends. | slides.txt slide 25 | core |
| S02-C102 | The active closer goes FIN_WAIT_2, then TIME_WAIT for 2 MSL, then CLOSED. The other side waits in CLOSE_WAIT. | slides.txt slide 25 | core |
| S02-C103 | SYN and ACK can share a segment. The slide says FIN and ACK cannot. | slides.txt slide 25 | core |
| S02-C104 | Sockets stuck in CLOSE_WAIT almost always mean an application that forgot `close()`. Look at your code, not your switch. | slides.txt slide 25 | core |
| S02-C105 | TIME_WAIT causes "address already in use" on a server restart. It is why SO_REUSEADDR exists. | slides.txt slide 25 | core |
| S02-C106 | Every round trip before your first byte is a tax, and everything modern is an attack on it. | slides.txt slide 26 | core |
| S02-C107 | Round trips before application data, as drawn: TCP 1, TCP + TLS 1.2 3, TCP + TLS 1.3 2, TCP Fast Open 1, QUIC 1. | slides.txt slide 26 | core |
| S02-C108 | TCP Fast Open lets a returning client put data in the SYN. QUIC folds transport and crypto setup into one round trip. | slides.txt slide 26 | core |
| S02-C109 | You can buy bandwidth, not round trips. Mumbai to Virginia is about 190 ms, and no money changes the speed of light. | slides.txt slide 26 | core |
| S02-C110 | UDP is TCP with every promise removed. The packets look similar, the handshake is gone, retries are weaker. | slides.txt slide 27 | core |
| S02-C111 | TCP header, 20 B minimum: ports 2+2, seq 4, ack 4, flags 2, window 2, checksum 2, urgent 2, options 0–40 B. | slides.txt slide 27 | core |
| S02-C112 | UDP header, 8 B in all: source port, destination port, length, checksum, 2 B each. Payload up to 65,507 B. | slides.txt slide 27 | core |
| S02-C113 | Zoom, WebRTC, game servers, DNS and real-time streams use UDP. A resent audio frame arrives too late to play, so a drop is correct. | slides.txt slide 27 | core |
| S02-C114 | He liked UDP broadcast for LAN discovery. In practice people hard-coded IPs, and it never became what he expected. | slides.txt slide 27 | story |
| S02-C115 | QUIC rebuilds TCP inside UDP, in userspace. UDP is 8 bytes that the kernel and the middleboxes leave alone. | slides.txt slide 28 | core |
| S02-C116 | HTTP/2 needs a separate TLS handshake on one ordered TCP stream. HTTP/3 runs on QUIC (streams + TLS 1.3, one handshake) on UDP. | slides.txt slide 28 | core |
| S02-C117 | Over TCP one lost packet stalls every HTTP/2 stream. QUIC gives each stream its own sequence space, so only that stream waits. | slides.txt slide 28 | core |
| S02-C118 | TCP lives in the kernel, so a change needs an OS update for the planet. QUIC ships in the browser: a change can go out on Tuesday. | slides.txt slide 28 | core |
| S02-C119 | People still adopt HTTP/2, and HTTP/3 is not QUIC-everywhere. His read: media over QUIC spreads in two to five years. | slides.txt slide 28 | story |
| S02-C120 | SMTP, POP and FTP are text, so you can be the client with telnet. | slides.txt slide 29 | core |
| S02-C121 | The S in SMTP is Simple, never Secure. Both halves of a mail transfer are human-readable ASCII. | slides.txt slide 30 | core |
| S02-C122 | Ports: 25 relay (server to server), 587 submission with STARTTLS (use this), 465 implicit TLS, 110 POP3, 143 IMAP. | slides.txt slide 30, 35 | core |
| S02-C123 | SMTP stayed text because each relay reads, rewrites and adds headers. A header nobody understands breaks nothing. | slides.txt slide 30 | core |
| S02-C124 | MAIL FROM is whatever you type. The base protocol has no authentication at all. | slides.txt slide 30 | core |
| S02-C125 | SPF, DKIM and DMARC are later patches. They ask what SMTP never asked: is this sender allowed to say that? | slides.txt slide 30 | core |
| S02-C126 | Before you write headers, read real ones: Gmail, "Show original". | slides.txt slide 30 | detail |
| S02-C127 | A text protocol cannot carry arbitrary bytes. So images travel as base64 text, at a cost of 33%. | slides.txt slide 31 | core |
| S02-C128 | Base64 takes 3 bytes (24 bits) and regroups them as four 6-bit values. 0x4D 0x61 0x6E becomes TWFu. | slides.txt slide 31 | core |
| S02-C129 | The size on the wire is 4/3, about 33% overhead, always. RFC 2045 limits lines to 76 characters. | slides.txt slide 31 | core |
| S02-C130 | The 64 characters are A–Z, a–z, 0–9, + and /, with = for padding. Every mail system and 7-bit link passes them unchanged. | slides.txt slide 31 | core |
| S02-C131 | multipart/mixed names a boundary. Each part starts with --boundary and carries its own Content-Type. The end is --boundary--. | slides.txt slide 31 | core |
| S02-C132 | Pick a boundary that cannot appear in the body. It is the delimiter idea from the binary protocols of the last session. | slides.txt slide 31 | core |
| S02-C133 | mailpit (`axllent/mailpit`): SMTP on 1025, web UI on 8025. It accepts anything, delivers nothing, and shows each message. | slides.txt slide 32 | detail |
| S02-C134 | greenmail (`docker.io/greenmail/standalone:2.1.12`): SMTP 3025, POP3 3110, user bob, password secret. No container touches the internet. | slides.txt slide 32 | detail |
| S02-C135 | Be the mail client: EHLO, MAIL FROM, RCPT TO, DATA, headers, a blank line, the body, a lone dot, QUIT. | slides.txt slide 33 | core |
| S02-C136 | MAIL FROM and RCPT TO are the envelope and decide delivery. From: and To: inside DATA are text on the letter. Nothing checks a match. | slides.txt slide 33 | core |
| S02-C137 | A line with only "." ends the message. A body line that starts with a dot gets one extra dot. | slides.txt slide 33 | core |
| S02-C138 | A blank line separates headers from body. The slide says: miss it and your subject becomes body text. | slides.txt slide 33 | core |
| S02-C139 | POP is four verbs. STAT: count and bytes. LIST: number and size. RETR n: the whole message. DELE n: mark it, applied at QUIT. | slides.txt slide 34 | core |
| S02-C140 | IMAP is more popular, but POP is easier to understand, so learn POP first. | slides.txt slide 34 | detail |
| S02-C141 | USER and PASS cross the wire in the clear. POP3S on port 995 exists for exactly this reason. | slides.txt slide 34 | core |
| S02-C142 | Send to bob@localhost on 3025, then fetch it on 3110: same bytes, two protocols. | slides.txt slide 34 | detail |
| S02-C143 | POP keeps mail on your device, and the server is a spool to empty. IMAP keeps mail on the server, and the client holds a cache. | slides.txt slide 35 | core |
| S02-C144 | With POP a second device sees nothing, because the first client took the mail. With IMAP it sees the same mailbox and state. | slides.txt slide 35 | core |
| S02-C145 | POP read state is local only. IMAP read state is a server flag: \Seen, \Answered, \Flagged. | slides.txt slide 35 | core |
| S02-C146 | POP has one inbox and local search. IMAP has folders over the wire, SEARCH on the server, and IDLE to push new mail. | slides.txt slide 35 | core |
| S02-C147 | POP RETR returns the whole message with attachments. IMAP `FETCH BODY[1]` returns one MIME part, or only headers. | slides.txt slide 35 | core |
| S02-C148 | The trade: POP puts the state on your machine, IMAP puts it on the server. Everything else follows from that. | slides.txt slide 35 | core |
| S02-C149 | Framing is length or delimiter. SMS chose length, SMTP chose a dot, IMAP chose both. There is no third option. | slides.txt slide 36, 41 | core |
| S02-C150 | Delimiter: SMTP dot, HTTP/1.1 CRLF CRLF, MIME boundary, Redis CRLF. Cheap and streams, but escape it or content becomes protocol. | slides.txt slide 36 | core |
| S02-C151 | Length: SMS TP-UDL, Content-Length, MTP2 LI, Protobuf varint. No escaping, but you must know the size first. Chunked avoids that. | slides.txt slide 36 | core |
| S02-C152 | Both: IMAP literals, HTTP/1.1 headers plus Content-Length, HTTP/2 frames, POP3 dotted bodies. Two parsers let smuggling in. | slides.txt slide 36 | core |
| S02-C153 | FTP refuses to mix commands and data. One connection holds the talk, and a new connection carries each file. | slides.txt slide 37 | core |
| S02-C154 | Active mode, the 1971 design: control to port 21, and the server dials back from port 20. Every NAT and firewall now blocks it. | slides.txt slide 37 | core |
| S02-C155 | Passive mode: the client sends PASV. The server replies 227 with (h,h,h,h,p1,p2), and the client connects to that port. | slides.txt slide 37 | core |
| S02-C156 | In passive mode the client opens both connections, the only shape NAT allows. Passive came later and is now effectively mandatory. | slides.txt slide 37 | core |
| S02-C157 | The demo runs pyftpdlib in `python:3.13-slim`: port 2121, passive range 30000–30009, user scaler, password demo, with debug on. Leave debug on: the server log is the other half of the conversation. | slides.txt slide 38 | detail |
| S02-C158 | `--range` pins passive ports to a small range that the container can publish. Real servers do this to keep the firewall rule finite. | slides.txt slide 38 | core |
| S02-C159 | `--nat-address` sets the address in the 227 reply. Inside a container the server does not know its reachable address. | slides.txt slide 38 | core |
| S02-C160 | Two terminals: control on 2121, data on the 227 port. The listing and the file body appear on the data side. Each transfer needs a new PASV. | slides.txt slide 39 | core |
| S02-C161 | (127,0,0,1,117,48): the first four numbers are the IP. The port is high byte first: 117 × 256 + 48 = 30000. | slides.txt slide 39 | core |
| S02-C162 | The reply is text, so a 16-bit port ships as two 8-bit halves in network byte order: `htons` by hand. He says 1971 clients avoided numbers above 255. | slides.txt slide 39 | core |
| S02-C163 | Reliability has an address. SS7 put it at L2, per hop. TCP put it at L4, end to end. QUIC put it in userspace. All three fit their network. | slides.txt slide 41 | core |
| S02-C164 | Control and data want separating. SS7 split them, SIP keeps media off the proxy, FTP opens a second socket. Same instinct, three eras. | slides.txt slide 41 | core |
| S02-C165 | Forty years of SMTP extensions bolted on cleanly, because STARTTLS, SPF, DKIM and DMARC are "all just headers and verbs". | slides.txt slide 30 | detail |

## 4. Instructor questions

| ID | The question | Model answer outline |
|---|---|---|
| S02-Q01 | Homework 1: draw the UDP packet from memory, capture a real one, and diff. What must an application rebuild with only length and checksum? (slides 27, 40) | Four 2-byte fields: ports, length, checksum. Lab in s02-m06. The app rebuilds order, acks, resends, duplicate checks, pacing, sessions and security. The length keeps datagram edges, so framing per datagram comes free. |
| S02-Q02 | Homework 2: SYN cookies are 1996. Which came first, HTTP cookies, and did either name influence the other? (slides 24, 40) | HTTP cookies came first: Lou Montulli, Netscape, 1994. He took the name from the older "magic cookie". SYN cookies came in September 1996. No source links the two names directly. |
| S02-Q03 | Homework 2, part two: name three places where you push state into a token that the client hands back. (slides 24, 40) | HTTP cookies. JWT bearer tokens (Session 5). TLS session tickets. QUIC address validation tokens. Signed URLs and pagination cursors. Each trades server memory for crypto work and a size limit. |
| S02-Q04 | Homework 3: unpack "Hello World!" by hand. Recover the first three characters, then write the unpacker. (slide 40) | Write each octet as bits. Take the low 7 bits of octet 1: 0x48 = H. Join the leftover bit with 6 bits of octet 2: 0x65 = e. Then 0x6C = l. The unpacker is ungraded homework. The lesson gives the rule, not the code. |
| S02-Q05 | Homework 4: run Asterisk, place a SIP call, capture it, and play the audio from Telephony → VoIP Calls. (slides 19, 40) | SIP text and RTP audio use different ports. The SDP body names the media port. Anyone on the path can play plain RTP, which is why SRTP exists. Base RTP does not resend a lost frame. |
| S02-Q06 | Why does TCP open with three messages? (derived from the slide 23 title) | Each side picks its own ISN. Each ISN needs an ack. The SYN-ACK carries the ack for the client and the SYN of the server, so two segments merge into one. |
| S02-Q07 | Why does closing take four segments, not three? (derived from the slide 25 title) | Each direction closes on its own. The stack acks the FIN soon, but its own FIN waits for its application to call close. If the app closes before the delayed ACK fires, the ACK and FIN can merge: see section 6. |
| S02-Q08 | Why not CSMA/CD on Wi-Fi? (derived from the slide 8 heading "Why not CSMA/CD") | A radio cannot hear others while it transmits. So it avoids collisions with backoff and uses an ACK to learn that a frame arrived. |
| S02-Q09 | Why is an SMS 140 bytes? (derived from the slide 15 title) | Three limits stack: SIF 272, MAP user data about 200, TP-UD 140. 140 keeps one message in one signalling unit for typical addresses. See s02-m03 for the arithmetic and the exceptions. |
| S02-Q10 | "I said 140 bytes, but you can send 160." How? (slide 16) | GSM-7 uses 7 bits per character. 140 × 8 ÷ 7 = 160. UCS-2 uses 16 bits, so 70. |
| S02-Q11 | Send mail as anyone you like. Why does that work, and what tries to stop it? (slides 30, 33) | You type MAIL FROM and From: yourself. Base SMTP checks neither. SPF, DKIM and DMARC let the receiver check the domain later. |
| S02-Q12 | Send to bob@localhost on 3025 and fetch the message on 3110. (slide 34) | STAT shows 1 message. RETR 1 shows the headers you typed, plus any headers the server added, then the body. The bytes match what DATA carried. |
| S02-Q13 | Decode the 227 reply yourself. (slide 39) | (127,0,0,1,117,48): IP 127.0.0.1, port 117 × 256 + 48 = 30000. |
| S02-Q14 | Your packet goes to space and back. What in the IP header changes? (derived from the slide 9 title) | TTL at each router, so the header checksum changes too. A NAT also rewrites the addresses, and the ports in the TCP or UDP header. ECN or DSCP marks and fragmentation can also change a field, but the slide leaves them out (section 6). |
| S02-Q15 | Sockets pile up in CLOSE_WAIT. Where do you look? (derived from slide 25) | In the application. The peer closed, and the app did not call close. |
| S02-Q16 | Both stacks solve eleven problems. Which layer should own reliability? (derived from slides 20 and 41) | Per hop fits links that one operator owns and engineers to strict loss targets, some of them long or via satellite (SS7). End to end fits many hops owned by others (TCP). Userspace fits when the kernel and middleboxes block change (QUIC). Beyond the slides: the end-to-end argument (section 6). |
| S02-Q17 | Read the headers of a real message in Gmail, "Show original", before you write any. (slide 30) | Received lines stack newest on top, one per relay. Authentication-Results shows SPF, DKIM and DMARC verdicts. |
| S02-Q18 | Graded work link: the Session 5 calculator assignment and the "HTTP, in binary" project. (Session 5 slides 3, 4) | Graded. Not formally given yet. Both rest on closing idea 2, framing, from s02-m09. Concepts and checks only. See s05-m12-assignment-prep and s05-m13-project-studio. No solution. |

## 5. Modules

Teaching order: m01, m02, m03, m10, m04, m05, m06, m11, m07, m08, m09. The file lists modules in ID order.

### s02-m01-layers

- **Title:** Layers: each one ignores the others.
- **Minutes:** 25.
- **Big idea:** Each layer wraps its input in a header and never reads the inside, so nothing above IP notices copper, radio or space.
- **Covers:** S02-C01, S02-C02, S02-C03, S02-C11, S02-C12, S02-C13, S02-C14, S02-C15, S02-C16, S02-C17, S02-C18, S02-C19, S02-C20, S02-C21, S02-C22, S02-C23, S02-C24, S02-C35, S02-C36, S02-C37, S02-C38, S02-C39.
- **Prereqs:** s01-m01-seven-syscalls, s01-m07-see-the-bytes-tls.
- **Threads:** T-encapsulation.

**Pretest.**
1. MTU 1500, IPv4, TCP with no options. How many payload bytes fit? *Answer: 1460.*
2. Can a Wi-Fi radio hear a collision while it transmits? *Answer: no.*
3. A packet crosses a Starlink satellite. Which IP fields change? *Answer: TTL and checksum, plus addresses if a NAT sits on the path.*

**Rung 1, the picture.** You write a letter and seal it in an envelope. The post office puts the envelope in a sack labelled with a city. A truck carries the sack. The driver never opens the envelope. You never learn if a truck or a plane moved it. For Wi-Fi: in a quiet room you hear two people talk at once. With your hands over your ears while you shout, you hear nobody. So you wait, count to a random number, speak, and ask for a nod.
*Where it breaks:* the sack stays the same for the whole trip. A real router throws away the Ethernet frame at each hop and builds a new one. Only the IP packet inside rides the whole way, with a new TTL and checksum. In the shouting room, people can see each other and spot a clash. A radio learns about a collision only when no ACK comes back.

**Rung 2, how it works.**
1. The browser writes `GET / HTTP/1.1` into a socket.
2. TCP adds a 20-byte header with ports and sequence numbers.
3. IP adds a 20-byte header with addresses, TTL and protocol 6.
4. Ethernet adds 14 bytes in front (MACs, EtherType 0x0800) and a 4-byte FCS.
5. Each router strips the frame, reads IP, lowers TTL, fixes the checksum, and builds a new frame for the next link.
6. The receiver peels the layers in reverse, top of the slide to bottom.

**Rung 3, the real thing.** Slide 13 draws the frame with byte widths: 6 + 6 + 2, then 46 to 1500 bytes of payload, then 4 bytes of CRC-32. The budget: 1500 − 20 − 20 = 1460 MSS, and 1500 + 14 + 4 = 1518 bytes on the wire. The IPv4 box on the slide shows 15 of the 20 bytes: it skips DSCP/ECN, identification and fragment fields (section 6). Slide 8 draws the CSMA/CA loop: sense, defer, random backoff, send, wait for ACK, retry. Slide 9 draws the Starlink path.

**Rung 4, exam depth.**
- *What layering buys.* Starlink replaces L1 and L2, and your socket code does not change (S02-C22, S02-C24). The cost is repeated work: Wi-Fi acks each frame at L2, and TCP acks the bytes again at L4 (S02-C20).
- *Detect or avoid.* A wire lets a sender compare what it sends with what it hears, so it can stop early. A radio drowns in its own signal, so it waits a random time and relies on an ACK (S02-C17 to S02-C19). Full-duplex switched Ethernet has no collisions at all, so CSMA/CD no longer runs there (section 6). Wi-Fi acks unicast frames only, not broadcasts (section 6).
- *What if the frame is IPv6?* The IPv6 header is 40 bytes, so 1500 − 40 − 20 = 1440 MSS. The frame stays 1518 (section 6).
- *Where 20 ms goes.* Light needs 1.83 ms to climb 550 km. Up and down twice is a 7.3 ms floor. The slide number of about 20 ms sits well above that floor, and the slide does not say where the rest goes (section 7, item 8).

**Misconceptions.**
- S02-M01: "A router reads the TCP header to forward a packet." Wrong. It reads IP only. TCP is opaque payload to it. Distractor in check 2.
- S02-M02: "Wi-Fi detects collisions like Ethernet." Wrong. A radio cannot listen while it sends. Distractor in check 3.
- S02-M03: "A 1500 MTU means a 1500-byte frame, or a 1500-byte MSS." Wrong. The frame is 1518 and the MSS is 1460. Distractor in checks 1 and 4.
- S02-M04: "A satellite hop rewrites the IP header." Wrong. Only TTL, checksum and any NAT change. Distractor in check 2.
- S02-M40: "A Wi-Fi radio sends and receives at once, so frames never collide." Wrong. A radio cannot hear while it sends, and two stations can start at the same moment. Distractor in check 3.

**Diagrams.**
- Static: the nested frame from slide 13, with byte widths on each field.
- Step-by-step: one packet from laptop to Wi-Fi AP to router. The L2 frame changes on each link. The IP header changes only in TTL and checksum.
- Step-by-step: the CSMA/CA flow chart from slide 8, one decision per step.

**Interactives.**
- *Encapsulation builder.* Inputs: payload text, TCP or UDP, IPv4 or IPv6, TCP option bytes. The learner sees each header with its byte count and the totals, and a warning past the MTU. Discovers 1460, 1448 and 1440 (section 6 for the option and IPv6 sizes). Priority P1.
- *Collision toy.* Inputs: two stations, wire or radio, start times. The learner sees CD abort a frame on a wire and CA back off and wait for an ACK on radio. Discovers why radio needs an ACK per frame. Priority P2.

**Predict, observe, explain.** Command: `ip link show`. Find the `mtu` field on each device. Predict the MTU of `lo` and of your Wi-Fi or Ethernet device. Observe: `lo` shows `mtu 65536`, a normal Ethernet or Wi-Fi device shows `mtu 1500`. Source: the learner machine. Slide 13 gives the 1500. Do not use `ip -br link`: it hides the MTU.

**Worked example.** MTU 1500, IPv4 header 20, TCP header 20. MSS = 1500 − 20 − 20 = 1460. Frame on the wire = 1500 + 14 + 4 = 1518.

**Faded example.** TCP with 12 bytes of timestamp option. Payload = 1500 − 20 − ____ = ____. *(32, 1448.)*

**Your turn.** IPv6 (40-byte header) with TCP (20). MSS? Frame size? *(1440, 1518.)*

**Checks.**
1. `numeric`: MSS for MTU 1500, IPv4, TCP, no options? Answer: 1460. Distractor 1500 (S02-M03). Feedback: subtract both 20-byte headers.
2. `mcq`: what does a router change in each forwarded IPv4 packet? Answer: TTL and checksum. Distractors: the TCP ports (S02-M01), the whole header on a satellite hop (S02-M04). Feedback: the layers above IP stay untouched.
3. `mcq`: why does Wi-Fi use CSMA/CA? Answer: a radio cannot listen while it transmits. Distractors: it detects collisions with the FCS (S02-M02), a radio sends and receives at once, so frames never collide (S02-M40). Feedback: the FCS finds damage after the fact, and two stations can start to send at the same moment.
4. `numeric`: bytes on the wire for a full 1500-byte IP packet in Ethernet II? Answer: 1518. Distractor 1500 (S02-M03). Feedback: 14 header plus 4 FCS.
5. `order`: the layers of "GET /" from outside to inside. Answer: Ethernet, IP, TCP, HTTP.

**Review cards.**
- Q: EtherType for IPv4? A: 0x0800.
- Q: IPv4 protocol number for TCP? A: 6.
- Q: MSS on a 1500 MTU with IPv4 and TCP? A: 1460.
- Q: Why must Wi-Fi ack each frame? A: a radio cannot hear a collision.
- Q: Which IP fields change at each router? A: TTL and checksum.
- Q: Which OSI layer is Starlink? A: the physical layer.

**Lab.** Build a loopback copy of the slide 4 server. The original binds every interface, so change one line.

```sh
REPO="$HOME/Codes/Network Architecture"
mkdir -p /tmp/s02-lab && cd /tmp/s02-lab
sed 's/INADDR_ANY;/htonl(INADDR_LOOPBACK);/' \
  "$REPO/sources/cn-at-scaler/lesson1/01_echo_server.c" > echo.c
gcc -o echo echo.c && ./echo &
ss -tlnp | grep 2026            # expect 127.0.0.1:2026
sudo tcpdump -i lo -nn -e -X -c 6 'tcp port 2026'   # terminal 2
printf 'hello' | nc 127.0.0.1 2026                   # terminal 3
```

Look at the first data line. Expected: `ethertype IPv4 (0x0800)`, then the IP header, then the TCP header, then `hello`. Stop the server with `kill %1` in terminal 1.

### s02-m02-ss7

- **Title:** SS7: a second network for control.
- **Minutes:** 20.
- **Big idea:** The phone network moved call control off the voice path onto its own packet network, and that network trusts every neighbour.
- **Covers:** S02-C25, S02-C26, S02-C27, S02-C28, S02-C29, S02-C30, S02-C31, S02-C32, S02-C33, S02-C34, S02-C44, S02-C62, S02-C63, S02-C64, S02-C65, S02-C66, S02-C67, S02-C68, S02-C69, S02-C70, S02-C71, S02-C79, S02-C164.
- **Prereqs:** s02-m01-layers.
- **Threads:** T-encapsulation.
- **Note:** slide 20 and closing idea 3 moved to s02-m11-reliability-address. See section 7, item 1.

**Pretest.**
1. On an old trunk, what did a 2600 Hz tone mean? *Answer: the trunk is idle.*
2. During a call, does SS7 carry the voice? *Answer: no. The bearer circuit does.*

**Rung 1, the picture.** A theatre show. The actors speak on stage: the voice. The crew gets cues: the signalling. In the old theatre the crew heard cues from the stage. Anyone in the audience who shouted "lights out" turned the lights out. That is the blue box. The new theatre gives the crew a private headset line.
*Where it breaks:* the headset line trusts anyone who plugs in. SS7 links hundreds of operators, and it trusts any point code on the line.

**Rung 2, how it works (a 2G call, then a 5G call).**
1. Phone A dials. Switch A sends ISUP IAM with the number to switch B.
2. Switch B rings phone B and sends ACM. A hears ringback.
3. B answers. Switch B sends ANM. The voice circuit cuts through.
4. Voice flows on a 64 kbps circuit. SS7 stays silent.
5. A hangs up. REL goes out, RLC comes back, the circuit is free.
6. In 5G, SIP INVITE, 180 Ringing, 200 OK and ACK do steps 1 to 3 as text over IP. RTP carries the voice on its own path over UDP.

**Rung 3, the real thing.** Slide 12 maps the SS7 stack. MTP1 at L1. MTP2 at L2 with FSN, BSN and CRC-16. MTP3 at L3 with point codes. SCCP with global titles. TCAP with ASN.1 BER. MAP or ISUP on top. The SIO octet names the user: 0x83 means SCCP on a national network (section 6). Slide 14 shows a TCAP `BEGIN` with OTID 0x00000001 (S02-C44). Slide 18 draws the ISUP ladder and slide 19 the SIP ladder.

**Rung 4, exam depth.**
- *The transaction ID.* Many TCAP dialogues share one signalling link. A `BEGIN` carries an originating transaction ID (OTID). The `END` returns that value as the destination transaction ID (DTID), so the switch matches the answer to its request. A `CONTINUE` carries both IDs (section 6). Session 5 lists this ID next to TCP ports and HTTP/2 stream IDs: identity makes multiplexing possible.
- *Trust by point code.* SS7 has no sender authentication (S02-C79). Any operator with access can ask where a phone is or reroute its SMS. ENISA lists location tracking and SMS interception (section 6).
- *Control and data apart.* Out-of-band signalling killed the blue box (S02-C26, S02-C29). SIP keeps media off the proxy (S02-C69). FTP opens a second socket (S02-C164). Same instinct, three eras.
- *Careful with the slide shortcuts.* SIP reuses and extends the HTTP codes, but 180 Ringing exists only in SIP. A stateful proxy never forwards 100 Trying. The ACK skips a proxy only if the proxy did not ask to stay on the route. ITU-T places SCCP in the network layer, not beside TCP at L4 (section 6).

**Misconceptions.**
- S02-M05: "SS7 checks who sent a message." Wrong. It trusts the point code. Distractor in check 2.
- S02-M06: "SS7 carries the voice during a call." Wrong. A bearer circuit does, and SS7 stays idle. Distractor in check 1.
- S02-M08: "SS7 is one protocol at one layer, like TCP or IP." Wrong. It is a whole stack. Distractors in check 4.
- S02-M41: "After SS7, voice and control tones still share one channel." Wrong. The bearer carries only voice, and control rides a separate network. Distractor in check 1.
- S02-M42: "SS7 accepts messages only from inside one operator." Wrong. SS7 links hundreds of operators and trusts any point code on the link. Distractor in check 2.
- S02-M43: "HTTP has no status code 100." Wrong. HTTP/1.1 defines 100 Continue, and SIP reuses the number as 100 Trying. Distractor in check 5.
- S02-M44: "SIP took every status code from HTTP unchanged." Wrong. SIP extends the HTTP codes, and 180 Ringing exists only in SIP. Slide 19 says "wholesale", so this item is beyond the slides. Distractor in check 5.

**Diagrams.**
- Static: before and after, one voice channel with tones against two networks (slide 11).
- Step-by-step: the ISUP ladder, one message per step (slide 18).
- Step-by-step: the SIP ladder, with the RTP path drawn apart (slide 19).
- Static: the two stacks side by side, layer rows aligned (slide 12).

**Interactives.**
- *Call ladder stepper.* Inputs: 2G ISUP or 5G SIP, hang up early or not. The learner steps through each message and sees the signalling path and the media path light up apart. Discovers that control and voice never share a path. Priority P1.
- *Blue box toy.* Inputs: in-band or out-of-band, play a 2600 Hz tone. In-band the tone seizes the trunk. Out-of-band it does nothing. Priority P2.

**Predict, observe, explain.** No instructor command exists. Predict from the slide 18 ladder: how many SS7 messages flow in a 10-minute conversation? Observe: zero, between ANM and REL. Source: slide 18. Homework 4 (S02-Q05) gives a real SIP capture to check the 5G version.

**Worked example.** Decode SIO 0x83. Binary 1000 0011. Low 4 bits 0011 = 3 = SCCP. The top two bits 10 = national network. So: SCCP, national.

**Faded example.** Decode SIO 0x85. Low 4 bits = ____ = ____. Top bits 10 = ____. *(0101, 5 = ISUP, national.)*

**Your turn.** Decode SIO 0x03. *(Low 4 bits 0011 = 3 = SCCP. Top two bits 00 = international network.)*

**Checks.**
1. `mcq`: during a call, what carries the voice? Answer: a 64 kbps bearer circuit. Distractors: SS7 signal units (S02-M06), one channel that carries the voice and the control tones together (S02-M41). Feedback: SS7 works at the edges only, on its own network.
2. `mcq`: how does SS7 decide to trust a message? Answer: by point code, with no authentication. Distractors: it checks a signature (S02-M05), it accepts messages only from its own operator (S02-M42). Feedback: the trust model is the weak spot.
3. `order`: ISUP messages for one call. Answer: IAM, ACM, ANM, REL, RLC.
4. `mcq`: the fair comparison for SS7 is? Answer: the whole TCP/IP stack. Distractors: TCP alone (S02-M08), IP alone (S02-M08). Feedback: compare stack to stack.
5. `mcq`, beyond the slides: slide 19 names 100, 180 and 200 as HTTP codes. Which one does HTTP/1.1 not define? Answer: 180. Distractors: 100 (S02-M43), none, because SIP took all three unchanged (S02-M44). Feedback: HTTP has 100 Continue and 200 OK. 180 Ringing is SIP only.

**Review cards.**
- Q: The one big idea of SS7? A: signalling out of the voice channel.
- Q: ISUP message that cuts the voice path through? A: ANM.
- Q: SS7 trust model? A: trust by point code.
- Q: In 5G, what carries call setup? A: SIP in IMS.
- Q: A TCAP `END` carries which transaction ID? A: the DTID, equal to the OTID of the `BEGIN`.

### s02-m03-sms-bytes

- **Title:** SMS bytes: 140 octets, 160 characters.
- **Minutes:** 22.
- **Big idea:** An SMS is sized to fit one signalling unit, and 7-bit packing puts 160 characters into its 140 octets.
- **Covers:** S02-C40, S02-C41, S02-C42, S02-C43, S02-C44, S02-C45, S02-C46, S02-C47, S02-C48, S02-C49, S02-C50, S02-C51, S02-C52, S02-C53, S02-C54, S02-C55.
- **Prereqs:** s02-m01-layers, s02-m02-ss7, s01-m09-encodings.
- **Threads:** T-encapsulation, T-alphabets, T-framing.

**Pretest.**
1. How many octets of user data does one SMS hold? *Answer: 140.*
2. How many GSM 7-bit characters fit? *Answer: 160.*
3. The text holds one Hindi letter, so it must use UCS-2. How many characters fit now? *Answer: 70.*

**Rung 1, the picture.** A locker holds 272 units. The rules say a bag may hold 200. The suitcase is 140, so the suitcase and its labels usually fit in one locker. Packing is a trick with shirts: each shirt takes 7 slots, not 8, so you fit 160 shirts where 140 would fit before.
*Where it breaks:* with very long labels (addresses) the bag can overflow, and the network then sends the labels and the suitcase in two trips (TS 29.002 Annex C.2.1). A real shirt folds to any size. A GSM character is exactly 7 bits, and a few characters such as `{` or `€` need an escape and cost 14.

**Rung 2, how it works (packing).**
1. Look up the 7-bit code of each character.
2. Put the bits of character 1 at the low end of a bit stream.
3. Put character 2 just above it, then character 3, and so on.
4. Cut the stream every 8 bits, low bits first. Each cut is one octet.
5. Fill the last octet with zero bits.

**Rung 3, the real thing.** Slide 14 peels the onion: MTP2, then MTP3 with SIO 0x83, then SCCP UDT, then TCAP `BEGIN`, then the MAP invoke with opCode 46, then the SMS-SUBMIT TPDU, then 11 octets of user data. The TS 23.040 field layout gives 25 octets for the TPDU, and a BER count gives 47 for the MAP argument, as on the slide. The TPDU has fixed fields, not BER tags, and MAP carries it as an opaque octet string (section 6). TP-UDL is 0x0C = 12, which counts septets, not octets. The packer test vector: "Hello World!" → `C8 32 9B FD 06 5D DF 72 36 39 04`.

**Rung 4, exam depth.**
- *Three limits (S02-C50).* ITU-T Q.703 caps the SIF at 272 octets, while slide 14 (top line) and slide 36 say 273. SIO plus SIF would make 273 (section 6). MAP caps opaque user data at 200. TP-UD is 140.
- *Does 140 really fit?* Start from the slide sizes: SCCP 129 plus a 4-octet routing label = 133. Grow the user data from 11 to 140 octets: +129. Five ASN.1 length fields pass 127 and grow by one octet each: +5. SIF = 133 + 134 = 267, under 272. With the longest phone numbers it can pass 272. For that case, TS 29.002 splits the dialogue from the message (section 6). So "always fits" holds for normal sizes, not for every size.
- *Length, not delimiter.* TP-UDL states the length (S02-C149). A binary body can hold any value, so a delimiter would need escaping.
- *Long texts.* A concatenated SMS spends 6 octets on a header, so each part holds 153 GSM-7 or 67 UCS-2 characters (section 6).
- *Emoji.* UCS-2 covers only U+0000 to U+FFFF. Most emoji sit above that range and take two 16-bit units, so one emoji leaves room for 69 characters (section 6).

**Misconceptions.**
- S02-M09: "An SMS holds 140 characters." Wrong. It holds 140 octets: 160 GSM-7 or 70 UCS-2 characters. Distractor in checks 1 and 3.
- S02-M10: "Packing drops the top bit of each byte in place." Wrong. The bits flow across byte edges. Distractor in check 4.
- S02-M11: "An emoji costs one character of 160." Wrong. It switches the whole message to UCS-2. Distractor in check 3.
- S02-M12: "The SMS limit is a lower-layer cap: the 272-octet SIF or the 200-octet MAP field." Wrong. Headers use part of those, and TP-UD is 140. Distractors in check 5.

**Diagrams.**
- Static: the slide 14 onion with octet counts beside each layer.
- Step-by-step: a bit grid that packs "Hi", one character per step.
- Static: three bars at 272, 200 and 140 octets.

**Interactives.**
- *GSM-7 packer.* Inputs: text, alphabet (auto, GSM-7, UCS-2). The learner sees septets, the bit stream, the octets, the padding, and the switch to UCS-2 on a non-GSM character. A character above U+FFFF counts as two 16-bit units. Discovers 160 and 70. A pure function with test vector S02-C48. Priority P1.
- *SS7 onion sizer.* Inputs: user data length, address digits. The learner sees each layer size and the SIF total against 272. Priority P2.

**Predict, observe, explain.** In the packer, type "Hello World!". Predict the octet count before you press pack. Observe: 11. Source: slide 14 bytes and the packer test vector.

**Worked example.** Pack "Hi". H = 0x48 = 1001000. i = 0x69 = 1101001. Octet 1: the 7 bits of H, plus the lowest bit of i (1) on top: 1100 1000 = 0xC8. Octet 2: the other 6 bits of i (110100) with zeros on top: 0011 0100 = 0x34. Result `C8 34`: 14 bits in 2 octets, 2 padding bits.

**Faded example.** Pack "abc". a = 1100001, b = 1100010, c = 1100011. Octet 1 = 0x61. Octet 2 = 0xF1. Octet 3 = ____. *(0x18.)*

**Your turn.** Homework 3: take `C8 32 9B` and recover the first three characters by hand. *(H, e, l.)*

**Checks.**
1. `numeric`: 160 GSM-7 characters need how many octets? Answer: 140. Distractor 160 (S02-M09). Feedback: 160 × 7 ÷ 8.
2. `numeric`: 12 GSM-7 characters need how many octets? Answer: 11. Feedback: 84 bits round up to 88.
3. `mcq`: an SMS holds Hindi letters, so it uses UCS-2. Max characters? Answer: 70. Distractors: 159 (S02-M11), 140, one per octet (S02-M09). Feedback: UCS-2 uses 16 bits per character, and one such character moves the whole text to 16 bits.
4. `bytes`: which octets pack "Hi"? Answer: `C8 34`. Distractor: `48 69` (S02-M10). Feedback: the bits cross the byte edge.
5. `mcq`: which limit sets the SMS size? Answer: TP-UD, 140 octets. Distractors: SIF, 272 (S02-M12), the MAP field, about 200 (S02-M12). Feedback: the smallest limit wins.

**Review cards.**
- Q: SMS user data size in octets? A: 140.
- Q: GSM-7 characters per SMS? A: 160.
- Q: UCS-2 characters per SMS? A: 70.
- Q: Max SIF per Q.703? A: 272 octets.
- Q: What does TP-UDL count for GSM-7? A: septets.
- Q: "Hello World!" in GSM-7: characters, bits, octets? A: 12, 84, 11.

### s02-m04-tcp-lifecycle

- **Title:** TCP open and close: three in, four out.
- **Minutes:** 25.
- **Big idea:** TCP needs three segments to open and four to close, and SYN floods and stuck sockets live in the states between.
- **Covers:** S02-C05, S02-C08, S02-C09, S02-C10, S02-C87, S02-C88, S02-C89, S02-C90, S02-C91, S02-C92, S02-C93, S02-C94, S02-C95, S02-C96, S02-C97, S02-C98, S02-C99, S02-C100, S02-C101, S02-C102, S02-C103, S02-C104, S02-C105.
- **Prereqs:** s01-m01-seven-syscalls, s01-m02-ports-and-queue, s01-m03-signals-sigpipe, s01-m04-clients, s02-m01-layers.
- **Threads:** T-where-state-goes.
- **Note:** S02-C05, S02-C08, S02-C09 and S02-C10 are Session 1 content (slides 4, 5). This module only links back to them. See section 7, item 22.

**Pretest.**
1. The client SYN has seq=1000. What ack does the SYN-ACK carry? *Answer: 1001.*
2. Which side waits in TIME_WAIT: the one that closes first or second? *Answer: the one that closes first.*
3. A SYN arrives, and the final ACK never comes. What does the server hold until a timeout? *Answer: a half-open entry.*

**Rung 1, the picture.** Two friends share a notebook. "I start my notes at page 1000." "Got it, next I expect 1001. I start at page 5000." "Got it, next I expect 5001." To stop: "I have nothing more to say." "OK." The friend keeps talking. Then: "Now I stop too." "OK." A SYN cookie is a coat check with no shelf list. The ticket itself holds your coat details in a secret code.
*Where it breaks:* page numbers count pages. TCP numbers count bytes, and a SYN or a FIN takes one number with no byte. A coat check still keeps coats. A server with SYN cookies keeps nothing at all until the final ACK arrives.

**Rung 2, how it works.**
1. `connect()` sends SYN with the client ISN (Session 1, s01-m04).
2. The server answers SYN-ACK: ack = client ISN + 1, plus its own ISN.
3. The client sends ACK = server ISN + 1. `accept()` can now return.
4. To close, one side sends FIN. The peer acks it, usually after a short delayed-ACK timer.
5. The peer may still send data. Its FIN waits for its own `close()`.
6. The first closer acks that FIN and waits 2 MSL in TIME_WAIT.

**Rung 3, the real thing.** Slide 23 gives the numbers: SYN seq=1000, SYN-ACK seq=5000 ack=1001, ACK seq=1001 ack=5001. RFC 9293 §3.4 puts SYN and FIN in sequence space so the peer can ack each one without confusion. Slide 25 gives the close: FIN seq=2000, ACK 2001, FIN seq=6000, ACK 6001. The Bernstein cookie layout: top 5 bits = time counter mod 32. Next 3 bits = MSS index. Low 24 bits = a secret hash of addresses, ports and time (section 6). Session 1 owns the abortive close: `SO_LINGER {1, 0}` sends RST and skips this ladder (s01-m03-signals-sigpipe).

**Rung 4, exam depth.**
- *Why not two segments?* The server ISN needs an ack too. Without the third segment the server cannot tell a live client from an old duplicate SYN.
- *The backlog is the target.* Between segment 1 and segment 3 the server holds state (S02-C95). Cookies move that state into the ISN, so the client carries it (S02-C96). The price: 32 bits hold no room for window scale or SACK (S02-C98). Some stacks hide window scale and SACK bits in the timestamp option (section 6).
- *Two queues, one word.* The accept queue holds finished handshakes that wait for `accept()`, and `listen()` sets its depth (s01-m02). The SYN queue holds half-open entries between segment 1 and segment 3. A SYN flood fills the SYN queue, because the attacker never sends segment 3. Slide 4 uses "backlog" for the first queue, and slides 23 and 24 use it for the second. Current Linux sends SYN cookies when the half-open entries pass the `listen()` backlog, so the slide 24 link back to `listen(fd, 1)` holds (section 6).
- *FIN and ACK together.* The slide says they cannot share a segment. They can, when the peer application closes before the delayed ACK fires. Four is the general case, not a rule (section 6).
- *TIME_WAIT length.* RFC 9293 sets MSL to 2 minutes, so 4 minutes. Linux uses 60 s. It sits on the first closer, which can be the server (S02-C105).
- *RST against FIN.* RST drops unsent data and skips TIME_WAIT (S02-C10, a recall link to Session 1). It is a fire exit, not a door.

**Misconceptions.**
- S02-M13: "The backlog caps the number of clients." Wrong. It caps the queue of finished handshakes that wait for `accept()`, as S01-M06 says. Distractor in check 2.
- S02-M14: "A SYN has no payload, so it uses no sequence number." Wrong. It uses one. Distractor in check 1.
- S02-M15: "SYN cookies keep a small table of half-open entries." Wrong. They keep nothing. Distractors in check 3.
- S02-M16: "TIME_WAIT always sits on the client." Wrong. It sits on whichever side closes first. Distractor in check 4.
- S02-M17: "Many CLOSE_WAIT sockets mean a network fault." Wrong. The app did not call close. Distractor in check 5.
- S02-M18: "`SO_LINGER {1, 0}` is a fast graceful close." Wrong. It sends RST and drops unsent data (Session 1, s01-m03). Distractor in check 6.
- S02-M45: "A SYN flood fills the accept queue." Wrong. The attacker never sends segment 3, so no handshake finishes. The half-open entries fill up. Distractor in check 2.
- S02-M46: "Both sides wait in TIME_WAIT." Wrong. The passive closer goes from CLOSE_WAIT to LAST_ACK to CLOSED (RFC 9293 §3.3.2). Distractor in check 4.
- S02-M47: "CLOSE_WAIT means the peer has not closed yet." Wrong. CLOSE_WAIT starts when the peer FIN arrives, and the local app has not closed. Distractor in check 5.
- S02-M48: "One FIN closes both directions." Wrong. After one FIN and its ACK, the other side can still send: a half-close. Distractor in check 6.

**Diagrams.**
- Step-by-step: the open ladder with states on both sides (slide 23).
- Step-by-step: the close ladder with FIN_WAIT_2, CLOSE_WAIT, TIME_WAIT (slide 25).
- Static: the 32-bit cookie layout, 5 + 3 + 24 bits.

**Interactives.**
- *TCP open and close stepper with SYN cookies.* Inputs: client ISN, server ISN or cookie mode (time counter, MSS index, 24-bit hash), who closes first. The learner sees flags, seq and ack of each segment and both state machines. In cookie mode the ISN builds from its bits and decodes from the ACK. Discovers ack = seq + 1 for SYN and FIN, and where TIME_WAIT lands. Pure function, test vector in the worked example. Priority P1.
- *SYN flood backlog toy.* Inputs: backlog size, SYN rate, cookies on or off. The learner sees real clients refused, then accepted with cookies. Priority P2.

**Predict, observe, explain.** Use the loopback server from the s02-m01 lab. Run `(printf 'hello'; sleep 1) | nc 127.0.0.1 2026`, then `ss -tan state time-wait '( sport = :2026 or dport = :2026 )'`. Predict: does the TIME_WAIT line show local port 2026 or a client port? Observe: local 127.0.0.1:2026, because the server closes first. With `printf 'hello' | nc 127.0.0.1 2026` the client closes first, so the client port holds it. Measured on the repo machine, Linux 7.1.8, loopback, 2026-09-13. No instructor capture exists.

**Worked example.** Client ISN 1000. SYN-ACK: seq=5000, ack=1001. ACK: seq=1001, ack=5001. Cookie: time counter 17, MSS index 3, hash 0xABCDEF. Cookie = (17 << 27) | (3 << 24) | 0xABCDEF = 0x8BABCDEF. Server ISN = client ISN + cookie = 0x8BABD1D7. The client ACK carries ack = 0x8BABD1D8. The server subtracts 1 and the client ISN and gets 0x8BABCDEF back: 17, 3, 0xABCDEF.

**Faded example.** Client ISN 7000 (0x1B58). Cookie: time 5, MSS index 1, hash 0x123456, so cookie = (5 << 27) | (1 << 24) | 0x123456 = 0x29123456. Server ISN = client ISN + cookie = 0x____. Client ACK ack = 0x____. *(0x29124FAE. 0x29124FAF.)*

**Your turn.** Client FIN seq=4000 ack=9000, and the server sends no more data. Server ACK ack = ? Server FIN seq = ?, ack = ? Last ACK ack = ? *(4001. 9000, 4001. 9001.)*

**Checks.**
1. `numeric`: SYN seq=1000. The SYN-ACK ack? Answer: 1001. Distractor 1000 (S02-M14). Feedback: the SYN consumes one number.
2. `mcq`: a SYN flood fills which queue? Answer: the half-open entries between segment 1 and segment 3. Distractors: the connection limit that `listen()` sets (S02-M13), the accept queue of finished handshakes (S02-M45). Feedback: no attacker handshake ever finishes.
3. `mcq`: under SYN cookies, where does half-open state live? Answer: inside the server ISN that the client echoes. Distractors: in a small table (S02-M15), in a copy of each SYN kept until the ACK (S02-M15). Feedback: the server stores nothing.
4. `mcq`: the server closes first. Who holds TIME_WAIT? Answer: the server. Distractors: the client, always (S02-M16), both sides (S02-M46). Feedback: only the first closer waits.
5. `mcq`: 5,000 sockets sit in CLOSE_WAIT, and ops blames the switch. Where is the fault? Answer: the app never calls close(). Distractors: the switch drops FIN segments (S02-M17), the peer has not closed yet (S02-M47). Feedback: CLOSE_WAIT means the peer FIN arrived and the local app did not close.
6. `mcq`: the client sent FIN, and the server still owes data. What does the server do after it sends that data? Answer: call close(), which sends its FIN. Distractors: set `SO_LINGER {1, 0}` and close, for a faster clean close (S02-M18), nothing, because the client FIN closed both directions (S02-M48). Feedback: a half-close is a real state, and linger 0 sends RST.

**Review cards.**
- Q: Why three segments to open? A: each ISN needs an ack.
- Q: SYN seq=1000, SYN-ACK ack? A: 1001.
- Q: Who holds TIME_WAIT? A: the side that closes first.
- Q: Stuck CLOSE_WAIT means? A: the app forgot close().
- Q: SYN cookie bit layout? A: 5 time, 3 MSS, 24 hash.
- Q: Why cookies only under pressure? A: they lose TCP options.

**Lab.** Use the loopback server from s02-m01. Terminal 2 shows the flags. Job control works only in the shell that started the job, so `kill %1` runs in terminal 1.

```sh
cd /tmp/s02-lab && ./echo &                        # terminal 1
sudo tcpdump -i lo -nn 'tcp port 2026'             # terminal 2
(printf 'hello'; sleep 1) | nc 127.0.0.1 2026      # terminal 3
ss -tan state time-wait '( sport = :2026 )'        # terminal 3
kill %1                                            # terminal 1
ss -tlnp | grep 2026                               # terminal 3: expect no LISTEN line
python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 2026))'   # terminal 3
```

Look at the flags in order: `[S]`, `[S.]`, `[.]`, `[P.]`, then the server `[F.]` first. Expected: TIME_WAIT on 127.0.0.1:2026, no LISTEN line after the kill, and the bind fails with `Errno 98 Address already in use` for about 60 s. Run the bind again after a minute: it works. The s01-m02 lab shows the same restart trap from the code side.

### s02-m05-congestion-bbr

- **Title:** BBR: measure the pipe, do not overflow it.
- **Minutes:** 15.
- **Big idea:** Loss-based TCP overflows the path to learn it, while BBR measures the bottleneck and sends at that rate.
- **Covers:** S02-C81, S02-C82, S02-C83, S02-C84, S02-C85, S02-C86.
- **Prereqs:** s02-m04-tcp-lifecycle.
- **Threads:** T-honest-benchmarks, T-fix-causes-next.

**Pretest.**
1. What event does Reno read as congestion? *Answer: a lost packet.*
2. Which two numbers does BBR estimate? *Answer: bottleneck bandwidth and round-trip propagation time.*
3. A link drops 1% of packets at random. Which does better, CUBIC or BBR? *Answer: BBR.*

**Rung 1, the picture.** Loss-based TCP fills a bathtub until water spills on the floor, then pours half out and starts again. BBR watches how fast the drain empties and pours at exactly that speed.
*Where it breaks:* a drain has one fixed speed. A network bottleneck changes, so BBR must probe now and then to check for more room.

**Rung 2, how it works.**
1. Reno and CUBIC grow the window every round trip.
2. The bottleneck queue fills, and the RTT grows.
3. A packet drops. The sender cuts the window. The sawtooth repeats.
4. BBR keeps the lowest RTT seen over tens of seconds: RTprop.
5. BBR keeps the highest delivery rate seen over 6 to 10 RTTs: BtlBw.
6. BBR paces at BtlBw and keeps about BtlBw × RTprop bytes in flight.

**Rung 3, the real thing.** Cardwell et al., ACM Queue 2016, define both estimates and the bandwidth-delay product, BDP = BtlBw × RTprop (section 6). On Linux, `sysctl net.ipv4.tcp_congestion_control` shows the algorithm, and `ss -ti` shows `cwnd` and `rtt` for each socket.

**Rung 4, exam depth.**
- *Loss is a poor signal.* Wi-Fi and satellite links drop packets for reasons other than a full queue (s02-m01). Loss-based TCP then shrinks for nothing (S02-C83).
- *Deep buffers hurt.* A large buffer delays the drop, so the queue grows and the RTT grows with it: bufferbloat (S02-C86, section 6).
- *Numbers keep conditions.* The slide says "up to 2,000×". The Google Cloud post says 2,700×: CUBIC 3.3 Mbps against BBR 9,100 Mbps on 10 GbE, 100 ms RTT, 1% loss. On the B4 WAN, the paper reports 2 to 25× (section 6).
- *Correction.* CUBIC cuts its window to 0.7, not to half. Reno halves (section 6).

**Misconceptions.**
- S02-M19: "A lost packet always means congestion." Wrong. Radio noise also drops packets. Distractor in check 1.
- S02-M20: "A bigger router buffer always makes TCP faster." Wrong. It adds queue delay. Distractor in check 4.
- S02-M21: "BBR sends as fast as it can." Wrong. It paces at the measured bottleneck rate. Distractor in check 2.
- S02-M49: "Loss-based TCP can tell radio-noise loss from queue loss." Wrong. It sees only a missing packet, so it slows down for both. Distractor in check 1.
- S02-M50: "BBR still halves its rate on each loss, like Reno." Wrong. BBR stops treating loss as the congestion signal (S02-C81). Distractor in check 2.
- S02-M51: "Only distance sets the RTT, so a queue adds no delay." Wrong. Time in a full queue adds to the propagation delay. Distractor in check 4.

**Diagrams.**
- Static: a sawtooth window against a flat paced rate, same time axis.
- Static: delivery rate and RTT against data in flight, with the BtlBw and RTprop limits drawn as lines.

**Interactives.**
- *Sawtooth against pacing.* Inputs: bottleneck rate, buffer size, random loss percent, algorithm. The learner sees throughput and RTT over time. Discovers that random loss flattens the sawtooth, and that big buffers raise RTT. Priority P2. Build it only after a model spec with test vectors exists: Reno from RFC 5681, CUBIC from RFC 9438, BBR from Cardwell et al. Until then, the two static diagrams carry the idea.

**Predict, observe, explain.** Command: `sysctl net.ipv4.tcp_congestion_control`. Predict the default. Observe on the repo machine: `cubic`, and the available list is `reno cubic` (Fedora, Linux 7.1.8, 2026-09-13). Source: the learner machine.

**Worked example.** BtlBw 100 Mbps, RTprop 40 ms. BDP = 100,000,000 × 0.04 = 4,000,000 bits = 500,000 bytes. That is about 333 full 1500-byte packets in flight.

**Faded example.** 10 Gbps and 100 ms. BDP = ____ bits = ____ MB. *(1 Gbit, 125 MB.)*

**Your turn.** Check the Google number: 9,100 Mbps ÷ 3.3 Mbps ≈ ? *(About 2,758, so "2,700×".)*

**Checks.**
1. `mcq`: a link loses 1% of packets to radio noise, and the router queue is empty. What is true? Answer: the path is not congested, but CUBIC still cuts its window at each loss. Distractors: the path is congested, because packets were lost (S02-M19), CUBIC sees that the loss is noise and keeps its window (S02-M49). Feedback: loss-based TCP cannot tell why a packet went missing.
2. `mcq`: BBR sends at what rate? Answer: the measured bottleneck bandwidth. Distractors: as fast as the NIC allows (S02-M21), half its rate after each loss (S02-M50). Feedback: BBR paces at BtlBw.
3. `numeric`: BDP in bytes for 100 Mbps and 40 ms? Answer: 500,000.
4. `mcq`: an ISP doubles the router buffer on a busy link where CUBIC runs. What happens to the RTT? Answer: it rises, because CUBIC fills the bigger queue before the first drop. Distractors: it falls, because fewer packets drop (S02-M20), it stays the same, because only distance sets the RTT (S02-M51). Feedback: queue delay adds to propagation delay.

**Review cards.**
- Q: The two BBR estimates? A: BtlBw and RTprop.
- Q: BDP formula? A: BtlBw × RTprop.
- Q: CUBIC decrease factor? A: 0.7.
- Q: The 2011 name for full-buffer delay? A: bufferbloat.

**Lab.** Read-only. Run `sysctl net.ipv4.tcp_available_congestion_control`, then open any TCP connection and run `ss -ti`. Look for the algorithm name, `cwnd` and `rtt`. Expected: `cubic` unless you changed it.

### s02-m06-udp-quic

- **Title:** UDP and QUIC: no promises, then rebuilt promises.
- **Minutes:** 22.
- **Big idea:** UDP gives only ports, a length and a checksum, and QUIC builds reliable streams on it in userspace.
- **Covers:** S02-C106, S02-C107, S02-C108, S02-C109, S02-C110, S02-C111, S02-C112, S02-C113, S02-C114, S02-C115, S02-C116, S02-C117, S02-C118, S02-C119, S02-C163.
- **Prereqs:** s02-m04-tcp-lifecycle, s02-m01-layers.
- **Threads:** T-round-trip-tax, T-fix-causes-next, T-setup-off-path.

**Pretest.**
1. How big is a UDP header? *Answer: 8 bytes.*
2. Round trips before app data with TCP and TLS 1.2? *Answer: 3.*
3. HTTP/2 on TCP loses one packet. How many streams stall? *Answer: all of them.*

**Rung 1, the picture.** TCP is registered mail: numbered, tracked, with a signature on arrival. UDP is a postcard: it arrives whole or not at all, with no receipt. QUIC is a courier that sends postcards too. It numbers every postcard once and writes the parcel page number on it. It copies lost pages onto new postcards with new numbers. It runs its own office instead of the national post, the kernel. The round-trip tax is a call to another continent: each "hello?" takes the same delay, however fast you talk.
*Where it breaks:* the post never delivers a card twice. UDP can duplicate or reorder datagrams. The checksum only catches damage. On a call, a person can say many things in one turn. TLS 1.3 and QUIC do that: they cut the number of turns, not the delay of each turn.

**Rung 2, how it works.**
1. UDP: the sender writes one datagram with ports, length and checksum.
2. The receiver gets the whole datagram or nothing. No ack comes back.
3. QUIC: the first client packet carries the TLS ClientHello inside it (section 6).
4. The server answers with its part of the handshake in the same flight.
5. After one round trip the client sends the request.
6. Each stream orders its own bytes. A loss delays only the stream it hit.

**Rung 3, the real thing.** Slide 27 draws both headers. UDP: source port, destination port, length, checksum, 2 bytes each. The largest IPv4 payload is 65,535 − 20 − 8 = 65,507 bytes. Slide 26 counts round trips. Slide 28 draws the stacks: HTTP/2 over TLS over TCP, against HTTP/3 over QUIC over UDP. RFC 9000 §2.2 orders stream data by stream ID and offset, and §12.3 never reuses a packet number (section 6).

**Rung 4, exam depth.**
- *The tax in numbers.* Mumbai to Virginia, about 190 ms RTT (S02-C109). TLS 1.2: 3 × 190 = 570 ms before the request leaves. TLS 1.3: 380 ms. QUIC: 190 ms. The response adds one more RTT to each.
- *Physics sets the floor.* Light in fibre covers about 204,000 km/s, about 4.9 ms per 1,000 km one way. The great circle is about 12,850 km, so the floor is about 126 ms RTT. Cable routes add the rest (section 6). GEO at 35,786 km has a 477 ms RTT floor. LEO at 550 km has 7.3 ms.
- *How to count TFO.* The slide draws TCP Fast Open at 1 RTT. A returning client sends data in the SYN, so data leaves at 0 RTT and the answer comes at 1 RTT. The RTT calculator counts TFO data at 0 RTT and shows the slide count, 1 RTT, as a label (section 7, item 9).
- *Why userspace.* Kernel TCP changes need OS updates and survive middleboxes badly. QUIC ships with the app (S02-C118). Session 5 goes deeper in s05-m10-quic-handshakes and s05-m11-quic-streams-fallback.
- *Why UDP for voice.* A resent audio frame arrives after its play time, so a gap is the right result (S02-C113).

**Misconceptions.**
- S02-M22: "More bandwidth makes the handshake faster." Wrong. Round trips depend on distance. Distractor in check 3.
- S02-M23: "QUIC is unreliable because it runs on UDP." Wrong. QUIC adds acks and resends. Distractor in check 4.
- S02-M24: "A late resent audio frame is better than a gap." Wrong. It misses its play time. Distractor in check 5.
- S02-M25: "The UDP header has a sequence number." Wrong. Ports, length, checksum only. Distractor in check 1.
- S02-M52: "QUIC lives in the kernel, like TCP." Wrong. QUIC ships in the application, over kernel UDP. Distractor in check 4 and in s02-m11 check 4.

**Diagrams.**
- Static: the TCP and UDP headers from slide 27, to scale.
- Static: the round-trip bars from slide 26, with a 0-RTT marker for TFO data.
- Step-by-step: one lost packet under HTTP/2 over TCP, then under QUIC.

**Interactives.**
- *RTT calculator.* Inputs: path (fibre km, LEO 550 km, GEO 35,786 km), handshake (TCP, TLS 1.2, TLS 1.3, TFO, QUIC). The learner sees the RTT floor, time to the first request byte and time to the first response byte. Discovers that distance, not bandwidth, sets the tax. Pure function. Fibre speed = c/1.468, with c = 299,792.458 km/s. TFO data leaves at 0 RTT for a returning client, and the slide count, 1 RTT, shows as a label. Test vectors: LEO 7.34 ms, GEO 477.48 ms, 1,000 km of fibre 9.79 ms. Priority P1.
- *Stall visual.* Link to the Session 5 head-of-line interactive. Priority P2.

**Predict, observe, explain.** Capture one datagram on loopback (lab below). Predict the UDP length field for a 2-byte payload. Observe: `000a`, which is 10 = 8 + 2. Source: the learner capture.

**Worked example.** 190 ms RTT, TCP + TLS 1.3. Round trips before the request: 2. Time: 2 × 190 = 380 ms. First response byte: 3 × 190 = 570 ms.

**Faded example.** GEO satellite, RTT floor 477 ms, TCP + TLS 1.3. Before the request: ____ × 477 = ____ ms. *(2, 954 ms.)*

**Your turn.** 6,000 km of fibre one way. RTT floor? QUIC first request byte? *(About 59 ms. About 59 ms.)*

**Checks.**
1. `numeric`: UDP header size in bytes? Answer: 8. Distractor 12, for a sequence field (S02-M25).
2. `numeric`: largest UDP payload over IPv4? Answer: 65,507.
3. `mcq`: a 10× faster link changes the TLS 1.3 handshake time how? Answer: almost no change. Distractors: 10× faster (S02-M22), faster, because a fast link needs fewer round trips (S02-M22). Feedback: the RTT sets it, and the number of round trips stays the same.
4. `mcq`: QUIC runs on UDP, so lost data is? Answer: resent by QUIC. Distractors: lost for good (S02-M23), resent by the kernel, as TCP does (S02-M52). Feedback: QUIC does its own acks and resends in userspace.
5. `mcq`: a voice app loses one audio frame. Best action? Answer: skip it. Distractors: wait for a resend (S02-M24), ask for a resend ahead of new audio (S02-M24). Feedback: a late frame misses its play time.
6. `numeric`: round trips before app data, TCP + TLS 1.2? Answer: 3.

**Review cards.**
- Q: The four UDP header fields? A: source port, destination port, length, checksum.
- Q: Max UDP payload on IPv4? A: 65,507 bytes.
- Q: RTTs before data: TLS 1.2, TLS 1.3, QUIC? A: 3, 2, 1.
- Q: Why can QUIC change fast? A: it lives in userspace.
- Q: One lost packet under QUIC stalls? A: only its own stream.

**Lab.** All on loopback.

```sh
sudo tcpdump -i lo -nn -X 'udp port 9999'      # terminal 1
ncat -u -l 127.0.0.1 9999                      # terminal 2
printf 'hi' | ncat -u 127.0.0.1 9999           # terminal 3
```

Look at the 8 bytes after the 20-byte IP header. Expected: a random source port, `270f` (9999), `000a` (10), a checksum, then `6869` ("hi").

### s02-m07-smtp-mime

- **Title:** SMTP and MIME: type a letter, trust any sender.
- **Minutes:** 25.
- **Big idea:** SMTP is typed text that ends a message at a lone dot, believes any sender, and carries files as base64.
- **Covers:** S02-C120, S02-C121, S02-C122, S02-C123, S02-C124, S02-C125, S02-C126, S02-C127, S02-C128, S02-C129, S02-C130, S02-C131, S02-C132, S02-C133, S02-C134, S02-C135, S02-C136, S02-C137, S02-C138, S02-C165.
- **Prereqs:** s01-m04-clients, s01-m08-framing, s01-m09-encodings.
- **Threads:** T-framing, T-alphabets, T-skip-unknown.

**Pretest.**
1. What ends the DATA part of an SMTP message? *Answer: a line with only a dot.*
2. 3 bytes become how many base64 characters? *Answer: 4.*
3. Does SMTP check that From: matches MAIL FROM? *Answer: no.*

**Rung 1, the picture.** The post office reads only the envelope. Inside, you can sign the letter with any name. A radio operator ends with "over and out". If your message contains those words, you must mark them so the listener does not stop early. Base64 sends a photo over a phone line that knows only 64 words. It is slower, but every word gets through.
*Where it breaks:* a paper letter keeps one envelope. Each SMTP relay writes a new envelope and adds a Received line to the letter itself. A radio operator can pick other words. SMTP cannot change its end marker, so the client must stuff every line that starts with a dot. Base64 is not slower on the wire. It is bigger: 4 characters for every 3 bytes.

**Rung 2, how it works.**
1. Connect. The server greets with 220.
2. `EHLO name`. The server lists its extensions with 250.
3. `MAIL FROM:<a>` and `RCPT TO:<b>`. Each gets 250.
4. `DATA`. The server says 354: send the text, end with a lone dot.
5. Headers, a blank line, the body. Dot-stuff any line that starts with ".".
6. A line with only ".". The server answers 250. `QUIT` gets 221.

**Rung 3, the real thing.** Slide 33 shows the typed session. RFC 5321 §4.5.2 says the client adds one dot to a line that starts with a dot, and the server removes it. Base64 on slide 31: `0x4D 0x61 0x6E` = 01001101 01100001 01101110. Regroup as 010011 010110 000101 101110 = 19, 22, 5, 46 = T, W, F, u. RFC 2045 §6.8 limits a line to 76 characters. The multipart example uses `boundary="=_a7f3c91"`, and each part starts with `--=_a7f3c91`.

**Rung 4, exam depth.**
- *Why text won.* Each relay reads and adds headers, and an unknown header breaks nothing (S02-C123). That is skip-unknown in text form.
- *Why spoofing works.* MAIL FROM is a typed string (S02-C124). SPF and DMARC publish policy in DNS, and DKIM adds a signature header. So "headers and verbs" on the slide (S02-C165) holds for STARTTLS and DKIM, not for SPF and DMARC (section 6).
- *Real overhead.* 4/3 is the core cost. A CRLF after each 76 characters adds about 2.6%, so about 37% in all (section 6).
- *Delimiter risk.* Forget dot-stuffing and a body line "." ends the message early. The rest of the body then reads as SMTP commands: content becomes protocol (S02-C150). Session 5 shows the same failure as request smuggling.
- *Which port.* 25 is relay between servers. A mail client submits on 587 with STARTTLS, or on 465 with TLS from the first byte (S02-C122).

**Misconceptions.**
- S02-M26: "MAIL FROM must match the From: header." Wrong. Nothing checks. Distractor in check 4.
- S02-M27: "Base64 adds 25%, or it compresses." Wrong. 4/3 is about 33%. Distractor in check 3.
- S02-M28: "A body line that starts with a dot ends the message." Wrong. Only a line that holds a lone dot does, and stuffing protects the rest. Distractor in check 1.
- S02-M29: "A mail client sends on port 25." Wrong. Clients submit on 587 or 465. Distractor in check 5.
- S02-M53: "A blank line ends DATA." Wrong. A blank line ends the headers. A lone dot ends DATA. Distractor in check 1.
- S02-M54: "The client sends a dot line as is." Wrong. The receiver strips one leading dot from each such line, so the client must add one. Distractors in check 2.
- S02-M55: "MAIL FROM decides where the mail goes." Wrong. MAIL FROM is the return path. RCPT TO names the recipient. Distractor in check 4.
- S02-M56: "A mail client sends on the port it reads from, 110 or 143." Wrong. Those ports are for POP3 and IMAP. Distractor in check 5.
- S02-M57: "SMTP extends through a version number." Wrong. SMTP has no version field. EHLO lists extensions, and unknown headers pass through. Distractor in check 6.
- S02-M58: "A relay must understand every header it passes on." Wrong. A relay passes an unknown header on unchanged. Distractor in check 6.

**Diagrams.**
- Static: envelope (MAIL FROM, RCPT TO) against letter (From:, To:, Subject:).
- Step-by-step: the SMTP ladder with reply codes.
- Static: the base64 regroup of "Man", 3 × 8 bits into 4 × 6 bits.

**Interactives.**
- *SMTP dialogue simulator.* A fake server in JS, no network. Inputs: typed commands. The learner sees RFC 5321 replies, 503 for a wrong order, the envelope and the letter side by side, and dot-stuffing on send. Discovers that any MAIL FROM passes and that a lone dot ends DATA. Priority P1.
- *Base64 regrouper.* Inputs: bytes or text. The learner sees the bit regroup, the padding and the size. A generator for new sizes. Priority P2.

**Predict, observe, explain.** Start greenmail (lab). In the SMTP session, type `MAIL FROM:<anyone@anywhere.example>`. Predict: reject or 250? Observe: 250. Source: slide 33 and the learner session.

**Worked example.** "Man" = `4D 61 6E` → bits 010011 010110 000101 101110 → 19, 22, 5, 46 → `TWFu`. A body line `.hidden` travels as `..hidden`.

**Faded example.** "Hi" = `48 69`. Bits 010010 000110 1001__ → S, G, ____, then padding ____. *(k, =. Result `SGk=`.)*

**Your turn.** A 300,000-byte attachment. Base64 characters without line breaks? *(400,000.)*

**Checks.**
1. `mcq`: what ends DATA? Answer: CRLF, a lone dot, CRLF. Distractors: a blank line (S02-M53), any line that starts with a dot (S02-M28). Feedback: the blank line ends the headers only, and stuffing protects other dot lines.
2. `mcq`: how does a client send the body line `.config`? Answer: `..config`. Distractors: `.config` as is (S02-M54), `.config` as is, because the server adds the dot (S02-M54). Feedback: the receiver strips one leading dot, so an unstuffed line arrives as `config`.
3. `numeric`: 3,000 bytes in base64, no line breaks? Answer: 4,000. Distractor 3,750 (S02-M27).
4. `mcq`: which one decides delivery? Answer: RCPT TO. Distractors: the To: header, which must match (S02-M26), MAIL FROM (S02-M55). Feedback: MAIL FROM is the return path.
5. `mcq`: which port should a mail client use to submit? Answer: 587. Distractors: 25 (S02-M29), 110 (S02-M56). Feedback: 25 is server to server, and 110 is for reading.
6. `mcq`: why did SMTP extensions bolt on cleanly? Answer: a text header nobody knows breaks nothing. Distractors: SMTP has a version field (S02-M57), every relay understands every header (S02-M58). Feedback: an unknown header passes through unchanged.

**Review cards.**
- Q: The envelope commands? A: MAIL FROM and RCPT TO.
- Q: What ends DATA? A: a line with only a dot.
- Q: Base64 size ratio? A: 4/3.
- Q: Base64 line limit in MIME? A: 76 characters.
- Q: "Man" in base64? A: TWFu.
- Q: Submission port with STARTTLS? A: 587.

**Lab.** The slides publish on every interface. These commands bind localhost only.

```sh
podman run -d --name greenmail \
  -e 'GREENMAIL_OPTS=-Dgreenmail.setup.test.all -Dgreenmail.hostname=0.0.0.0 -Dgreenmail.users=bob:secret@localhost -Dgreenmail.verbose' \
  -p 127.0.0.1:3025:3025 -p 127.0.0.1:3110:3110 \
  docker.io/greenmail/standalone:2.1.12
nc -C 127.0.0.1 3025
```

The slides use telnet. The repo machine has no telnet, so the labs use `nc -C`, which ends each line with CRLF. Type the slide 33 dialogue, with `RCPT TO:<bob@localhost>`. Expected: 220, 250, 250, 250, 354, 250 after the dot, 221 after QUIT. For a web view, run `podman run -d --name mailpit -p 127.0.0.1:1025:1025 -p 127.0.0.1:8025:8025 docker.io/axllent/mailpit`, send to port 1025, and open `http://localhost:8025`. The slide writes the image as `axllent/mailpit`. Clean up with `podman rm -f mailpit` when done. Keep greenmail for s02-m08.

### s02-m08-pop-imap

- **Title:** POP and IMAP: where the mailbox state lives.
- **Minutes:** 15.
- **Big idea:** POP moves mail and its state to your device, and IMAP keeps both on the server.
- **Covers:** S02-C139, S02-C140, S02-C141, S02-C142, S02-C143, S02-C144, S02-C145, S02-C146, S02-C147, S02-C148.
- **Prereqs:** s02-m07-smtp-mime.
- **Threads:** T-where-state-goes, T-framing.

**Pretest.**
1. When does POP delete a message marked with DELE? *Answer: at QUIT.*
2. The laptop fetched and deleted mail with POP. What does the phone see? *Answer: nothing.*
3. Where does IMAP keep the \Seen flag? *Answer: on the server.*

**Rung 1, the picture.** POP is a post office box: you empty it into your bag and take it home. IMAP is a library: the book stays on the shelf, and the front desk remembers your bookmark for every device you use.
*Where it breaks:* a library shares one book with many readers. An IMAP mailbox belongs to one user who reads from many devices.

**Rung 2, how it works.**
1. POP: `USER bob`, `PASS secret`. Both cross the wire in clear text.
2. `STAT` gives the count and total octets. `LIST` gives the size of each.
3. `RETR 1` returns the whole message, ending with a lone dot.
4. `DELE 1` only marks it. `QUIT` applies the deletion.
5. IMAP: tagged commands such as `a1 LOGIN`, `a2 SELECT INBOX`, `a3 FETCH`.
6. The server keeps flags, folders and search, and pushes with IDLE.

**Rung 3, the real thing.** Slide 34 types the POP session against greenmail on 3110. RFC 1939 §6: deletion happens only in the UPDATE state after QUIT. A dropped connection deletes nothing. Multi-line replies end with a lone dot and are byte-stuffed, like SMTP (section 6). Slide 34 calls four verbs the whole protocol. RFC 1939 §9 also lists USER, PASS, QUIT, NOOP and RSET in the minimal set, and RSET removes every deletion mark (section 6). RFC 9051 §4.3: an IMAP literal is `{310}`, CRLF, then exactly 310 octets. Slide 35 names `FETCH BODY[1]` for one MIME part.

**Rung 4, exam depth.**
- *State placement is the design.* POP: little server storage and offline work, but one device wins. IMAP: every device agrees, but the server stores everything and must stay reachable (S02-C148).
- *A careful fetch.* `FETCH BODY[1]` sets \Seen. `BODY.PEEK[1]` does not (section 6).
- *Framing inside both.* POP uses delimiters at both levels: CRLF ends the status line, and a lone dot ends the body. Slide 36 puts POP3 under "both" (S02-C152), but no length frames a POP message (section 6, section 7 item 24). IMAP literals put a length inside a delimited line, which is "both" (S02-C149). IMAP tags name each command, so replies can come back in any order.
- *Clear passwords.* USER and PASS are plain text, so use 995 for POP3S and 993 for IMAPS (S02-C141, section 6).

**Misconceptions.**
- S02-M30: "DELE removes the message at once." Wrong. It removes it at QUIT. Distractor in check 1.
- S02-M31: "IMAP downloads mail and removes it from the server." Wrong. The mail stays, and the client holds a cache. Distractor in check 2.
- S02-M32: "POP has folders and server-side search." Wrong. POP has one inbox. Distractors in check 3.
- S02-M59: "A dropped POP session applies the deletions." Wrong. RFC 1939 deletes only after QUIT. greenmail keeps the marks, but it still does not expunge. Distractor in check 1.
- S02-M60: "IMAP deletes a message once the client reads it." Wrong. Reading sets \Seen, and the message stays. Distractor in check 2.
- S02-M61: "POP can fetch one MIME part." Wrong. RETR returns the whole message, and the optional TOP returns headers plus body lines, not a part. Distractors in check 4.

**Diagrams.**
- Static: the slide 35 table, POP column against IMAP column.
- Step-by-step: laptop and phone read the same mailbox, POP mode then IMAP mode.

**Interactives.**
- *Two-device mailbox.* Inputs: POP or IMAP, actions on device A or B (fetch, mark read, delete, drop the connection). The learner sees the server mailbox and each device. Discovers where state lives and that RFC 1939 deletes nothing when a POP session drops. A note says that greenmail differs (section 6). Priority P1.

**Predict, observe, explain.** Send one message to bob@localhost (s02-m07 lab). In POP, type `DELE 1`, then press Ctrl+C without QUIT. Reconnect, log in, and type `STAT`. Predict: 0 or 1 messages? RFC 1939 §6 says 1. Observe: greenmail 2.1.12 says 0, because it keeps the deletion mark after the connection drops. It does not expunge the message: `RSET` brings it back. Explain the gap: the RFC ties the marks to one session, and greenmail stores them on the message. Source: the greenmail 2.1.12 source (section 6) and the learner session.

**Worked example.** `STAT` → `+OK 2 1024`: 2 messages, 1024 octets. `DELE 1`, then `STAT` → `+OK 1 ...`: marked messages drop out of the count. `QUIT` → message 1 is gone.

**Faded example.** `STAT` → `+OK 3 900`. `DELE 2`. The connection drops. After reconnect, `STAT` on a server that follows RFC 1939 shows ____ messages. *(3. greenmail shows 2.)*

**Your turn.** A phone and a laptop both use IMAP. The laptop reads a message. What does the phone show? *(Read, because \Seen lives on the server.)*

**Checks.**
1. `mcq`: DELE 1 then QUIT. When does the message go? Answer: at QUIT. Distractors: at DELE (S02-M30), when the connection closes, with or without QUIT (S02-M59). Feedback: QUIT starts the UPDATE state.
2. `mcq`: after an IMAP client reads mail, where is the mail? Answer: still on the server. Distractors: only on the client (S02-M31), nowhere, because IMAP deletes it once read (S02-M60). Feedback: IMAP keeps mail and flags on the server.
3. `mcq`: which protocol has server-side SEARCH? Answer: IMAP. Distractors: POP (S02-M32), both POP and IMAP (S02-M32). Feedback: POP searches only after a download.
4. `mcq`: a client wants only the first MIME part of message 1, not the attachment. Which command? Answer: `a3 FETCH 1 BODY[1]`. Distractors: `RETR 1` (S02-M61), `TOP 1 10` (S02-M61). Feedback: only IMAP fetches one part.
5. `numeric`: the POP3S port? Answer: 995.

**Review cards.**
- Q: The four POP verbs on slide 34? A: STAT, LIST, RETR, DELE.
- Q: When does POP apply DELE? A: at QUIT.
- Q: Where does IMAP keep read state? A: server flags.
- Q: IMAP literal syntax? A: {n}, CRLF, then n octets.
- Q: IMAP fetch that keeps \Seen off? A: BODY.PEEK.

**Lab.** Uses the greenmail container from s02-m07.

```sh
nc -C 127.0.0.1 3110
```

Type `USER bob`, `PASS secret`, `STAT`, `LIST`, `RETR 1`, `DELE 1`, `QUIT`. Expected: `+OK` on each line, the message text, then a lone dot after RETR. Beyond the slides: recreate greenmail with `-p 127.0.0.1:3143:3143` added, send a new message, connect with `nc -C 127.0.0.1 3143`, and try `a1 LOGIN bob secret`, `a2 SELECT INBOX`, `a3 FETCH 1 BODY.PEEK[HEADER]`, `a4 LOGOUT`. Clean up with `podman rm -f greenmail`.

### s02-m09-ftp-framing

- **Title:** Framing and FTP: where content ends.
- **Minutes:** 25.
- **Big idea:** Every protocol marks where content ends with a length or a delimiter, and FTP also gives each file its own connection.
- **Covers:** S02-C06, S02-C149, S02-C150, S02-C151, S02-C152, S02-C153, S02-C154, S02-C155, S02-C156, S02-C157, S02-C158, S02-C159, S02-C160, S02-C161, S02-C162, S02-C164.
- **Prereqs:** s01-m08-framing, s01-m05-byte-order-dns, s02-m03-sms-bytes, s02-m07-smtp-mime, s02-m08-pop-imap.
- **Threads:** T-framing, T-alphabets.

**Pretest.**
1. The reply is `227 Entering passive mode (127,0,0,1,117,48)`. Which port? *Answer: 30000.*
2. Which framing needs escaping: delimiter or length? *Answer: delimiter.*
3. In passive mode, who opens the data connection? *Answer: the client.*

**Rung 1, the picture.** Three ways to show where a story ends. Write "THE END" after it: a delimiter. Write the page count on the cover: a length. Write the chapter count on the cover and "THE END" after each chapter: both. FTP does something else. You phone the shop, and the parcel comes in a separate van. In active mode the van drives to your house, and the gate (NAT) stops it. In passive mode the shop names a loading bay, and you drive there.
*Where it breaks:* one van can carry many parcels. FTP opens a new data connection for each listing and each file. A reader knows that "THE END" inside a story is not the end. A parser does not know that, so a delimiter needs escaping.

**Rung 2, how it works (passive mode).**
1. The client connects to the control port and logs in.
2. The client sends `PASV`.
3. The server opens a listening port and replies `227 (h1,h2,h3,h4,p1,p2)`.
4. The client computes port = p1 × 256 + p2 and connects there.
5. The client sends `LIST` or `RETR name` on the control connection.
6. The bytes arrive on the data connection. The server closes it at the end.

**Rung 3, the real thing.** Slide 36 sorts protocols into delimiter, length and both. Slide 37 draws active and passive mode. Slide 39 decodes `(127,0,0,1,117,48)`: 117 × 256 + 48 = 30000. RFC 959 §4.1.2 sends the 32-bit address and 16-bit port as six 8-bit decimal fields, high byte first (section 6). In stream mode the sender closes the data connection to mark end of file (RFC 959 §3.4.1). The pyftpdlib server picks a random free port in `--range` for each PASV, so decode every reply (section 6).

**Rung 4, exam depth.**
- *Two rules or three?* Session 1 slide 39 lists fixed length, delimiter and length prefix. This session says there is no third option (S02-C149). Both hold: a fixed length is a length that both sides agreed on before the first byte.
- *The cost table.* A delimiter streams without a size but needs escaping (dot-stuffing). A length needs no escaping but needs the size first, which chunked encoding avoids. Both gives readable control and a safe payload, but two parsers can disagree, and request smuggling lives in that gap (S02-C150 to S02-C152).
- *Check the columns on the slide.* Slide 36 puts MTP2 under length, but its 6-bit LI stops at 63, and a flag byte 0x7E with zero-bit insertion ends each unit: a delimiter with an escape. POP3 uses delimiters at both levels. HTTP/2 frames start with a 24-bit length, and a flag on the last frame ends the message. Redis bulk strings carry a length. Session 5 calls chunked encoding "both, nested": each chunk has a length, and an empty chunk ends the body (section 6, section 7 item 24).
- *FTP answers with a connection.* Stream mode ends a file by closing the data connection. Block mode sends a byte count (section 6). One more reason to keep control and data apart (S02-C164).
- *History check.* PASV already exists in RFC 765, 1980, long before NAT. The 1971 FTP ran before TCP (section 6). EPSV replies `229 (|||port|)` and works for IPv6.
- *Graded work.* The Session 5 calculator assignment and the binary project both rest on this module: find where one message ends. Use s05-m12-assignment-prep and s05-m13-project-studio. No solution here.

**Misconceptions.**
- S02-M33: "A length prefix needs escaping too." Wrong. The receiver never scans the payload. Distractors in check 5.
- S02-M34: "The port is p2 × 256 + p1." Wrong. The high byte comes first. Distractor in check 1.
- S02-M35: "In passive mode the server connects to the client." Wrong. The client opens both. Distractor in checks 3 and 4.
- S02-M36: "FTP sends file bytes on the control connection." Wrong. Each file gets a new data connection. Distractor in checks 3 and 4.
- S02-M62: "An end marker is a kind of length field." Wrong. A receiver scans for a marker, but it reads a length before the payload. Distractors in check 6.

**Diagrams.**
- Static: three columns from slide 36, delimiter, length, both, with the cost under each.
- Step-by-step: active mode blocked at a NAT box, then passive mode through it.
- Static: the 227 decode, six numbers split into IP and port bytes.

**Interactives.**
- *PASV port calculator.* Inputs: a 227 reply or a port number. The learner sees the decode or encode, and an error for a field above 255. Pure function, test vectors: `(127,0,0,1,117,48)` → 30000, 2121 → `8,73`. Priority P1.
- *Framing sorter.* Inputs: drag SMTP, HTTP/1.1 headers, MIME, Redis, SMS, Content-Length, MTP2, Protobuf, IMAP, POP3, HTTP/2 into three bins. The answer key shows the slide 36 bin, then the corrected bin with a beyond-the-slides badge. Slide bins: delimiter for SMTP, HTTP/1.1 headers, MIME, Redis. Length for SMS, Content-Length, MTP2, Protobuf. Both for IMAP, HTTP/1.1 headers plus Content-Length, HTTP/2, POP3. Corrected bins: MTP2 delimiter (flag plus zero-bit insertion). POP3 delimiter (CRLF line, dotted body). Redis both (bulk strings carry a length). HTTP/2 length per frame, with an end flag per message. The sorter accepts either bin for these four. Priority P2.

**Predict, observe, explain.** In the FTP lab, send `PASV`. Predict the port from the six numbers before you connect terminal 2. Observe: the connection succeeds, and `LIST` output appears there. Send `PASV` again and predict: same port or new? Observe: usually a different port. The same port can come back, because pyftpdlib picks one at random from the range. Source: slide 39 and the pyftpdlib source.

**Worked example.** `(127,0,0,1,117,48)`. IP = 127.0.0.1. Port = 117 × 256 + 48 = 29,952 + 48 = 30000.

**Faded example.** `(10,0,0,5,195,80)`. 195 × 256 = ____. Plus 80 = ____. *(49,920. 50,000.)*

**Your turn.** Encode port 2121 and port 30001 as p1,p2. *(8,73. 117,49.)*

**Checks.**
1. `numeric`: port in `(127,0,0,1,117,48)`? Answer: 30000. Distractor 12,405 (S02-M34). Feedback: high byte first.
2. `recall`: p1,p2 for port 2121? Answer: 8,73.
3. `mcq`: passive mode, who opens the data connection? Answer: the client. Distractors: the server, from port 20 (S02-M35), nobody, because the file comes on the control connection (S02-M36).
4. `mcq`: in passive mode, where do the bytes of `RETR hello.txt` arrive? Answer: on the data connection that the client opened. Distractors: on the control connection (S02-M36), on a connection that the server opens from port 20 (S02-M35).
5. `mcq`: which framing needs escaping? Answer: delimiter. Distractors: length prefix (S02-M33), both kinds, always (S02-M33). Feedback: a length lets the receiver skip the payload without a scan.
6. `multi`: which use a length? Answer: SMS TP-UDL, HTTP Content-Length, Protobuf varint. Distractors: SMTP lone dot (S02-M62), MIME boundary (S02-M62). Feedback: slide 36 also lists MTP2 LI, but the LI stops at 63, so this item leaves it out (section 6).

**Review cards.**
- Q: The two framing rules? A: length or delimiter.
- Q: The cost of a delimiter? A: escaping.
- Q: The cost of a length? A: know the size first.
- Q: PASV port formula? A: p1 × 256 + p2.
- Q: FTP control port? A: 21.
- Q: Why passive mode survives NAT? A: the client opens both connections.

**Lab.** The slides publish on every interface. These commands bind localhost only.

```sh
mkdir -p /tmp/s02-ftp && cd /tmp/s02-ftp          # terminal 0
mkdir -p ftp-demo && echo "hello from ftp" > ftp-demo/hello.txt
podman run --rm -it --name ftp-demo \
  -p 127.0.0.1:2121:2121 -p 127.0.0.1:30000-30009:30000-30009 \
  -v "$PWD/ftp-demo:/srv:Z" \
  docker.io/library/python:3.13-slim \
  sh -lc 'pip install -q pyftpdlib && python -m pyftpdlib --interface=0.0.0.0 --port=2121 --directory=/srv --username=scaler --password=demo --write --range=30000-30009 --nat-address=127.0.0.1 --debug'
```

Terminal 0 keeps the server in the foreground. Terminal 1: `nc -C 127.0.0.1 2121`, then `USER scaler`, `PASS demo`, `PWD`, `PASV`. Terminal 2: `nc -C 127.0.0.1 <port from the 227>`, within 30 s of the 227 reply. Terminal 1: `LIST`. Then `PASV` again, connect terminal 2 to the new port, and send `RETR hello.txt`. Expected: the listing, then `hello from ftp`, appear in terminal 2, and each data connection closes at the end. If terminal 1 shows `421 Passive data channel timed out.`, send `PASV` again. The slides use telnet. The repo machine has no telnet, and pyftpdlib acts on a command only after CRLF, so plain `nc` hangs. `:Z` is for SELinux on Fedora and is not on the slide. The container needs internet for pip.

### s02-m10-sms-delivery

- **Title:** SMS delivery: a lookup wrapped in a queue.
- **Minutes:** 15.
- **Big idea:** The SMSC stores a text first and delivers it after an HLR lookup, like mail and not like a call.
- **Covers:** S02-C56, S02-C57, S02-C58, S02-C59, S02-C60, S02-C61.
- **Prereqs:** s02-m03-sms-bytes, s02-m02-ss7.
- **Threads:** T-name-in-message.

**Pretest.**
1. Phone B is off. Who holds the SMS? *Answer: the SMSC.*
2. What does the HLR return to sendRoutingInfoForSM? *Answer: the IMSI and the serving MSC address.*
3. The opCode of mo-ForwardSM? *Answer: 46.*

**Rung 1, the picture.** You hand a letter across a post office counter. The clerk stamps it "received": that is all you learn. The office looks up where the person lives now, then a carrier takes it there. You hear back only if you paid for a receipt.
*Where it breaks:* a post office looks up an address once. The SMSC asks the HLR for every message, because a phone moves between switches all day.

**Rung 2, how it works.**
1. Phone A sends SMS-SUBMIT to its serving switch.
2. The switch sends MAP mo-ForwardSM (46) to the SMSC.
3. The SMSC stores the message and answers TCAP `END`: accepted.
4. The SMSC asks the HLR: sendRoutingInfoForSM (45) with the number of B.
5. The HLR answers with the IMSI and the address of MSC B.
6. The SMSC sends mt-ForwardSM (44) with SMS-DELIVER. MSC B delivers over the air and returns the result.

**Rung 3, the real thing.** Slide 17 draws six actors: phone A, VMSC/VLR, SMSC, HLR, MSC B, phone B. The opCodes come from the MAP ASN.1 in 3GPP TS 29.002: sendRoutingInfoForSM 45, mo-ForwardSM 46, mt-ForwardSM 44. The TPDU names change with direction: SMS-SUBMIT from a phone, SMS-DELIVER to a phone (TS 23.040).

**Rung 4, exam depth.**
- *Accepted is not delivered.* The TCAP `END` to switch A means the SMSC holds the message (S02-C58). Only a status report says that phone B got it (S02-C61). The `END` returns the transaction ID of switch A as its DTID, so switch A matches it to its `BEGIN` (s02-m02). Phone A never speaks TCAP. It hears of the acceptance over the air as an RP-ACK (section 6).
- *Why store and forward.* Phone B can be off, busy or abroad. The queue lets the sender finish now. SMTP relays make the same choice.
- *Why a lookup per message.* The number (MSISDN) names a person, not a place. The HLR maps it to the IMSI and the current switch. The message carries a name, and the network resolves it late.
- *The failure path.* If delivery fails, the SMSC reports to the HLR with reportSM-DeliveryStatus (47). When the phone returns, the HLR sends alertServiceCentre (64) toward the SMSC, and the SMSC tries again (section 6).
- *Call against SMS.* ISUP reserves a voice circuit (s02-m02). An SMS needs no circuit: it rides inside the signalling network itself.

**Misconceptions.**
- S02-M37: "The HLR stores the SMS." Wrong. The SMSC stores it, and the HLR only knows where the phone is. Distractor in check 2.
- S02-M38: "TCAP `END` to switch A means phone B got it." Wrong. It means the SMSC accepted it. Distractor in check 4.
- S02-M39: "An SMS needs a voice circuit, like a call." Wrong. It rides SS7. Distractor in check 5.
- S02-M63: "MSC B holds the SMS until phone B is back." Wrong. MSC B only forwards. The SMSC keeps the message and tries again. Distractor in check 2.
- S02-M64: "The SMSC asks the HLR before it answers switch A." Wrong. On slide 17 the `END` comes first, then the HLR lookup. Distractor in check 4.
- S02-M65: "SMS needs the mobile data network." Wrong. It rides the signalling network, which is why it works when data is down (S02-C51). Distractor in check 5.

**Diagrams.**
- Step-by-step: the slide 17 ladder, six lanes, one message per step, with a "stored" marker at the SMSC.

**Interactives.**
- *SMS delivery stepper.* Inputs: phone B on or off, status report on or off. The learner steps through the MAP messages. With B off, the SMSC keeps the message and the alert path runs later, with a beyond-the-slides badge. Discovers the gap between "accepted" and "delivered". Priority P1.

**Predict, observe, explain.** In the stepper, set phone B off. Predict: does phone A get an error? Observe: no. Switch A already has the TCAP `END`, and phone A already has its RP-ACK (section 6). Source: slide 17 for the normal flow, TS 23.040 for the failure path.

**Worked example.** Order the normal flow: SMS-SUBMIT, mo-ForwardSM, TCAP `END`, sendRoutingInfoForSM, IMSI + MSC address, mt-ForwardSM, SMS-DELIVER, delivery ack, mt-ForwardSM result, status report if asked.

**Faded example.** SMS-SUBMIT, ____, TCAP `END`, ____, IMSI + MSC address, mt-ForwardSM, ____. *(mo-ForwardSM. sendRoutingInfoForSM. SMS-DELIVER.)*

**Your turn.** Beyond the slides (section 6). Phone B is off. Put these in order: alertServiceCentre, mt-ForwardSM fails, reportSM-DeliveryStatus, phone B comes back, the SMSC tries again. *(mt-ForwardSM fails, reportSM-DeliveryStatus, phone B comes back, alertServiceCentre, the SMSC tries again.)*

**Checks.**
1. `order`: SMS-SUBMIT, mo-ForwardSM, sendRoutingInfoForSM, mt-ForwardSM, SMS-DELIVER.
2. `mcq`: which node stores the message? Answer: the SMSC. Distractors: the HLR (S02-M37), MSC B, until phone B is back (S02-M63). Feedback: the SMSC is the store-and-forward node.
3. `numeric`: opCode of mo-ForwardSM? Answer: 46.
4. `mcq`: switch A (the VMSC) gets TCAP `END`. What does that prove? Answer: the SMSC accepted it. Distractors: phone B received it (S02-M38), the HLR found phone B (S02-M64). Feedback: the `END` comes before the HLR lookup.
5. `mcq`: what carries an SMS across the core? Answer: SS7 signalling. Distractors: a reserved voice circuit (S02-M39), the mobile data network (S02-M65). Feedback: SMS rides inside the signalling network.

**Review cards.**
- Q: Who stores an SMS in transit? A: the SMSC.
- Q: What does the HLR return for SMS routing? A: IMSI and serving MSC address.
- Q: mo-ForwardSM opCode? A: 46.
- Q: TPDU type a phone receives? A: SMS-DELIVER.

### s02-m11-reliability-address

- **Title:** Reliability has an address: per hop, end to end, userspace.
- **Minutes:** 15.
- **Big idea:** SS7 makes each link reliable, TCP makes only the two ends reliable, and QUIC does the end-to-end job in userspace.
- **Covers:** S02-C72, S02-C73, S02-C74, S02-C75, S02-C76, S02-C77, S02-C78, S02-C79, S02-C80, S02-C163.
- **Prereqs:** s02-m02-ss7, s02-m04-tcp-lifecycle, s02-m06-udp-quic.
- **Threads:** none. Section 7, item 19 records a candidate thread.
- **Note:** a new module. Slide 20 and closing idea 3 moved here from s02-m02-ss7 (section 7, item 1).

**Pretest.**
1. Where does SS7 resend a lost signal unit: per hop or end to end? *Answer: per hop, in MTP2.*
2. What does a TCP sequence number count? *Answer: bytes.*

**Rung 1, the picture.** A bucket chain passes water from a well to a fire. Each person checks the bucket from the person before, and asks for it again if it spills. That is SS7. A courier carries a numbered box across many cities, and only the receiver signs. If no signature comes back, the sender ships a copy. That is TCP.
*Where it breaks:* a person can spill a bucket after the check. A signalling node can also lose a message between two good links, so per hop is strong but not complete (ITU-T Q.706 allows rare loss).

**Rung 2, how it works.**
1. MTP2 numbers each signal unit with a 7-bit FSN.
2. The next node acks with BSN and BIB inside its own units.
3. A lost or damaged unit goes again, on that link only.
4. TCP numbers bytes with a 32-bit sequence number.
5. Only the far end acks. Routers in the middle keep no copy.
6. The sender resends a lost segment across every hop again. QUIC does the same job inside the application (S02-C163).

**Rung 3, the real thing.** Slide 20 lines up eleven jobs side by side (S02-C73 to S02-C79). The FSN wraps at 128. The TCP number is 32 bits and counts bytes. MTP2 checks a CRC-16 per unit, and TCP checks a 16-bit ones' complement sum. MTP2 uses the basic method on short-delay links and PCR on long or satellite links (ITU-T Q.703, section 6). Congestion control is hop by hop in MTP3 and end to end in TCP (S02-C77).

**Rung 4, exam depth.**
- *Why per hop fits SS7.* One operator owns and engineers each signalling link, and MTP must meet strict targets: at most one message in 10^7 lost (ITU-T Q.706). Some links are long or go via satellite, which is why PCR exists. TCP crosses links that others own, so only the ends can be sure. That is the end-to-end argument (section 6).
- *Good hops are not a good path.* A node can drop a message between two good links, and Q.706 admits rare loss and missequencing. A design that needs certainty still checks at the ends (section 6).
- *Connections.* SS7 is connectionless, with SCCP class 2 or 3 when a connection is needed. TCP always sets up a connection with a 3-way handshake (S02-C76).
- *Max payload.* 272 octets of SIF against about 1460 B per TCP segment. "64 KB with window scaling" mixes window size and segment size (section 6, section 7 item 14).
- *Same eleven problems.* Both stacks solve them (S02-C80). QUIC puts the end-to-end job in userspace, so it can change without an OS update (S02-C163). The slide says all three were right for their network.

**Misconceptions.**
- S02-M07: "SS7 resends end to end, like TCP." Wrong. MTP2 resends per hop. Distractor in check 1.
- S02-M66: "A connectionless network never resends." Wrong. SS7 is connectionless, and MTP2 still resends on each link. Distractor in check 1.
- S02-M67: "A TCP sequence number counts segments or messages." Wrong. It counts bytes. The SS7 FSN counts signal units. Distractors in check 3.

**Diagrams.**
- Static: the slide 20 table, SS7 column against TCP column.
- Step-by-step: one unit lost on link 2 of 3. SS7 resends on link 2. TCP resends from the sender across all three links.

**Interactives.**
- *Who resends?* Inputs: SS7 or TCP, and the link that loses the packet. The learner sees which node keeps a copy and which node resends. Discovers per hop against end to end. Priority P2.

**Predict, observe, explain.** No instructor command exists. Predict from slide 20: a path has three links, and link 2 loses a unit. Which node resends in SS7, and which in TCP? Observe: in SS7, the node at the start of link 2. In TCP, the original sender. Source: slide 20, the "scope of reliability" row.

**Worked example.** An MTP2 sender used FSN 126. The next two FSNs are 127, then 0, because 7 bits wrap at 128.

**Faded example.** FSN 125. The next three: 126, ____, ____. *(127, 0.)*

**Your turn.** An MTP2 sender just used FSN 127. What FSN comes next? *(0.)*

**Checks.**
1. `mcq`: where does SS7 resend lost units? Answer: on each link, in MTP2. Distractors: end to end (S02-M07), nowhere, because SS7 is connectionless (S02-M66). Feedback: TCP is the end-to-end one, and MTP2 resends without a connection.
2. `numeric`: an MTP2 sender used FSN 127. Next FSN? Answer: 0. Feedback: 7 bits wrap at 128.
3. `mcq`: a TCP sequence number counts what? Answer: bytes. Distractors: segments, like the SS7 FSN (S02-M67), application messages (S02-M67). Feedback: TCP numbers each byte in a 32-bit space.
4. `mcq`: where does QUIC put reliability? Answer: in userspace, above UDP. Distractors: in the kernel, like TCP (S02-M52), nowhere, because UDP is unreliable (S02-M23). Feedback: QUIC ships with the application.

**Review cards.**
- Q: SS7 reliability scope? A: per hop.
- Q: MTP2 FSN width? A: 7 bits, wraps at 128.
- Q: TCP sequence number width and unit? A: 32 bits, bytes.
- Q: Where does QUIC put reliability? A: in userspace.
- Q: When does MTP2 use PCR? A: one-way delay of 15 ms or more, or a satellite link.

## 6. Beyond the slides

Each fact below corrects or completes the slides. Lesson pages show them with a "beyond the slides" badge.

| Fact | Reference |
|---|---|
| CSMA/CD runs only on half-duplex Ethernet. Full-duplex switched links have no collisions, and 10 Gb/s and faster Ethernet is full duplex only. | IEEE 802.3 clause 4, IEEE 802.3ae |
| Wi-Fi acks unicast frames only. Broadcast and multicast frames get no ACK and no retry. RTS/CTS helps with hidden stations. | IEEE Std 802.11-2020, DCF |
| Light covers 550 km straight up in 1.83 ms. Ground to satellite to ground is at least 3.67 ms, and the RTT floor is 7.34 ms. | c = 299,792.458 km/s (SI definition), arithmetic |
| GEO sits at 35,786 km: 119.4 ms up, at least 238.7 ms ground to ground, and an RTT floor of 477.5 ms. | c (SI), arithmetic |
| Light in single-mode fibre travels at about c/1.468, about 204,000 km/s, so about 4.9 ms per 1,000 km one way. | Corning SMF-28 group index at 1550 nm |
| Mumbai to Ashburn, Virginia is about 12,850 km on a great circle, a fibre RTT floor of about 126 ms. Real cable paths explain the 190 ms. | haversine arithmetic |
| The full IPv4 header also holds DSCP/ECN (1 B), identification (2 B), and flags plus fragment offset (2 B). | RFC 791 §3.1 |
| Other IPv4 fields can change on the path: a router can set ECN CE, a domain edge can re-mark DSCP, and fragmentation rewrites total length, flags and offset. Ports sit in the TCP or UDP header, not in IP. | RFC 3168 §5, RFC 2474 §3, RFC 791 §3.2 |
| The IPv6 fixed header is 40 octets, so the MSS on a 1500 MTU is 1500 − 40 − 20 = 1440. | RFC 8200 §3 |
| The TCP timestamp option is 10 bytes, 12 with two NOP bytes of padding. With timestamps on, a full segment on a 1500 MTU carries 1448 bytes of data. | RFC 7323 §3.2, Appendix A |
| The TCP "flags 2B" field holds a 4-bit data offset, 4 reserved bits and 8 flag bits. Options max out at 40 B because 15 × 4 = 60. | RFC 9293 §3.1 |
| The minimum Ethernet frame is 64 B with FCS. An 802.1Q VLAN tag adds 4 B, for 1522. | IEEE 802.3 clause 3, IEEE 802.1Q |
| The SIF max is 272 octets, so one MSU carries up to 268 octets after the 4-octet routing label. The slides say 273 twice, which is SIO + SIF. | ITU-T Q.703, Q.704 |
| The ITU routing label is DPC 14 bits, OPC 14 bits, SLS 4 bits. SIO low nibble: 3 = SCCP, 5 = ISUP. Top bits 00 = international, 10 = national. | ITU-T Q.704 §2.2, §14.2 |
| ITU-T places MTP plus SCCP in the network layer (the network service part). TCAP and MAP sit in layer 7. ISUP runs directly on MTP3. | ITU-T Q.700, Q.711 |
| MTP2 uses the basic error correction below 15 ms one-way delay, and PCR at 15 ms or more or via satellite. | ITU-T Q.703 |
| MTP promises its users at most 1 lost message in 10^7, and at most 1 in 10^10 out of sequence or with an undetected error. Loss in extreme cases stays possible. | ITU-T Q.706 §1 |
| MTP2 ends each signal unit at a flag, 01111110 (0x7E), and inserts a 0 after five 1s, so the flag cannot appear inside. The 6-bit LI is set to 63 for a long SIF, so for a long MSU it marks the unit type, not the length. So MTP2 frames by delimiter, with bit stuffing as the escape. The slide 14 SIF of 133 octets has LI 63. | ITU-T Q.703 §2.3.2, §2.3.3, §3.2 |
| A TCAP `BEGIN` carries an originating transaction ID (OTID). The first OTID a node receives comes back as the destination transaction ID (DTID). `END` carries only the DTID, and `CONTINUE` carries both. | ITU-T Q.772 §2.2, Q.774 §3.3.3.2 |
| MAP opCodes: mt-ForwardSM 44, sendRoutingInfoForSM 45, mo-ForwardSM 46, reportSM-DeliveryStatus 47, alertServiceCentre 64. | 3GPP TS 29.002 (MAP-ShortMessageServiceOperations) |
| MAP SignalInfo, which carries sm-RP-UI, holds 1 to 200 octets (maxSignalInfoLength). | 3GPP TS 29.002 (MAP-CommonDataTypes) |
| The slide 14 TPDU is 25 octets by the TS 23.040 layout: 1 + 1 + (1 + 1 + 6) + 1 + 1 + 1 + 1 + 11. Its fields are fixed, not BER, and MAP carries it as an opaque OCTET STRING. A BER count gives 47 for the MAP argument, as on the slide. With 140 octets of user data, the SIF reaches about 265 to 267 of 272. | 3GPP TS 23.040 §9.2.2.2, TS 29.002 (SignalInfo), ITU-T X.690, arithmetic |
| When a MAP message does not fit, TS 29.002 sends an empty TC-`BEGIN` first, then the message in a TC-CONTINUE. So "always fits" has exceptions. | 3GPP TS 29.002 Annex C.2.1 |
| TP-UD holds up to 140 octets. TP-UDL counts septets for GSM-7 and octets for 8-bit or UCS-2 data. | 3GPP TS 23.040 §9.2.3.16, §9.2.3.24 |
| UCS-2 covers only U+0000 to U+FFFF. A character above U+FFFF, such as most emoji (U+1F600), takes two 16-bit units as a UTF-16 surrogate pair. One such emoji leaves room for 69 characters in 140 octets. | 3GPP TS 23.038 (UCS2), RFC 2781 §2.1 |
| GSM-7 is not ASCII: `@` is 0x00, and `{ } [ ] ~ \ ^ €` and the vertical bar use the escape 0x1B, so each costs two septets. | 3GPP TS 23.038 |
| A concatenated SMS spends a 6-octet user data header, leaving 153 GSM-7 or 67 UCS-2 characters per part. | 3GPP TS 23.040 §9.2.3.24.1 |
| If delivery fails, the SMSC sends reportSM-DeliveryStatus to the HLR. When the phone returns, the HLR sends alertServiceCentre. | 3GPP TS 23.040, TS 29.002 |
| A phone never speaks TCAP. Phone A learns that the SMSC accepted a text from an RP-ACK over the air, which its switch sends after the TCAP `END`. | 3GPP TS 24.011 (RP-ACK), TS 23.040 (SMS-SUBMIT-REPORT) |
| SIP response codes are "consistent with, and extend" HTTP/1.1. 180 Ringing is SIP only, and SIP adds a 6xx class. | RFC 3261 §21 |
| A stateful proxy never forwards 100 Trying. The UAC makes the ACK for a 2xx end to end, but a proxy on the Record-Route still sees it. | RFC 3261 §21.1.1, §17, §16.6 |
| 5G voice runs on IMS with a 3GPP SIP profile. Media often passes through an SBC or media gateway, not straight between phones. | 3GPP TS 23.228, TS 24.229 |
| SS7 attacks in practice: location tracking, call and SMS interception, fraud. | ENISA, "Signalling Security in Telecom SS7/Diameter/5G", 2018 |
| Common-channel signalling work started around 1975. CCITT defined SS6 in 1977 and SS7 in the 1980 Yellow Book Q.7xx series. So 1975 dates the idea, and 1980 dates the SS7 standard. | ITU-T Q.700, J. P. Ronayne, "The Digital Network", 1986 |
| Blue boxes lost to out-of-band common-channel signalling as a whole: SS6 moved control off the voice path as well as SS7. | ITU-T Q.700, Ronayne, 1986 |
| The 160-character size came from the GSM work of Friedhelm Hillebrand in the mid-1980s: typical postcard and telex texts fit in 160 characters. SMS was designed to ride the signalling paths when no signalling traffic used them. | Hillebrand, Trosby, Holley, Harris, "Short Message Service (SMS): The Creation of Personal Global Text Messaging", Wiley, 2010 |
| Put a function at the ends when only the ends can do it right: the end-to-end argument. | Saltzer, Reed, Clark, ACM TOCS 2(4), 1984 |
| TCP window scaling multiplies the 16-bit window by up to 2^14, about 1 GiB. It scales the window, not the segment size, so "64 KB with window scaling" mixes two ideas. | RFC 7323 §2 |
| CUBIC cuts its window to 0.7 on loss. Reno halves. | RFC 9438 §4.6, RFC 5681 |
| BBR keeps RTprop as a windowed min RTT (tens of seconds) and BtlBw as a windowed max delivery rate (6 to 10 RTTs). B4 WAN: 2 to 25× over CUBIC. | Cardwell et al., ACM Queue 14(5), 2016 |
| Bufferbloat: large buffers let loss-based TCP build long queues, and the queue adds delay before any drop tells the sender to slow down. | Gettys and Nichols, "Bufferbloat: Dark Buffers in the Internet", ACM Queue 9(11), 2011 |
| Google: 2,700× (CUBIC 3.3 Mbps, BBR 9,100 Mbps) on 10 GbE, 100 ms RTT, 1% loss. Queue delay 25× lower on 10 Mbps, 40 ms, a 1000-packet buffer. | Google Cloud blog, "TCP BBR congestion control comes to GCP", 2017-07-21 |
| SYN and FIN occupy sequence space so each can be resent and acked without confusion. | RFC 9293 §3.4 |
| MSL is 2 minutes in the spec, so TIME-WAIT lasts 4 minutes on the active closer. Linux uses 60 s. The passive closer goes CLOSE-WAIT, LAST-ACK, CLOSED, with no TIME-WAIT. | RFC 9293 §3.3.2, §3.4.2, §3.6, Linux `TCP_TIMEWAIT_LEN` |
| A passive closer whose app closes at once can send FIN with the ACK, so a 3-segment close is common in captures. Linux does not ack a FIN at once: it moves to CLOSE_WAIT in delayed-ACK mode, which gives the app time to close. | RFC 9293 §3.6, §3.10.7.4, Linux `net/ipv4/tcp_input.c` `tcp_fin()` |
| `listen(2)`: since Linux 2.2 the backlog sizes the queue of established sockets that wait for `accept()`. `tcp_max_syn_backlog` limits incomplete ones, and with SYN cookies on that limit is ignored. In current Linux source, the SYN-cookie switch fires when half-open requests pass the `listen()` backlog. | `listen(2)`, `tcp(7)`, Linux `tcp_conn_request()`, `inet_csk_reqsk_queue_is_full()` |
| The ISN is M + F(4-tuple, secret key), where M is a 4-microsecond timer. | RFC 6528 §3 |
| Bernstein SYN cookie, September 1996, with Eric Schenk: top 5 bits = t mod 32 (t steps every 64 s), 3 bits = MSS index, 24 bits = secret hash. The server ISN is the client ISN plus this value. | cr.yp.to/syncookies.html, RFC 4987 §3.6 |
| Cookies carry no data from the SYN. A lost final ACK hurts server-speaks-first protocols such as SMTP. Timestamps can hold window scale and SACK bits. | RFC 4987 §3.6 |
| On the repo machine, a restart bind after TIME_WAIT failed even with SO_REUSEADDR, unless the old server socket also set it. | measured, Linux 7.1.8, loopback, 2026-09-13, socket(7) |
| HTTP cookies came first: Lou Montulli, Netscape, 1994, named after the "magic cookie". | Montulli blog, 2013-05-14, RFC 6265 §1 |
| TCP Fast Open needs a cookie from an earlier connection. A returning client sends data in the SYN. | RFC 7413 |
| A full TLS 1.2 handshake costs 2 RTTs. TLS 1.3 costs 1 RTT and allows 0-RTT data on resumption. | RFC 5246, RFC 8446 §2, §2.3 |
| The UDP length covers header plus data, so the minimum is 8. The checksum is optional on IPv4 (zero = none) and mandatory on IPv6. | RFC 768, RFC 8200 §8.1 |
| QUIC orders stream data by stream ID and offset. Packet numbers are never reused, so an ack is never ambiguous. QUIC sends lost frame data again in new packets, never the old packet. | RFC 9000 §2.2, §12.3, §13.3 |
| The first QUIC Initial packet of a client carries the TLS ClientHello in a CRYPTO frame. | RFC 9001 §4, RFC 9000 §17.2.2 |
| Tokens that carry state for the server: QUIC address validation tokens, TLS session tickets. | RFC 9000 §8.1.3, RFC 8446 §2.2 |
| SMTP reply codes: 220 greeting, 250 OK, 354 start mail input, 221 closing, 503 bad sequence. Both ends apply dot-stuffing. | RFC 5321 §4.2, §4.5.2 |
| SMTP AUTH, STARTTLS and submission are separate RFCs. Implicit TLS ports: 465 submission, 993 IMAP, 995 POP3. | RFC 4954, RFC 3207, RFC 6409, RFC 8314 |
| SPF and DMARC publish policy in DNS. DKIM adds a DKIM-Signature header. | RFC 7208, RFC 7489, RFC 6376 |
| A CRLF after each 76 base64 characters adds about 2.6%, so the real cost is about 37%. | RFC 2045 §6.8, arithmetic |
| A boundary can hold "=_", which never appears in quoted-printable. A boundary is 1 to 70 characters and must not appear inside a part. | RFC 2045 §6.7, RFC 2046 §5.1.1 |
| POP deletes only in the UPDATE state after QUIT. A dropped session deletes nothing. STAT skips marked messages. The minimal command set is USER, PASS, QUIT, STAT, LIST, RETR, DELE, NOOP and RSET, and RSET removes every deletion mark. TOP, UIDL and APOP are optional. | RFC 1939 §3, §5, §6, §7, §9 |
| POP3 frames with delimiters only. CRLF ends each line, and a multi-line reply ends with CRLF.CRLF, with byte-stuffing of lines that start with a dot. The sizes in LIST are information, not framing. | RFC 1939 §3 |
| greenmail 2.1.12 keeps the POP deletion mark on the stored message. After a dropped session, a new session gets a STAT count without the marked message. It does not expunge it, and RSET brings it back. RFC 1939 ties the marks to one session. | greenmail source, tag release-2.1.12: `pop3/commands/DeleCommand.java`, `StatCommand.java`, `RsetCommand.java` |
| HTTP/2 frames start with a 9-octet header that holds a 24-bit length. No delimiter ends a frame. A flag on the last frame (END_STREAM) ends the message. | RFC 9113 §4.1, §8.1 |
| Redis RESP bulk strings carry a length: `$5`, CRLF, 5 bytes, CRLF. Simple strings end at CRLF. So RESP uses both rules. | Redis docs, "Redis serialization protocol specification" |
| IMAP4rev2 (2021) replaces RFC 3501. Literals are `{n}` CRLF then n octets. IDLE is in the base. `BODY.PEEK` does not set \Seen. | RFC 9051 §4.3, §6.3.13, §6.4.5 |
| FTP stream mode ends a file by closing the data connection. Block mode uses a byte count. The default data port is 21 − 1 = 20. | RFC 959 §3.4.1, §3.4.2 |
| PORT and the 227 reply write the 32-bit address and the 16-bit port as six decimal fields of 8 bits each, high-order byte first. | RFC 959 §4.1.2, §4.2.2 |
| PASV already exists in RFC 765 (June 1980), long before NAT. The 1971 FTP (RFC 114) predates TCP. EPSV replies 229 with only a port, for IPv6 and NAT. | RFC 765, RFC 114, RFC 2428 |
| Active FTP crosses a NAT only with a helper that rewrites the PORT command. | RFC 3027 |
| pyftpdlib picks a random free port from `--range` for each PASV and replies `227 Entering passive mode (...)`. So the same port can come back. The passive listener waits 30 s, then replies `421 Passive data channel timed out.`. The control channel acts on a command only after CRLF. | pyftpdlib source, `handlers/ftp/dispatchers.py` (PassiveDTP), `handlers/ftp/control.py` |
| GreenMail test ports: SMTP 3025, SMTPS 3465, POP3 3110, POP3S 3995, IMAP 3143, IMAPS 3993. | GreenMail `ServerSetupTest` |

## 7. Open questions

1. **Slides moved between modules.** Slide 13 moved from s02-m03-sms-bytes to s02-m01-layers, because the bytes of the Ethernet onion are the "real thing" rung for layering. Slide 17 moved to a new module, s02-m10-sms-delivery, so s02-m03 keeps one big idea. Slide 26 moved from s02-m04-tcp-lifecycle to s02-m06-udp-quic, because the round-trip tax sets up QUIC and keeps s02-m04 at 25 minutes. Slide 20 and closing idea 3 moved from s02-m02-ss7 to a new module, s02-m11-reliability-address, because s02-m02 held three big ideas. The README module table lists s02-m10 and s02-m11 since 2026-09-14. The teaching order puts it after s02-m06, because it compares with TCP and QUIC. The module IDs stay as listed.
2. **Six or seven syscalls.** Slide 2 says "six syscalls and you have a server, the seventh is where the bugs live". Slide 4 says seven and lists seven names under "THE SIX". Which call is the seventh?
3. **272 or 273.** Slides 15 and 20 say SIF 272. Slide 14 says 273 in its top line and 272 in its bottom line. Slide 36 says 273. Q.703 says 272. 273 is SIO plus SIF. The lessons teach 272.
4. **The TCAP size.** The slide gives 99 octets for TCAP. A BER count gives 97. The other sizes (25, 47, and 129 = 30 + 99) agree with the slide. Low exam weight.
5. **"Always fits in one MSU".** True for the slide example and normal numbers. With the longest addresses the SIF can pass 272, and TS 29.002 Annex C handles that case. Did the instructor mean "by design" or "always"?
6. **Four ISUP messages.** Slide 18 says four messages set up a call. The diagram shows three for setup (IAM, ACM, ANM) and two for release.
7. **Nine hops.** Slide 9 says nine physical hops. The diagram shows eight boxes.
8. **Numbers without conditions.** 2 ms Wi-Fi contention (slide 8), about 20 ms for the LEO hop (slide 9), and about 190 ms Mumbai to Virginia (slide 26) carry no conditions. Is 190 ms an RTT or one way? The lessons treat it as an RTT and say so.
9. **TCP Fast Open at 1 RTT.** Slide 26 counts TCP at 1 RTT "before a single byte of application data can move" and TFO also at 1. By that rule TFO data moves at 0 RTT. The lessons show both counts.
10. **FIN and ACK.** Slide 25 says they cannot share a segment. RFC 9293 allows it, and captures often show three segments. The lessons teach four as the general case.
11. **SIP on slide 19.** "Borrowed wholesale" and "ACK past the proxy" are shortcuts. See section 6 for 180 Ringing, 100 Trying and Record-Route.
12. **The missing blank line.** Slide 33 says a missing blank line turns the subject into body text. That result fits a blank line placed before the headers. A missing separator after the headers gives a result that depends on the parser. Check what the instructor typed in class.
13. **SCCP at L4.** Slide 12 puts SCCP beside TCP at L4. ITU-T puts SCCP in the network layer. The lessons show the slide table and flag the ITU view.
14. **"64 KB with window scaling"** on slide 20 mixes window size and segment size. The lessons say "about 1460 B per segment" and teach window scaling apart.
15. **BBR numbers.** Slide 21 says "up to 2,000×". The Google post says 2,700×. The lessons quote 2,700× with its conditions and flag the slide number.
16. **CUBIC halves.** Slide 21 says Reno and CUBIC halve. CUBIC cuts to 0.7.
17. **FTP in 1971.** Slide 37 calls active mode the 1971 design, and slide 39 ties the decimal port to 1971. The h1..p2 form appears with TCP-era FTP in RFC 765 (1980), and PASV appears in the same RFC.
18. **Session 5 file uses old Session 2 IDs.** Resolved: `session-05.md` now links `s02-m04-tcp-lifecycle` and `s02-m06-udp-quic`.
19. **Candidate threads.** "Control and data want separating" (slides 11, 19, 37, 41) and "reliability has an address" (slides 20, 41) appear as closing ideas. Session 5 QUIC repeats the second one. Add them to the README only when a second session repeats each one.
20. **Two rules or three.** Session 1 slide 39 lists three framing rules. Session 2 says two. s02-m09 reconciles them. Confirm the class wording.
21. **Notes claim.** `notes.md` says the class covered "everything is a file, including sockets" (S02-C11). No slide shows it. Low trust.
22. **Session 1 owns slides 4 and 5.** S02-C05, S02-C08, S02-C09 and S02-C10 stay in the inventory as `detail` rows. They point to S01-C25, S01-C45, S01-C32 and S01-C33. s02-m04 names them only as recall links. Its pretest and checks test Session 2 slides. The restart lab stays, because slide 25 makes the TIME_WAIT claim again (S02-C105).
23. **One word, two queues.** Slide 4 uses "backlog" for the accept queue. Slides 23 and 24 use it for the half-open entries. `listen(2)` separates the two queues, and current Linux ties the SYN-cookie switch to the `listen()` backlog. The lessons teach both queues (section 6).
24. **Slide 36 columns.** The slide puts MTP2 under length, and POP3 and HTTP/2 under both. MTP2 ends a unit at a flag with zero-bit insertion, and its LI stops at 63. POP3 uses only delimiters. HTTP/2 uses a length per frame and a flag per message. The slide lists Redis as "CRLF", but RESP bulk strings carry a length. The lessons show the slide bins and the corrected bins with a badge. Did the instructor mean a looser sense of "both"?
25. **SS7 in 1975.** The slide dates SS7 to 1975. Common-channel signalling work started then, SS6 came in 1977, and SS7 became a CCITT standard in 1980. "Older than TCP/IP" (slide 2) holds if TCP/IP means the 1981 standards (RFC 791, RFC 793). The lessons keep 1975 as the date of the idea (section 6).
26. **Streaming over TCP.** `notes.md` says TCP "has been typically used for streaming". Slide 27 says UDP carries "every real-time streaming protocol". Both can hold: buffered video over HTTP runs on TCP, and real-time media runs on UDP. Check the class wording before a quiz item uses either. Low trust for the notes.
