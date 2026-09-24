import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  abstractPath,
  buildProjectCriteria,
  decideCloseoutRichness,
  decidePersonalScrub,
  decideProjectChoice,
  describeEnablement,
  jevStatus,
  judgeCloseoutRichness,
  judgePersonalScrub,
  judgeProject,
  OTHER_OPTION,
  parseActiveProjectNames,
  parseHelperEnv,
  redactResult,
  shortlistProjects,
} from "./jev-gates.mjs";

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}

describe("enablement", () => {
  it("stays off with no key and no opt-in", () => {
    assert.deepEqual(describeEnablement({ env: {}, flags: {}, keyPresent: false }), {
      enabled: false,
      reason: "default-off",
    });
  });

  it("turns on when a key is present", () => {
    assert.equal(describeEnablement({ env: {}, flags: {}, keyPresent: true }).reason, "key-present");
  });

  it("turns on with BRAIN_JEV=1 even without a key", () => {
    const result = describeEnablement({ env: { BRAIN_JEV: "1" }, flags: {}, keyPresent: false });
    assert.equal(result.enabled, true);
    assert.equal(result.reason, "explicit-opt-in-missing-key");
  });

  it("forced off wins over a present key", () => {
    assert.deepEqual(
      describeEnablement({ env: { BRAIN_JEV: "0" }, flags: {}, keyPresent: true }),
      { enabled: false, reason: "forced-off" },
    );
    assert.equal(describeEnablement({ env: {}, flags: { noJev: true }, keyPresent: true }).enabled, false);
  });
});

describe("path and candidate helpers", () => {
  it("sends only the basename, never a home path", () => {
    assert.equal(abstractPath("/home/someone/src/shop-app"), "shop-app");
    assert.equal(abstractPath("C:\\\\Users\\\\someone\\\\repo"), "repo");
    assert.equal(abstractPath(""), "");
  });

  it("parses Active Projects memory lines, including several on one line", () => {
    const names = parseActiveProjectNames(`
- Memory: \`AI Brain/Projects/Shop-App/\`
- Memory: \`AI Brain/Projects/Home-LLM-Hub/\`, \`AI Brain/Projects/edge-llm-worker/\`
- Memory: \`AI Brain/Projects/_Template Project/\`
`);
    assert.deepEqual(names, ["Shop-App", "Home-LLM-Hub", "edge-llm-worker"]);
  });

  it("shortlists exact and slug matches ahead of the rest", () => {
    const shortlist = shortlistProjects(
      ["Unrelated", "Shop-App", "shop app extra", "Other"],
      { guess: "shop-app", cwd: "/tmp/Shop-App" },
    );
    assert.equal(shortlist[0], "Shop-App");
    assert.ok(shortlist.includes("Unrelated"));
  });

  it("maps slugged Choice options back to folder names", () => {
    const { criteria, optionMap } = buildProjectCriteria(["Shop App", "shop-app"]);
    assert.ok(criteria.other);
    assert.equal(optionMap["shop-app"], "Shop App");
    assert.equal(optionMap["shop-app-2"], "shop-app");
  });
});

describe("local decision helpers", () => {
  it("keeps the caller guess on other, low confidence, or unknown option", () => {
    const optionMap = { shop: "Shop-App" };
    assert.equal(decideProjectChoice({ guess: "cwd-guess", choice: OTHER_OPTION, confidence: 0.99, optionMap }).project, "cwd-guess");
    assert.equal(decideProjectChoice({ guess: "cwd-guess", choice: "shop", confidence: 0.2, optionMap }).reason, "low-confidence");
    assert.equal(decideProjectChoice({ guess: "cwd-guess", choice: "nope", confidence: 0.9, optionMap }).reason, "unknown-option");
    assert.deepEqual(decideProjectChoice({ guess: "cwd-guess", choice: "shop", confidence: 0.8, optionMap }), {
      used: true,
      project: "Shop-App",
      reason: "accepted",
      choice: "shop",
      confidence: 0.8,
    });
  });

  it("thresholds closeout richness without blocking", () => {
    assert.equal(decideCloseoutRichness({ noul: 0.72 }).rich, true);
    assert.equal(decideCloseoutRichness({ noul: 0.2 }).rich, false);
    assert.equal(decideCloseoutRichness({}).rich, null);
  });

  it("fails safe on personal-scrub unsure or missing noul", () => {
    assert.equal(decidePersonalScrub({ noul: 0.8 }).publish, false);
    assert.equal(decidePersonalScrub({ noul: 0.1 }).publish, true);
    assert.equal(decidePersonalScrub({ noul: 0.42 }).reason, "unsure");
    assert.equal(decidePersonalScrub({}).publish, false);
  });

  it("never keeps a key field on serialized results", () => {
    assert.equal(redactResult({ project: "Shop-App", key: "secret", apiKey: "secret" }).key, undefined);
  });
});

describe("helper env parsing", () => {
  it("reads export and quoted forms without interpolating", () => {
    assert.equal(parseHelperEnv("export TYPESAFE_API_KEY=dummy-test-key\n"), "dummy-test-key");
    assert.equal(parseHelperEnv('TYPESAFE_API_KEY="dummy-test-key"\n'), "dummy-test-key");
    assert.equal(parseHelperEnv("# comment\nFOO=1\n"), "");
  });
});

