// Realtime per FRONTEND_MVP_HANDOFF §4: a Socket.io connection with the JWT in
// the handshake, plus the MANDATORY 5s polling fallback when the socket is down.
// Both paths feed one `onRefresh` signal so the dashboard has a single code path
// for "server state changed → refetch board/queue".

import { SOCKET_URL } from './config';
import { getAccessToken } from './tokens';

export type RealtimeEvent = { type: string; payload: unknown };

type StartOpts = {
  /** Fire to tell the UI to refetch board + queue from the server. */
  onRefresh: () => void;
  /** Optional fine-grained event hook (e.g. to show a toast). */
  onEvent?: (e: RealtimeEvent) => void;
  /** Optional connection status hook for a "live / reconnecting" badge. */
  onStatus?: (connected: boolean) => void;
};

// Server→client events we care about on the vendor board (contract §5).
const VENDOR_EVENTS = [
  'OrderCreated',
  'OrderPaid',
  'OrderReady',
  'OrderCollected',
  'OrderCompleted',
  'OrderCancelled',
  'QueueUpdated',
  'MenuItemAvailabilityChanged',
];

const POLL_MS = 5000;

let socket: { disconnect: () => void; connected?: boolean } | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let stopped = true;

function startPolling(onRefresh: () => void) {
  if (pollTimer) return;
  pollTimer = setInterval(onRefresh, POLL_MS);
}
function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

/** Connect realtime for a vendor. Safe to call after login; idempotent-ish. */
export async function start(opts: StartOpts): Promise<void> {
  stop();
  stopped = false;

  // Poll immediately as a baseline; the socket will suspend polling once live.
  opts.onRefresh();
  startPolling(opts.onRefresh);

  let io: typeof import('socket.io-client').io;
  try {
    ({ io } = await import('socket.io-client'));
  } catch {
    // No socket lib bundled — polling alone keeps the board correct.
    opts.onStatus?.(false);
    return;
  }
  if (stopped) return;

  const s = io(SOCKET_URL, {
    auth: { token: getAccessToken() },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling'],
  });
  socket = s as unknown as typeof socket;

  s.on('connect', () => {
    opts.onStatus?.(true);
    stopPolling(); // live updates supersede polling
    opts.onRefresh(); // resync any gap during connect
  });
  s.on('disconnect', () => {
    opts.onStatus?.(false);
    startPolling(opts.onRefresh); // degrade gracefully
  });
  s.on('connect_error', () => {
    opts.onStatus?.(false);
    startPolling(opts.onRefresh);
  });

  for (const evt of VENDOR_EVENTS) {
    s.on(evt, (payload: unknown) => {
      opts.onEvent?.({ type: evt, payload });
      opts.onRefresh();
    });
  }
}

export function stop(): void {
  stopped = true;
  stopPolling();
  if (socket) {
    try {
      socket.disconnect();
    } catch {
      /* ignore */
    }
  }
  socket = null;
}
