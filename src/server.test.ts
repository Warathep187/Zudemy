const request = require("supertest");
import server from "./server";
import { checkIsUserInCache } from "./services/caching-actions";

describe("API", () => {
    it("POST /auth/login --> 400 Email or password is incorrect", () => {
        return request(server)
            .post("/api/auth/login")
            .send({
                email: "email@example.com",
                password: "123456789",
            })
            .expect(400);
    });

    it("PUT /user/profile/update", () => {
        return request(server)
            .put("/api/user/profile/update")
            .send({
                username: "John Deeper",
            })
            .set(
                "Authorization",
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MjRkODQ4MDllNjQ5ZGMxNTZkMWI1NmQiLCJpYXQiOjE2NDkzMjg5NDMsImV4cCI6MTY0OTc2MDk0M30.38HNPK3cLBmCL7hePJGEVo1AhPooQKnfh_DQkisgsGM"
            )
            .expect(204);
    });

    it("GET /course/id --> 200 success", () => {
        return request(server).get("/api/course/624dac91d4eee8e0f17c97f1").expect(200);
    });

    it("GET /course/id --> 404 Not found", () => {
        return request(server).get("/api/course/some_id").expect(404);
    });

    it("GET /course/:id/reviews --> 200 success", () => {
        return request(server)
            .get("/api/course/624dac91d4eee8e0f17c97f1/reviews")
            .then((response: Response) => {
                expect(200);
                expect(response.body).toEqual(expect.arrayContaining([]));
            });
    });
});

describe("Caching", () => {
    it("Check User In Cache --> false", async () => {
        const isExisting = await checkIsUserInCache("123456");
        expect(isExisting).toEqual(false);
    });
});