describe("judgeProject fail-open", () => {
  it("does not fetch when --no-jev even if a key is present", async () => {
    let called = 0;
    const result = await judgeProject({
      guess: "cwd-guess",
      candidates: ["Shop-App"],
      env: { TYPESAFE_API_KEY: "dummy-test-key" },
      flags: { noJev: true },
      fetchImpl: async () => {
        called += 1;
        return jsonResponse({});
      },
    });
    assert.equal(called, 0);
    assert.equal(result.used, false);
    assert.equal(result.project, "cwd-guess");
    assert.equal(result.reason, "forced-off");
  });

  it("no-ops when no key is present", async () => {
    let called = 0;
    const result = await judgeProject({
      guess: "cwd-guess",
      cwd: "/tmp/cwd-guess",
      candidates: ["Shop-App"],
      env: {},
      helperFile: "/tmp/missing-typesafe-helper.env",
      fetchImpl: async () => {
        called += 1;
        return jsonResponse({});
      },
    });
    assert.equal(called, 0);
    assert.equal(result.used, false);
    assert.equal(result.project, "cwd-guess");
    assert.equal(result.reason, "default-off");
    assert.equal(JSON.stringify(result).includes("dummy"), false);
  });

  it("keeps the guess when the API errors", async () => {
    const result = await judgeProject({
      guess: "cwd-guess",
      candidates: ["Shop-App"],
      env: { TYPESAFE_API_KEY: "dummy-test-key" },
      fetchImpl: async () => jsonResponse({ error: true }, 500),
    });
    assert.equal(result.used, false);
    assert.equal(result.project, "cwd-guess");
    assert.equal(result.reason, "api-error");
  });

  it("accepts a confident mapped Choice", async () => {
    const result = await judgeProject({
      guess: "cwd-guess",
      cwd: "/tmp/shop-app",
      candidates: ["Shop-App", "Other"],
      env: { TYPESAFE_API_KEY: "dummy-test-key" },
      fetchImpl: async (_url, init) => {
        const body = JSON.parse(init.body);
        assert.equal(body.state.cwd_basename, "shop-app");
        assert.equal(Object.hasOwn(body.state, "transcript"), false);
        assert.ok(body.questions.project.criteria.other);
        return jsonResponse({
          answers: { project: { type: "choice", choice: "shop-app", confidence: 0.88 } },
        });
      },
    });
    assert.equal(result.used, true);
    assert.equal(result.project, "Shop-App");
  });
});

describe("judgeCloseoutRichness fail-open", () => {
  it("never blocks when Jev is off", async () => {
    const result = await judgeCloseoutRichness({
      hadCommits: true,
      env: {},
      helperFile: "/tmp/missing-typesafe-helper.env",
      fetchImpl: async () => {
        throw new Error("should not fetch");
      },
    });
    assert.equal(result.rich, null);
    assert.equal(result.used, false);
  });

  it("returns advisory richness from a Noul", async () => {
    const result = await judgeCloseoutRichness({
      hadCommits: true,
      hadFileEdits: true,
      durationBand: "medium",
      env: { TYPESAFE_API_KEY: "dummy-test-key" },
      fetchImpl: async (_url, init) => {
        const body = JSON.parse(init.body);
        assert.equal(body.state.had_commits, true);
        assert.equal(body.questions.rich_closeout.type, "noul");
        return jsonResponse({ answers: { rich_closeout: { type: "noul", noul: 0.91 } } });
      },
    });
    assert.equal(result.rich, true);
    assert.equal(result.noul, 0.91);
  });
});

describe("judgePersonalScrub fail-safe", () => {
  it("skips (does not change publish) when disabled", async () => {
    const result = await judgePersonalScrub({
      pathKind: "system-script",
      env: {},
      helperFile: "/tmp/missing-typesafe-helper.env",
    });
    assert.equal(result.skip, true);
    assert.equal(result.publish, null);
  });

  it("refuses publish when opted in without a key", async () => {
    const result = await judgePersonalScrub({
      env: { BRAIN_JEV: "1" },
      helperFile: "/tmp/missing-typesafe-helper.env",
    });
    assert.equal(result.publish, false);
    assert.equal(result.reason, "missing-key");
  });

  it("refuses publish on API error", async () => {
    const result = await judgePersonalScrub({
      env: { TYPESAFE_API_KEY: "dummy-test-key" },
      fetchImpl: async () => jsonResponse({}, 401),
    });
    assert.equal(result.publish, false);
    assert.equal(result.reason, "api-error");
    assert.match(result.error, /typesafe-http-401/);
  });
});

describe("jevStatus", () => {
  it("reports key presence without returning the secret", async () => {
    const status = await jevStatus({
      env: { TYPESAFE_API_KEY: "dummy-test-key", BRAIN_JEV: "0" },
    });
    assert.equal(status.key_present, true);
    assert.equal(status.enabled, false);
    assert.equal(JSON.stringify(status).includes("dummy-test-key"), false);
  });
});
