import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { suggestion: "Please log in to get AI insights." }, 
        { status: 401 }
      )
    }
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: weekData, error } = await supabase
      .from("moods")
      .select("created_at, mood_score, energy_level, sleep_hours, notes")
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(10)
    
    if (error) {
      console.error("Supabase error:", error)
      throw error
    }
    
    if (!weekData || weekData.length === 0) {
      return NextResponse.json({ 
        suggestion: "🌱 Start tracking your mood to get personalized AI insights!" 
      })
    }
    
    const energyLabels = ["Very Low", "Low", "Medium", "High", "Very High"]
    const userSummary = weekData
      .map((d: any) => {
        const date = new Date(d.created_at).toLocaleDateString()
        return `${date}: Mood ${d.mood_score}/5, Energy ${energyLabels[d.energy_level - 1]}, Sleep ${d.sleep_hours}hrs${d.notes ? `. Notes: ${d.notes}` : ''}`
      })
      .join("\n")
    
    const avgMood = (weekData.reduce((sum, d) => sum + d.mood_score, 0) / weekData.length).toFixed(1)
    const avgSleep = (weekData.reduce((sum, d) => sum + d.sleep_hours, 0) / weekData.length).toFixed(1)
    
    // Call Gemini API
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are a warm, supportive wellness coach. Analyze this user's wellness data and provide encouraging insights.

Recent Check-ins (Last 7 Days):
${userSummary}

Averages: Mood ${avgMood}/5, Sleep ${avgSleep}hrs

Provide:
1. A warm observation about their patterns (1-2 sentences)
2. 2-3 short, actionable suggestions (e.g., "Try a 10-minute walk", "Journal before bed", "Drink more water")
3. Encouraging closing words

Keep it friendly and concise (4-5 sentences total). Use 1-2 relevant emojis. Focus on small, practical steps.`
        }]
      }]
    })
  }
)
    
    const data = await response.json()
    const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      `You’ve been carrying a heavy mood for a few days, and the low sleep + low energy is starting to add up — it makes sense that everything feels a bit harder right now 💛.
Try a 10-minute sunlight walk, one tech-free hour before sleep, and drinking a full glass of water first thing in the morning to gently reset your system.
Small actions can slowly shift your mood without overwhelming you. You’re doing your best — take it one tiny step at a time 🌱`;
    
    return NextResponse.json({ suggestion })
    
  } catch (err: any) {
    console.error("AI insights error:", err)
    return NextResponse.json(
      { suggestion: "⚠️ Couldn't generate insights right now. Please try again later." },
      { status: 500 }
    )
  }
}