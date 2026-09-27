import { microCache } from "../src/common/microCache.js";
import { request } from "../src/common/utils.js";
import { retryer } from "../src/common/retryer.js";

const PROFILE_QUERY = `
  query profile($login: String!) {
    user(login: $login) {
      login
      avatarUrl
      followers { totalCount }
      following { totalCount }
    }
  }
`;

const fetchProfile = async (username) => {
  const response = await retryer(
    (variables, token) =>
      request(
        { query: PROFILE_QUERY, variables },
        { Authorization: `bearer ${token}` },
      ),
    { login: username },
  );

  const error = response.data?.errors?.[0];
  if (error) {
    if (error.type === "NOT_FOUND") {
      throw new Error("GitHub profile not found");
    }
    throw new Error("Could not fetch GitHub profile");
  }

  const user = response.data?.data?.user;
  if (!user) throw new Error("GitHub profile not found");

  return {
    login: user.login,
    avatarUrl: user.avatarUrl,
    followers: user.followers.totalCount,
    following: user.following.totalCount,
  };
};

export default async (req, res) => {
  const username = req.query?.username || process.env.DEFAULT_USERNAME;
  res.setHeader("Content-Type", "application/json");

  if (!username) {
    return res.status(400).json({ error: "Missing `username` parameter" });
  }

  try {
    const profile = await microCache(`profile:${username}`, () =>
      fetchProfile(username),
    );
    res.setHeader("Cache-Control", "max-age=300, s-maxage=300");
    return res.json(profile);
  } catch (error) {
    const message =
      error.message === "GitHub profile not found"
        ? error.message
        : "Could not fetch GitHub profile";
    return res
      .status(error.message === "GitHub profile not found" ? 404 : 502)
      .json({
        error: message,
      });
  }
};

export { fetchProfile };
