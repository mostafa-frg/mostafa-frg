self.onmessage = ({ data }) => {
  try {
    const pattern = String(data?.pattern ?? "");
    const flags = String(data?.flags ?? "g");
    const value = String(data?.text ?? "");

    if (pattern.length > 120 || value.length > 2000) {
      throw new Error("Pattern limit is 120 characters and test text limit is 2,000 characters.");
    }
    if (!/^[dgimsuvy]*$/.test(flags) || new Set(flags).size !== flags.length) {
      throw new Error("Use unique supported regular-expression flags only.");
    }
    if (flags.includes("u") && flags.includes("v")) {
      throw new Error("The u and v flags cannot be used together.");
    }

    const safeFlags = flags.includes("g") ? flags : flags + "g";
    const regex = new RegExp(pattern, safeFlags);
    const matches = [];

    while (matches.length < 100) {
      const match = regex.exec(value);
      if (!match) break;
      matches.push({ value: match[0], index: match.index });
      if (match[0].length === 0) regex.lastIndex += 1;
    }

    self.postMessage({ ok: true, matches });
  } catch (error) {
    self.postMessage({ ok: false, error: error?.message || "Invalid regular expression." });
  }
};
