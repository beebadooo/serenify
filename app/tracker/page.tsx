"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
<<<<<<< HEAD
import { Check, Plus, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
=======
import { Check, Plus, Bot, Loader2 } from "lucide-react"
import { useSupabaseClient } from "@/supabase/use-supabase"
>>>>>>> 5b23553ab3b704fcab925792d0dad006029db3e4

export default function TrackerPage() {
  const supabase = useSupabaseClient()

  const [selectedMood, setSelectedMood] = useState<number | null>(null)
<<<<<<< HEAD
  const [energyLevel, setEnergyLevel] = useState<number | null>(null)
  const [sleepHours, setSleepHours] = useState<number>(8)
  const [notes, setNotes] = useState("")
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentCheckins, setRecentCheckins] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  const fetchRecentCheckins = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('User not authenticated')
        return
      }

      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (error) throw error
      setRecentCheckins(data)
    } catch (err: any) {
      console.error('Error fetching recent check-ins:', err.message)
=======
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
>>>>>>> 5b23553ab3b704fcab925792d0dad006029db3e4
    }
  }

  useEffect(() => {
    fetchRecentCheckins()
  }, [])

  const handleSave = async () => {
    if (!selectedMood) {
      setError("Please select a mood")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error("Please login to save your mood")
      }

      const { error } = await supabase.from('moods').insert({
        user_id: user.id,
        mood_score: selectedMood,
        energy_level: energyLevel || 3, // Default to medium if not selected
        sleep_hours: sleepHours,
        notes: notes
      })

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      
      // Reset form
      setSelectedMood(null)
      setEnergyLevel(null)
      setSleepHours(8)
      setNotes("")
      
      // Refresh recent check-ins
      fetchRecentCheckins()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const moodEmojis = ["😢", "😟", "😐", "🙂", "😊"]  // Reduced to 5 levels to match database schema

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
              <div className="grid grid-cols-5 gap-4">
                {moodEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMood(index + 1)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-3xl transition-all ${
                      selectedMood === index + 1 ? "bg-accent scale-110 shadow-lg" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {selectedMood && <p className="text-sm text-accent font-medium">You selected: {selectedMood}/5</p>}
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
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
                {[
                  { level: 1, label: "Very Low" },
                  { level: 2, label: "Low" },
                  { level: 3, label: "Medium" },
                  { level: 4, label: "High" },
                  { level: 5, label: "Very High" }
                ].map(({ level, label }) => (
                  <button
                    key={level}
<<<<<<< HEAD
                    onClick={() => setEnergyLevel(level)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      energyLevel === level
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted hover:bg-accent hover:text-accent-foreground text-foreground"
=======
                    onClick={() => setEnergy(level)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      energy === level
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted hover:bg-muted/80 text-foreground"
>>>>>>> 5b23553ab3b704fcab925792d0dad006029db3e4
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep Hours */}
            <div className="space-y-3">
<<<<<<< HEAD
              <label className="text-sm font-medium text-foreground">Last Night's Sleep:</label>
=======
              <label className="text-sm font-medium text-foreground">Last Night's Sleep: {sleep} hrs</label>
>>>>>>> 5b23553ab3b704fcab925792d0dad006029db3e4
              <input
                type="range"
                min="0"
                max="12"
<<<<<<< HEAD
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-foreground/60">{sleepHours} hours of sleep</p>
=======
                value={sleep}
                onChange={(e) => setSleep(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-foreground/60">Rate your sleep quality (0-12 hours)</p>
>>>>>>> 5b23553ab3b704fcab925792d0dad006029db3e4
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
              disabled={loading || saved}
              className={`w-full transition-all ${
                saved ? "bg-green-600 hover:bg-green-600" : "bg-accent hover:bg-accent/90"
              } text-accent-foreground`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
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
<<<<<<< HEAD
          <CardContent className="space-y-3">
            {recentCheckins.map((checkin) => {
              const date = new Date(checkin.created_at)
              const today = new Date()
              const yesterday = new Date(today)
              yesterday.setDate(yesterday.getDate() - 1)
              
              let dateLabel
              if (date.toDateString() === today.toDateString()) {
                dateLabel = "Today"
              } else if (date.toDateString() === yesterday.toDateString()) {
                dateLabel = "Yesterday"
              } else {
                dateLabel = date.toLocaleDateString()
              }

              const energyLabels = ["Very Low", "Low", "Medium", "High", "Very High"]
              
              return (
                <div key={checkin.id} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-foreground font-medium">{dateLabel}</p>
                    <p className="text-xs text-foreground/60 space-x-2">
                      <span>Mood: {checkin.mood_score}/5</span>
                      <span>•</span>
                      <span>Energy: {energyLabels[checkin.energy_level - 1]}</span>
                      <span>•</span>
                      <span>Sleep: {checkin.sleep_hours}hrs</span>
                    </p>
                    {checkin.notes && (
                      <p className="text-xs text-foreground/60 mt-1 italic">{checkin.notes}</p>
                    )}
                  </div>
                  <span className="text-2xl">{moodEmojis[checkin.mood_score - 1]}</span>
                </div>
              )
            })}
            {recentCheckins.length === 0 && (
              <p className="text-sm text-foreground/60 text-center py-4">No recent check-ins</p>
=======
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
>>>>>>> 5b23553ab3b704fcab925792d0dad006029db3e4
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
