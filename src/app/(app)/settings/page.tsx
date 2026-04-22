"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users/me").then((r) => r.json()).then((d) => {
      setName(d.name ?? "");
      setEmail(d.email ?? "");
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to save");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage your account" />

      <div className="max-w-lg space-y-8">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-sm font-semibold text-zinc-800 mb-5">Profile</h2>
          {loading ? (
            <div className="space-y-3">
              <div className="h-10 bg-zinc-100 rounded-lg animate-pulse" />
              <div className="h-10 bg-zinc-100 rounded-lg animate-pulse" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : saved ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                ) : null}
                {saved ? "Saved!" : saving ? "Saving…" : "Save changes"}
              </Button>
            </form>
          )}
        </div>

        <Separator />

        {/* Billing placeholder */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 opacity-60">
          <h2 className="text-sm font-semibold text-zinc-800 mb-2">Billing</h2>
          <p className="text-sm text-zinc-500">
            You&rsquo;re on the free plan. Upgrade features coming soon.
          </p>
        </div>
      </div>
    </>
  );
}
