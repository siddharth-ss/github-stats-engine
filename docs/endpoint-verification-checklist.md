# Endpoint Verification Checklist

Use this checklist when changing a route under `api/`, card rendering, response caching, or request-parameter handling.

## Before testing

- [ ] Identify the route being changed and the parameters it reads.
- [ ] Use a known test username and, for repository cards, a repository that exists.
- [ ] Keep access tokens and other credentials out of test URLs, screenshots, logs, and commits.

## Request checks

- [ ] Exercise the successful path for the affected endpoint, for example the main stats route with `username` set.
- [ ] Check any relevant optional parameters both when omitted and when explicitly supplied.
- [ ] For the main stats endpoint, check the missing-username response when no `DEFAULT_USERNAME` is configured.
- [ ] If locale handling changed, test a supported locale and an unsupported locale.
- [ ] For failures, confirm the response is a useful error card rather than an unhandled exception or an empty response.

## Response and caching checks

- [ ] Confirm the response contains SVG card markup and the expected SVG content type.
- [ ] Review cache headers after success and after an error; make sure a change has not accidentally made errors persist for an excessive period.
- [ ] If request parameters affect fetched data or appearance, verify that different relevant parameter values do not incorrectly reuse the same cached result.
- [ ] Compare the card visually with the expected result and check that labels, numbers, and theme-related options remain legible.

## Regression checks

Run the checks relevant to your change before opening a pull request:

```bash
npm test
npm run lint
npm run format:check
```

- [ ] Review the test output and fix failures caused by the change.
- [ ] If behavior depends on deployment configuration, verify it on the deployed instance as well as locally.
- [ ] Include the tested route, important parameters (with secrets removed), and results in the pull request description.

This checklist is a smoke-test guide, not a substitute for adding automated regression tests when the behavior can be tested reliably.
