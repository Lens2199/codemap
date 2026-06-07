import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); // clear any old error
    setIsLoading(true); // disable button, show loading

    try {
      const response = await fetch("http://localhost:3000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend responded with 400 / 409 / 500
        setError(data.error || "Something went wrong");
        return;
      }

      // Success — store the token and redirect
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Signup network error:", err);
      // Network failure — backend unreachable
      setError("Could not connect to server. Is the backend running?");
    } finally {
      setIsLoading(false); // always re-enable the button
    }
  }
  return (
    <div className="min-h-screen bg-paper">
      {/* Header — same as Home */}
      <header className="px-6 py-5">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <Compass className="text-forest" size={28} />
          <span className="font-serif text-2xl font-medium text-ink">
            CodeMap
          </span>
        </Link>
      </header>

      {/* Signup form section */}
      <main className="px-6 md:px-12 lg:px-20 pt-12 pb-32">
        <div className="max-w-md mx-auto">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <h1 className="font-serif text-4xl font-medium text-ink mb-2 tracking-tight">
            Create your account
          </h1>
          <p className="text-ink-light mb-8">
            Start understanding any codebase in seconds.
          </p>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-md border border-stone/30 bg-white text-ink focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 rounded-md border border-stone/30 bg-white text-ink focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-forest hover:bg-forest-hover text-white font-medium px-7 py-3.5 rounded-md transition"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="text-center text-ink-light mt-6 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-forest hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
