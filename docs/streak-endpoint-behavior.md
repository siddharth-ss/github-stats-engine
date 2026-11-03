# Streak endpoint behavior

This note describes the behavior implemented by `api/streak.js` and
`src/fetchers/streak-fetcher.js`.

## Request and configuration

The endpoint is requested as:

```text
/api/streak?username=YOUR_GITHUB_USERNAME
```

- The `username` query parameter is required.
- The handler uses the first available non-empty `PAT_*` environment variable
  in its token rotation, or falls back to `GITHUB_TOKEN` when no `PAT_*`
  variables are set.
- A missing username or missing token produces an SVG error card rather than
  a normal streak result.

## How the streak is calculated

The fetcher reads the user's contribution years, then requests the contribution
calendar for those years in one aliased GraphQL query. It records dates whose
`contributionCount` is greater than zero.

The calculation uses UTC calendar dates:

- **Current streak:** starts from today (UTC) when there is a contribution
  today; otherwise it can continue from yesterday (UTC). It then walks
  backward through consecutive dates with contributions.
- **Longest streak:** the longest sequence of consecutive UTC dates with at
  least one contribution.
- **Total contributions:** the sum of the contribution counts returned for
  all contribution years.

This means a contribution near midnight in a local time zone can appear under
a different calendar date in UTC. Also, a current streak can remain active
when the latest contribution was yesterday UTC; it becomes zero when neither
today nor yesterday UTC has a contribution.

## Caching behavior

The endpoint has multiple cache layers:

- Fetched streak data is held in the in-process micro-cache under a key based
  on the GitHub username.
- Rendered SVGs are cached using the username and normalized visual options.
- Successful responses set `Cache-Control: max-age=3600, s-maxage=3600`.
  The one-hour CDN cache is fixed; `cache_seconds` is not used by this route.
- Error responses use the configured error-cache duration and
  `stale-while-revalidate` policy.

Consequently, the generated card can temporarily lag behind the contribution
calendar on the GitHub profile. Check the profile calendar separately when
confirming whether GitHub recorded a contribution.

## Quick verification

Set `BASE_URL` to your deployed service URL and `USERNAME` to a valid
GitHub username. Then request the card and save its response headers:

```bash
curl -sS -D streak-headers.txt -o streak.svg \
  "${BASE_URL}/api/streak?username=${USERNAME}"
```

Check that the response is SVG and inspect the cache header:

```bash
head -n 5 streak.svg
grep -i '^cache-control:' streak-headers.txt
```

For a successful response, the cache header should advertise a 3600-second
max-age and shared max-age. Do not put access tokens in the request URL or
commit them to the repository.

## Useful test cases

| Case | Expected behavior |
| --- | --- |
| Omit `username` | SVG error card stating that the username parameter is missing. |
| Configure no `PAT_*` and no `GITHUB_TOKEN` | SVG error card stating that the GitHub token is not configured. |
| Use a valid username and token | SVG streak card with current streak, longest streak, totals, and date ranges. |
| Latest contribution is yesterday UTC | The consecutive streak can still be shown as current. |
| No contribution today or yesterday UTC | Current streak is zero, even when an older longest streak exists. |

This is an implementation guide, not a substitute for automated tests of
streak calculation and endpoint responses.
