export class RequestBodyError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 413 | 415,
  ) {
    super(message);
    this.name = "RequestBodyError";
  }
}

export async function readLimitedTextBody(
  request: Request,
  options: { maxBytes: number; contentTypes: string[] },
): Promise<string> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (!contentType || !options.contentTypes.includes(contentType)) {
    throw new RequestBodyError("Tipo de contenido no permitido.", 415);
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > options.maxBytes) {
    throw new RequestBodyError("La petición es demasiado grande.", 413);
  }
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > options.maxBytes) {
    throw new RequestBodyError("La petición es demasiado grande.", 413);
  }
  return body;
}

export async function readLimitedJsonBody(
  request: Request,
  maxBytes = 64 * 1024,
): Promise<unknown> {
  const body = await readLimitedTextBody(request, {
    maxBytes,
    contentTypes: ["application/json"],
  });
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new RequestBodyError("El cuerpo JSON no es válido.", 400);
  }
}

export function requestBodyErrorResponse(error: unknown): Response | null {
  if (!(error instanceof RequestBodyError)) return null;
  return Response.json({ error: error.message }, { status: error.status });
}
