import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-b5055851/health", (c) => {
  return c.json({ status: "ok" });
});

// Signup endpoint - Create new user with role (ADMIN ONLY)
app.post("/make-server-b5055851/signup", async (c) => {
  try {
    // Verify admin authorization
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "Authorization header required" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify the requester is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log(`Auth error: ${authError?.message || "User not found"}`);
      return c.json({ error: "Unauthorized - Please login as admin" }, 401);
    }

    // Check if user has admin role
    const userRole = user.user_metadata?.role;
    if (userRole !== "admin") {
      console.log(`Permission denied - User role: ${userRole}`);
      return c.json({ error: "Forbidden - Only administrators can create users" }, 403);
    }

    const body = await c.req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name || !role) {
      return c.json({ error: "Email, password, name, and role are required" }, 400);
    }

    if (!["admin", "cashier"].includes(role)) {
      return c.json({ error: "Role must be either 'admin' or 'cashier'" }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: { 
        name: name,
        role: role 
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    console.log(`Admin ${user.email} created new user: ${email} with role: ${role}`);

    return c.json({ 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name,
        role: data.user.user_metadata.role
      }
    });

  } catch (error) {
    console.log(`Signup exception: ${error}`);
    return c.json({ error: "Internal server error during signup" }, 500);
  }
});

Deno.serve(app.fetch);