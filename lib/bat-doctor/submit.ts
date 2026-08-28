import type {
  BatDoctorErrors,
  BatDoctorFormState,
  MediaItem,
  MediaRef,
  RepairRequestReceipt,
} from "@/types/bat-doctor";

/* ── Client side of submission ────────────────────────────────────────────────────
 *
 * One function the form calls, one shape it gets back. The reason this is a module and
 * not thirty lines inside the workflow component is that the failure cases are the
 * interesting part, and they should not be interleaved with JSX:
 *
 *   · the server rejected specific fields    → route the customer back to that step
 *   · the server rejected the whole thing    → one sentence, stay put
 *   · the network never answered             → do NOT say "submitted", offer WhatsApp
 *
 * The last one is why `ok: false` carries `fieldErrors` as well as a message. A form
 * that reports success on a failed fetch is worse than one that fails loudly: the
 * customer walks away believing a technician has their photographs. */

/** Files are described, not uploaded — there is no object storage in this project
 *  (`persistRepairRequest` is the documented seam). Sending metadata means the request
 *  record knows what the customer attached and how big it was, and the photographs
 *  themselves travel over WhatsApp with the reference. When storage arrives, this
 *  function gains an upload and returns refs with a `url`; nothing else changes. */
function toRef(item: MediaItem): MediaRef {
  return {
    name: item.name,
    size: item.size,
    mime: item.mime,
    kind: item.kind,
  };
}

export type SubmitResult =
  | { ok: true; receipt: RepairRequestReceipt }
  | { ok: false; message: string; fieldErrors?: BatDoctorErrors };

export async function submitRepairRequest(
  state: BatDoctorFormState,
  images: MediaItem[],
  video: MediaItem | null,
): Promise<SubmitResult> {
  let response: Response;

  try {
    response = await fetch("/api/bat-doctor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...state,
        images: images.map(toRef),
        video: video ? toRef(video) : null,
      }),
    });
  } catch {
    return {
      ok: false,
      message:
        "We couldn't reach our workshop just now — that's on us, not your connection necessarily. Try again, or send it straight to us on WhatsApp.",
    };
  }

  // Read the body defensively: a proxy or a platform error page can return HTML with a
  // JSON content type, and `response.json()` throwing here would surface as an
  // unhandled rejection rather than as a message the customer can read.
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const payload = (body ?? {}) as { message?: unknown; fieldErrors?: unknown };
    return {
      ok: false,
      message:
        typeof payload.message === "string"
          ? payload.message
          : "Something went wrong filing that request. Please try again.",
      fieldErrors:
        typeof payload.fieldErrors === "object" && payload.fieldErrors !== null
          ? (payload.fieldErrors as BatDoctorErrors)
          : undefined,
    };
  }

  const receipt = body as Partial<RepairRequestReceipt> | null;

  // A 201 with no reference is not a success. The confirmation screen is built around
  // the reference — it is what the customer quotes on WhatsApp and what the photographs
  // get matched against — so an empty one has to fail rather than render "BD-undefined".
  if (!receipt || typeof receipt.requestId !== "string" || !receipt.requestId) {
    return {
      ok: false,
      message:
        "Your request went through but we didn't get a reference back. Please message us on WhatsApp so we can find it.",
    };
  }

  return {
    ok: true,
    receipt: {
      requestId: receipt.requestId,
      status: receipt.status ?? "submitted",
      createdAt: receipt.createdAt ?? new Date().toISOString(),
    },
  };
}
