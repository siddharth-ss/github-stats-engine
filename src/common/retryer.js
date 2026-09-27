import { CustomError, logger } from "./utils.js";

// Count the number of GitHub API tokens available.
const PATs = Object.keys(process.env).filter((key) =>
  /PAT_\d*$/.exec(key),
).length;

const RETRIES = process.env.NODE_ENV === "test" ? 7 : PATs;

/**
 * @typedef {import("axios").AxiosResponse} AxiosResponse
 * @typedef {(variables: object, token: string) => Promise<AxiosResponse>} FetcherFunction
 */

/**
 * Try to execute the fetcher function until it succeeds or the max number of retries is reached.
 *
 * @param {FetcherFunction} fetcher The fetcher function.
 * @param {object} variables Object with arguments to pass to the fetcher function.
 * @param {number} retries How many times to retry.
 * @returns {Promise<AxiosResponse>}
 */
const retryer = async (fetcher, variables, retries = 0) => {
  if (!RETRIES) {
    throw new CustomError(
      "No GitHub API tokens found",
      CustomError.NO_TOKENS,
    );
  }

  if (retries > RETRIES) {
    throw new CustomError(
      "Downtime due to GitHub API rate limiting",
      CustomError.MAX_RETRY,
    );
  }

  try {
    const response = await fetcher(
      variables,
      process.env[`PAT_${retries + 1}`],
      retries,
    );

    const isRateExceeded =
      response?.data?.errors?.[0]?.type === "RATE_LIMITED";

    if (isRateExceeded) {
      logger.log(`PAT_${retries + 1} Failed`);
      return retryer(fetcher, variables, retries + 1);
    }

    return response;
  } catch (err) {
    const response = err?.response;
    const responseData = response?.data;

    const isBadCredential =
      responseData?.message === "Bad credentials";

    const isAccountSuspended =
      responseData?.message ===
      "Sorry. Your account was suspended.";

    if (isBadCredential || isAccountSuspended) {
      logger.log(`PAT_${retries + 1} Failed`);
      return retryer(fetcher, variables, retries + 1);
    }

    // Preserve the original network/API error instead of causing
    // a secondary "reading 'data'" exception.
    if (!response) {
      logger.error(err);
      throw err;
    }

    return response;
  }
};

export { retryer, RETRIES };
export default retryer;