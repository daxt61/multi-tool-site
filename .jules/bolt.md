## 2026-06-12 - [Metronome Precise Timing]
**Learning:** For a stable metronome in the browser, the Web Audio API's scheduling mechanism is superior to `setInterval` or `setTimeout` which are subject to main thread congestion. Using `useRef` to store state used within the scheduler avoids redundant interval restarts while ensuring the audio engine has access to the most recent user settings.
**Action:** Use Web Audio API and ref-based state synchronization for time-sensitive audio applications.

## 2026-06-12 - [Accurate File Size in UI]
**Learning:** Calculating string length via `.length` underreports the true byte size for multi-byte UTF-8 characters (like emojis or accented letters). Using `new Blob([text]).size` provides an accurate byte count for file size estimation.
**Action:** Prefer `new Blob([text]).size` over `string.length` for calculating data weight or storage requirements.

## 2026-06-12 - [Robust Hex to RGB Conversion]
**Learning:** Manual hex-to-rgb conversion logic without validation is fragile. Users often input shorthand (3-digit) hex codes or malformed strings. A robust implementation must handle both 3 and 6 digit formats and provide a safe fallback (e.g., white) to prevent UI breakage.
**Action:** Always include validation and shorthand support in custom color conversion utilities.
