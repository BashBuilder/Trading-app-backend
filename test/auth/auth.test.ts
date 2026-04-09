import { it, describe, expect } from "vitest";
import requests from "supertest";
import app from "../../src";

describe("Test the regiester functionality", async () => {
  it("should register a user successfully", async () => {
    // Arrange
    const endpoint = "/api/auth/register";
    const userPayload = {
      firstName: "Test",
      lastName: "User",
      email: "test@me.com",
      password: "password",
    };
    // Act
    const response = await requests(app).post(endpoint).send(userPayload);
    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message", "User registered");
    expect(response.body.user).toBeDefined();
  });
});
