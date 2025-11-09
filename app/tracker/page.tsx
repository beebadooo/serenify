"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Plus, Bot, Loader2 } from "lucide-react"
import { useSupabaseClient } from "@/supabase/use-supabase"

export default function TrackerPage() {
  const supabase = useSupabaseClient()

  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<string>("")
  const [sleep, setSleep] = useState<number>(7)
  const [notes, setNotes] = useState("")
  const [saved, setSaved] = useState(false)
  const [aiInsight, setAiInsight] = useState<string>("")
  const [loadingAI, setLoadingAI] = useState(false)

  // 🔹 Save check-in data to Supabase
  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert("Please log in to save your check-in.")
      return
    }

    const { error } = await supabase.from("mood_checkins").insert([
      {
        user_id: user.id,
        date: new Date().toISOString().split("T")[0],
        mood: selectedMood,
        energy,
        sleep,
        notes,
      },
    ])

    if (error) {
      console.error("Error saving check-in:", error)
      alert("Error saving your check-in. Please try again.")
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      setSelectedMood(null)
      setNotes("")
      setEnergy("")
      setSleep(7)
    }
  }

  // 🔹 Fetch AI insights from backend
  const handleAIAnalyze = async () => {
    setLoadingAI(true)
    setAiInsight("")

    try {
      const res = await fetch("/api/ai-insight", { method: "POST" })
      const data = await res.json()
      setAiInsight(data.suggestion)
    } catch (err) {
      console.error("AI error:", err)
      setAiInsight("⚠️ Could not generate insights. Try again later.")
    } finally {
      setLoadingAI(false)
    }
  }

  const moodEmojis = ["😢", "😟", "😐", "🙂", "😊", "😄", "🤩", "😍", "🥳", "🚀"]

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Daily Check-in</h1>
          <p className="text-foreground/70">How are you feeling today?</p>
        </div>

        {/* Mood Tracker */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Mood Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Emoji Mood Scale */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Select your mood:</p>
              <div className="grid grid-cols-10 gap-2">
                {moodEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMood(index + 1)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-2xl transition-all ${
                      selectedMood === index + 1 ? "bg-accent scale-110 shadow-lg" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {selectedMood && <p className="text-sm text-accent font-medium">You selected: {selectedMood}/10</p>}
            </div>

            {/* Numerical Scale */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Or rate numerically:</p>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setSelectedMood(i + 1)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedMood === i + 1
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Level */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Energy Level:</label>
              <div className="flex gap-3">
                {["Low", "Medium", "High"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setEnergy(level)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      energy === level
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep Quality */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Last Night's Sleep: {sleep} hrs</label>
              <input
                type="range"
                min="0"
                max="12"
                value={sleep}
                onChange={(e) => setSleep(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-foreground/60">Rate your sleep quality (0-12 hours)</p>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-4 bg-input border border-border rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                placeholder="What's on your mind? Any thoughts or feelings to share?"
                rows={4}
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className={`w-full transition-all ${
                saved ? "bg-green-600 hover:bg-green-600" : "bg-accent hover:bg-accent/90"
              } text-accent-foreground`}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Check-in Saved!
                </>
              ) : (
                "Save Check-in"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Add */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Quick Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Had a good workout", "Felt anxious today", "Great meditation session", "Slept poorly"].map(
              (note, index) => (
                <button
                  key={index}
                  onClick={() => setNotes(note)}
                  className="w-full p-3 text-left bg-muted hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors text-foreground flex items-center justify-between"
                >
                  <span>{note}</span>
                  <Plus className="w-4 h-4" />
                </button>
              )
            )}
          </CardContent>
        </Card>

        {/* AI Wellness Insights */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="w-5 h-5 text-accent" /> Weekly AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground/70">
              Get personalized suggestions based on your mood, sleep, and energy logs.
            </p>
            <Button
              onClick={handleAIAnalyze}
              disabled={loadingAI}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {loadingAI ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" /> Analyzing your week...
                </>
              ) : (
                "Generate Wellness Insights"
              )}
            </Button>

            {aiInsight && (
              <div className="p-4 bg-muted rounded-lg text-foreground text-sm whitespace-pre-wrap">
                {aiInsight}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
