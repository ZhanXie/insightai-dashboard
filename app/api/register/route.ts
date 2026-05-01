import { withApi } from "@/lib/http/handler";
import { createUser } from "@/lib/auth/user-service";
import { hashPassword } from "@/lib/auth/password";

export async function POST(request: Request) {
  return withApi(async () => {
    const { email, password } = await request.json();

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Hash password before storing
    const passwordHash = await hashPassword(password);

    // Create user using service layer
    await createUser(email, passwordHash);

    return { message: "User created successfully" };
  })(request);
}
