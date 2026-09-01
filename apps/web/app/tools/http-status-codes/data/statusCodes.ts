export type StatusClass = '1xx' | '2xx' | '3xx' | '4xx' | '5xx';

export interface StatusCodeEntry {
  code: number;
  phrase: string;
  description: string;
  class: StatusClass;
}

/**
 * Descriptions here are written from scratch for this tool, not copied from
 * the RFCs or from MDN/Wikipedia-style references — both to avoid
 * reproducing someone else's copyrighted text, and because a quick-lookup
 * tool benefits from plainer, more direct language than spec prose. Covers
 * the IANA-registered codes developers actually run into; deliberately
 * excludes deprecated entries (305, 306), a handful of very obscure WebDAV
 * corner cases, and non-standard/joke codes like 418 (see the FAQ).
 */
export const STATUS_CODES: StatusCodeEntry[] = [
  // 1xx — Informational
  {
    code: 100,
    phrase: 'Continue',
    description:
      "The server has looked at the request headers and is fine with the client sending the body. Mostly shows up when a client sends 'Expect: 100-continue' before uploading a large payload, so it doesn't waste bandwidth on a body the server was going to reject anyway.",
    class: '1xx',
  },
  {
    code: 101,
    phrase: 'Switching Protocols',
    description:
      "The server is agreeing to a protocol change the client asked for via the Upgrade header — the canonical example being a WebSocket handshake, where an HTTP connection gets upgraded to a persistent WebSocket connection.",
    class: '1xx',
  },
  {
    code: 102,
    phrase: 'Processing',
    description:
      "A WebDAV-specific interim response telling the client 'still working on it, don't time out' for requests that take a while to process, like a large COPY or MOVE operation.",
    class: '1xx',
  },
  {
    code: 103,
    phrase: 'Early Hints',
    description:
      "Sent before the final response so the browser can start fetching resources (like CSS or fonts referenced via a preload Link header) while the server is still assembling the actual page — a page-load performance optimization.",
    class: '1xx',
  },

  // 2xx — Success
  {
    code: 200,
    phrase: 'OK',
    description: 'The request succeeded and the response body contains whatever was asked for — the default, generic success code for GET, and often used for successful PUT/POST responses too when there is a body to return.',
    class: '2xx',
  },
  {
    code: 201,
    phrase: 'Created',
    description:
      "A new resource was successfully created as a result of the request, typically after a POST. Conventionally paired with a Location header pointing at the new resource's URL.",
    class: '2xx',
  },
  {
    code: 202,
    phrase: 'Accepted',
    description:
      'The request has been accepted for processing, but that processing isn\'t done yet — common for async or queued work, where the server hands back "got it, working on it" without waiting for the job to finish.',
    class: '2xx',
  },
  {
    code: 203,
    phrase: 'Non-Authoritative Information',
    description:
      "Like 200, but signals that the response was modified in transit by something other than the origin server — a proxy or CDN that altered headers or metadata along the way. Rarely used deliberately in modern APIs.",
    class: '2xx',
  },
  {
    code: 204,
    phrase: 'No Content',
    description:
      "The request succeeded but there's nothing to send back in the body — a common response for a successful DELETE, or a PUT/PATCH where the client already has the data and doesn't need it echoed back.",
    class: '2xx',
  },
  {
    code: 205,
    phrase: 'Reset Content',
    description:
      "Tells the client to clear the form or view that generated the request — for example, after a successful submission, reset the input fields to blank rather than leaving the submitted values in place.",
    class: '2xx',
  },
  {
    code: 206,
    phrase: 'Partial Content',
    description:
      "The server is returning only part of the resource, in response to a Range header request. This is how video/audio streaming and resumable downloads work — the client asks for byte ranges instead of the whole file.",
    class: '2xx',
  },
  {
    code: 207,
    phrase: 'Multi-Status',
    description:
      "A WebDAV response that bundles the results of several independent operations into one XML body, since a single request (like a batch COPY) can partially succeed and partially fail across multiple resources.",
    class: '2xx',
  },
  {
    code: 208,
    phrase: 'Already Reported',
    description:
      "Used inside a WebDAV multi-status response to avoid listing the same resource's status more than once when it was already reported earlier in that same response, typically for nested collections referenced from multiple bindings.",
    class: '2xx',
  },
  {
    code: 226,
    phrase: 'IM Used',
    description:
      'Indicates the response is the result of applying one or more "instance manipulations" (like delta encoding) requested by the client — a rarely-used mechanism for sending just the differences from a resource the client already has, instead of the whole thing again.',
    class: '2xx',
  },

  // 3xx — Redirection
  {
    code: 300,
    phrase: 'Multiple Choices',
    description:
      "There are several possible representations of the requested resource (different formats or languages, say) and the server wants the client to pick one — in practice, almost never actually used by real APIs or sites.",
    class: '3xx',
  },
  {
    code: 301,
    phrase: 'Moved Permanently',
    description:
      "This resource now lives at a different URL for good. Browsers and crawlers cache this aggressively and will remember the new location, which is exactly why it's the right code for permanent URL changes (like a domain migration) but the wrong one for anything temporary.",
    class: '3xx',
  },
  {
    code: 302,
    phrase: 'Found',
    description:
      "A temporary redirect — go look over there for now, but keep using this URL next time. Historically ambiguous about whether the follow-up request should keep the original HTTP method, which is exactly why 303 and 307 exist to be explicit about that.",
    class: '3xx',
  },
  {
    code: 303,
    phrase: 'See Other',
    description:
      "Redirect the client to a different URL using a GET request, regardless of what method the original request used. The standard pattern after a form POST: process the data, then 303 the browser to a confirmation page so a refresh doesn't resubmit the form.",
    class: '3xx',
  },
  {
    code: 304,
    phrase: 'Not Modified',
    description:
      "Tells the client its cached copy is still good — sent in response to a conditional request (If-None-Match / If-Modified-Since) when the resource hasn't changed, so the client can keep using what it already has instead of downloading it again.",
    class: '3xx',
  },
  {
    code: 307,
    phrase: 'Temporary Redirect',
    description:
      "Like 302, but explicit that the client must repeat the request with the same HTTP method and body at the new URL. The redirect to use when a POST needs to be temporarily redirected without silently turning into a GET.",
    class: '3xx',
  },
  {
    code: 308,
    phrase: 'Permanent Redirect',
    description:
      "The permanent-redirect counterpart to 307 — same method-preserving guarantee as 307, but tells the client (and caches) this new location is the permanent one, the way 301 does for GET-style redirects.",
    class: '3xx',
  },

  // 4xx — Client Error
  {
    code: 400,
    phrase: 'Bad Request',
    description:
      "The server couldn't make sense of the request — malformed JSON, a missing required field, an invalid parameter value. The generic catch-all for 'the client sent something the server can't process,' when no more specific 4xx code fits better.",
    class: '4xx',
  },
  {
    code: 401,
    phrase: 'Unauthorized',
    description:
      "You need to authenticate before this request can go through — either no credentials were sent, or the ones that were sent are invalid or expired. Despite the name, it's really about identity, not permission: it means 'who are you?', not 'you can't do that.'",
    class: '4xx',
  },
  {
    code: 402,
    phrase: 'Payment Required',
    description:
      "Reserved for future use since the earliest HTTP specs and never standardized for a specific purpose. A few APIs have repurposed it informally for billing/quota-exceeded scenarios, but there's no official meaning to rely on.",
    class: '4xx',
  },
  {
    code: 403,
    phrase: 'Forbidden',
    description:
      "The server knows exactly who you are, and the answer is still no. Unlike 401, authenticating again won't help — this is a permissions problem, not an identity problem. The classic 401-vs-403 mixup is exactly this distinction.",
    class: '4xx',
  },
  {
    code: 404,
    phrase: 'Not Found',
    description:
      "There's nothing at this URL — either it never existed, was removed, or the path is simply wrong. The most recognizable status code on the web, and the right one whenever a resource genuinely doesn't exist at the requested location.",
    class: '4xx',
  },
  {
    code: 405,
    phrase: 'Method Not Allowed',
    description:
      "The resource exists, but doesn't support the HTTP method that was used to reach it — like sending a DELETE to an endpoint that only accepts GET and POST. The response should list which methods are actually allowed via an Allow header.",
    class: '4xx',
  },
  {
    code: 406,
    phrase: 'Not Acceptable',
    description:
      "The server can't produce a response matching what the client said it would accept, based on the Accept/Accept-Language/Accept-Encoding headers the client sent — for instance, requesting a format the server simply doesn't support.",
    class: '4xx',
  },
  {
    code: 407,
    phrase: 'Proxy Authentication Required',
    description:
      "The same idea as 401, but the authentication challenge is coming from an intermediate proxy the request has to pass through, not from the destination server itself.",
    class: '4xx',
  },
  {
    code: 408,
    phrase: 'Request Timeout',
    description:
      "The server was waiting for the client to finish sending the request and gave up. More common with slow or flaky client connections than with typical API usage.",
    class: '4xx',
  },
  {
    code: 409,
    phrase: 'Conflict',
    description:
      "The request can't be completed because it clashes with the resource's current state — a classic case being two clients trying to update the same record at once, or trying to create something that already exists with a uniqueness constraint.",
    class: '4xx',
  },
  {
    code: 410,
    phrase: 'Gone',
    description:
      "Like 404, but more definitive: this resource used to exist here and has been intentionally and permanently removed, not just missing. Useful when you specifically want to signal 'this isn't coming back' rather than 'not found right now.'",
    class: '4xx',
  },
  {
    code: 411,
    phrase: 'Length Required',
    description:
      "The server requires a Content-Length header on this request and the client didn't send one — usually only comes up with certain streaming or chunked-upload clients that omit it.",
    class: '4xx',
  },
  {
    code: 412,
    phrase: 'Precondition Failed',
    description:
      "A conditional request (using headers like If-Match or If-Unmodified-Since) failed its condition — commonly used to prevent a client from overwriting a resource that's changed since it last read it.",
    class: '4xx',
  },
  {
    code: 413,
    phrase: 'Payload Too Large',
    description:
      "The request body is bigger than the server is willing to process — hitting an upload size limit is the usual trigger, whether that limit is set by the application or by infrastructure in front of it (a load balancer, a CDN).",
    class: '4xx',
  },
  {
    code: 414,
    phrase: 'URI Too Long',
    description:
      "The request URL itself exceeded a length limit the server enforces — often caused by cramming too much data into query string parameters instead of using a request body.",
    class: '4xx',
  },
  {
    code: 415,
    phrase: 'Unsupported Media Type',
    description:
      "The request body's format, as declared in the Content-Type header, isn't one the server knows how to handle — for example, sending XML to an endpoint that only accepts application/json.",
    class: '4xx',
  },
  {
    code: 416,
    phrase: 'Range Not Satisfiable',
    description:
      "The client asked for a specific byte range of a resource (via a Range header) that's outside the actual bounds of the file — for instance, requesting bytes past the end of the file being downloaded.",
    class: '4xx',
  },
  {
    code: 417,
    phrase: 'Expectation Failed',
    description:
      "The server can't meet the expectation the client set in an Expect header (most often Expect: 100-continue) — rare in practice, since most clients and servers handle that header without issue.",
    class: '4xx',
  },
  {
    code: 421,
    phrase: 'Misdirected Request',
    description:
      "The request landed on a server that isn't actually able to produce a response for the combination of scheme and host it was sent to — this shows up with HTTP/2 connection reuse across different origins sharing the same server.",
    class: '4xx',
  },
  {
    code: 422,
    phrase: 'Unprocessable Content',
    description:
      "The request was well-formed (valid JSON, correct syntax) but semantically invalid — a field has the wrong type, a value fails validation, a required relationship doesn't exist. The go-to code for 'your request parsed fine, but the data itself is invalid.'",
    class: '4xx',
  },
  {
    code: 423,
    phrase: 'Locked',
    description:
      "The resource being accessed is locked, typically as part of a WebDAV locking mechanism used to prevent two clients from editing the same document at the same time.",
    class: '4xx',
  },
  {
    code: 424,
    phrase: 'Failed Dependency',
    description:
      "This request couldn't be completed because it depended on another request (earlier in the same batch) that failed — a WebDAV concept for operations chained together, where one failure cascades to the ones depending on it.",
    class: '4xx',
  },
  {
    code: 425,
    phrase: 'Too Early',
    description:
      "The server is declining to process a request sent using TLS 1.3's early-data feature, because early data is replayable by an attacker and this particular request isn't safe to risk replaying (a non-idempotent write, for example).",
    class: '4xx',
  },
  {
    code: 426,
    phrase: 'Upgrade Required',
    description:
      "The server refuses to handle the request over the current protocol and wants the client to switch to a different one, specified in an Upgrade header — for example, requiring a plain HTTP connection to upgrade to TLS.",
    class: '4xx',
  },
  {
    code: 428,
    phrase: 'Precondition Required',
    description:
      "The server wants the request to include a conditional header (like If-Match) but the client didn't send one — a way for servers to force clients to use optimistic concurrency control instead of blindly overwriting data.",
    class: '4xx',
  },
  {
    code: 429,
    phrase: 'Too Many Requests',
    description:
      "Rate limit hit — slow down. The response often includes a Retry-After header telling the client how long to wait before trying again. One of the most commonly encountered codes when working against any API with usage limits.",
    class: '4xx',
  },
  {
    code: 431,
    phrase: 'Request Header Fields Too Large',
    description:
      "The combined size of the request's headers is too large for the server to process — can happen with an oversized cookie, an excessively long auth token, or a client that's accumulated too many headers over redirects.",
    class: '4xx',
  },
  {
    code: 451,
    phrase: 'Unavailable For Legal Reasons',
    description:
      "The content can't be served because of a legal restriction — a government-mandated takedown or censorship order, for instance. The number is a deliberate nod to Ray Bradbury's Fahrenheit 451.",
    class: '4xx',
  },

  // 5xx — Server Error
  {
    code: 500,
    phrase: 'Internal Server Error',
    description:
      "Something broke on the server while handling the request, and there's no more specific status that describes what went wrong. The generic 'the server itself failed' code — usually points to an unhandled exception or a bug, not something the client did wrong.",
    class: '5xx',
  },
  {
    code: 501,
    phrase: 'Not Implemented',
    description:
      "The server doesn't support the functionality needed to fulfill this request — often because the HTTP method or feature simply isn't implemented at all, as opposed to 405 where the method is understood but just not allowed on this particular resource.",
    class: '5xx',
  },
  {
    code: 502,
    phrase: 'Bad Gateway',
    description:
      "A server acting as a gateway or proxy got an invalid response from the upstream server it was talking to. Extremely common in deployed apps sitting behind a load balancer or reverse proxy when the actual application server is down or crashed.",
    class: '5xx',
  },
  {
    code: 503,
    phrase: 'Service Unavailable',
    description:
      "The server is temporarily unable to handle the request — overloaded, down for maintenance, or intentionally shedding load. Often paired with a Retry-After header, and generally means 'try again shortly,' unlike 500 which suggests something is actually broken.",
    class: '5xx',
  },
  {
    code: 504,
    phrase: 'Gateway Timeout',
    description:
      "A gateway or proxy gave up waiting for a response from the upstream server it needed to talk to. Distinct from 502 in that the upstream didn't send back garbage — it just never responded in time.",
    class: '5xx',
  },
  {
    code: 505,
    phrase: 'HTTP Version Not Supported',
    description:
      "The server doesn't support the HTTP version used in the request line — essentially never seen in practice, since virtually all servers support the handful of HTTP versions actually in use.",
    class: '5xx',
  },
  {
    code: 506,
    phrase: 'Variant Also Negotiates',
    description:
      "A server misconfiguration involving content negotiation, where a resource is set up to negotiate with itself in a way that creates a circular reference. Extremely rare and almost always indicates a server config bug.",
    class: '5xx',
  },
  {
    code: 507,
    phrase: 'Insufficient Storage',
    description:
      "The server can't complete the request because it's run out of storage space to hold what the request needs it to store — a WebDAV-originated code, but conceptually applicable anywhere a server-side storage operation fails for lack of space.",
    class: '5xx',
  },
  {
    code: 508,
    phrase: 'Loop Detected',
    description:
      "The server detected an infinite loop while processing a request that involves following internal references — a WebDAV concept, guarding against operations that would otherwise recurse forever.",
    class: '5xx',
  },
  {
    code: 510,
    phrase: 'Not Extended',
    description:
      "The server requires further extensions to the request before it can be fulfilled, per a client-specified policy — a rarely-implemented mechanism that essentially never appears in modern APIs.",
    class: '5xx',
  },
  {
    code: 511,
    phrase: 'Network Authentication Required',
    description:
      "The client needs to authenticate to get network access at all — the code behind captive portals, like the login page a coffee shop's Wi-Fi shows you before letting any other traffic through.",
    class: '5xx',
  },
];
