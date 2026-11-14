import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../assets/regex-worker.js", import.meta.url), "utf8");

function evaluate(data) {
  const messages = [];
  const self = { postMessage: (message) => messages.push(message) };
  runInNewContext(source, { self });
  self.onmessage({ data });
  assert.equal(messages.length, 1, "worker should post exactly one result");
  return messages[0];
}

test("regex worker returns bounded matches", () => {
  const result = evaluate({ pattern: "\\bcat\\b", flags: "gi", text: "cat dog CAT" });
  assert.equal(result.ok, true);
  assert.deepEqual(
    JSON.parse(JSON.stringify(result.matches.map((match) => [match.value, match.index]))),
    [["cat", 0], ["CAT", 8]],
  );
});

test("regex worker advances after zero-width matches", () => {
  const result = evaluate({ pattern: "", flags: "g", text: "ab" });
  assert.equal(result.ok, true);
  assert.deepEqual(JSON.parse(JSON.stringify(result.matches.map((match) => match.index))), [0, 1, 2]);
});

test("regex worker rejects invalid patterns", () => {
  const result = evaluate({ pattern: "(", flags: "g", text: "abc" });
  assert.equal(result.ok, false);
  assert.match(result.error, /regular expression/i);
});

test("regex worker rejects invalid flags", () => {
  const result = evaluate({ pattern: "a", flags: "gg", text: "aaa" });
  assert.equal(result.ok, false);
});

test("regex worker enforces input bounds", () => {
  const result = evaluate({ pattern: "a", flags: "g", text: "x".repeat(2001) });
  assert.equal(result.ok, false);
  assert.match(result.error, /limit/i);
});
