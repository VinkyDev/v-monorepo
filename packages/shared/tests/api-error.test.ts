import { describe, expect, expectTypeOf, test } from "vite-plus/test";

import type { FieldError, JsonValue } from "#/index.ts";
import {
  ApiError,
  codeForStatus,
  errorCatalog,
  isApiError,
  protocolCodes,
} from "#/index.ts";

const jsonResponse = (status: number, body: JsonValue): Response =>
  Response.json(body, { headers: { "X-Request-Id": "req-1" }, status });

describe(codeForStatus, () => {
  // A duplicate status would silently strand whichever protocol code lost it, and
  // would let a business code (401 `session_expired`) hijack the lookup.
  test.for(protocolCodes)("%s round-trips through its status", (code) => {
    expect(codeForStatus(errorCatalog[code].status)).toBe(code);
  });

  test("unknown statuses fall back by class", () => {
    expect(codeForStatus(502)).toBe("internal");
    expect(codeForStatus(418)).toBe("bad_request");
  });
});

describe(ApiError, () => {
  test("takes status and message from the catalog", () => {
    const error = new ApiError("not_found");

    expect(error.status).toBe(404);
    expect(error.message).toBe(errorCatalog.not_found.message);
    expect(error.toBody()).toStrictEqual({
      code: "not_found",
      message: errorCatalog.not_found.message,
    });
  });

  test("narrows data by code", () => {
    const error = new ApiError("email_taken", { data: { email: "a@b.c" } });

    expectTypeOf(error.data).toEqualTypeOf<{ email: string } | undefined>();
    expect(error.toBody().data).toStrictEqual({ email: "a@b.c" });
  });

  test("round-trips through the wire body", () => {
    const fields: FieldError[] = [{ message: "名称不能为空", path: "name" }];
    const restored = ApiError.fromBody(
      new ApiError("invalid_params", { data: { fields } }).toBody(),
      "internal"
    );

    expect(restored.code).toBe("invalid_params");
    expect(restored.status).toBe(422);
    expect(restored.data).toStrictEqual({ fields });
  });

  test("drops data that does not match the schema its code declares", () => {
    const restored = ApiError.fromBody(
      { code: "email_taken", data: { email: 42 }, message: "该邮箱已被注册" },
      "internal"
    );

    expect(restored.data).toBeUndefined();
  });

  test("fromResponse restores the code and reads the trace id from the header", async () => {
    const error = await ApiError.fromResponse(
      jsonResponse(409, { code: "email_taken", message: "该邮箱已被注册" })
    );

    expect(error.code).toBe("email_taken");
    expect(error.traceId).toBe("req-1");
  });

  test("a body that is not ours falls back to the status", async () => {
    const error = await ApiError.fromResponse(
      new Response("<html>gateway</html>", {
        headers: { "content-type": "text/html" },
        status: 504,
      })
    );

    expect(error.code).toBe("timeout");
    expect(error.message).toBe(errorCatalog.timeout.message);
  });

  test("an unknown code degrades to the fallback but keeps the message", async () => {
    const overHttp = await ApiError.fromResponse(
      jsonResponse(429, { code: "quota_exhausted", message: "配额用尽" })
    );
    // No status on the IPC transport, so its fallback is a literal.
    const overIpc = ApiError.fromBody(
      { code: "quota_exhausted", message: "配额用尽" },
      "internal"
    );

    expect(overHttp.code).toBe("rate_limited");
    expect(overHttp.status).toBe(429);
    expect(overIpc.code).toBe("internal");
    expect(overIpc.message).toBe("配额用尽");
  });
});

describe(isApiError, () => {
  test("holds for a copy from another bundle", () => {
    const copy = {
      [Symbol.for("@v-monorepo/shared/ApiError")]: true,
      code: "not_found",
    };

    expect(isApiError(copy)).toBeTruthy();
    expect(isApiError(new Error("boom"))).toBeFalsy();
    expect(isApiError(null)).toBeFalsy();
  });

  test("narrows to a single code when one is given", () => {
    // `Error` is what React Query and error boundaries hand us.
    const error: Error = new ApiError("email_taken", {
      data: { email: "a@b.c" },
    });

    if (!isApiError(error, "email_taken")) {
      throw new Error("expected email_taken");
    }
    expectTypeOf(error.data).toEqualTypeOf<{ email: string } | undefined>();
    expect(error.data?.email).toBe("a@b.c");
  });
});
