import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";

export async function signup(req: Request, res: Response) {
  const { email, password } = req.body;

  // Validation: both fields must exist
  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required",
    });
  }

  // Validation: password length
  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters",
    });
  }

  try {
    // step 3 : Check if email already exist
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    // Step 4: Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Step 5: Insert the new user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email, created_at`,
      [email, passwordHash],
    );

    // Step 6: Generate JWT (auto-login after signup)
    const token = jwt.sign(
      { userId: result.rows[0].id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    // Step 7: Return the new user + token (logs them in instantly)
    return res.status(201).json({
      message: "User created successfully",
      token,
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Signup error", err);
    return res.status(500).json({
      error: "Failed to create user",
    });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  //Validation
  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required",
    });
  }

  try {
    // Step 2: Look up user by email
    const result = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [email],
    );

    // Generic error if user doesn't exist (prevent enumeration)
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // step 3: Compare password with stores hash
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Step 4: Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    // step 5: Return token + USER INFO (No password HASH!)
    return res.json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({
      error: "Login failed",
    });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const result = await pool.query(
      "SELECT id, email, username, created_at FROM users WHERE id = $1",
      [req.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
}
