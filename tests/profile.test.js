import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import profile from "../api/profile.js";

const mock = new MockAdapter(axios);

const responseFor = (query) => ({
  req: { query },
  res: {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  },
});

afterEach(() => mock.reset());

describe("profile API", () => {
  it("returns the dynamic profile fields for the requested username", async () => {
    mock.onPost("https://api.github.com/graphql").replyOnce(200, {
      data: {
        user: {
          login: "siddharth-ss",
          avatarUrl: "https://avatars.githubusercontent.com/u/1",
          followers: { totalCount: 10 },
          following: { totalCount: 1 },
        },
      },
    });
    const { req, res } = responseFor({ username: "siddharth-ss" });

    await profile(req, res);

    expect(res.json).toHaveBeenCalledWith({
      login: "siddharth-ss",
      avatarUrl: "https://avatars.githubusercontent.com/u/1",
      followers: 10,
      following: 1,
    });
    expect(mock.history.post[0].data).toContain("siddharth-ss");
  });

  it("returns a safe not-found response", async () => {
    mock.onPost("https://api.github.com/graphql").replyOnce(200, {
      errors: [{ type: "NOT_FOUND" }],
    });
    const { req, res } = responseFor({ username: "missing-profile" });

    await profile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "GitHub profile not found",
    });
  });

  it("preserves the missing username behavior", async () => {
    const previousDefault = process.env.DEFAULT_USERNAME;
    delete process.env.DEFAULT_USERNAME;
    const { req, res } = responseFor({});

    await profile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing `username` parameter",
    });
    if (previousDefault === undefined) delete process.env.DEFAULT_USERNAME;
    else process.env.DEFAULT_USERNAME = previousDefault;
  });
});
